// Stack ticker — an industrial conveyor tape between hero and features.
// Pure CSS marquee (no WebGL): mono, uppercase, ghosted, hard borders.
// Inspired by react-bits LogoLoop; freezes under prefers-reduced-motion.
// Items come from the content file; an empty list hides the tape.

import { marketing } from "@/content/marketing"

export function Ticker() {
  const items = marketing.ticker
  if (items.length === 0) return null

  const row = items.map((item) => (
    <span key={item} className="flex items-center gap-8">
      <span>{item}</span>
      <span aria-hidden="true" className="text-[var(--accent)]">
        ▪
      </span>
    </span>
  ))

  return (
    <div
      role="marquee"
      aria-label={items.join(", ")}
      className="relative flex overflow-hidden border-y border-[var(--border-1)] bg-[var(--bg-1)] py-3"
    >
      <style>{`
        @keyframes marketing-ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marketing-ticker-track { animation: none !important; }
        }
      `}</style>
      <div
        aria-hidden="true"
        className="marketing-ticker-track flex w-max shrink-0 items-center gap-8 pr-8 font-mono text-[11px] tracking-[0.12em] whitespace-nowrap text-[var(--fg-3)] uppercase"
        style={{ animation: "marketing-ticker 36s linear infinite" }}
      >
        {/* Two copies in separate parents so the -50% loop is seamless. */}
        <div className="flex items-center gap-8">{row}</div>
        <div className="flex items-center gap-8">{row}</div>
      </div>
    </div>
  )
}
