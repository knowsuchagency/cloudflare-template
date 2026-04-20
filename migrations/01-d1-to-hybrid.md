# Playbook 01 — D1 → Hybrid (Hyperdrive + self-hosted Postgres)

Swaps the default D1 binding for a Hyperdrive binding that reaches a self-hosted Postgres (running in a Dokploy compose) through a Cloudflare Tunnel protected by a Cloudflare Access service token. The Worker code keeps `/api/auth/*` + the SPA `assets` binding; only the DB layer moves.

**Result:** `wrangler deploy` produces a Worker identical in shape to the default, but `env.DB` (D1) is replaced by `env.HYPERDRIVE.connectionString` (Postgres URL via Hyperdrive).

## Prerequisites

- Rendered from `cloudflare-template`, Mode 1 deployed at least once (i.e. `mise init && mise deploy` succeeded with D1).
- `CLOUDFLARE_GLOBAL_TOKEN` + `CLOUDFLARE_EMAIL` in env (Global API Key — the scoped token alternative works too; see scripts/cf-setup.py).
- Dokploy instance reachable. `DOKPLOY_URL` + `DOKPLOY_DEFAULT` (API key) in env. The Dokploy host must have an overlay network named `dokploy-network` and Traefik fronting it.
- `bun`, `mise`, `jq`, `docker`, `uv` on PATH.
- `$project_slug`, `$project_hostname` (the tunnel hostname, e.g. `db.${project_slug}.example.com`), `$zone_id`, `$account_id` known.

## Inventory

**Replace / modify**
- `wrangler.jsonc` — remove `d1_databases`, add `hyperdrive`.
- `drizzle.config.ts` — sqlite/d1-http → postgresql + reads `DATABASE_URL`.
- `better-auth.config.ts` — better-sqlite3 :memory: → lazy pg.Pool (schema-gen only).
- `src/lib/better-auth/index.ts` — drizzle-orm/d1 → drizzle-orm/postgres-js with postgres.js.
- `package.json` — drop `better-sqlite3` + `@types/better-sqlite3`; add `pg`, `@types/pg`, `postgres`.
- `mise.toml` — replace D1 tasks with Postgres tasks (see scaffold).

**Create**
- `deploy/db-tunnel.compose.yml` (from scaffold).
- `scripts/cf-setup.py` (from scaffold).

**Delete**
- `drizzle/` sqlite migration files — regenerated for postgresql.

## Step 1 — Swap source code (local)

Clone the scaffolds into the project:

```bash
# One-time: pull the migration scaffolds from cloudflare-template.
git clone --depth 1 https://github.com/knowsuchagency/cloudflare-template /tmp/cft-migrations
SCAFFOLD=/tmp/cft-migrations/migrations/01-d1-to-hybrid
```

Copy the drop-in files verbatim, then substitute the placeholder:

```bash
mkdir -p deploy scripts
cp "$SCAFFOLD/drizzle.config.ts"            ./drizzle.config.ts
cp "$SCAFFOLD/better-auth.config.ts"        ./better-auth.config.ts
cp "$SCAFFOLD/src/lib/better-auth/index.ts" ./src/lib/better-auth/index.ts
cp "$SCAFFOLD/deploy/db-tunnel.compose.yml" ./deploy/db-tunnel.compose.yml
cp "$SCAFFOLD/scripts/cf-setup.py"          ./scripts/cf-setup.py
chmod +x ./scripts/cf-setup.py

sed -i "s/PROJECT_SLUG/${project_slug}/g" ./deploy/db-tunnel.compose.yml
```

Patch `wrangler.jsonc` (delete the `d1_databases` block, add `hyperdrive`):

```jsonc
"hyperdrive": [
  {
    "binding": "HYPERDRIVE",
    "id": "REPLACE_WITH_ID_FROM_wrangler_hyperdrive_create",
    "localConnectionString": "postgresql://postgres:postgres@localhost:5432/postgres"
  }
],
```

Patch `package.json` (dev deps and runtime deps):

```diff
   "devDependencies": {
-    "@types/better-sqlite3": "^7.6.13",
-    "better-sqlite3": "^12.9.0",
+    "@types/pg": "^8.15.7",
     "drizzle-kit": "^0.31.10",
     "wrangler": "^4.83.0"
   },
   "dependencies": {
     "better-auth": "^1.6.5",
     "drizzle-orm": "^0.45.2",
     "hono": "^4.12.14",
+    "pg": "^8.13.1",
+    "postgres": "^3.4.5"
   }
```

Replace `mise.toml`'s D1 tasks with Postgres tasks. Delete the `d1:create`, `migrate:local`, `migrate:remote` tasks; add these (see scaffold for full task bodies):

- `db:local:up` / `db:local:down` — local Postgres dev container on :5432.
- `db:migrate:local` — `bunx drizzle-kit migrate` against `DATABASE_URL` (default localhost).
- `db:migrate:remote` — same but with `PROD_DATABASE_URL`.
- `hyperdrive:create` — idempotent wrapper around `wrangler hyperdrive create` (requires `CF_TUNNEL_HOSTNAME`, `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE`).

Regenerate schema + migration and reinstall:

```bash
rm -rf drizzle
bun install
mise exec -- bun run auth:generate   # regenerates src/db/schema.ts as pgTable
mise exec -- bun run db:generate     # drizzle/NNNN_*.sql for postgresql
mise exec -- bunx wrangler types     # refresh worker-configuration.d.ts
mise exec -- bun run typecheck
```

