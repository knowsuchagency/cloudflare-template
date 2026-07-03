import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig(async () => {
  const here = import.meta.dirname;
  const migrations = await readD1Migrations(path.join(here, "drizzle"));
  // workerd has no fs — read wrangler.jsonc here so the safeguard test can
  // inspect the prod fan-out surfaces (queues, services, DOs, ...) at runtime.
  const wranglerConfigSource = readFileSync(path.join(here, "wrangler.jsonc"), "utf8");

  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            WRANGLER_CONFIG_SOURCE: wranglerConfigSource,
            // Better Auth secret + canonical URL. Tests send `Origin: http://localhost`
            // so Better Auth's CSRF check passes against this URL.
            BETTER_AUTH_SECRET: "test-secret-not-for-prod-aaaaaaaaaaaaaaaaaaaaaa",
            BETTER_AUTH_URL: "http://localhost",
            // Dummy Stripe config so the @better-auth/stripe plugin mounts in
            // tests (webhook route, subscription endpoints, customer-on-signup).
            // All api.stripe.com traffic is intercepted by fetchMock in
            // test/setup.ts — nothing reaches the real Stripe.
            STRIPE_SECRET_KEY: "sk_test_dummy_for_vitest",
            STRIPE_WEBHOOK_SECRET: "whsec_test_dummy",
            STRIPE_PRO_PRICE_ID: "price_pro_test",
            STRIPE_METERED_PRICE_ID: "price_metered_test",
          },
        },
      }),
    ],
    test: {
      setupFiles: ["./test/setup.ts"],
      // Password hashing (scrypt) under workerd is slow, and multi-step e2e
      // flows (e.g. test/password-reset.test.ts) chain several hashing requests
      // — the 5s default times out on slower CI runners.
      testTimeout: 20_000,
    },
  };
});
