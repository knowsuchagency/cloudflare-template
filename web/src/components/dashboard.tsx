import { useState } from "react";
import { SignOutIcon, SpinnerIcon, UserCircleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

import { type AuthUser, authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function Dashboard({
  user,
  onSignedOut,
}: {
  user: AuthUser;
  onSignedOut: () => void;
}) {
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      await authClient.signOut();
      toast.success("Signed out");
      onSignedOut();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign out failed";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <UserCircleIcon size={40} weight="duotone" className="text-primary" />
          <div className="flex flex-col">
            <CardTitle className="text-lg">Signed in</CardTitle>
            <CardDescription>Welcome back, {user.name}.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 text-sm">
          <Row label="User ID" value={user.id} mono />
          <Separator />
          <Row label="Name" value={user.name} />
          <Separator />
          <Row label="Email" value={user.email} />
          <Separator />
          <Row
            label="Email verified"
            value={user.emailVerified ? "yes" : "no"}
          />
          <Separator />
          <Row
            label="Created"
            value={new Date(user.createdAt).toLocaleString()}
          />
        </div>
        <Button
          onClick={handleSignOut}
          disabled={pending}
          variant="outline"
          className="mt-6 w-full"
        >
          {pending ? (
            <SpinnerIcon data-icon="inline-start" className="animate-spin" />
          ) : (
            <SignOutIcon data-icon="inline-start" />
          )}
          Sign out
        </Button>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : undefined}>{value}</span>
    </div>
  );
}
