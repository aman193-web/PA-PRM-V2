import { useEffect, useMemo, useState } from "react"
import {
  ArrowRight, Bot, Check, CircleHelp, Clock, FileText, Loader2, Lock, MessageSquareMore, Pause, ShieldCheck, Undo2, X,
} from "lucide-react"
import {
  AiTag, CheckList, Confidence, DecisionOption, PageHeader, Panel, RegStateBadge, SalesforceMark, SlaMeter,
} from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import type { Registration, RejectCode } from "@/data/model"
import { me, partnerRoles, rejectReasons, reviewReasonLabel } from "@/data/model"
import { addDays, ago, date, money, NOW } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { slaPct, useQueue, useStore } from "@/store"
import { useMedia } from "@/lib/useMedia"

type Choice = "approve" | "reject" | "info"

const defaultRole: Record<string, string> = { Reseller: "Reseller", Services: "Implementation", Referral: "Referral", Technology: "Technology" }

export function RegistrationScreen({ id }: { id: string }) {
  const { state, partner } = useStore()
  const reg = state.registrations.find((r) => r.id === id)
  const [sheet, setSheet] = useState<Choice | null>(null)
  const desktop = useMedia("(min-width: 1024px)")
  if (!reg) return <PageHeader title="Registration not found" back={{ label: "Review queue", href: "/queue" }} />
  const p = partner(reg.partnerId)!
  const open = reg.state === "under_review"

  return (
    <div>
      <PageHeader
        back={open || reg.state === "info_requested" || reg.decision?.at === NOW.toISOString() ? { label: "Review queue", href: "/queue" } : { label: "Deals", href: "/deals" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {reg.customer}
            <RegStateBadge reg={reg} />
          </span>
        }
        sub={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-foreground">{money(reg.value)}</span>·<span>{reg.product}</span>·
            <span>Registered by {reg.rep}, {p.name}</span>·<span>{reg.id}</span>
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          {open && reg.reasons.length > 0 && (
            <div className="rounded-[14px] border border-amber/60 bg-amber-soft px-5 py-4">
              <p className="font-semibold text-amber-ink">Why this needs you</p>
              <ul className="mt-1.5 flex flex-wrap gap-x-6 gap-y-1 text-[15.5px] text-foreground">
                {reg.reasons.map((x) => (
                  <li key={x} className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-amber-ink" />{reviewReasonLabel[x]}</li>
                ))}
              </ul>
            </div>
          )}

          {reg.state === "under_review" && slaPct(reg) >= 80 && (
            <div className="rounded-[14px] border border-bad/40 bg-bad-soft/50 px-5 py-4">
              <p className="font-semibold text-bad">Escalated to Dana Ortiz at 80% of the deadline</p>
              <p className="mt-1 text-[15.5px] text-foreground">She's been alerted and can decide it too. Decide now and it stays with you; at 100% it's reassigned to a backup reviewer, never auto-approved.</p>
            </div>
          )}

          {reg.state === "info_requested" && reg.infoRequest && (
            <div className="rounded-[14px] border bg-card px-5 py-4">
              <p className="flex items-center gap-2 font-semibold text-foreground"><Pause className="size-4" /> SLA paused · waiting on {reg.rep}</p>
              <p className="mt-1 text-[15.5px]">You asked {ago(reg.infoRequest.at)}: "{reg.infoRequest.asked}"</p>
            </div>
          )}

          {reg.infoReply && reg.infoRequest && (
            <div className="rounded-[14px] border border-primary/40 bg-brand-soft/30 px-5 py-4">
              <p className="font-semibold text-foreground">{reg.infoReply.by} answered {ago(reg.infoReply.at)} · SLA resumed</p>
              <p className="mt-1 text-[15px] text-muted-foreground">You asked: "{reg.infoRequest.asked}"</p>
              <p className="mt-2 text-[15.5px] text-foreground">"{reg.infoReply.text}"</p>
            </div>
          )}

          {reg.ai && open && <AiCard reg={reg} onUse={(c) => setSheet(c)} />}

          {reg.conflict && <ConflictCompare reg={reg} />}

          <div className="grid gap-6 xl:grid-cols-2">
            {reg.checks.length > 0 && (
              <Panel title="Automatic checks" sub="Eligibility, onboarding, fields, product, territory, conflicts">
                <CheckList checks={reg.checks} />
              </Panel>
            )}
            {reg.prefill.length > 0 && <Panel title="What the partner sent" sub="Filled in by AI from the partner's message; low-confidence fields are flagged">
              <ul className="divide-y">
                {reg.prefill.map((f) => (
                  <li key={f.label} className="flex items-start justify-between gap-3 py-2.5 first:pt-0">
                    <div className="min-w-0">
                      <p className="text-[14px] text-muted-foreground">{f.label}</p>
                      <p className={cn("font-medium text-foreground", f.confidence < 0.8 && "text-amber-ink")}>{f.value}</p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[13px] font-semibold", f.confidence < 0.8 ? "bg-amber-soft text-amber-ink" : "bg-muted text-muted-foreground")}>
                      {f.confidence < 0.8 ? "Unsure · " : ""}{Math.round(f.confidence * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
              {reg.note && (
                <blockquote className="mt-4 rounded-[10px] bg-muted px-4 py-3 text-[15px] text-foreground">
                  <span className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground"><FileText className="size-4" /> Partner's note</span>
                  {reg.note}
                </blockquote>
              )}
            </Panel>}
          </div>
        </div>

        {/* Decision column */}
        <aside className="space-y-4 max-lg:order-first lg:sticky lg:top-24 lg:self-start">
          {(open || reg.state === "info_requested") && (
            <Panel title="Time to decide" sub={reg.state === "info_requested" ? "The clock restarts when the partner replies" : `Submitted ${ago(reg.submittedAt)}`}>
              <SlaMeter reg={reg} size="lg" />
              {open && reg.usedHours / reg.slaHours >= 0.8 && (
                <p className="mt-3 rounded-[10px] bg-bad-soft px-3 py-2 text-[14.5px] text-bad">
                  {me.chief} (channel chief) was alerted at 80%. Decide now to keep it with you.
                </p>
              )}
            </Panel>
          )}
          {open ? (
            <div className="hidden lg:block">
              <Panel title="Your decision" sub="The partner hears the result and reason within a second">
                <DecisionForm reg={reg} preset={sheet} />
              </Panel>
            </div>
          ) : (
            <Outcome reg={reg} />
          )}
        </aside>
      </div>

      {/* Phone: sticky decision bar opens a bottom sheet */}
      {open && (
        <>
          <div className="fixed inset-x-0 bottom-[62px] z-30 border-t bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
            <div className="mx-auto grid max-w-xl grid-cols-3 gap-2">
              <Button size="lg" className="bg-ok text-white hover:bg-ok/90" onClick={() => setSheet("approve")}><Check /> Approve</Button>
              <Button size="lg" variant="outline" onClick={() => setSheet("info")}><CircleHelp /> Ask</Button>
              <Button size="lg" variant="outline" className="text-bad" onClick={() => setSheet("reject")}><X /> Reject</Button>
            </div>
          </div>
          <Sheet open={!!sheet && !desktop} onOpenChange={(o) => !o && setSheet(null)}>
            <SheetContent side="bottom" className="max-h-[88svh] overflow-y-auto rounded-t-[18px] px-5 pb-8">
              <SheetHeader className="px-0">
                <SheetTitle>Decide {reg.customer}</SheetTitle>
              </SheetHeader>
              <DecisionForm reg={reg} preset={sheet} key={sheet} />
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  )
}

function AiCard({ reg, onUse }: { reg: Registration; onUse: (c: Choice) => void }) {
  const ai = reg.ai!
  const choice: Choice = ai.action === "approve" ? "approve" : ai.action === "reject" ? "reject" : "info"
  const tone = ai.action === "approve" ? "text-ok" : ai.action === "reject" ? "text-bad" : "text-amber-ink"
  return (
    <section className="rounded-[14px] border border-primary/25 bg-brand-soft/60 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AiTag>Deal Desk recommendation</AiTag>
        <Confidence value={ai.confidence} />
      </div>
      <p className={cn("mt-2 text-[21px] leading-snug font-bold", tone)}>{ai.headline}</p>
      <p className="mt-3 text-[14px] font-semibold text-muted-foreground">Evidence</p>
      <ul className="mt-1.5 space-y-2 text-[15.5px] text-foreground">
        {ai.evidence.map((e) => (
          <li key={e} className="flex gap-2.5"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />{e}</li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button onClick={() => { onUse(choice); document.getElementById("decision")?.scrollIntoView({ behavior: "smooth", block: "center" }) }}>
          Use this recommendation <ArrowRight />
        </Button>
        <span className="text-[14px] text-muted-foreground">You make the final call. The AI never decides exceptions on its own.</span>
      </div>
    </section>
  )
}

function ConflictCompare({ reg }: { reg: Registration }) {
  const c = reg.conflict!
  return (
    <Panel
      title={c.kind === "crm_opportunity" ? "Conflict: an open Salesforce opportunity" : "Conflict: an earlier registration"}
      sub="Side by side. Matching details are highlighted."
    >
      <div className="overflow-hidden rounded-[12px] border">
        <div className="grid grid-cols-[minmax(92px,0.7fr)_1fr_1fr] bg-muted/70 text-[14px]">
          <span className="px-3 py-3 sm:px-4" />
          <span className="border-l px-3 py-3 sm:px-4">
            <b className="block text-foreground">This registration</b>
            <span className="text-muted-foreground">{reg.id}</span>
          </span>
          <span className="border-l px-3 py-3 sm:px-4">
            <b className="flex items-center gap-1.5 text-foreground">{c.kind === "crm_opportunity" && <SalesforceMark />}{c.kind === "crm_opportunity" ? "Salesforce" : c.owner}</b>
            <span className="text-muted-foreground">{c.ref}</span>
          </span>
        </div>
        {c.rows.map((r) => (
          <div key={r.label} className={cn("grid grid-cols-[minmax(92px,0.7fr)_1fr_1fr] border-t text-[15px]", r.match && "bg-amber-soft/60")}>
            <span className="px-3 py-2.5 text-muted-foreground sm:px-4">{r.label}</span>
            <span className="border-l px-3 py-2.5 font-medium text-foreground sm:px-4">{r.ours}</span>
            <span className={cn("border-l px-3 py-2.5 sm:px-4", r.theirs.startsWith("Hidden") ? "text-muted-foreground italic" : "font-medium text-foreground")}>
              {r.theirs.startsWith("Hidden") && <Lock className="mr-1 inline size-3.5" />}
              {r.theirs}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[14.5px] text-muted-foreground">
        {c.kind === "crm_opportunity" ? <>Owner: {c.owner} · Stage: {c.stage}</> : <>{c.owner} isn't assigned to you, so you only see what's needed to decide. Status: {c.stage}</>}
      </p>
    </Panel>
  )
}

function DecisionForm({ reg, preset }: { reg: Registration; preset: Choice | null }) {
  const { dispatch, partner } = useStore()
  const p = partner(reg.partnerId)!
  const [choice, setChoice] = useState<Choice | null>(preset)
  useEffect(() => { if (preset) setChoice(preset) }, [preset])

  // Approve
  const canLink = reg.conflict?.kind === "crm_opportunity"
  const [link, setLink] = useState<"existing" | "new">(canLink ? "existing" : "new")
  const [role, setRole] = useState(defaultRole[reg.program])
  const days = 90
  // Reject
  const [code, setCode] = useState<RejectCode | "">(reg.ai?.rejectCode ?? "")
  const reasonText = rejectReasons.find((r) => r.code === code)
  const [rejectMsg, setRejectMsg] = useState(reasonText?.explain ?? "")
  // Info
  const infoOptions = ["Product edition", "Expected close date", "Customer contact", "Proof of engagement", "Deal value"]
  const [needed, setNeeded] = useState<string[]>(reg.ai?.infoNeeded ?? [])
  const [infoMsg, setInfoMsg] = useState("")
  const autoInfo = useMemo(() => (needed.length ? `Please confirm: ${needed.join(", ").toLowerCase()}.` : ""), [needed])

  const [busy, setBusy] = useState(false)
  const submit = () => {
    setBusy(true)
    setTimeout(() => {
      if (choice === "approve") dispatch({ type: "approve", id: reg.id, link, role, days, message: "" })
      if (choice === "reject") dispatch({ type: "reject", id: reg.id, reason: reasonText?.label ?? "Other", message: rejectMsg })
      if (choice === "info") dispatch({ type: "requestInfo", id: reg.id, asked: [autoInfo, infoMsg].filter(Boolean).join(" ") })
      setBusy(false)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }, 350)
  }

  const valid = choice === "approve" || (choice === "reject" && code && rejectMsg.trim()) || (choice === "info" && (needed.length || infoMsg.trim()))

  return (
    <div id="decision" className="space-y-5">
      <div role="radiogroup" aria-label="Decision" className="grid gap-2">
        <DecisionOption active={choice === "approve"} tone="ok" onClick={() => setChoice("approve")} icon={<Check />} label="Approve" sub="Links Salesforce and protects the deal" suggested={reg.ai?.action === "approve"} />
        <DecisionOption active={choice === "info"} tone="amber" onClick={() => setChoice("info")} icon={<CircleHelp />} label="Ask for info" sub="Pauses the SLA until they reply" suggested={reg.ai?.action === "request_info"} />
        <DecisionOption active={choice === "reject"} tone="bad" onClick={() => setChoice("reject")} icon={<X />} label="Reject" sub="Needs a reason code the partner sees" suggested={reg.ai?.action === "reject"} />
      </div>

      {choice === "approve" && (
        <div className="space-y-4">
          {canLink && (
            <div className="space-y-2">
              <Label className="text-[15px]">In Salesforce</Label>
              <RadioGroup value={link} onValueChange={(v) => setLink(v as "existing" | "new")} className="grid gap-2">
                <Option value="existing" current={link} title="Link to Sam's opportunity" sub={`${reg.conflict!.ref} · recommended`} />
                <Option value="new" current={link} title="Create a new opportunity" sub="Only if it's a separate deal" />
              </RadioGroup>
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-[15px]">Partner role on the opportunity</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {partnerRoles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <p className="flex gap-2 rounded-[10px] bg-ok-soft px-3 py-2.5 text-[14.5px] text-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ok" />
            Protects {money(reg.value)} for {p.name} for {days} days, until {date(addDays(NOW.toISOString().slice(0, 10), days))}.
          </p>
        </div>
      )}

      {choice === "reject" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[15px]">Reason code</Label>
            <Select value={code} onValueChange={(v) => { setCode(v as RejectCode); setRejectMsg(rejectReasons.find((r) => r.code === v)?.explain ?? "") }}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Choose a reason" /></SelectTrigger>
              <SelectContent>
                {rejectReasons.map((r) => <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[15px]">What {reg.rep.split(" ")[0]} will read</Label>
            <Textarea value={rejectMsg} onChange={(e) => setRejectMsg(e.target.value)} placeholder="Explain in plain language" />
          </div>
        </div>
      )}

      {choice === "info" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[15px]">What do you need?</Label>
            <div className="grid gap-2">
              {infoOptions.map((o) => (
                <Label key={o} className={cn("flex h-11 cursor-pointer items-center gap-3 rounded-[10px] border px-3 text-[15px] font-normal", needed.includes(o) && "border-amber bg-amber-soft")}>
                  <Checkbox checked={needed.includes(o)} onCheckedChange={(c) => setNeeded((n) => (c ? [...n, o] : n.filter((x) => x !== o)))} />
                  {o}
                </Label>
              ))}
            </div>
          </div>
          <Textarea value={infoMsg} onChange={(e) => setInfoMsg(e.target.value)} placeholder="Add a note (optional)" />
          <p className="flex gap-2 text-[14.5px] text-muted-foreground"><Pause className="mt-0.5 size-4 shrink-0" /> The SLA clock pauses until {reg.rep.split(" ")[0]} replies.</p>
        </div>
      )}

      {choice && (
        <Button size="lg" className={cn("w-full", choice === "approve" && "bg-ok text-white hover:bg-ok/90", choice === "reject" && "bg-bad text-white hover:bg-bad/90")} disabled={!valid || busy} onClick={submit}>
          {busy && <Loader2 className="animate-spin" />}
          {choice === "approve" ? "Approve and tell the partner" : choice === "reject" ? "Reject and tell the partner" : "Send request and pause SLA"}
        </Button>
      )}
    </div>
  )
}

function Option({ value, current, title, sub }: { value: string; current: string; title: string; sub: string }) {
  return (
    <Label className={cn("flex cursor-pointer items-start gap-3 rounded-[10px] border p-3 font-normal", current === value && "border-primary bg-brand-soft/70")}>
      <RadioGroupItem value={value} className="mt-0.5" />
      <span className="leading-snug">
        <b className="block text-[15px] text-foreground">{title}</b>
        <span className="text-[14px] text-muted-foreground">{sub}</span>
      </span>
    </Label>
  )
}

function Outcome({ reg }: { reg: Registration }) {
  const { partner } = useStore()
  const q = useQueue()
  const p = partner(reg.partnerId)!
  const d = reg.decision
  const next = q.toDecide.find((r) => r.id !== reg.id)
  if (!d) return null
  const justNow = d.at === NOW.toISOString() && d.by === "you"

  if (reg.state === "won" || reg.state === "lost" || reg.state === "expired") {
    const won = reg.state === "won"
    return (
      <Panel>
        <div className="flex items-start gap-3">
          <span className={cn("grid size-11 shrink-0 place-items-center rounded-full", won ? "bg-ok-soft text-ok" : "bg-muted text-muted-foreground")}>
            {won ? <Check className="size-5" /> : <Clock className="size-5" />}
          </span>
          <div>
            <p className="text-[18px] font-bold text-foreground">{won ? "Won" : reg.state === "lost" ? "Lost" : "Protection expired"}</p>
            <p className="text-[14.5px] text-muted-foreground">
              {won ? `Closed ${date(reg.closeDate)} · credit on the opportunity` : reg.state === "lost" ? reg.lostReason ?? "Closed lost in Salesforce" : `Ended ${reg.protectedUntil ? date(reg.protectedUntil) : ""} with no extension`}
            </p>
          </div>
        </div>
        {reg.crm && (
          <p className="mt-4 flex items-center gap-2 text-[15px]"><SalesforceMark /> {reg.crm.opportunityId} · {reg.crmStage ?? reg.state}</p>
        )}
        <div className="mt-6 grid gap-2">
          {won && reg.crm && <Button size="lg" onClick={() => go(`/opportunity/${reg.crm!.opportunityId}`)}>See credit split <ArrowRight /></Button>}
          <Button variant="ghost" onClick={() => go("/deals")}><Undo2 /> Back to deals</Button>
        </div>
      </Panel>
    )
  }

  const steps =
    reg.state === "approved"
      ? [
          { icon: <MessageSquareMore />, text: `${p.name} told: approved, with the reason`, done: true },
          { icon: <SalesforceMark className="h-4 w-5" />, text: `${reg.crm?.linked === "existing" ? "Linked to" : "Created"} opportunity ${reg.crm?.opportunityId}`, done: reg.crm?.sync === "synced" },
          { icon: <Bot />, text: `Partner role added: ${reg.crm?.role}`, done: reg.crm?.sync === "synced" },
          { icon: <ShieldCheck />, text: `Protected until ${reg.protectedUntil ? date(reg.protectedUntil) : "—"}`, done: true },
        ]
      : reg.state === "rejected"
        ? [
            { icon: <MessageSquareMore />, text: `${p.name} told: rejected — ${d.reason}`, done: true },
            { icon: <Clock />, text: "Logged with your name and reason code", done: true },
          ]
        : [
            { icon: <MessageSquareMore />, text: `Question sent to ${reg.rep}`, done: true },
            { icon: <Pause />, text: "SLA paused until they reply", done: true },
          ]

  return (
    <Panel>
      <div className="flex items-start gap-3">
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-full", reg.state === "rejected" ? "bg-bad-soft text-bad" : reg.state === "approved" ? "bg-ok-soft text-ok" : "bg-amber-soft text-amber-ink")}>
          {reg.state === "rejected" ? <X className="size-5" /> : reg.state === "approved" ? <Check className="size-5" /> : <Pause className="size-5" />}
        </span>
        <div>
          <p className="text-[18px] font-bold text-foreground">
            {reg.state === "approved" ? "Approved" : reg.state === "rejected" ? "Rejected" : "Waiting on the partner"}
          </p>
          <p className="text-[14.5px] text-muted-foreground">
            {d.by === "rules" ? `Decided by the rules in ${d.seconds} seconds` : justNow ? `${d.actor ? `By ${d.actor} · ` : ""}Partner notified in 0.4 seconds` : `By ${d.actor ?? "you"}, ${ago(d.at)}`}
          </p>
        </div>
      </div>
      <ul className="mt-5 space-y-3">
        {steps.map((s) => (
          <li key={s.text} className="flex items-center gap-3 text-[15px]">
            <span className={cn("grid size-8 shrink-0 place-items-center rounded-full [&_svg]:size-4", s.done ? "bg-ok-soft text-ok" : "bg-muted text-muted-foreground")}>
              {s.done ? s.icon : <Loader2 className="animate-spin" />}
            </span>
            <span className={cn(s.done ? "text-foreground" : "text-muted-foreground")}>{s.text}{!s.done && " · syncing"}</span>
          </li>
        ))}
      </ul>
      {reg.state === "approved" && reg.crm && (
        <Badge variant="outline" className="mt-4">Salesforce: {reg.crm.sync === "synced" ? `in sync${reg.crmStage ? ` · ${reg.crmStage}` : ""}` : "write queued"}</Badge>
      )}
      <div className="mt-6 grid gap-2">
        {next ? (
          <Button size="lg" onClick={() => go(`/registration/${next.id}`)}>Next: {next.customer} <ArrowRight /></Button>
        ) : (
          <Button size="lg" onClick={() => go("/home")}>Queue clear — back to home</Button>
        )}
        <Button variant="ghost" onClick={() => go("/queue")}><Undo2 /> Back to the queue</Button>
      </div>
    </Panel>
  )
}
