import { Hono } from "hono";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { auth } from "./lib/better-auth";

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
// stateless (the client re-sends the full transcript each turn — no D1 table),
// and routed through the "default" AI Gateway for caching/observability.
// The 401/400 guards run before any c.env.AI access, so they're exercisable
// under vitest-pool-workers (which has no GPU) — see test/chat.test.ts.
app.post("/api/chat", async (c) => {
  const session = await auth(c.env).api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const { messages } = (await c.req.json()) as { messages?: UIMessage[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: "messages array required" }, 400);
  }

  const workersai = createWorkersAI({ binding: c.env.AI, gateway: { id: "default" } });
  const result = streamText({
    model: workersai("@cf/meta/llama-4-scout-17b-16e-instruct"),
    messages: await convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
});

export default app;
