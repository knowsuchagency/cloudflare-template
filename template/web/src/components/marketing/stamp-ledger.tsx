type Status = "live" | "pass" | "reverted"

type Stamp = {
  hash: string
  when: string
  subj: string
  status: Status
  pct?: number
}

const STAMPS: Stamp[] = [
  {
    hash: "@v9f3a1c",
    when: "2m ago",
    subj: "feat(api): pin session refresh budget",
    status: "live",
    pct: 72,
  },
  {
    hash: "@v8c4d22",
    when: "27m ago",
    subj: "fix: better-auth cookie domain on preview",
    status: "pass",
  },
  {
    hash: "@v7a019e",
    when: "2h ago",
    subj: "chore: bump hono and react-router",
    status: "pass",
  },
  {
    hash: "@v68fb01",
    when: "5h ago",
    subj: "experiment: edge cache for /api/me",
    status: "reverted",
  },
  {
    hash: "@v5d3201",
    when: "yday",
    subj: "feat(ui): brutalist auth pages",
    status: "pass",
  },
  {
    hash: "@v4a118c",
    when: "2d ago",
    subj: "init: scaffold worker + d1 schema",
    status: "pass",
  },
]

const CHIP: Record<Status, { label: string; glyph: string }> = {
  live: { label: "LIVE", glyph: "●" },
  pass: { label: "PASS", glyph: "✓" },
  reverted: { label: "REVRT", glyph: "↶" },
}

const STATUS_BORDER: Record<Status, string> = {
  live: "var(--bf-orange)",
  pass: "var(--term-green)",
  reverted: "var(--bf-orange-deep)",
}

const CHIP_COLOR: Record<Status, string> = {
  live: "var(--term-green)",
  pass: "var(--term-green)",
  reverted: "var(--bf-orange-hot)",
}

export function StampLedger() {
  return (
    <div className="border-2 border-[var(--border-1)] bg-[var(--bg-1)] px-5 pt-[18px] pb-4 font-mono text-[13px]">
      <div className="flex items-baseline gap-2 border-b border-[var(--border-1)] pb-[14px] text-[13px] text-[var(--fg-2)]">
        <span className="font-bold text-[var(--bf-orange)]">&gt;</span>
        <span className="text-[var(--fg-1)]">
          wrangler deployments list{" "}
          <span className="text-[var(--fg-3)]">--latest</span>
        </span>
        <span
          className="ml-[2px] text-[var(--bf-orange)]"
          style={{
            fontFamily: "var(--font-pixel)",
            animation: "bf-blink 1.2s steps(2) infinite",
          }}
        >
          _
        </span>
      </div>

      <div className="flex flex-col">
        {STAMPS.map((s) => (
          <Row key={s.hash} stamp={s} />
        ))}
      </div>

      <div className="mt-[14px] flex items-center gap-[10px] border-t border-dashed border-[var(--border-1)] pt-3 text-[11px] tracking-wide text-[var(--fg-3)]">
        <span
          className="size-[7px] rounded-full bg-[var(--bf-orange)]"
          style={{ animation: "bf-pulse 1.6s ease-in-out infinite" }}
        />
        every deploy versioned · revertible
      </div>
    </div>
  )
}

function Row({ stamp }: { stamp: Stamp }) {
  const { hash, when, subj, status, pct } = stamp
  const chip = CHIP[status]
  const isLive = status === "live"
  const isReverted = status === "reverted"

  return (
    <div
      className="group relative -mx-2 grid grid-cols-[auto_64px_1fr_auto_auto] items-center gap-[14px] border-b border-dashed border-[var(--border-1)] border-l-2 py-[11px] pr-3 pl-[14px] transition-colors last:border-b-0 hover:bg-[rgba(255,107,26,0.04)]"
      style={{
        borderLeftColor: STATUS_BORDER[status],
        opacity: isReverted ? 0.85 : 1,
      }}
    >
      <span
        className="text-[14px] tracking-wide text-[var(--bf-orange)]"
        style={{ fontFamily: "var(--font-pixel)" }}
      >
        {hash}
      </span>
      <span className="text-[11px] tracking-wide text-[var(--fg-3)]">
        {when}
      </span>
      <span
        className={
          "min-w-0 truncate text-[13px] " +
          (isReverted
            ? "text-[var(--fg-2)] line-through decoration-[var(--fg-3)]"
            : "text-[var(--fg-1)]")
        }
      >
        {subj}
      </span>
      <span
        className="inline-flex items-center gap-[6px] text-[11px] font-semibold tracking-[0.10em] whitespace-nowrap"
        style={{ color: CHIP_COLOR[status] }}
      >
        <span className="text-[var(--fg-3)] font-normal">[</span>
        {chip.label}{" "}
        <span
          className="text-[12px]"
          style={
            isLive
              ? {
                  animation: "bf-pulse 1.6s ease-in-out infinite",
                  textShadow: "0 0 6px var(--term-green)",
                }
              : undefined
          }
        >
          {chip.glyph}
        </span>
        <span className="text-[var(--fg-3)] font-normal">]</span>
      </span>
      {isLive ? (
        <span className="w-[40px] text-right text-[12px] tabular-nums text-[var(--fg-2)]">
          {pct}%
        </span>
      ) : (
        <button
          type="button"
          className="inline-flex w-[88px] cursor-pointer items-center justify-end gap-[5px] border-0 bg-transparent p-0 text-[11px] tracking-wide text-[var(--fg-3)] opacity-0 transition-[opacity,color] group-hover:opacity-100 hover:text-[var(--bf-orange)]"
        >
          <span className="text-[12px]">↶</span> rollback
        </button>
      )}
      {isLive && (
        <span className="col-span-full mt-[9px] block h-[4px] border border-[var(--border-1)] bg-[var(--bg-3)]">
          <span
            className="block h-full"
            style={{
              width: `${pct}%`,
              background:
                "repeating-linear-gradient(90deg, var(--bf-orange) 0 6px, var(--bf-orange-deep) 6px 7px)",
            }}
          />
        </span>
      )}
    </div>
  )
}
