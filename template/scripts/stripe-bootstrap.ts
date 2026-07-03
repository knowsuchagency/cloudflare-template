// Bootstrap the Stripe objects the billing stack needs. Idempotent: safe to
// re-run — existing objects are found by lookup key / event name and reused.
//
//   bun scripts/stripe-bootstrap.ts [--url https://your-app.example]
//
// Creates (or finds):
//   1. Billing Meter  "ai_tokens" — sums token counts reported per customer
//   2. Product        "<app> Pro"
//   3. Price          lookup_key "pro-base"           — $20/month flat
//   4. Price          lookup_key "pro-metered-tokens" — first 1M tokens $0,
//                     then $5 per additional 1M ($0.0005¢/token), billed on
//                     the meter
//   5. (--url only)   Webhook endpoint at <url>/api/auth/stripe/webhook —
//                     the whsec_... secret is printed ONCE; store it with
//                     `wrangler secret put STRIPE_WEBHOOK_SECRET` (or
//                     .dev.vars for local dev)
//
// Then patches STRIPE_PRO_PRICE_ID / STRIPE_METERED_PRICE_ID placeholders in
// wrangler.jsonc (both the top-level and env.preview vars).
//
// Keep the plan shape in sync with src/lib/billing/constants.ts.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import Stripe from "stripe";

const METER_EVENT_NAME = "ai_tokens";
const BASE_LOOKUP_KEY = "pro-base";
const METERED_LOOKUP_KEY = "pro-metered-tokens";
const BASE_USD_CENTS_PER_MONTH = 2000; // $20/mo
const INCLUDED_TOKENS = 1_000_000;
const OVERAGE_CENTS_PER_TOKEN = "0.0005"; // $5 per 1M tokens

const apiKey = process.env.STRIPE_SECRET_KEY;
if (!apiKey) {
  console.error("✗ STRIPE_SECRET_KEY is not set");
  process.exit(1);
}

const urlFlag = process.argv.indexOf("--url");
const appUrl = urlFlag !== -1 ? process.argv[urlFlag + 1] : undefined;
if (urlFlag !== -1 && !appUrl) {
  console.error("✗ --url requires a value, e.g. --url https://your-app.example");
  process.exit(1);
}

const appName = (
  JSON.parse(readFileSync("package.json", "utf8")) as { name: string }
).name;

const stripe = new Stripe(apiKey, { apiVersion: "2026-06-24.dahlia" });

// 1. Meter
let meter = (await stripe.billing.meters.list({ status: "active", limit: 100 })).data.find(
  (m) => m.event_name === METER_EVENT_NAME,
);
if (meter) {
  console.log(`• meter '${METER_EVENT_NAME}' already exists (${meter.id}) — reusing`);
} else {
  meter = await stripe.billing.meters.create({
    display_name: `${appName} AI tokens`,
    event_name: METER_EVENT_NAME,
    default_aggregation: { formula: "sum" },
    customer_mapping: { type: "by_id", event_payload_key: "stripe_customer_id" },
    value_settings: { event_payload_key: "value" },
  });
  console.log(`✓ meter '${METER_EVENT_NAME}' created (${meter.id})`);
}

// 2 + 3 + 4. Product and prices, found by lookup key
const existing = await stripe.prices.list({
  lookup_keys: [BASE_LOOKUP_KEY, METERED_LOOKUP_KEY],
  limit: 10,
});
let basePrice = existing.data.find((p) => p.lookup_key === BASE_LOOKUP_KEY);
let meteredPrice = existing.data.find((p) => p.lookup_key === METERED_LOOKUP_KEY);

let productId =
  (typeof basePrice?.product === "string" ? basePrice.product : undefined) ??
  (typeof meteredPrice?.product === "string" ? meteredPrice.product : undefined);
if (!productId) {
  const product = await stripe.products.create({ name: `${appName} Pro` });
  productId = product.id;
  console.log(`✓ product '${appName} Pro' created (${productId})`);
}

if (basePrice) {
  console.log(`• base price already exists (${basePrice.id}) — reusing`);
} else {
  basePrice = await stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: BASE_USD_CENTS_PER_MONTH,
    recurring: { interval: "month" },
    lookup_key: BASE_LOOKUP_KEY,
  });
  console.log(`✓ base price created (${basePrice.id}) — $${BASE_USD_CENTS_PER_MONTH / 100}/mo`);
}

if (meteredPrice) {
  console.log(`• metered price already exists (${meteredPrice.id}) — reusing`);
} else {
  meteredPrice = await stripe.prices.create({
    product: productId,
    currency: "usd",
    billing_scheme: "tiered",
    tiers_mode: "graduated",
    tiers: [
      { up_to: INCLUDED_TOKENS, unit_amount: 0 },
      { up_to: "inf", unit_amount_decimal: OVERAGE_CENTS_PER_TOKEN },
    ],
    recurring: { interval: "month", usage_type: "metered", meter: meter.id },
    lookup_key: METERED_LOOKUP_KEY,
  });
  console.log(
    `✓ metered price created (${meteredPrice.id}) — first ${INCLUDED_TOKENS.toLocaleString()} tokens included, then ${OVERAGE_CENTS_PER_TOKEN}¢/token`,
  );
}

// 5. Webhook endpoint (only with --url; the secret is only returned at creation)
if (appUrl) {
  const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/auth/stripe/webhook`;
  const hooks = await stripe.webhookEndpoints.list({ limit: 100 });
  const already = hooks.data.find((h) => h.url === webhookUrl);
  if (already) {
    console.log(`• webhook endpoint already exists for ${webhookUrl} — reusing (secret not re-shown)`);
  } else {
    const hook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        "checkout.session.completed",
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
      ],
    });
    console.log(`✓ webhook endpoint created: ${webhookUrl}`);
    console.log("");
    console.log("  ⚠ Store the signing secret NOW (it is never shown again):");
    console.log(`    ${hook.secret}`);
    console.log("    → bunx wrangler secret put STRIPE_WEBHOOK_SECRET");
  }
}

// Patch wrangler.jsonc placeholders (top-level AND env.preview vars — the
// var name keys the replacement, so both IDs land correctly even though they
// share one placeholder string).
const patch = (file: string) => {
  if (!existsSync(file)) return;
  let src = readFileSync(file, "utf8");
  const before = src;
  src = src.replaceAll(
    `"STRIPE_PRO_PRICE_ID": "REPLACE_WITH_ID_FROM_stripe_bootstrap"`,
    `"STRIPE_PRO_PRICE_ID": "${basePrice.id}"`,
  );
  src = src.replaceAll(
    `"STRIPE_METERED_PRICE_ID": "REPLACE_WITH_ID_FROM_stripe_bootstrap"`,
    `"STRIPE_METERED_PRICE_ID": "${meteredPrice.id}"`,
  );
  if (src !== before) {
    writeFileSync(file, src);
    console.log(`✓ ${file} patched with price IDs`);
  } else {
    console.log(`• ${file} already has price IDs — skipping`);
  }
};
patch("wrangler.jsonc");

console.log("");
console.log("Billing env values:");
console.log(`  STRIPE_PRO_PRICE_ID=${basePrice.id}`);
console.log(`  STRIPE_METERED_PRICE_ID=${meteredPrice.id}`);
console.log("");
console.log("Remaining setup:");
console.log("  • local:  ensure STRIPE_SECRET_KEY (+ STRIPE_WEBHOOK_SECRET from `stripe listen`) are in .dev.vars");
console.log("  • remote: mise run stripe:secrets   (uploads both from .dev.vars)");
console.log("  • remote: re-run with --url https://<deployed-origin> to create the webhook endpoint");
