import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router"
import {
  ArrowLeft,
  CreditCard,
  ExternalLink,
  Loader,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ThemeToggle } from "@/components/theme-toggle"

// Billing hub: current plan + usage meter from GET /api/usage, and the
// @better-auth/stripe plugin's checkout / portal / cancel / restore flows.
// Checkout and cancel both resolve to Stripe-hosted URLs — we navigate the
// whole window there and Stripe returns the user to /billing.
export function Billing() {
  const queryClient = useQueryClient()

  const usageQuery = useQuery({
    queryKey: ["usage"],
    queryFn: authClient.getUsage,
  })
  const usage = usageQuery.data

  const upgrade = useMutation({
    mutationFn: () =>
      authClient.subscriptionUpgrade({
        plan: "pro",
        successUrl: "/billing",
        cancelUrl: "/billing",
      }),
    onSuccess: (res) => {
      if (res.url) window.location.href = res.url
    },
    onError: (err) => {
      // Most common failure: Stripe isn't configured yet (plugin not
      // mounted → the endpoint 404s). Surface the setup hint instead of a
      // generic error.
      const message = err instanceof Error ? err.message : "Upgrade failed"
      toast.error(
        message.includes("404") || message.toLowerCase().includes("not found")
          ? "Billing isn't configured — run `mise run stripe:bootstrap` first."
          : message,
      )
    },
  })

  const portal = useMutation({
    mutationFn: () => authClient.billingPortal({ returnUrl: "/billing" }),
    onSuccess: (res) => {
      if (res.url) window.location.href = res.url
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Could not open portal"),
  })

  const cancel = useMutation({
    mutationFn: () => authClient.subscriptionCancel({ returnUrl: "/billing" }),
    onSuccess: (res) => {
      if (res.url) window.location.href = res.url
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Cancel failed"),
  })

  const restore = useMutation({
    mutationFn: () => authClient.subscriptionRestore(),
    onSuccess: () => {
      toast.success("Subscription restored")
      queryClient.invalidateQueries({ queryKey: ["usage"] })
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Restore failed"),
  })

  const pro = usage?.plan === "pro"
  const pct = usage
    ? Math.min(100, Math.round((usage.tokensUsed / usage.allotment) * 100))
    : 0

  return (
    <div className="relative min-h-svh bg-[var(--bg-0)]">
      <header className="relative z-10 flex items-center justify-between border-b border-[var(--border-1)] px-6 py-5 sm:px-14">
        <Link
          to="/app"
          className="flex items-center gap-2 text-sm text-[var(--fg-2)] no-underline hover:text-[var(--fg-1)]"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <div className="flex items-center gap-3 text-sm text-[var(--fg-2)]">
          <CreditCard className="size-5 text-[var(--fg-3)]" />
          <span>Billing</span>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-2xl px-6 py-12 sm:px-14">
        <div className="mb-8">
          <div className="mb-3 font-mono text-[11px] font-normal tracking-[0.14em] text-[var(--fg-2)] uppercase">
            BILLING
          </div>
          <h1 className="m-0 font-sans text-3xl font-medium tracking-[-0.01em] text-[var(--fg-0)]">
            {pro ? "Pro plan" : "Free plan"}
          </h1>
        </div>

        {usageQuery.isPending ? (
          <div className="flex justify-center py-16">
            <Loader className="size-6 animate-spin text-[var(--fg-3)]" />
          </div>
        ) : usageQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Couldn't load usage</AlertTitle>
            <AlertDescription>
              {usageQuery.error instanceof Error
                ? usageQuery.error.message
                : "Try again."}
            </AlertDescription>
          </Alert>
        ) : usage ? (
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Tokens · {usage.period}
                </CardTitle>
                <CardDescription>
                  {pro
                    ? "Included allotment this billing month. Past it, overage is billed per token — you're never cut off."
                    : "Free monthly allotment. When it runs out, chat pauses until next month — or upgrade."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={pct} aria-label="Token usage" />
                <p className="mt-3 mb-0 font-mono text-xs text-[var(--fg-2)]">
                  {usage.tokensUsed.toLocaleString()} /{" "}
                  {usage.allotment.toLocaleString()} tokens ({pct}%)
                </p>
              </CardContent>
            </Card>

            {pro && usage.subscription ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Subscription</CardTitle>
                  <CardDescription>
                    Status: {usage.subscription.status}
                    {usage.subscription.periodEnd &&
                      ` · ${usage.subscription.cancelAtPeriodEnd ? "ends" : "renews"} ${new Date(usage.subscription.periodEnd).toLocaleDateString()}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {usage.subscription.cancelAtPeriodEnd && (
                    <Alert>
                      <AlertTitle>Cancellation scheduled</AlertTitle>
                      <AlertDescription>
                        Your plan stays active until the period ends. You can
                        restore it any time before then.
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button
                    onClick={() => portal.mutate()}
                    disabled={portal.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    {portal.isPending ? (
                      <Loader className="animate-spin" />
                    ) : (
                      <ExternalLink />
                    )}
                    Manage in Stripe portal
                  </Button>
                  {usage.subscription.cancelAtPeriodEnd ? (
                    <Button
                      onClick={() => restore.mutate()}
                      disabled={restore.isPending}
                      className="w-full"
                    >
                      {restore.isPending ? (
                        <Loader className="animate-spin" />
                      ) : (
                        <RotateCcw />
                      )}
                      Restore subscription
                    </Button>
                  ) : (
                    <Button
                      onClick={() => cancel.mutate()}
                      disabled={cancel.isPending}
                      variant="outline"
                      className="w-full"
                    >
                      {cancel.isPending && <Loader className="animate-spin" />}
                      Cancel subscription
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upgrade to Pro</CardTitle>
                  <CardDescription>
                    $20/month · 1,000,000 tokens included · $5 per additional
                    1M tokens. Cancel any time.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => upgrade.mutate()}
                    disabled={upgrade.isPending}
                    className="w-full"
                  >
                    {upgrade.isPending ? (
                      <Loader className="animate-spin" />
                    ) : (
                      <Sparkles />
                    )}
                    Upgrade with Stripe Checkout
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </main>
    </div>
  )
}
