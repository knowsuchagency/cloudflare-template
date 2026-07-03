// Adapted from react-bits CountUp (https://reactbits.dev — MIT), rebuilt on
// motion: numbers tick up once when scrolled into view. Snappy ease-out,
// tabular width comes from the caller's mono font.

import { useEffect, useRef, useState } from "react"
import { animate, useInView, useReducedMotion } from "motion/react"

type CountUpProps = {
  to: number
  from?: number
  /** Seconds. */
  duration?: number
  /** Decimal places to render. */
  decimals?: number
  className?: string
}

export function CountUp({
  to,
  from = 0,
  duration = 1.4,
  decimals = 0,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px 0px" })
  const reduced = useReducedMotion()
  const [value, setValue] = useState(reduced ? to : from)

  useEffect(() => {
    if (reduced) {
      setValue(to)
      return
    }
    if (!inView) return
    const controls = animate(from, to, {
      duration,
      ease: [0.2, 0.7, 0.1, 1],
      onUpdate: (v) => setValue(v),
    })
    return () => controls.stop()
  }, [inView, from, to, duration, reduced])

  return (
    <span ref={ref} className={className}>
      {value.toFixed(decimals)}
    </span>
  )
}
