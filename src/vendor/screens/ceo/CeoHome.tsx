import { ArrowRight, Inbox, PieChart, Presentation, TrendingUp } from "lucide-react"
import { Panel } from "@/components/common"
import { Button } from "@/components/ui/button"
import { money } from "@/lib/format"
import { go } from "@/lib/router"
import { useStore } from "@/store"
import { budget } from "@/chief/data"
import { Kpi } from "@/partner/bits"
import { useExec, useVendor } from "@/vendor/useVendor"
import { AskBar, Greeting, Recent } from "@/vendor/screens/ops/OpsHome"
import { QuarterBars } from "@/vendor/screens/ceo/Revenue"
import { ExecApprovalRow } from "@/vendor/screens/ceo/Approvals"

/** The CFO's weekly check, mostly on a phone: is the channel worth it, and what needs a signature. */
export function CeoHome() {
  const { state } = useStore()
  const { me } = useVendor()
  const e = useExec()
  return (
    <div className="space-y-6">
      <Greeting name={me.first} line={<>Partners brought in {money(e.rev.won)} of verified revenue this year: a {e.roi.toFixed(1)}x return on the program.{e.pending.length ? <> <b className="text-foreground">{e.pending.length} {e.pending.length === 1 ? "approval needs" : "approvals need"} you.</b></> : null}</>} />
      <AskBar placeholder="Ask about partner revenue, return or approvals…" example="Is the channel worth the investment?" />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <div className="relative col-span-2 overflow-hidden rounded-[14px] bg-night p-6 text-white">
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative flex h-full flex-col">
            <p className="text-[15px] font-medium text-[#b9cbe4]">Partner revenue, {budget.year} · verified</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
              <span className="text-[48px] leading-none font-bold tabular">{money(e.rev.won)}</span>
              <span className="text-[15.5px] text-[#cfe0f7]">{Math.round(e.share * 100)}% of Brightline's revenue</span>
            </div>
            <div className="mt-5">
              <div className="flex justify-between text-[14.5px] text-[#cfe0f7]"><span>Annual target {money(budget.revenueTarget)}</span><span className="tabular">{e.pct}%</span></div>
              <div className="mt-1.5 h-2.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-amber" style={{ width: `${e.pct}%` }} /></div>
            </div>
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <Button size="lg" className="bg-white text-night hover:bg-white/90" onClick={() => go("/v/board")}><Presentation /> Share the board view</Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => go("/v/revenue")}><TrendingUp /> Partner revenue</Button>
            </div>
          </div>
        </div>
        <Kpi icon={<PieChart />} label="Return on program budget" value={`${e.roi.toFixed(1)}x`} sub={`${money(budget.spent)} spent of ${money(budget.annual)}`} href="/v/revenue" />
        <Kpi icon={<Inbox />} label="Waiting for your approval" value={String(e.pending.length)} sub={e.pending.length ? e.pending.map((x) => x.kind === "model" ? "Model v3" : "Rebate").join(" · ") : "Nothing waiting"} href="/v/approvals" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <div className="space-y-6">
          <Panel title="Needs your approval" sub="Only the CFO can approve these" action={<Button variant="ghost" onClick={() => go("/v/approvals")}>All <ArrowRight /></Button>} bodyClass="px-0 sm:px-0 pb-1">
            {e.pending.length === 0 ? <p className="px-6 pb-4 text-muted-foreground">Nothing waiting for you.</p> : <ul>{e.pending.map((x) => <ExecApprovalRow key={x.id} x={x} compact />)}</ul>}
          </Panel>
          <Panel title="Verified revenue by quarter" sub="Each quarter keeps the attribution model that was in force at the time">
            <QuarterBars rows={e.byQuarter} />
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Top partners" action={<Button variant="ghost" onClick={() => go("/v/revenue")}>All <ArrowRight /></Button>}>
            <ul className="space-y-3.5">
              {e.rev.top.map((p) => (
                <li key={p.id}>
                  <span className="flex justify-between gap-2 text-[15px]"><b className="truncate text-foreground">{p.name}</b><b className="text-foreground tabular">{money(p.won)}</b></span>
                  <span className="mt-1 block h-2 rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${(p.won / e.rev.top[0].won) * 100}%` }} /></span>
                </li>
              ))}
            </ul>
          </Panel>
          <Recent items={state.execFeed} />
        </div>
      </div>
    </div>
  )
}
