import { useState, type ComponentProps, type ReactNode } from "react"
import { Activity, Bell, Briefcase, Home, Inbox, LogOut, Moon, PieChart, Route, Search, Sparkles, Sun, Users } from "lucide-react"
import { useTheme } from "@/lib/theme"
import { HubLink, HubMenuLink, Logo, SalesforceMark } from "@/components/common"
import { GlobalSearch } from "@/components/Search"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { useSalesforce } from "@/screens/Salesforce"
import { useCopilot } from "@/components/Copilot"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { me } from "@/data/model"
import { ago } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useQueue, useStore } from "@/store"

const nav = [
  { key: "home", label: "Home", href: "/home", icon: Home },
  { key: "queue", label: "Review queue", short: "Review", href: "/queue", icon: Inbox },
  { key: "deals", label: "Deals & leads", short: "Deals", href: "/deals", icon: Briefcase },
  { key: "partners", label: "Partners", href: "/partners", icon: Users },
  { key: "credit", label: "Credit splits", short: "Credit", href: "/credit", icon: PieChart },
  { key: "salesforce", label: "Salesforce", href: "/salesforce", icon: SfIcon, desktopOnly: true },
  { key: "health", label: "Partner health", short: "Health", href: "/health", icon: Activity, desktopOnly: true },
] as const

function SfIcon({ className }: ComponentProps<"svg">) {
  return <SalesforceMark className={className?.replace("size-5", "h-4 w-6") ?? "h-4 w-6"} />
}

