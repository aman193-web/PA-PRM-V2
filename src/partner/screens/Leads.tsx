import { useState } from "react"
import { ArrowRight, Building2, Check, CheckCircle2, Clock3, Inbox, Lock, MapPin, Megaphone, Send, Sparkles, Undo2, UserRound, X } from "lucide-react"
import { toast } from "sonner"
import { AddedTag, EmptyState, PageHeader, PageTabs, Panel, SourceTag } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Lead } from "@/data/model"
import { ago, hoursLeft, money, shortDate } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { leadLeft, suggestRep, usePartner, usePartnerData } from "@/partner/usePartner"
import { StageTag } from "@/partner/bits"
import type { CampaignLead } from "@/partner/marketing"
import { useTeamCampaignLeads } from "@/partner/useMarketing"

const declineReasons = ["No capacity this quarter", "Outside our territory", "Not a fit for our services", "We already know this customer"]

function Facts({ l, revealed }: { l: Lead; revealed: boolean }) {
  return (
    <dl className="mt-3 grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-2">
      <div className="flex items-center gap-2"><Building2 className="size-4 text-muted-foreground" /><dt className="sr-only">Industry</dt><dd>{l.industry} · {l.product}</dd></div>
      <div className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" /><dt className="sr-only">Region</dt><dd>{l.region}</dd></div>
      <div className="flex items-center gap-2 sm:col-span-2">
        <UserRound className="size-4 text-muted-foreground" />
        <dt className="sr-only">Contact</dt>
        {revealed ? <dd className="text-foreground">{l.contact}, {l.title}</dd> : <dd className="inline-flex items-center gap-1.5 text-muted-foreground"><Lock className="size-3.5" /> Contact details unlock when you accept</dd>}
      </div>
    </dl>
  )
}

