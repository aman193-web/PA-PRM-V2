import { useMemo, useRef, useState, type ReactNode } from "react"
import {
  Award, Bell, BookOpen, Briefcase, ClipboardCheck, Coins, GraduationCap, Home, Inbox, KeyRound, LogOut, Mail, Megaphone, Moon, Phone, Plus, Route, Search, ShieldCheck, Sparkles, Sun, TrendingUp, Users,
} from "lucide-react"
import { Logo } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { money } from "@/lib/format"
import { go } from "@/lib/router"
import { useTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { partnerManager } from "@/partner/data"
import { daysUntil, leadLeft, partnerStatus, usePartner, usePartnerData } from "@/partner/usePartner"
import { usePartnerAssistant } from "@/partner/Assistant"
import { useMarketing, useTeamCampaignLeads } from "@/partner/useMarketing"
import { useDelivery } from "@/partner/useDelivery"
import { useMktTodos } from "@/partner/screens/mkt/MktHome"
import { useTechTodos } from "@/partner/screens/tech/TechHome"

interface NavItem { key: string; label: string; short?: string; href: string; icon: typeof Home; count?: number; mobile?: boolean }

function useNav(): NavItem[] {
  const { isExec, isMkt, isTech } = usePartner()
  const d = usePartnerData()
  const m = useMarketing()
  const t = useDelivery()
  const fromMarketing = useTeamCampaignLeads().filter((l) => l.status === "with_rep").length
  const dealCount = d.needsReply.length + d.expiring.length
  if (isMkt)
    return [
      { key: "home", label: "Home", href: "/p/home", icon: Home, mobile: true },
      { key: "campaigns", label: "Campaigns", href: "/p/campaigns", icon: Megaphone, mobile: true },
      { key: "leads", label: "Campaign leads", short: "Leads", href: "/p/leads", icon: Inbox, count: m.toHandOff.length, mobile: true },
      { key: "funds", label: "Funds (MDF)", short: "Funds", href: "/p/funds", icon: Coins, count: m.claimable.length, mobile: true },
      { key: "resources", label: "Resources", href: "/p/resources", icon: BookOpen },
    ]
  if (isTech)
    return [
      { key: "home", label: "Home", href: "/p/home", icon: Home, mobile: true },
      { key: "work", label: "Deals you work on", short: "Deals", href: "/p/work", icon: Briefcase, count: t.overdue.length + t.thisWeek.length, mobile: true },
      { key: "skills", label: "Skills", href: "/p/skills", icon: GraduationCap, count: t.examReady.length, mobile: true },
      { key: "influence", label: "Influence", href: "/p/influence", icon: TrendingUp, mobile: true },
      { key: "resources", label: "Resources", href: "/p/resources", icon: BookOpen },
    ]
  if (isExec)
    return [
      { key: "home", label: "Home", href: "/p/home", icon: Home, mobile: true },
      { key: "deals", label: "Deals", href: "/p/deals", icon: Briefcase, count: dealCount, mobile: true },
      { key: "leads", label: "Leads", href: "/p/leads", icon: Inbox, count: d.offers.length, mobile: true },
      { key: "credit", label: "Revenue", href: "/p/credit", icon: TrendingUp, mobile: true },
      { key: "program", label: "Program", href: "/p/program", icon: Award, mobile: true },
      { key: "team", label: "Team", href: "/p/team", icon: Users },
      { key: "resources", label: "Resources", href: "/p/resources", icon: BookOpen },
    ]
  return [
    { key: "home", label: "Home", href: "/p/home", icon: Home, mobile: true },
    { key: "deals", label: "My deals", short: "Deals", href: "/p/deals", icon: Briefcase, count: dealCount, mobile: true },
    { key: "leads", label: "Leads", href: "/p/leads", icon: Inbox, count: d.offers.length + fromMarketing, mobile: true },
    { key: "credit", label: "My credit", short: "Credit", href: "/p/credit", icon: TrendingUp, mobile: true },
    { key: "resources", label: "Resources", href: "/p/resources", icon: BookOpen },
  ]
}

interface Alert { id: string; title: string; body: string; href: string; tone: "bad" | "warn" | "info" | "ok" }

/** What the signed-in partner person should know about, built from live data so it never goes stale. */
function useAlerts(): Alert[] {
  const { state } = useStore()
  const { me, isExec, isMkt, isTech } = usePartner()
  const d = usePartnerData()
  const mktTodos = useMktTodos()
  const techTodos = useTechTodos()
  return useMemo(() => {
    const out: Alert[] = []
    if (isMkt || isTech) {
      for (const t of isMkt ? mktTodos : techTodos) out.push({ id: t.key, title: t.title, body: t.body, href: t.href, tone: t.tone === "primary" ? "info" : t.tone === "amber" ? "warn" : "bad" })
      if (isMkt)
        for (const r of state.mdf.filter((x) => x.requestedBy === me.name && x.decidedAt && x.decidedAt >= "2026-10-26"))
          out.push({ id: `m-${r.id}-${r.status}`, title: `Funds for ${r.campaign}: ${r.status === "rejected" || r.status === "claim_rejected" ? "declined" : r.status === "paid" ? "paid" : "approved"}`, body: r.reason ?? `Decided by ${r.decidedBy}`, href: "/p/funds", tone: r.status.includes("rejected") ? "info" : "ok" })
      return out
    }
    for (const r of d.needsReply) out.push({ id: `q-${r.id}`, title: `Jordan asked about ${r.customer}`, body: r.infoRequest?.asked ?? "Answer to resume the review", href: `/p/deal/${r.id}`, tone: "bad" })
    for (const l of d.offers) out.push({ id: `l-${l.id}`, title: `New lead: ${l.company}`, body: `From Brightline · accept within ${Math.max(1, Math.round(leadLeft(l)))} h`, href: "/p/leads", tone: "warn" })
    for (const r of d.expiring) out.push({ id: `e-${r.id}`, title: `${r.customer} protection ends in ${daysUntil(r.protectedUntil!)} days`, body: "Ask Jordan for more time in one tap", href: `/p/deal/${r.id}`, tone: "warn" })
    if (isExec) for (const g of state.agreements.filter((x) => x.status === "expiring")) out.push({ id: `g-${g.id}`, title: `${g.name} needs renewing`, body: g.detail, href: "/p/program", tone: "warn" })
    for (const r of d.deals.filter((x) => x.decision && x.decision.at >= "2026-10-26" && ["approved", "rejected"].includes(x.state)))
      out.push({ id: `d-${r.id}-${r.state}`, title: `${r.customer}: ${partnerStatus(r).label.toLowerCase()}`, body: r.state === "approved" ? `${money(r.value)} · protected for 90 days` : r.decision?.reason ?? "", href: `/p/deal/${r.id}`, tone: r.state === "approved" ? "ok" : "info" })
    return out
  }, [d, state.agreements, state.mdf, isExec, isMkt, isTech, me, mktTodos, techTodos])
}

function Notifications() {
  const alerts = useAlerts()
  const [read, setRead] = useState<Set<string>>(new Set())
  const unread = alerts.filter((a) => !read.has(a.id)).length
  return (
    <Popover onOpenChange={(o) => !o && setRead(new Set(alerts.map((a) => a.id)))}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications, ${unread} unread`}>
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 grid min-w-[18px] place-items-center rounded-full bg-amber px-1 text-[11.5px] leading-[18px] font-bold text-[#2a1a00]">{unread}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(400px,calc(100vw-24px))] p-0">
        <div className="flex items-baseline justify-between border-b px-5 py-4">
          <b className="text-[16px] text-foreground">Notifications</b>
          <span className="text-[13px] text-muted-foreground">Also sent by email</span>
        </div>
        <ul className="max-h-[420px] overflow-y-auto">
          {alerts.length === 0 && <li className="px-5 py-6 text-muted-foreground">You're all caught up.</li>}
          {alerts.map((n) => (
            <li key={n.id}>
              <button onClick={() => go(n.href)} className="flex w-full gap-3 border-b px-5 py-3.5 text-left last:border-0 hover:bg-muted/60">
                <span className={cn("mt-2 size-2 shrink-0 rounded-full", read.has(n.id) ? "bg-border-strong" : n.tone === "bad" ? "bg-bad" : n.tone === "warn" ? "bg-amber" : n.tone === "ok" ? "bg-ok" : "bg-primary")} />
                <span className="min-w-0">
                  <span className="block font-semibold text-foreground">{n.title}</span>
                  <span className="block text-[14px] text-muted-foreground">{n.body}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

/** Search across only what this person may see: their deals and leads. */
function PartnerSearch({ autoFocus, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const d = usePartnerData()
  const m = useMarketing()
  const dl = useDelivery()
  const { company, isExec, isMkt, isTech } = usePartner()
  const [q, setQ] = useState("")
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const t = q.trim().toLowerCase()
  const hits = !t ? [] : isMkt
    ? [
        ...m.campaigns.filter((c) => c.name.toLowerCase().includes(t)).slice(0, 5).map((c) => ({ key: c.id, title: c.name, sub: `Campaign · ${c.status}`, href: `/p/campaign/${c.id}` })),
        ...m.leads.filter((l) => l.company.toLowerCase().includes(t)).slice(0, 4).map((l) => ({ key: l.id, title: l.company, sub: `Campaign lead · ${l.assignee ?? "to hand off"}`, href: "/p/leads" })),
      ]
    : isTech
    ? dl.views.filter((v) => `${v.e.account} ${v.e.product}`.toLowerCase().includes(t)).map((v) => ({ key: v.e.id, title: v.e.account, sub: `${v.e.product} · ${v.stage}`, href: `/p/work/${v.e.id}` }))
    : [
        ...d.deals.filter((r) => `${r.customer} ${r.product} ${r.rep} ${r.id}`.toLowerCase().includes(t)).slice(0, 6).map((r) => ({ key: r.id, title: r.customer, sub: `${partnerStatus(r).label} · ${money(r.value)}${isExec ? ` · ${r.rep}` : ""}`, href: `/p/deal/${r.id}` })),
        ...d.leads.filter((l) => l.company.toLowerCase().includes(t)).slice(0, 3).map((l) => ({ key: l.id, title: l.company, sub: `Lead · ${l.status}`, href: "/p/leads" })),
      ]
  const pick = (href: string) => { go(href); setQ(""); setOpen(false); onDone?.() }
  return (
    <div ref={box} className="relative w-full max-w-[520px]" onBlur={(e) => !box.current?.contains(e.relatedTarget as Node) && setOpen(false)}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === "Enter" && hits[0]) pick(hits[0].href); if (e.key === "Escape") setOpen(false) }}
        placeholder={isExec ? `Search ${company.short}'s deals and leads` : isMkt ? "Search your campaigns and leads" : isTech ? "Search the deals you work on" : "Search your deals and leads"}
        aria-label="Search"
        className="h-11 w-full rounded-[12px] border bg-card pr-3 pl-11 text-[15.5px] text-foreground shadow-[0_1px_2px_#172b450a] outline-none placeholder:text-muted-foreground focus:border-primary"
      />
      {open && t && (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-[12px] border bg-popover shadow-lg">
          {hits.length === 0 ? (
            <p className="px-4 py-3 text-[15px] text-muted-foreground">Nothing matches "{q}".</p>
          ) : (
            <ul>
              {hits.map((h) => (
                <li key={h.key}>
                  <button onMouseDown={(e) => e.preventDefault()} onClick={() => pick(h.href)} className="block w-full border-b px-4 py-2.5 text-left last:border-0 hover:bg-muted/60">
                    <b className="block text-[15px] text-foreground">{h.title}</b>
                    <span className="text-[13.5px] text-muted-foreground">{h.sub}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

const avatarTint = { pexec: "bg-amber-soft text-amber-ink", rep: "bg-brand-soft text-primary", mkt: "bg-ok-soft text-ok", tech: "bg-secondary text-foreground" }

function UserMenu({ onSignOut }: { onSignOut: () => void }) {
  const { me, company, isExec } = usePartner()
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn("grid size-10 shrink-0 place-items-center rounded-full text-[14px] font-semibold", avatarTint[me.role])} aria-label="Account">
          {me.initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-[15px] text-foreground">
          {me.name}
          <span className="block text-[13px] font-normal text-muted-foreground">{me.roleLabel} · {company.name}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => go("/p/journeys")}><Route /> The three journeys</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => go("/p/access")}><ShieldCheck /> Your access</DropdownMenuItem>
        {isExec && <DropdownMenuItem onSelect={() => go("/p/team")} className="lg:hidden"><Users /> Team</DropdownMenuItem>}
        <DropdownMenuItem onSelect={() => go("/p/resources")} className="lg:hidden"><BookOpen /> Resources</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
          {resolvedTheme === "dark" ? <Sun /> : <Moon />} {resolvedTheme === "dark" ? "Light" : "Dark"} theme
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSignOut}><LogOut /> Sign out · switch role</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ManagerCard() {
  return (
    <div className="rounded-[12px] border p-3">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-night text-[13px] font-bold text-white">{partnerManager.initials}</span>
        <span className="min-w-0 leading-tight">
          <b className="block text-[14.5px] text-foreground">{partnerManager.name}</b>
          <span className="text-[13px] text-muted-foreground">Your partner manager</span>
        </span>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" asChild><a href={`tel:${partnerManager.phone.replace(/\s/g, "")}`}><Phone /> Call</a></Button>
        <Button size="sm" variant="outline" asChild><a href={`mailto:${partnerManager.email}`}><Mail /> Email</a></Button>
      </div>
    </div>
  )
}

/** Each role's main action: a button at the top of the sidebar and the centre of the phone bar. */
const mainAction = {
  pexec: { label: "Register a deal", short: "Register", href: "/p/register", icon: Plus, key: "register" },
  rep: { label: "Register a deal", short: "Register", href: "/p/register", icon: Plus, key: "register" },
  mkt: { label: "Launch a campaign", short: "Launch", href: "/p/launch", icon: Megaphone, key: "launch" },
  tech: { label: "Log a milestone", short: "Log", href: "/p/log", icon: ClipboardCheck, key: "log" },
}
const assistantSub = { pexec: "About your program and team", rep: "Register or check a deal", mkt: "About your campaigns and funds", tech: "About your deals and skills" }

export function PartnerShell({ section, children, onSignOut }: { section: string; children: ReactNode; onSignOut: () => void }) {
  const { me, company, isExec } = usePartner()
  const action = mainAction[me.role]
  const nav = useNav()
  const { ask } = usePartnerAssistant()
  const { resolvedTheme, setTheme } = useTheme()
  const [searching, setSearching] = useState(false)
  const mobile = nav.filter((n) => n.mobile)

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="sticky top-0 hidden h-svh flex-col border-r bg-sidebar lg:flex">
        <div className="px-6 pt-6 pb-5"><Logo /></div>
        <div className="mx-4 mb-4 flex items-center gap-3 rounded-[12px] border px-3 py-2.5">
          <span className="grid size-9 place-items-center rounded-[9px] bg-amber-soft text-[14px] font-bold text-amber-ink">{company.name[0]}</span>
          <span className="min-w-0 leading-tight">
            <b className="block text-[15px] text-foreground">{company.name}</b>
            <span className="block text-[13px] text-foreground">{me.roleLabel}</span>
            <span className="block text-[12.5px] text-muted-foreground">{company.tier} {company.program.toLowerCase()} partner</span>
          </span>
        </div>
        <div className="px-4 pb-3">
          <Button size="lg" variant={isExec ? "outline" : "default"} className="h-11 w-full justify-start gap-2.5 text-[15.5px]" onClick={() => go(action.href)}>
            <action.icon className="size-5" /> {action.label}
          </Button>
        </div>
        <nav className="grid gap-1 overflow-y-auto px-3" aria-label="Main">
          {nav.map((n) => {
            const active = section === n.key
            return (
              <a
                key={n.key}
                href={`#${n.href}`}
                aria-current={active ? "page" : undefined}
                className={cn("flex h-11 items-center gap-3 rounded-[10px] px-3 text-[15.5px] font-medium transition-colors", active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-muted")}
              >
                <n.icon className="size-5" />
                <span className="flex-1">{n.label}</span>
                {n.count ? <span className="grid min-w-6 place-items-center rounded-full bg-amber px-1.5 text-[13px] leading-6 font-bold text-[#2a1a00]">{n.count}</span> : null}
              </a>
            )
          })}
        </nav>
        <div className="mt-auto space-y-3 p-4">
          <button onClick={() => ask()} className="flex w-full items-center gap-3 rounded-[12px] bg-night px-4 py-3 text-left text-white transition hover:bg-night-2">
            <Sparkles className="size-5 text-amber" />
            <span className="leading-tight">
              <b className="block text-[15px]">Ask PartnerAssistant</b>
              <span className="text-[13px] text-[#b9cbe4]">{assistantSub[me.role]}</span>
            </span>
          </button>
          <ManagerCard />
          <a href="#/p/journeys" className={cn("flex items-center gap-2 rounded-[10px] px-3 py-2 text-[14.5px] text-muted-foreground hover:bg-muted hover:text-foreground", section === "journeys" && "bg-muted text-foreground")}>
            <Route className="size-4" /> The three journeys
          </a>
          <a href="#/p/access" className={cn("flex items-center gap-2 rounded-[10px] px-3 py-2 text-[14.5px] text-muted-foreground hover:bg-muted hover:text-foreground", section === "access" && "bg-muted text-foreground")}>
            <KeyRound className="size-4" /> Your access
          </a>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-[68px] items-center gap-1 border-b bg-background/85 px-3 backdrop-blur sm:gap-3 sm:px-6 lg:px-10">
          <a href="#/p/home" className="mr-1 shrink-0 lg:hidden"><Logo /></a>
          <div className="hidden min-w-0 flex-1 md:block"><PartnerSearch /></div>
          <div className="flex-1 md:hidden" />
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSearching(true)} aria-label="Search"><Search className="size-5" /></Button>
          <span className="hidden h-10 items-center gap-2 rounded-full border bg-card px-3 text-[14px] font-medium text-foreground xl:inline-flex">
            <span className="size-2 rounded-full bg-amber" /> {company.name} · {company.tier}
          </span>
          <Button variant="outline" className="hidden h-10 gap-2 sm:inline-flex lg:hidden" onClick={() => ask()}><Sparkles className="size-4 text-primary" /> Ask</Button>
          <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => ask()} aria-label="Ask PartnerAssistant"><Sparkles className="size-5 text-primary" /></Button>
          <Notifications />
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label={resolvedTheme === "dark" ? "Use light theme" : "Use dark theme"}>
            {resolvedTheme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
          <UserMenu onSignOut={onSignOut} />
        </header>
        <Sheet open={searching} onOpenChange={setSearching}>
          <SheetContent side="top" className="px-4 pt-5 pb-6">
            <SheetTitle className="mb-3">Search</SheetTitle>
            <PartnerSearch autoFocus onDone={() => setSearching(false)} />
          </SheetContent>
        </Sheet>
        <main className="mx-auto w-full max-w-[1240px] px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-8 lg:pb-16">{children}</main>
      </div>

      {/* Phone navigation. Each role's main action (register, launch, log) sits in the middle; the executive has none. */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        {(isExec ? mobile : [...mobile.slice(0, 2), { key: action.key, label: action.short, href: action.href, icon: action.icon } as NavItem, ...mobile.slice(2)]).map((n) => {
          const active = section === n.key
          if (n.key === action.key && !isExec)
            return (
              <a key={n.key} href={`#${n.href}`} aria-current={active ? "page" : undefined} className="flex flex-col items-center gap-1 pt-1.5 pb-2 text-[13px] font-semibold text-primary">
                <span className="-mt-5 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_16px_#0969da55]"><n.icon className="size-6" /></span>
                {n.label}
              </a>
            )
          return (
            <a key={n.key} href={`#${n.href}`} aria-current={active ? "page" : undefined} className={cn("relative flex flex-col items-center gap-1 py-2.5 text-[13px] font-medium", active ? "text-primary" : "text-muted-foreground")}>
              <n.icon className="size-[22px]" />
              {n.short ?? n.label}
              {n.count ? <span className="absolute top-1.5 left-[calc(50%+6px)] grid min-w-[18px] place-items-center rounded-full bg-amber px-1 text-[11.5px] leading-[18px] font-bold text-[#2a1a00]">{n.count}</span> : null}
            </a>
          )
        })}
      </nav>
    </div>
  )
}
