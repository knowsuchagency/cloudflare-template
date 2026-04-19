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

## Developing this template

The template source lives under `template/`. Files ending in `.jinja` are rendered; everything else is copied verbatim.

Regenerate into a scratch dir to smoke-test:
```bash
uvx copier copy --trust . /tmp/smoke-test --data project_slug=smoke-test
```
