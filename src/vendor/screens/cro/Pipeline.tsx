import { CalendarClock, Download, Globe2, Handshake, Hourglass, Layers, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { date, money } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { Kpi, StageTag } from "@/partner/bits"
import { forecast } from "@/vendor/sales"
import { useSales, type PipeDeal } from "@/vendor/useVendor"

export const stageTint: Record<string, string> = {
  "In review": "bg-amber", Discovery: "bg-primary/30", Qualification: "bg-primary/50", Proposal: "bg-primary/75", Negotiation: "bg-primary",
}

/** Pipeline by stage: North America deal by deal, EMEA and APAC from their Salesforce totals. */
export function StageBars({ compact }: { compact?: boolean }) {
  const s = useSales()
  const max = Math.max(...s.byStage.map((b) => b.total))
  return (
    <div>
      <ul className="space-y-3">
        {s.byStage.map((b) => (
          <li key={b.stage} className="grid grid-cols-[104px_minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[120px_minmax(0,1fr)_auto]">
            <span className="text-[15px] text-foreground">{b.stage}</span>
            <span className="flex h-3 overflow-hidden rounded-full bg-muted" aria-hidden>
              <span className={cn("h-full", stageTint[b.stage])} style={{ width: `${(b.na / max) * 100}%` }} />
              <span className={cn("h-full opacity-35", stageTint[b.stage])} style={{ width: `${(b.other / max) * 100}%` }} />
            </span>
            <b className="text-right text-[15px] text-foreground tabular">{money(b.total)}</b>
          </li>
        ))}
      </ul>
      {!compact && (
        <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-full bg-primary" /> North America, deal by deal</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-5 rounded-full bg-primary/35" /> EMEA and APAC, from Salesforce totals</span>
        </p>
      )}
    </div>
  )
}

/** The stage mix as one bar, for the dark hero card. */
export function StageStrip({ light }: { light?: boolean }) {
  const s = useSales()
  const tint = light ? stageTint : { "In review": "bg-amber", Discovery: "bg-white/25", Qualification: "bg-white/45", Proposal: "bg-white/70", Negotiation: "bg-white" } as Record<string, string>
  return (
    <div>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" aria-hidden>
        {s.byStage.map((b) => <span key={b.stage} className={cn("h-full", tint[b.stage])} style={{ width: `${(b.total / s.total) * 100}%` }} />)}
      </div>
      <ul className={cn("mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[13.5px]", light ? "text-muted-foreground" : "text-[#cfe0f7]")}>
        {s.byStage.map((b) => <li key={b.stage} className="inline-flex items-center gap-1.5"><span className={cn("size-2.5 rounded-full", tint[b.stage])} />{b.stage} {money(b.total)}</li>)}
      </ul>
    </div>
  )
}

function exportPipeline(deals: PipeDeal[]) {
  const head = "Account,Partners,Stage,Value,Close date,Brightline owner,Source"
  const rows = deals.map((d) => [d.account, d.partners.join(" + "), d.stage, d.value, d.closeDate, d.owner ?? "", d.source === "cosell" ? "Co-sell" : "Partner registered"].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","))
  const a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob([[head, ...rows].join("\n")], { type: "text/csv" }))
  a.download = "partner-pipeline-north-america.csv"
  a.click()
}

