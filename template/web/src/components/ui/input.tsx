import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-[2px] border-2 border-[var(--border-1)] bg-[var(--bg-3)] px-3 py-2 font-sans text-sm text-[var(--fg-1)]",
        "transition-colors duration-[80ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] outline-none",
        "placeholder:text-[var(--fg-3)]",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-[var(--fg-1)]",
        "focus-visible:border-[var(--bf-orange)] focus-visible:ring-0",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-[var(--term-red)] aria-invalid:ring-0",
        className
      )}
      {...props}
    />
  )
}

export { Input }
