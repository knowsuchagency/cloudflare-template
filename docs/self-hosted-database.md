# Self-hosted database (Hyperdrive + Postgres)

Swap the default D1 binding for a Hyperdrive binding that reaches a self-hosted Postgres through a Cloudflare Tunnel protected by a Cloudflare Access service token. **The Worker stays on Cloudflare** — only the data layer moves.

Result: `env.DB` (D1) is replaced by `env.HYPERDRIVE.connectionString` (Postgres URL via Hyperdrive). `/api/auth/*` and the SPA `assets` binding are unchanged.

## When this is worth doing

See [`README.md` §"When to reach for each"](README.md#when-to-reach-for-each). In short: compliance / residency, pg-specific features (RLS, extensions, JSONB, triggers, LISTEN/NOTIFY, full-text search), or row-read costs past the break-even with flat-cost self-hosted Postgres.

## Architecture

```
Worker  ─► env.HYPERDRIVE.connectionString
           ─► Cloudflare Hyperdrive (Postgres wire over WebSocket)
              ─► Cloudflare Access (service token challenge)
                 ─► Cloudflare Tunnel (CNAME db.$slug.example.com → <tunnel>.cfargotunnel.com)
                    ─► cloudflared sidecar (on dokploy-network)
                       ─► postgres @ postgres:5432 (TLS, self-signed)
```

Why Access in the path: Workers VPC `vpc_services` doesn't yet support TCP (the pg wire protocol). Hyperdrive-over-Access is the supported pattern for Postgres over a tunnel.

## What changes in the rendered project

**Source:**
- `src/lib/better-auth/index.ts` — `drizzle-orm/d1` → `drizzle-orm/postgres-js` with `postgres.js`. Add `ssl: { rejectUnauthorized: false }` so the self-signed cert is accepted.
- `src/db/schema.ts` — regenerated from `better-auth.config.ts` for the `pg` dialect.
- `drizzle.config.ts` — dialect `sqlite` → `postgresql`; reads `DATABASE_URL`.
- `better-auth.config.ts` — drops `better-sqlite3`, uses a lazy `pg.Pool` (schema-generation only).
- `package.json` — drop `better-sqlite3`; add `pg`, `@types/pg`, `postgres`.

**Config:**
- `wrangler.jsonc` — remove `d1_databases`, add `hyperdrive`.
- `mise.toml` — swap D1 tasks (`d1:create`, `migrate:remote`) for Postgres tasks (`db:local:up`, `db:migrate:local`, `db:migrate:remote`, `hyperdrive:create`).

**New infra:**
- `deploy/backend.compose.yml` — Dokploy compose for postgres (TLS + self-signed-cert init job) + cloudflared sidecar, both joined to `dokploy-network`.
- `scripts/cf-setup.py` — idempotent provisioner for the tunnel, DNS CNAME, Access app, and service token. Reads `CLOUDFLARE_GLOBAL_TOKEN` / `CLOUDFLARE_EMAIL` from env.

## Order of operations

1. Lift in the new source files and config. Delete the old D1 drizzle migrations (regenerated for pg).
2. Run `scripts/cf-setup.py` to provision tunnel + DNS + Access. Emits `tunnel_token`, `access_client_id`, `access_client_secret`.
3. Deploy `backend.compose.yml` to Dokploy with `TUNNEL_TOKEN` set. Wait for postgres `healthy` and cloudflared logs showing four `Registered tunnel connection` lines.
4. `mise run hyperdrive:create` — idempotent wrapper that creates the Hyperdrive config (pinned to the tunnel hostname, with the Access client id/secret) and patches the id into `wrangler.jsonc`.
5. Apply drizzle migrations to the remote pg from a throwaway container on `dokploy-network`.
6. `mise run secret:put` (Better Auth secret), then `mise run deploy`.

## Reference implementation

Live on [`knowsuchagency/vpc-test`](https://github.com/knowsuchagency/vpc-test). Everything you need to copy is there:

- [`deploy/backend.compose.yml`](https://github.com/knowsuchagency/vpc-test/blob/main/deploy/backend.compose.yml) — the postgres + cloudflared compose (also hosts versitygw; strip that service if you only want the DB).
- [`scripts/cf-setup.py`](https://github.com/knowsuchagency/vpc-test/blob/main/scripts/cf-setup.py) — idempotent CF provisioner. Reads `TUNNEL_HOSTNAME` (required), plus `S3_HOSTNAME` (optional — ignore if you're not adding object storage).
- [`src/lib/better-auth/index.ts`](https://github.com/knowsuchagency/vpc-test/blob/main/src/lib/better-auth/index.ts) — the `drizzle-orm/postgres-js` adapter with self-signed-cert handling.
- [`mise.toml`](https://github.com/knowsuchagency/vpc-test/blob/main/mise.toml) — `hyperdrive:create` task + pg migration tasks.
- [`wrangler.jsonc`](https://github.com/knowsuchagency/vpc-test/blob/main/wrangler.jsonc) — shape of the `hyperdrive` binding.
- [`CLAUDE.md`](https://github.com/knowsuchagency/vpc-test/blob/main/CLAUDE.md) — per-file walkthrough of the data path and gotchas.

Live URL: https://vpc-test.knowsuchagency.workers.dev (signs up / signs in through the remote Postgres).

## Verification

```bash
curl -sS -X POST https://$WORKER_URL/api/auth/sign-up/email \
  -H 'Content-Type: application/json' \
  -d '{"name":"Smoke","email":"smoke@test.local","password":"smokesmokesmoke"}'
# expect HTTP 200 + {"token":"...","user":{...}}
```

Then confirm the row landed in Postgres (not D1) from a container on `dokploy-network`:

```bash
docker run --rm --network dokploy-network -e PGPASSWORD=$POSTGRES_PASSWORD postgres:17 \
  psql "host=$slug-postgres user=$POSTGRES_USER dbname=$POSTGRES_DB sslmode=no-verify" \
  -tAc "SELECT email FROM \"user\" WHERE email='smoke@test.local';"
```

## Gotchas

- `fetch_types: false` in the `postgres()` options: Hyperdrive doesn't implement the extended query protocol used for type introspection.
- `advanced.ipAddress.ipAddressHeaders: ["cf-connecting-ip"]` in `better-auth.config.ts` — without this Better Auth logs rate-limiter warnings on Workers.
- The postgres TLS cert is self-signed; `postgres.js` ships with strict verification and needs `ssl: { rejectUnauthorized: false }`. Hyperdrive refuses plaintext Postgres origins so the self-signed cert is non-optional.
- Access service tokens in `scripts/cf-setup.py` are **not rotated** on re-run — the plaintext secret is only printed the first time. Stash it in your secret manager on first provision.

## Rollback

1. `git checkout <pre-migration-tag> -- wrangler.jsonc src/lib/better-auth/index.ts drizzle.config.ts better-auth.config.ts package.json mise.toml`
2. `rm -rf drizzle && bun install && mise run auth:generate && mise run db:generate`
3. `mise run d1:create && mise run migrate:remote`

The Dokploy postgres + cloudflared stack can stay running in parallel during validation and be destroyed after.
