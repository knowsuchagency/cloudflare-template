import { cn } from "@/lib/utils"

type WordmarkProps = {
  text: string
  size?: "sm" | "md" | "lg" | "hero"
  className?: string
}

const SIZES: Record<NonNullable<WordmarkProps["size"]>, string> = {
  sm: "text-[20px]",
  md: "text-[28px]",
  lg: "text-[44px]",
  hero: "text-[clamp(56px,10vw,128px)] leading-[0.92]",
}

export function Wordmark({ text, size = "md", className }: WordmarkProps) {
  return (
    <span
      className={cn(
        "inline-flex items-start font-sans font-extrabold tracking-[-0.025em] text-[var(--ink)] uppercase",
        SIZES[size],
        className
      )}
    >
      {text}
    </span>
  )
}
