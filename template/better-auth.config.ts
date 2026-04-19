import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuthOptions } from "./src/lib/better-auth/options";

const sqlite = new Database(":memory:");
const db = drizzle(sqlite);

export const auth = betterAuth({
  ...betterAuthOptions,
  database: drizzleAdapter(db, { provider: "sqlite" }),
  secret: "placeholder-for-schema-generation",
});
