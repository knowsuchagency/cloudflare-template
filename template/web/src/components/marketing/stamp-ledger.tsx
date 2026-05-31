type LogEntry = { k: string; v: string; tone?: "default" | "accent" }

const ENTRIES: LogEntry[] = [
  { k: "Observation:", v: "New deploy detected on branch main." },
  { k: "Inference:", v: "Edge bundle size +3.2KB vs previous stamp." },
  { k: "Action:", v: "Promote to production after smoke checks." },
  {
    k: "",
    v: "Human validation required before network reroute.",
    tone: "accent",
  },
]

export function StampLedger() {
  return (
    <div className="border border-[var(--ink)] bg-[var(--paper-0)]">
      {/* Eyebrow header */}
      <div className="flex items-center justify-between border-b border-[var(--ink)] px-4 py-2">
        <span className="bg-[var(--ink)] px-2 py-1 font-mono text-[10px] leading-none tracking-[0.08em] uppercase text-[var(--paper-0)]">
          [ SYSTEM INSIGHT LOG ]
        </span>
        <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-[var(--ink-ghost)]">
          REPORT ID · DEPLOY-2026-001
        </span>
      </div>

      {/* Log body */}
      <div className="flex flex-col gap-1 px-4 py-4 font-mono text-[13px] leading-[1.55]">
        {ENTRIES.map((e) => (
          <div
            key={e.v}
            className={
              e.tone === "accent" ? "text-[var(--orange)]" : "text-[var(--ink)]"
            }
          >
            {e.k && <span className="text-[var(--ink-3)] mr-2">{e.k}</span>}
            <span>{e.v}</span>
          </div>
        ))}
      </div>

      {/* Footer metadata row */}
      <div className="flex items-center justify-between border-t border-[var(--ink)] px-4 py-2">
        <span className="flex items-center gap-[6px] font-mono text-[10px] tracking-[0.08em] uppercase text-[var(--ink-ghost)]">
          <span
            className="block size-[6px] bg-[var(--orange)]"
            aria-hidden="true"
          />
          STAMP REF · T-LAB-23421-U8-FWD
        </span>
        <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-[var(--ink-ghost)]">
          (c) 2026 · V.01
        </span>
      </div>
    </div>
  )
}
