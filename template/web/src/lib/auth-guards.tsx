import type { ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader } from "lucide-react"
import { Navigate } from "react-router"

import { authClient, type AuthSession } from "@/lib/auth-client"

// useSession is a hook deliberately co-located with the route guards that consume it
export function useSession() {
  return useQuery<AuthSession | null>({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        return await authClient.getSession()
      } catch {
        return null
      }
    },
  })
}

function SessionPending() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[var(--bg-0)]">
      <Loader className="size-7 animate-spin text-[var(--bf-orange)]" />
    </div>
  )
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession()
  if (isPending) return <SessionPending />
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function RequireGuest({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession()
  if (isPending) return <SessionPending />
  if (session) return <Navigate to="/app" replace />
  return <>{children}</>
}
