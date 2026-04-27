import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../../db/schema";
import { betterAuthOptions } from "./options";

/**
 * Better Auth's CSRF check rejects any request whose Origin doesn't match
 * `baseURL` or an entry in `trustedOrigins` ("Invalid origin"). Two common
 * Cloudflare scenarios trip this:
 *
 *  1. No custom domain: `BETTER_AUTH_URL=https://<worker>.<sub>.workers.dev`,
 *     and Workers Builds previews live at
 *     `<version>-<worker>.<sub>.workers.dev` — siblings under the same
 *     account subdomain. Auto-derive `https://*.<sub>.workers.dev` so
 *     previews "just work" with zero config.
 *  2. Custom domain: `BETTER_AUTH_URL=https://app.example.com` but previews
 *     are still on workers.dev. Auto-derivation can't help because the
 *     workers.dev subdomain isn't in `BETTER_AUTH_URL`. Set
 *     `BETTER_AUTH_TRUSTED_ORIGINS` (CSV) in wrangler.jsonc vars, e.g.
 *     `"https://*.<sub>.workers.dev"`.
 *
 * Local dev: when you hit the Worker via a hostname that doesn't match
 * `.dev.vars`'s `BETTER_AUTH_URL` (a `/etc/hosts` entry, a reverse proxy,
 * or an alternate port), add the actual origin to
 * `BETTER_AUTH_TRUSTED_ORIGINS` in `.dev.vars` instead of changing
 * `BETTER_AUTH_URL` — keeps cookies set on the canonical origin.
 *
 * Better Auth also reads `BETTER_AUTH_TRUSTED_ORIGINS` from `process.env`,
 * but Worker `vars` aren't exposed there — they only reach us via `env`,
 * which is why we plumb it explicitly.
 */
function deriveTrustedOrigins(env: Env): string[] {
  const origins = new Set<string>();

  try {
    const url = new URL(env.BETTER_AUTH_URL);
    if (url.hostname.endsWith(".workers.dev")) {
      const parts = url.hostname.split(".");
      // ["<worker>", "<sub>", "workers", "dev"] → "*.<sub>.workers.dev"
      if (parts.length >= 4) {
        origins.add(`${url.protocol}//*.${parts.slice(1).join(".")}`);
      }
    }
  } catch {
    // Malformed BETTER_AUTH_URL — skip auto-derivation.
  }

  const extra = env.BETTER_AUTH_TRUSTED_ORIGINS;
  if (extra) {
    for (const o of extra.split(",")) {
      const trimmed = o.trim();
      if (trimmed) origins.add(trimmed);
    }
  }

  return [...origins];
}

export const auth = (env: Env) => {
  const db = drizzle(env.DB, { schema });

  return betterAuth({
    ...betterAuthOptions,
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: deriveTrustedOrigins(env),
  });
};
