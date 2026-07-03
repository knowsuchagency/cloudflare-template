// Adapted from react-bits DecryptedText (https://reactbits.dev — MIT):
// characters scramble through a mono charset and resolve left-to-right.
// Built for the instrument-panel metadata strips — mono, uppercase, quiet.

import { useEffect, useRef, useState } from "react"
import { usePrefersReducedMotion } from "@/components/marketing/use-token-colors"

type DecryptedTextProps = {
  text: string
  className?: string
  /** Milliseconds before the scramble starts. */
  delay?: number
  /** Total milliseconds from first scramble to fully resolved. */
  duration?: number
  charset?: string
}

const CHARSET = "0123456789ABCDEF#/·—+"

export function DecryptedText({
  text,
  className,
  delay = 0,
  duration = 900,
  charset = CHARSET,
}: DecryptedTextProps) {
  const reduced = usePrefersReducedMotion()
  // Start fully scrambled (same length as the target, so mono width is stable
  // from the first paint) unless the user prefers reduced motion.
  const [display, setDisplay] = useState(() =>
    reduced ? text : scramble(text, charset, 0)
  )
  const frame = useRef(0)

  useEffect(() => {
    if (reduced) {
      setDisplay(text)
      return
    }

    let start: number | null = null
    const tick = (now: number) => {
      if (start === null) start = now + delay
      const t = Math.max(0, (now - start) / duration)
      // Resolve position sweeps the string; unresolved chars keep scrambling.
      const resolved = Math.floor(t * text.length)
      setDisplay(scramble(text, charset, resolved))
      if (resolved < text.length) {
        frame.current = requestAnimationFrame(tick)
      }
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [text, delay, duration, charset, reduced])

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{display}</span>
    </span>
  )
}

function scramble(text: string, charset: string, resolved: number): string {
  return text
    .split("")
    .map((ch, i) => {
      if (i < resolved || ch === " ") return ch
      return charset[Math.floor(Math.random() * charset.length)]
    })
    .join("")
}
