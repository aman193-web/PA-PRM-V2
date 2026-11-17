import { useState } from "react"
import { Building2, ChevronRight, ExternalLink, FlaskConical, KeyRound, Library, Loader2, Moon, Store, Sun } from "lucide-react"
import { KNOWLEDGE_HUB, Logo } from "@/components/common"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/lib/theme"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"

export type DemoRole = "pam" | "chief" | "revops" | "ae" | "ceo" | "cro" | "it" | "aisup" | "pexec" | "rep" | "mkt" | "tech"

interface RoleCard {
  id: DemoRole
  name: string
  initials: string
  role: string
  org: string
  job: string
  tint: string
}

/** Roles in the PRM Knowledge Hub's order (personas.ts roleOrder): leaders first, then the channel team, sales and operations, the platform roles, and the partner side. */
const sides: { key: string; label: string; org: string; icon: typeof Building2; showOrg?: boolean; roles: RoleCard[] }[] = [
  {
    key: "vendor", label: "Vendor side", org: "Brightline", icon: Building2,
    roles: [
      { id: "ceo", name: "Morgan Hale", initials: "MH", role: "CEO / CFO", org: "Brightline", job: "Checks the channel's return and approves the credit model", tint: "bg-[#eef2e3] text-[#4d6b1f] dark:bg-[#1f2a12] dark:text-[#b5d77a]" },
      { id: "cro", name: "Priya Shah", initials: "PS", role: "CRO / VP Sales", org: "Brightline", job: "Watches partner pipeline and deals at risk", tint: "bg-[#fdeee4] text-[#b4441a] dark:bg-[#3a1d10] dark:text-[#f7b08a]" },
      { id: "chief", name: "Dana Ortiz", initials: "DO", role: "Channel chief", org: "Brightline", job: "Approves escalations and owns partner revenue and budget", tint: "bg-[#f1ecfd] text-[#6d3fd1] dark:bg-[#2a2147] dark:text-[#c4b0ff]" },
      { id: "pam", name: "Jordan Lee", initials: "JL", role: "Partner manager", org: "Brightline", job: "Decides held-back deals and looks after partners", tint: "bg-night text-white" },
      { id: "ae", name: "Sam Rivera", initials: "SR", role: "Field seller", org: "Brightline", job: "Sees partners on their accounts and sends co-sell requests", tint: "bg-[#fdecef] text-[#b4234a] dark:bg-[#3a1520] dark:text-[#f5a3b8]" },
      { id: "revops", name: "Ana Costa", initials: "AC", role: "RevOps", org: "Brightline", job: "Fixes data exceptions and reconciles partner revenue", tint: "bg-[#e8f6fb] text-[#06779e] dark:bg-[#10303d] dark:text-[#7fd3f0]" },
      { id: "it", name: "Kai Brennan", initials: "KB", role: "IT / CRM admin", org: "Brightline", job: "Connects Salesforce, manages users and reads the audit log", tint: "bg-[#e9edf2] text-[#3d4f66] dark:bg-[#1d2733] dark:text-[#a9bacf]" },
      { id: "aisup", name: "Lee Park", initials: "LP", role: "AI supervisor", org: "Brightline", job: "Sets what AI agents may do and can stop them", tint: "bg-[#f9e8f7] text-[#a02a94] dark:bg-[#3a1537] dark:text-[#f0a6e6]" },
    ],
  },
  {
    key: "partner", label: "Partner side", org: "Ridgeway IT and Northpeak", icon: Store, showOrg: true,
    roles: [
      { id: "pexec", name: "Paul Okafor", initials: "PO", role: "Partner executive", org: "Ridgeway IT", job: "Sees revenue, assigns leads, manages the team", tint: "bg-amber-soft text-amber-ink" },
      { id: "rep", name: "Marcus Bell", initials: "MB", role: "Partner sales rep", org: "Ridgeway IT", job: "Registers deals and sees their own credit", tint: "bg-brand-soft text-primary" },
      { id: "mkt", name: "Priya Raman", initials: "PR", role: "Partner marketer", org: "Ridgeway IT", job: "Runs campaigns and requests marketing funds", tint: "bg-ok-soft text-ok" },
      { id: "tech", name: "Raj Mehta", initials: "RM", role: "Partner technical lead", org: "Northpeak Consulting", job: "Gets certified and logs delivery for credit", tint: "bg-secondary text-foreground" },
    ],
  },
]

