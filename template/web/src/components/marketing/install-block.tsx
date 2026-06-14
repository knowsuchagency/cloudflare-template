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
    <div className="border border-[var(--border-1)] bg-[var(--bg-1)]">
      {/* Eyebrow header */}
      <div className="flex items-center justify-between border-b border-[var(--border-1)] px-4 py-2.5">
        <span className="font-mono text-[10px] leading-none tracking-[0.1em] uppercase text-[var(--fg-2)]">
          INSTALL
        </span>
        <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--fg-3)]">
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
              "flex items-center gap-[10px] border-b border-[var(--border)] px-4 py-[11px] text-left font-mono text-[13px] last:border-b-0 transition-colors duration-150 " +
              (i === active
                ? "bg-[var(--bg-2)]"
                : "bg-transparent hover:bg-[var(--bg-2)]")
            }
          >
            <span
              className={
                "block size-[7px] flex-shrink-0 " +
                (i === active
                  ? "bg-[var(--fg-0)]"
                  : "border border-[var(--fg-3)]")
              }
              aria-hidden="true"
            />
            <span className="text-[var(--fg-3)]">$</span>
            <span className="flex-1 text-[var(--fg-1)]">{step.cmd}</span>
            <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--fg-3)]">
              {step.id}
            </span>
          </button>
        ))}
      </div>

      {/* Copy footer */}
      <div className="flex items-center justify-between border-t border-[var(--border-1)] px-4 py-2.5">
        <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--fg-3)]">
          {copied ? "COPIED" : "CLIPBOARD READY"}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="cursor-pointer border border-[var(--border-1)] bg-transparent px-3 py-1 font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--fg-1)] hover:border-[var(--fg-0)] hover:text-[var(--fg-0)] transition-colors duration-150"
        >
          {copied ? "COPIED ✓" : "COPY"}
        </button>
      </div>
    </div>
  )
}
