type Feature = {
  title: string
  body: string
  caption: string
}

const FEATURES: Feature[] = [
  {
    title: "EDGE-FIRST RUNTIME",
    body: "Hono on Cloudflare Workers. Cold start in single-digit ms, anywhere your users are.",
    caption: "cf workers · v4",
  },
  {
    title: "EMAIL + PASSWORD AUTH",
    body: "Better Auth wired to D1 with secure cookies. Sign-up and sign-in out of the box.",
    caption: "better-auth · d1",
  },
  {
    title: "D1 + DRIZZLE READY",
    body: "SQLite at the edge, type-safe queries, migrations on deploy. No ORM cliffs.",
    caption: "sqlite · drizzle-orm",
  },
  {
    title: "PREVIEW PER BRANCH",
    body: "Workers Builds spins up a sibling Worker + D1 for every PR. Test the migration before main.",
    caption: "workers builds",
  },
]

export function FeatureRow() {
  return (
    <section
      id="features"
      className="border-t border-[var(--ink)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
    >
      {FEATURES.map((f, i) => (
        <article
          key={f.title}
          className={
            "relative flex flex-col gap-5 px-5 py-7 " +
            // Hairline dividers between columns; only show on the relevant breakpoints
            (i > 0 ? "lg:border-l lg:border-[var(--ink)] " : "") +
            (i % 2 === 1 ? "sm:border-l sm:border-[var(--ink)] " : "") +
            (i >= 2 ? "sm:border-t sm:border-[var(--ink)] lg:border-t-0 " : "")
          }
        >
          {/* Top: numeric eyebrow */}
          <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.08em] uppercase text-[var(--ink-ghost)]">
            <span>
              {String(i + 1).padStart(2, "0")} /{" "}
              {String(FEATURES.length).padStart(2, "0")}
            </span>
            <span
              className="block size-[6px] bg-[var(--orange)]"
              aria-hidden="true"
            />
          </div>

          {/* Middle: condensed title */}
          <h3 className="font-condensed text-[22px] font-bold leading-[1.05] tracking-[0.01em] text-[var(--ink)]">
            {f.title}
          </h3>

          {/* Body */}
          <p className="font-mono text-[12px] leading-[1.5] text-[var(--ink-2)]">
            {f.body}
          </p>

          {/* Bottom: orange rule + caption */}
          <div className="mt-auto pt-3 border-t border-[var(--orange)]">
            <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-[var(--ink-ghost)]">
              {f.caption}
            </span>
          </div>
        </article>
      ))}
    </section>
  )
}
