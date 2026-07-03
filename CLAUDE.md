# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## This is a Copier template, not an application

The root contains `copier.yml` and a `template/` subdirectory. Generated projects come from rendering `template/`, NOT the root.

- Edit source under `template/`
- Files ending `.jinja` are rendered; everything else is copied verbatim
- The currently templatized files are:
  `template/package.json.jinja`, `template/wrangler.jsonc.jinja`,
  `template/web/package.json.jinja`, `template/web/index.html.jinja`,
  `template/web/src/index.css.jinja`,
  `template/web/src/content/marketing.ts.jinja`,
  `template/web/src/pages/login.tsx.jinja`,
  `template/web/src/pages/signup.tsx.jinja`,
  `template/web/src/pages/forgot-password.tsx.jinja`,
  `template/web/src/pages/reset-password.tsx.jinja`,
  `template/src/lib/better-auth/options.ts.jinja`,
  `template/src/lib/email/reset-password.ts.jinja`,
  `template/CLAUDE.md.jinja`
  (run `find template -name '*.jinja'` for the authoritative, current set)

If you need to inject a new variable somewhere, add it to `copier.yml` questions and rename the target file with a `.jinja` suffix (`git mv`) before editing. Copier's default template suffix is configured as `.jinja` — files without the suffix are NOT rendered, even if they contain `{{ }}`.

## Smoke test the template

```bash
rm -rf /tmp/smoke && uvx copier copy --trust --defaults --data project_slug=smoke-test . /tmp/smoke
(cd /tmp/smoke && mise exec -- bun run typecheck && mise exec -- bun run test && cd web && mise exec -- bun run typecheck && mise exec -- bun run build)
```

`--trust` is required because the template runs `_tasks` (bun install, wrangler types). Without it copier refuses to execute them. Prefix bun with `mise exec --` so native deps (better-sqlite3) resolve against the pinned node, not whatever is on PATH.

## Regenerating generated artifacts (schema, migrations, shadcn components)

Several checked-in template files are *outputs* of tools that cannot run at the template root (`better-auth.config.ts` imports from `options.ts.jinja`; `template/` has no rendered `package.json`; `bunx shadcn add` needs a real project). The loop is **render → generate → copy back**:

```bash
rm -rf /tmp/smoke && uvx copier copy --trust --defaults --data project_slug=smoke-test . /tmp/smoke
cd /tmp/smoke
mise exec -- bun run auth:generate            # rewrites src/db/schema.ts (Better Auth CLI)
mise exec -- bunx drizzle-kit generate --name <label>   # emits drizzle/NNNN_<label>.sql + meta
(cd web && mise exec -- bunx shadcn@latest add <component>)  # answer overwrite prompts with n
# copy back: src/db/schema.ts, drizzle/NNNN_*.sql, drizzle/meta/{NNNN_snapshot,_journal}.json,
#            web/src/components/ui/*.tsx
# then: grep the copied files for "smoke-test" (must be empty), verify the new SQL is additive
#       (CI applies migrations before deploying the Worker), and diff /tmp/smoke/web/package.json
#       against template/web/package.json.jinja to merge any deps the registry added.
```

Custom (non-Better-Auth) tables belong in `template/src/db/app-schema.ts` — hand-written, merged via the `schema` array in `drizzle.config.ts`, and never touched by `auth:generate`.

## The generated project

When someone renders this template, they get a Hono Worker + Vite React SPA that pairs Better Auth with Cloudflare D1, a streaming Workers AI chat (llama-4-scout, shadcn chat components), and Stripe billing (Pro subscription with usage-based token overage via Billing Meters + a free monthly tier; dormant until a Stripe key is configured). Architecture details (layout, schema flow, billing split, deploy, gotchas) live in `template/CLAUDE.md.jinja` so the generated project carries its own CLAUDE.md — read that file when you need to understand the runtime behaviour, not this one.

## Don't

- Don't edit files at the repo root expecting them to land in generated projects. Root is template-machinery only.
- Don't remove the `database_id` placeholder (`REPLACE_WITH_ID_FROM_wrangler_d1_create`) from `template/wrangler.jsonc.jinja` — it's the signal to users that they must `wrangler d1 create` first.
