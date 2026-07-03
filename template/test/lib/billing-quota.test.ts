/**
 * Pure unit tests for the billing quota helpers — no Worker, no D1.
 */
import { describe, expect, test } from "vitest";
import {
  currentPeriod,
  FREE_MONTHLY_TOKENS,
  isFreeQuotaExhausted,
} from "../../src/lib/billing/constants";
import { auth } from "../../src/lib/better-auth";
import { env } from "cloudflare:test";

describe("currentPeriod", () => {
  test("formats as YYYY-MM in UTC", () => {
    expect(currentPeriod(new Date("2026-07-02T12:00:00Z"))).toBe("2026-07");
  });

  test("zero-pads single-digit months", () => {
    expect(currentPeriod(new Date("2026-01-15T00:00:00Z"))).toBe("2026-01");
  });

  test("uses UTC, not local time, at month boundaries", () => {
    // 2026-06-30T23:59:59Z is still June in UTC regardless of runner TZ.
    expect(currentPeriod(new Date("2026-06-30T23:59:59Z"))).toBe("2026-06");
    expect(currentPeriod(new Date("2026-07-01T00:00:00Z"))).toBe("2026-07");
  });
});

describe("isFreeQuotaExhausted", () => {
  test("one token under the cap is allowed", () => {
    expect(isFreeQuotaExhausted(FREE_MONTHLY_TOKENS - 1)).toBe(false);
  });

  test("exactly at the cap is exhausted", () => {
    expect(isFreeQuotaExhausted(FREE_MONTHLY_TOKENS)).toBe(true);
  });

  test("zero usage is allowed", () => {
    expect(isFreeQuotaExhausted(0)).toBe(false);
  });
});

describe("stripe plugin mounting", () => {
  test("auth() without STRIPE_SECRET_KEY mounts no plugins (fresh-render safety)", () => {
    const stripped = { ...env, STRIPE_SECRET_KEY: undefined } as unknown as Env;
    expect(auth(stripped).options.plugins).toHaveLength(0);
  });

  test("auth() with STRIPE_SECRET_KEY mounts the stripe plugin", () => {
    expect(auth(env).options.plugins).toHaveLength(1);
  });
});