function SalesforceStatus() {
  const sf = useSalesforce()
  const busy = sf.pending > 0
  const warn = sf.retrying > 0
  return (
    <a
      href="#/salesforce"
      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border bg-card px-2.5 text-[14px] sm:px-3 font-medium text-foreground shadow-[0_1px_2px_#172b450a] transition hover:border-primary/60"
      aria-label={`Salesforce: ${busy ? "writing" : warn ? `${sf.retrying} write retrying` : "in sync"}`}
    >
      <SalesforceMark className="h-4 w-6" />
      <span className="hidden md:inline">Salesforce</span>
      <span className={cn("size-2 rounded-full", busy ? "animate-pulse bg-primary" : warn ? "bg-amber" : "bg-ok")} />
      <span className="hidden text-muted-foreground xl:inline">{busy ? "Writing…" : warn ? `${sf.retrying} retrying` : "In sync"}</span>
    </a>
  )
}

function Notifications() {
  const { state, dispatch } = useStore()
  const unread = state.notices.filter((n) => !n.read).length
  return (
    <Popover onOpenChange={(o) => !o && unread && dispatch({ type: "readNotices" })}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications, ${unread} unread`}>
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 grid min-w-[18px] place-items-center rounded-full bg-amber px-1 text-[11.5px] leading-[18px] font-bold text-[#2a1a00]">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(400px,calc(100vw-24px))] p-0">
        <div className="flex items-baseline justify-between border-b px-5 py-4">
          <b className="text-[16px] text-foreground">Notifications</b>
          <span className="text-[13px] text-muted-foreground">Also sent to Slack and email</span>
        </div>
        <ul className="max-h-[420px] overflow-y-auto">
          {state.notices.map((n) => (
            <li key={n.id}>
              <button onClick={() => go(n.href)} className="flex w-full gap-3 border-b px-5 py-3.5 text-left last:border-0 hover:bg-muted/60">
                <span className={cn("mt-2 size-2 shrink-0 rounded-full", n.read ? "bg-border-strong" : n.tone === "bad" ? "bg-bad" : n.tone === "warn" ? "bg-amber" : "bg-primary")} />
                <span className="min-w-0">
                  <span className="block font-semibold text-foreground">{n.title}</span>
                  <span className="block text-[14px] text-muted-foreground">{n.body}</span>
                  <span className="mt-1 block text-[13px] text-muted-foreground">{n.channel} · {ago(n.at)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const dark = resolvedTheme === "dark"
  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(dark ? "light" : "dark")} aria-label={dark ? "Use light theme" : "Use dark theme"}>
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  )
}

function UserMenu({ onSignOut }: { onSignOut: () => void }) {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="grid size-10 shrink-0 place-items-center rounded-full bg-night text-[14px] font-semibold text-white" aria-label="Account">
          {me.initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-[15px] text-foreground">
          {me.name}
          <span className="block text-[13px] font-normal text-muted-foreground">{me.title} · {me.vendor}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => go("/health")} className="lg:hidden">
          <Activity /> Partner health
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => go("/salesforce")} className="lg:hidden">
          <SalesforceMark className="h-4 w-6" /> Salesforce
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => go("/journeys")}>
          <Route /> The three journeys
        </DropdownMenuItem>
        <DropdownMenuItem asChild><HubMenuLink /></DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
          {resolvedTheme === "dark" ? <Sun /> : <Moon />} {resolvedTheme === "dark" ? "Light" : "Dark"} theme
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onSignOut}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppShell({ section, children, onSignOut }: { section: string; children: ReactNode; onSignOut: () => void }) {
  const q = useQueue()
  const { ask } = useCopilot()
  const [searching, setSearching] = useState(false)
  const counts: Record<string, number> = {
    queue: q.toDecide.length + q.extensions.length,
    partners: q.apps.length,
  }

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[264px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-svh flex-col border-r bg-sidebar lg:flex">
        <div className="px-6 pt-6 pb-5">
          <Logo />
        </div>
        <div className="mx-4 mb-4 flex items-center gap-3 rounded-[12px] border px-3 py-2.5">
          <span className="grid size-9 place-items-center rounded-[9px] bg-night text-[14px] font-bold text-white">B</span>
          <span className="min-w-0 leading-tight">
            <b className="block text-[15px] text-foreground">{me.vendor}</b>
            <span className="text-[13px] text-muted-foreground">Partner manager</span>
          </span>
        </div>
        <nav className="grid gap-1 px-3" aria-label="Main">
          {nav.map((n) => {
            const active = section === n.key
            const count = counts[n.key]
            return (
              <a
                key={n.key}
                href={`#${n.href}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-[10px] px-3 text-[15.5px] font-medium transition-colors",
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-muted",
                )}
              >
                <n.icon className="size-5" />
                <span className="flex-1">{n.label}</span>
                {count ? (
                  <span className="grid min-w-6 place-items-center rounded-full bg-amber px-1.5 text-[13px] leading-6 font-bold text-[#2a1a00]">{count}</span>
                ) : n.key === "health" ? (
                  <span className="text-[12.5px] text-muted-foreground">Stage 2</span>
                ) : null}
              </a>
            )
          })}
        </nav>
        <div className="mt-auto space-y-3 p-4">
          <button
            onClick={() => ask()}
            className="flex w-full items-center gap-3 rounded-[12px] bg-night px-4 py-3 text-left text-white transition hover:bg-night-2"
          >
            <Sparkles className="size-5 text-amber" />
            <span className="leading-tight">
              <b className="block text-[15px]">Ask PartnerAssistant</b>
              <span className="text-[13px] text-[#b9cbe4]">Your copilot for deals</span>
            </span>
          </button>
          <a href="#/journeys" className={cn("flex items-center gap-2 rounded-[10px] px-3 py-2 text-[14.5px] text-muted-foreground hover:bg-muted hover:text-foreground", section === "journeys" && "bg-muted text-foreground")}>
            <Route className="size-4" /> The three journeys
          </a>
          <HubLink />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-[68px] items-center gap-1 border-b bg-background/85 px-3 backdrop-blur sm:gap-3 sm:px-6 lg:px-10">
          <a href="#/home" className="mr-1 shrink-0 lg:hidden">
            <Logo />
          </a>
          <div className="hidden min-w-0 flex-1 md:block">
            <GlobalSearch />
          </div>
          <div className="flex-1 md:hidden" />
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSearching(true)} aria-label="Search">
            <Search className="size-5" />
          </Button>
          <SalesforceStatus />
          <Button variant="outline" className="hidden h-10 gap-2 sm:inline-flex lg:hidden" onClick={() => ask()}>
            <Sparkles className="size-4 text-primary" /> Ask
          </Button>
          <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => ask()} aria-label="Ask PartnerAssistant">
            <Sparkles className="size-5 text-primary" />
          </Button>
          <Notifications />
          <span className="hidden sm:inline-flex"><ThemeToggle /></span>
          <UserMenu onSignOut={onSignOut} />
        </header>
        <Sheet open={searching} onOpenChange={setSearching}>
          <SheetContent side="top" className="px-4 pt-5 pb-6">
            <SheetTitle className="mb-3">Search</SheetTitle>
            <GlobalSearch inline autoFocus onDone={() => setSearching(false)} />
          </SheetContent>
        </Sheet>

        <main className="mx-auto w-full max-w-[1240px] px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-8 lg:pb-16">{children}</main>
      </div>

      {/* Mobile bottom navigation: the PAM mostly works from a phone */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        {nav.filter((n) => !("desktopOnly" in n)).map((n) => {
          const active = section === n.key
          const count = counts[n.key]
          return (
            <a key={n.key} href={`#${n.href}`} aria-current={active ? "page" : undefined} className={cn("relative flex flex-col items-center gap-1 py-2.5 text-[13px] font-medium", active ? "text-primary" : "text-muted-foreground")}>
              <n.icon className="size-[22px]" />
              {"short" in n ? n.short : n.label}
              {count ? (
                <span className="absolute top-1.5 left-[calc(50%+6px)] grid min-w-[18px] place-items-center rounded-full bg-amber px-1 text-[11.5px] leading-[18px] font-bold text-[#2a1a00]">{count}</span>
              ) : null}
            </a>
          )
        })}
      </nav>
    </div>
  )
}
