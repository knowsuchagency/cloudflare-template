import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuthOptions } from "./src/lib/better-auth/options";

// pg.Pool lazy-connects, so instantiating it against a placeholder URL never
// opens a socket. @better-auth/cli only reads the adapter shape to emit the
// drizzle table definitions into src/db/schema.ts.
const pool = new Pool({ connectionString: "postgresql://schema-gen:schema-gen@localhost:5432/schema-gen" });
const db = drizzle(pool);

export const auth = betterAuth({
  ...betterAuthOptions,
  database: drizzleAdapter(db, { provider: "pg" }),
  secret: "placeholder-for-schema-generation",
});
