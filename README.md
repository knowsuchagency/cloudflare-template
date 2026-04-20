# cloudflare-better-auth-d1 (copier template)

[Copier](https://copier.readthedocs.io/) template for a Cloudflare Worker that serves Better Auth + a shadcn/ui login SPA, backed by Cloudflare D1.

Generated projects contain:
- Hono Worker with Better Auth mounted at `/api/auth/*`, `drizzle-orm/d1` adapter
- Vite React SPA (shadcn preset `buFznsW`, radix-lyra, phosphor icons) served via the Worker's `assets` binding
- Generated drizzle schema + SQL migration for the four better-auth tables (user, session, account, verification)
- `wrangler.jsonc` with D1 binding, SPA fallback, and `run_worker_first: ["/api/*"]`

## Usage

```bash
uvx copier copy gh:<owner>/<this-repo> ./my-auth-app
# or from a local checkout:
uvx copier copy path/to/this-template ./my-auth-app
```

You'll be asked for:
- `project_slug` — kebab-case name for the Worker and package
- `app_title` / `app_tagline` — text shown in the login card
- `worker_name` / `d1_database_name` — defaults derived from `project_slug`

Post-generation, copier runs `bun install`, `cd web && bun install && bun run build`, and `wrangler types`. Follow the message printed afterwards to create the D1 database and deploy.

## Self-hosting strategy

The default rendered project is vanilla Cloudflare + D1 — right for ~90% of projects. When it isn't, a rendered project can move selected pieces (DB, object storage, runtime) onto your own infra without a rewrite. [`docs/README.md`](docs/README.md) is the umbrella doc: what can move, why you'd reach for each escape hatch, and the cost / trade-off shape of each mode.

Mechanical execution lives under `migrations/`, designed to be handed off to a coding agent:

- [`migrations/01-d1-to-hybrid.md`](migrations/01-d1-to-hybrid.md) — swap D1 for self-hosted Postgres reached by the Worker via Hyperdrive + a Cloudflare Tunnel (Worker stays).
- [`migrations/02-hybrid-to-dokploy.md`](migrations/02-hybrid-to-dokploy.md) — swap the Worker for a Bun + Hono container on Dokploy serving both `/api/*` and the SPA.
- [`docs/self-hosted-object-storage.md`](docs/self-hosted-object-storage.md) — add an S3-compatible gateway (versitygw) reached by the Worker over a Workers VPC `vpc_services` binding on the same tunnel.

Each playbook ships with drop-in scaffold files in its sibling directory. Proven end-to-end on [`knowsuchagency/vpc-test`](https://github.com/knowsuchagency/vpc-test). See [`docs/README.md`](docs/README.md) for the decision framework or [`migrations/README.md`](migrations/README.md) for the agent-handoff format.

## Developing this template

The template source lives under `template/`. Files ending in `.jinja` are rendered; everything else is copied verbatim.

Regenerate into a scratch dir to smoke-test:
```bash
uvx copier copy --trust . /tmp/smoke-test --data project_slug=smoke-test
```
