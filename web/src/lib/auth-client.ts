export type AuthUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  user: AuthUser;
  session: { id: string; expiresAt: string; token: string };
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "content-type": "application/json", ...init?.headers },
    ...init,
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message =
      body?.message ?? body?.error?.message ?? `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body as T;
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
};
