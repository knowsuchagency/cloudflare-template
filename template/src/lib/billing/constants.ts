// Billing knobs. The Stripe-side objects (meter, product, prices) are created
// by `mise run stripe:bootstrap` (scripts/stripe-bootstrap.ts) — keep these
// numbers in sync with that script if you change the plan shape.

/** Tokens a signed-in user without a subscription may burn per UTC calendar month. */
export const FREE_MONTHLY_TOKENS = 50_000;

/** Tokens included in the Pro plan before per-token overage kicks in (priced in Stripe's graduated tiers, not here). */
export const PRO_INCLUDED_TOKENS = 1_000_000;

/** Stripe Billing Meter event name — must match the meter created by stripe-bootstrap. */
export const METER_EVENT_NAME = "ai_tokens";

/** UTC calendar-month bucket key, e.g. "2026-07". */
export const currentPeriod = (d = new Date()) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

/** Pure gate check — free-tier users are blocked once their bucket hits the cap. */
export const isFreeQuotaExhausted = (tokensUsed: number) =>
  tokensUsed >= FREE_MONTHLY_TOKENS;
