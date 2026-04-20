# Migrations

Handoff-ready playbooks for moving a project rendered from `cloudflare-template` away from the default vanilla-Cloudflare+D1 stack, in two optional steps.

- **[01-d1-to-hybrid](01-d1-to-hybrid.md)** — swap D1 for self-hosted Postgres behind a Cloudflare Tunnel, accessed by the Worker via a Hyperdrive binding over Cloudflare Access. Worker stays.
- **[02-hybrid-to-dokploy](02-hybrid-to-dokploy.md)** — swap the Worker for a Bun + Hono container running on Dokploy next to the Postgres. SPA moves into the Bun container.

```
Default (90% case)           Mode 2: Hybrid              Mode 3: Dokploy self-hosted
─────────────────            ──────────────              ───────────────────────────
CF Worker                    CF Worker                   Bun + Hono container
  └── D1 (SQLite)              └── Hyperdrive              └── Postgres (same
                                   └── CF Tunnel                 Dokploy network)
                                       └── cloudflared
                                           └── Postgres
```

## How to use these with an agent

Each playbook is structured for mechanical execution:

1. **Prerequisites** — what state the repo / account must be in before step 1.
2. **Inventory** — which files are created, modified, deleted.
3. **Code changes** — ordered steps. Each points at a verbatim-copyable scaffold file in this directory (or shows a patch block inline).
4. **Infra changes** — ordered steps with the exact CLI / API calls.
5. **Verification** — curls / queries that must return the expected output.
6. **Rollback** — the reverse path.

Hand the `.md` file to an agent along with the repo root path and the required env vars. The scaffold files referenced by relative path (e.g. `01-d1-to-hybrid/deploy/db-tunnel.compose.yml`) live alongside the playbook — fetch them via `git clone https://github.com/knowsuchagency/cloudflare-template` and copy in.

## Placeholders in scaffolds

Scaffolds use `PROJECT_SLUG` as a literal placeholder (matches copier's `project_slug`). Playbooks instruct the agent to `sed -i "s/PROJECT_SLUG/${project_slug}/g"` before committing.

## Proof

Each playbook has been executed end-to-end on the `knowsuchagency/vpc-test` project:

- Playbook 01 live result: https://vpc-test.knowsuchagency.workers.dev (Worker via Hyperdrive → CF Tunnel → Dokploy postgres)
- Playbook 02 live result: https://vpc-test-app.knowsuchagency.ai (Bun + Hono on Dokploy, same postgres)

Scaffolds in this directory were lifted directly from that repo after verification.
