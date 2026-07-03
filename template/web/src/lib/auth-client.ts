export type AuthUser = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: string
  updatedAt: string
}

export type AuthSession = {
  user: AuthUser
  session: { id: string; expiresAt: string; token: string }
}

export type UsageInfo = {
  plan: "free" | "pro"
  tokensUsed: number
  allotment: number
  period: string
  subscription: {
    status: string
    periodEnd: number | null
    cancelAtPeriodEnd: boolean
  } | null
}

// Row shape of the @better-auth/stripe plugin's GET /subscription/list.
export type SubscriptionInfo = {
  id: string
  plan: string
  status: string
  periodEnd?: string | null
  cancelAtPeriodEnd?: boolean | null
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "content-type": "application/json", ...init?.headers },
    ...init,
  })
  const text = await res.text()
  const body = text ? JSON.parse(text) : null
  if (!res.ok) {
    const message =
      body?.message ?? body?.error?.message ?? `Request failed (${res.status})`
    throw new Error(message)
  }
  return body as T
}

export const authClient = {
  getSession: () => request<AuthSession | null>("/api/auth/get-session"),
  signIn: (body: { email: string; password: string }) =>
    request<AuthSession>("/api/auth/sign-in/email", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  signUp: (body: { email: string; password: string; name: string }) =>
    request<AuthSession>("/api/auth/sign-up/email", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  signOut: () =>
    request<{ success: boolean }>("/api/auth/sign-out", {
      method: "POST",
      body: "{}",
    }),
  // Better Auth always answers 200 with a generic message (anti-enumeration),
  // so a resolved promise just means "request accepted", not "email on file".
  // `redirectTo` is the SPA page the reset link lands on; Better Auth appends
  // `?token=...` (or `?error=INVALID_TOKEN`) to it.
  requestPasswordReset: (body: { email: string; redirectTo: string }) =>
    request<{ status: boolean; message: string }>(
      "/api/auth/request-password-reset",
      { method: "POST", body: JSON.stringify(body) },
    ),
  resetPassword: (body: { newPassword: string; token: string }) =>
    request<{ status: boolean }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  // Billing — thin calls against the @better-auth/stripe plugin endpoints
  // (mounted under /api/auth) plus the Worker's own /api/usage. `upgrade`
  // resolves to a Stripe Checkout URL; navigate to it with
  // `window.location.href = res.url`.
  getUsage: () => request<UsageInfo>("/api/usage"),
  subscriptionList: () =>
    request<SubscriptionInfo[]>("/api/auth/subscription/list"),
  subscriptionUpgrade: (body: {
    plan: string
    successUrl: string
    cancelUrl: string
  }) =>
    request<{ url: string; redirect: boolean }>(
      "/api/auth/subscription/upgrade",
      { method: "POST", body: JSON.stringify(body) },
    ),
  // Cancellation goes through the Stripe Billing Portal's confirmation flow —
  // the response URL lands the user there.
  subscriptionCancel: (body: { returnUrl: string }) =>
    request<{ url: string; redirect: boolean }>(
      "/api/auth/subscription/cancel",
      { method: "POST", body: JSON.stringify(body) },
    ),
  subscriptionRestore: () =>
    request<SubscriptionInfo>("/api/auth/subscription/restore", {
      method: "POST",
      body: "{}",
    }),
  billingPortal: (body: { returnUrl: string }) =>
    request<{ url: string; redirect: boolean }>(
      "/api/auth/subscription/billing-portal",
      { method: "POST", body: JSON.stringify(body) },
    ),
}
