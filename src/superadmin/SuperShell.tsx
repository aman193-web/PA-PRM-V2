import { useMemo, useRef, useState, type ReactNode } from "react"
import {
  Activity, BarChart3, Bell, Boxes, Building2, Cpu, CreditCard, Database, Flag, Gauge, KeyRound, LayoutDashboard, LogOut, Megaphone,
  Menu, Moon, Plug, Route, ScrollText, Search, ShieldCheck, Sun, UserCog, Users, type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { go } from "@/lib/router"
import { useTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { admin, otherUsers } from "@/superadmin/data"

interface NavItem { key: string; label: string; href: string; icon: LucideIcon; count?: number }

function useNav(): { group: string; items: NavItem[] }[] {
  const { state } = useStore()
  const p = state.platform
  const openEvents = p.events.filter((e) => e.status === "open").length
  const overdue = p.invoices.filter((i) => i.status === "overdue").length
  const supportWaiting = p.support.filter((x) => x.status === "requested").length
  const openRequests = p.dataRequests.filter((d) => d.status !== "done").length
  const reviewProviders = p.providers.filter((x) => x.status === "review").length
  return [
    { group: "", items: [{ key: "home", label: "Overview", href: "/s/home", icon: LayoutDashboard }] },
    { group: "Customers", items: [
      { key: "orgs", label: "Organizations", href: "/s/orgs", icon: Building2 },
      { key: "users", label: "Users", href: "/s/users", icon: Users },
      { key: "roles", label: "Roles and permissions", href: "/s/roles", icon: KeyRound },
      { key: "billing", label: "Plans and billing", href: "/s/billing", icon: CreditCard, count: overdue },
    ] },
    { group: "Product", items: [
      { key: "flags", label: "Features and releases", href: "/s/flags", icon: Flag },
      { key: "ai", label: "AI platform", href: "/s/ai", icon: Cpu, count: reviewProviders },
      { key: "integrations", label: "Integrations and API", href: "/s/integrations", icon: Plug },
    ] },
    { group: "Trust", items: [
      { key: "security", label: "Security and access", href: "/s/security", icon: ShieldCheck, count: openEvents + supportWaiting },
      { key: "audit", label: "Audit log", href: "/s/audit", icon: ScrollText },
      { key: "data", label: "Data and compliance", href: "/s/data", icon: Database, count: openRequests },
    ] },
    { group: "Operations", items: [
      { key: "health", label: "System health", href: "/s/health", icon: Activity, count: p.incidents.filter((i) => i.status !== "resolved").length },
      { key: "announce", label: "Announcements", href: "/s/announce", icon: Megaphone },
      { key: "analytics", label: "Usage analytics", href: "/s/analytics", icon: BarChart3 },
    ] },
    { group: "Settings", items: [{ key: "team", label: "Platform team", href: "/s/team", icon: UserCog }] },
  ]
}

function NavList({ section, onPick }: { section: string; onPick?: () => void }) {
  const groups = useNav()
  return (
    <nav aria-label="Super admin" className="grid gap-4">
      {groups.map((g) => (
        <div key={g.group || "top"} className="grid gap-0.5">
          {g.group && <p className="px-3 pb-1 text-[11.5px] font-semibold tracking-wider text-[#8fa6c8] uppercase">{g.group}</p>}
          {g.items.map((n) => {
            const active = section === n.key
            return (
              <a key={n.key} href={`#${n.href}`} onClick={onPick} aria-current={active ? "page" : undefined}
                className={cn("flex h-10 items-center gap-3 rounded-[10px] px-3 text-[15px] font-medium transition-colors", active ? "bg-white/12 text-white" : "text-[#c9d7ec] hover:bg-white/6 hover:text-white")}>
                <n.icon className={cn("size-[18px]", active ? "text-amber" : "")} />
                <span className="flex-1 truncate">{n.label}</span>
                {n.count ? <span className="grid min-w-6 place-items-center rounded-full bg-amber px-1.5 text-[12.5px] leading-6 font-bold text-[#2a1a00]">{n.count}</span> : null}
              </a>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

/** Like every portal: this role's flows and what it may do, at the foot of the menu. */
function FooterLinks({ section, onPick }: { section: string; onPick?: () => void }) {
  const cls = (on: boolean) => cn("flex items-center gap-2 rounded-[10px] px-3 py-2 text-[14.5px] transition-colors", on ? "bg-white/12 text-white" : "text-[#a9bfdc] hover:bg-white/6 hover:text-white")
  return (
    <div className="grid gap-0.5">
      <a href="#/s/journeys" onClick={onPick} aria-current={section === "journeys" ? "page" : undefined} className={cls(section === "journeys")}><Route className="size-4" /> The five journeys</a>
      <a href="#/s/access" onClick={onPick} aria-current={section === "access" ? "page" : undefined} className={cls(section === "access")}><KeyRound className="size-4" /> Your access</a>
    </div>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-[10px] bg-amber text-night"><Boxes className="size-5" /></span>
      <span className="leading-tight"><b className="block text-[15.5px] text-white">PRM platform</b><span className="text-[12.5px] text-[#9fb6d6]">Super admin</span></span>
    </div>
  )
}

function useAlerts() {
  const { state } = useStore()
  const p = state.platform
  return useMemo(() => {
    const name = (id: string) => p.orgs.find((o) => o.id === id)?.name ?? id
    return [
      ...p.events.filter((e) => e.status === "open").map((e) => ({ id: e.id, title: `${e.severity === "high" ? "High" : e.severity === "medium" ? "Medium" : "Low"} security event · ${name(e.orgId)}`, body: e.text, href: "/s/security", tone: e.severity === "high" ? "bad" : "warn" })),
      ...p.support.filter((x) => x.status !== "ended").map((x) => ({ id: x.id, title: `Support access ${x.status} · ${name(x.orgId)}`, body: `${x.engineer} · ${x.ticket}`, href: "/s/security", tone: x.status === "requested" ? "warn" : "info" })),
      ...p.invoices.filter((i) => i.status === "overdue").map((i) => ({ id: i.id, title: `${i.id} overdue · ${name(i.orgId)}`, body: `$${i.amount.toLocaleString("en-US")} for ${i.period}`, href: "/s/billing", tone: "bad" })),
      ...p.incidents.filter((i) => i.status !== "resolved").map((i) => ({ id: i.id, title: `Incident ${i.id}: ${i.status}`, body: i.title, href: "/s/health", tone: "warn" })),
    ]
  }, [p])
}

function Alerts() {
  const alerts = useAlerts()
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Alerts, ${alerts.length}`}>
          <Bell className="size-5" />
          {alerts.length > 0 && <span className="absolute top-1 right-1 grid min-w-[18px] place-items-center rounded-full bg-amber px-1 text-[11.5px] leading-[18px] font-bold text-[#2a1a00]">{alerts.length}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(400px,calc(100vw-24px))] p-0">
        <div className="border-b px-5 py-4"><b className="text-[16px] text-foreground">Platform alerts</b></div>
        <ul className="max-h-[420px] overflow-y-auto">
          {alerts.length === 0 && <li className="px-5 py-6 text-muted-foreground">Nothing needs you.</li>}
          {alerts.map((n) => (
            <li key={n.id}>
              <button onClick={() => go(n.href)} className="flex w-full gap-3 border-b px-5 py-3.5 text-left last:border-0 hover:bg-muted/60">
                <span className={cn("mt-2 size-2 shrink-0 rounded-full", n.tone === "bad" ? "bg-bad" : n.tone === "warn" ? "bg-amber" : "bg-primary")} />
                <span className="min-w-0"><span className="block font-semibold text-foreground">{n.title}</span><span className="block text-[14px] text-muted-foreground">{n.body}</span></span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

/** Search across every tenant: organizations and people. */
function SuperSearch({ onDone }: { onDone?: () => void }) {
  const { state } = useStore()
  const [q, setQ] = useState("")
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const t = q.trim().toLowerCase()
  const people = [...state.staff.map((u) => ({ name: u.name, sub: `${u.role} · Brightline` })), ...state.team.map((m) => ({ name: m.name, sub: `${m.role} · Ridgeway IT (Brightline partner)` })), ...otherUsers.map((u) => ({ name: u.name, sub: `${u.role} · ${state.platform.orgs.find((o) => o.id === u.orgId)?.name}` }))]
  const hits = !t ? [] : [
    ...state.platform.orgs.filter((o) => `${o.name} ${o.domain}`.toLowerCase().includes(t)).map((o) => ({ key: o.id, title: o.name, sub: `Organization · ${o.domain}`, href: `/s/org/${o.id}` })),
    ...people.filter((p) => p.name.toLowerCase().includes(t)).slice(0, 5).map((p) => ({ key: p.name, title: p.name, sub: p.sub, href: "/s/users" })),
  ]
  const pick = (h: string) => { go(h); setQ(""); setOpen(false); onDone?.() }
  return (
    <div ref={box} className="relative w-full max-w-[520px]" onBlur={(e) => !box.current?.contains(e.relatedTarget as Node) && setOpen(false)}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
      <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} onKeyDown={(e) => { if (e.key === "Enter" && hits[0]) pick(hits[0].href) }}
        placeholder="Search organizations and people" aria-label="Search organizations and people"
        className="h-11 w-full rounded-[12px] border bg-card pr-3 pl-11 text-[15.5px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary" />
      {open && t && (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-[12px] border bg-popover shadow-lg">
          {hits.length === 0 ? <p className="px-4 py-3 text-[15px] text-muted-foreground">Nothing matches "{q}".</p> : (
            <ul>{hits.map((h) => <li key={h.key}><button onMouseDown={(e) => e.preventDefault()} onClick={() => pick(h.href)} className="block w-full border-b px-4 py-2.5 text-left last:border-0 hover:bg-muted/60"><b className="block text-[15px] text-foreground">{h.title}</b><span className="text-[13.5px] text-muted-foreground">{h.sub}</span></button></li>)}</ul>
          )}
        </div>
      )}
    </div>
  )
}

export function SuperShell({ section, children, onSignOut }: { section: string; children: ReactNode; onSignOut: () => void }) {
  const { state } = useStore()
  const { resolvedTheme, setTheme } = useTheme()
  const [menu, setMenu] = useState(false)
  const [searching, setSearching] = useState(false)
  const p = state.platform
  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="sticky top-0 hidden h-svh flex-col overflow-y-auto bg-night px-3 pt-5 pb-4 lg:flex">
        <div className="px-3 pb-5"><Brand /></div>
        <NavList section={section} />
        <div className="mt-auto space-y-2 px-1 pt-5">
          <FooterLinks section={section} />
          <div className="rounded-[12px] bg-white/6 px-3 py-2.5 text-[13px] text-[#c9d7ec]">
            <p className="flex items-center gap-2 font-semibold text-white"><Gauge className="size-4 text-amber" /> {p.orgs.length} tenants · production</p>
            <p className="mt-0.5">{p.aiPaused ? "AI agents paused everywhere" : p.maintenance ? "Maintenance mode on" : "All systems running"}</p>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-[68px] items-center gap-2 border-b bg-background/85 px-3 backdrop-blur sm:gap-3 sm:px-6 lg:px-10">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenu(true)} aria-label="Menu"><Menu className="size-5" /></Button>
          <div className="hidden min-w-0 flex-1 md:block"><SuperSearch /></div>
          <div className="flex-1 md:hidden" />
          <span className="hidden items-center gap-1.5 rounded-full bg-bad-soft px-3 py-1 text-[13px] font-semibold text-bad sm:inline-flex"><span className="size-2 rounded-full bg-bad" /> Production</span>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSearching(true)} aria-label="Search"><Search className="size-5" /></Button>
          <Alerts />
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label="Toggle theme">{resolvedTheme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><button className="grid size-10 shrink-0 place-items-center rounded-full bg-night text-[14px] font-semibold text-amber" aria-label="Account">{admin.initials}</button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="text-[15px] text-foreground">{admin.name}<span className="block text-[13px] font-normal text-muted-foreground">{admin.title} · {admin.team}</span></DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => go("/s/journeys")}><Route /> The five journeys</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => go("/s/access")}><ShieldCheck /> Your access</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => go("/s/team")}><UserCog /> Platform team</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{resolvedTheme === "dark" ? <Sun /> : <Moon />} {resolvedTheme === "dark" ? "Light" : "Dark"} theme</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onSignOut}><LogOut /> Sign out · switch role</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <Sheet open={menu} onOpenChange={setMenu}>
          <SheetContent side="left" className="w-[290px] overflow-y-auto border-0 bg-night p-3 pt-5">
            <SheetTitle className="sr-only">Super admin menu</SheetTitle>
            <div className="px-3 pb-5"><Brand /></div>
            <NavList section={section} onPick={() => setMenu(false)} />
            <div className="mt-5 border-t border-white/10 pt-4"><FooterLinks section={section} onPick={() => setMenu(false)} /></div>
          </SheetContent>
        </Sheet>
        <Sheet open={searching} onOpenChange={setSearching}>
          <SheetContent side="top" className="px-4 pt-5 pb-6"><SheetTitle className="mb-3">Search</SheetTitle><SuperSearch onDone={() => setSearching(false)} /></SheetContent>
        </Sheet>
        <main className="mx-auto w-full max-w-[1280px] px-4 pt-6 pb-16 sm:px-6 lg:px-10 lg:pt-8">{children}</main>
      </div>
    </div>
  )
}
