# Playbook 02 — Hybrid → Dokploy self-hosted (Bun runtime)

Stops running the Worker on Cloudflare. Instead, packages the same Hono handlers into a Bun container that runs on Dokploy next to the Postgres (no Hyperdrive, no tunnel needed — the app resolves postgres directly via the `dokploy-network` overlay). The Vite SPA moves inside the container and is served by `hono/bun`'s `serveStatic`.

**Result:** a container reachable at `https://<dokploy-domain>/` that serves `/api/auth/*` + `/api/me` + the SPA with client-side routing fallback. The Worker can be deleted at the end, or kept as a rollback.

## Prerequisites

- Playbook 01 completed — project is in Hybrid mode (Worker + Hyperdrive + postgres on Dokploy). If not, run 01 first.
- Same Postgres + tunnel stack is healthy (you can reach `${project_slug}-postgres` on `dokploy-network`).
- Docker buildable on the Dokploy host (or a registry like GHCR if building elsewhere).
- `bun` (Bun types are referenced by tsconfig).

## Inventory

**Create**
- `Dockerfile` (from scaffold).
- `.dockerignore` (from scaffold).
- `deploy/app.compose.yml` (from scaffold).
- `src/app.ts` — shared Hono factory `createApp(envProvider?)`.
- `src/index.worker.ts` — `export default createApp()` (Workers entry).
- `src/index.bun.ts` — Bun entry: migrate → env middleware → serveStatic → SPA fallback → `export default { port, fetch }`.
- `src/lib/env-bun.ts` — `buildBunEnv()` maps `process.env` into the `Env` shape the auth factory expects.

**Modify**
- `wrangler.jsonc` — `"main": "src/index.worker.ts"`.
- `package.json` — `module` → `src/index.worker.ts`; add `"start": "bun run src/index.bun.ts"`.
- `tsconfig.json` — add `"bun"` to `types`.
- `src/lib/better-auth/index.ts` — add `ssl: { rejectUnauthorized: false }` to the postgres.js options (Dokploy pg uses a self-signed cert; Workers ignore the option).
- `mise.toml` — add `docker:build` + `docker:run` tasks.

**Delete**
- `src/index.ts` — its content moves into `src/app.ts` + `src/index.worker.ts`.

## Step 1 — Refactor source for dual entrypoints

```bash
git clone --depth 1 https://github.com/knowsuchagency/cloudflare-template /tmp/cft-migrations 2>/dev/null || true
SCAFFOLD=/tmp/cft-migrations/migrations/02-hybrid-to-dokploy

cp "$SCAFFOLD/src/app.ts"             ./src/app.ts
cp "$SCAFFOLD/src/index.worker.ts"    ./src/index.worker.ts
cp "$SCAFFOLD/src/index.bun.ts"       ./src/index.bun.ts
cp "$SCAFFOLD/src/lib/env-bun.ts"     ./src/lib/env-bun.ts
cp "$SCAFFOLD/Dockerfile"             ./Dockerfile
cp "$SCAFFOLD/.dockerignore"          ./.dockerignore
mkdir -p deploy
cp "$SCAFFOLD/deploy/app.compose.yml" ./deploy/app.compose.yml
sed -i "s/PROJECT_SLUG/${project_slug}/g" ./deploy/app.compose.yml

rm src/index.ts
```

Patches to existing files:

`wrangler.jsonc` — change `main`:

```diff
-  "main": "src/index.ts",
+  "main": "src/index.worker.ts",
```

`package.json` — change module + add start script:

```diff
-  "module": "src/index.ts",
+  "module": "src/index.worker.ts",
   "scripts": {
     "dev": "wrangler dev",
     "deploy": "wrangler deploy",
+    "start": "bun run src/index.bun.ts",
```

`tsconfig.json` — add `"bun"` to types (so `process`, `Bun`, etc. resolve):

```diff
-    "types": ["./worker-configuration.d.ts"],
+    "types": ["./worker-configuration.d.ts", "bun"],
```

`src/lib/better-auth/index.ts` — add `ssl` option to the `postgres()` call:

```diff
   const sql = postgres(env.HYPERDRIVE.connectionString, {
     max: 5,
     fetch_types: false,
+    ssl: { rejectUnauthorized: false },
   });
```

Add mise tasks (append to `mise.toml`):

```toml
[tasks."docker:build"]
description = "Build the Mode 3 Bun app image locally"
run = "docker build -t ${project_slug}-app:latest ."

[tasks."docker:run"]
description = "Run the Mode 3 Bun app against mise db:local:up pg"
depends = ["docker:build"]
run = '''
docker rm -f ${project_slug}-app >/dev/null 2>&1 || true
docker run -d --name ${project_slug}-app \
  -p 3000:3000 \
  --add-host host.docker.internal:host-gateway \
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/postgres" \
  -e BETTER_AUTH_SECRET="$(openssl rand -base64 32)" \
  -e BETTER_AUTH_URL="http://localhost:3000" \
  ${project_slug}-app:latest >/dev/null
echo "✓ ${project_slug}-app running on http://localhost:3000"
'''
```

