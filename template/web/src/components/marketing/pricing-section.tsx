// Pricing — the plans mirror the built-in Stripe billing (see
// src/content/marketing.ts for the numbers and the sync note). Featured plan
// carries the page accent; everything else stays monochrome.

import { Link } from "react-router"

import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/motion/reveal"
import { marketing } from "@/content/marketing"

export function PricingSection() {
  const pricing = marketing.pricing
  if (!pricing || pricing.plans.length === 0) return null

  return (
    <section id="pricing" className="border-t border-[var(--border-1)] py-16 lg:py-20">
      <div className="mx-auto max-w-[880px]">
      <Reveal>
        <div className="mb-3 text-center font-mono text-[10px] tracking-[0.1em] text-[var(--fg-3)] uppercase">
          {pricing.heading}
        </div>
        {pricing.subhead && (
          <h2 className="mx-auto mt-0 mb-10 max-w-[560px] text-center font-sans text-[clamp(24px,3.4vw,36px)] leading-[1.1] font-medium tracking-[-0.01em] text-[var(--fg-0)]">
            {pricing.subhead}
          </h2>
        )}
      </Reveal>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {pricing.plans.map((plan, i) => (
          <Reveal key={plan.name} delay={i * 0.1} className="flex">
            <article
              className={
                "flex w-full flex-col border bg-[var(--bg-1)] " +
                (plan.featured
                  ? "border-[var(--accent)] border-t-4"
                  : "border-[var(--border-1)]")
              }
            >
              {/* Header row */}
              <div className="flex items-center justify-between border-b border-[var(--border-1)] px-5 py-3">
                <span className="font-mono text-[11px] tracking-[0.1em] text-[var(--fg-1)] uppercase">
                  {plan.name}
                </span>
                {plan.badge && (
                  <span className="bg-[var(--accent)] px-2 py-1 font-mono text-[9px] leading-none tracking-[0.1em] text-white uppercase">
                    {plan.badge}
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="px-5 pt-6 pb-4">
                <div className="font-mono text-[48px] leading-none font-medium tracking-[-0.02em] text-[var(--fg-0)]">
                  {plan.price}
                  {plan.cadence && (
                    <span className="text-[14px] tracking-[0] text-[var(--fg-3)]">
                      {plan.cadence}
                    </span>
                  )}
                </div>
                {plan.description && (
                  <p className="m-0 mt-3 font-sans text-[13px] leading-[1.55] text-[var(--fg-2)]">
                    {plan.description}
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="m-0 flex list-none flex-col gap-2 px-5 pb-6">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-baseline gap-2.5 font-mono text-[12px] leading-[1.5] text-[var(--fg-1)]"
                  >
                    <span
                      aria-hidden="true"
                      className={
                        "text-[10px] " +
                        (plan.featured
                          ? "text-[var(--accent)]"
                          : "text-[var(--fg-3)]")
                      }
                    >
                      ▪
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-auto border-t border-[var(--border-1)] p-5">
                <Button
                  size="lg"
                  variant={plan.featured ? "accent" : "outline"}
                  className="w-full"
                  asChild
                >
                  <Link to={plan.cta.to}>
                    {plan.cta.label} <span aria-hidden>→</span>
                  </Link>
                </Button>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      {pricing.footnote && (
        <p className="mx-auto mt-6 mb-0 max-w-[640px] text-center font-mono text-[10px] leading-[1.6] tracking-[0.04em] text-[var(--fg-3)] uppercase">
          {pricing.footnote}
        </p>
      )}
      </div>
    </section>
  )
}