export function CroPipeline() {
  const { dispatch } = useStore()
  const s = useSales()
  const riskKeys = new Set(s.risks.map((r) => r.account))
  const top = Math.max(...forecast.rows.map((r) => r.high))
  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner pipeline"
        sub="Open deals with a partner on them, by Salesforce stage. North America is deal by deal; EMEA and APAC come from their Salesforce totals."
        actions={<Button variant="outline" size="lg" onClick={() => { exportPipeline(s.deals); dispatch({ type: "croExport", rows: s.deals.length }); toast.success("Pipeline exported", { description: `${s.deals.length} deals, as a spreadsheet. Logged in the audit log.` }) }}><Download /> Export</Button>}
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi icon={<Layers />} label="Partner pipeline, all regions" value={money(s.total)} sub={`${s.deals.length} deals in North America`} />
        <Kpi icon={<CalendarClock />} label="Closing this quarter" value={money(s.closingValue)} sub={`${s.closingQ4.length} North America deals, past review`} />
        <Kpi icon={<Hourglass />} label="Waiting for a decision" value={money(s.inReview.reduce((n, d) => n + d.value, 0))} sub={`${s.inReview.length} registrations with partner managers`} />
        <Kpi icon={<Handshake />} label="Co-sell deals" value={money(s.cosell)} sub={s.cosellDeals.length ? `${s.cosellDeals.length} brought in by Brightline sellers` : "None accepted yet"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr] [&>*]:min-w-0">
        <Panel title="By stage" sub="Where the money sits">
          <StageBars />
        </Panel>
        <Panel title={<span className="flex items-center gap-2"><Globe2 className="size-5 text-primary" /> By region</span>} sub="Each region's partner manager">
          <ul className="space-y-3.5">
            {s.regions.map((r) => (
              <li key={r.region}>
                <span className="flex justify-between gap-2 text-[15px]"><span className="min-w-0"><b className="text-foreground">{r.region}</b> <span className="text-muted-foreground">· {r.manager}</span></span><b className="text-foreground tabular">{money(r.value)}</b></span>
                <span className="mt-1 block h-2 rounded-full bg-muted"><span className={cn("block h-full rounded-full", r.live ? "bg-primary" : "bg-primary/40")} style={{ width: `${(r.value / Math.max(...s.regions.map((x) => x.value))) * 100}%` }} /></span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[14px] text-muted-foreground">{s.cosell ? `North America includes ${money(s.cosell)} of co-sell deals, where a Brightline seller brought the partner in. The channel chief's pipeline counts partner-registered deals only.` : "These match the channel chief's partner pipeline. Co-sell deals are added once a partner accepts a seller's request."}</p>
        </Panel>
      </div>

      <Panel title="North America, deal by deal" sub="Largest first. Partner credit and commercial terms aren't shown here." bodyClass="px-0 sm:px-0 pb-1">
        <div className="hidden gap-x-4 border-y bg-surface-2/60 px-6 py-3 text-[14px] font-medium text-muted-foreground xl:grid xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_120px_110px_100px_minmax(0,0.9fr)]">
          <span>Account</span><span>Partners</span><span>Stage</span><span className="text-right">Value</span><span>Close</span><span>Brightline owner</span>
        </div>
        <ul>
          {s.deals.map((d) => {
            const risk = riskKeys.has(d.account) && <a href="#/v/risk" aria-label="At risk" title="At risk"><TriangleAlert className="size-4 shrink-0 text-amber-ink" /></a>
            const stage = <span className="inline-flex items-center gap-1.5"><span className={cn("size-2.5 rounded-full", stageTint[d.stage])} />{d.stage}</span>
            return (
              <li key={d.key} className="border-b px-5 py-3.5 last:border-0 sm:px-6">
                <div className="xl:hidden">
                  <div className="flex items-baseline justify-between gap-3"><b className="flex min-w-0 items-center gap-2 text-foreground"><span className="truncate">{d.account}</span>{risk}</b><b className="shrink-0 text-foreground tabular">{money(d.value)}</b></div>
                  <p className="truncate text-[14px] text-muted-foreground">{d.partners.join(", ")}{d.source === "cosell" ? " · co-sell" : ""}</p>
                  <p className="flex flex-wrap items-center gap-x-1.5 text-[14px] text-muted-foreground"><span className="text-foreground">{stage}</span> · closes {date(d.closeDate, { month: "short", day: "numeric" })} · {d.owner ?? "Partner-led"}</p>
                </div>
                <div className="hidden items-center gap-x-4 xl:grid xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_120px_110px_100px_minmax(0,0.9fr)]">
                  <span className="min-w-0"><b className="flex items-center gap-2 text-foreground"><span className="truncate">{d.account}</span>{risk}</b>{d.source === "cosell" && <Badge variant="outline" className="mt-0.5">Co-sell</Badge>}</span>
                  <span className="truncate text-[14.5px] text-muted-foreground">{d.partners.join(", ")}</span>
                  <span className="text-[14.5px] text-foreground">{stage}</span>
                  <b className="text-right text-foreground tabular">{money(d.value)}</b>
                  <span className="text-[14.5px] text-muted-foreground">{date(d.closeDate, { month: "short", day: "numeric" })}</span>
                  <span className="truncate text-[14.5px] text-muted-foreground">{d.owner ?? "Partner-led"}</span>
                </div>
              </li>
            )
          })}
        </ul>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr] [&>*]:min-w-0">
        <Panel title="By partner" sub="Open pipeline and verified revenue won this year" bodyClass="px-0 sm:px-0 pb-1">
          <ul>
            {s.byPartner.map((p) => (
              <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 border-t px-5 py-3 sm:px-6 sm:grid-cols-[minmax(0,1fr)_110px_110px]">
                <span className="min-w-0"><b className="block truncate text-foreground">{p.name}</b><span className="text-[13.5px] text-muted-foreground">{p.tier} {p.program.toLowerCase()} · {p.region}{p.deals !== undefined ? ` · ${p.deals} ${p.deals === 1 ? "deal" : "deals"}` : ""}</span></span>
                <b className="text-right text-foreground tabular">{money(p.pipeline)}</b>
                <span className="hidden text-right text-[14.5px] text-muted-foreground tabular sm:block">{money(p.won)} won</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={<span className="flex flex-wrap items-center gap-2">{forecast.quarter} forecast <StageTag /></span>} sub="Partner-involved against direct, with a confidence band (PD-05, PD-06)">
          <ul className="space-y-5">
            {forecast.rows.map((r) => (
              <li key={r.key}>
                <span className="flex justify-between gap-2 text-[15px]"><b className="text-foreground">{r.label}</b><b className="text-foreground tabular">{money(r.commit)}</b></span>
                <span className="relative mt-2 block h-3 rounded-full bg-muted" aria-hidden>
                  <span className="absolute inset-y-0 rounded-full bg-primary/25" style={{ left: `${(r.low / top) * 100}%`, width: `${((r.high - r.low) / top) * 100}%` }} />
                  <span className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${(r.commit / top) * 100}%` }} />
                </span>
                <span className="mt-1 block text-[13.5px] text-muted-foreground">Likely between {money(r.low)} and {money(r.high)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[14.5px] text-foreground">Together {money(forecast.rows.reduce((n, r) => n + r.commit, 0))} against a {money(forecast.target)} target.</p>
          <ul className="mt-2 space-y-1.5">{forecast.why.map((w) => <li key={w} className="flex gap-2.5 text-[14px] text-muted-foreground"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{w}</li>)}</ul>
        </Panel>
      </div>
      <p className="text-[14px] text-muted-foreground"><Badge variant="outline" className="mr-2 border-dashed">Stage 1B</Badge>Stages come from Salesforce, the system of record. EMEA, APAC and the forecast use example figures.</p>
    </div>
  )
}
