import { Reveal } from "@/components/motion/reveal"
import { SpotlightCard } from "@/components/marketing/spotlight-card"
import { marketing } from "@/content/marketing"

// Benefit cards — outcome-led copy from the content file; the mono caption
// carries the spec. Spotlight hover + staggered scroll reveal.
const FEATURES = marketing.benefits

export function FeatureRow() {
  return (
    <section
      id="features"
      className="grid grid-cols-1 border-t border-[var(--border-1)] sm:grid-cols-2 lg:grid-cols-4"
    >
      {FEATURES.map((f, i) => (
        <SpotlightCard
          key={f.title}
          className={
            // Hairline dividers between columns; only show on the relevant breakpoints
            (i > 0 ? "lg:border-l lg:border-[var(--border)] " : "") +
            (i % 2 === 1 ? "sm:border-l sm:border-[var(--border)] " : "") +
            (i >= 2 ? "sm:border-t sm:border-[var(--border)] lg:border-t-0 " : "")
          }
        >
          <Reveal
            delay={i * 0.08}
            y={20}
            className="relative flex h-full flex-col gap-5 px-5 py-8"
          >
            {/* Top: numeric eyebrow — mono, quiet */}
            <div className="font-mono text-[10px] tracking-[0.1em] text-[var(--fg-3)] uppercase">
              {String(i + 1).padStart(2, "0")} /{" "}
              {String(FEATURES.length).padStart(2, "0")}
            </div>

            {/* Middle: heading */}
            <h3 className="font-sans text-[18px] leading-[1.2] font-medium tracking-[-0.01em] text-[var(--fg-0)]">
              {f.title}
            </h3>

            {/* Body */}
            <p className="font-sans text-[13px] leading-[1.55] text-[var(--fg-2)]">
              {f.body}
            </p>

            {/* Bottom: caption */}
            <div className="mt-auto pt-3">
              <span className="font-mono text-[10px] tracking-[0.1em] text-[var(--fg-3)] uppercase">
                {f.caption}
              </span>
            </div>
          </Reveal>
        </SpotlightCard>
      ))}
    </section>
  )
}
