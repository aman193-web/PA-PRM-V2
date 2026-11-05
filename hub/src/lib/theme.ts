import { useSyncExternalStore } from "react"

export type ThemeChoice = "light" | "dark" | "auto"

// The reader's pick sits on top of whatever the viewer sets. "Auto" hands control back to the
// viewer's own data-theme (claude.ai) or, when there is none, the system setting.
const KEY = "prm-hub-theme"
const root = document.documentElement
let viewerTheme = root.getAttribute("data-theme")
let lastSet = viewerTheme
let choice: ThemeChoice = readChoice()
const listeners = new Set<() => void>()

function readChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY)
    return v === "light" || v === "dark" ? v : "auto"
  } catch { return "auto" }
}

function apply() {
  const want = choice === "auto" ? viewerTheme : choice
  lastSet = want
  if (want) root.setAttribute("data-theme", want)
  else root.removeAttribute("data-theme")
}

// A change we didn't make came from the viewer: remember it, and keep the reader's pick on top.
new MutationObserver(() => {
  const now = root.getAttribute("data-theme")
  if (now === lastSet) return
  viewerTheme = now
  apply()
}).observe(root, { attributes: true, attributeFilter: ["data-theme"] })

apply()

export function setTheme(next: ThemeChoice) {
  choice = next
  try {
    if (next === "auto") localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, next)
  } catch { /* storage blocked; the pick lasts for this visit */ }
  apply()
  listeners.forEach((l) => l())
}

export function useTheme(): ThemeChoice {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l) } },
    () => choice,
  )
}