/** One role. The whole card signs in; the key opens that role's sign-in page. */
function Row({ c, busy, onPick, showOrg }: { c: RoleCard; busy: DemoRole | null; onPick: (r: DemoRole) => void; showOrg?: boolean }) {
  return (
    <li className="group relative flex items-center gap-3 rounded-[12px] border bg-card px-3 py-2.5 transition hover:border-primary/60 hover:shadow-[0_2px_10px_#172b4514]">
      <button type="button" onClick={() => onPick(c.id)} disabled={!!busy} aria-label={`Sign in as ${c.name}, ${c.role}`} className="absolute inset-0 rounded-[12px] outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-wait" />
      <span className={cn("pointer-events-none grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-bold", c.tint)}>{c.initials}</span>
      <span className="pointer-events-none min-w-0 flex-1">
        <b className="block text-[15px] leading-tight text-foreground">{c.role} <span className="font-normal text-muted-foreground">· {c.name}</span></b>
        <span className="mt-0.5 line-clamp-3 text-[13px] leading-snug text-muted-foreground">
          {showOrg && <span className="font-medium text-foreground">{c.org} · </span>}{c.job}
        </span>
      </span>
      <button type="button" onClick={() => go(`/signin/${c.id}`)} aria-label={`Open the sign-in page for ${c.role}`} title="Sign-in page" className="relative z-10 grid size-8 shrink-0 place-items-center rounded-[8px] text-muted-foreground hover:bg-muted hover:text-primary">
        <KeyRound className="size-4" />
      </button>
      <span className="pointer-events-none -ml-1.5 shrink-0 text-muted-foreground group-hover:text-primary lg:hidden xl:block">
        {busy === c.id ? <Loader2 className="size-4 animate-spin" /> : <ChevronRight className="size-5" />}
      </span>
    </li>
  )
}

/** Demo-only role picker, so the team can move between portals quickly. Not part of the product. */
export function Welcome({ onPick }: { onPick: (r: DemoRole) => void }) {
  const [busy, setBusy] = useState<DemoRole | null>(null)
  const { resolvedTheme, setTheme } = useTheme()
  const pick = (r: DemoRole) => {
    setBusy(r)
    setTimeout(() => onPick(r), 400)
  }
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b bg-card/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-2 px-4 sm:gap-3 sm:px-8">
          <Logo />
          <span className="flex-1" />
          <Button variant="outline" asChild className="h-9 gap-2 px-3 text-[14.5px]">
            <a href={KNOWLEDGE_HUB} target="_blank" rel="noreferrer">
              <Library className="size-4 text-primary" /> <span className="hidden sm:inline">Knowledge hub</span><span className="sm:hidden">Hub</span> <ExternalLink className="hidden size-3.5 text-muted-foreground sm:block" />
            </a>
          </Button>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-soft px-3 py-1 text-[13.5px] font-semibold whitespace-nowrap text-amber-ink">
            <FlaskConical className="size-4" /> Demo<span className="hidden sm:inline"> sign-in</span>
          </span>
          <Button variant="ghost" size="icon" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label={resolvedTheme === "dark" ? "Use light theme" : "Use dark theme"}>
            {resolvedTheme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <h1 className="text-[26px] leading-tight font-bold sm:text-[28px]">Choose a portal</h1>
        <p className="mt-1 text-[15.5px] text-muted-foreground">Pick a role to sign in. What you do in one portal shows up in the others.</p>

        <div className="mt-5 grid items-start gap-4 lg:grid-cols-3">
          {sides.map((s) => (
            <section key={s.key} className={cn("rounded-[16px] border bg-surface-2/60 p-3 sm:p-4", s.key === "vendor" && "lg:col-span-2")}>
              <h2 className="mb-2.5 flex items-baseline gap-2 px-1">
                <s.icon className="size-4 translate-y-0.5 text-muted-foreground" />
                <span className="shrink-0 text-[16px] font-semibold">{s.label}</span>
                <span className="truncate text-[13.5px] text-muted-foreground">· {s.org}</span>
              </h2>
              <ul className={cn("grid gap-2 sm:grid-cols-2", s.key === "partner" && "lg:grid-cols-1")}>{s.roles.map((c) => <Row key={c.id} c={c} busy={busy} onPick={pick} showOrg={s.showOrg} />)}</ul>
            </section>
          ))}
        </div>

        <p className="mt-5 text-[14px] text-muted-foreground">
          <b className="text-foreground">Try it:</b> register a deal over $50,000 as Marcus, then sign in as Jordan to find it in the review queue. Or send Ridgeway a co-sell request as Sam and accept it as Marcus, then fix the Cedar Valley mismatch as Ana. As Lee, pause the Deal Desk agent and Jordan's registrations lose its advice.
          Click a card to sign in; the key opens that role's sign-in page. For the team only, not part of the product. Names are illustrative.
        </p>
      </main>
    </div>
  )
}
