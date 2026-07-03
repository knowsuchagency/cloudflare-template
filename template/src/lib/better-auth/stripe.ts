import Stripe from "stripe";
import { stripe } from "@better-auth/stripe";
import { PRO_INCLUDED_TOKENS } from "../billing/constants";

// Stripe client for Workers: fetch HTTP client (no Node http) and an explicit
// API version so SDK upgrades don't silently change wire behavior.
export const stripeClient = (env: Env) =>
  new Stripe(env.STRIPE_SECRET_KEY ?? "", {
    apiVersion: "2026-06-24.dahlia",
    httpClient: Stripe.createFetchHttpClient(),
  });

// Runtime Better Auth plugin. Only mounted when STRIPE_SECRET_KEY is set —
// see auth() in ./index.ts. The schema-emit twin (placeholder client) lives
// in better-auth.config.ts at the repo root.
export const stripePlugin = (env: Env) =>
  stripe({
    stripeClient: stripeClient(env),
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET ?? "",
    createCustomerOnSignUp: true,
    subscription: {
      enabled: true,
      plans: [
        {
          name: "pro",
          priceId: env.STRIPE_PRO_PRICE_ID,
          limits: { includedTokens: PRO_INCLUDED_TOKENS },
          // The metered overage price rides the same Checkout session as the
          // flat base price. Metered line items MUST NOT carry a quantity —
          // Stripe rejects it. The plugin spreads this verbatim into
          // checkout line_items.
          lineItems: [{ price: env.STRIPE_METERED_PRICE_ID }],
        },
      ],
    },
  });
