import { useState, type ReactNode } from "react"
import { BadgeCheck, Bot, Check, CircleHelp, Clock3, FileText, Lock, Mail, Phone, Scale, Send, ShieldCheck, Trophy, UserCheck, X } from "lucide-react"
import { toast } from "sonner"
import { EmptyState, PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { rejectReasons, type Registration, type ReviewReason } from "@/data/model"
import { date, hoursLeft, money, shortDate, time } from "@/lib/format"
import { cn } from "@/lib/utils"
import { slaPct, useStore } from "@/store"
import { partnerManager } from "@/partner/data"
import { daysUntil, usePartner, usePartnerData, type CreditItem } from "@/partner/usePartner"
import { CreditKind, ProtectionMeter, ShareBar, StageTag, StatusBadge } from "@/partner/bits"

/** Why a deal needs a person, in partner words. Never names the other party in a conflict (R-SEC-2). */
const reasonText: Record<ReviewReason, string> = {
  conflict: "It may overlap with an opportunity already in progress. Jordan checks who was first.",
  over_limit: "It's over your program's auto-approve limit, so a person decides.",
  duplicate: "It may have been registered already. Jordan checks it.",
  low_quality: "Your partner manager reviews it before approval.",
  low_confidence: "Some details weren't clear, so Jordan confirms them.",
  territory: "The customer may sit outside your territory.",
}

function ReplyCard({ reg }: { reg: Registration }) {
  const { dispatch } = useStore()
  const { me } = usePartner()
  const [text, setText] = useState("")
  return (
    <Panel className="border-amber/60 bg-amber-soft/25" title={<span className="flex items-center gap-2"><CircleHelp className="size-5 text-amber-ink" /> Jordan Lee asked a question</span>} sub={`${shortDate(reg.infoRequest!.at)} at ${time(reg.infoRequest!.at)} · the review is paused until you answer`}>
      <blockquote className="rounded-[12px] border bg-card px-4 py-3 text-[16px] text-foreground">"{reg.infoRequest!.asked}"</blockquote>
      <form className="mt-4 grid gap-2" onSubmit={(e) => {
        e.preventDefault()
        if (!text.trim()) return
        dispatch({ type: "partnerReply", id: reg.id, text: text.trim(), by: me.name })
        toast.success("Answer sent to Jordan", { description: `The review clock resumed at ${hoursLeft(reg.slaHours - reg.usedHours)}. It picks up where it paused.` })
      }}>
        <Label htmlFor="reply" className="text-[15px]">Your answer</Label>
        <Textarea id="reply" value={text} onChange={(e) => setText(e.target.value)} rows={4} className="bg-card text-[16px]" placeholder="e.g. Procurement signs off in the week of Jan 4. Main contact is Dana Wells, VP Operations." />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" disabled={!text.trim()}><Send /> Send answer</Button>
          <span className="text-[14px] text-muted-foreground">The checks re-run and the deal goes back to Jordan.</span>
        </div>
      </form>
    </Panel>
  )
}

function ReviewCard({ reg }: { reg: Registration }) {
  const p = slaPct(reg)
  return (
    <Panel title={<span className="flex items-center gap-2"><Clock3 className="size-5 text-primary" /> With Jordan Lee for review</span>} sub="You'll get a notification and an email the moment it's decided.">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[24px] font-bold text-foreground tabular">{hoursLeft(reg.slaHours - reg.usedHours).replace("left", "to decide")}</span>
        <span className="text-[14px] text-muted-foreground">{reg.slaHours} business-hour target</span>
      </div>
      <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(p, 4)}%` }} /></div>
      {reg.reasons.length > 0 && (
        <>
          <p className="mt-5 text-[14px] font-semibold tracking-wide text-muted-foreground uppercase">Why a person decides</p>
          <ul className="mt-2 space-y-2">
            {reg.reasons.map((r) => <li key={r} className="flex gap-2.5 text-[15.5px] text-foreground"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />{reasonText[r]}</li>)}
          </ul>
        </>
      )}
      {reg.infoReply && (
        <div className="mt-5 rounded-[12px] bg-muted/60 px-4 py-3">
          <p className="text-[14px] font-semibold text-muted-foreground">Your answer · {shortDate(reg.infoReply.at)}</p>
          <p className="mt-1 text-[15.5px] text-foreground">{reg.infoReply.text}</p>
        </div>
      )}
    </Panel>
  )
}

function ExtendCard({ reg, pending }: { reg: Registration; pending: boolean }) {
  const { dispatch } = useStore()
  const { me } = usePartner()
  const [days, setDays] = useState(30)
  const [reason, setReason] = useState("")
  const left = daysUntil(reg.protectedUntil!)
  return (
    <Panel title={<span className="flex items-center gap-2"><ShieldCheck className="size-5 text-ok" /> Protection</span>} sub={`Approved ${reg.decision?.by === "rules" ? `by rules in ${reg.decision.seconds} seconds` : `by ${reg.decision?.actor ?? "Jordan Lee"}`} · no one else can register this deal until it ends`}>
      <ProtectionMeter reg={reg} />
      {pending ? (
        <p className="mt-4 flex items-center gap-2 rounded-[12px] bg-muted/70 px-4 py-3 text-[15px] text-foreground"><Clock3 className="size-4 text-primary" /> Extension requested. Jordan decides within one business day.</p>
      ) : left <= 21 ? (
        <form className="mt-5 grid gap-3" onSubmit={(e) => {
          e.preventDefault()
          dispatch({ type: "requestExtension", regId: reg.id, days, reason: reason.trim(), by: me.name })
          toast.success(`Asked Jordan for ${days} more days`, { description: "Your recent activity on the deal was attached automatically." })
        }}>
          <p className="text-[15.5px] font-semibold text-foreground">Need more time? Ask Jordan in one step.</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Extra days">
            {[30, 60, 90].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={days === n} onClick={() => setDays(n)} className={cn("h-12 rounded-[12px] border-2 text-[16px] font-semibold", days === n ? "border-primary bg-brand-soft/60 text-primary" : "border-border bg-card text-foreground hover:border-border-strong")}>
                +{n} days
              </button>
            ))}
          </div>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="bg-card text-[16px]" placeholder="What's changed? e.g. The customer moved its budget review to December." />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg" disabled={!reason.trim()}>Request {days} days</Button>
            <span className="text-[14px] text-muted-foreground">One extension is Jordan's call. A second one needs Brightline's channel chief.</span>
          </div>
        </form>
      ) : (
        <p className="mt-4 text-[14.5px] text-muted-foreground">You can ask for more time from 21 days before it ends.</p>
      )}
    </Panel>
  )
}

function OutcomeCard({ reg }: { reg: Registration }) {
  if (reg.state === "rejected") {
    const r = rejectReasons.find((x) => x.label === reg.decision?.reason)
    return (
      <Panel title={<span className="flex items-center gap-2"><X className="size-5 text-bad" /> Not approved · {reg.decision?.reason}</span>} sub={reg.decision ? `Decided by ${reg.decision.actor ?? "Jordan Lee"} on ${date(reg.decision.at)}` : undefined}>
        {r?.explain && <p className="text-[15.5px] text-foreground">{r.explain}</p>}
        {reg.decision?.message && <blockquote className="mt-3 rounded-[12px] bg-muted/60 px-4 py-3 text-[15.5px] text-foreground">"{reg.decision.message}" · Jordan</blockquote>}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" asChild><a href={`tel:${partnerManager.phone.replace(/\s/g, "")}`}><Phone /> Call Jordan</a></Button>
          <Button variant="outline" asChild><a href={`mailto:${partnerManager.email}`}><Mail /> Email Jordan</a></Button>
        </div>
      </Panel>
    )
  }
  if (reg.state === "won")
    return (
      <Panel title={<span className="flex items-center gap-2"><Trophy className="size-5 text-ok" /> Won on {date(reg.closeDate)}</span>} sub="Closed-won in Brightline's CRM. Your credit is verified.">
        <p className="text-[15.5px] text-foreground">Nice work. This deal counts toward {"Ridgeway's"} tier progress and your verified credit.</p>
      </Panel>
    )
  if (reg.state === "lost") return <Panel title="Lost" sub={`Closed ${date(reg.closeDate)}`}><p className="text-[15.5px] text-foreground">Reason from Brightline's CRM: {reg.lostReason ?? "not given"}.</p></Panel>
  return <Panel title="Protection ended" sub={reg.protectedUntil ? `Ended ${date(reg.protectedUntil)}` : undefined}><p className="text-[15.5px] text-foreground">You can ask to revive it within 14 days of the end date. After that, register it again.</p></Panel>
}

function Timeline({ reg }: { reg: Registration }) {
  const steps: { icon: ReactNode; title: string; at?: string; done: boolean; current?: boolean }[] = [
    { icon: <FileText />, title: `Registered by ${reg.rep}`, at: reg.submittedAt, done: true },
    { icon: <Check />, title: "Checks ran: eligible, onboarding, product, territory, conflicts", at: reg.submittedAt, done: true },
  ]
  if (reg.infoRequest) steps.push({ icon: <CircleHelp />, title: "Jordan asked a question", at: reg.infoRequest.at, done: true })
  if (reg.infoReply) steps.push({ icon: <Send />, title: `${reg.infoReply.by} answered; the review clock resumed`, at: reg.infoReply.at, done: true })
  if (reg.state === "under_review") steps.push({ icon: <Clock3 />, title: "With Jordan Lee for review", done: false, current: true })
  if (reg.state === "info_requested") steps.push({ icon: <Clock3 />, title: "Waiting for your answer", done: false, current: true })
  if (reg.decision && reg.decision.action !== "info_requested")
    steps.push({ icon: reg.decision.by === "rules" ? <Bot /> : <UserCheck />, title: reg.decision.action === "approved" ? (reg.decision.by === "rules" ? `Approved by rules in ${reg.decision.seconds} seconds` : `Approved by ${reg.decision.actor ?? "Jordan Lee"}`) : `Not approved by ${reg.decision.actor ?? "Jordan Lee"}`, at: reg.decision.at, done: true })
  if (reg.crm) steps.push({ icon: <BadgeCheck />, title: reg.crm.sync === "synced" ? `Opportunity ${reg.crm.linked === "existing" ? "linked" : "created"} in Brightline's CRM with Ridgeway as ${reg.crm.role}` : "Writing to Brightline's CRM…", done: reg.crm.sync === "synced", current: reg.crm.sync !== "synced" })
  if (reg.state === "approved" && reg.protectedUntil) steps.push({ icon: <ShieldCheck />, title: `Protected until ${date(reg.protectedUntil)}`, done: false, current: true })
  if (reg.state === "won") steps.push({ icon: <Trophy />, title: "Closed won", at: `${reg.closeDate}T12:00:00`, done: true })
  if (reg.state === "lost") steps.push({ icon: <X />, title: `Closed lost · ${reg.lostReason ?? ""}`, at: `${reg.closeDate}T12:00:00`, done: true })
  return (
    <Panel title="What happened">
      <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-px before:bg-border">
        {steps.map((s, i) => (
          <li key={i} className="relative flex gap-3">
            <span className={cn("relative grid size-8 shrink-0 place-items-center rounded-full [&_svg]:size-4", s.current ? "bg-brand-soft text-primary ring-4 ring-background" : s.done ? "bg-ok-soft text-ok ring-4 ring-background" : "bg-muted text-muted-foreground ring-4 ring-background")}>{s.icon}</span>
            <span className="min-w-0 pt-1">
              <span className={cn("block text-[15.5px]", s.current ? "font-semibold text-foreground" : "text-foreground")}>{s.title}</span>
              {s.at && <span className="text-[13.5px] text-muted-foreground">{shortDate(s.at)} · {time(s.at)}</span>}
            </span>
          </li>
        ))}
      </ol>
    </Panel>
  )
}

function CreditPanel({ c, reg }: { c: CreditItem; reg: Registration }) {
  const { state, dispatch } = useStore()
  const { me } = usePartner()
  const [open, setOpen] = useState(false)
  const [why, setWhy] = useState("")
  const disputed = state.disputes.some((x) => x.regId === reg.id)
  return (
    <Panel title="Ridgeway's credit" action={<CreditKind c={c} />}>
      <ShareBar c={c} />
      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-[14.5px] text-muted-foreground">{c.kind === "verified" ? "Credited" : "Expected credit"}</span>
        <span className="text-[24px] font-bold text-foreground tabular">{money(c.credited)}</span>
      </div>
      <p className="mt-2 text-[14.5px] text-muted-foreground">{c.why}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
        {disputed ? (
          <Badge variant="secondary">Dispute sent · Jordan decides within 5 business days</Badge>
        ) : (
          <Button variant="outline" onClick={() => setOpen(true)}><Scale /> Dispute credit</Button>
        )}
        <StageTag />
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispute the credit on {reg.customer}</DialogTitle>
            <DialogDescription>You can't change credit yourself. Explain what's missing and Jordan Lee decides within 5 business days. Any change is versioned and explained.</DialogDescription>
          </DialogHeader>
          <Textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={4} className="text-[16px]" placeholder="e.g. We ran the pilot on Oct 12; it isn't on the deal yet. Meeting notes attached." />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!why.trim()} onClick={() => {
              dispatch({ type: "dispute", regId: reg.id, reason: why.trim(), by: me.name })
              setOpen(false)
              toast.success("Dispute sent to Jordan Lee", { description: "Decision within 5 business days. You'll see why either way." })
            }}>Send dispute</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  )
}

