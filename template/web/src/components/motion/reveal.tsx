// Adapted from react-bits AnimatedContent/FadeContent (https://reactbits.dev —
// MIT), rebuilt on motion: content fades and rises in once as it scrolls into
// view. Uses the design-system ease — snappy, no bounce.

import { motion, useReducedMotion } from "motion/react"
import type { ReactNode } from "react"

type RevealProps = {
  children: ReactNode
  className?: string
  /** Seconds before the transition starts once in view. */
  delay?: number
  /** Pixels the content rises while fading in. */
  y?: number
  duration?: number
}

export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  duration = 0.7,
}: RevealProps) {
  const reduced = useReducedMotion()

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px 0px" }}
      transition={{ delay, duration, ease: [0.2, 0.7, 0.1, 1] }}
    >
      {children}
    </motion.div>
  )
}
