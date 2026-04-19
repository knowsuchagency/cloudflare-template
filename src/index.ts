import { Hono } from "hono";
import { auth } from "./lib/better-auth";

const app = new Hono<{ Bindings: Env }>();

app.on(["GET", "POST"], "/api/auth/*", (c) => {
  return auth(c.env).handler(c.req.raw);
});

app.get("/", (c) =>
  c.html(`<!doctype html>
<html>
  <head><title>Better Auth on Cloudflare D1</title></head>
  <body style="font-family: system-ui; max-width: 40rem; margin: 2rem auto;">
    <h1>Better Auth + Hono + D1</h1>
    <p>POST <code>/api/auth/sign-up/email</code> with <code>{email, password, name}</code> to create a user.</p>
    <p>POST <code>/api/auth/sign-in/email</code> with <code>{email, password}</code> to sign in.</p>
    <p>GET <code>/api/auth/get-session</code> to inspect the current session.</p>
    <p>GET <code>/me</code> to see the authenticated user.</p>
  </body>
</html>`),
);

app.get("/me", async (c) => {
  const session = await auth(c.env).api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ authenticated: false }, 401);
  return c.json({ authenticated: true, user: session.user });
});

export default app;
