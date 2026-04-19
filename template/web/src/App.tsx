import { useCallback, useEffect, useState } from "react";
import { SpinnerIcon } from "@phosphor-icons/react";

import { type AuthSession, authClient } from "@/lib/auth-client";
import { LoginCard } from "@/components/login-card";
import { Dashboard } from "@/components/dashboard";
import { Toaster } from "@/components/ui/sonner";

export function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const s = await authClient.getSession();
      setSession(s);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6">
      {loading ? (
        <SpinnerIcon size={28} className="animate-spin text-muted-foreground" />
      ) : session ? (
        <Dashboard user={session.user} onSignedOut={() => setSession(null)} />
      ) : (
        <LoginCard onAuthed={refresh} />
      )}
      <p className="text-xs text-muted-foreground">
        Press <kbd className="rounded bg-muted px-1.5 py-0.5">d</kbd> to toggle
        dark mode.
      </p>
      <Toaster />
    </div>
  );
}

export default App;
