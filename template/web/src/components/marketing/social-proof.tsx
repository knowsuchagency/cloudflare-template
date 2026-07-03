// Social proof — text logos + testimonial cards. Renders NOTHING until the
// content file has real logos or quotes: never ship fake proof.

import { Reveal } from "@/components/motion/reveal"
import { marketing } from "@/content/marketing"

export function SocialProof() {
  const proof = marketing.socialProof
  const hasLogos = proof.logos.length > 0
  const hasTestimonials = proof.testimonials.length > 0
  if (!hasLogos && !hasTestimonials) return null

  return (
    <section className="border-t border-[var(--border-1)] py-16 lg:py-20">
      {proof.heading && (
        <Reveal>
          <div className="mb-10 font-mono text-[10px] tracking-[0.1em] text-[var(--fg-3)] uppercase">
            {proof.heading}
          </div>
        </Reveal>
      )}

      {hasLogos && (
        <Reveal>
          <div className="mb-12 flex flex-wrap items-center gap-x-10 gap-y-4">
            {proof.logos.map((logo) =>
              logo.href ? (
                <a
                  key={logo.name}
                  href={logo.href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[13px] tracking-[0.12em] text-[var(--fg-3)] uppercase no-underline transition-colors duration-150 hover:text-[var(--fg-1)]"
                >
                  {logo.name}
                </a>
              ) : (
                <span
                  key={logo.name}
                  className="font-mono text-[13px] tracking-[0.12em] text-[var(--fg-3)] uppercase"
                >
                  {logo.name}
                </span>
              )
            )}
          </div>
        </Reveal>
      )}

      {hasTestimonials && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {proof.testimonials.map((t, i) => (
            <Reveal key={t.name + t.quote} delay={i * 0.08} className="flex">
              <figure className="m-0 flex w-full flex-col justify-between gap-6 border border-[var(--border-1)] bg-[var(--bg-1)] p-6">
                <blockquote className="m-0 font-sans text-[15px] leading-[1.6] text-[var(--fg-1)]">
                  <span aria-hidden="true" className="text-[var(--accent)]">
                    “
                  </span>
                  {t.quote}
                  <span aria-hidden="true" className="text-[var(--accent)]">
                    ”
                  </span>
                </blockquote>
                <figcaption className="font-mono text-[10px] tracking-[0.1em] text-[var(--fg-3)] uppercase">
                  {t.name}
                  {t.role && <span className="text-[var(--fg-4)]"> · {t.role}</span>}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  )
}
