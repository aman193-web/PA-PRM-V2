import { useState } from "react"
import { ArrowRight, CheckCircle2, Clock3, Inbox, Send, Sparkles, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { AddedTag, EmptyState, PageHeader, PageTabs, Panel, SourceTag } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Lead } from "@/data/model"
import { ago, money } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import type { CampaignLead } from "@/partner/marketing"
import { partnerStatus, suggestRep, usePartner } from "@/partner/usePartner"
import { useMarketing } from "@/partner/useMarketing"
import { StageTag } from "@/partner/bits"

function HandOffCard({ l }: { l: CampaignLead }) {
  const { state, dispatch } = useStore()
  const { me } = usePartner()
  const m = useMarketing()
  const campaign = m.campaigns.find((c) => c.id === l.campaignId)
  const reps = state.team.filter((x) => x.role === "Partner sales rep" && x.canRegister && x.status === "active")
  // Same rep suggestion Paul gets on Brightline's leads: past wins in the industry, the product, the region and workload.
  const tip = suggestRep({ ...l, source: campaign?.name ?? "Campaign" } as unknown as Lead, state)
  const [rep, setRep] = useState(tip?.rep ?? reps[0]?.name ?? "")
  const handOff = () => {
    dispatch({ type: "handOffLead", id: l.id, rep, by: me.name })
    toast.success(`${l.company} is with ${rep}`, { description: `${rep.split(" ")[0]} sees it in Leads and can register it in a few taps.` })
  }
  return (
    <li className="rounded-[14px] border bg-card p-5 shadow-[0_1px_2px_#172b4508]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <b className="block text-[18px] text-foreground">{l.company}</b>
          <span className="text-[14.5px] text-muted-foreground">{l.contact}, {l.title} · {l.industry} · {l.region}</span>
        </div>
        <span className="text-right"><b className="block text-[18px] text-foreground tabular">{money(l.estValue)}</b><span className="text-[13px] text-muted-foreground">estimated · {l.product}</span></span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <SourceTag source={`Your campaign: ${campaign?.name ?? ""}`} />
        <span className="text-[14px] text-muted-foreground">{l.activity} · {ago(l.receivedAt)}</span>
      </div>
      {l.status === "returned" && <p className="mt-3 flex gap-2 rounded-[12px] bg-bad-soft/60 px-3 py-2 text-[14.5px] text-foreground"><Undo2 className="mt-0.5 size-4 shrink-0 text-bad" /> {l.assignee} handed it back: "{l.returnReason}"</p>}
      {tip && (
        <div className="mt-4 rounded-[12px] border border-primary/25 bg-brand-soft/30 p-4">
          <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary"><Sparkles className="size-4" /> Suggested rep: {tip.rep}</span><AddedTag short /></div>
          <ul className="mt-2 space-y-1">{tip.reasons.map((r) => <li key={r} className="flex gap-2 text-[14.5px] text-foreground"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{r}</li>)}</ul>
          {tip.caveat && <p className="mt-1.5 text-[13.5px] text-muted-foreground">{tip.caveat}</p>}
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Select value={rep} onValueChange={setRep}>
          <SelectTrigger className="h-11 min-w-[220px] text-[15px]" aria-label="Rep"><SelectValue /></SelectTrigger>
          <SelectContent>{reps.map((r) => <SelectItem key={r.id} value={r.name}>{r.name}{r.name === tip?.rep ? " · suggested" : ""}</SelectItem>)}</SelectContent>
        </Select>
        <Button size="lg" onClick={handOff} disabled={!rep}><Send /> Hand to {rep.split(" ")[0]}</Button>
      </div>
    </li>
  )
}

export function CampaignLeads({ tab }: { tab?: string }) {
  const { state } = useStore()
  const m = useMarketing()
  const t = tab ?? (m.toHandOff.length ? "handoff" : "reps")
  const reg = (l: CampaignLead) => state.registrations.find((r) => r.id === l.registrationId)
  return (
    <div>
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">Leads from your campaigns <StageTag /></span>}
        sub="People who came in through your tracked links. Ridgeway keeps them: Brightline doesn't see a lead until a rep registers the deal. Hand each one to the right rep."
      />
      <PageTabs
        label="Lead views"
        value={t}
        onChange={(v) => go(`/p/leads/${v}`)}
        items={[
          { value: "handoff", label: "To hand off", icon: <Inbox />, count: m.toHandOff.length, tone: m.toHandOff.length ? "action" : "neutral" },
          { value: "reps", label: "With reps", icon: <Clock3 />, count: m.withReps.length },
          { value: "deals", label: "Became deals", icon: <CheckCircle2 />, count: m.converted.length },
        ]}
      />
      {t === "handoff" && (m.toHandOff.length ? <ul className="grid gap-4">{m.toHandOff.map((l) => <HandOffCard key={l.id} l={l} />)}</ul> : (
        <Panel><EmptyState icon={<Inbox className="size-6" />} title="Every lead has a rep" body="New leads from your tracked links show up here." action={<Button variant="outline" onClick={() => go("/p/campaigns")}>Your campaigns <ArrowRight /></Button>} /></Panel>
      ))}
      {t === "reps" && (
        <Panel bodyClass="p-0 sm:p-0">
          {m.withReps.length ? (
            <ul>{m.withReps.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-3 border-b px-5 py-4 last:border-0 sm:px-6">
                <span className="grid size-9 place-items-center rounded-full bg-brand-soft text-[13px] font-bold text-primary">{l.assignee!.split(" ").map((x) => x[0]).join("")}</span>
                <span className="min-w-0 flex-1"><b className="block text-foreground">{l.company}</b><span className="text-[14px] text-muted-foreground">With {l.assignee} since {ago(l.handedAt!)} · about {money(l.estValue)}</span></span>
                <Badge variant="secondary">Working it</Badge>
              </li>
            ))}</ul>
          ) : <EmptyState title="Nothing with reps" body="Leads you hand off show here until they become deals." />}
        </Panel>
      )}
      {t === "deals" && (
        <Panel bodyClass="p-0 sm:p-0">
          {m.converted.length ? (
            <ul>{m.converted.map((l) => {
              const r = reg(l)
              return (
                <li key={l.id} className="flex flex-wrap items-center gap-3 border-b px-5 py-4 last:border-0 sm:px-6">
                  <span className="grid size-9 place-items-center rounded-full bg-ok-soft text-ok"><CheckCircle2 className="size-5" /></span>
                  <span className="min-w-0 flex-1"><b className="block text-foreground">{l.company}</b><span className="text-[14px] text-muted-foreground">Registered by {l.assignee}{r ? ` · ${money(r.value)}` : ""}</span></span>
                  {r && <Badge className={cn("border-0", partnerStatus(r).cls)}>{partnerStatus(r).label}</Badge>}
                </li>
              )
            })}</ul>
          ) : <EmptyState title="No deals yet" body="When a rep registers one of your leads, it shows here and counts toward your campaign's pipeline." />}
        </Panel>
      )}
    </div>
  )
}
