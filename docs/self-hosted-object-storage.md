# Self-hosted object storage (versitygw + Workers VPC)

Add an S3-compatible object store ([versitygw](https://github.com/versity/versitygw)) to any rendered project, reached from the Worker through a Cloudflare [Workers VPC](https://developers.cloudflare.com/workers-vpc/) `vpc_services` HTTP binding on the same Cloudflare Tunnel you already run for Mode 2 Postgres.

This is an **addition**, not a migration. The default template ships without object storage. Add this when you need S3 semantics and don't want R2 — or when you want to test S3-dependent code locally against the same gateway image that runs in production.

## Why this pattern

Cloudflare **Workers VPC** (public beta as of 2026, free on all Workers plans during beta) lets a Worker bind to an HTTP(S) service inside a Cloudflare Tunnel. Two properties that matter here:

1. **Isolation is by binding.** A Worker without the matching `service_id` can't reach the service. No Access service-token round-trip on every call.
2. **Same `cloudflared` tunnel.** If you already ran [`migrations/01-d1-to-hybrid.md`](../migrations/01-d1-to-hybrid.md), you have a `cloudflared` sidecar on `dokploy-network`. It can serve a second ingress (HTTP → versitygw) alongside the existing one (TCP → Postgres) with no extra infra.

versitygw is an Apache-2.0 S3 gateway:

- POSIX filesystem backend (buckets are directories, objects are files)
- Standard S3 SigV4 request signing
- Official image on Docker Hub (`versity/versitygw`) and GHCR
- Defaults to `:7070` on plaintext HTTP (Cloudflared terminates TLS at the edge; the hop from cloudflared → versitygw stays on the overlay network)

Together: a Worker does `env.S3.fetch(signedRequest)` against a self-hosted S3 gateway on your infra. Mode 3 (Bun on `dokploy-network`) reaches the same gateway directly via a Docker-network alias. The handler code is identical across runtimes.

## Prerequisites

- Rendered project with Mode 2 complete — `deploy/db-tunnel.compose.yml` (or the `backend.compose.yml` variant below) already running, tunnel provisioned by `scripts/cf-setup.py`.
- `CF_TUNNEL_ID` known (printed by `scripts/cf-setup.py`).
- A second hostname in your zone (e.g. `s3.${project_slug}.example.com`).
- `wrangler` ≥ 4.83 (ships `wrangler vpc service` subcommands).
- `aws4fetch` package for SigV4 signing in the Worker.

## Configuration

### 1. Rename and extend the compose

Rename `deploy/db-tunnel.compose.yml` → `deploy/backend.compose.yml` to reflect that it now hosts more than the DB, and add the versitygw service + volume:

```yaml
services:
  # ... existing pg-tls-init, postgres, cloudflared services ...

  versitygw:
    image: versity/versitygw:v1.4.0
    restart: unless-stopped
    # Image ENTRYPOINT is versitygw; command supplies the subcommand + args.
    command: ["posix", "/data"]
    environment:
      ROOT_ACCESS_KEY: ${S3_ROOT_ACCESS_KEY}
      ROOT_SECRET_KEY: ${S3_ROOT_SECRET_KEY}
      # Keep-alive is OFF by default in versitygw; aws4fetch + AWS SDKs expect it on.
      VGW_KEEP_ALIVE: "true"
    volumes:
      - versity-data:/data
    networks:
      default:
      dokploy-network:
        aliases:
          # Stable alias so Mode 3 (Bun on dokploy-network) reaches it without
          # knowing Dokploy's auto-generated project appName.
          - ${project_slug}-s3

volumes:
  # ... existing pg-data, pg-tls ...
  versity-data:
```

Also update `cloudflared`'s `depends_on` to wait for `versitygw: service_started`.

### 2. Extend the tunnel ingress

`scripts/cf-setup.py` (the one from `migrations/01-d1-to-hybrid/scripts/`) accepts an optional `S3_HOSTNAME` env var that adds a second HTTP ingress (no Access gate — the VPC binding is the isolation) and a second DNS CNAME. Rerun with both hostnames set; the script is idempotent:

```bash
fnox exec -- env \
  CLOUDFLARE_EMAIL=... \
  CLOUDFLARE_ZONE_ID=... \
  TUNNEL_HOSTNAME=db.${project_slug}.example.com \
  S3_HOSTNAME=s3.${project_slug}.example.com \
  S3_SERVICE_NAME=versitygw \
  S3_PORT=7070 \
  ./scripts/cf-setup.py
```

Copy the emitted `tunnel_id`.

> If your copy of `cf-setup.py` pre-dates the S3 extension, pull the latest version from `migrations/01-d1-to-hybrid/scripts/cf-setup.py` in this template or from [`knowsuchagency/vpc-test`](https://github.com/knowsuchagency/vpc-test/blob/main/scripts/cf-setup.py).

### 3. Register the Workers VPC service

```bash
bunx wrangler vpc service create ${project_slug}-s3 \
  --type=http \
  --tunnel-id="$CF_TUNNEL_ID" \
  --hostname=versitygw \
  --http-port=7070
```

Copy the emitted `service_id`.

### 4. Add the binding to `wrangler.jsonc`

```jsonc
"vpc_services": [
  {
    "binding": "S3",
    "service_id": "<service_id from step 3>"
  }
]
```

Run `bunx wrangler types` to refresh `worker-configuration.d.ts` so `env.S3: Fetcher` appears in the `Env` interface.

### 5. Upload credentials as Worker secrets

```bash
bunx wrangler secret put S3_ROOT_ACCESS_KEY    # from backend.compose.yml env
bunx wrangler secret put S3_ROOT_SECRET_KEY
```

Augment `Cloudflare.Env` in `src/env.d.ts` to declare them:

```typescript
declare namespace Cloudflare {
  interface Env {
    BETTER_AUTH_SECRET: string;
    S3_ROOT_ACCESS_KEY: string;
    S3_ROOT_SECRET_KEY: string;
  }
}
```

### 6. Add the Worker handler

```bash
bun add aws4fetch
```

```typescript
import { AwsClient } from "aws4fetch";

// ... inside createApp() ...

app.get("/api/s3/ping", async (c) => {
  const aws = new AwsClient({
    accessKeyId: c.env.S3_ROOT_ACCESS_KEY,
    secretAccessKey: c.env.S3_ROOT_SECRET_KEY,
    service: "s3",
    region: "us-east-1",
  });
  // The URL host/port are only used for the signed Host header; the
  // vpc_services binding decides actual routing (tunnel + versitygw:7070).
  const signed = await aws.sign(`http://${project_slug}-s3:7070/`);
  const res = await c.env.S3.fetch(signed);
  return new Response(await res.text(), {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/xml" },
  });
});
```

### 7. Mode 3 shim (only if Mode 3 is active)

In `src/lib/env-bun.ts` synthesise a minimal Fetcher that delegates to the global `fetch`. The signed URL resolves directly on `dokploy-network` via the `${project_slug}-s3` alias, so no rewriting is needed:

```typescript
const S3 = {
  fetch: (input: Request) => fetch(input),
} as unknown as Fetcher;

return {
  // ... existing HYPERDRIVE, BETTER_AUTH_*, etc ...
  S3,
  S3_ROOT_ACCESS_KEY: mustGet("S3_ROOT_ACCESS_KEY"),
  S3_ROOT_SECRET_KEY: mustGet("S3_ROOT_SECRET_KEY"),
} as unknown as Env;
```

Pass the two secrets through `deploy/app.compose.yml`:

```yaml
environment:
  # ... existing DATABASE_URL, BETTER_AUTH_* ...
  S3_ROOT_ACCESS_KEY: ${S3_ROOT_ACCESS_KEY}
  S3_ROOT_SECRET_KEY: ${S3_ROOT_SECRET_KEY}
```

### 8. Redeploy

```bash
# Dokploy — push the updated backend.compose.yml + env vars, redeploy.
# (If Mode 3 is active, also redeploy the app compose.)
mise run deploy    # Worker side
```

## Verification

Create a bucket from any container on `dokploy-network` using the S3 root credentials:

```bash
docker run --rm --network dokploy-network \
  -e AWS_ACCESS_KEY_ID=<access> \
  -e AWS_SECRET_ACCESS_KEY=<secret> \
  -e AWS_DEFAULT_REGION=us-east-1 \
  amazon/aws-cli:latest \
  --endpoint-url http://${project_slug}-s3:7070 s3 mb s3://smoke-test
```

Then:

- `curl https://<worker-url>/api/s3/ping` — returns `ListAllMyBucketsResult` XML containing `<Name>smoke-test</Name>`. Proves the Mode 2 / Workers VPC path.
- (If Mode 3 active) `curl https://<dokploy-domain>/api/s3/ping` — returns the same XML. Proves the Mode 3 direct-network path.

Both runtimes hit the same backing store. That's the invariant: same handler, two transports, one bucket.

## Client compatibility

The gateway speaks standard S3 SigV4. A few notes:

- **Path-style addressing.** versitygw defaults to path-style. If you use `@aws-sdk/client-s3`, set `forcePathStyle: true` and an explicit `endpoint`. `aws4fetch` is path-style by default.
- **Host header.** The URL you sign becomes the signed Host header. With the `vpc_services` binding the URL host is only used for that — actual routing is pinned to the tunnel target. So a stable internal hostname like `http://${project_slug}-s3:7070/` works for both runtimes.
- **Presigned URLs.** Sign against the public tunnel hostname (`s3.${project_slug}.example.com`) when the URL must be followed by a client outside your infra. Those URLs hit cloudflared → versitygw and work.
- **Region.** versitygw accepts any region string; use `us-east-1` for maximum SDK compatibility.

## Trade-offs vs R2

| Aspect                        | R2                           | versitygw + Workers VPC                     |
|-------------------------------|------------------------------|---------------------------------------------|
| Durability                    | Cloudflare-managed           | You own (back up `versity-data` volume)     |
| CDN / public object serving   | Free egress, CF edge cache   | Serve via Worker or your own CDN            |
| Egress cost                   | Zero (R2 has no egress fee)  | Zero inside your infra; Worker ↔ origin pays normal Workers egress |
| S3 compatibility              | Partial (R2 is S3-compat)    | Full SigV4, multipart, presigned URLs       |
| Local parity                  | R2 local emulator            | Same image locally as in production         |
| Compliance                    | CF's compliance certs        | Your infra, your certifications             |

R2 remains the right default for public objects with heavy egress. versitygw makes sense when data sovereignty, infra colocation, or local parity matters more than the global CDN.

## Reference

Live proof: [`knowsuchagency/vpc-test`](https://github.com/knowsuchagency/vpc-test). See `deploy/backend.compose.yml` (versitygw + postgres + cloudflared), `scripts/cf-setup.py` (idempotent two-ingress provisioning), `mise.toml` `vpc-service:create` (wrangler patching), and `src/app.ts` `/api/s3/ping`.
