import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-none border border-[var(--ink)] bg-[var(--paper-0)] px-3 py-2 font-mono text-sm text-[var(--ink)]",
        "transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0.7,0.1,1)] outline-none",
        "placeholder:text-[var(--ink-3)]",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-[var(--ink)]",
        "focus-visible:outline-none focus-visible:border-[var(--orange)] focus-visible:ring-2 focus-visible:ring-[var(--orange)] focus-visible:ring-offset-0",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-[var(--signal-red)] aria-invalid:ring-0",
        className
      )}
      {...props}
    />
  )
}

export { Input }
