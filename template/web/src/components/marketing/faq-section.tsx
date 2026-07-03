// FAQ — objection handling before the final CTA. Native <details>/<summary>
// (no JS, accessible, hard-edged) styled with semantic tokens.

import { Reveal } from "@/components/motion/reveal"
import { marketing } from "@/content/marketing"

export function FaqSection() {
  const faq = marketing.faq
  if (!faq || faq.items.length === 0) return null

  return (
    <section id="faq" className="border-t border-[var(--border-1)] py-16 lg:py-20">
      <div className="mx-auto max-w-[760px]">
        <Reveal>
          <div className="mb-10 text-center font-mono text-[10px] tracking-[0.1em] text-[var(--fg-3)] uppercase">
            {faq.heading}
          </div>
        </Reveal>

        <div className="border-t border-[var(--border-1)]">
        {faq.items.map((item, i) => (
          <Reveal key={item.q} delay={i * 0.05}>
            <details className="group border-b border-[var(--border-1)]">
              <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-5 font-sans text-[16px] font-medium text-[var(--fg-0)] transition-colors duration-150 hover:text-[var(--accent)] [&::-webkit-details-marker]:hidden">
                <span className="flex items-baseline gap-4">
                  <span className="font-mono text-[10px] tracking-[0.1em] text-[var(--fg-3)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {item.q}
                </span>
                <span
                  aria-hidden="true"
                  className="font-mono text-[14px] text-[var(--fg-3)] transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="m-0 pb-6 pl-10 font-sans text-[14px] leading-[1.65] text-[var(--fg-2)]">
                {item.a}
              </p>
            </details>
          </Reveal>
        ))}
        </div>
      </div>
    </section>
  )
}
