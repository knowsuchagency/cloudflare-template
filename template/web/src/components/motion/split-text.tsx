// Adapted from react-bits SplitText (https://reactbits.dev — MIT), rebuilt on
// motion and the design-system motion tokens: clipped word masks, words rise
// from below the baseline with a snappy industrial ease. No bounces.

import { motion, useReducedMotion } from "motion/react"

type SplitTextProps = {
  text: string
  className?: string
  /** Seconds before the first word starts. */
  delay?: number
  /** Seconds between each word. */
  stagger?: number
  /** Seconds each word takes to land. */
  duration?: number
}

const EASE = [0.2, 0.7, 0.1, 1] as const

export function SplitText({
  text,
  className,
  delay = 0,
  stagger = 0.07,
  duration = 0.7,
}: SplitTextProps) {
  const reduced = useReducedMotion()
  const words = text.split(/\s+/).filter(Boolean)

  if (reduced) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      {words.map((word, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: words are static and can repeat
        <span key={i} aria-hidden="true">
          <span className="-mb-[0.08em] inline-block overflow-hidden pb-[0.08em] align-bottom">
            <motion.span
              className="inline-block will-change-transform"
              initial={{ y: "110%" }}
              animate={{ y: "0%" }}
              transition={{
                delay: delay + i * stagger,
                duration,
                ease: [...EASE],
              }}
            >
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  )
}
