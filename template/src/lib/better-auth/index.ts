import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../../db/schema";
import { betterAuthOptions } from "./options";

export const auth = (env: Env) => {
  const db = drizzle(env.DB, { schema });

  return betterAuth({
    ...betterAuthOptions,
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
  });
};
