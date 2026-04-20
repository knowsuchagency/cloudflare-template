# Self-hosting strategy

This template defaults to a pure-Cloudflare stack — Worker + D1 + the SPA served through the `ASSETS` binding. That's right for most projects most of the time. This directory documents the **escape hatches**: the fact that a rendered project can move selected pieces (or all of it) onto your own infra without rewriting the application code.

> TL;DR — stay with the default (Mode 1) unless you have a specific reason. The reasons and the paths are documented below.

## The pieces, and what can move

A rendered project is made of four independent pieces:

| Piece           | Default (Mode 1)         | Self-hosted alternative                   | How to move it                                                                 |
|-----------------|--------------------------|-------------------------------------------|--------------------------------------------------------------------------------|
| Runtime         | Cloudflare Worker        | Bun + Hono container on Dokploy           | [`migrations/02-hybrid-to-dokploy.md`](../migrations/02-hybrid-to-dokploy.md)  |
| Relational DB   | D1 (SQLite)              | Postgres behind a Cloudflare Tunnel       | [`migrations/01-d1-to-hybrid.md`](../migrations/01-d1-to-hybrid.md)            |
| Object storage  | *(none by default)*      | versitygw (S3-compatible) + Workers VPC   | [`self-hosted-object-storage.md`](self-hosted-object-storage.md)               |
| Edge assets     | Cloudflare Assets        | `hono/bun` serveStatic (bundled in Mode 3)| (part of the Mode-3 playbook)                                                  |

The pieces are independent. You can move just the DB (Mode 2). You can move everything (Mode 3). You can add self-hosted object storage on top of any mode (the third row, this is a new capability — see the dedicated doc).

## The three named modes

- **Mode 1 — Full CF (default).** Worker + D1 + Assets. `mise init && mise deploy` renders a deployed app. No infra to run.
- **Mode 2 — Hybrid.** Worker + `env.HYPERDRIVE` → Cloudflare Tunnel (Access-gated) → self-hosted Postgres. SPA stays on CF Assets. Keeps edge latency and cache behaviour; moves only the data layer. Execute via [`migrations/01-d1-to-hybrid.md`](../migrations/01-d1-to-hybrid.md).
- **Mode 3 — Dokploy.** Bun + Hono container, Postgres on the same `dokploy-network` overlay. No CF runtime or tunnel in the data path. Maximum sovereignty. Execute via [`migrations/02-hybrid-to-dokploy.md`](../migrations/02-hybrid-to-dokploy.md) after Mode 2.

Add self-hosted object storage to **any mode** via [`self-hosted-object-storage.md`](self-hosted-object-storage.md).

## When to reach for each

### Stay in Mode 1 if
- Traffic is edge-friendly: bursty, cacheable, geo-distributed readers
- Data has no residency or sovereignty constraints
- You want zero ops and per-request billing
- D1's row-read limits aren't in sight yet

### Move to Mode 2 (DB only) if
- Compliance (HIPAA, SOC 2, residency) requires data at rest on infra you control
- You need pg-specific features: RLS, extensions, JSONB operators, triggers, LISTEN/NOTIFY, full-text search
- You've projected D1 per-row-read costs past the break-even with a flat-cost Postgres
- You want your own `pg_dump` + backup regime
- You want the Worker's edge distribution + low cold-start to stay — only the data moves

### Move to Mode 3 (everything) if
- Network egress between CF and your infra dominates cost or latency
- You want long-running background work (workerd V8 isolates aren't a fit)
- You already run Dokploy for other services — the operational surface is nearly free for you
- You want a single observability story (Docker logs) instead of CF Logs + host logs

### Add self-hosted object storage if
- You want S3 semantics without R2 (compliance, egress cost, local testing parity)
- You want POSIX-level bucket access (rsync, restic, ZFS snapshots)
- You already have a Cloudflare Tunnel up for Mode 2 — the same tunnel can carry a second HTTP service for free

## The architectural invariant

The template's Hono handlers are written once and run unchanged in all modes. `src/app.ts` exports a `createApp(envProvider?)` factory consumed by both `src/index.worker.ts` (Workers entry) and `src/index.bun.ts` (Bun entry). Mode 3 synthesises the `Env` shape the Worker expects from `process.env` via `src/lib/env-bun.ts`.

When adding self-hosted object storage the same invariant holds: the handler calls `c.env.S3.fetch(signedRequest)`. On Workers `env.S3` is a `vpc_services` binding; on Bun it's a global-fetch shim. Handler code is identical.

This is deliberate. It means: you can render a project today into Mode 1, ship, grow, and move pieces off Cloudflare as requirements appear — without a rewrite.

## Cost posture

| Mode   | You pay CF for              | You pay yourself for                 | Scales with                        |
|--------|-----------------------------|--------------------------------------|------------------------------------|
| Mode 1 | Workers requests, D1 reads, Assets bandwidth | —                          | Per-request + per-row              |
| Mode 2 | Workers requests, Tunnel (free), Access (free up to 50 users), Hyperdrive (free) | Postgres VM + Dokploy host | Workers requests + Postgres size   |
| Mode 3 | DNS + Tunnel egress (optional, for remote psql) | Dokploy host + Postgres + runtime  | Flat — one bill for the whole host |
| + S3   | (Workers VPC is free in beta, otherwise no change) | versitygw CPU + disk           | Disk used                          |

Note: prices change. Verify at point-in-time.

## What you give up

Moving off CF in any direction costs you some combination of: edge-distributed reads, zero ops, the global anycast network, per-request billing. The template makes these movable, not free.

- **Mode 2:** you own a DB. That means backups, monitoring, upgrades, patching.
- **Mode 3:** you also own the runtime. No more CF DDoS protection in front of the app origin — put Traefik or similar in front; Cloudflare can still proxy the hostname as an L7 DDoS shield.
- **Self-hosted S3:** you own durability. versitygw is POSIX — back up the data dir. No automatic replication.

## Proof

Every path in this directory has been executed end-to-end on the [`knowsuchagency/vpc-test`](https://github.com/knowsuchagency/vpc-test) project:

- Mode 2 live: https://vpc-test.knowsuchagency.workers.dev (Worker → Hyperdrive → CF Tunnel → Dokploy postgres)
- Mode 3 live: https://vpc-test-app.knowsuchagency.ai (Bun + Hono on Dokploy, same postgres)
- Self-hosted S3 live on both modes: `/api/s3/ping` returns the same `ListAllMyBucketsResult` XML from Workers and from the Bun container, hitting a shared versitygw backing store.

Scaffolds in `../migrations/` were lifted from that repo after verification. The configuration example in [`self-hosted-object-storage.md`](self-hosted-object-storage.md) was likewise lifted from it.
