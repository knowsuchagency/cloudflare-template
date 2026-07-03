// Secrets set via `wrangler secret put` aren't in wrangler.jsonc, so
// `wrangler types` can't see them — declare them here. Newer wrangler emits
// the bindings into a global `interface Env` *and* a separate `Cloudflare.Env`
// (both extending the generated base), so the secret must be merged into both:
// the auth() factory + Hono `Bindings` use the global `Env`.
interface Env {
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_TRUSTED_ORIGINS?: string;
  // Stripe secrets are optional: when STRIPE_SECRET_KEY is unset the stripe
  // plugin is skipped entirely (auth() in src/lib/better-auth/index.ts) so a
  // fresh project works before billing is configured.
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  // Price IDs live in wrangler.jsonc `vars` (filled by `mise run
  // stripe:bootstrap`); declared here too so typecheck doesn't depend on
  // typegen ordering.
  STRIPE_PRO_PRICE_ID: string;
  STRIPE_METERED_PRICE_ID: string;
}

declare namespace Cloudflare {
  interface Env {
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_TRUSTED_ORIGINS?: string;
    STRIPE_SECRET_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    STRIPE_PRO_PRICE_ID: string;
    STRIPE_METERED_PRICE_ID: string;
  }
}
