import { useState } from "react"
import { Bot, CheckCheck, CircleSlash, Hourglass, ListChecks, Settings2, Zap } from "lucide-react"
import { toast } from "sonner"
import { Confidence, EmptyState, PageHeader, PageTabs, Panel } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ago } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { agentRoster, modelName, type AgentLogEntry } from "@/vendor/agents"
import { useAgents } from "@/vendor/useVendor"
import { OutcomeBadge } from "@/vendor/screens/aisup/Agents"

const nameOf = (id: string) => agentRoster.find((a) => a.id === id)?.name ?? id
const actionOf = (agent: string, action: string) => agentRoster.find((a) => a.id === agent)?.actions.find((x) => x.id === action)?.label

export function ActivityRow({ x, hideAgent, onOpen }: { x: AgentLogEntry; hideAgent?: boolean; onOpen?: () => void }) {
  const body = (
    <>
      <span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-[9px] [&_svg]:size-[18px]", x.outcome === "overridden" && !x.reviewed ? "bg-bad-soft text-bad" : "bg-[#f9e8f7] text-[#a02a94] dark:bg-[#3a1537] dark:text-[#f0a6e6]")}><Bot /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-snug text-foreground">{!hideAgent && <b>{nameOf(x.agent)} · </b>}{x.text}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] text-muted-foreground"><span>{x.target}</span><span>· {ago(x.at)}</span><OutcomeBadge x={x} /></span>
      </span>
    </>
  )
  return (
    <li className="border-b last:border-0">
      {onOpen ? <button type="button" onClick={onOpen} className="flex w-full gap-3 px-5 py-3.5 text-left hover:bg-muted/50 sm:px-6">{body}</button> : <div className="flex gap-3 px-5 py-3.5 sm:px-6">{body}</div>}
    </li>
  )
}

function Detail({ x, onClose }: { x: AgentLogEntry | null; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const roster = agentRoster.find((a) => a.id === x?.agent)
  return (
    <Sheet open={!!x} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 data-[side=right]:sm:max-w-[460px]">
        {x && (
          <>
            <SheetHeader className="border-b px-5 py-4">
              <SheetTitle className="text-[18px]">{nameOf(x.agent)}</SheetTitle>
              <SheetDescription className="text-[14px]">{actionOf(x.agent, x.action)} · {x.target}</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-5 py-5">
              <div>
                <p className="text-[17px] font-semibold text-foreground">{x.text}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3"><OutcomeBadge x={x} /><Confidence value={x.confidence} /></div>
                {x.detail && <p className="mt-3 rounded-[12px] border px-4 py-3 text-[15px] text-foreground">{x.detail}</p>}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-muted-foreground">Evidence it used</p>
                <ul className="mt-1.5 space-y-1.5">{x.evidence.map((e) => <li key={e} className="flex gap-2.5 text-[15px] text-foreground"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />{e}</li>)}</ul>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-[12px] bg-surface-2/60 px-4 py-3 text-[14.5px]">
                <div><dt className="text-muted-foreground">Model</dt><dd className="text-foreground">{modelName(state.agentModels[x.agent] ?? "")}</dd></div>
                <div><dt className="text-muted-foreground">Prompt version</dt><dd className="font-mono text-[13.5px] text-foreground">{roster?.prompt}</dd></div>
                <div><dt className="text-muted-foreground">Cost</dt><dd className="text-foreground">${x.cost.toFixed(2)}</dd></div>
                <div><dt className="text-muted-foreground">Logged as</dt><dd className="font-mono text-[13.5px] text-foreground">{x.id}</dd></div>
              </dl>
              <div className="flex flex-wrap gap-2">
                {x.outcome === "overridden" && !x.reviewed && <Button onClick={() => { dispatch({ type: "aiReview", id: x.id }); toast.success("Marked as reviewed"); onClose() }}><CheckCheck /> Mark as reviewed</Button>}
                <Button variant="outline" onClick={() => { onClose(); go(`/v/agent/${x.agent}`) }}><Settings2 /> Tune this agent</Button>
              </div>
              {x.outcome === "overridden" && <p className="text-[14px] text-muted-foreground">An override isn't a failure: the person had context the agent didn't. If the same kind keeps coming back, lower the action's level or ask the product team to change the prompt.</p>}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

export function AiActivity({ tab }: { tab?: string }) {
  const g = useAgents()
  const [agent, setAgent] = useState("all")
  const [open, setOpen] = useState<string | null>(null)
  const t = tab === "overrides" || tab === "waiting" || tab === "alone" ? tab : "all"
  const base = g.log.filter((x) => agent === "all" || x.agent === agent)
  const rows = t === "overrides" ? base.filter((x) => x.outcome === "overridden") : t === "waiting" ? base.filter((x) => x.outcome === "waiting") : t === "alone" ? base.filter((x) => x.outcome === "alone") : base
  const pick = g.log.find((x) => x.id === open) ?? null
  return (
    <div>
      <PageHeader title="Agent activity" sub="What the agents did, and what people did with it. Each line keeps its evidence, confidence, model, prompt version and cost (R-AG-5)." />
      <PageTabs
        label="Agent activity views"
        value={t}
        onChange={(v) => go(v === "all" ? "/v/activity" : `/v/activity/${v}`)}
        items={[
          { value: "all", label: "Everything", icon: <ListChecks />, count: g.log.length },
          { value: "overrides", label: "Overrides", icon: <CircleSlash />, count: g.overrides.length, tone: "action", hint: "A person decided differently from the agent. Review them to spot a pattern." },
          { value: "waiting", label: "Waiting for a person", icon: <Hourglass />, count: g.waiting.length },
          { value: "alone", label: "Acted alone", icon: <Zap />, hint: "Within its autonomy level. Every one can be reversed." },
        ]}
      />
      <div className="mb-4 max-w-[320px]">
        <Select value={agent} onValueChange={setAgent}>
          <SelectTrigger className="h-11 w-full text-[15.5px]" aria-label="Agent"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Every agent</SelectItem>
            {agentRoster.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Panel bodyClass="p-0 sm:p-0">
        {rows.length === 0 ? <EmptyState title="Nothing here" body={t === "overrides" ? "No overrides for this agent." : undefined} /> : <ul>{rows.map((x) => <ActivityRow key={x.id} x={x} onOpen={() => setOpen(x.id)} />)}</ul>}
      </Panel>
      <Detail x={pick} onClose={() => setOpen(null)} />
    </div>
  )
}
