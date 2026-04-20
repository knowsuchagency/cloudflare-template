#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["httpx>=0.27"]
# ///
"""
Idempotent Cloudflare provisioning for a Hyperdrive-over-Tunnel deployment:

  1. Create a cfd_tunnel (config_src=cloudflare)
  2. Set ingress: TCP -> ${DB_SERVICE_NAME}:${DB_PORT}, catch-all -> http_status:404
  3. Create DNS CNAME ${TUNNEL_HOSTNAME} -> <tunnel>.cfargotunnel.com (proxied)
  4. Create an Access (self-hosted) app for the hostname, service-token only
  5. Create / reuse an Access service token, attach via Access policy
  6. Print tunnel_token, access client_id/secret, and the Hyperdrive inputs

Environment:
  CLOUDFLARE_EMAIL            account email (for Global API Key auth)
  CLOUDFLARE_GLOBAL_TOKEN     Global API Key  (or set CLOUDFLARE_API_TOKEN for a
                              scoped token — the script auto-detects which)
  CLOUDFLARE_ACCOUNT_ID       target account id
  CLOUDFLARE_ZONE_ID          zone id that owns TUNNEL_HOSTNAME
  TUNNEL_HOSTNAME             e.g. db.example.com  (must be inside that zone)
  TUNNEL_NAME                 default: <hostname-first-label>
  DB_SERVICE_NAME             default: postgres
                              compose-local DNS name cloudflared resolves.
                              Usually `postgres` when cloudflared is in the
                              same compose as the DB.
  DB_PORT                     default: 5432

The script is safe to re-run. Access service tokens are NOT rotated on re-run
(existing id/secret are preserved; the plaintext secret is only printed on
first creation — stash it in your secret manager).
"""
from __future__ import annotations

import json
import os
import sys
import secrets
import base64
from typing import Any

import httpx

ACCOUNT_ID = os.environ["CLOUDFLARE_ACCOUNT_ID"]
ZONE_ID = os.environ["CLOUDFLARE_ZONE_ID"]
HOSTNAME = os.environ["TUNNEL_HOSTNAME"]

_label = HOSTNAME.split(".")[0]
TUNNEL_NAME = os.environ.get("TUNNEL_NAME", _label)
ACCESS_APP_NAME = os.environ.get("ACCESS_APP_NAME", f"{_label}-access")
SERVICE_TOKEN_NAME = os.environ.get("SERVICE_TOKEN_NAME", f"{_label}-hyperdrive")
DB_HOST = os.environ.get("DB_SERVICE_NAME", "postgres")
DB_PORT = int(os.environ.get("DB_PORT", "5432"))

# Auth — Global API Key (preferred if CLOUDFLARE_GLOBAL_TOKEN is set) or a
# scoped API Token (CLOUDFLARE_API_TOKEN).
if "CLOUDFLARE_GLOBAL_TOKEN" in os.environ:
    headers = {
        "X-Auth-Email": os.environ["CLOUDFLARE_EMAIL"],
        "X-Auth-Key": os.environ["CLOUDFLARE_GLOBAL_TOKEN"],
    }
elif "CLOUDFLARE_API_TOKEN" in os.environ:
    headers = {"Authorization": f"Bearer {os.environ['CLOUDFLARE_API_TOKEN']}"}
else:
    sys.exit("Set CLOUDFLARE_GLOBAL_TOKEN or CLOUDFLARE_API_TOKEN")

client = httpx.Client(
    base_url="https://api.cloudflare.com/client/v4",
    headers=headers,
    timeout=30.0,
)


def ok(r: httpx.Response) -> Any:
    data = r.json()
    if not data.get("success"):
        print(f"✗ CF API error {r.status_code}: {json.dumps(data, indent=2)}", file=sys.stderr)
        sys.exit(1)
    return data["result"]


def ensure_tunnel() -> dict[str, str]:
    r = client.get(f"/accounts/{ACCOUNT_ID}/cfd_tunnel", params={"name": TUNNEL_NAME, "is_deleted": "false"})
    existing = ok(r)
    if existing:
        tid = existing[0]["id"]
        print(f"• reusing tunnel {TUNNEL_NAME}: {tid}")
    else:
        r = client.post(
            f"/accounts/{ACCOUNT_ID}/cfd_tunnel",
            json={
                "name": TUNNEL_NAME,
                "tunnel_secret": base64.b64encode(secrets.token_bytes(32)).decode(),
                "config_src": "cloudflare",
            },
        )
        tid = ok(r)["id"]
        print(f"✓ created tunnel {TUNNEL_NAME}: {tid}")

    r = client.get(f"/accounts/{ACCOUNT_ID}/cfd_tunnel/{tid}/token")
    token = ok(r)
    return {"id": tid, "token": token}


def set_tunnel_config(tunnel_id: str) -> None:
    config = {
        "config": {
            "ingress": [
                {"hostname": HOSTNAME, "service": f"tcp://{DB_HOST}:{DB_PORT}"},
                {"service": "http_status:404"},
            ]
        }
    }
    r = client.put(f"/accounts/{ACCOUNT_ID}/cfd_tunnel/{tunnel_id}/configurations", json=config)
    ok(r)
    print(f"✓ tunnel ingress: {HOSTNAME} -> tcp://{DB_HOST}:{DB_PORT}")


