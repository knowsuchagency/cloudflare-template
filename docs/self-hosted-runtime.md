# Self-hosted runtime (Bun on Dokploy)

Stop running the Worker on Cloudflare. Package the same Hono handlers into a Bun + Hono container that runs on Dokploy next to the Postgres — no Hyperdrive, no tunnel in the data path. The Vite SPA moves inside the container and is served by `hono/bun`'s `serveStatic`.

Prereq: the DB must already be off Cloudflare — follow [`self-hosted-database.md`](self-hosted-database.md) first. The Bun container reaches Postgres directly via `dokploy-network`.

Result: a container reachable at `https://<dokploy-domain>/` that serves `/api/auth/*`, `/api/me`, and the SPA. The Worker can stay as a parallel path during cutover, or be retired once traffic is flipped.

## When this is worth doing

See [`README.md` §"When to reach for each"](README.md#when-to-reach-for-each). In short: egress cost or latency between CF and your infra, long-running background work that doesn't fit V8 Isolates, or a single-operational-surface preference (Docker logs instead of CF Logs + host logs).

## Architecture

```
Traefik (on Dokploy host)
 └─► Bun + Hono container (:3000)
       ├── /api/auth/*, /api/me  ─► better-auth  ─► postgres.js  ─► postgres @ $slug-postgres:5432
       └── /* (SPA files + index.html fallback)
```

No Cloudflare in the hot path. Cloudflare can still proxy the hostname at the edge for DDoS shielding, but the origin is your Dokploy host.

## The architectural invariant

This is the payoff of the two-entrypoint refactor: **the Hono handlers don't change between Workers and Bun**. A `createApp(envProvider?)` factory in `src/app.ts` is consumed by both entrypoints; the Bun entry additionally wires a static file server and calls `buildBunEnv()` to synthesise the `Env` shape the auth factory expects from `process.env`.

That means Mode 2 and Mode 3 share 100% of the HTTP handler surface. Adding a new route adds it to both simultaneously.

## What changes in the rendered project

**Source (new files):**
- `src/app.ts` — Hono factory `createApp(envProvider?)`. The auth routes + any other `/api/*` handlers live here.
- `src/index.worker.ts` — Workers entry. `export default createApp();`
- `src/index.bun.ts` — Bun entry. Runs drizzle migrations once on startup, builds env from `process.env`, mounts `serveStatic`, exports `{ port, fetch }`.
- `src/lib/env-bun.ts` — `buildBunEnv()` maps `process.env` → the `Env` the auth handlers expect. Crucially synthesises `HYPERDRIVE: { connectionString: process.env.DATABASE_URL }` so the same auth code paths work.

**Source (delete):** `src/index.ts` — content moves into `src/app.ts` + `src/index.worker.ts`.

**Source (modify):**
- `src/lib/better-auth/index.ts` — add `ssl: { rejectUnauthorized: false }` to the `postgres()` call. On Workers the option is ignored; on Bun it accepts the self-signed cert.

**Config:**
- `wrangler.jsonc` — `"main": "src/index.worker.ts"`.
- `package.json` — `module` → `src/index.worker.ts`; add `"start": "bun run src/index.bun.ts"`.
- `tsconfig.json` — add `"bun"` to `types`.
- `mise.toml` — add `docker:build` / `docker:run` tasks.

**New infra:**
- `Dockerfile` + `.dockerignore` — multi-stage: builder compiles the SPA and runs `bun install`; runtime copies `dist`, `node_modules`, and `src/`, runs `bun run src/index.bun.ts`.
- `deploy/app.compose.yml` — Dokploy compose for the Bun service. Reads `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` from env; joins `dokploy-network`.
- The `postgres` service in `deploy/backend.compose.yml` (from the previous migration) needs a `dokploy-network` alias like `$slug-postgres` so the Bun app can reach it by a stable name.

## Order of operations

1. Refactor source to dual entrypoints (`app.ts` + `index.worker.ts` + `index.bun.ts` + `env-bun.ts`); delete old `index.ts`. Smoke-test locally: `bun install && mise run typecheck && mise db:local:up && mise run docker:build && mise run docker:run`. `curl localhost:3000/api/auth/sign-up/email` should return 200.
2. Add the `$slug-postgres` alias to `backend.compose.yml`'s postgres service; redeploy. Verify with `docker run --rm --network dokploy-network alpine getent hosts $slug-postgres`.
3. Build the image on the Dokploy host (`docker build -t $slug-app:latest .`) or push to a registry and reference it in `app.compose.yml`.
4. Create a Dokploy compose project `--source-type raw` pointing at `deploy/app.compose.yml`. Set env vars (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`).
5. Attach a Dokploy domain: `port=3000`, `service-name=app`, `domain-type=compose`, `certificate-type=none` (Cloudflare terminates TLS at the edge).
6. Deploy, wait for `done`. **Redeploy once** — Dokploy only wires Traefik labels on the second deploy after a domain attach.

## Reference implementation

Live on [`knowsuchagency/vpc-test`](https://github.com/knowsuchagency/vpc-test). Drop-in files:

- [`src/app.ts`](https://github.com/knowsuchagency/vpc-test/blob/main/src/app.ts) — the shared Hono factory.
- [`src/index.worker.ts`](https://github.com/knowsuchagency/vpc-test/blob/main/src/index.worker.ts) + [`src/index.bun.ts`](https://github.com/knowsuchagency/vpc-test/blob/main/src/index.bun.ts) — the two entrypoints.
- [`src/lib/env-bun.ts`](https://github.com/knowsuchagency/vpc-test/blob/main/src/lib/env-bun.ts) — the `process.env → Env` shim.
- [`Dockerfile`](https://github.com/knowsuchagency/vpc-test/blob/main/Dockerfile) + [`deploy/app.compose.yml`](https://github.com/knowsuchagency/vpc-test/blob/main/deploy/app.compose.yml) — image + Dokploy compose.
- [`mise.toml`](https://github.com/knowsuchagency/vpc-test/blob/main/mise.toml) — `docker:build`, `docker:run` tasks.

Live URL: https://vpc-test-app.knowsuchagency.ai (same Postgres as the Mode 2 Worker at [vpc-test.knowsuchagency.workers.dev](https://vpc-test.knowsuchagency.workers.dev), proving the handler code is identical across runtimes).

## Verification

```bash
HOST=$slug-app.example.com

curl -sS https://$HOST/ | head -2
# expect <!doctype html> (the SPA)

curl -sS -X POST https://$HOST/api/auth/sign-up/email \
  -H 'Content-Type: application/json' \
  -d '{"name":"Dokploy","email":"dokploy@test.local","password":"dokploydokploy"}'
# expect HTTP 200 + {"token":"...","user":{...}}

curl -sS -o /dev/null -w "%{http_code}\n" https://$HOST/some/spa/route
# expect 200 (SPA fallback, index.html)
```

The same sign-up endpoint on the Worker URL should see the new user too (both hit the same Postgres).

## Deciding the Worker's fate

The Worker + Hyperdrive + Access tunnel are off the hot path once traffic flips. Three options:

- **Keep them (recommended for first cutover).** Parallel deploy. Roll back by flipping DNS.
- **Demote to a fallback.** Leave Hyperdrive + tunnel running. Delete only the Dokploy app compose on rollback.
- **Retire them.** `wrangler delete`, `wrangler hyperdrive delete <id>`, tear down the tunnel. Destructive — do this once confident.

Object storage (if added via [`self-hosted-object-storage.md`](self-hosted-object-storage.md)) keeps working in either direction: Mode 2 reaches versitygw via the Workers VPC binding; Mode 3 reaches it directly on `dokploy-network`. Same backing store either way.

## Gotchas

- `src/index.bun.ts` must run drizzle migrations **before** `app.fetch` is exported — Bun evaluates the module top-to-bottom, and any request arriving mid-migration will race. The vpc-test reference uses a small startup block with `max: 1` that closes the pool after.
- Dokploy's Traefik labels are only attached after the **second** compose deploy following a domain attach. Plan for the second deploy.
- Cloudflare origin certificates live in Dokploy already — use `certificate-type=none`, not Let's Encrypt. Let's Encrypt through the proxy fails the HTTP-01 challenge.
- `tsconfig.json` must include `"bun"` in `types`, otherwise `process.env`, `Bun.*`, etc. are untyped.

## Rollback (within first 24h)

Point DNS for `$slug-app.example.com` at the Worker URL (CNAME) or drop the Dokploy app compose. The DB stack is untouched; traffic returns to the Worker path immediately.