Verify locally:

```bash
bun install
mise run typecheck
mise run web:build
mise db:local:up
mise run docker:build
mise run docker:run
sleep 3
curl -sS -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/        # expect 200
curl -sS -X POST http://localhost:3000/api/auth/sign-up/email \
  -H 'Content-Type: application/json' \
  -d '{"name":"Local","email":"local@test.local","password":"locallocal"}' -w "\nHTTP %{http_code}\n"
# expect HTTP 200
curl -sS -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/nonexistent  # expect 200 (SPA fallback)
docker rm -f ${project_slug}-app
```

## Step 2 — Add a stable postgres alias to the db compose

The app compose references the db by hostname `${project_slug}-postgres`. Edit `deploy/db-tunnel.compose.yml` (from playbook 01) to declare that alias on `dokploy-network`:

```yaml
  postgres:
    # ...
    networks:
      default:
      dokploy-network:
        aliases:
          - PROJECT_SLUG-postgres   # <- add this; sed PROJECT_SLUG → your slug
```

Redeploy the `${project_slug}-db` Dokploy compose so the alias takes effect. Verify from another container on `dokploy-network`:

```bash
docker run --rm --network dokploy-network alpine getent hosts ${project_slug}-postgres
# expect a single line with an IP
```

## Step 3 — Deploy the Bun app via Dokploy

1. Build the image on the Dokploy host: `docker build -t ${project_slug}-app:latest .`
   - Or build elsewhere and push to a registry; in that case change `image:` in `deploy/app.compose.yml` to the registry reference and optionally add `build:` back.
2. Create a Dokploy compose project named `${project_slug}-app`, `--source-type raw`, use `deploy/app.compose.yml` as the compose file.
3. Env vars:
   ```
   DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${project_slug}-postgres:5432/${POSTGRES_DB}?sslmode=no-verify
   BETTER_AUTH_SECRET=<openssl rand -base64 32, or reuse the Worker secret>
   BETTER_AUTH_URL=https://${project_slug}-app.example.com
   ```
4. Add a Dokploy domain: `host=${project_slug}-app.example.com`, `port=3000`, `service-name=app`, `domain-type=compose`, `certificate-type=none` (Cloudflare origin cert already terminates TLS at Traefik).
5. Deploy, wait for status `done`.
6. **Redeploy once** — Dokploy adds the Traefik labels only on the second deploy after a domain is attached.

## Step 4 — Verification

```bash
HOST="${project_slug}-app.example.com"
curl -sS https://$HOST/ -o /tmp/spa.html -w "HTTP %{http_code}  size=%{size_download}\n"
# expect HTTP 200 and a non-zero size. head /tmp/spa.html should show <!doctype html>

curl -sS -X POST https://$HOST/api/auth/sign-up/email \
  -H 'Content-Type: application/json' \
  -d '{"name":"Dokploy","email":"dokploy@test.local","password":"dokploydokploy"}' -w "\nHTTP %{http_code}\n"
# expect HTTP 200 with {"token":"...","user":{...}}

curl -sS -o /dev/null -w "HTTP %{http_code}\n" https://$HOST/nonexistent-route
# expect HTTP 200 (SPA fallback)

curl -sS -o /dev/null -w "HTTP %{http_code}\n" https://$HOST/assets/index-*.js
# expect HTTP 200 (static asset)
```

## Step 5 — Decide the Worker's fate

The Worker + Hyperdrive + tunnel are no longer on the hot path once traffic flips to `${project_slug}-app.example.com`. Three options:

- **Keep them (recommended for first cutover):** parallel deploy, both paths work. Roll back by pointing DNS at the Worker URL again.
- **Demote to a fallback:** leave Hyperdrive + tunnel running, delete the Dokploy app compose on rollback.
- **Retire them:** `wrangler delete --name $worker_name`, `wrangler hyperdrive delete <id>`, delete the tunnel via `scripts/cf-setup.py`-equivalent tear-down (or the Cloudflare dashboard). **Destructive — do this only once you're confident.**

## Rollback (within the first 24h, before Worker is retired)

Switch DNS for `${project_slug}-app.example.com` to CNAME the Worker URL (or just stop hitting the Dokploy domain from the client). Delete the Dokploy app compose via the Dokploy API. The db compose and CF side stay untouched; traffic returns to the Worker path.

To fully revert the code: `git checkout <tag-before-playbook-02>` then `mise run deploy`.
