import { describe, expect, test } from "vitest";
import { deriveTrustedOrigins } from "../../src/lib/better-auth";

// `wrangler types` infers `BETTER_AUTH_URL` as the literal "http://localhost:8787"
// from the prod vars block, which is too narrow for unit tests that swap in
// arbitrary URLs. Define a relaxed shape and cast at the call site.
type TestEnv = {
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL?: string;
  BETTER_AUTH_TRUSTED_ORIGINS?: string;
};

const envWith = (overrides: Partial<TestEnv>): Env =>
  ({ BETTER_AUTH_SECRET: "x", ...overrides }) as unknown as Env;

describe("deriveTrustedOrigins", () => {
  test("workers.dev URL auto-derives the wildcard sibling origin", () => {
    const origins = deriveTrustedOrigins(
      envWith({ BETTER_AUTH_URL: "https://my-worker.acct.workers.dev" }),
    );
    expect(origins).toEqual(["https://*.acct.workers.dev"]);
  });

  test("custom domain does not auto-derive anything", () => {
    const origins = deriveTrustedOrigins(envWith({ BETTER_AUTH_URL: "https://app.example.com" }));
    expect(origins).toEqual([]);
  });

  test("BETTER_AUTH_TRUSTED_ORIGINS CSV is merged in", () => {
    const origins = deriveTrustedOrigins(
      envWith({
        BETTER_AUTH_URL: "https://app.example.com",
        BETTER_AUTH_TRUSTED_ORIGINS: "https://staging.example.com, https://*.preview.workers.dev",
      }),
    );
    expect(origins).toEqual([
      "https://staging.example.com",
      "https://*.preview.workers.dev",
    ]);
  });

  test("workers.dev URL + CSV combine without duplication", () => {
    const origins = deriveTrustedOrigins(
      envWith({
        BETTER_AUTH_URL: "https://my-worker.acct.workers.dev",
        BETTER_AUTH_TRUSTED_ORIGINS: "https://*.acct.workers.dev,https://other.example.com",
      }),
    );
    expect(origins).toEqual([
      "https://*.acct.workers.dev",
      "https://other.example.com",
    ]);
  });

  test("malformed BETTER_AUTH_URL falls back to CSV-only without throwing", () => {
    const origins = deriveTrustedOrigins(
      envWith({
        BETTER_AUTH_URL: "not a url",
        BETTER_AUTH_TRUSTED_ORIGINS: "https://app.example.com",
      }),
    );
    expect(origins).toEqual(["https://app.example.com"]);
  });

  test("empty/whitespace CSV entries are skipped", () => {
    const origins = deriveTrustedOrigins(
      envWith({
        BETTER_AUTH_URL: "https://app.example.com",
        BETTER_AUTH_TRUSTED_ORIGINS: " , https://a.example.com , ,  ",
      }),
    );
    expect(origins).toEqual(["https://a.example.com"]);
  });
});
