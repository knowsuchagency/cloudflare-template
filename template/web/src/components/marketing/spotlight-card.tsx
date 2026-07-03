// Adapted from react-bits SpotlightCard (https://reactbits.dev — MIT): a
// mouse-tracked accent glow behind the card content. Kept hard-edged and
// token-driven — the spotlight uses the system's --accent-subtle so it works
// across all three design systems.

import { useRef, type MouseEvent, type ReactNode } from "react"
import { cn } from "@/lib/utils"

type SpotlightCardProps = {
  children: ReactNode
  className?: string
}

export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`)
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`)
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: pointer tracking is decorative; the card content stays fully accessible
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      className={cn("group relative", className)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(280px circle at var(--spot-x, 50%) var(--spot-y, 50%), var(--accent-subtle), transparent 70%)",
        }}
      />
      {children}
    </div>
  )
}
