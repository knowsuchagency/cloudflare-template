import { and, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../../db/schema";
import { aiUsage } from "../../db/app-schema";
import { stripeClient } from "../better-auth/stripe";
import { METER_EVENT_NAME, currentPeriod } from "./constants";

export interface BillingState {
  subscribed: boolean;
  stripeCustomerId: string | null;
  tokensUsed: number;
  subscription: {
    status: string;
    periodEnd: number | null;
    cancelAtPeriodEnd: boolean;
  } | null;
}

// One round-trip-ish snapshot of everything the chat gate and /api/usage need.
// Subscription status is read straight from the plugin-managed `subscription`
// table (kept fresh by Stripe webhooks) — no Stripe API call on the hot path.
export async function getBillingState(
  env: Env,
  userId: string,
): Promise<BillingState> {
  const db = drizzle(env.DB);

  const [sub, usage, userRow] = await Promise.all([
    db
      .select()
      .from(schema.subscription)
      .where(
        and(
          eq(schema.subscription.referenceId, userId),
          inArray(schema.subscription.status, ["active", "trialing"]),
        ),
      )
      .limit(1),
    db
      .select({ tokensUsed: aiUsage.tokensUsed })
      .from(aiUsage)
      .where(
        and(eq(aiUsage.userId, userId), eq(aiUsage.period, currentPeriod())),
      )
      .limit(1),
    db
      .select({ stripeCustomerId: schema.user.stripeCustomerId })
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1),
  ]);

  const active = sub[0];
  return {
    subscribed: Boolean(active),
    stripeCustomerId:
      active?.stripeCustomerId ?? userRow[0]?.stripeCustomerId ?? null,
    tokensUsed: usage[0]?.tokensUsed ?? 0,
    subscription: active
      ? {
          status: active.status ?? "active",
          periodEnd: active.periodEnd ? active.periodEnd.getTime() : null,
          cancelAtPeriodEnd: Boolean(active.cancelAtPeriodEnd),
        }
      : null,
  };
}

// Post-stream accounting, called via ctx.waitUntil — never blocks the response.
// D1 upsert for everyone (feeds the UI meter and the free-tier gate); a Stripe
// meter event additionally for subscribers. Stripe's graduated tiers make the
// first PRO_INCLUDED_TOKENS free, so we never compute "past the allotment?"
// here. Failure means under-billing, never over-billing; the `identifier`
// dedupes if a retry layer is ever added.
export async function recordUsage(
  env: Env,
  args: {
    userId: string;
    tokens: number;
    subscribed: boolean;
    stripeCustomerId: string | null;
  },
): Promise<void> {
  const db = drizzle(env.DB);
  await db
    .insert(aiUsage)
    .values({
      userId: args.userId,
      period: currentPeriod(),
      tokensUsed: args.tokens,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.period],
      set: {
        tokensUsed: sql`${aiUsage.tokensUsed} + ${args.tokens}`,
        updatedAt: new Date(),
      },
    });

  if (args.subscribed && args.stripeCustomerId && env.STRIPE_SECRET_KEY) {
    await stripeClient(env).billing.meterEvents.create({
      event_name: METER_EVENT_NAME,
      identifier: crypto.randomUUID(),
      payload: {
        stripe_customer_id: args.stripeCustomerId,
        value: String(args.tokens),
      },
    });
  }
}
