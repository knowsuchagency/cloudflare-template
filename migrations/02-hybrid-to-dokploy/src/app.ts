import { Hono } from "hono";
import { auth } from "./lib/better-auth";

// createApp accepts an optional env provider. On Workers, env is injected
// by the runtime and we leave this undefined. On Bun, the entrypoint passes
// buildBunEnv so a middleware can populate c.env from process.env before
// routes run.
export function createApp(envProvider?: () => Env) {
  const app = new Hono<{ Bindings: Env }>();

  if (envProvider) {
    const env = envProvider();
    app.use("*", async (c, next) => {
      c.env = env;
      await next();
    });
  }

  app.on(["GET", "POST"], "/api/auth/*", (c) => {
    return auth(c.env).handler(c.req.raw);
  });

  app.get("/api/me", async (c) => {
    const session = await auth(c.env).api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ authenticated: false }, 401);
    return c.json({ authenticated: true, user: session.user });
  });

  return app;
}
