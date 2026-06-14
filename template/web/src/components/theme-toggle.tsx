import { useEffect, useState } from "react"
import { Monitor, Moon, Sun } from "lucide-react"

import { applyTheme, getTheme, type Theme } from "@/lib/theme"

const ORDER: Theme[] = ["system", "light", "dark"]
const ICON = { system: Monitor, light: Sun, dark: Moon } as const
const LABEL = { system: "SYS", light: "LGT", dark: "DRK" } as const

// Cycles System → Light → Dark. A mono label keeps it instrument-panel honest;
// the icon is the one-glance state.
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("system")

  // Sync from storage on mount (the pre-paint script already applied it).
  useEffect(() => {
    setTheme(getTheme())
  }, [])

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]
    setTheme(next)
    applyTheme(next)
  }

  const Icon = ICON[theme]

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${theme}. Click to change.`}
      title={`Theme: ${theme}`}
      className={
        "inline-flex h-8 cursor-pointer items-center gap-2 border border-[var(--border-1)] px-2.5 font-mono text-[10px] tracking-[0.1em] text-[var(--fg-2)] uppercase transition-colors duration-150 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:border-[var(--fg-1)] hover:text-[var(--fg-1)] " +
        (className ?? "")
      }
    >
      <Icon className="size-3.5" />
      {LABEL[theme]}
    </button>
  )
}
