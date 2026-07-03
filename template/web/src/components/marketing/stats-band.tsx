// Stats band — instrument-panel numerals that tick up on scroll (CountUp).
// The numbers are network facts about the platform the template deploys to.

import { CountUp } from "@/components/motion/count-up"
import { Reveal } from "@/components/motion/reveal"
import { marketing } from "@/content/marketing"

const STATS = marketing.stats

export function StatsBand() {
  if (STATS.length === 0) return null

  return (
    <section className="grid grid-cols-2 border-t border-[var(--border-1)] lg:grid-cols-4">
      {STATS.map((stat, i) => (
        <Reveal
          key={stat.label}
          delay={i * 0.08}
          className={
            "flex flex-col gap-2 px-5 py-10 " +
            (i > 0 ? "lg:border-l lg:border-[var(--border)] " : "") +
            (i % 2 === 1 ? "border-l border-[var(--border)] lg:border-l " : "") +
            (i >= 2 ? "border-t border-[var(--border)] lg:border-t-0 " : "")
          }
        >
          <div className="font-mono text-[clamp(32px,4vw,48px)] leading-none font-medium tracking-[-0.02em] text-[var(--fg-0)]">
            {stat.prefix}
            <CountUp to={stat.value} decimals={stat.decimals} />
            {stat.suffix && (
              <span className="text-[var(--accent)]">{stat.suffix}</span>
            )}
          </div>
          <div className="font-mono text-[10px] tracking-[0.1em] text-[var(--fg-3)] uppercase">
            {stat.label}
          </div>
        </Reveal>
      ))}
    </section>
  )
}
