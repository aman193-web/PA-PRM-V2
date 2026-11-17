import { ArrowRight, Bot, CircleSlash, Coins, Cpu, Hourglass } from "lucide-react"
import { Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ago, money } from "@/lib/format"
import { go } from "@/lib/router"
import { useStore } from "@/store"
import { Kpi } from "@/partner/bits"
import { RequestStatus } from "@/vendor/screens/ops/Programs"
import { useAgents, useVendor } from "@/vendor/useVendor"
import { AskBar, Greeting, Recent } from "@/vendor/screens/ops/OpsHome"
import { AgentStatus, KillSwitch, levelLabel } from "@/vendor/screens/aisup/Agents"
import { ActivityRow } from "@/vendor/screens/aisup/Activity"

/** The AI supervisor's laptop view: are the agents safe and useful, and what needs a look. */
export function AiHome() {
  const { state } = useStore()
  const { me } = useVendor()
  const g = useAgents()
  return (
    <div className="space-y-6">
      <Greeting name={me.first} line={<>{g.paused ? <b className="text-bad">Every agent is paused.</b> : <>{g.running} of {g.roster.length} agents are running.</>}{g.overrides.length ? <> <b className="text-foreground">{g.overrides.length} {g.overrides.length === 1 ? "override needs" : "overrides need"} a look.</b></> : null}</>} />
      <AskBar placeholder="Ask about agents, overrides or AI cost…" example="What did the agents do today?" />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <div className="relative col-span-2 overflow-hidden rounded-[14px] bg-night p-6 text-white">
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative flex h-full flex-col">
            <p className="text-[15px] font-medium text-[#b9cbe4]">Agent actions, last 30 days</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
              <span className="text-[48px] leading-none font-bold tabular">{g.actions.toLocaleString("en-US")}</span>
              <span className="text-[15.5px] text-[#cfe0f7]">{(g.agreement * 100).toFixed(1)}% of decisions agreed with by people</span>
            </div>
            <p className="mt-4 text-[14.5px] text-[#cfe0f7]">{g.paused ? "Kill switch on: people are doing the agents' work" : `${g.running} running · ${g.roster.length - g.running} paused${state.pausedActions.length ? ` · ${state.pausedActions.length} single ${state.pausedActions.length === 1 ? "action" : "actions"} paused` : ""}`}</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <Button size="lg" className="bg-white text-night hover:bg-white/90" onClick={() => go("/v/agents")}><Cpu /> Pause or tune an agent</Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => go("/v/activity")}><Bot /> Activity</Button>
            </div>
          </div>
        </div>
        <Kpi icon={<CircleSlash />} label="Overrides to review" value={String(g.overrides.length)} sub="A person decided differently" href="/v/activity/overrides" />
        <Kpi icon={<Coins />} label="AI cost this month" value={money(g.month)} sub={`${Math.round((g.month / g.budget) * 100)}% of the ${money(g.budget)} budget`} href="/v/cost" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <div className="space-y-6">
          <Panel title="Overrides to review" sub="Patterns here mean an agent needs tuning" action={<Button variant="ghost" onClick={() => go("/v/activity/overrides")}>All <ArrowRight /></Button>} bodyClass="px-0 sm:px-0 pb-1">
            {g.overrides.length === 0 ? <p className="px-6 pb-4 text-muted-foreground">Nothing to review.</p> : <ul>{g.overrides.slice(0, 4).map((x) => <ActivityRow key={x.id} x={x} onOpen={() => go("/v/activity/overrides")} />)}</ul>}
          </Panel>
          <Panel title="Agents" action={<Button variant="ghost" onClick={() => go("/v/agents")}>All <ArrowRight /></Button>} bodyClass="px-0 sm:px-0 pb-1">
            <ul>
              {g.roster.map((a) => (
                <li key={a.id} className="border-t">
                  <a href={`#/v/agent/${a.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 hover:bg-muted/50 sm:grid-cols-[minmax(0,1fr)_200px_auto] sm:px-6">
                    <span className="min-w-0"><b className="block truncate text-[15px] text-foreground">{a.name}</b><span className="block truncate text-[13.5px] text-muted-foreground">{a.job}</span></span>
                    <span className="hidden text-[14px] text-foreground sm:block">{a.level} · {levelLabel(a.level)}</span>
                    <AgentStatus a={a} />
                  </a>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Your requests to Dana" sub="Raising autonomy needs the channel chief (R-AG-1)">
            {g.myRequests.length === 0 ? <p className="text-muted-foreground">Nothing sent.</p> : (
              <ul className="space-y-3">
                {g.myRequests.map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-3">
                    <a href={`#/v/agent/${r.agent ?? "deal-desk"}`} className="min-w-0"><b className="block text-[15px] leading-snug text-foreground">{r.title}</b><span className="flex items-center gap-1 text-[13.5px] text-muted-foreground">{r.status === "pending" && <Hourglass className="size-3.5" />}{r.id} · {ago(r.at)}</span></a>
                    <RequestStatus status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Recent items={state.aisupFeed} />
        </div>
      </div>
      <KillSwitch />
      <p className="text-[14px] text-muted-foreground"><Badge variant="outline" className="mr-2 border-dashed">Stage 0</Badge>You set what agents may do and stop them when needed. The business decisions they raise stay with the people who own them.</p>
    </div>
  )
}
