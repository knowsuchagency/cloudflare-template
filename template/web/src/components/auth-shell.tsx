import type { ReactNode } from "react"
import { Link } from "react-router"

import { Wordmark } from "@/components/marketing/wordmark"
import { ThemeToggle } from "@/components/theme-toggle"

type AuthShellProps = {
  appTitle: string
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthShell({
  appTitle,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="relative flex min-h-svh flex-col bg-[var(--bg-0)]">
      <header className="relative z-10 flex items-center justify-between px-6 py-7 sm:px-14">
        <Link to="/" className="no-underline">
          <Wordmark text={appTitle} size="md" />
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-20 sm:px-14">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h1 className="m-0 mb-2 font-sans text-[28px] leading-tight font-medium tracking-[-0.01em] text-[var(--fg-0)]">
              {title}
            </h1>
            {description && (
              <p className="m-0 text-sm leading-relaxed text-[var(--fg-2)]">
                {description}
              </p>
            )}
          </div>

          <div className="border-2 border-[var(--border-1)] bg-[var(--bg-1)] p-6">
            {children}
          </div>

          {footer && (
            <div className="mt-6 text-center text-sm text-[var(--fg-3)]">
              {footer}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