def ensure_dns(tunnel_id: str) -> None:
    target = f"{tunnel_id}.cfargotunnel.com"
    r = client.get(f"/zones/{ZONE_ID}/dns_records", params={"name": HOSTNAME, "type": "CNAME"})
    records = ok(r)
    if records:
        rid = records[0]["id"]
        if records[0]["content"] == target and records[0].get("proxied") is True:
            print(f"• DNS {HOSTNAME} already correct")
            return
        r = client.put(
            f"/zones/{ZONE_ID}/dns_records/{rid}",
            json={"type": "CNAME", "name": HOSTNAME, "content": target, "proxied": True, "ttl": 1},
        )
        ok(r)
        print(f"✓ DNS updated: {HOSTNAME} -> {target} (proxied)")
    else:
        r = client.post(
            f"/zones/{ZONE_ID}/dns_records",
            json={"type": "CNAME", "name": HOSTNAME, "content": target, "proxied": True, "ttl": 1},
        )
        ok(r)
        print(f"✓ DNS created: {HOSTNAME} -> {target} (proxied)")


def ensure_service_token() -> dict[str, str]:
    r = client.get(f"/accounts/{ACCOUNT_ID}/access/service_tokens", params={"per_page": 100})
    tokens = ok(r)
    for t in tokens:
        if t["name"] == SERVICE_TOKEN_NAME:
            print(
                f"• reusing service token {SERVICE_TOKEN_NAME}: {t['client_id']} "
                f"(secret NOT rotated; look it up in your secret store)"
            )
            return {"client_id": t["client_id"], "client_secret": "", "id": t["id"]}
    r = client.post(
        f"/accounts/{ACCOUNT_ID}/access/service_tokens",
        json={"name": SERVICE_TOKEN_NAME, "duration": "8760h"},
    )
    tok = ok(r)
    print(f"✓ service token created: {tok['client_id']}")
    return {"client_id": tok["client_id"], "client_secret": tok["client_secret"], "id": tok["id"]}


def ensure_access_app(service_token_uuid: str) -> str:
    r = client.get(f"/accounts/{ACCOUNT_ID}/access/apps", params={"per_page": 200})
    apps = ok(r)
    aid = None
    for a in apps:
        if a["name"] == ACCESS_APP_NAME:
            aid = a["id"]
            print(f"• reusing Access app {ACCESS_APP_NAME}: {aid}")
            client.put(
                f"/accounts/{ACCOUNT_ID}/access/apps/{aid}",
                json={
                    "name": ACCESS_APP_NAME,
                    "domain": HOSTNAME,
                    "type": "self_hosted",
                    "session_duration": "24h",
                    "app_launcher_visible": False,
                    "allowed_idps": [],
                    "auto_redirect_to_identity": False,
                },
            )
            break
    if aid is None:
        r = client.post(
            f"/accounts/{ACCOUNT_ID}/access/apps",
            json={
                "name": ACCESS_APP_NAME,
                "domain": HOSTNAME,
                "type": "self_hosted",
                "session_duration": "24h",
                "app_launcher_visible": False,
                "allowed_idps": [],
                "auto_redirect_to_identity": False,
            },
        )
        aid = ok(r)["id"]
        print(f"✓ Access app created: {aid}")

    # Ensure a service-token-only allow policy exists.
    r = client.get(f"/accounts/{ACCOUNT_ID}/access/apps/{aid}/policies")
    policies = ok(r)
    policy_name = "hyperdrive-service-token"
    for p in policies:
        if p["name"] == policy_name:
            client.delete(f"/accounts/{ACCOUNT_ID}/access/apps/{aid}/policies/{p['id']}")
    r = client.post(
        f"/accounts/{ACCOUNT_ID}/access/apps/{aid}/policies",
        json={
            "name": policy_name,
            "decision": "non_identity",
            "include": [{"service_token": {"token_id": service_token_uuid}}],
        },
    )
    ok(r)
    print(f"✓ Access policy attached to service token {service_token_uuid}")
    return aid


def main() -> None:
    tun = ensure_tunnel()
    set_tunnel_config(tun["id"])
    ensure_dns(tun["id"])
    svc = ensure_service_token()
    app_id = ensure_access_app(svc["id"])

    out = {
        "tunnel_id": tun["id"],
        "tunnel_token": tun["token"],
        "hostname": HOSTNAME,
        "access_app_id": app_id,
        "access_client_id": svc["client_id"],
        "access_client_secret": svc["client_secret"],
        "db_internal_host": DB_HOST,
        "db_internal_port": DB_PORT,
    }
    print("\n=== RESULT ===")
    print(json.dumps(out, indent=2))
    if not svc["client_secret"]:
        print(
            "\nNOTE: access_client_secret is empty because the service token already existed. "
            "Look up the secret in the store where you saved it at creation time, "
            "or delete the service token in Zero Trust and re-run this script to rotate.",
            file=sys.stderr,
        )


if __name__ == "__main__":
    main()
