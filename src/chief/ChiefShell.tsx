import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { ArrowUp, Bell, Gauge, Home, Inbox, KeyRound, LogOut, Moon, PieChart, Route, Search, Sparkles, Sun, Users } from "lucide-react"
import { HubLink, HubMenuLink, Logo } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { money } from "@/lib/format"
import { go } from "@/lib/router"
import { useTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { budget, chief } from "@/chief/data"
import { kindLabel, useApprovals, useRevenue } from "@/chief/useChief"

const nav = [
  { key: "home", label: "Home", href: "/c/home", icon: Home },
  { key: "approvals", label: "Approvals", href: "/c/approvals", icon: Inbox },
  { key: "partners", label: "Revenue by partner", short: "Revenue", href: "/c/partners", icon: PieChart },
  { key: "team", label: "Partner managers", short: "Team", href: "/c/team", icon: Users },
  { key: "program", label: "Programs and rules", short: "Programs", href: "/c/program", icon: Gauge },
] as const

/* ---------- assistant: answers from what the channel chief can see ---------- */

interface Msg { from: "me" | "ai"; text: string; links?: { label: string; href: string }[] }
const Ctx = createContext<{ ask: (q?: string) => void }>({ ask: () => {} })
export const useChiefAssistant = () => useContext(Ctx)

function ChiefAssistant({ children }: { children: ReactNode }) {
  const approvals = useApprovals()
  const rev = useRevenue()
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [draft, setDraft] = useState("")
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }) }, [msgs])

  const answer = (q: string): Msg => {
    const t = q.toLowerCase()
    if (t.includes("approv") || t.includes("need") || t.includes("today"))
      return { from: "ai", text: approvals.length ? `${approvals.length} decisions are waiting for you:\n${approvals.map((a) => `• ${kindLabel[a.kind]}: ${a.title}`).join("\n")}` : "Nothing is waiting for you.", links: [{ label: "Open Approvals", href: "/c/approvals" }] }
    if (t.includes("budget") || t.includes("roi") || t.includes("worth") || t.includes("board"))
      return { from: "ai", text: `Partners brought in ${money(rev.won)} of verified revenue this year against ${money(budget.spent)} of program cost: ${(rev.won / budget.spent).toFixed(1)}x return. That's ${Math.round((rev.won / budget.revenueTarget) * 100)}% of the ${money(budget.revenueTarget)} target.`, links: [{ label: "Open Program", href: "/c/program" }, { label: "Revenue by partner", href: "/c/partners" }] }
    if (t.includes("partner") || t.includes("revenue") || t.includes("top"))
      return { from: "ai", text: `Top partners by verified revenue: ${rev.top.map((p) => `${p.name} (${money(p.won)})`).join(", ")}. ${rev.all.filter((p) => p.trend === "at_risk").map((p) => p.name).join(", ") || "None"} at risk.`, links: [{ label: "Revenue by partner", href: "/c/partners" }] }
    if (t.includes("manager") || t.includes("team") || t.includes("sla"))
      return { from: "ai", text: rev.managers.map((m) => `• ${m.name} (${m.region}): ${m.queue} waiting, ${m.atRisk} near deadline, ${m.slaMet}% on time`).join("\n"), links: [{ label: "Partner managers", href: "/c/team" }] }
    return { from: "ai", text: "I can help with your approvals, revenue by partner, the budget and your partner managers." }
  }
  const send = (q: string) => { if (!q.trim()) return; setMsgs((m) => [...m, { from: "me", text: q }, answer(q)]); setDraft("") }
  const ask = (q?: string) => { setOpen(true); if (q) setTimeout(() => send(q), 50) }

  return (
    <Ctx.Provider value={{ ask }}>
      {children}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 data-[side=right]:sm:max-w-[440px]">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle className="flex items-center gap-2 text-[18px]"><Sparkles className="size-5 text-primary" /> PartnerAssistant</SheetTitle>
            <SheetDescription className="text-[14px]">Answers from the whole program, as Dana sees it.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {msgs.length === 0 && (
              <div className="space-y-2">
                <p className="text-[15px] text-muted-foreground">Try one of these:</p>
                {["What needs my approval?", "Is the program worth the budget?", "Who are our top partners?", "How are my partner managers doing?"].map((s) => (
                  <button key={s} onClick={() => send(s)} className="block w-full rounded-[12px] border bg-card px-4 py-3 text-left text-[15px] text-foreground hover:border-primary/60">{s}</button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={m.from === "me" ? "ml-10 rounded-[14px] rounded-br-[4px] bg-primary px-4 py-2.5 text-[15px] text-primary-foreground" : "mr-6 rounded-[14px] rounded-bl-[4px] bg-muted px-4 py-3 text-[15px] whitespace-pre-line text-foreground"}>
                {m.text}
                {m.links && <div className="mt-2.5 flex flex-wrap gap-2">{m.links.map((l) => <Button key={l.href} size="sm" variant="outline" className="bg-card" onClick={() => { setOpen(false); go(l.href) }}>{l.label}</Button>)}</div>}
              </div>
            ))}
            <div ref={end} />
          </div>
          <form className="flex gap-2 border-t p-4" onSubmit={(e) => { e.preventDefault(); send(draft) }}>
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about approvals, partners or budget…" className="h-12 flex-1 text-[15.5px]" />
            <Button type="submit" size="icon" className="size-12" aria-label="Send"><ArrowUp /></Button>
          </form>
        </SheetContent>
      </Sheet>
    </Ctx.Provider>
  )
}

/* ---------- header pieces ---------- */

function Notifications() {
  const approvals = useApprovals()
  const [read, setRead] = useState<Set<string>>(new Set())
  const unread = approvals.filter((a) => !read.has(a.id)).length
  return (
    <Popover onOpenChange={(o) => !o && setRead(new Set(approvals.map((a) => a.id)))}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications, ${unread} unread`}>
          <Bell className="size-5" />
          {unread > 0 && <span className="absolute top-1 right-1 grid min-w-[18px] place-items-center rounded-full bg-amber px-1 text-[11.5px] leading-[18px] font-bold text-[#2a1a00]">{unread}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(400px,calc(100vw-24px))] p-0">
        <div className="flex items-baseline justify-between border-b px-5 py-4">
          <b className="text-[16px] text-foreground">Notifications</b>
          <span className="text-[13px] text-muted-foreground">Also sent to Slack and email</span>
        </div>
        <ul className="max-h-[420px] overflow-y-auto">
          {approvals.length === 0 && <li className="px-5 py-6 text-muted-foreground">Nothing waiting for you.</li>}
          {approvals.map((n) => (
            <li key={n.id}>
              <button onClick={() => go(`/c/approval/${n.id}`)} className="flex w-full gap-3 border-b px-5 py-3.5 text-left last:border-0 hover:bg-muted/60">
                <span className={cn("mt-2 size-2 shrink-0 rounded-full", read.has(n.id) ? "bg-border-strong" : n.tone === "bad" ? "bg-bad" : n.tone === "amber" ? "bg-amber" : "bg-primary")} />
                <span className="min-w-0">
                  <span className="block font-semibold text-foreground">{kindLabel[n.kind]}: {n.title}</span>
                  <span className="block text-[14px] text-muted-foreground">{n.sub}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

function ChiefSearch({ autoFocus, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const approvals = useApprovals()
  const rev = useRevenue()
  const [q, setQ] = useState("")
  const t = q.trim().toLowerCase()
  const hits = t
    ? [
        ...approvals.filter((a) => a.title.toLowerCase().includes(t)).map((a) => ({ key: a.id, title: a.title, sub: kindLabel[a.kind], href: `/c/approval/${a.id}` })),
        ...rev.all.filter((p) => p.name.toLowerCase().includes(t)).slice(0, 5).map((p) => ({ key: p.id, title: p.name, sub: `${p.tier} · ${p.manager} · ${money(p.won)} won`, href: `/c/partners/${p.id}` })),
      ]
    : []
  const pick = (href: string) => { go(href); setQ(""); onDone?.() }
  return (
    <div className="relative w-full max-w-[520px]">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
      <input value={q} autoFocus={autoFocus} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && hits[0] && pick(hits[0].href)} placeholder="Search partners and approvals" aria-label="Search" className="h-11 w-full rounded-[12px] border bg-card pr-3 pl-11 text-[15.5px] text-foreground shadow-[0_1px_2px_#172b450a] outline-none placeholder:text-muted-foreground focus:border-primary" />
      {t && (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-[12px] border bg-popover shadow-lg">
          {hits.length === 0 ? <p className="px-4 py-3 text-[15px] text-muted-foreground">Nothing matches "{q}".</p> : (
            <ul>{hits.map((h) => (
              <li key={h.key}><button onClick={() => pick(h.href)} className="block w-full border-b px-4 py-2.5 text-left last:border-0 hover:bg-muted/60"><b className="block text-[15px] text-foreground">{h.title}</b><span className="text-[13.5px] text-muted-foreground">{h.sub}</span></button></li>
            ))}</ul>
          )}
        </div>
      )}
    </div>
  )
}

function ShellInner({ section, children, onSignOut }: { section: string; children: ReactNode; onSignOut: () => void }) {
  const approvals = useApprovals()
  const { ask } = useChiefAssistant()
  const { resolvedTheme, setTheme } = useTheme()
  const [searching, setSearching] = useState(false)
  const counts: Record<string, number> = { approvals: approvals.length }

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="sticky top-0 hidden h-svh flex-col border-r bg-sidebar lg:flex">
        <div className="px-6 pt-6 pb-5"><Logo /></div>
        <div className="mx-4 mb-4 flex items-center gap-3 rounded-[12px] border px-3 py-2.5">
          <span className="grid size-9 place-items-center rounded-[9px] bg-night text-[14px] font-bold text-white">B</span>
          <span className="min-w-0 leading-tight">
            <b className="block text-[15px] text-foreground">{chief.vendor}</b>
            <span className="text-[13px] text-muted-foreground">Channel chief</span>
          </span>
        </div>
        <nav className="grid gap-1 px-3" aria-label="Main">
          {nav.map((n) => {
            const active = section === n.key
            return (
              <a key={n.key} href={`#${n.href}`} aria-current={active ? "page" : undefined} className={cn("flex h-11 items-center gap-3 rounded-[10px] px-3 text-[15.5px] font-medium transition-colors", active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-muted")}>
                <n.icon className="size-5" />
                <span className="flex-1">{n.label}</span>
                {counts[n.key] ? <span className="grid min-w-6 place-items-center rounded-full bg-amber px-1.5 text-[13px] leading-6 font-bold text-[#2a1a00]">{counts[n.key]}</span> : null}
              </a>
            )
          })}
        </nav>
        <div className="mt-auto space-y-3 p-4">
          <button onClick={() => ask()} className="flex w-full items-center gap-3 rounded-[12px] bg-night px-4 py-3 text-left text-white transition hover:bg-night-2">
            <Sparkles className="size-5 text-amber" />
            <span className="leading-tight"><b className="block text-[15px]">Ask PartnerAssistant</b><span className="text-[13px] text-[#b9cbe4]">About your program and budget</span></span>
          </button>
          <a href="#/c/journeys" className={cn("flex items-center gap-2 rounded-[10px] px-3 py-2 text-[14.5px] text-muted-foreground hover:bg-muted hover:text-foreground", section === "journeys" && "bg-muted text-foreground")}>
            <Route className="size-4" /> The three journeys
          </a>
          <a href="#/c/access" className={cn("flex items-center gap-2 rounded-[10px] px-3 py-2 text-[14.5px] text-muted-foreground hover:bg-muted hover:text-foreground", section === "access" && "bg-muted text-foreground")}>
            <KeyRound className="size-4" /> Your access
          </a>
          <HubLink />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-[68px] items-center gap-1 border-b bg-background/85 px-3 backdrop-blur sm:gap-3 sm:px-6 lg:px-10">
          <a href="#/c/home" className="mr-1 shrink-0 lg:hidden"><Logo /></a>
          <div className="hidden min-w-0 flex-1 md:block"><ChiefSearch /></div>
          <div className="flex-1 md:hidden" />
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSearching(true)} aria-label="Search"><Search className="size-5" /></Button>
          <Button variant="outline" className="hidden h-10 gap-2 sm:inline-flex lg:hidden" onClick={() => ask()}><Sparkles className="size-4 text-primary" /> Ask</Button>
          <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => ask()} aria-label="Ask PartnerAssistant"><Sparkles className="size-5 text-primary" /></Button>
          <Notifications />
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label={resolvedTheme === "dark" ? "Use light theme" : "Use dark theme"}>
            {resolvedTheme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="grid size-10 shrink-0 place-items-center rounded-full bg-night text-[14px] font-semibold text-white" aria-label="Account">{chief.initials}</button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="text-[15px] text-foreground">{chief.name}<span className="block text-[13px] font-normal text-muted-foreground">{chief.title} · {chief.vendor}</span></DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => go("/c/journeys")}><Route /> The three journeys</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => go("/c/access")}><KeyRound /> Your access</DropdownMenuItem>
              <DropdownMenuItem asChild><HubMenuLink /></DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{resolvedTheme === "dark" ? <Sun /> : <Moon />} {resolvedTheme === "dark" ? "Light" : "Dark"} theme</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onSignOut}><LogOut /> Sign out · switch role</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <Sheet open={searching} onOpenChange={setSearching}>
          <SheetContent side="top" className="px-4 pt-5 pb-6">
            <SheetTitle className="mb-3">Search</SheetTitle>
            <ChiefSearch autoFocus onDone={() => setSearching(false)} />
          </SheetContent>
        </Sheet>
        <main className="mx-auto w-full max-w-[1240px] px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-8 lg:pb-16">{children}</main>
      </div>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        {nav.map((n) => {
          const active = section === n.key
          return (
            <a key={n.key} href={`#${n.href}`} aria-current={active ? "page" : undefined} className={cn("relative flex flex-col items-center gap-1 py-2.5 text-[13px] font-medium", active ? "text-primary" : "text-muted-foreground")}>
              <n.icon className="size-[22px]" />
              {"short" in n ? n.short : n.label}
              {counts[n.key] ? <span className="absolute top-1.5 left-[calc(50%+6px)] grid min-w-[18px] place-items-center rounded-full bg-amber px-1 text-[11.5px] leading-[18px] font-bold text-[#2a1a00]">{counts[n.key]}</span> : null}
            </a>
          )
        })}
      </nav>
    </div>
  )
}

export function ChiefShell(props: { section: string; children: ReactNode; onSignOut: () => void }) {
  return <ChiefAssistant><ShellInner {...props} /></ChiefAssistant>
}
