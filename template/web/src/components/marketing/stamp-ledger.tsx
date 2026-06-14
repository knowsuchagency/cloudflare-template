type LogEntry = { k: string; v: string; tone?: "default" | "strong" }

const ENTRIES: LogEntry[] = [
  { k: "Observation:", v: "New deploy detected on branch main." },
  { k: "Inference:", v: "Edge bundle size +3.2KB vs previous build." },
  { k: "Action:", v: "Promote to production after smoke checks." },
  {
    k: "",
    v: "Human validation required before network reroute.",
    tone: "strong",
  },
]

export function StampLedger() {
  return (
    <div className="border border-[var(--border-1)] bg-[var(--bg-1)]">
      {/* Eyebrow header */}
      <div className="flex items-center justify-between border-b border-[var(--border-1)] px-4 py-2.5">
        <span className="font-mono text-[10px] leading-none tracking-[0.1em] uppercase text-[var(--fg-2)]">
          SYSTEM LOG
        </span>
        <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--fg-3)]">
          REPORT · DEPLOY-2026-001
        </span>
      </div>

      {/* Log body */}
      <div className="flex flex-col gap-1.5 px-4 py-4 font-mono text-[13px] leading-[1.55]">
        {ENTRIES.map((e) => (
          <div
            key={e.v}
            className={
              e.tone === "strong"
                ? "text-[var(--fg-0)]"
                : "text-[var(--fg-1)]"
            }
          >
            {e.k && <span className="text-[var(--fg-3)] mr-2">{e.k}</span>}
            <span>{e.v}</span>
          </div>
        ))}
      </div>

      {/* Footer metadata row */}
      <div className="flex items-center justify-between border-t border-[var(--border-1)] px-4 py-2.5">
        <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--fg-3)]">
          REF · T-LAB-23421-U8-FWD
        </span>
        <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--fg-3)]">
          V.01
        </span>
      </div>
    </div>
  )
}
