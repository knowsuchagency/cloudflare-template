/**
 * End-to-end guards for the AI chat route POST /api/chat via SELF.fetch().
 *
 * This pins the deterministic, no-GPU surface of the route:
 *   1. Anonymous requests are rejected (401) — anonymous traffic must never
 *      reach env.AI.run and burn the account's Workers AI neurons.
 *   2. An authenticated request with no messages is rejected (400) before
 *      any inference is attempted.
 *
 * The streaming/inference path itself is intentionally NOT asserted here:
 * @cloudflare/vitest-pool-workers has no GPU, and the AI binding proxies to
 * Cloudflare's remote network (needs account credentials + bills usage). Both
 * guards above run *before* c.env.AI is touched, so they exercise the full
 * Worker route through SELF.fetch without depending on real inference. Verify
 * streaming manually with `mise dev` (proxies to remote AI) — see CLAUDE.md.
 */
import { SELF } from "cloudflare:test";
import { describe, expect, test } from "vitest";

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

const creds = { email: "bob@test.example", password: "test1234!", name: "Bob" } as const;

describe("chat route", () => {
  test("POST /api/chat without a session returns 401", async () => {
    const res = await post("/api/chat", { messages: [{ role: "user", parts: [] }] });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  test("POST /api/chat with a session but no messages returns 400", async () => {
    const signUp = await post("/api/auth/sign-up/email", creds);
    expect(signUp.status, `sign-up failed: ${await signUp.clone().text()}`).toBe(200);
    const cookie = cookiesFrom(signUp);

    const res = await post("/api/chat", { messages: [] }, cookie);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "messages array required" });
  });
});
