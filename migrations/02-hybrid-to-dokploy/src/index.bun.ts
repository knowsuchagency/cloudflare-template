import { serveStatic } from "hono/bun";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createApp } from "./app";
import { buildBunEnv } from "./lib/env-bun";

// Apply pending drizzle migrations once on startup. `max: 1` keeps the pool
// small and we close it after. Runs idempotently — already-applied
// migrations are no-ops.
{
  const sql = postgres(process.env.DATABASE_URL!, {
    max: 1,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
  } finally {
    await sql.end();
  }
}

// createApp registers a first-hit middleware that populates c.env so the
// shared handlers in src/app.ts can call auth(c.env) identically to workerd.
const app = createApp(buildBunEnv);

// SPA: serve files from web/dist, fall back to index.html for any non-/api
// path that doesn't match a file (SPA client-side routing).
app.use("/*", serveStatic({ root: "./web/dist" }));
app.get("*", serveStatic({ path: "./web/dist/index.html" }));

export default {
  port: Number(process.env.PORT ?? 3000),
  fetch: app.fetch,
};
