import { ArrowRight, Hourglass, Scale } from "lucide-react"
import { PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import type { CreditLine, Opportunity } from "@/data/model"
import { money, moneyShort, shortDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"

export const shareColors = ["bg-primary", "bg-amber", "bg-ok", "bg-[#8b5cf6]", "bg-[#06a3c9]"]

export function ShareBar({ lines, className }: { lines: CreditLine[]; className?: string }) {
  return (
    <div className={cn("flex h-3 overflow-hidden rounded-full bg-muted", className)}>
      {lines.map((l, i) => (
        <span key={l.partnerId} className={cn("h-full border-r-2 border-card last:border-0", shareColors[i % shareColors.length])} style={{ width: `${l.share}%` }} />
      ))}
    </div>
  )
}

export function SplitStatus({ o }: { o: Opportunity }) {
  if (o.proposal) return <Badge className="border-0 bg-amber-soft text-amber-ink"><Hourglass /> Change waiting for approval</Badge>
  if (o.reconciliation === "matched") return <Badge className="border-0 bg-ok-soft text-ok">Matched to closed-won</Badge>
  if (o.reconciliation === "mismatch") return <Badge className="border-0 bg-bad-soft text-bad">Mismatch · RevOps reviewing</Badge>
  if (o.reconciliation === "pending") return <Badge variant="secondary">Reconciliation pending</Badge>
  if (o.splitSource === "override") return <Badge variant="secondary">Approved override</Badge>
  return <Badge variant="outline">Program model</Badge>
}

export function Credit() {
  const { state, partner } = useStore()
  const opps = state.opportunities
  const pending = opps.filter((o) => o.proposal).length
  const open = opps.filter((o) => !o.stage.startsWith("Closed"))
  const closed = opps.filter((o) => o.stage.startsWith("Closed"))

  const row = (o: Opportunity) => (
    <li key={o.id} className="border-b last:border-0">
      <a href={`#/opportunity/${o.id}`} className="grid gap-3 px-5 py-4 hover:bg-muted/50 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_250px] md:items-center md:gap-6">
        <span className="min-w-0">
          <b className="block truncate text-[16px] text-foreground">{o.account}</b>
          <span className="text-[14px] text-muted-foreground">{money(o.value)} · {o.stage} · closes {shortDate(o.closeDate)}</span>
        </span>
        <span className="min-w-0">
          <ShareBar lines={o.lines} />
          <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[14px]">
            {o.lines.map((l, i) => (
              <span key={l.partnerId} className="inline-flex items-center gap-1.5">
                <span className={cn("size-2.5 rounded-full", shareColors[i % shareColors.length])} />
                <span className="text-foreground">{partner(l.partnerId)?.name}</span>
                <span className="text-muted-foreground">{l.role} {l.share}%</span>
              </span>
            ))}
          </span>
        </span>
        <span className="flex items-center gap-3 md:justify-end">
          <SplitStatus o={o} />
          <ArrowRight className="hidden size-4 text-muted-foreground md:block" />
        </span>
      </a>
    </li>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credit splits"
        sub="Who helped on each opportunity, and how credit is shared. Credit follows the program's model; any change you propose goes to the channel chief."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Summary k="Opportunities with your partners" v={String(opps.length)} sub={moneyShort(opps.reduce((n, o) => n + o.value, 0)) + " counted once"} />
        <Summary k="Changes waiting for approval" v={String(pending)} sub={`Approver: Dana Ortiz`} tone={pending ? "amber" : undefined} />
        <Summary k="Closed-won reconciled" v={`${closed.filter((o) => o.reconciliation === "matched").length} of ${closed.length}`} sub="Against Salesforce closed-won" />
      </div>
      <div className="flex items-start gap-3 rounded-[14px] border bg-card px-5 py-4 text-[15px]">
        <Scale className="mt-0.5 size-5 shrink-0 text-primary" />
        <p>
          <b className="text-foreground">Program model: role-based split.</b> Sourced 50 · Reseller 30 · Referral 25 · Implementation 20 · Technology 20 · Influenced 10, scaled to 100% for the partners on each deal. Deal value is counted once, never per partner.
        </p>
      </div>
      <Panel title="Open opportunities" bodyClass="p-0 sm:p-0"><ul>{open.map(row)}</ul></Panel>
      <Panel title="Closed won" sub="Each figure is checked against Salesforce closed-won" bodyClass="p-0 sm:p-0"><ul>{closed.map(row)}</ul></Panel>
    </div>
  )
}

function Summary({ k, v, sub, tone }: { k: string; v: string; sub: string; tone?: "amber" }) {
  return (
    <div className={cn("rounded-[14px] border bg-card p-5 shadow-[0_1px_2px_#172b4508]", tone === "amber" && "border-amber/60")}>
      <p className="text-[15px] text-muted-foreground">{k}</p>
      <p className={cn("mt-1 text-[30px] leading-tight font-bold text-foreground tabular", tone === "amber" && "text-amber-ink")}>{v}</p>
      <p className="text-[14px] text-muted-foreground">{sub}</p>
    </div>
  )
}
