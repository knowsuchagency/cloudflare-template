// Maps the Bun/Node runtime's process.env into the Cloudflare-Worker-shaped
// Env object that src/lib/better-auth/index.ts expects. This lets the exact
// same Hono handlers run under workerd (Mode 2) and Bun (Mode 3) without
// any changes to the auth code path.

export function buildBunEnv(): Env {
  const connectionString = mustGet("DATABASE_URL");

  return {
    // Hyperdrive doesn't exist on Bun — we synthesise the shape postgres.js
    // reads from (env.HYPERDRIVE.connectionString) and point it at the real pg.
    HYPERDRIVE: { connectionString } as Hyperdrive,
    BETTER_AUTH_SECRET: mustGet("BETTER_AUTH_SECRET"),
    BETTER_AUTH_URL: mustGet("BETTER_AUTH_URL"),
  } as Env;
}

function mustGet(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}
