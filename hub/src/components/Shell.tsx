import { useState, type ReactNode } from "react"
import { ArrowLeft, BookOpen, CircleAlert, LayoutGrid, Menu, Monitor, Moon, Network, Scale, Search, Sparkles, Sun, Trophy, Users, Workflow } from "lucide-react"
import { gaps, personas, rules, flows } from "@hub/content"
import { Sheet, SheetContent, SheetTitle } from "@hub/components/ui/sheet"
import { useNav, type Page } from "@hub/lib/nav"
import { setTheme, useTheme, type ThemeChoice } from "@hub/lib/theme"
import { cn } from "@hub/lib/utils"

const nav: { page: Page; label: string; icon: typeof Search; count?: number; hint?: string }[] = [
  { page: "ask", label: "Ask", icon: Search },
  { page: "personas", label: "Personas", icon: Users, count: personas.length },
  { page: "matrix", label: "Permissions", icon: LayoutGrid },
  { page: "rules", label: "Rules & SLA", icon: Scale, count: rules.length },
  { page: "flows", label: "Flows", icon: Workflow, count: flows.length },
  { page: "map", label: "Data map", icon: Network },
  { page: "why", label: "Why us", icon: Trophy },
  { page: "gaps", label: "Gaps & decisions", icon: CircleAlert, count: gaps.filter((g) => g.status === "open" || g.status === "default").length, hint: "open + defaults" },
  { page: "reference", label: "Reference", icon: BookOpen },
]

function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <svg viewBox="0 0 28 24" className={cn("shrink-0", compact ? "h-5 w-6" : "h-6 w-7")} aria-hidden>
        <path d="M6 22 11 2M13 22 18 2M20 22 25 2" stroke="#3b8cf5" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="min-w-0 leading-tight">
        <b className={cn("block font-extrabold tracking-tight text-white", compact ? "truncate text-[15px]" : "text-[16px]")}>{compact ? "Knowledge Hub" : "PRM Knowledge Hub"}</b>
        {!compact && <span className="text-[12.5px] text-night-muted">Single source of truth</span>}
      </span>
    </div>
  )
}

/** Back to the demo's Choose a portal page (the welcome screen). */
const WELCOME = "../#/welcome"

function BackButton({ className }: { className?: string }) {
  return (
    <a
      href={WELCOME}
      className={cn("inline-flex h-10 items-center gap-2 rounded-[10px] border border-white/15 bg-white/6 pr-4 pl-3 text-[14.5px] font-semibold text-white transition-colors hover:bg-white/12", className)}
    >
      <ArrowLeft className="size-4 text-amber" /> Back to portals
    </a>
  )
}

function NavList({ onPick }: { onPick?: () => void }) {
  const { view, go } = useNav()
  return (
    <nav aria-label="Hub sections" className="grid gap-0.5">
      {nav.map((n) => {
        const active = view.page === n.page
        return (
          <button
            key={n.page}
            onClick={() => { go(n.page); onPick?.() }}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-11 items-center gap-3 rounded-[10px] px-3 text-left text-[15px] font-medium transition-colors",
              active ? "bg-white/12 text-white" : "text-night-ink/85 hover:bg-white/6 hover:text-white",
            )}
          >
            <n.icon className={cn("size-[18px]", active ? "text-amber" : "text-night-muted")} />
            <span className="flex-1">{n.label}</span>
            {n.count !== undefined && (
              <span className={cn("rounded-full px-2 text-[12.5px] leading-6 font-semibold tabular", n.page === "gaps" ? "bg-amber text-[#2a1a00]" : "bg-white/10 text-night-ink")} title={n.hint}>
                {n.count}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}

const themes: { id: ThemeChoice; label: string; icon: typeof Sun; hint: string }[] = [
  { id: "light", label: "Light", icon: Sun, hint: "Always light" },
  { id: "dark", label: "Dark", icon: Moon, hint: "Always dark" },
  { id: "auto", label: "Auto", icon: Monitor, hint: "Match your system" },
]

function ThemeSwitch() {
  const current = useTheme()
  return (
    <div role="radiogroup" aria-label="Colour theme" className="grid grid-cols-3 gap-1 rounded-[12px] bg-white/6 p-1">
      {themes.map((t) => (
        <button
          key={t.id}
          role="radio"
          aria-checked={current === t.id}
          title={t.hint}
          onClick={() => setTheme(t.id)}
          className={cn(
            "flex h-9 items-center justify-center gap-1.5 rounded-[9px] text-[14px] font-medium transition-colors",
            current === t.id ? "bg-white/14 text-white" : "text-night-muted hover:text-white",
          )}
        >
          <t.icon className={cn("size-4", current === t.id && "text-amber")} />
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  const { askAssistant } = useNav()
  const [menu, setMenu] = useState(false)
  return (
    <div className="min-h-full lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-svh flex-col bg-night lg:flex">
        <div className="map-grid flex-1 overflow-y-auto px-4 pt-5 pb-4">
          <BackButton className="mb-6" />
          <div className="mb-7 px-2"><Brand /></div>
          <NavList />
        </div>
        <div className="space-y-3 border-t border-white/10 p-4">
          <button onClick={() => askAssistant()} className="flex w-full items-center gap-3 rounded-[12px] bg-white px-4 py-3 text-left text-night transition hover:bg-white/90">
            <Sparkles className="size-5 text-primary" />
            <span className="leading-tight">
              <b className="block text-[15px]">Ask the hub</b>
              <span className="text-[13px] text-slate">Answers from our docs</span>
            </span>
          </button>
          <ThemeSwitch />
          <p className="px-1 text-[12.5px] text-night-muted">Updated 10 Nov 2026 from the BRD, planning deck, persona journeys, engineering docs, the Impartner demo and the six prototype portals.</p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="gutter sticky top-0 z-30 flex h-16 items-center gap-2 bg-night lg:hidden" style={{ top: "env(safe-area-inset-top, 0px)" }}>
          <a href={WELCOME} className="grid size-10 shrink-0 place-items-center rounded-lg text-white hover:bg-white/10" aria-label="Back to portals" title="Back to portals">
            <ArrowLeft className="size-5" />
          </a>
          <button onClick={() => setMenu(true)} className="grid size-10 shrink-0 place-items-center rounded-lg text-white hover:bg-white/10" aria-label="Open sections">
            <Menu className="size-5" />
          </button>
          <div className="min-w-0 flex-1"><Brand compact /></div>
          <button onClick={() => askAssistant()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-3 text-[14px] font-semibold text-night">
            <Sparkles className="size-4 text-primary" /> Ask
          </button>
        </header>
        <Sheet open={menu} onOpenChange={setMenu}>
          <SheetContent side="left" className="w-[290px] border-0 bg-night p-0 text-night-ink">
            <SheetTitle className="sr-only">Sections</SheetTitle>
            <div className="map-grid h-full overflow-y-auto px-4 pt-6 pb-6">
              <BackButton className="mb-5" />
              <div className="mb-6 px-2"><Brand /></div>
              <NavList onPick={() => setMenu(false)} />
              <div className="mt-6 border-t border-white/10 px-1 pt-5">
                <p className="mb-2 px-1 text-[13px] font-semibold text-night-muted">Theme</p>
                <ThemeSwitch />
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <main className="gutter mx-auto w-full max-w-[1240px] py-7 lg:py-9">{children}</main>
      </div>
    </div>
  )
}
