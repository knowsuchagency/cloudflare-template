/**
 * Outbound-fetch interceptor for Stripe in tests.
 *
 * This version of @cloudflare/vitest-pool-workers (cloudflareTest plugin API)
 * exposes no fetchMock, but tests and the Worker under test share one workerd
 * isolate — so patching globalThis.fetch here intercepts the Worker's own
 * outbound calls. The stripe SDK resolves fetch at request time, so the patch
 * applies even though clients are constructed per-request.
 *
 * Any api.stripe.com request without a matching handler throws (keeps tests
 * hermetic); all other origins throw too — bindings (D1, EMAIL, AI) don't go
 * through fetch, so nothing in the suite legitimately needs the network.
 */

export interface StripeCall {
  method: string;
  path: string;
  body: string;
}

type Handler = {
  method: string;
  match: (path: string) => boolean;
  respond: (call: StripeCall) => unknown;
  once?: boolean;
};

const handlers: Handler[] = [];

/** Register a handler; later registrations win. Returns an unregister fn. */
export function onStripe(
  method: string,
  match: (path: string) => boolean,
  respond: (call: StripeCall) => unknown,
): () => void {
  const handler: Handler = { method, match, respond };
  handlers.unshift(handler);
  return () => {
    const i = handlers.indexOf(handler);
    if (i !== -1) handlers.splice(i, 1);
  };
}

/** Calls seen so far — assert on captured request bodies. */
export const stripeCalls: StripeCall[] = [];

export function installStripeMock(): void {
  const realFetch = globalThis.fetch;

  // Defaults for the customer flows Better Auth's stripe plugin runs on
  // sign-up (createCustomerOnSignUp) and checkout: it searches by email,
  // falls back to an auto-paginating list, then creates. Empty search/list
  // results steer it to the create path.
  onStripe(
    "POST",
    (p) => p.startsWith("/v1/customers"),
    () => ({ id: "cus_test", object: "customer" }),
  );
  onStripe(
    "GET",
    (p) => p === "/v1/customers/search",
    () => ({ object: "search_result", data: [], has_more: false }),
  );
  onStripe(
    "GET",
    (p) => p === "/v1/customers",
    () => ({ object: "list", data: [], has_more: false }),
  );
  onStripe(
    "GET",
    (p) => p.startsWith("/v1/customers/"),
    () => ({ id: "cus_test", object: "customer" }),
  );

  globalThis.fetch = (async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const req = new Request(input, init);
    const url = new URL(req.url);
    if (url.hostname !== "api.stripe.com") {
      throw new Error(
        `Unexpected outbound fetch in tests: ${req.method} ${req.url} — add a handler in test/stripe-mock.ts if intentional`,
      );
    }
    const call: StripeCall = {
      method: req.method,
      path: url.pathname + url.search,
      body: await req.text(),
    };
    stripeCalls.push(call);
    const handler = handlers.find(
      (h) => h.method === req.method && h.match(url.pathname),
    );
    if (!handler) {
      throw new Error(
        `Unhandled Stripe call in tests: ${call.method} ${call.path}`,
      );
    }
    return Response.json(handler.respond(call));
  }) as typeof realFetch;
}
