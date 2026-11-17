import { ArrowRight, Scale, TriangleAlert, Layers } from "lucide-react"
import { Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { date, money } from "@/lib/format"
import { go } from "@/lib/router"
import { useStore } from "@/store"
import { Kpi } from "@/partner/bits"
import { useSales, useVendor } from "@/vendor/useVendor"
import { AskBar, Greeting, Recent } from "@/vendor/screens/ops/OpsHome"
import { StageBars, StageStrip, stageTint } from "@/vendor/screens/cro/Pipeline"
import { RiskCard } from "@/vendor/screens/cro/Risk"
import { cn } from "@/lib/utils"

/** The CRO's daily check, on a phone or laptop: which partner deals will close, and which are at risk. */
export function CroHome() {
  const { state } = useStore()
  const { me } = useVendor()
  const s = useSales()
  const soon = [...s.closingQ4].sort((a, b) => a.closeDate.localeCompare(b.closeDate)).slice(0, 5)
  return (
    <div className="space-y-6">
      <Greeting name={me.first} line={<>Partners are on {money(s.total)} of open pipeline.{s.risks.length ? <> <b className="text-foreground">{s.risks.length} deals ({money(s.riskValue)}) are at risk.</b></> : " Nothing is at risk."}</>} />
      <AskBar placeholder="Ask about partner pipeline, deals at risk or conflicts…" example="Which partner deals close this quarter?" />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <div className="relative col-span-2 overflow-hidden rounded-[14px] bg-night p-6 text-white">
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative flex h-full flex-col">
            <p className="text-[15px] font-medium text-[#b9cbe4]">Partner pipeline · all regions</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
              <span className="text-[48px] leading-none font-bold tabular">{money(s.total)}</span>
              <span className="text-[15.5px] text-[#cfe0f7]">{money(s.closingValue)} closing this quarter</span>
            </div>
            <div className="mt-5"><StageStrip /></div>
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <Button size="lg" className="bg-white text-night hover:bg-white/90" onClick={() => go("/v/risk")}><TriangleAlert /> Open deals at risk</Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => go("/v/pipeline")}><Layers /> Pipeline</Button>
            </div>
          </div>
        </div>
        <Kpi icon={<TriangleAlert />} label="Deals at risk" value={String(s.risks.length)} sub={`${money(s.riskValue)} · ${s.risks.filter((r) => !r.underway && !r.nudges.length).length} with nobody on them`} href="/v/risk" />
        <Kpi icon={<Scale />} label="Channel conflicts open" value={String(s.openConflicts.length)} sub={s.openConflicts.length ? s.openConflicts.map((c) => c.reg.customer).join(" · ") : "None open"} href="/v/conflicts" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <div className="space-y-6">
          <Panel title="At risk" sub="Largest first. Ask the person who can act." action={<Button variant="ghost" onClick={() => go("/v/risk")}>All <ArrowRight /></Button>} bodyClass="px-0 sm:px-0 pb-1">
            {s.risks.length === 0 ? <p className="px-6 pb-4 text-muted-foreground">No partner deals at risk.</p> : <ul>{s.risks.slice(0, 4).map((r) => <RiskCard key={r.key} r={r} compact onAsk={() => go("/v/risk")} />)}</ul>}
          </Panel>
          <Panel title="Pipeline by stage" action={<Button variant="ghost" onClick={() => go("/v/pipeline")}>Details <ArrowRight /></Button>}>
            <StageBars compact />
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Closing next" sub="North America, this quarter">
            <ul className="space-y-3">
              {soon.map((d) => (
                <li key={d.key} className="flex items-start justify-between gap-3">
                  <span className="min-w-0"><b className="block truncate text-foreground">{d.account}</b><span className="flex items-center gap-1.5 text-[13.5px] text-muted-foreground"><span className={cn("size-2 rounded-full", stageTint[d.stage])} />{d.stage} · {date(d.closeDate, { month: "short", day: "numeric" })} · {d.partners[0]}</span></span>
                  <b className="shrink-0 text-foreground tabular">{money(d.value)}</b>
                </li>
              ))}
            </ul>
          </Panel>
          <Recent items={state.croFeed} />
        </div>
      </div>
      <p className="text-[14px] text-muted-foreground"><Badge variant="outline" className="mr-2 border-dashed">Stage 1B</Badge>You see every partner deal; deciding registrations and conflicts stays with partner managers.</p>
    </div>
  )
}