Verification: `tsc --noEmit` exits 0.

## Step 2 — Provision Cloudflare (tunnel, DNS, Access, service token)

```bash
export CLOUDFLARE_ACCOUNT_ID="$account_id"
export CLOUDFLARE_ZONE_ID="$zone_id"
export TUNNEL_HOSTNAME="$project_hostname"   # e.g. db.myproj.example.com
./scripts/cf-setup.py
```

Captures the output JSON. Save the three values:

- `tunnel_token` → feeds cloudflared container.
- `access_client_id` + `access_client_secret` → feed Hyperdrive.

Put these in your secret manager.

## Step 3 — Deploy db + cloudflared to Dokploy

1. Create a Dokploy compose project named `${project_slug}-db`.
2. Set `--source-type raw` with `deploy/db-tunnel.compose.yml` as the compose file.
3. Env vars: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `TUNNEL_TOKEN` (from step 2).
4. Deploy and wait for the `postgres` service to become healthy and for `cloudflared` logs to show 4 `Registered tunnel connection` lines.

Verify the tunnel/DB handshake from the Dokploy host:

```bash
docker run --rm --network dokploy-network -e PGPASSWORD="$POSTGRES_PASSWORD" postgres:17 \
  psql "sslmode=require host=${project_slug}-postgres user=$POSTGRES_USER dbname=$POSTGRES_DB" \
  -c "SELECT version();"
```

## Step 4 — Create the Hyperdrive config + deploy the Worker

```bash
mise run hyperdrive:create \
  CF_TUNNEL_HOSTNAME="$TUNNEL_HOSTNAME" \
  CF_ACCESS_CLIENT_ID="$access_client_id" \
  CF_ACCESS_CLIENT_SECRET="$access_client_secret" \
  PG_USER="$POSTGRES_USER" \
  PG_PASSWORD="$POSTGRES_PASSWORD" \
  PG_DATABASE="$POSTGRES_DB"
# Patches the id into wrangler.jsonc automatically.
```

Apply the drizzle schema to the remote pg (from a throwaway container on `dokploy-network`):

```bash
docker run --rm --network dokploy-network \
  -v "$PWD":/app -w /app \
  -e DATABASE_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@${project_slug}-postgres:5432/$POSTGRES_DB?sslmode=no-verify" \
  oven/bun:1.3.3 bunx drizzle-kit migrate
```

Upload the Better Auth secret + deploy:

```bash
mise run secret:put
mise run deploy
```

## Step 5 — Data migration (optional, skip if D1 was empty)

Export from D1, translate, import to Postgres:

```bash
mise exec -- bunx wrangler d1 export "$d1_database_name" --remote --output /tmp/d1.sql
# Review /tmp/d1.sql for sqlite-specific types (integer timestamps, etc). The
# better-auth tables are straightforward: user, session, account, verification.
# For timestamps sqlite stores ms-since-epoch; postgres uses `timestamp`.
# A one-liner that usually works for better-auth data:
python3 -c '
import re, sys
with open("/tmp/d1.sql") as f: s = f.read()
s = re.sub(r"CREATE TABLE.*?;", "", s, flags=re.DOTALL)  # drop DDL, schema is already in pg
with open("/tmp/d1-data.sql", "w") as f: f.write(s)
'
docker run --rm --network dokploy-network \
  -v /tmp:/tmp -e PGPASSWORD="$POSTGRES_PASSWORD" postgres:17 \
  psql "host=${project_slug}-postgres user=$POSTGRES_USER dbname=$POSTGRES_DB sslmode=no-verify" \
  -f /tmp/d1-data.sql
```

If schemas drift (uncommon for better-auth tables), translate column types manually.

## Verification

```bash
curl -sS -X POST https://${worker_name}.${account_subdomain}.workers.dev/api/auth/sign-up/email \
  -H 'Content-Type: application/json' \
  -d '{"name":"Smoke","email":"smoke-hybrid@test.local","password":"smokesmokesmoke"}' \
  -w "\nHTTP %{http_code}\n"
# Expect: HTTP 200 with {"token":"...","user":{...}}

curl -sS -X POST https://${worker_name}.${account_subdomain}.workers.dev/api/auth/sign-in/email \
  -H 'Content-Type: application/json' \
  -d '{"email":"smoke-hybrid@test.local","password":"smokesmokesmoke"}' \
  -w "\nHTTP %{http_code}\n"
# Expect: HTTP 200 with {"redirect":false,"token":"...","user":{...}}
```

Confirm the row landed in Postgres, not D1:

```bash
docker run --rm --network dokploy-network -e PGPASSWORD="$POSTGRES_PASSWORD" postgres:17 \
  psql "host=${project_slug}-postgres user=$POSTGRES_USER dbname=$POSTGRES_DB sslmode=no-verify" \
  -tAc "SELECT email FROM \"user\" WHERE email='smoke-hybrid@test.local';"
```

## Rollback

1. `git checkout <tag-before-migration> -- wrangler.jsonc src/lib/better-auth/index.ts drizzle.config.ts better-auth.config.ts package.json mise.toml`
2. `rm -rf drizzle && bun install && mise run auth:generate && mise run db:generate`
3. `mise run d1:create && mise run migrate:remote`
4. `mise run deploy`
5. Dokploy resources (postgres compose, tunnel) can be deleted lazily — they no longer receive traffic once the Worker rebinds to D1.
