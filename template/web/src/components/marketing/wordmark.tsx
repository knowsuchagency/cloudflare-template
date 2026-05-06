import { cn } from "@/lib/utils"

type WordmarkProps = {
  text: string
  size?: "sm" | "md" | "lg" | "hero"
  cursor?: boolean
  className?: string
}

const SIZES: Record<NonNullable<WordmarkProps["size"]>, string> = {
  sm: "text-[18px]",
  md: "text-[22px]",
  lg: "text-[34px]",
  hero: "text-[80px] sm:text-[100px] leading-none tracking-tight",
}

export function Wordmark({
  text,
  size = "md",
  cursor = false,
  className,
}: WordmarkProps) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-[4px] font-pixel text-[var(--fg-1)]",
        SIZES[size],
        className
      )}
    >
      <span className="font-bold text-[var(--bf-orange)]">&gt;</span>
      <span>{text}</span>
      {cursor && (
        <span
          className="text-[var(--bf-orange)]"
          style={{ animation: "bf-blink 1.2s steps(2) infinite" }}
        >
          _
        </span>
      )}
    </span>
  )
}
