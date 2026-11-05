import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { byId } from "@hub/content"

export type Page = "ask" | "personas" | "matrix" | "rules" | "flows" | "map" | "why" | "gaps" | "reference"
export const pages: Page[] = ["ask", "personas", "matrix", "rules", "flows", "map", "why", "gaps", "reference"]

export interface View { page: Page; id?: string }

interface Nav {
  view: View
  go: (page: Page, id?: string) => void
  open: (id: string) => void
  inspected: string | null
  inspect: (id: string | null) => void
  askAssistant: (q?: string) => void
  assistantQ: { q: string; n: number } | null
  assistantOpen: boolean
  setAssistantOpen: (o: boolean) => void
}

const Ctx = createContext<Nav | null>(null)

function token(v: View) {
  return v.id ?? (v.page === "ask" ? "" : v.page)
}

function readHash(): View {
  try {
    const t = decodeURIComponent(window.location.hash.slice(1))
    if (!t) return { page: "ask" }
    if ((pages as string[]).includes(t)) return { page: t as Page }
    const item = byId.get(t)
    if (item?.kind === "persona") return { page: "personas", id: t }
    if (item?.kind === "flow") return { page: "flows", id: t }
    if (item?.kind === "entity") return { page: "map", id: t }
  } catch { /* plain view */ }
  return { page: "ask" }
}

export function NavProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>(readHash)
  const [inspected, setInspected] = useState<string | null>(() => {
    try {
      const t = decodeURIComponent(window.location.hash.slice(1))
      const k = byId.get(t)?.kind
      return k && !["persona", "flow", "entity"].includes(k) ? t : null
    } catch { return null }
  })
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantQ, setAssistantQ] = useState<{ q: string; n: number } | null>(null)

  const go = useCallback((page: Page, id?: string) => {
    setView({ page, id })
    setInspected(null)
    window.scrollTo({ top: 0 })
  }, [])

  // Open any item where it lives best: personas, flows and records have their own pages; the rest open in the panel.
  const open = useCallback((id: string) => {
    const item = byId.get(id)
    if (!item) return
    if (item.kind === "persona") go("personas", id)
    else if (item.kind === "flow") go("flows", id)
    else if (item.kind === "entity") go("map", id)
    else setInspected(id)
  }, [go])

  useEffect(() => {
    try { history.replaceState(null, "", `#${encodeURIComponent(inspected ?? token(view))}`) } catch { /* not allowed here */ }
  }, [view, inspected])

  // Follow plain #id links typed or pasted into the address bar (replaceState above doesn't fire this).
  useEffect(() => {
    const onHash = () => {
      let t = ""
      try { t = decodeURIComponent(window.location.hash.slice(1)) } catch { return }
      const k = byId.get(t)?.kind
      if (k && !["persona", "flow", "entity"].includes(k)) { setInspected(t); return }
      setView(readHash())
      setInspected(null)
    }
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  const value = useMemo<Nav>(() => ({
    view, go, open, inspected, inspect: setInspected,
    askAssistant: (q?: string) => { setAssistantOpen(true); if (q) setAssistantQ((p) => ({ q, n: (p?.n ?? 0) + 1 })) },
    assistantQ, assistantOpen, setAssistantOpen,
  }), [view, go, open, inspected, assistantQ, assistantOpen])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useNav() {
  const n = useContext(Ctx)
  if (!n) throw new Error("useNav outside provider")
  return n
}
