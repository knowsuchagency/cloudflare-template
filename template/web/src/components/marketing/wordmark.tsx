import { cn } from "@/lib/utils"

type WordmarkProps = {
  text: string
  size?: "sm" | "md" | "lg" | "hero"
  className?: string
}

const SIZES: Record<NonNullable<WordmarkProps["size"]>, string> = {
  sm: "text-[18px]",
  md: "text-[24px]",
  lg: "text-[44px]",
  hero: "text-[clamp(56px,10vw,128px)] leading-[0.92]",
}

// The brand mark in Space Grotesk medium — the readable wordmark used in nav and
// headers. The dot-matrix Doto treatment is reserved for the hero moment.
export function Wordmark({ text, size = "md", className }: WordmarkProps) {
  return (
    <span
      className={cn(
        "inline-flex items-start font-sans font-medium tracking-[-0.02em] text-[var(--fg-0)] uppercase",
        SIZES[size],
        className
      )}
    >
      {text}
    </span>
  )
}
