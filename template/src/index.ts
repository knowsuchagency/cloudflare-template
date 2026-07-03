import { Hono } from "hono";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { auth } from "./lib/better-auth";
import {
  FREE_MONTHLY_TOKENS,
  PRO_INCLUDED_TOKENS,
  currentPeriod,
  isFreeQuotaExhausted,
} from "./lib/billing/constants";
import { getBillingState, recordUsage } from "./lib/billing/usage";

const app = new Hono<{ Bindings: Env }>();

app.on(["GET", "POST"], "/api/auth/*", (c) => {
  return auth(c.env).handler(c.req.raw);
});

app.get("/api/me", async (c) => {
  const session = await auth(c.env).api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ authenticated: false }, 401);
  return c.json({ authenticated: true, user: session.user });
});

// Streaming chatbot. Auth-gated (anonymous traffic must not burn AI neurons),
// stateless (the client re-sends the full transcript each turn — no chat
// transcript table), and routed through the "default" AI Gateway for
// caching/observability. Token usage IS persisted (ai_usage) and metered
// into Stripe for subscribers — see src/lib/billing/.
// The 401/400/402 guards run before any c.env.AI access, so they're
// exercisable under vitest-pool-workers (which has no GPU) — see
// test/chat.test.ts and test/billing.test.ts.
app.post("/api/chat", async (c) => {
  const session = await auth(c.env).api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const { messages } = (await c.req.json()) as { messages?: UIMessage[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: "messages array required" }, 400);
  }

  // Free-tier gate. Subscribers are never blocked — Stripe's graduated tiers
  // price anything past the included allotment as overage instead. A request
  // that starts under the cap streams to completion; the *next* one is 402'd.
  const billing = await getBillingState(c.env, session.user.id);
  if (!billing.subscribed && isFreeQuotaExhausted(billing.tokensUsed)) {
    return c.json(
      {
        error: "Payment Required",
        code: "free_quota_exhausted",
        tokensUsed: billing.tokensUsed,
        allotment: FREE_MONTHLY_TOKENS,
      },
      402,
    );
  }

  const workersai = createWorkersAI({ binding: c.env.AI, gateway: { id: "default" } });
  const result = streamText({
    model: workersai("@cf/meta/llama-4-scout-17b-16e-instruct"),
    messages: await convertToModelMessages(messages),
    onFinish: ({ usage }) => {
      const tokens = usage.totalTokens ?? 0;
      if (tokens > 0) {
        // Post-response accounting: D1 upsert for everyone, plus a Stripe
        // meter event for subscribers. Fire-and-forget — a failure here
        // under-bills, it never breaks the chat.
        c.executionCtx.waitUntil(
          recordUsage(c.env, {
            userId: session.user.id,
            tokens,
            subscribed: billing.subscribed,
            stripeCustomerId: billing.stripeCustomerId,
          }).catch((err) => console.error("usage metering failed", err)),
        );
      }
    },
  });
  return result.toUIMessageStreamResponse();
});

// Current-period usage snapshot for the web UI (chat header meter, billing
// page). Everything comes from D1 — no Stripe API call on this path.
app.get("/api/usage", async (c) => {
  const session = await auth(c.env).api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const billing = await getBillingState(c.env, session.user.id);
  return c.json({
    plan: billing.subscribed ? "pro" : "free",
    tokensUsed: billing.tokensUsed,
    allotment: billing.subscribed ? PRO_INCLUDED_TOKENS : FREE_MONTHLY_TOKENS,
    period: currentPeriod(),
    subscription: billing.subscription,
  });
});

export default app;