export function PartnerDeal({ id }: { id?: string }) {
  const { isExec } = usePartner()
  const d = usePartnerData()
  const reg = d.deals.find((r) => r.id === id)
  const colleague = !reg && d.all.find((r) => r.id === id)

  if (!reg)
    return (
      <div>
        <PageHeader title={colleague ? "This deal belongs to a colleague" : "Deal not found"} back={{ label: "My deals", href: "/p/deals" }} />
        <Panel>
          <EmptyState
            icon={<Lock className="size-6" />}
            title={colleague ? "Only the rep who registered it, and Ridgeway's admin, can open it" : "We couldn't find that deal"}
            body={colleague ? "Partner sales reps see their own deals. Ask Paul Okafor if you need to work on it together." : "It may belong to another partner, which you can never see."}
          />
        </Panel>
      </div>
    )

  const credit = d.credit.find((c) => c.regId === reg.id)
  const pending = d.pendingExt(reg)
  return (
    <div>
      <PageHeader
        back={{ label: isExec ? "Deals" : "My deals", href: "/p/deals" }}
        title={<span className="flex flex-wrap items-center gap-3">{reg.customer} <StatusBadge reg={reg} /></span>}
        sub={<>{reg.product} · <b className="text-foreground tabular">{money(reg.value)}</b> · closes {shortDate(reg.closeDate)}{isExec ? ` · ${reg.rep}` : ""}</>}
      />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {reg.state === "info_requested" && <ReplyCard reg={reg} />}
          {reg.state === "under_review" && <ReviewCard reg={reg} />}
          {reg.state === "approved" && reg.protectedUntil && <ExtendCard reg={reg} pending={pending} />}
          {["rejected", "won", "lost", "expired"].includes(reg.state) && <OutcomeCard reg={reg} />}
          <Timeline reg={reg} />
        </div>
        <div className="space-y-6">
          {credit && <CreditPanel c={credit} reg={reg} />}
          <Panel title="Details">
            <dl className="divide-y text-[15px]">
              {[
                ["Customer", reg.customer],
                ["Product", reg.product],
                ["Value", money(reg.value)],
                ["Close date", date(reg.closeDate)],
                ["Stage in Brightline's CRM", reg.crmStage ?? (reg.crm ? "Discovery" : "Not created yet")],
                ["Registered by", reg.rep],
                ["Reference", reg.id],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5 first:pt-0 last:pb-0"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium text-foreground">{v}</dd></div>
              ))}
            </dl>
            <p className="mt-3 text-[13.5px] text-muted-foreground">Stage, amount and close date come from Brightline's CRM and update within 5 minutes.</p>
          </Panel>
        </div>
      </div>
    </div>
  )
}
