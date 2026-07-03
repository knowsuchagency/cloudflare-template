import { useEffect, useMemo, useState } from "react"

/**
 * Resolve CSS custom properties (e.g. "--accent") to concrete rgb() strings
 * the WebGL shaders can consume. Custom props can hold light-dark()
 * expressions that only resolve when *used*, so we paint each token onto a
 * hidden probe element and read back the computed color. Re-resolves when the
 * explicit theme (data-theme on <html>) or the OS color scheme changes, so
 * shader colors follow the theme toggle live.
 */
export function useTokenColors(tokens: readonly string[]): string[] | null {
  const [colors, setColors] = useState<string[] | null>(null)
  // Re-run only when the actual token names change, not the array identity.
  const key = tokens.join("|")

  useEffect(() => {
    const names = key.split("|")
    const probe = document.createElement("span")
    probe.style.position = "absolute"
    probe.style.visibility = "hidden"
    probe.style.pointerEvents = "none"
    document.body.appendChild(probe)

    const resolve = () => {
      setColors(
        names.map((name) => {
          probe.style.color = `var(${name})`
          return getComputedStyle(probe).color
        })
      )
    }
    resolve()

    const observer = new MutationObserver(resolve)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    })
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    media.addEventListener("change", resolve)

    return () => {
      observer.disconnect()
      media.removeEventListener("change", resolve)
      probe.remove()
    }
  }, [key])

  return colors
}

/** Convenience: honors prefers-reduced-motion for shader speeds. */
export function usePrefersReducedMotion(): boolean {
  const media = useMemo(
    () =>
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null,
    []
  )
  const [reduced, setReduced] = useState(() => media?.matches ?? false)

  useEffect(() => {
    if (!media) return
    const onChange = () => setReduced(media.matches)
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [media])

  return reduced
}
