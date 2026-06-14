// Theme is one of three states. "system" follows the OS via the light-dark()
// tokens in index.css (no data-theme attribute); "light"/"dark" pin one mode by
// setting data-theme on <html>, which flips color-scheme. The pre-paint script
// in index.html reads the same localStorage key to avoid a flash on first load.

export type Theme = "system" | "light" | "dark"

const STORAGE_KEY = "theme"

export function getTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "light" || stored === "dark") return stored
  } catch {
    // localStorage unavailable (private mode, SSR) — fall through to system.
  }
  return "system"
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (theme === "system") {
    root.removeAttribute("data-theme")
  } else {
    root.setAttribute("data-theme", theme)
  }
  try {
    if (theme === "system") localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Persisting is best-effort; the in-memory toggle still works without it.
  }
}
