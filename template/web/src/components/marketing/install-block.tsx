import { useState } from "react"

type Step = { id: string; cmd: string }

const STEPS: Step[] = [
  { id: "01", cmd: "bunx wrangler deploy" },
  { id: "02", cmd: "bunx wrangler d1 migrations apply" },
  { id: "03", cmd: "open https://<your-worker>.workers.dev" },
]

export function InstallBlock() {
  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState(false)

  const onCopy = () => {
    void navigator.clipboard.writeText(STEPS[active].cmd)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="border border-[var(--ink)] bg-[var(--paper-0)]">
      {/* Eyebrow header */}
      <div className="flex items-center justify-between border-b border-[var(--ink)] px-4 py-2">
        <span className="bg-[var(--ink)] px-2 py-1 font-mono text-[10px] leading-none tracking-[0.08em] uppercase text-[var(--paper-0)]">
          [ INSTALL ]
        </span>
        <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-[var(--ink-ghost)]">
          STEP {STEPS[active].id} / {String(STEPS.length).padStart(2, "0")}
        </span>
      </div>

      {/* Steps */}
      <div className="flex flex-col">
        {STEPS.map((step, i) => (
          <button
            key={step.id}
            type="button"
            onClick={() => setActive(i)}
            className={
              "flex items-center gap-[10px] border-b border-[var(--ink)] px-4 py-[10px] text-left font-mono text-[13px] last:border-b-0 transition-colors duration-[120ms] " +
              (i === active
                ? "bg-[var(--paper-0)]"
                : "bg-[var(--paper-1)] hover:bg-[var(--paper-0)]")
            }
          >
            <span
              className={
                "block size-[8px] flex-shrink-0 " +
                (i === active ? "bg-[var(--orange)]" : "bg-[var(--ink-ghost)]")
              }
              aria-hidden="true"
            />
            <span className="font-bold text-[var(--orange)]">$</span>
            <span className="flex-1 text-[var(--ink)]">{step.cmd}</span>
            <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-[var(--ink-ghost)]">
              {step.id}
            </span>
          </button>
        ))}
      </div>

      {/* Copy footer */}
      <div className="flex items-center justify-between border-t border-[var(--ink)] px-4 py-2">
        <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-[var(--ink-3)]">
          {copied ? "COPIED" : "CLIPBOARD READY"}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="cursor-pointer border border-[var(--ink)] bg-transparent px-3 py-1 font-mono text-[10px] tracking-[0.08em] uppercase text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper-0)] transition-colors duration-[120ms]"
        >
          {copied ? "COPIED ✓" : "COPY"}
        </button>
      </div>
    </div>
  )
}
