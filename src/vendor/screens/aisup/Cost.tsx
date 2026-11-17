import { Coins, Gauge, Receipt, TrendingUp } from "lucide-react"
import { PageHeader, Panel } from "@/components/common"
import { money } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Kpi } from "@/partner/bits"
import { agentRoster } from "@/vendor/agents"
import { useAgents } from "@/vendor/useVendor"

/** Monthly AI cost against the budget, as bars. */
export function CostBars() {
  const g = useAgents()
  const top = Math.max(g.budget, ...g.costByMonth.map((m) => m.cost))
  return (
    <div>
      <div className="relative flex h-40 items-end gap-3 border-b pb-px sm:gap-5">
        <span className="absolute inset-x-0 border-t border-dashed border-bad/60" style={{ bottom: `${(g.budget / top) * 100}%` }} aria-hidden />
        {g.costByMonth.map((m) => (
          <div key={m.month} className="flex h-full flex-1 flex-col justify-end">
            <span className="mb-1 text-center text-[13px] font-semibold text-foreground tabular">{money(m.cost)}</span>
            <span className={cn("block rounded-t-[6px]", m.toDate ? "bg-primary" : "bg-primary/40")} style={{ height: `${(m.cost / top) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-3 sm:gap-5">{g.costByMonth.map((m) => <span key={m.month} className="flex-1 text-center text-[13.5px] text-muted-foreground">{m.month}{m.toDate ? " (to date)" : ""}</span>)}</div>
      <p className="mt-2 flex items-center gap-2 text-[13.5px] text-muted-foreground"><span className="w-5 border-t border-dashed border-bad/60" /> Monthly budget {money(g.budget)}</p>
    </div>
  )
}

export function AiCost() {
  const g = useAgents()
  const rows = [...agentRoster].sort((a, b) => b.month.cost - a.month.cost)
  const max = rows[0].month.cost
  return (
    <div className="space-y-6">
      <PageHeader title="AI cost" sub="What the agents cost Brightline, by month and by agent. Cost is tracked per customer, so Brightline only ever sees its own." />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi icon={<Coins />} label="October, to date" value={money(g.month)} sub={`${Math.round((g.month / g.budget) * 100)}% of the ${money(g.budget)} monthly budget`} />
        <Kpi icon={<Receipt />} label="Per agent action" value={`$${(g.month / g.actions).toFixed(2)}`} sub={`${g.actions.toLocaleString("en-US")} actions this month`} />
        <Kpi icon={<TrendingUp />} label="Since July" value={`+${Math.round((g.month / g.costByMonth[0].cost - 1) * 100)}%`} sub="More partners, more deals" />
        <Kpi icon={<Gauge />} label="Per decided registration" value="$0.32" sub="Deal Desk prefill, checks and advice" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr] [&>*]:min-w-0">
        <Panel title="By month" sub="Example figures">
          <CostBars />
        </Panel>
        <Panel title="By agent, this month" bodyClass="px-0 sm:px-0 pb-1">
          <ul>
            {rows.map((a) => (
              <li key={a.id} className="border-t px-5 py-3 sm:px-6">
                <span className="flex items-baseline justify-between gap-3"><a href={`#/v/agent/${a.id}`} className="font-semibold text-foreground hover:text-primary">{a.name}</a><b className="text-foreground tabular">{money(a.month.cost)}</b></span>
                <span className="mt-1 block h-2 rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${(a.month.cost / max) * 100}%` }} /></span>
                <span className="mt-1 block text-[13.5px] text-muted-foreground">{a.month.actions.toLocaleString("en-US")} actions · ${(a.month.cost / a.month.actions).toFixed(2)} each{a.id === "insights" ? " · up 41% on September: partner reps use the ask bar more" : ""}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
