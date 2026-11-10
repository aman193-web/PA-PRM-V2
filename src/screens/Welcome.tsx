import { useState } from "react"
import { ArrowRight, Building2, ExternalLink, FlaskConical, Library, Loader2, Moon, Store, Sun } from "lucide-react"
import { KNOWLEDGE_HUB, Logo } from "@/components/common"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/lib/theme"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"

export type DemoRole = "pam" | "chief" | "pexec" | "rep" | "mkt" | "tech"

interface RoleCard {
  id: DemoRole
  name: string
  initials: string
  role: string
  org: string
  job: string
  tint: string
}

const sides: { key: string; label: string; org: string; icon: typeof Building2; showOrg?: boolean; roles: RoleCard[] }[] = [
  {
    key: "vendor", label: "Vendor side", org: "Brightline", icon: Building2,
    roles: [
      { id: "pam", name: "Jordan Lee", initials: "JL", role: "Partner manager", org: "Brightline", job: "Decides held-back deals and looks after partners", tint: "bg-night text-white" },
      { id: "chief", name: "Dana Ortiz", initials: "DO", role: "Channel chief", org: "Brightline", job: "Approves escalations and owns partner revenue and budget", tint: "bg-[#f1ecfd] text-[#6d3fd1] dark:bg-[#2a2147] dark:text-[#c4b0ff]" },
    ],
  },
  {
    key: "partner", label: "Partner side", org: "Ridgeway IT and Northpeak Consulting", icon: Store, showOrg: true,
    roles: [
      { id: "pexec", name: "Paul Okafor", initials: "PO", role: "Partner executive", org: "Ridgeway IT", job: "Sees revenue, assigns leads, manages the team", tint: "bg-amber-soft text-amber-ink" },
      { id: "rep", name: "Marcus Bell", initials: "MB", role: "Partner sales rep", org: "Ridgeway IT", job: "Registers deals and sees his own credit", tint: "bg-brand-soft text-primary" },
      { id: "mkt", name: "Priya Raman", initials: "PR", role: "Partner marketer", org: "Ridgeway IT", job: "Runs campaigns and requests marketing funds", tint: "bg-ok-soft text-ok" },
      { id: "tech", name: "Raj Mehta", initials: "RM", role: "Partner technical lead", org: "Northpeak Consulting", job: "Gets certified and logs delivery for credit", tint: "bg-secondary text-foreground" },
    ],
  },
]

function Row({ c, busy, onPick, showOrg }: { c: RoleCard; busy: DemoRole | null; onPick: (r: DemoRole) => void; showOrg?: boolean }) {
  return (
    <li className="flex items-center gap-3 rounded-[12px] border bg-card p-3.5">
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-full text-[15px] font-bold", c.tint)}>{c.initials}</span>
      <span className="min-w-0 flex-1">
        <b className="block text-[16px] leading-tight text-foreground">{c.role} <span className="font-normal text-muted-foreground">· {c.name}</span></b>
        <span className="mt-0.5 block text-[14px] text-muted-foreground">
          {showOrg && <span className="font-medium text-foreground">{c.org} · </span>}{c.job} · <button type="button" onClick={() => go(`/signin/${c.id}`)} className="font-medium text-primary hover:underline">Sign-in page</button>
        </span>
      </span>
      <Button className="h-10 shrink-0" onClick={() => onPick(c.id)} disabled={!!busy} aria-label={`Sign in as ${c.name}`}>
        {busy === c.id ? <Loader2 className="animate-spin" /> : null} <span className="hidden sm:inline">Sign in</span> <ArrowRight />
      </Button>
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
        <div className="mx-auto flex h-16 max-w-[1080px] items-center gap-3 px-4 sm:px-8">
          <Logo />
          <span className="flex-1" />
          <Button variant="outline" asChild className="h-9 gap-2 text-[14.5px]">
            <a href={KNOWLEDGE_HUB} target="_blank" rel="noreferrer">
              <Library className="size-4 text-primary" /> <span className="hidden sm:inline">Knowledge hub</span><span className="sm:hidden">Hub</span> <ExternalLink className="size-3.5 text-muted-foreground" />
            </a>
          </Button>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-soft px-3 py-1 text-[13.5px] font-semibold text-amber-ink">
            <FlaskConical className="size-4" /> Demo sign-in
          </span>
          <Button variant="ghost" size="icon" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label={resolvedTheme === "dark" ? "Use light theme" : "Use dark theme"}>
            {resolvedTheme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1080px] flex-1 px-4 py-8 sm:px-8 sm:py-12">
        <h1 className="text-[28px] leading-tight font-bold sm:text-[32px]">Choose a portal</h1>
        <p className="mt-1.5 text-[16px] text-muted-foreground">Pick a role to sign in. What you do in one portal shows up in the others.</p>

        <div className="mt-7 grid items-start gap-5 lg:grid-cols-2">
          {sides.map((s) => (
            <section key={s.key} className="rounded-[16px] border bg-surface-2/60 p-4 sm:p-5">
              <h2 className="mb-3 flex items-baseline gap-2">
                <s.icon className="size-4 translate-y-0.5 text-muted-foreground" />
                <span className="text-[17px] font-semibold">{s.label}</span>
                <span className="text-[14px] text-muted-foreground">· {s.org}</span>
              </h2>
              <ul className="grid gap-2.5">{s.roles.map((c) => <Row key={c.id} c={c} busy={busy} onPick={pick} showOrg={s.showOrg} />)}</ul>
            </section>
          ))}
        </div>

        <p className="mt-6 text-[14.5px] text-muted-foreground">
          <b className="text-foreground">Try it:</b> register a deal over $50,000 as Marcus, then sign in as Jordan to find it in the review queue. Or hand a campaign lead to Marcus as Priya, and approve her funds request as Dana.
          For the team only, not part of the product. Names are illustrative.
        </p>
      </main>
    </div>
  )
}
