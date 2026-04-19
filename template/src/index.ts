import { Hono } from "hono";
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

export default app;
