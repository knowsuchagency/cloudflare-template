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
      className="border-t border-[var(--border-1)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
    >
      {FEATURES.map((f, i) => (
        <article
          key={f.title}
          className={
            "relative flex flex-col gap-5 px-5 py-8 " +
            // Hairline dividers between columns; only show on the relevant breakpoints
            (i > 0 ? "lg:border-l lg:border-[var(--border)] " : "") +
            (i % 2 === 1 ? "sm:border-l sm:border-[var(--border)] " : "") +
            (i >= 2 ? "sm:border-t sm:border-[var(--border)] lg:border-t-0 " : "")
          }
        >
          {/* Top: numeric eyebrow — mono, quiet */}
          <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--fg-3)]">
            {String(i + 1).padStart(2, "0")} /{" "}
            {String(FEATURES.length).padStart(2, "0")}
          </div>

          {/* Middle: heading — Space Grotesk */}
          <h3 className="font-sans text-[18px] font-medium leading-[1.2] tracking-[-0.01em] text-[var(--fg-0)]">
            {f.title}
          </h3>

          {/* Body */}
          <p className="font-sans text-[13px] leading-[1.55] text-[var(--fg-2)]">
            {f.body}
          </p>

          {/* Bottom: caption */}
          <div className="mt-auto pt-3">
            <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--fg-3)]">
              {f.caption}
            </span>
          </div>
        </article>
      ))}
    </section>
  )
}
