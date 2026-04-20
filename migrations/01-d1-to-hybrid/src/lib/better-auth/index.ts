import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "../../db/schema";
import { betterAuthOptions } from "./options";

export const auth = (env: Env) => {
  // Hyperdrive exposes a pooled connection string. fetch_types: false is
  // required on Workers because Hyperdrive does not support the extended
  // query protocol used by postgres.js to introspect types.
  //
  // ssl accepts self-signed certs — postgres running on Dokploy uses an
  // auto-generated self-signed cert (see deploy/db-tunnel.compose.yml) and
  // Hyperdrive only talks to cloudflared's WebSocket proxy (TLS handled by
  // CF itself), so relaxing origin cert verification is safe in both modes.
  const sql = postgres(env.HYPERDRIVE.connectionString, {
    max: 5,
    fetch_types: false,
    ssl: { rejectUnauthorized: false },
  });
  const db = drizzle(sql, { schema });

  return betterAuth({
    ...betterAuthOptions,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
  });
};
