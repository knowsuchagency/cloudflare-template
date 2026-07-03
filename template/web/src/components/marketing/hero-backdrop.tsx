// Hero backdrop — a Bayer-dithered sphere from @paper-design/shaders. Reads
// the accent token at runtime so it follows the active design system and the
// theme toggle. Halftone-print texture on transparent ground: the page paper
// shows through, which keeps it looking screen-printed rather than rendered.

import { Dithering } from "@paper-design/shaders-react"
import {
  usePrefersReducedMotion,
  useTokenColors,
} from "@/components/marketing/use-token-colors"

const TOKENS = ["--accent"] as const

export function HeroBackdrop() {
  const colors = useTokenColors(TOKENS)
  const reduced = usePrefersReducedMotion()

  if (!colors) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-8 -right-24 hidden size-[520px] sm:block lg:-right-16 lg:size-[640px]"
      style={{
        // Fade the sphere's lower-left so the headline stays sovereign.
        maskImage:
          "radial-gradient(closest-side at 60% 40%, black 55%, transparent 100%)",
        WebkitMaskImage:
          "radial-gradient(closest-side at 60% 40%, black 55%, transparent 100%)",
      }}
    >
      <Dithering
        className="size-full"
        colorBack="#00000000"
        colorFront={colors[0]}
        shape="sphere"
        type="4x4"
        size={2.5}
        speed={reduced ? 0 : 0.55}
      />
    </div>
  )
}
