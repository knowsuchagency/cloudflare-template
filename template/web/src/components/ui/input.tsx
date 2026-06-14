import type * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-none border border-[var(--border-1)] bg-[var(--bg-1)] px-3 py-2 font-mono text-sm text-[var(--fg-1)]",
        "transition-colors duration-[150ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] outline-none",
        "placeholder:text-[var(--fg-3)]",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-[var(--fg-1)]",
        "focus-visible:outline-none focus-visible:border-[var(--fg-1)] focus-visible:ring-1 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-[var(--accent)] aria-invalid:ring-0",
        className
      )}
      {...props}
    />
  )
}

export { Input }
