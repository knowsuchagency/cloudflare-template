import { useState } from "react"

const COMMAND = "bunx wrangler deploy"

export function InstallBlock() {
  const [copied, setCopied] = useState(false)

  const onCopy = () => {
    void navigator.clipboard.writeText(COMMAND)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="my-8 flex justify-end">
      <div className="flex min-w-[480px] items-center gap-[10px] border-2 border-[var(--border-1)] bg-[var(--bg-1)] px-[14px] py-[10px] text-[13px]">
        <span className="font-bold text-[var(--bf-orange)]">$</span>
        <span className="flex-1 font-mono text-[var(--fg-1)]">
          bunx wrangler{" "}
          <span className="text-[var(--term-green)]">deploy</span>
        </span>
        <button
          type="button"
          onClick={onCopy}
          className={
            "cursor-pointer border bg-transparent px-[10px] py-1 font-mono text-[10px] tracking-[0.12em] uppercase " +
            (copied
              ? "border-[var(--term-green)] text-[var(--term-green)]"
              : "border-[var(--border-2)] text-[var(--fg-3)] hover:text-[var(--fg-1)] hover:border-[var(--fg-2)]")
          }
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>
    </div>
  )
}
