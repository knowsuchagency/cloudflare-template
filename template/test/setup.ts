import { applyD1Migrations, env } from "cloudflare:test";
import { beforeAll, beforeEach } from "vitest";
import { installStripeMock } from "./stripe-mock";

// The stripe plugin is active under vitest (dummy STRIPE_SECRET_KEY in
// vitest.config.ts), so every sign-up fires createCustomerOnSignUp. Intercept
// all outbound fetch and mock Stripe's API — see test/stripe-mock.ts.
installStripeMock();

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

// `singleWorker: true` in vitest.config.ts shares one D1 across the whole run,
// so we reset user-data tables between cases. d1_migrations / sqlite_* / _cf_*
// are wrangler & sqlite bookkeeping and survive the truncate.
beforeEach(async () => {
  const { results } = await env.DB.prepare(
    `SELECT name FROM sqlite_master
     WHERE type = 'table'
       AND name NOT LIKE 'd1_%'
       AND name NOT LIKE 'sqlite_%'
       AND name NOT LIKE '_cf_%'`,
  ).all<{ name: string }>();
  for (const { name } of results) {
    await env.DB.prepare(`DELETE FROM "${name}"`).run();
  }
});
