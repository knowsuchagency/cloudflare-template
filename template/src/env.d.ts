// Secrets set via `wrangler secret put` aren't in wrangler.jsonc, so
// `wrangler types` can't see them — declare them here. Newer wrangler emits
// the bindings into a global `interface Env` *and* a separate `Cloudflare.Env`
// (both extending the generated base), so the secret must be merged into both:
// the auth() factory + Hono `Bindings` use the global `Env`.
interface Env {
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_TRUSTED_ORIGINS?: string;
}

declare namespace Cloudflare {
  interface Env {
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_TRUSTED_ORIGINS?: string;
  }
}
