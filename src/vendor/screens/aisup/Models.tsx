import { useState } from "react"
import { Building2, Check, ShieldCheck, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { date, money } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { agentRoster, estimateCost, initialAgentModels, modelCatalog, modelName, modelProvider } from "@/vendor/agents"

/** Which approved AI model each agent runs on. The AI supervisor chooses; IT approves the provider; the chief is told. */
export function AiModels() {
  const { state, dispatch } = useStore()
  const [pending, setPending] = useState<{ agent: string; model: string } | null>(null)
  const total = agentRoster.reduce((n, a) => n + estimateCost(a.id, state.agentModels[a.id]), 0)
  const p = pending && agentRoster.find((a) => a.id === pending.agent)
  const before = pending ? estimateCost(pending.agent, state.agentModels[pending.agent]) : 0
  const after = pending ? estimateCost(pending.agent, pending.model) : 0
  return (
    <div className="space-y-6">
      <PageHeader title="AI models" sub="Which AI model each agent runs on. The PRM's product team tests every agent on each approved model; IT approves the provider; you choose per agent. Changes take effect on the agent's next action and are logged." />

      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr] [&>*]:min-w-0">
        <Panel title={<span className="flex items-center gap-2"><Building2 className="size-5 text-primary" /> Approved provider</span>}>
          <b className="text-[17px] text-foreground">{modelProvider.name}</b>
          <p className="mt-1 flex gap-2 text-[14.5px] text-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-ok" /> Approved by {modelProvider.approvedBy} on {date(modelProvider.approvedAt)}, as a data processor in the security package.</p>
          <p className="mt-1 text-[14.5px] text-muted-foreground">{modelProvider.dataUse}</p>
          <p className="mt-3 rounded-[12px] border border-dashed px-3 py-2.5 text-[14px] text-muted-foreground">Another provider can be added only after IT reviews it as a data processor (G51).</p>
        </Panel>
        <Panel title="Models you can use" sub="Costs are example figures, per agent action">
          <ul className="grid gap-3 sm:grid-cols-3">
            {modelCatalog.map((m) => {
              const isDefault = state.defaultModel === m.id
              const using = agentRoster.filter((a) => state.agentModels[a.id] === m.id).length
              return (
                <li key={m.id} className={cn("flex flex-col rounded-[12px] border p-3", isDefault && "border-primary/50 bg-brand-soft/30")}>
                  <span className="flex flex-wrap items-center justify-between gap-1"><Badge variant="outline">{m.tier}</Badge>{isDefault && <Badge className="border-0 bg-primary text-primary-foreground">Default</Badge>}</span>
                  <b className="mt-2 text-[15px] text-foreground">{m.name}</b>
                  <span className="text-[13.5px] text-muted-foreground">{m.goodFor}</span>
                  <span className="mt-2 text-[14px] text-foreground tabular">${m.costPerAction.toFixed(2)} per action · {using} {using === 1 ? "agent" : "agents"}</span>
                  {!isDefault && <Button size="sm" variant="ghost" className="mt-auto self-start px-0 pt-2 text-primary hover:bg-transparent" onClick={() => { dispatch({ type: "aiSetDefaultModel", model: m.id }); toast.success(`${m.name} is the default`, { description: "Used by anything the product team adds next. Agents keep their own choice." }) }}>Make default</Button>}
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>

      <Panel title="Model per agent" sub={`Estimated ${money(total)} a month at today's volumes`} bodyClass="px-0 sm:px-0 pb-1">
        <div className="hidden gap-x-4 border-y bg-surface-2/60 px-6 py-3 text-[14px] font-medium text-muted-foreground md:grid md:grid-cols-[minmax(0,1.3fr)_290px_120px]">
          <span>Agent</span><span>Model</span><span className="text-right">Est. per month</span>
        </div>
        <ul>
          {agentRoster.map((a) => {
            const cur = state.agentModels[a.id]
            return (
              <li key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b px-5 py-3 last:border-0 sm:px-6 md:grid-cols-[minmax(0,1.3fr)_290px_120px]">
                <span className="min-w-0"><a href={`#/v/agent/${a.id}`} className="block font-semibold text-foreground hover:text-primary">{a.name}</a><span className="block truncate text-[13.5px] text-muted-foreground">{a.job}{cur !== initialAgentModels[a.id] ? ` · shipped on ${modelName(initialAgentModels[a.id])}` : ""}</span></span>
                <span className="col-span-2 md:order-none md:col-span-1">
                  <Select value={cur} onValueChange={(v) => v !== cur && setPending({ agent: a.id, model: v })}>
                    <SelectTrigger className="h-10 w-full text-[15px]" aria-label={`Model for the ${a.name}`}><SelectValue /></SelectTrigger>
                    <SelectContent>{modelCatalog.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} · {m.tier}</SelectItem>)}</SelectContent>
                  </Select>
                </span>
                <b className="row-start-1 text-right text-foreground tabular md:row-start-auto">{money(estimateCost(a.id, cur))}</b>
              </li>
            )
          })}
        </ul>
      </Panel>
      <p className="flex gap-2 text-[14px] text-muted-foreground"><Sparkles className="mt-0.5 size-4 shrink-0" /> A bigger model can give better judgement but costs more; a smaller one is faster and cheaper. After a change, watch the agent's agreement rate in Agent activity. A side-by-side trial on recent cases isn't designed yet.</p>

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Move the {p?.name} to {pending ? modelName(pending.model) : ""}?</DialogTitle>
            <DialogDescription>It takes effect on the agent's next action. Its autonomy and limits don't change. Dana Ortiz is told, and it's logged.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {[["Today", pending ? state.agentModels[pending.agent] : "", before], ["After", pending?.model ?? "", after]].map(([k, m, c]) => (
              <div key={k as string} className={cn("rounded-[12px] border px-4 py-3", k === "After" && "border-primary/40 bg-brand-soft/30")}>
                <p className="text-[13px] font-semibold text-muted-foreground">{k}</p>
                <p className="font-bold text-foreground">{modelName(m as string)}</p>
                <p className="text-[14px] text-muted-foreground tabular">About {money(c as number)} a month</p>
              </div>
            ))}
          </div>
          <p className="text-[14.5px] text-foreground">{after > before ? `About ${money(after - before)} more a month.` : after < before ? `About ${money(before - after)} less a month.` : "About the same cost."} {modelCatalog.find((m) => m.id === pending?.model)?.goodFor}.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>Cancel</Button>
            <Button onClick={() => { dispatch({ type: "aiSetModel", agent: pending!.agent, model: pending!.model }); toast.success(`${p?.name} now runs on ${modelName(pending!.model)}`, { description: "From its next action. Logged." }); setPending(null) }}><Check /> Switch model</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