function OfferCard({ l }: { l: Lead }) {
  const { state, dispatch } = useStore()
  const { me, isExec } = usePartner()
  const reps = state.team.filter((m) => m.canRegister && m.status === "active")
  const pick = isExec ? suggestRep(l, state) : null
  const [assignee, setAssignee] = useState(l.assignee ?? pick?.rep ?? reps.find((m) => m.name !== me.name)?.name ?? me.name)
  const [declining, setDeclining] = useState(false)
  const [reason, setReason] = useState(declineReasons[0])
  const left = leadLeft(l)
  const pct = Math.max(4, Math.min(100, Math.round((left / 48) * 100)))
  return (
    <li className="rounded-[14px] border bg-card p-4 shadow-[0_1px_2px_#172b4508] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <b className="block text-[18px] text-foreground">{l.company}</b>
          <span className="text-[14.5px] text-muted-foreground">Sent {shortDate(l.sentAt!)} · about <b className="text-foreground">{money(l.estValue)}</b></span>
          <SourceTag source={l.source} className="mt-1.5 flex w-fit" />
        </div>
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[14px] font-semibold", left < 12 ? "bg-bad-soft text-bad" : "bg-amber-soft text-amber-ink")}><Clock3 className="size-4" /> {hoursLeft(left)}</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", left < 12 ? "bg-bad" : "bg-amber")} style={{ width: `${pct}%` }} /></div>
      <Facts l={l} revealed={false} />
      {l.suggestion && <p className="mt-3 flex gap-2 rounded-[10px] bg-brand-soft/50 px-3 py-2 text-[14.5px] text-foreground"><Sparkles className="mt-0.5 size-4 shrink-0 text-primary" /> Why Ridgeway: {l.suggestion.why}</p>}
      {pick && (
        <div className="mt-2 rounded-[10px] border border-primary/25 px-3 py-2.5 text-[14.5px] text-foreground">
          <p className="flex flex-wrap items-center gap-2">
            <Sparkles className="size-4 shrink-0 text-primary" />
            {l.assignee && l.assignee !== pick.rep
              ? <span>Sent to {l.assignee} by name. <b>{pick.rep}</b> may be a better fit:</span>
              : <span>Suggested rep: <b>{pick.rep}</b></span>}
            <AddedTag short className="ml-auto" />
          </p>
          <ul className="mt-1.5 space-y-0.5 pl-6">
            {pick.reasons.map((x) => <li key={x} className="list-disc">{x}</li>)}
            {pick.caveat && <li className="list-disc text-muted-foreground">{pick.caveat}</li>}
          </ul>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-end gap-3 border-t pt-4">
        {isExec && (
          <div className="grid min-w-52 flex-1 gap-1.5 sm:flex-none">
            <Label className="text-[14px]">Give it to</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger className="h-11 bg-card text-[15.5px]"><SelectValue /></SelectTrigger>
              <SelectContent>{reps.map((m) => <SelectItem key={m.id} value={m.name}>{m.name}{m.name === me.name ? " (you)" : ""}{pick?.rep === m.name ? " · suggested" : ""}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
        <Button size="lg" onClick={() => {
          dispatch({ type: "leadAccept", id: l.id, assignee: isExec ? assignee : me.name, by: me.name })
          toast.success(`Accepted ${l.company}`, { description: isExec && assignee !== me.name ? `${assignee} is the owner and has been notified. Jordan Lee sees it as accepted.` : "Contact details are unlocked. Jordan Lee sees it as accepted." })
        }}><Check /> {isExec ? "Accept and assign" : "Accept lead"}</Button>
        <Button size="lg" variant="outline" onClick={() => setDeclining(true)}><X /> Decline</Button>
      </div>
      <Dialog open={declining} onOpenChange={setDeclining}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline {l.company}?</DialogTitle>
            <DialogDescription>Jordan Lee gets it back straight away with your reason, so it can go to another partner.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2" role="radiogroup">
            {declineReasons.map((r) => (
              <button key={r} role="radio" aria-checked={reason === r} onClick={() => setReason(r)} className={cn("flex h-12 items-center justify-between rounded-[12px] border-2 px-4 text-left text-[15.5px]", reason === r ? "border-primary bg-brand-soft/50 text-foreground" : "border-border text-foreground hover:border-border-strong")}>
                {r} {reason === r && <Check className="size-4 text-primary" />}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeclining(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { dispatch({ type: "leadDecline", id: l.id, reason, by: me.name }); setDeclining(false); toast(`Declined ${l.company}`, { description: "Sent back to Jordan Lee with your reason." }) }}>Decline lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  )
}

function WorkingCard({ l }: { l: Lead }) {
  const { dispatch } = useStore()
  const { isExec } = usePartner()
  const [note, setNote] = useState("")
  return (
    <li className="rounded-[14px] border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <b className="block text-[18px] text-foreground">{l.company}</b>
          <span className="text-[14.5px] text-muted-foreground">About {money(l.estValue)} · owner <b className="text-foreground">{l.assignee}</b></span>
          <SourceTag source={l.source} className="mt-1.5 flex w-fit" />
        </div>
        <Badge className="border-0 bg-ok-soft text-ok">Accepted</Badge>
      </div>
      <Facts l={l} revealed />
      {l.update && <p className="mt-3 rounded-[10px] bg-muted/60 px-3 py-2 text-[15px] text-foreground">Latest: {l.update}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
        <form className="flex min-w-0 flex-1 basis-72 gap-2" onSubmit={(e) => { e.preventDefault(); if (!note.trim()) return; dispatch({ type: "leadUpdate", id: l.id, text: note.trim() }); setNote(""); toast.success("Update shared with Jordan Lee") }}>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Log an update for Jordan" className="h-11 flex-1 bg-card text-[15.5px]" />
          <Button type="submit" variant="outline" size="icon" className="size-11" aria-label="Share update"><Send /></Button>
        </form>
        <Button size="lg" onClick={() => go(`/p/register/${l.id}`)}>{isExec ? "Register as a deal" : "Register as my deal"} <ArrowRight /></Button>
      </div>
    </li>
  )
}

function DoneRow({ l }: { l: Lead }) {
  const label = l.status === "converted" ? "Registered as a deal" : l.status === "declined" ? `Declined: ${l.declineReason}` : "Expired: not accepted in 48 hours"
  return (
    <li className="flex flex-wrap items-center gap-3 border-b px-5 py-4 last:border-0 sm:px-6">
      <span className={cn("grid size-9 place-items-center rounded-full", l.status === "converted" ? "bg-ok-soft text-ok" : "bg-muted text-muted-foreground")}>{l.status === "converted" ? <CheckCircle2 className="size-5" /> : <X className="size-5" />}</span>
      <span className="min-w-0 flex-1">
        <b className="block text-foreground">{l.company}</b>
        <span className="text-[14px] text-muted-foreground">{label}{l.assignee ? ` · ${l.assignee}` : ""}</span>
        <SourceTag source={l.source} className="mt-1 flex w-fit" />
      </span>
      {l.registrationId && <Button variant="ghost" onClick={() => go(`/p/deal/${l.registrationId}`)}>Open deal <ArrowRight /></Button>}
    </li>
  )
}

/** A lead from Ridgeway's own campaign, handed over by the marketer. Internal: no 48-hour clock, Brightline doesn't see it yet. */
function MarketingCard({ l }: { l: CampaignLead }) {
  const { state, dispatch } = useStore()
  const { me } = usePartner()
  const [returning, setReturning] = useState(false)
  const [why, setWhy] = useState("")
  const campaign = state.campaigns.find((c) => c.id === l.campaignId)
  const mine = l.assignee === me.name && l.status === "with_rep"
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
        <SourceTag source={`Ridgeway campaign: ${campaign?.name ?? ""}`} />
        <span className="text-[14px] text-muted-foreground">{l.activity}</span>
      </div>
      <p className="mt-2 text-[14px] text-muted-foreground">Handed over by {campaign?.owner ?? "Ridgeway marketing"}{l.handedAt ? ` ${ago(l.handedAt)}` : ""}. Brightline doesn't see it until you register the deal.</p>
      {mine ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="lg" onClick={() => go(`/p/register/${l.id}`)}>Register as a deal <ArrowRight /></Button>
          <Button size="lg" variant="outline" onClick={() => setReturning(true)}><Undo2 /> Not a fit</Button>
        </div>
      ) : (
        <Badge variant="secondary" className="mt-4">{l.status === "converted" ? `Registered by ${l.assignee}` : l.status === "returned" ? `Handed back by ${l.assignee}` : `With ${l.assignee}`}</Badge>
      )}
      <Dialog open={returning} onOpenChange={setReturning}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Hand {l.company} back</DialogTitle>
            <DialogDescription>{campaign?.owner ?? "Marketing"} sees your reason and can give it to someone else.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="why" className="text-[15px]">Why it isn't a fit</Label>
            <Input id="why" value={why} onChange={(e) => setWhy(e.target.value)} className="h-11 text-[15.5px]" placeholder="e.g. Too small for Analytics; better as a referral" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturning(false)}>Cancel</Button>
            <Button disabled={why.trim().length < 3} onClick={() => { dispatch({ type: "returnLead", id: l.id, reason: why.trim(), by: me.name }); toast(`${l.company} went back to ${campaign?.owner ?? "marketing"}`); setReturning(false) }}>Hand it back</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  )
}

export function PartnerLeads({ tab }: { tab?: string }) {
  const { isExec } = usePartner()
  const d = usePartnerData()
  const fromMarketing = useTeamCampaignLeads()
  const mktOpen = fromMarketing.filter((l) => l.status === "with_rep")
  const working = d.leads.filter((l) => l.status === "accepted")
  const withReps = isExec ? d.leads.filter((l) => l.status === "offered" && l.assignee) : []
  const done = d.leads.filter((l) => ["converted", "declined", "expired"].includes(l.status))
  const t = tab ?? (d.offers.length ? "waiting" : "working")
  return (
    <div>
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">Leads <StageTag /></span>}
        sub={isExec ? "Brightline shares inbound leads with Ridgeway. Accept within 48 hours and pick the rep who owns it, or decline so it can go elsewhere." : "Leads sent to you by name, and the ones Paul gave you. Contact details unlock when you accept."}
      />
      <PageTabs
        label="Lead views"
        value={t}
        onChange={(v) => go(`/p/leads/${v}`)}
        items={[
          { value: "waiting", label: isExec ? "To accept" : "Waiting for you", icon: <Inbox />, count: d.offers.length + withReps.length, tone: d.offers.length ? "action" : "neutral" },
          { value: "working", label: "Working", icon: <Clock3 />, count: working.length },
          { value: "done", label: "Done", icon: <CheckCircle2 />, count: done.length },
          { value: "marketing", label: "From Ridgeway marketing", icon: <Megaphone />, count: mktOpen.length, tone: !isExec && mktOpen.length ? "action" : "neutral", hint: "Leads from Ridgeway's own campaigns, handed over by the marketer. Ridgeway keeps them until a rep registers the deal." },
        ]}
      />
      {t === "marketing" && (fromMarketing.length ? <ul className="grid gap-4">{fromMarketing.map((l) => <MarketingCard key={l.id} l={l} />)}</ul> : (
        <Panel><EmptyState icon={<Megaphone className="size-6" />} title="Nothing from marketing" body={isExec ? "Leads Priya hands to your reps show here." : "Leads Priya hands you from her campaigns show here."} /></Panel>
      ))}
      {t === "waiting" && (
        <div className="space-y-6">
          {d.offers.length ? <ul className="grid gap-4">{d.offers.map((l) => <OfferCard key={l.id} l={l} />)}</ul> : <Panel><EmptyState icon={<Inbox className="size-6" />} title="No leads waiting" body="New leads from Brightline appear here with 48 hours to accept." /></Panel>}
          {withReps.length > 0 && (
            <Panel title="Sent to a rep by name" sub="Waiting for the rep to accept. You can accept on their behalf.">
              <ul className="grid gap-4">{withReps.map((l) => <OfferCard key={l.id} l={l} />)}</ul>
            </Panel>
          )}
        </div>
      )}
      {t === "working" && (working.length ? <ul className="grid gap-4">{working.map((l) => <WorkingCard key={l.id} l={l} />)}</ul> : <Panel><EmptyState title="Nothing in progress" body="Accepted leads show here until they become deals." /></Panel>)}
      {t === "done" && <Panel bodyClass="p-0 sm:p-0">{done.length ? <ul>{done.map((l) => <DoneRow key={l.id} l={l} />)}</ul> : <EmptyState title="Nothing here yet" />}</Panel>}
    </div>
  )
}
