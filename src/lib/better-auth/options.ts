import type { BetterAuthOptions } from "better-auth";

export const betterAuthOptions: BetterAuthOptions = {
  appName: "cloudflare-better-auth-experiment",
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
  },
};
