import { useEffect, useMemo, useRef, useState } from "react"
import { FileText, PieChart, Search as SearchIcon, UserPlus, Users } from "lucide-react"
import { PartnerAvatar } from "@/components/common"
import { money } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useQueue, useStore } from "@/store"

interface Hit {
  id: string
  group: "Registrations" | "Partners" | "Opportunities" | "Applications"
  title: string
  sub: string
  href: string
  avatar?: string
}

const groupIcon = { Registrations: FileText, Partners: Users, Opportunities: PieChart, Applications: UserPlus }

/** Search across everything a partner manager can see. `inline` renders results in place (phone sheet). */
export function GlobalSearch({ inline, autoFocus, onDone }: { inline?: boolean; autoFocus?: boolean; onDone?: () => void }) {
  const { state, partner } = useStore()
  const q = useQueue()
  const [text, setText] = useState("")
  const [open, setOpen] = useState(!!inline)
  const [cursor, setCursor] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const box = useRef<HTMLDivElement>(null)

  const all = useMemo<Hit[]>(() => [
    ...state.registrations.map((r) => ({
      id: r.id, group: "Registrations" as const, title: r.customer,
      sub: `${money(r.value)} · ${partner(r.partnerId)?.name} · ${r.id}`, href: `/registration/${r.id}`, avatar: partner(r.partnerId)?.name,
    })),
    ...state.partners.filter((p) => p.assigned).map((p) => ({
      id: p.id, group: "Partners" as const, title: p.name, sub: `${p.program} · ${p.tier} · ${p.contact.name}`, href: `/partner/${p.id}`, avatar: p.name,
    })),
    ...state.opportunities.map((o) => ({
      id: o.id, group: "Opportunities" as const, title: o.account, sub: `${money(o.value)} · ${o.stage} · ${o.id}`, href: `/opportunity/${o.id}`,
    })),
    ...state.applications.filter((a) => a.status === "new").map((a) => ({
      id: a.id, group: "Applications" as const, title: a.company, sub: `${a.program} program · ${a.hq}`, href: `/application/${a.id}`, avatar: a.company,
    })),
  ], [state, partner])

  const hits = useMemo(() => {
    const t = text.trim().toLowerCase()
    if (!t) {
      // Nothing typed yet: offer the things most likely needed next.
      const urgent = q.toDecide.slice(0, 3).map((r) => all.find((h) => h.id === r.id)!)
      return [...urgent, ...all.filter((h) => h.group === "Applications").slice(0, 2)]
    }
    return all.filter((h) => `${h.title} ${h.sub}`.toLowerCase().includes(t)).slice(0, 10)
  }, [text, all, q.toDecide])

  // ⌘K / Ctrl+K or "/" focuses the header search.
  useEffect(() => {
    if (inline) return
    const on = (e: KeyboardEvent) => {
      const typing = e.target instanceof Element && e.target.closest("input, textarea, [contenteditable]")
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault()
        input.current?.focus()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", on)
    return () => window.removeEventListener("keydown", on)
  }, [inline])

  useEffect(() => {
    if (inline) return
    const on = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", on)
    return () => document.removeEventListener("mousedown", on)
  }, [inline])

  const pick = (h: Hit) => {
    go(h.href)
    setText("")
    setOpen(!!inline)
    input.current?.blur()
    onDone?.()
  }

  const groups = (["Registrations", "Partners", "Opportunities", "Applications"] as const)
    .map((g) => ({ g, items: hits.filter((h) => h.group === g) }))
    .filter((x) => x.items.length)
  const flat = groups.flatMap((x) => x.items)

  const results = (
    <div className={cn(inline ? "mt-4" : "absolute top-[calc(100%+8px)] left-0 z-50 w-[min(520px,calc(100vw-32px))] rounded-[14px] border bg-popover p-2 shadow-[0_18px_50px_#102f5733]")}>
      {!text && <p className="px-3 pt-2 pb-1 text-[13px] font-semibold text-muted-foreground">Jump back in</p>}
      {flat.length === 0 ? (
        <p className="px-3 py-6 text-center text-muted-foreground">No matches for "{text}"</p>
      ) : (
        <div className="max-h-[min(440px,70svh)] overflow-y-auto">
          {groups.map(({ g, items }) => {
            const Icon = groupIcon[g]
            return (
              <div key={g} className="py-1">
                {text && <p className="flex items-center gap-1.5 px-3 pt-2 pb-1 text-[13px] font-semibold text-muted-foreground"><Icon className="size-3.5" /> {g}</p>}
                {items.map((h) => {
                  const idx = flat.indexOf(h)
                  return (
                    <button
                      key={h.group + h.id}
                      onMouseEnter={() => setCursor(idx)}
                      onClick={() => pick(h)}
                      className={cn("flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left", idx === cursor ? "bg-accent" : "hover:bg-muted")}
                    >
                      {h.avatar ? <PartnerAvatar name={h.avatar} size="sm" /> : <span className="grid size-8 place-items-center rounded-[9px] bg-muted text-muted-foreground"><Icon className="size-4" /></span>}
                      <span className="min-w-0">
                        <b className="block truncate text-[15px] text-foreground">{h.title}</b>
                        <span className="block truncate text-[13.5px] text-muted-foreground">{h.sub}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <div ref={box} className={cn("relative", !inline && "w-full max-w-[480px]")}>
      <label className="relative block">
        <span className="sr-only">Search</span>
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground" />
        <input
          ref={input}
          autoFocus={autoFocus}
          value={text}
          onChange={(e) => { setText(e.target.value); setCursor(0); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, flat.length - 1)) }
            if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)) }
            if (e.key === "Enter" && flat[cursor]) pick(flat[cursor])
            if (e.key === "Escape") { setOpen(false); input.current?.blur(); onDone?.() }
          }}
          placeholder="Search partners, deals, opportunities…"
          className="h-11 w-full rounded-[12px] border bg-card pr-14 pl-11 text-[15.5px] text-foreground shadow-[0_1px_2px_#172b450a] outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-primary/20"
        />
        {!inline && (
          <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-md border bg-muted px-1.5 py-0.5 text-[12.5px] font-medium text-muted-foreground">⌘K</kbd>
        )}
      </label>
      {open && results}
    </div>
  )
}
