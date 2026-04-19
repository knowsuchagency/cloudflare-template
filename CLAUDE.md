# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## This is a Copier template, not an application

The root contains `copier.yml` and a `template/` subdirectory. Generated projects come from rendering `template/`, NOT the root.

- Edit source under `template/`
- Files ending `.jinja` are rendered; everything else is copied verbatim
- The currently templatized files are:
  `template/package.json.jinja`, `template/wrangler.jsonc.jinja`,
  `template/web/package.json.jinja`, `template/web/index.html.jinja`,
  `template/web/src/components/login-card.tsx.jinja`,
  `template/src/lib/better-auth/options.ts.jinja`,
  `template/CLAUDE.md.jinja`

If you need to inject a new variable somewhere, add it to `copier.yml` questions and rename the target file with a `.jinja` suffix (`git mv`) before editing. Copier's default template suffix is configured as `.jinja` — files without the suffix are NOT rendered, even if they contain `{{ }}`.

## Smoke test the template

```bash
rm -rf /tmp/smoke && uvx copier copy --trust --defaults --data project_slug=smoke-test . /tmp/smoke
(cd /tmp/smoke && bun run typecheck && cd web && bun run typecheck && bun run build)
```

`--trust` is required because the template runs `_tasks` (bun install, wrangler types). Without it copier refuses to execute them.

## The generated project

When someone renders this template, they get a Hono Worker + Vite React SPA that pairs Better Auth with Cloudflare D1. Architecture details (layout, schema flow, deploy, gotchas) live in `template/CLAUDE.md.jinja` so the generated project carries its own CLAUDE.md — read that file when you need to understand the runtime behaviour, not this one.

## Don't

- Don't edit files at the repo root expecting them to land in generated projects. Root is template-machinery only.
- Don't remove the `database_id` placeholder (`REPLACE_WITH_ID_FROM_wrangler_d1_create`) from `template/wrangler.jsonc.jinja` — it's the signal to users that they must `wrangler d1 create` first.
