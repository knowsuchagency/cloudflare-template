# Mode 3 (Dokploy self-hosted) runtime: Bun serving /api/* + SPA on :3000.
# Mode 2 (Hybrid) still deploys via `wrangler deploy` using src/index.worker.ts
# as the entrypoint — this image is not used there.

# ── builder ──────────────────────────────────────────────────────────────────
FROM oven/bun:1.3.3 AS builder
WORKDIR /app

# Worker deps — --production skips @better-auth/cli (which transitively
# requires better-sqlite3's native compile) since CLI tooling is never used
# at runtime. drizzle-orm/postgres-js/migrator covers startup migrations.
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

# Web deps.
COPY web/package.json web/bun.lock ./web/
RUN cd web && bun install --frozen-lockfile

# Source + build the Vite SPA.
COPY . .
RUN cd web && bun run build

# ── runtime ──────────────────────────────────────────────────────────────────
FROM oven/bun:1.3.3-slim
WORKDIR /app

# Copy installed deps + only the artefacts the Bun entrypoint needs at runtime.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/web/dist ./web/dist
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["bun", "run", "src/index.bun.ts"]
