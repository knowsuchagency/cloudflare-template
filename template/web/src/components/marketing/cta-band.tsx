// Closing CTA — a full-band GrainGradient from @paper-design/shaders, hard
// posterized bands in the system accent (softness 0 keeps it screen-printed,
// on brand for the hard-edged systems). Colors resolve from tokens at runtime
// so the band follows the design system and theme toggle.

import { Link } from "react-router"
import { GrainGradient } from "@paper-design/shaders-react"

import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/motion/reveal"
import {
  usePrefersReducedMotion,
  useTokenColors,
} from "@/components/marketing/use-token-colors"
import { marketing } from "@/content/marketing"

const TOKENS = ["--bg-0", "--accent", "--orange-deep", "--fg-0"] as const

export function CtaBand() {
  const colors = useTokenColors(TOKENS)
  const reduced = usePrefersReducedMotion()
  const final = marketing.finalCta

  return (
    <section className="relative overflow-hidden border-t border-[var(--border-1)]">
      {colors && (
        <GrainGradient
          className="absolute inset-0"
          colorBack={colors[0]}
          colors={[colors[1], colors[2]]}
          shape="wave"
          softness={0}
          intensity={0.55}
          noise={0.3}
          speed={reduced ? 0 : 0.6}
        />
      )}
      {/* Content chip sits on solid paper so text never fights the shader. */}
      <div className="relative flex flex-col items-start gap-6 px-5 py-16 sm:px-10 lg:py-24">
        <Reveal className="flex flex-col items-start gap-6">
          {final.eyebrow && (
            <span className="inline-block bg-[var(--fg-0)] px-2 py-1 font-mono text-[11px] leading-none tracking-[0.08em] text-[var(--bg-0)] uppercase">
              {final.eyebrow}
            </span>
          )}
          <h2 className="m-0 max-w-[16ch] bg-[var(--bg-0)] p-3 font-display text-[clamp(36px,6vw,72px)] leading-[0.95] font-bold tracking-[-0.02em] text-[var(--fg-0)] uppercase">
            {final.headline}
          </h2>
          <div className="flex flex-wrap items-center gap-3 bg-[var(--bg-0)] p-3">
            <Button size="lg" variant="accent" asChild>
              <Link to={final.cta.to}>
                {final.cta.label} <span aria-hidden>→</span>
              </Link>
            </Button>
            {final.caption && (
              <span className="font-mono text-[10px] tracking-[0.1em] text-[var(--fg-2)] uppercase">
                {final.caption}
              </span>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
