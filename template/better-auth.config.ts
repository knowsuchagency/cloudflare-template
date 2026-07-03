import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";
import { betterAuthOptions } from "./src/lib/better-auth/options";

const sqlite = new Database(":memory:");
const db = drizzle(sqlite);

export const auth = betterAuth({
  ...betterAuthOptions,
  database: drizzleAdapter(db, { provider: "sqlite" }),
  secret: "placeholder-for-schema-generation",
  plugins: [
    // Schema-emit only: makes the CLI generate `user.stripe_customer_id` and
    // the `subscription` table. The runtime plugin (with real env-scoped
    // config) lives in src/lib/better-auth/stripe.ts.
    stripe({
      stripeClient: new Stripe("sk_test_placeholder_for_schema_generation"),
      stripeWebhookSecret: "whsec_placeholder",
      createCustomerOnSignUp: true,
      subscription: { enabled: true, plans: [] },
    }),
  ],
});
