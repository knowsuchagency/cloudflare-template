import { Link } from "react-router"

import { Button } from "@/components/ui/button"
import { HeroBackdrop } from "@/components/marketing/hero-backdrop"
import { SplitText } from "@/components/motion/split-text"
import { DecryptedText } from "@/components/motion/decrypted-text"
import { Reveal } from "@/components/motion/reveal"
import { marketing } from "@/content/marketing"

export function Hero() {
  const hero = marketing.hero

  return (
    <section className="relative py-16 lg:py-24">
      {/* Dithered halftone sphere — the one rendered moment on the page */}
      <HeroBackdrop />

      {/* Eyebrow — mono instrument label, edge-anchored */}
      {(hero.eyebrow || hero.eyebrowMeta) && (
        <div className="relative mb-12 flex items-center justify-between font-mono text-[10px] tracking-[0.1em] text-[var(--fg-2)] uppercase">
          {hero.eyebrow && <DecryptedText text={hero.eyebrow} duration={700} />}
          {hero.eyebrowMeta && (
            <span className="hidden sm:inline">
              <DecryptedText text={hero.eyebrowMeta} delay={200} duration={700} />
            </span>
          )}
        </div>
      )}

      {/* Value proposition — the mega-type moment, staggered rise */}
      <h1 className="relative m-0 mb-10 max-w-[13ch] font-display text-[clamp(44px,8.5vw,112px)] leading-[0.92] font-semibold tracking-[-0.03em] text-[var(--fg-0)] uppercase">
        <SplitText text={hero.headline} stagger={0.07} />
      </h1>

      {/* Mono metadata strip — decrypts into place, tertiary texture */}
      {hero.metadata && hero.metadata.length > 0 && (
        <div className="relative mb-10 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] tracking-[0.08em] text-[var(--fg-3)] uppercase">
          {hero.metadata.map((segment, i) => (
            <span key={segment} className="flex items-center gap-x-4">
              {i > 0 && <span aria-hidden>·</span>}
              <span className={i === 0 ? "text-[var(--fg-2)]" : undefined}>
                <DecryptedText text={segment} delay={300 + i * 200} />
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Subhead + supporting copy — secondary layer */}
      <Reveal delay={0.25} y={16}>
        <h2 className="m-0 mb-6 max-w-[680px] font-sans text-[28px] leading-[1.15] font-medium tracking-[-0.01em] text-[var(--fg-1)]">
          {hero.subhead}
        </h2>

        {hero.body && (
          <p className="m-0 mb-10 max-w-[600px] font-sans text-[15px] leading-[1.6] text-[var(--fg-2)]">
            {hero.body}
          </p>
        )}

        <div className="mb-16 flex flex-wrap items-center gap-3">
          {/* The page's single accent interrupt — the action we want taken. */}
          <Button size="lg" variant="accent" asChild>
            <Link to={hero.cta.to}>
              {hero.cta.label} <span aria-hidden>→</span>
            </Link>
          </Button>
          {hero.secondaryCta &&
            (hero.secondaryCta.to.startsWith("#") ? (
              <Button size="lg" variant="outline" asChild>
                <a href={hero.secondaryCta.to}>
                  {hero.secondaryCta.label} <span aria-hidden>↓</span>
                </a>
              </Button>
            ) : (
              <Button size="lg" variant="outline" asChild>
                <Link to={hero.secondaryCta.to}>
                  {hero.secondaryCta.label} <span aria-hidden>→</span>
                </Link>
              </Button>
            ))}
          {hero.riskReversal && (
            <span className="ml-1 font-mono text-[10px] tracking-[0.1em] text-[var(--fg-3)] uppercase">
              {hero.riskReversal}
            </span>
          )}
        </div>
      </Reveal>

      {/* Proof slot: a product screenshot in a hard-edged instrument frame. */}
      {hero.proof.mode === "image" && (
        <Reveal delay={0.35} y={20} className="relative">
          <figure className="m-0 border border-[var(--border-1)] bg-[var(--bg-1)]">
            <div className="flex items-center justify-between border-b border-[var(--border-1)] px-4 py-2.5">
              <span className="font-mono text-[10px] leading-none tracking-[0.1em] text-[var(--fg-2)] uppercase">
                {hero.proof.caption ?? "PREVIEW"}
              </span>
              <span className="font-mono text-[10px] leading-none tracking-[0.1em] text-[var(--fg-3)] uppercase">
                FIG · 01
              </span>
            </div>
            <img
              src={hero.proof.src}
              alt={hero.proof.alt}
              loading="lazy"
              className="block w-full"
            />
          </figure>
        </Reveal>
      )}
    </section>
  )
}
