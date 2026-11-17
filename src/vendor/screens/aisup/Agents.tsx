import { useState } from "react"
import { ArrowRight, Ban, Cpu, Hourglass, Lock, Pause, Play, Power, Send, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { EmptyState, PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { NOW, ago, money } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { agents as chiefAgents, autonomyLevels, type ChangeRequest } from "@/chief/data"
import { levelIndex, levels, type AgentLogEntry, type Level } from "@/vendor/agents"
import { useAgents, type LiveAction, type LiveAgent } from "@/vendor/useVendor"
import { ActivityRow } from "@/vendor/screens/aisup/Activity"

export const levelLabel = (l: string) => autonomyLevels.find((x) => x.id === l)?.label ?? l

export function OutcomeBadge({ x }: { x: AgentLogEntry }) {
  if (x.outcome === "alone") return <Badge className="border-0 bg-secondary text-foreground">Acted alone</Badge>
  if (x.outcome === "waiting") return <Badge className="border-0 bg-brand-soft text-primary">Waiting for {x.who ?? "a person"}</Badge>
  if (x.outcome === "agreed") return <Badge className="border-0 bg-ok-soft text-ok">{x.who} agreed</Badge>
  if (x.outcome === "edited") return <Badge className="border-0 bg-amber-soft text-amber-ink">{x.who} edited it</Badge>
  return <Badge className="border-0 bg-bad-soft text-bad">{x.who} overrode it{x.reviewed ? " · reviewed" : ""}</Badge>
}

export function AgentStatus({ a }: { a: LiveAgent }) {
  const { state } = useStore()
  if (state.agentLayerPaused) return <Badge className="border-0 bg-bad-soft text-bad">Paused · kill switch</Badge>
  if (a.pausedSelf) return <Badge className="border-0 bg-amber-soft text-amber-ink">Paused</Badge>
  return <Badge className="border-0 bg-ok-soft text-ok">Running</Badge>
}

/** A0–A4 for one action: filled up to the current level, locked above its cap. */
function LevelSteps({ x, onPick, disabled }: { x: LiveAction; onPick?: (l: Level) => void; disabled?: boolean }) {
  if (x.never) return <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[13px] font-semibold text-foreground"><Ban className="size-3.5" /> Never</span>
  const cur = levelIndex(x.now)
  const cap = levelIndex(x.cap)
  return (
    <ol className="grid w-full max-w-[300px] grid-cols-5 gap-1">
      {levels.map((l, i) => {
        const locked = i > cap
        const pendingHere = x.pending?.level === l
        const cls = i === cur ? "bg-primary text-primary-foreground" : pendingHere ? "border-2 border-dashed border-primary bg-card text-primary" : i < cur ? "bg-brand-soft text-primary" : "bg-muted text-muted-foreground"
        return (
          <li key={l}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  disabled={disabled || locked || i === cur || !onPick || (!!x.pending && i > cur)}
                  onClick={() => onPick?.(l)}
                  aria-label={`${l} ${levelLabel(l)}${locked ? ", not allowed" : ""}${i === cur ? ", current" : ""}`}
                  className={cn("flex h-8 w-full items-center justify-center gap-0.5 rounded-[8px] text-[12.5px] font-semibold transition", cls, locked && "cursor-not-allowed opacity-50", onPick && !locked && i !== cur && !disabled && "hover:ring-2 hover:ring-primary/40")}
                >
                  {locked ? <Lock className="size-3" /> : null}{l}
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[280px] text-[13.5px] leading-snug">
                <div className="block">
                  <p className="font-semibold">{l} · {levelLabel(l)}{i === cur ? " (now)" : pendingHere ? " (asked for)" : ""}</p>
                  <p className="mt-1">{autonomyLevels.find((y) => y.id === l)?.means}</p>
                  {locked && <p className="mt-2 font-semibold">Not allowed: {x.capWhy ?? "above this action's limit"}</p>}
                </div>
              </TooltipContent>
            </Tooltip>
          </li>
        )
      })}
    </ol>
  )
}

/** The kill switch (R-AG-3): every agent stops within seconds; people take over their work. */
export function KillSwitch() {
  const { state, dispatch } = useStore()
  const [open, setOpen] = useState(false)
  const paused = state.agentLayerPaused
  const flip = () => {
    dispatch({ type: "aiPauseAll" })
    toast[paused ? "success" : "warning"](paused ? "Every agent is back on" : "Every agent is paused", { description: paused ? "They pick up where they stopped." : "Partner managers and Dana Ortiz are told. The rules still approve clean deals." })
    setOpen(false)
  }
  return (
    <>
      <Panel className={cn(paused && "border-bad/50 bg-bad-soft/30")}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="flex min-w-0 gap-3">
            <span className={cn("grid size-11 shrink-0 place-items-center rounded-[12px]", paused ? "bg-bad text-white" : "bg-bad-soft text-bad")}><Power className="size-5" /></span>
            <span><b className="block text-[16.5px] text-foreground">{paused ? "Every agent is paused" : "Kill switch"}</b><span className="text-[14.5px] text-muted-foreground">{paused ? "People are doing the agents' work by hand. Nothing is lost; everything resumes where it stopped." : "Stops every agent within seconds (R-AG-3). Use it if agents misbehave; you can pause one agent or one action instead."}</span></span>
          </span>
          <Button size="lg" className={paused ? "" : "bg-bad text-white hover:bg-bad/90"} onClick={() => (paused ? flip() : setOpen(true))}>{paused ? <><Play /> Turn agents back on</> : <><Power /> Pause every agent</>}</Button>
        </div>
      </Panel>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Pause every agent?</DialogTitle>
            <DialogDescription>All nine agents stop within seconds. Partner managers decide every registration by hand, reminders stop and nothing is prefilled. The rules still approve clean deals. Jordan Lee and Dana Ortiz are told.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="bg-bad text-white hover:bg-bad/90" onClick={flip}><Power /> Pause every agent</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function AiAgents() {
  const g = useAgents()
  return (
    <div className="space-y-6">
      <PageHeader title="Agents" sub="The nine agents in the BRD. Lowering what an agent may do takes effect now; raising it goes to Dana Ortiz. Money, contracts, access, export, demotion and termination always need a person (R-AG-2)." />
      <KillSwitch />
      <ul className="grid gap-4 lg:grid-cols-2">
        {g.roster.map((a) => {
          const head = a.actions.find((x) => x.id === a.headline)!
          return (
            <li key={a.id}>
              <a href={`#/v/agent/${a.id}`} className={cn("flex h-full flex-col rounded-[14px] border bg-card p-5 shadow-[0_1px_2px_#172b4508] transition hover:border-primary/60", a.paused && "border-amber/60")}>
                <span className="flex flex-wrap items-start justify-between gap-2">
                  <span className="min-w-0"><b className="block text-[16.5px] text-foreground">{a.name}</b><span className="text-[14px] text-muted-foreground">{a.job}</span></span>
                  <span className="flex shrink-0 items-center gap-1.5"><Badge variant="outline" className="font-mono">{a.stage}</Badge><AgentStatus a={a} /></span>
                </span>
                <span className="mt-3 text-[14px] text-muted-foreground">{head.label}</span>
                <span className={cn("mt-1.5", a.paused && "opacity-50")}><LevelSteps x={head} /></span>
                <span className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-muted-foreground">
                  <span><b className="text-foreground tabular">{a.month.actions.toLocaleString("en-US")}</b> actions</span>
                  {a.month.rate !== undefined && <span><b className="text-foreground tabular">{Math.round(a.month.rate * 100)}%</b> {a.month.rateLabel}</span>}
                  <span><b className="text-foreground tabular">{money(a.month.cost)}</b> this month</span>
                </span>
                {a.pending.length > 0 && <span className="mt-2 inline-flex items-center gap-1.5 text-[14px] font-medium text-primary"><Hourglass className="size-4" /> {a.pending.length === 1 ? "A change is" : `${a.pending.length} changes are`} waiting for Dana</span>}
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Lower now, or ask the channel chief to raise it. */
function ChangeDialog({ a, x, to, onClose }: { a: LiveAgent; x: LiveAction; to: Level; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const raise = levelIndex(to) > levelIndex(x.now)
  const rate = a.month.rate !== undefined ? `${Math.round(a.month.rate * 100)}% ${a.month.rateLabel}` : "no overrides"
  const [why, setWhy] = useState(raise ? `Over the last 30 days the ${a.name} took ${a.month.actions.toLocaleString("en-US")} actions, with ${rate}. ` : "")
  const agentSpecific = a.headline === x.id ? (chiefAgents.find((c) => c.id === a.id)?.at as Record<string, string> | undefined)?.[to] : undefined
  const submit = () => {
    if (!raise) {
      dispatch({ type: "aiSetLevel", agent: a.id, action: x.id, level: to })
      toast.success(`Lowered to ${to} · ${levelLabel(to)}`, { description: "In effect now, in every program. Dana Ortiz is told." })
    } else {
      const req: ChangeRequest = {
        id: `CR-${21 + state.requests.length}`, kind: "autonomy", title: `${a.name}: ${x.label.charAt(0).toLowerCase()}${x.label.slice(1)} at ${to}`, programs: "all",
        from: "Lee Park", fromRole: "AI supervisor", at: NOW.toISOString(),
        current: `${x.now} · ${levelLabel(x.now)}`, proposed: `${to} · ${levelLabel(to)}`, why: why.trim(),
        impact: [agentSpecific ?? `${autonomyLevels.find((l) => l.id === to)?.means}`, "Every action stays logged and can be reversed", "Lee Park or you can pause it in one click"],
        guardrail: "Money, contracts, access, data export, tier demotion and partner termination always need a person (R-AG-2).",
        status: "pending", agent: a.id, action: x.id, level: to,
      }
      dispatch({ type: "aiRequest", req })
      toast.success("Sent to Dana Ortiz", { description: "It stays at its current level until it's approved." })
    }
    onClose()
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{raise ? `Ask Dana to raise it to ${to}?` : `Lower it to ${to} now?`}</DialogTitle>
          <DialogDescription>{a.name} · {x.label}. {raise ? "Raising autonomy needs the channel chief (R-AG-1). Nothing changes until it's approved." : "Lowering takes effect straight away, in every program. Dana Ortiz and the partner managers are told."}</DialogDescription>
        </DialogHeader>
        <div className="rounded-[12px] border px-4 py-3 text-[15px]">
          <p className="text-muted-foreground">{x.now} · {levelLabel(x.now)} → <b className="text-foreground">{to} · {levelLabel(to)}</b></p>
          <p className="mt-1 text-foreground">{agentSpecific ?? autonomyLevels.find((l) => l.id === to)?.means}</p>
        </div>
        {raise && (
          <div className="grid gap-1.5">
            <Label htmlFor="why" className="text-[15px]">Why</Label>
            <Textarea id="why" value={why} onChange={(e) => setWhy(e.target.value)} rows={3} className="text-[15.5px]" placeholder="What the agent's record shows. Dana reads this first." />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={raise && !why.trim()} onClick={submit}>{raise ? <><Send /> Send to Dana</> : "Lower now"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AgentDetail({ id = "" }: { id?: string }) {
  const { state, dispatch } = useStore()
  const g = useAgents()
  const a = g.roster.find((x) => x.id === id)
  const [change, setChange] = useState<{ x: LiveAction; to: Level } | null>(null)
  if (!a) return <div><PageHeader title="Agent" back={{ label: "Agents", href: "/v/agents" }} /><Panel><EmptyState title="We couldn't find that agent" /></Panel></div>
  const log = g.log.filter((x) => x.agent === a.id)
  const decided = state.requests.filter((r) => r.kind === "autonomy" && (r.agent ?? "deal-desk") === a.id && r.status !== "pending")
  return (
    <div>
      <PageHeader
        back={{ label: "Agents", href: "/v/agents" }}
        title={<span className="flex flex-wrap items-center gap-3">{a.name} <AgentStatus a={a} /></span>}
        sub={<>{a.job} · Stage {a.stage} · {a.model}, prompt {a.prompt}</>}
        actions={!state.agentLayerPaused && <Button size="lg" variant={a.pausedSelf ? "default" : "outline"} onClick={() => { dispatch({ type: "toggleAgent", id: a.id, by: "Lee Park" }); toast(a.pausedSelf ? `${a.name} resumed` : `${a.name} paused`, { description: a.pausedSelf ? "It picks up where it stopped." : "It stops now. People take over its work until you resume it." }) }}>{a.pausedSelf ? <><Play /> Resume</> : <><Pause /> Pause this agent</>}</Button>}
      />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <div className="space-y-6">
          <Panel title={<span className="flex items-center gap-2"><Cpu className="size-5 text-primary" /> What it may do</span>} sub="Per action, in every program. Click a lower level to lower it now; a higher one asks Dana." bodyClass="px-0 sm:px-0 pb-1">
            <ul>
              {a.actions.map((x) => (
                <li key={x.id} className={cn("border-t px-5 py-4 sm:px-6", x.paused && "bg-amber-soft/30")}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span className="min-w-0 flex-1 basis-56">
                      <b className="flex flex-wrap items-center gap-2 text-[15.5px] text-foreground">{x.label}{x.id === a.headline && <Badge variant="outline">Main action</Badge>}{x.paused && <Badge className="border-0 bg-amber-soft text-amber-ink">Paused</Badge>}</b>
                      <span className="text-[14px] text-muted-foreground">{x.never ? x.capWhy : `Now ${x.now} · ${levelLabel(x.now)}${x.cap !== "A4" ? ` · can't go above ${x.cap}` : ""}`}</span>
                    </span>
                    {!x.never && !state.agentLayerPaused && !a.pausedSelf && (
                      <Button size="sm" variant="ghost" onClick={() => dispatch({ type: "aiPauseAction", key: x.key })}>{x.paused ? <><Play /> Resume</> : <><Pause /> Pause</>}</Button>
                    )}
                  </div>
                  <div className={cn("mt-2.5", (x.paused || a.paused) && "opacity-60")}>
                    <LevelSteps x={x} onPick={(to) => setChange({ x, to })} disabled={a.paused} />
                  </div>
                  {x.cap !== "A4" && !x.never && <p className="mt-2 flex gap-1.5 text-[13.5px] text-muted-foreground"><Lock className="mt-0.5 size-3.5 shrink-0" /> {x.capWhy}</p>}
                  {x.pending && <p className="mt-2 flex gap-1.5 text-[14px] font-medium text-primary"><Hourglass className="mt-0.5 size-4 shrink-0" /> {x.pending.level} is waiting for Dana Ortiz · asked {ago(x.pending.at)}</p>}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Recent actions" action={<Button variant="ghost" onClick={() => go("/v/activity")}>All <ArrowRight /></Button>} bodyClass="px-0 sm:px-0 pb-1">
            {log.length === 0 ? <p className="px-6 pb-4 text-muted-foreground">Nothing in the last week.</p> : <ul>{log.slice(0, 5).map((x) => <ActivityRow key={x.id} x={x} hideAgent />)}</ul>}
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Last 30 days">
            <dl className="grid grid-cols-2 gap-4">
              <div><dt className="text-[14px] text-muted-foreground">Actions</dt><dd className="text-[24px] font-bold text-foreground tabular">{a.month.actions.toLocaleString("en-US")}</dd></div>
              <div><dt className="text-[14px] text-muted-foreground">Cost</dt><dd className="text-[24px] font-bold text-foreground tabular">{money(a.month.cost)}</dd></div>
              {a.month.rate !== undefined && <div><dt className="text-[14px] text-muted-foreground capitalize">{a.month.rateLabel}</dt><dd className="text-[24px] font-bold text-foreground tabular">{Math.round(a.month.rate * 100)}%</dd></div>}
              <div><dt className="text-[14px] text-muted-foreground capitalize">{a.month.overrideLabel ?? "Overridden"}</dt><dd className="text-[24px] font-bold text-foreground tabular">{a.month.overrides}</dd></div>
            </dl>
          </Panel>
          {decided.length > 0 && (
            <Panel title="Decided by Dana">
              <ul className="space-y-2.5">{decided.map((r) => <li key={r.id}><b className="block text-[15px] text-foreground">{r.title}</b><span className="text-[13.5px] text-muted-foreground">{r.status === "approved" ? "Approved" : "Declined"}{r.note ? `: "${r.note}"` : ""}</span></li>)}</ul>
            </Panel>
          )}
          <p className="flex gap-2 rounded-[12px] bg-amber-soft/60 px-4 py-3 text-[15px] text-foreground"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-ink" /> Agents act with the permissions of the person they work for, never their own (R-AG-4). Every action is logged with its evidence, confidence and cost (R-AG-5).</p>
        </div>
      </div>
      {change && <ChangeDialog a={a} x={change.x} to={change.to} onClose={() => setChange(null)} />}
    </div>
  )
}
