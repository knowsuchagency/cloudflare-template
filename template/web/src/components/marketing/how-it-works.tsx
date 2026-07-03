// How it works — a numbered three-step band for skeptics who scroll.
// Steps come from the content file; section hides when absent.

import { Reveal } from "@/components/motion/reveal"
import { marketing } from "@/content/marketing"

export function HowItWorks() {
  const how = marketing.howItWorks
  if (!how || how.steps.length === 0) return null

  return (
    <section className="border-t border-[var(--border-1)] py-16 lg:py-20">
      <Reveal>
        <div className="mb-10 font-mono text-[10px] tracking-[0.1em] text-[var(--fg-3)] uppercase">
          {how.heading}
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-px sm:grid-cols-3">
        {how.steps.map((step, i) => (
          <Reveal
            key={step.title}
            delay={i * 0.1}
            className={
              "flex flex-col gap-4 py-2 sm:px-6 " +
              (i > 0 ? "sm:border-l sm:border-[var(--border)] " : "sm:pl-0 ")
            }
          >
            <div className="font-mono text-[clamp(28px,3.4vw,40px)] leading-none font-medium text-[var(--accent)]">
              {String(i + 1).padStart(2, "0")}
            </div>
            <h3 className="m-0 font-sans text-[16px] font-medium tracking-[-0.01em] text-[var(--fg-0)] uppercase">
              {step.title}
            </h3>
            <p className="m-0 font-sans text-[13px] leading-[1.6] text-[var(--fg-2)]">
              {step.body}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
