export function TerminalPanel() {
  return (
    <div className="border-2 border-[var(--border-1)] bg-[var(--bg-1)] font-mono text-[13px]">
      {/* window chrome */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b-2 border-[var(--border-1)] px-4 py-3">
        <div className="flex gap-[6px]">
          <span className="size-[11px] rounded-full bg-[var(--tl-red)]" />
          <span className="size-[11px] rounded-full bg-[var(--tl-amber)]" />
          <span className="size-[11px] rounded-full bg-[var(--tl-green)]" />
        </div>
        <div className="text-center text-[13px] text-[var(--fg-2)]">
          app/main <span className="mx-2 text-[var(--fg-3)]">|</span> live
        </div>
        <div className="flex items-center gap-[6px] text-[11px] font-semibold tracking-[0.12em] text-[var(--term-green)]">
          <span
            className="size-2 rounded-full bg-[var(--term-green)]"
            style={{
              boxShadow: "0 0 8px var(--term-green)",
              animation: "bf-pulse 1.6s ease-in-out infinite",
            }}
          />
          LIVE
        </div>
      </div>

      {/* body */}
      <div className="flex flex-col gap-[14px] p-[18px]">
        {/* requests section */}
        <div className="border border-[var(--border-1)] px-4 py-[14px]">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-[var(--bf-orange)]">
              <span className="size-[9px] bg-[var(--bf-orange)]" />
              REQUESTS
            </div>
            <div className="text-[11px] tracking-wider text-[var(--fg-3)]">
              <span className="font-semibold text-[var(--fg-2)]">2</span> active
            </div>
          </div>

          <Row
            name="GET /api/me"
            tag="200"
            tagColor="var(--term-green)"
            progress={72}
          />
          <Row
            name="POST /api/auth/sign-in"
            tag="200"
            tagColor="var(--term-green)"
            progress={38}
            last
          />
        </div>

        {/* routes section */}
        <div className="border border-[var(--border-1)] px-4 py-[14px]">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-[var(--bf-orange)]">
              <span className="size-[9px] bg-[var(--bf-orange)]" />
              ROUTES
            </div>
            <div className="text-[11px] tracking-wider text-[var(--fg-3)]">
              4 mounted
            </div>
          </div>

          <RouteRow method="GET" path="/" border="var(--fg-3)" />
          <RouteRow
            method="GET"
            path="/api/auth/*"
            border="var(--bf-orange)"
            note="better-auth"
          />
          <RouteRow
            method="POST"
            path="/api/auth/*"
            border="var(--term-blue)"
            note="better-auth"
          />
          <RouteRow
            method="GET"
            path="/api/me"
            border="var(--term-green)"
            note="session"
          />

          <div className="mt-3 flex items-center gap-3 border-t border-dashed border-[var(--border-1)] pt-[10px] text-[11px] tracking-wide text-[var(--fg-3)]">
            <span className="size-[7px] rounded-full bg-[var(--bf-orange)]" />
            type-safe handlers · Cloudflare Workers
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({
  name,
  tag,
  tagColor,
  progress,
  last,
}: {
  name: string
  tag: string
  tagColor: string
  progress: number
  last?: boolean
}) {
  return (
    <div
      className={
        "grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 py-[5px] text-[13px] " +
        (last ? "" : "border-b border-dashed border-[var(--border-1)]")
      }
    >
      <span className="flex items-center gap-2 text-[var(--fg-1)]">
        <span
          className="size-[7px] rounded-full"
          style={{
            background: tagColor,
            boxShadow: `0 0 6px ${tagColor}`,
          }}
        />
        {name}
      </span>
      <span
        className="border px-2 py-[2px] text-[11px]"
        style={{ borderColor: "var(--border-1)", color: tagColor }}
      >
        {tag}
      </span>
      <span className="h-[6px] w-[80px] border border-[var(--border-1)] bg-[var(--bg-3)]">
        <span
          className="block h-full"
          style={{
            width: `${progress}%`,
            background:
              "repeating-linear-gradient(90deg, var(--bf-orange) 0 6px, var(--bf-orange-deep) 6px 7px)",
          }}
        />
      </span>
      <span className="w-[36px] text-right text-[12px] text-[var(--fg-2)]">
        {progress}%
      </span>
    </div>
  )
}

function RouteRow({
  method,
  path,
  border,
  note,
}: {
  method: string
  path: string
  border: string
  note?: string
}) {
  return (
    <div
      className="-ml-[10px] grid grid-cols-[16px_60px_auto_1fr] items-center gap-3 border-l-2 py-[6px] pl-[10px] text-[13px]"
      style={{ borderLeftColor: border }}
    >
      <span className="text-[var(--fg-3)]">─</span>
      <span
        className="border px-2 py-[2px] text-[11px] font-semibold"
        style={{ borderColor: "var(--border-1)", color: border }}
      >
        {method}
      </span>
      <span className="text-[var(--fg-1)]">{path}</span>
      {note && (
        <span className="text-right text-[12px] text-[var(--fg-3)]">
          {note}
        </span>
      )}
    </div>
  )
}
