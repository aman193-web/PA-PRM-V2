import { useMemo, useState } from "react"
import { ArrowRight, Bot, Camera, Check, Clock3, Loader2, Mail, MessageSquareText, Mic, ShieldCheck, Sparkles, UserCheck, Wand2 } from "lucide-react"
import { CheckIcon, PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { AiAdvice, Check as CheckT, Registration, ReviewReason } from "@/data/model"
import { addDays, date, money, NOW, time } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { company } from "@/partner/data"
import { reviewHoursFor, ruleLimit, type ProgramId } from "@/chief/data"
import { usePartner } from "@/partner/usePartner"

const products = ["Analytics · Standard", "Analytics · Enterprise", "Platform · Standard", "Platform · Enterprise"]

interface Field { value: string; confidence: number; confirmed: boolean }
type Fields = Record<"account" | "contact" | "product" | "value" | "close", Field>
const labels: Record<keyof Fields, string> = { account: "Customer", contact: "Buying contact", product: "Product", value: "Deal value", close: "Expected close" }

const examples = {
  clean: "Just met Laura Kim, Head of Finance at Birchwood Hospitality. They want Analytics Enterprise for 12 hotels, around $38,000, hoping to sign by mid-December.",
  review: "Fwd: Rollout plan\n\nHi Marcus, thanks for the demo. We'd like Platform Enterprise across all 9 clinics. Budget is approved at $85,000 and we want to sign by end of January.\n\nTom Becker, CTO\nOakridge Medical Group",
}

const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
const f = (value: string, confidence: number): Field => ({ value, confidence, confirmed: confidence >= 0.8 })

/** Stand-in for the AI prefill (R-REG-2): pulls the five fields out of free text, with a confidence for each. */
function extract(text: string): Fields {
  const t = text.replace(/\s+/g, " ")
  const val = t.match(/\$\s?([\d,]+(?:\.\d+)?)\s?(k|K)?/) ?? t.match(/\b(\d+(?:\.\d+)?)\s?(k|K)\b/)
  const value = val ? Math.round(parseFloat(val[1].replace(/,/g, "")) * (val[2] ? 1000 : 1)) : 0
  const prod = /platform/i.test(t) ? (/enterprise/i.test(t) ? "Platform · Enterprise" : "Platform · Standard") : /enterprise/i.test(t) ? "Analytics · Enterprise" : "Analytics · Standard"
  const prodConf = /analytics|platform/i.test(t) ? 0.92 : 0.45
  let close = addDays(NOW.toISOString().slice(0, 10), 60), closeConf = 0.4
  const m = t.toLowerCase().match(new RegExp(`(?:\\b(mid|end of|early)[ -])?\\b(${months.join("|")})\\b(?:\\s+(\\d{1,2})\\b)?`))
  if (m) {
    const mi = months.indexOf(m[2])
    const year = mi < NOW.getMonth() ? 2027 : 2026
    const day = m[3] ? +m[3] : m[1]?.startsWith("mid") ? 15 : m[1] === "early" ? 5 : new Date(year, mi + 1, 0).getDate()
    close = `${year}-${String(mi + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    closeConf = m[3] ? 0.9 : 0.62
  }
  const acct = t.match(/\b(?:at|from|with)\s+([A-Z][\w&'-]*(?:\s+[A-Z][\w&'-]*){0,3})/) ?? text.match(/\n([A-Z][\w&'-]*(?:\s+[A-Z][\w&'-]*){1,3})\s*$/)
  const sig = text.match(/\n([A-Z][a-z]+ [A-Z][a-z]+),\s*([A-Za-z ]+)\n/)
  const who = sig ?? t.match(/([A-Z][a-z]+ [A-Z][a-z]+),\s*([A-Z][A-Za-z ]+?)(?=\s+(?:at|from)\b|[.,])/)
  return {
    account: acct ? f(acct[1].trim(), 0.95) : f("", 0.2),
    contact: who ? f(`${who[1]}, ${who[2].trim()}`, 0.92) : f("", 0.3),
    product: f(prod, prodConf),
    value: value ? f(String(value), /around|about|approx/i.test(t) ? 0.86 : 0.95) : f("", 0.3),
    close: f(close, closeConf),
  }
}

export function Register({ leadId }: { leadId?: string }) {
  const { state, dispatch } = useStore()
  const { me, isExec } = usePartner()
  const lead = state.leads.find((l) => l.id === leadId && l.partnerId === company.id)
  const [mode, setMode] = useState<"chat" | "email">("chat")
  const [text, setText] = useState("")
  // A lead from Brightline already carries the customer and contact, so it starts at the check step.
  const [step, setStep] = useState<"describe" | "reading" | "check" | "deciding" | "done">(lead ? "check" : "describe")
  const [fields, setFields] = useState<Fields | null>(() =>
    lead
      ? {
          account: f(lead.company, 0.99),
          contact: f(`${lead.contact}, ${lead.title}`, 0.99),
          product: f(lead.product === "Platform" ? "Platform · Standard" : "Analytics · Standard", 0.7),
          value: f(String(lead.estValue), 0.75),
          close: f(addDays(NOW.toISOString().slice(0, 10), 75), 0.5),
        }
      : null,
  )
  const [rep, setRep] = useState(lead?.assignee ?? me.name)
  const [newId, setNewId] = useState<string | null>(null)

  const canRegister = state.team.filter((m) => m.canRegister && m.status === "active")
  // The auto-approve limit comes from Ridgeway's program rules, so a change the channel chief approves applies here.
  const LIMIT = ruleLimit(state.programRules[company.program as ProgramId], company.tier)
  const toConfirm = fields ? (Object.keys(fields) as (keyof Fields)[]).filter((k) => !fields[k].confirmed || !fields[k].value) : []
  const value = fields ? Number(fields.value.value) || 0 : 0

  const conflict = useMemo(() => {
    if (!fields?.account.value) return null
    const a = fields.account.value.trim().toLowerCase()
    if (state.registrations.some((r) => r.partnerId === company.id && r.customer.toLowerCase() === a && ["under_review", "info_requested", "approved"].includes(r.state))) return "duplicate" as const
    if (state.registrations.some((r) => r.partnerId !== company.id && r.customer.toLowerCase() === a) || state.opportunities.some((o) => o.account.toLowerCase() === a)) return "conflict" as const
    return null
  }, [fields, state.registrations, state.opportunities])

  const checks: CheckT[] = fields
    ? [
        { label: "Partner eligible", status: "pass", detail: `${company.name} · ${company.tier} ${company.program.toLowerCase()} partner` },
        { label: "Onboarding complete", status: "pass", detail: "Agreements and documents on file" },
        { label: "Product authorised", status: "pass", detail: fields.product.value },
        { label: "Territory", status: "pass", detail: company.region },
        conflict ? { label: "Conflict check", status: "warn", detail: conflict === "duplicate" ? "Ridgeway may have registered this customer already" : "May overlap with a deal already in progress" } : { label: "Conflict check", status: "pass", detail: "No overlapping deals found" },
        value > LIMIT ? { label: "Deal size", status: "warn", detail: `Over the ${money(LIMIT)} auto-approve limit, so Jordan decides` } : { label: "Deal size", status: "pass", detail: `Within the ${money(LIMIT)} auto-approve limit` },
      ]
    : []
  const willAuto = !!fields && !conflict && value > 0 && value <= LIMIT

  const set = (k: keyof Fields, v: string) => setFields((x) => x && { ...x, [k]: { value: v, confidence: 1, confirmed: true } })
  const confirm = (k: keyof Fields) => setFields((x) => x && { ...x, [k]: { ...x[k], confirmed: true } })

  const read = () => {
    setStep("reading")
    setTimeout(() => { setFields(extract(text)); setStep("check") }, 900)
  }

  const submit = () => {
    if (!fields) return
    setStep("deciding")
    const num = Math.max(...state.registrations.map((r) => Number(r.id.replace("REG-", "")) || 0)) + 1
    const id = `REG-${num}`
    const reasons: ReviewReason[] = [...(conflict ? [conflict] : []), ...(value > LIMIT ? (["over_limit"] as const) : [])]
    const seconds = 32 + Math.floor(Math.random() * 14)
    const at = NOW.toISOString()
    const source = lead ? "Brightline lead" : mode === "email" ? "Forwarded email" : "Chat with PartnerAssistant"
    const ai: AiAdvice | undefined = willAuto ? undefined : conflict
      ? { action: "request_info", headline: "Ask Ridgeway who they've met and when", confidence: 0.7, infoNeeded: ["First meeting date", "Who they've spoken to"], evidence: ["The customer matches an existing record.", "Ridgeway's partner quality is 0.86."] }
      : { action: "approve", headline: "Approve: clean deal, only held back by size", confidence: 0.9, evidence: ["No conflicts in Salesforce or other partners' registrations.", "Every field was confirmed by the partner.", "Ridgeway has won 4 deals with Brightline this year."] }
    const reg: Registration = {
      id, partnerId: company.id, rep, customer: fields.account.value.trim(), product: fields.product.value, value, closeDate: fields.close.value,
      submittedAt: at, program: "Reseller", state: willAuto ? "approved" : "under_review", slaHours: reviewHoursFor(state.programRules[company.program as ProgramId], value), usedHours: 0, reasons,
      checks, conflict: undefined, ai,
      prefill: (Object.keys(fields) as (keyof Fields)[]).map((k) => ({ label: labels[k], value: k === "value" ? money(value) : k === "close" ? date(fields.close.value) : fields[k].value, confidence: fields[k].confidence, source })),
      note: lead ? `From Brightline lead ${lead.id}. ${lead.update ?? ""}` : text.trim(),
      ...(willAuto
        ? { decision: { by: "rules" as const, action: "approved" as const, at, seconds }, crm: { opportunityId: `006Q80000${num}New`, role: "Reseller", sync: "pending" as const, linked: "new" as const }, protectedUntil: addDays(at.slice(0, 10), 90), crmStage: "Discovery" }
        : {}),
    }
    setTimeout(() => {
      dispatch({ type: "partnerRegister", reg, leadId: lead?.id, by: me.name })
      setNewId(id)
      setStep("done")
    }, 1600)
  }

  if (step === "done" && newId) return <Result id={newId} onAgain={() => { setText(""); setFields(null); setNewId(null); setStep("describe"); go("/p/register") }} />

  return (
    <div className="mx-auto max-w-[880px]">
      <PageHeader title="Register a deal" sub={`Three taps: describe it, check what AI filled in, submit. Clean deals up to ${money(LIMIT)} are decided in about a minute.`} back={{ label: "Home", href: "/p/home" }} />
      <ol className="mb-6 grid grid-cols-3 gap-2" aria-label="Steps">
        {["Describe it", "Check the details", "Submit"].map((s, i) => {
          const at = step === "describe" || step === "reading" ? 0 : step === "check" ? 1 : 2
          return (
            <li key={s} className={cn("flex items-center gap-2 rounded-[12px] border px-3 py-2.5 text-[14.5px] font-semibold", i === at ? "border-primary bg-brand-soft/50 text-primary" : i < at ? "text-ok" : "text-muted-foreground")}>
              <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-[13px]", i < at ? "bg-ok text-white" : i === at ? "bg-primary text-primary-foreground" : "bg-muted")}>{i < at ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}</span>
              <span className="truncate">{s}</span>
            </li>
          )
        })}
      </ol>

      {(step === "describe" || step === "reading") && (
        <Panel>
          <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="How to register">
            {([["chat", "Describe it", <MessageSquareText key="c" className="size-4" />], ["email", "Paste an email", <Mail key="m" className="size-4" />]] as const).map(([k, l, icon]) => (
              <button key={k} role="tab" aria-selected={mode === k} onClick={() => setMode(k)} className={cn("inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[15px] font-medium", mode === k ? "border-primary bg-brand-soft text-primary" : "bg-card text-foreground hover:border-border-strong")}>{icon}{l}</button>
            ))}
            {[["Voice", <Mic key="v" className="size-4" />], ["Photo of a card", <Camera key="p" className="size-4" />]].map(([l, icon]) => (
              <span key={l as string} className="inline-flex h-10 items-center gap-2 rounded-full border border-dashed px-4 text-[15px] text-muted-foreground">{icon}{l} · Stage 2</span>
            ))}
          </div>
          <Label htmlFor="deal-text" className="text-[15px]">{mode === "chat" ? "Tell us about the deal in your own words" : "Paste the customer's email"}</Label>
          <Textarea id="deal-text" value={text} onChange={(e) => setText(e.target.value)} rows={mode === "chat" ? 4 : 8} className="mt-2 bg-card text-[16px]" placeholder={mode === "chat" ? "Who's the customer, who did you meet, what do they want, roughly how much and when?" : "Paste the whole email, signature included."} />
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[14px] text-muted-foreground">
            <span>Try an example:</span>
            <button className="font-semibold text-primary hover:underline" onClick={() => { setMode("chat"); setText(examples.clean) }}>a clean deal</button>
            <span>·</span>
            <button className="font-semibold text-primary hover:underline" onClick={() => { setMode("email"); setText(examples.review) }}>a $85,000 email</button>
          </div>
          {isExec && (
            <div className="mt-5 grid gap-2 sm:max-w-sm">
              <Label className="text-[15px]">Registering for</Label>
              <Select value={rep} onValueChange={setRep}>
                <SelectTrigger className="h-11 bg-card text-[15.5px]"><SelectValue /></SelectTrigger>
                <SelectContent>{canRegister.map((m) => <SelectItem key={m.id} value={m.name}>{m.name}{m.name === me.name ? " (you)" : ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t pt-5">
            <Button size="lg" disabled={text.trim().length < 12 || step === "reading"} onClick={read}>
              {step === "reading" ? <Loader2 className="animate-spin" /> : <Wand2 />} {step === "reading" ? "Reading…" : "Fill in the details"}
            </Button>
            <span className="text-[14px] text-muted-foreground">AI fills the form. Nothing is sent until you submit.</span>
          </div>
        </Panel>
      )}

      {(step === "check" || step === "deciding") && fields && (
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <Panel title="Check the details" sub={toConfirm.length ? `${toConfirm.length} field${toConfirm.length > 1 ? "s" : ""} to confirm. Tap Confirm or edit them.` : "Everything is confirmed."} action={lead ? <Badge variant="secondary">From Brightline lead</Badge> : <Badge className="border-0 bg-brand-soft text-primary"><Sparkles className="size-3.5" /> Filled by AI</Badge>}>
            <div className="grid gap-4">
              {(Object.keys(fields) as (keyof Fields)[]).map((k) => {
                const fl = fields[k]
                const unsure = !fl.confirmed || !fl.value
                return (
                  <div key={k} className={cn("rounded-[12px] border p-3", unsure && "border-amber bg-amber-soft/40")}>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <Label htmlFor={`f-${k}`} className="text-[14.5px]">{labels[k]}</Label>
                      {unsure ? (
                        fl.value ? <Button size="sm" variant="outline" className="h-8 bg-card" onClick={() => confirm(k)}><Check /> Confirm</Button> : <span className="text-[13.5px] font-semibold text-amber-ink">Needed</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[13.5px] text-ok"><Check className="size-3.5" /> {fl.confidence === 1 ? "Confirmed" : `${Math.round(fl.confidence * 100)}% sure`}</span>
                      )}
                    </div>
                    {k === "product" ? (
                      <Select value={fl.value} onValueChange={(v) => set(k, v)}>
                        <SelectTrigger id={`f-${k}`} className="h-11 w-full bg-card text-[16px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{products.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Input id={`f-${k}`} type={k === "value" ? "number" : k === "close" ? "date" : "text"} value={fl.value} onChange={(e) => set(k, e.target.value)} className="h-11 bg-card text-[16px]" placeholder={k === "value" ? "e.g. 40000" : ""} />
                    )}
                    {unsure && fl.value && <p className="mt-1.5 text-[13.5px] text-amber-ink">Not sure about this one ({Math.round(fl.confidence * 100)}%). Please check it.</p>}
                  </div>
                )
              })}
            </div>
            <p className="mt-4 text-[14px] text-muted-foreground">Registered for <b className="text-foreground">{rep}</b> · role on the deal: <b className="text-foreground">Reseller</b> (from {company.name}'s program)</p>
          </Panel>
          <div className="space-y-6">
            <Panel title="Checks" sub="Run live against Brightline's CRM">
              <ul className="divide-y">
                {checks.map((c) => (
                  <li key={c.label} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                    <CheckIcon status={c.status} className="mt-0.5" />
                    <span className="min-w-0"><b className="block text-[15px] text-foreground">{c.label}</b><span className="text-[14px] text-muted-foreground">{c.detail}</span></span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel>
              <p className={cn("flex items-start gap-2.5 text-[15.5px] font-medium", willAuto ? "text-ok" : "text-foreground")}>
                {willAuto ? <Bot className="mt-0.5 size-5 shrink-0" /> : <UserCheck className="mt-0.5 size-5 shrink-0 text-primary" />}
                {willAuto ? "Every check passes, so the rules can approve this in about a minute." : `Jordan Lee will review this one within ${reviewHoursFor(state.programRules[company.program as ProgramId], value)} business hours${value > state.programRules[company.program as ProgramId].bigDealOver ? " (deals over $100,000 get longer)" : ""}.`}
              </p>
              <Button size="lg" className="mt-4 h-12 w-full text-[16px]" disabled={toConfirm.length > 0 || step === "deciding"} onClick={submit}>
                {step === "deciding" ? <><Loader2 className="animate-spin" /> Checking and deciding…</> : <>Submit registration <ArrowRight /></>}
              </Button>
              {toConfirm.length > 0 && <p className="mt-2 text-center text-[14px] text-muted-foreground">Confirm the highlighted fields first.</p>}
            </Panel>
          </div>
        </div>
      )}
    </div>
  )
}

function Result({ id, onAgain }: { id: string; onAgain: () => void }) {
  const { state } = useStore()
  const reg = state.registrations.find((r) => r.id === id)!
  const auto = reg.state === "approved"
  return (
    <div className="mx-auto max-w-[720px]">
      <Panel className={auto ? "border-ok/50" : "border-primary/40"}>
        <div className="flex flex-col items-center px-2 py-6 text-center">
          <span className={cn("grid size-16 place-items-center rounded-full", auto ? "bg-ok-soft text-ok" : "bg-brand-soft text-primary")}>{auto ? <ShieldCheck className="size-8" /> : <Clock3 className="size-8" />}</span>
          <h1 className="mt-4 text-[26px] font-bold">{auto ? `Approved by rules in ${reg.decision!.seconds} seconds` : "Sent to Jordan Lee for review"}</h1>
          <p className="mt-1.5 text-[16.5px] text-muted-foreground">{reg.customer} · {reg.product} · {money(reg.value)}</p>
        </div>
        <ul className="grid gap-3 border-t pt-5 sm:grid-cols-3">
          {(auto
            ? [
                ["Protected", `Until ${date(reg.protectedUntil!)} (90 days)`],
                ["Brightline's CRM", reg.crm?.sync === "synced" ? "Opportunity created, Ridgeway as Reseller" : "Creating the opportunity…"],
                ["Your credit", `100% as Reseller · ${money(reg.value)} expected`],
              ]
            : [
                ["Decision", `Within ${reg.slaHours} business hours · by ${time(NOW.toISOString())} ${reg.slaHours <= 8 ? "tomorrow" : `on ${date(addDays(NOW.toISOString().slice(0, 10), Math.ceil(reg.slaHours / 8)), { weekday: "long" })}`}`],
                ["Why a person", reg.reasons.includes("over_limit") ? `Over the ${money(ruleLimit(state.programRules[company.program as ProgramId], company.tier))} auto-approve limit` : "It may overlap with a deal in progress"],
                ["What's next", "We'll notify you the moment Jordan decides"],
              ]).map(([k, v]) => (
            <li key={k} className="rounded-[12px] bg-muted/60 px-4 py-3">
              <p className="text-[13.5px] font-semibold text-muted-foreground">{k}</p>
              <p className="mt-0.5 text-[15px] font-medium text-foreground">{v}</p>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button size="lg" onClick={() => go(`/p/deal/${reg.id}`)}>Open the deal <ArrowRight /></Button>
          <Button size="lg" variant="outline" onClick={() => go("/p/deals/all")}>See it in your deals</Button>
          <Button size="lg" variant="ghost" onClick={onAgain}>Register another</Button>
        </div>
      </Panel>
      <p className="mt-4 text-center text-[14px] text-muted-foreground">{auto ? "Acknowledged and decided inside the 60-second promise." : "Acknowledged within 60 seconds with the reviewer and the deadline, as promised."}</p>
    </div>
  )
}
