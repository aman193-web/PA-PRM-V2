import { useState } from "react"
import { ArrowRight, Check, ChevronRight, Coins, Inbox, Scale, ShieldAlert, X } from "lucide-react"
import { toast } from "sonner"
import { DecisionOption, EmptyState, PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { PartnerRole } from "@/data/model"
import { ago, date, money } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { budget } from "@/chief/data"
import { AiCard, Decide, Facts } from "@/chief/screens/Approvals"
import { modelProposal, modelVersions, rewardDetail, rewardLimit, type ExecApproval } from "@/vendor/data"
import { partnerNameOf, useExec } from "@/vendor/useVendor"

const icon = { model: <Scale />, reward: <Coins /> }

export function ExecStatus({ x }: { x: ExecApproval }) {
  if (x.status === "approved") return <Badge className="border-0 bg-ok-soft text-ok">Approved</Badge>
  if (x.status === "declined") return <Badge className="border-0 bg-bad-soft text-bad">Declined</Badge>
  return <Badge className="border-0 bg-amber-soft text-amber-ink">Waiting for you</Badge>
}

export function ExecApprovalRow({ x, compact }: { x: ExecApproval; compact?: boolean }) {
  return (
    <li className="border-b last:border-0">
      <a href={`#/v/approval/${x.id}`} className={cn("grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-5 py-4 hover:bg-muted/50 sm:px-6", !compact && "md:grid-cols-[40px_minmax(0,1fr)_120px_140px_20px]")}>
        <span className={cn("grid size-10 place-items-center rounded-[10px] [&_svg]:size-5", x.kind === "model" ? "bg-brand-soft text-primary" : "bg-amber-soft text-amber-ink")}>{icon[x.kind]}</span>
        <span className="min-w-0"><b className={cn("block text-[16px] leading-snug text-foreground", !compact && "md:truncate")}>{x.title}</b><span className={cn("block text-[14px] text-muted-foreground", !compact && "truncate")}>{compact && x.amount ? `${money(x.amount)} · ` : ""}{x.sub} · from {x.from} · {ago(x.at)}</span></span>
        {!compact && <span className="hidden text-right text-[16px] font-semibold text-foreground tabular md:block">{x.amount ? money(x.amount) : "—"}</span>}
        <span className={cn("justify-self-end", !compact && "md:justify-self-start")}><ExecStatus x={x} /></span>
        {!compact && <ChevronRight className="hidden size-5 text-muted-foreground md:block" />}
      </a>
    </li>
  )
}

export function ExecApprovals() {
  const { state } = useStore()
  const pending = state.execApprovals.filter((x) => x.status === "pending")
  const done = state.execApprovals.filter((x) => x.status !== "pending")
  return (
    <div className="space-y-6">
      <PageHeader title="Approvals" sub={`What only the CFO can approve: new attribution model versions, and rewards over ${money(rewardLimit)}. The channel chief reviews them first, then sends them to you.`} />
      <Panel title="Waiting for you" bodyClass="px-0 sm:px-0 pb-1">
        {pending.length === 0 ? <EmptyState icon={<Inbox className="size-6" />} title="Nothing waiting" body="New requests from Dana Ortiz show up here and in your notifications." /> : <ul>{pending.map((x) => <ExecApprovalRow key={x.id} x={x} />)}</ul>}
      </Panel>
      {done.length > 0 && <Panel title="Decided" bodyClass="px-0 sm:px-0 pb-1"><ul>{done.map((x) => <ExecApprovalRow key={x.id} x={x} />)}</ul></Panel>}
    </div>
  )
}

function Decision({ x, approveLabel, approveSub }: { x: ExecApproval; approveLabel: string; approveSub: string }) {
  const { dispatch } = useStore()
  const [choice, setChoice] = useState<"approve" | "decline" | null>(null)
  const [note, setNote] = useState("")
  if (x.status !== "pending")
    return (
      <Panel title="Your decision" className="xl:sticky xl:top-[92px]">
        <ExecStatus x={x} />
        <p className="mt-2 text-[15.5px] text-foreground">{x.status === "approved" ? approveSub : "Nothing changes."}{x.note ? ` "${x.note}"` : ""}</p>
        <p className="mt-1 text-[14px] text-muted-foreground">{x.decidedAt ? date(x.decidedAt) : ""} · Dana Ortiz was told.</p>
        <Button variant="outline" className="mt-4" onClick={() => go("/v/approvals")}>Back to approvals</Button>
      </Panel>
    )
  const submit = () => {
    dispatch({ type: "execDecide", id: x.id, approve: choice === "approve", note: note.trim() || undefined })
    toast.success(choice === "approve" ? `${x.title}: approved` : `${x.title}: declined`, { description: "Dana Ortiz is told now." })
    go("/v/approvals")
  }
  return (
    <Decide ready={!!choice && (choice === "approve" || note.trim().length > 2)} tone={choice === "approve" ? "ok" : choice === "decline" ? "bad" : null} label={choice === "approve" ? approveLabel : choice === "decline" ? "Decline with reason" : "Choose an option"} onSubmit={submit}>
      <DecisionOption active={choice === "approve"} tone="ok" onClick={() => setChoice("approve")} icon={<Check />} label="Approve" sub={approveSub} />
      <DecisionOption active={choice === "decline"} tone="bad" onClick={() => setChoice("decline")} icon={<X />} label="Decline" sub="Nothing changes; Dana sees your reason" />
      {choice && <Textarea value={note} onChange={(ev) => setNote(ev.target.value)} rows={3} className="text-[15.5px]" placeholder={choice === "decline" ? "Why? Dana sees this." : "Optional note"} />}
    </Decide>
  )
}

function ModelApproval({ x }: { x: ExecApproval }) {
  const e = useExec()
  const v2 = modelVersions.find((m) => m.version === 2)!
  const roles = Object.keys(v2.weights!) as PartnerRole[]
  const total = (k: "won" | "open") => e.impact.reduce((n, i) => n + Math.abs(i[k]), 0) / 2
  return (
    <div>
      <PageHeader back={{ label: "Approvals", href: "/v/approvals" }} title={<span className="flex flex-wrap items-center gap-3">{x.title} <ExecStatus x={x} /></span>} sub={<>Attribution model · from {x.from} ({x.fromRole}) · {ago(x.at)}</>} />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title="What changes" sub={`From ${date(modelProposal.from)}. Every period before that keeps version 2; nothing is recalculated backwards.`}>
            <div className="overflow-hidden rounded-[12px] border">
              <div className="grid grid-cols-[1fr_80px_80px] bg-surface-2/60 px-4 py-2.5 text-[13.5px] font-medium text-muted-foreground"><span>Partner role</span><span className="text-right">Now (v2)</span><span className="text-right">v3</span></div>
              {roles.map((r) => {
                const a = v2.weights![r]
                const b = modelProposal.weights[r]
                return (
                  <div key={r} className="grid grid-cols-[1fr_80px_80px] border-t px-4 py-2.5 text-[15px]">
                    <span className="text-foreground">{r}</span><span className="text-right text-muted-foreground tabular">{a}</span>
                    <b className={cn("text-right tabular", b > a ? "text-ok" : b < a ? "text-bad" : "text-foreground")}>{b}</b>
                  </div>
                )
              })}
            </div>
          </Panel>
          <Panel title="Why" sub={`From ${x.from}`}><p className="text-[16px] text-foreground">{modelProposal.why}</p></Panel>
          <Panel title="Had it applied this year" sub={`${e.dealsChanged} multi-partner deals split by the model. Approved overrides are left as they are.`}>
            <div className="overflow-hidden rounded-[12px] border">
              <div className="grid grid-cols-[1fr_120px_120px] bg-surface-2/60 px-4 py-2.5 text-[13.5px] font-medium text-muted-foreground"><span>Partner</span><span className="text-right">Closed-won</span><span className="text-right">Open pipeline</span></div>
              {e.impact.map((i) => (
                <div key={i.partnerId} className="grid grid-cols-[1fr_120px_120px] border-t px-4 py-2.5 text-[15px]">
                  <span className="truncate text-foreground">{i.name}</span>
                  {(["won", "open"] as const).map((k) => <b key={k} className={cn("text-right tabular", i[k] > 0 ? "text-ok" : i[k] < 0 ? "text-bad" : "text-muted-foreground")}>{i[k] ? `${i[k] > 0 ? "+" : "−"}${money(Math.abs(i[k]))}` : "—"}</b>)}
                </div>
              ))}
            </div>
            <p className="mt-3 text-[14px] text-muted-foreground">{money(total("won"))} of closed-won credit and {money(total("open"))} of open pipeline credit would move between partners. Brightline's total revenue doesn't change; only who gets credit for it.</p>
          </Panel>
          <AiCard who="Attribution agent" headline="Approve: it matches how partner managers already override" confidence={0.84} evidence={["Brookside Bank: version 3 gives Atlas 55%, exactly the override Jordan Lee proposed", "Pinecrest Utilities: Northpeak's implementation share would rise from 40% to 50%", "Starts on a period boundary (Jan 1), so no report changes after the fact"]} />
        </div>
        <Decision x={x} approveLabel="Approve version 3" approveSub={`Version 3 applies from ${date(modelProposal.from)}. Version 2 stays for 2026 reports`} />
      </div>
    </div>
  )
}

function RewardApproval({ x }: { x: ExecApproval }) {
  const { state } = useStore()
  const d = rewardDetail[x.id]
  const line = budget.lines.find((l) => l.label === d.budgetLine)
  const p = state.partners.find((y) => y.id === x.partnerId)
  return (
    <div>
      <PageHeader back={{ label: "Approvals", href: "/v/approvals" }} title={<span className="flex flex-wrap items-center gap-3">{x.title} <ExecStatus x={x} /></span>} sub={<>Reward over {money(rewardLimit)} · from {x.from} ({x.fromRole}), who approved it first · {ago(x.at)}</>} />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title="What it pays">
            <Facts rows={[
              ["Amount", money(x.amount ?? 0)], ["Partner", `${partnerNameOf(state, x.partnerId ?? "")} · ${p?.tier} ${p?.program.toLowerCase()}`],
              ["Basis", `${Math.round(d.rate * 100)}% of ${money(d.revenue)} verified revenue`], ["Paid from", `${d.budgetLine}: ${money(line?.amount ?? 0)} spent so far this year`],
            ]} />
            <p className="mt-4 text-[15px] text-muted-foreground">{d.basis}</p>
          </Panel>
          <AiCard who="Program agent" headline="Approve: the revenue it's based on is verified" confidence={0.9} evidence={d.evidence} />
          <p className="flex gap-2 rounded-[12px] bg-amber-soft/60 px-4 py-3 text-[15px] text-foreground"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-ink" /> Money always needs a person (R-APR-4). Rewards over {money(rewardLimit)} need the CFO as well as the channel chief: a proposed rule, not in the documents yet.</p>
        </div>
        <Decision x={x} approveLabel={`Approve ${money(x.amount ?? 0)}`} approveSub="Paid with the next partner payment run, after year-end reconciliation" />
      </div>
    </div>
  )
}

export function ExecApprovalDetail({ id = "" }: { id?: string }) {
  const { state } = useStore()
  const x = state.execApprovals.find((y) => y.id === id)
  if (!x) return <div><PageHeader title="Approval" back={{ label: "Approvals", href: "/v/approvals" }} /><Panel><EmptyState title="We couldn't find it" action={<Button variant="outline" onClick={() => go("/v/approvals")}>Back <ArrowRight /></Button>} /></Panel></div>
  return x.kind === "model" ? <ModelApproval x={x} /> : <RewardApproval x={x} />
}
