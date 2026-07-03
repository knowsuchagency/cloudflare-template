/**
 * End-to-end billing surface via SELF.fetch().
 *
 * All Stripe traffic is intercepted by fetchMock (test/setup.ts activates it
 * and disables real network) — these tests pin the Worker-side behavior:
 *   1. GET /api/usage is session-gated and reports the free-tier defaults.
 *   2. The free-tier gate 402s POST /api/chat once ai_usage hits the cap
 *      (before any c.env.AI access, so no GPU is needed).
 *   3. An active `subscription` row flips /api/usage to the pro plan — and
 *      un-gates chat past the free cap (the request then dies at the AI
 *      binding, proving it got past the 402 gate).
 *   4. The @better-auth/stripe webhook route is mounted and verifies
 *      signatures under workerd (bad signature → 4xx, not 404/500).
 *   5. /api/auth/subscription/upgrade produces a Stripe Checkout session
 *      whose line_items carry the flat price WITH quantity and the metered
 *      price WITHOUT quantity (Stripe rejects quantity on metered prices).
 */
import { env, SELF } from "cloudflare:test";
import { describe, expect, test } from "vitest";
import { currentPeriod, FREE_MONTHLY_TOKENS } from "../src/lib/billing/constants";
import { onStripe } from "./stripe-mock";

const ORIGIN = "http://localhost";

const cookiesFrom = (res: Response): string =>
  res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

const post = (path: string, body: unknown, cookie?: string): Promise<Response> =>
  SELF.fetch(`${ORIGIN}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: ORIGIN,
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });

const get = (path: string, cookie?: string): Promise<Response> =>
  SELF.fetch(`${ORIGIN}${path}`, {
    headers: { origin: ORIGIN, ...(cookie ? { cookie } : {}) },
  });

const creds = { email: "carol@test.example", password: "test1234!", name: "Carol" } as const;

async function signUp(): Promise<{ cookie: string; userId: string }> {
  const res = await post("/api/auth/sign-up/email", creds);
  expect(res.status, `sign-up failed: ${await res.clone().text()}`).toBe(200);
  const cookie = cookiesFrom(res);
  const me = await get("/api/me", cookie);
  const body = (await me.json()) as { user: { id: string } };
  return { cookie, userId: body.user.id };
}

const seedUsage = (userId: string, tokens: number) =>
  env.DB.prepare(
    `INSERT INTO ai_usage (user_id, period, tokens_used, updated_at)
     VALUES (?, ?, ?, ?)`,
  )
    .bind(userId, currentPeriod(), tokens, Date.now())
    .run();

const seedActiveSubscription = (userId: string) =>
  env.DB.prepare(
    `INSERT INTO subscription (id, plan, reference_id, stripe_customer_id, stripe_subscription_id, status)
     VALUES ('sub_row_test', 'pro', ?, 'cus_test', 'sub_test', 'active')`,
  )
    .bind(userId)
    .run();

describe("usage endpoint", () => {
  test("GET /api/usage without a session returns 401", async () => {
    const res = await get("/api/usage");
    expect(res.status).toBe(401);
  });

  test("fresh account reports the free plan with zero usage", async () => {
    const { cookie } = await signUp();
    const res = await get("/api/usage", cookie);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({
      plan: "free",
      tokensUsed: 0,
      allotment: FREE_MONTHLY_TOKENS,
      period: currentPeriod(),
      subscription: null,
    });
  });

  test("an active subscription flips the plan to pro", async () => {
    const { cookie, userId } = await signUp();
    await seedActiveSubscription(userId);
    await seedUsage(userId, 123_456);

    const res = await get("/api/usage", cookie);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({
      plan: "pro",
      tokensUsed: 123_456,
      allotment: 1_000_000,
    });
    expect(body.subscription).toMatchObject({ status: "active" });
  });
});

describe("free-tier chat gate", () => {
  const chatBody = {
    messages: [
      { id: "m1", role: "user", parts: [{ type: "text", text: "hi" }] },
    ],
  };

  test("free user at the cap gets 402 free_quota_exhausted", async () => {
    const { cookie, userId } = await signUp();
    await seedUsage(userId, FREE_MONTHLY_TOKENS);

    const res = await post("/api/chat", chatBody, cookie);
    expect(res.status).toBe(402);
    expect(await res.json()).toMatchObject({
      code: "free_quota_exhausted",
      tokensUsed: FREE_MONTHLY_TOKENS,
      allotment: FREE_MONTHLY_TOKENS,
    });
  });

  test("free user under the cap is not 402'd", async () => {
    const { cookie, userId } = await signUp();
    await seedUsage(userId, FREE_MONTHLY_TOKENS - 1);

    // Past the gate the route reaches env.AI, which vitest-pool-workers
    // can't serve — any outcome except 401/400/402 proves the gate opened.
    const res = await post("/api/chat", chatBody, cookie).catch(() => null);
    if (res) expect([400, 401, 402]).not.toContain(res.status);
  });

  test("subscriber past the free cap is not 402'd", async () => {
    const { cookie, userId } = await signUp();
    await seedActiveSubscription(userId);
    await seedUsage(userId, FREE_MONTHLY_TOKENS * 10);

    const res = await post("/api/chat", chatBody, cookie).catch(() => null);
    if (res) expect([400, 401, 402]).not.toContain(res.status);
  });
});

describe("stripe plugin endpoints", () => {
  test("webhook route is mounted and rejects a bad signature", async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/auth/stripe/webhook`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=1,v1=garbage",
      },
      body: JSON.stringify({ type: "customer.subscription.updated" }),
    });
    expect(res.status).not.toBe(404); // route exists
    expect(res.status).toBeGreaterThanOrEqual(400); // signature rejected
    expect(res.status).toBeLessThan(500); // async WebCrypto verify works under workerd
  });

  test("upgrade creates a Checkout session with the metered line item sans quantity", async () => {
    const { cookie } = await signUp();

    let checkoutBody = "";
    onStripe(
      "POST",
      (p) => p.startsWith("/v1/checkout/sessions"),
      (call) => {
        checkoutBody = call.body;
        return {
          id: "cs_test",
          object: "checkout.session",
          url: "https://checkout.stripe.com/c/pay/cs_test",
        };
      },
    );
    // The upgrade flow may also list existing subscriptions.
    onStripe(
      "GET",
      (p) => p.startsWith("/v1/subscriptions"),
      () => ({ object: "list", data: [], has_more: false }),
    );

    const res = await post(
      "/api/auth/subscription/upgrade",
      { plan: "pro", successUrl: "/billing", cancelUrl: "/billing" },
      cookie,
    );
    expect(res.status, `upgrade failed: ${await res.clone().text()}`).toBe(200);
    const body = (await res.json()) as { url?: string };
    expect(body.url).toContain("checkout.stripe.com");

    // Stripe bodies are form-encoded. The flat price carries a quantity; the
    // metered price must not (Stripe rejects it).
    const decoded = decodeURIComponent(checkoutBody);
    expect(decoded).toContain("price_pro_test");
    expect(decoded).toContain("price_metered_test");
    const meteredIndex = [...decoded.matchAll(/line_items\[(\d+)\]\[price\]=([^&]+)/g)].find(
      (m) => m[2] === "price_metered_test",
    )?.[1];
    expect(meteredIndex, `no metered line item in: ${decoded}`).toBeDefined();
    expect(decoded).not.toContain(`line_items[${meteredIndex}][quantity]`);
  });
});
