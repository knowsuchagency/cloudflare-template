import { useQuery } from "@tanstack/react-query";
import { SpinnerIcon } from "@phosphor-icons/react";

import { authClient } from "@/lib/auth-client";
import { LoginCard } from "@/components/login-card";
import { Dashboard } from "@/components/dashboard";
import { Toaster } from "@/components/ui/sonner";

export function App() {
  const { data: session, isPending } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        return await authClient.getSession();
      } catch {
        return null;
      }
    },
  });

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6">
      {isPending ? (
        <SpinnerIcon size={28} className="animate-spin text-muted-foreground" />
      ) : session ? (
        <Dashboard user={session.user} />
      ) : (
        <LoginCard />
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
