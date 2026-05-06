import { Database, GitBranch, Lock, Zap, type LucideIcon } from "lucide-react"

type Feature = {
  Icon: LucideIcon
  title: string
  body: string
}

const FEATURES: Feature[] = [
  {
    Icon: Zap,
    title: "Edge-first runtime",
    body: "Hono on Cloudflare Workers. Cold start in single-digit ms, anywhere your users are.",
  },
  {
    Icon: Lock,
    title: "Email + password auth",
    body: "Better Auth wired to D1 with secure cookies, ready for sign-up and sign-in out of the box.",
  },
  {
    Icon: Database,
    title: "D1 + Drizzle ready",
    body: "SQLite at the edge, type-safe queries, migrations on deploy. No ORM cliffs.",
  },
  {
    Icon: GitBranch,
    title: "Preview per branch",
    body: "Workers Builds spins up a sibling Worker + D1 for every PR. Test the migration before main.",
  },
]

export function FeatureRow() {
  return (
    <section
      id="features"
      className="grid grid-cols-1 gap-9 border-t border-[var(--border-1)] py-9 sm:grid-cols-2 lg:grid-cols-4"
    >
      {FEATURES.map(({ Icon, title, body }) => (
        <div key={title} className="flex items-start gap-[14px]">
          <Icon
            className="mt-[2px] size-6 shrink-0 text-[var(--term-green)]"
            strokeWidth={1.6}
          />
          <div>
            <div className="mb-1 text-[14px] font-bold text-[var(--fg-1)]">
              {title}
            </div>
            <div className="text-[12px] leading-[1.5] text-[var(--fg-2)]">
              {body}
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}
