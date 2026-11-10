import { useState, type ReactNode } from "react"
import { ArrowRight, Bell, Check, CheckCircle2, ChevronRight, Inbox, Lightbulb, ShieldAlert, X } from "lucide-react"
import { toast } from "sonner"
import { AiTag, CheckList, Confidence, DecisionOption, EmptyState, PageHeader, PageTabs, Panel, PartnerAvatar, SlaMeter } from "@/components/common"
import { ShareBar, shareColors } from "@/screens/Credit"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { rejectReasons, reviewReasonLabel, type Tier } from "@/data/model"
import { ago, date, money, shortDate } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { kindLabel, useApprovals, useRevenue, type Approval } from "@/chief/useChief"
import { kindIcon, toneTile } from "@/chief/screens/Home"
import { campaignStats, mdfSummary } from "@/partner/useMarketing"
import { FundsBar } from "@/partner/screens/mkt/Funds"

type Tab = "all" | "deal" | "split" | "extension" | "application" | "funds" | "rules" | "done"

// Fixed columns so every row lines up under the header: icon, request, type and sender, value, status, chevron.
const approvalCols = "md:grid-cols-[40px_minmax(0,1fr)_200px_110px_130px_20px]"

export function Approvals({ tab }: { tab?: string }) {
  const approvals = useApprovals()
  const { state } = useStore()
  const t = (["all", "deal", "split", "extension", "application", "funds", "rules", "done"].includes(tab ?? "") ? tab : "all") as Tab
  const match = (a: Approval) => t === "all" || a.kind === t || (t === "rules" && (a.kind === "rule" || a.kind === "autonomy"))
  const rows = approvals.filter(match)
  const n = (k: Tab) => approvals.filter((a) => k === "all" || a.kind === k || (k === "rules" && (a.kind === "rule" || a.kind === "autonomy"))).length
  const done = state.chiefFeed.filter((f) => f.text.startsWith("You "))

  return (
    <div>
      <PageHeader title="Approvals" sub="Everything partner managers, RevOps and the AI supervisor send to you. Most can also be approved from Slack or email." />
      <PageTabs
        label="Approval types"
        value={t}
        onChange={(v) => go(`/c/approvals/${v}`)}
        items={[
          { value: "all", label: "All waiting", icon: <Inbox />, count: n("all"), tone: "action" },
          { value: "deal", label: "Escalated deals", count: n("deal"), hint: "Registrations past 80% of their review deadline. You can decide them yourself or ask the partner manager to." },
          { value: "split", label: "Credit splits", count: n("split"), hint: "Overrides of the program's credit model. A partner manager can't approve their own proposal." },
          { value: "extension", label: "Extensions", count: n("extension"), hint: "Second protection extensions. The partner manager decides the first one." },
          { value: "application", label: "Applications", count: n("application"), hint: "Companies a partner manager escalated: unusual tiers, territories or regions." },
          { value: "funds", label: "Funds", count: n("funds"), hint: "Marketing development funds (MDF): partner requests before a campaign and claims after it. Money always needs a person (R-APR-4)." },
          { value: "rules", label: "Rules and AI", count: n("rules"), hint: "Changes to program rules and AI agent autonomy." },
          { value: "done", label: "Decided", icon: <CheckCircle2 />, count: done.length },
        ]}
      />
      {t === "done" ? (
        <Panel bodyClass="p-0 sm:p-0">
          {done.length === 0 ? <EmptyState title="Nothing decided yet" body="Your decisions show here with what happened next." /> : (
            <ul>{done.map((f) => (
              <li key={f.id} className="flex items-center gap-3 border-b px-5 py-4 last:border-0 sm:px-6">
                <span className="grid size-9 place-items-center rounded-full bg-ok-soft text-ok"><Check className="size-4" /></span>
                <span className="min-w-0 flex-1 text-foreground">{f.text}</span>
                <span className="text-[14px] text-muted-foreground">{ago(f.at)}</span>
              </li>
            ))}</ul>
          )}
        </Panel>
      ) : (
        <Panel bodyClass="p-0 sm:p-0">
          {rows.length === 0 ? <EmptyState title="Nothing waiting here" body="New requests show up here and in your notifications." /> : (
            <ul>
              <li aria-hidden className={cn("hidden gap-x-4 border-b bg-surface-2/60 px-6 py-3 text-[14px] font-medium text-muted-foreground md:grid", approvalCols)}>
                <span /><span>Request</span><span>Type and sender</span><span className="text-right">Value</span><span>Status</span><span />
              </li>
              {rows.map((a) => (
                <li key={a.id} className="border-b last:border-0">
                  <a href={`#/c/approval/${a.id}`} className={cn("grid grid-cols-[40px_minmax(0,1fr)] items-center gap-x-4 gap-y-2 px-5 py-4 hover:bg-muted/50 sm:px-6", approvalCols)}>
                    <span className={cn("row-span-2 grid size-10 place-items-center self-start rounded-[10px] md:row-span-1 md:self-center [&_svg]:size-5", toneTile[a.tone])}>{kindIcon[a.kind]}</span>
                    <span className="min-w-0">
                      <b className="block text-[16px] leading-snug text-foreground md:truncate">{a.title}</b>
                      <span className="block truncate text-[14px] text-muted-foreground">{a.sub}</span>
                    </span>
                    <span className="hidden min-w-0 text-[14.5px] md:block">
                      <span className="block truncate text-foreground">{kindLabel[a.kind]}</span>
                      <span className="block truncate text-muted-foreground">from {a.from}</span>
                    </span>
                    <span className="hidden text-right text-[16px] font-semibold text-foreground tabular md:block">{a.value ? money(a.value) : <span className="font-normal text-muted-foreground">—</span>}</span>
                    <span className="col-start-2 justify-self-start md:col-start-auto"><Badge variant="secondary" className={cn(a.tone === "bad" && "bg-bad-soft text-bad")}>{a.tag}</Badge></span>
                    <ChevronRight className="hidden size-5 text-muted-foreground md:block" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </div>
  )
}

/* ---------- one approval ---------- */

function Decide({ children, ready, label, onSubmit, tone }: { children: ReactNode; ready: boolean; label: string; onSubmit: () => void; tone: "ok" | "bad" | "primary" | null }) {
  return (
    <Panel title="Your decision" className="xl:sticky xl:top-[92px]">
      <div className="grid gap-2.5" role="radiogroup">{children}</div>
      <Button size="lg" className={cn("mt-5 h-12 w-full text-[16px]", tone === "ok" && "bg-ok text-white hover:bg-ok/90", tone === "bad" && "bg-bad text-white hover:bg-bad/90")} disabled={!ready} onClick={onSubmit}>{label}</Button>
      <p className="mt-2 text-center text-[13.5px] text-muted-foreground">Logged with your name. Everyone affected is told why.</p>
    </Panel>
  )
}

function Done({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <PageHeader title={title} back={{ label: "Approvals", href: "/c/approvals" }} />
      <Panel><EmptyState title="No longer waiting for you" body={body} action={<Button variant="outline" onClick={() => go("/c/approvals")}>Back to approvals</Button>} /></Panel>
    </div>
  )
}

function AiCard({ headline, confidence, evidence, who = "Deal Desk agent" }: { headline: string; confidence: number; evidence: string[]; who?: string }) {
  return (
    <Panel className="border-primary/30 bg-brand-soft/25">
      <div className="flex flex-wrap items-center justify-between gap-2"><AiTag>{who}</AiTag><Confidence value={confidence} /></div>
      <p className="mt-2 text-[18px] font-semibold text-foreground">{headline}</p>
      <ul className="mt-3 space-y-1.5">{evidence.map((e) => <li key={e} className="flex gap-2.5 text-[15px]"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />{e}</li>)}</ul>
    </Panel>
  )
}

function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {rows.map(([k, v]) => <div key={k}><dt className="text-[14px] text-muted-foreground">{k}</dt><dd className="font-medium text-foreground">{v}</dd></div>)}
    </dl>
  )
}

function DealApproval({ id }: { id: string }) {
  const { state, dispatch, partner } = useStore()
  const r = state.registrations.find((x) => x.id === id)
  const [choice, setChoice] = useState<"approve" | "reject" | "nudge" | null>(r?.ai?.action === "approve" ? "approve" : null)
  const [code, setCode] = useState(rejectReasons[0].label)
  const [msg, setMsg] = useState("")
  if (!r || r.state !== "under_review") return <Done title={r?.customer ?? "Deal"} body={r ? `It was ${r.state.replace("_", " ")}${r.decision?.actor ? ` by ${r.decision.actor}` : ""}.` : "We couldn't find it."} />
  const p = partner(r.partnerId)!
  const submit = () => {
    dispatch({ type: "chiefDeal", id: r.id, action: choice!, reason: choice === "reject" ? code : undefined, message: msg.trim() || undefined })
    toast.success(choice === "approve" ? `Approved ${r.customer}` : choice === "reject" ? `Rejected ${r.customer}` : "Jordan Lee asked to decide today", { description: choice === "nudge" ? "Sent in Slack and email. It stays on your list until it's decided." : `${p.name} and Jordan were told in under a second.` })
    if (choice !== "nudge") go("/c/approvals/done")
  }
  return (
    <div>
      <PageHeader back={{ label: "Approvals", href: "/c/approvals" }} title={<span className="flex flex-wrap items-center gap-3">{r.customer} <Badge className="border-0 bg-bad-soft text-bad">Escalated to you</Badge></span>} sub={<>{p.name} · {r.product} · <b className="text-foreground">{money(r.value)}</b> · registered by {r.rep}</>} />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title="Why it's with you" sub="Jordan Lee hasn't decided it, and it has passed 80% of its review deadline (R-SLA-3). At 100% it's reassigned.">
            <SlaMeter reg={r} size="lg" />
            <ul className="mt-5 space-y-1.5">{r.reasons.map((x) => <li key={x} className="flex gap-2.5 text-[15.5px] text-foreground"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-amber-ink" />Held back because: {reviewReasonLabel[x]}</li>)}</ul>
          </Panel>
          {r.ai && <AiCard headline={r.ai.headline} confidence={r.ai.confidence} evidence={r.ai.evidence} />}
          <Panel title="Automatic checks"><CheckList checks={r.checks} /></Panel>
          <Panel title="What the partner said"><p className="text-[15.5px] text-foreground">{r.note}</p></Panel>
        </div>
        <Decide ready={!!choice && (choice !== "reject" || !!code)} tone={choice === "approve" ? "ok" : choice === "reject" ? "bad" : choice ? "primary" : null} label={choice === "approve" ? "Approve and protect for 90 days" : choice === "reject" ? "Reject with reason" : choice === "nudge" ? "Ask Jordan to decide today" : "Choose an option"} onSubmit={submit}>
          <DecisionOption active={choice === "approve"} tone="ok" onClick={() => setChoice("approve")} icon={<Check />} label="Approve" sub="Creates the Salesforce opportunity and protects the deal" suggested={r.ai?.action === "approve"} />
          <DecisionOption active={choice === "reject"} tone="bad" onClick={() => setChoice("reject")} icon={<X />} label="Reject" sub="The partner sees the reason code and why" />
          <DecisionOption active={choice === "nudge"} tone="primary" onClick={() => setChoice("nudge")} icon={<Bell />} label="Leave it with Jordan" sub="Sends Jordan a nudge to decide today" />
          {choice === "reject" && (
            <Select value={code} onValueChange={setCode}>
              <SelectTrigger className="h-11 w-full text-[15.5px]"><SelectValue /></SelectTrigger>
              <SelectContent>{rejectReasons.filter((x) => x.code !== "other").map((x) => <SelectItem key={x.code} value={x.label}>{x.label}</SelectItem>)}</SelectContent>
            </Select>
          )}
          {choice && <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} className="text-[15.5px]" placeholder={choice === "nudge" ? "Optional note to Jordan" : "Optional note to the partner"} />}
        </Decide>
      </div>
    </div>
  )
}

function SplitApproval({ id }: { id: string }) {
  const { state, dispatch, partner } = useStore()
  const o = state.opportunities.find((x) => x.id === id)
  const [choice, setChoice] = useState<"approve" | "decline" | null>(null)
  const [why, setWhy] = useState("")
  if (!o || !o.proposal) return <Done title={o?.account ?? "Credit split"} body={o?.proposalOutcome ? `You ${o.proposalOutcome.approved ? "approved" : "declined"} it ${ago(o.proposalOutcome.at)}.` : "The proposal was withdrawn."} />
  const p = o.proposal
  const submit = () => {
    dispatch({ type: "chiefSplit", oppId: o.id, approve: choice === "approve", reason: why.trim() || undefined })
    toast.success(choice === "approve" ? `New split on ${o.account} is live` : "Proposal declined", { description: choice === "approve" ? "Saved as a new version. Each partner was told its own new share and why." : "Jordan sees your reason. The current split stays." })
    go("/c/approvals/done")
  }
  return (
    <div>
      <PageHeader back={{ label: "Approvals", href: "/c/approvals" }} title={`${o.account} · credit split change`} sub={<>{money(o.value)} · {o.stage} · proposed by Jordan Lee {ago(p.at)}</>} />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title="Current split and proposed split" sub="Value counts once. Each partner only ever sees its own share.">
            <p className="mb-1.5 text-[14px] font-semibold text-muted-foreground">Now · program model</p>
            <ShareBar lines={o.lines} />
            <p className="mt-4 mb-1.5 text-[14px] font-semibold text-muted-foreground">Proposed</p>
            <ShareBar lines={p.lines} />
            <ul className="mt-5 divide-y">
              {p.lines.map((l, i) => {
                const before = o.lines.find((x) => x.partnerId === l.partnerId)?.share ?? 0
                const delta = l.share - before
                return (
                  <li key={l.partnerId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className={cn("size-3 rounded-full", shareColors[i % shareColors.length])} />
                    <PartnerAvatar name={partner(l.partnerId)?.name ?? l.partnerId} size="sm" />
                    <span className="min-w-0 flex-1"><b className="block text-foreground">{partner(l.partnerId)?.name}</b><span className="text-[14px] text-muted-foreground">{l.role}</span></span>
                    <span className="text-right tabular"><span className="text-muted-foreground">{before}% → </span><b className="text-foreground">{l.share}%</b><span className={cn("block text-[13.5px] font-semibold", delta > 0 ? "text-ok" : "text-bad")}>{delta > 0 ? "+" : ""}{delta} pts · {money(Math.round((o.value * delta) / 100))}</span></span>
                  </li>
                )
              })}
            </ul>
          </Panel>
          <Panel title="Jordan's reason">
            <p className="text-[16px] text-foreground">"{p.reason}"</p>
            <div className="mt-3 flex flex-wrap gap-2">{p.evidence.map((e) => <Badge key={e} variant="secondary">{e}</Badge>)}</div>
          </Panel>
          <Panel title="What each partner did">
            <ol className="space-y-3">{o.touches.map((t) => <li key={t.id} className="flex gap-3 text-[15px]"><span className="w-20 shrink-0 text-muted-foreground">{shortDate(t.at)}</span><span className="text-foreground"><b>{partner(t.partnerId)?.name}</b> · {t.kind}: {t.text}</span></li>)}</ol>
          </Panel>
        </div>
        <Decide ready={!!choice && (choice === "approve" || !!why.trim())} tone={choice === "approve" ? "ok" : choice === "decline" ? "bad" : null} label={choice === "approve" ? "Approve the new split" : choice === "decline" ? "Decline with reason" : "Choose an option"} onSubmit={submit}>
          <DecisionOption active={choice === "approve"} tone="ok" onClick={() => setChoice("approve")} icon={<Check />} label="Approve" sub={`Becomes version ${o.versions.length + 1}; the old split stays in history`} suggested />
          <DecisionOption active={choice === "decline"} tone="bad" onClick={() => setChoice("decline")} icon={<X />} label="Decline" sub="The program model split stays in force" />
          {choice && <Textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={3} className="text-[15.5px]" placeholder={choice === "decline" ? "Why? Jordan sees this." : "Optional note for the version history"} />}
        </Decide>
      </div>
    </div>
  )
}

function ExtensionApproval({ id }: { id: string }) {
  const { state, dispatch, partner } = useStore()
  const e = state.extensions.find((x) => x.id === id)
  const [choice, setChoice] = useState<"grant" | "deny" | null>(e?.ai.action === "deny" ? "deny" : null)
  const [days, setDays] = useState(30)
  const [why, setWhy] = useState("")
  if (!e || e.status !== "pending") return <Done title={e?.customer ?? "Extension"} body={e ? `It was ${e.status}.` : "We couldn't find it."} />
  const p = partner(e.partnerId)!
  const submit = () => {
    dispatch({ type: "chiefExtension", id: e.id, grant: choice === "grant", days: choice === "grant" ? days : undefined, reason: choice === "deny" ? why.trim() || "No recent customer activity" : undefined })
    toast.success(choice === "grant" ? `${e.customer}: ${days} more days` : `Extension declined for ${e.customer}`, { description: `${p.name} and Jordan were told why.` })
    go("/c/approvals/done")
  }
  return (
    <div>
      <PageHeader back={{ label: "Approvals", href: "/c/approvals" }} title={<span className="flex flex-wrap items-center gap-3">{e.customer} <Badge className="border-0 bg-amber-soft text-amber-ink">Second extension</Badge></span>} sub={<>{p.name} · {money(e.value)} · protection ends {date(e.protectionEnds)} ({e.daysLeft} days)</>} />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title="The partner's request" sub="A partner manager decides the first extension. A second one needs you (R-REG-11).">
            <blockquote className="rounded-[12px] bg-muted/60 px-4 py-3 text-[16px] text-foreground">"{e.reason}"</blockquote>
            <div className="mt-4"><Facts rows={[["Asks for", `${e.requestedDays} more days`], ["Stage in Salesforce", e.crmStage], ["Last customer activity", e.lastActivity], ["Earlier extensions", `${e.previousExtensions}`]]} /></div>
          </Panel>
          <AiCard headline={e.ai.headline} confidence={e.ai.confidence} evidence={e.ai.evidence} />
        </div>
        <Decide ready={!!choice} tone={choice === "grant" ? "ok" : choice === "deny" ? "bad" : null} label={choice === "grant" ? `Grant ${days} days` : choice === "deny" ? "Decline the extension" : "Choose an option"} onSubmit={submit}>
          <DecisionOption active={choice === "grant"} tone="ok" onClick={() => setChoice("grant")} icon={<Check />} label="Grant" sub="Protection moves out; no other partner can register it" suggested={e.ai.action === "grant"} />
          <DecisionOption active={choice === "deny"} tone="bad" onClick={() => setChoice("deny")} icon={<X />} label="Decline" sub="Protection ends on schedule; the partner can register again later" suggested={e.ai.action === "deny"} />
          {choice === "grant" && (
            <div className="grid grid-cols-3 gap-2">{[30, 60, 90].map((n) => <button key={n} type="button" onClick={() => setDays(n)} className={cn("h-11 rounded-[12px] border-2 text-[15.5px] font-semibold", days === n ? "border-ok bg-ok-soft/50 text-ok" : "border-border text-foreground")}>+{n} days</button>)}</div>
          )}
          {choice === "deny" && <Textarea value={why} onChange={(ev) => setWhy(ev.target.value)} rows={3} className="text-[15.5px]" placeholder="Reason the partner sees (optional)" />}
        </Decide>
      </div>
    </div>
  )
}

function ApplicationApproval({ id }: { id: string }) {
  const { state, dispatch } = useStore()
  const a = state.applications.find((x) => x.id === id)
  const [choice, setChoice] = useState<"accept" | "decline" | null>(null)
  const [tier, setTier] = useState<Tier>("Gold")
  const [why, setWhy] = useState("")
  if (!a || a.status !== "escalated") return <Done title={a?.company ?? "Application"} body={a ? `It was ${a.status}.` : "We couldn't find it."} />
  const submit = () => {
    dispatch({ type: "chiefApp", id: a.id, accept: choice === "accept", tier, reason: why.trim() || undefined })
    toast.success(choice === "accept" ? `${a.company} accepted at ${tier}` : `${a.company} declined`, { description: choice === "accept" ? "The partner agreement went out. Jordan Lee runs onboarding." : "They get your reason by email." })
    go("/c/approvals/done")
  }
  return (
    <div>
      <PageHeader back={{ label: "Approvals", href: "/c/approvals" }} title={<span className="flex flex-wrap items-center gap-3">{a.company} <Badge className="border-0 bg-brand-soft text-primary">Escalated by Jordan Lee</Badge></span>} sub={<>{a.program} program · {a.hq} · {a.employees} people · applied {ago(a.appliedAt)}</>} />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {a.outcomeNote && <Panel className="border-primary/30 bg-brand-soft/25"><p className="flex gap-2.5 text-[16px] text-foreground"><Lightbulb className="mt-0.5 size-5 shrink-0 text-primary" />{a.outcomeNote}</p></Panel>}
          <Panel title="What they told us"><p className="text-[15.5px] text-foreground">"{a.message}"</p><p className="mt-2 text-[14.5px] text-muted-foreground">{a.applicant.name}, {a.applicant.title} · {a.website}</p></Panel>
          <Panel title="Checks"><CheckList checks={a.checks} /></Panel>
        </div>
        <Decide ready={!!choice && (choice === "accept" || !!why.trim())} tone={choice === "accept" ? "ok" : choice === "decline" ? "bad" : null} label={choice === "accept" ? `Accept at ${tier}` : choice === "decline" ? "Decline with reason" : "Choose an option"} onSubmit={submit}>
          <DecisionOption active={choice === "accept"} tone="ok" onClick={() => setChoice("accept")} icon={<Check />} label="Accept" sub="Pick the starting tier; onboarding starts with Jordan" suggested />
          <DecisionOption active={choice === "decline"} tone="bad" onClick={() => setChoice("decline")} icon={<X />} label="Decline" sub="They're told why and can reapply in 6 months" />
          {choice === "accept" && (
            <div className="grid gap-1.5">
              <Label className="text-[14.5px]">Starting tier</Label>
              <Select value={tier} onValueChange={(v) => setTier(v as Tier)}>
                <SelectTrigger className="h-11 w-full text-[15.5px]"><SelectValue /></SelectTrigger>
                <SelectContent>{(["Registered", "Silver", "Gold", "Platinum"] as Tier[]).map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
              {tier === "Platinum" && <p className="flex gap-2 text-[13.5px] text-amber-ink"><ShieldAlert className="mt-0.5 size-4 shrink-0" /> Platinum is normally earned. The program doesn't offer exclusive territories.</p>}
            </div>
          )}
          {choice && <Textarea value={why} onChange={(ev) => setWhy(ev.target.value)} rows={3} className="text-[15.5px]" placeholder={choice === "decline" ? "Reason they'll see" : "Optional note to Jordan"} />}
        </Decide>
      </div>
    </div>
  )
}

function RequestApproval({ id }: { id: string }) {
  const { state, dispatch } = useStore()
  const rev = useRevenue()
  const r = state.requests.find((x) => x.id === id)
  const members = r ? rev.all.filter((p) => r.programs === "all" || r.programs.includes(p.program as never)) : []
  const managers = [...new Set(members.map((p) => p.manager))].filter((m) => m !== "Not assigned")
  const scope = r ? (r.programs === "all" ? "every program" : r.programs.map((p) => `the ${p} program`).join(", ")) : ""
  const [choice, setChoice] = useState<"approve" | "decline" | null>(null)
  const [note, setNote] = useState("")
  if (!r || r.status !== "pending") return <Done title={r?.title ?? "Request"} body={r ? `You ${r.status} it.` : "We couldn't find it."} />
  const submit = () => {
    dispatch({ type: "chiefRequest", id: r.id, approve: choice === "approve", note: note.trim() || undefined })
    toast.success(choice === "approve" ? "Change approved" : "Change declined", { description: choice === "approve" ? (r.kind === "autonomy" ? "The Deal Desk agent moves to A4 within its limits, in every program. You can pause it any time." : `New rules version for ${scope}. It applies to registrations from now on, whoever looks after the partner.`) : `${r.from} sees your reason.` })
    go("/c/program")
  }
  return (
    <div>
      <PageHeader back={{ label: "Approvals", href: "/c/approvals" }} title={r.title} sub={<>{r.kind === "rule" ? "Program rule change" : "AI autonomy change"} · from {r.from} ({r.fromRole}) · {ago(r.at)}</>} />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title="Applies to" sub="Rules belong to a program, not to a partner manager">
            <div className="flex flex-wrap gap-2">{(r.programs === "all" ? ["All programs"] : r.programs.map((p) => `${p} program`)).map((p) => <Badge key={p} className="border-0 bg-brand-soft text-primary">{p}</Badge>)}</div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["Partners affected", String(members.length)],
                ["Partner managers", managers.join(", ") || "—"],
                ["Rules version", r.kind === "rule" && r.programs !== "all" ? r.programs.map((p) => `${p}: v${state.programRules[p].version} → v${state.programRules[p].version + 1}`).join(" · ") : "Agent setting, not a rule version"],
              ].map(([k, v]) => <div key={k} className="rounded-[12px] bg-muted/60 px-4 py-3"><dt className="text-[13.5px] text-muted-foreground">{k}</dt><dd className="font-semibold text-foreground">{v}</dd></div>)}
            </dl>
            <p className="mt-3 text-[14.5px] text-muted-foreground">Once approved it applies to every partner in {r.programs === "all" ? "every program" : "the program"}, whichever partner manager looks after them. Partner managers are told; they can't change rules.</p>
          </Panel>
          <Panel title="What changes">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div className="rounded-[12px] bg-muted px-4 py-3"><p className="text-[13.5px] font-semibold text-muted-foreground">Now</p><p className="text-[15.5px] text-foreground">{r.current}</p></div>
              <ArrowRight className="hidden size-5 text-primary sm:block" />
              <div className="rounded-[12px] bg-brand-soft/60 px-4 py-3"><p className="text-[13.5px] font-semibold text-primary">Proposed</p><p className="text-[15.5px] font-medium text-foreground">{r.proposed}</p></div>
            </div>
          </Panel>
          <Panel title="Why"><p className="text-[16px] text-foreground">{r.why}</p></Panel>
          <Panel title="What it means">
            <ul className="space-y-2">{r.impact.map((x) => <li key={x} className="flex gap-2.5 text-[15.5px] text-foreground"><Check className="mt-1 size-4 shrink-0 text-ok" />{x}</li>)}</ul>
            {r.guardrail && <p className="mt-4 flex gap-2 rounded-[12px] bg-amber-soft/60 px-4 py-3 text-[15px] text-foreground"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-ink" />{r.guardrail}</p>}
          </Panel>
        </div>
        <Decide ready={!!choice && (choice === "approve" || !!note.trim())} tone={choice === "approve" ? "ok" : choice === "decline" ? "bad" : null} label={choice === "approve" ? "Approve the change" : choice === "decline" ? "Decline with reason" : "Choose an option"} onSubmit={submit}>
          <DecisionOption active={choice === "approve"} tone="ok" onClick={() => setChoice("approve")} icon={<Check />} label="Approve" sub="Applies from now on and is logged; you can reverse it" />
          <DecisionOption active={choice === "decline"} tone="bad" onClick={() => setChoice("decline")} icon={<X />} label="Decline" sub="Nothing changes" />
          {choice && <Textarea value={note} onChange={(ev) => setNote(ev.target.value)} rows={3} className="text-[15.5px]" placeholder={choice === "decline" ? `Why? ${r.from} sees this.` : "Optional note"} />}
        </Decide>
      </div>
    </div>
  )
}

function FundsApproval({ id }: { id: string }) {
  const { state, dispatch } = useStore()
  const r = state.mdf.find((x) => x.id === id)
  const [choice, setChoice] = useState<"approve" | "decline" | null>(null)
  const [why, setWhy] = useState("")
  if (!r || (r.status !== "submitted" && r.status !== "claimed")) return <Done title={r?.campaign ?? "Funds"} body={r ? `It's ${r.status.replace("_", " ")}.` : "We couldn't find it."} />
  const claim = r.status === "claimed"
  const p = state.partners.find((x) => x.id === r.companyId)
  const funds = mdfSummary(state, r.companyId)
  const c = state.campaigns.find((x) => x.id === r.campaignId)
  const st = c ? campaignStats(state, c) : undefined
  const paidBefore = funds.all.find((x) => x.status === "paid")
  const amount = claim ? r.claim!.amount : r.amount
  const submit = () => {
    dispatch({ type: "chiefMdf", id: r.id, approve: choice === "approve", reason: choice === "decline" ? why.trim() : undefined })
    toast.success(choice === "approve" ? (claim ? `${money(amount)} claim approved for payment` : `${money(amount)} approved for ${r.campaign}`) : `${claim ? "Claim" : "Request"} declined`, { description: `${r.requestedBy} at ${p?.name ?? "the partner"} is told now.` })
    go("/c/approvals/done")
  }
  return (
    <div>
      <PageHeader
        back={{ label: "Approvals", href: "/c/approvals/funds" }}
        title={<span className="flex flex-wrap items-center gap-3">{r.campaign} <Badge className="border-0 bg-brand-soft text-primary">{claim ? "Funds claim" : "Funds request"}</Badge></span>}
        sub={<>{p?.name} · {p?.tier} {p?.program.toLowerCase()} partner · from {r.requestedBy}, partner marketer · {ago(claim ? r.claim!.at : r.submittedAt)}</>}
      />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title={claim ? "What they're claiming" : "What they're asking for"} sub="Market development funds: Brightline money for partner marketing">
            <Facts rows={claim ? [
              ["Claimed", money(r.claim!.amount)], ["Approved earlier", `${money(r.amount)} by ${r.decidedBy} on ${date(r.decidedAt!)}`],
              ["Proof", r.claim!.proof.join(", ")], ["Results", r.claim!.results],
            ] : [
              ["Amount", money(r.amount)], ["Pays for", r.activity], ["Expected result", r.expected], ["Campaign", c ? `${c.status} · ${c.channels.join(", ")}` : "—"],
            ]} />
          </Panel>
          {st && c && c.status !== "draft" && (
            <Panel title="What the campaign has produced so far" sub="From the partner's tracked link">
              <Facts rows={[["Clicks", c.clicks.toLocaleString("en-US")], ["Leads", String(st.leadCount)], ["Deals registered", String(st.regs.length)], ["Pipeline and won", `${money(st.pipeline)} open · ${money(st.wonValue)} won`]]} />
            </Panel>
          )}
          <AiCard
            who="Program agent"
            headline={claim ? "Approve: the spend matches what you approved, and the results are attached." : funds.available >= 0 ? `Approve: within ${p?.name ?? "the partner"}'s ${p?.tier} allowance, using an approved kit.` : "Check: this goes over the yearly allowance."}
            confidence={0.86}
            evidence={claim
              ? [`Claimed ${money(r.claim!.amount)} of the ${money(r.amount)} approved`, r.claim!.results, "Invoice attached"]
              : [`${money(funds.available + r.amount)} of ${money(funds.allowance)} was available before this request`, paidBefore?.claim ? `Last funded campaign (${paidBefore.campaign}): ${paidBefore.claim.results}` : "First funded campaign this year", "Brightline-approved content kit; claims locked"]}
          />
          <Panel title={`${p?.name ?? "Partner"}'s funds this year`}><FundsBar {...funds} /></Panel>
        </div>
        <Decide ready={!!choice && (choice === "approve" || why.trim().length > 2)} tone={choice === "approve" ? "ok" : choice === "decline" ? "bad" : null} label={choice === "approve" ? (claim ? `Approve ${money(amount)} for payment` : `Approve ${money(amount)}`) : choice === "decline" ? "Decline with reason" : "Choose an option"} onSubmit={submit}>
          <DecisionOption active={choice === "approve"} tone="ok" onClick={() => setChoice("approve")} icon={<Check />} label="Approve" sub={claim ? "Payment goes out with the next partner payment run" : "The partner can launch and claim it afterwards"} suggested />
          <DecisionOption active={choice === "decline"} tone="bad" onClick={() => setChoice("decline")} icon={<X />} label="Decline" sub="The partner sees your reason" />
          {choice === "decline" && <Textarea value={why} onChange={(ev) => setWhy(ev.target.value)} rows={3} className="text-[15.5px]" placeholder={`Why? ${r.requestedBy} sees this.`} />}
          <p className="text-[13.5px] text-muted-foreground">Money always needs a person (R-APR-4). The Program agent advises; it can't approve.</p>
        </Decide>
      </div>
    </div>
  )
}

export function ApprovalDetail({ id = "" }: { id?: string }) {
  const [kind, ...rest] = id.split("-")
  const ref = rest.join("-")
  if (kind === "reg") return <DealApproval id={ref} />
  if (kind === "split") return <SplitApproval id={ref} />
  if (kind === "ext") return <ExtensionApproval id={ref} />
  if (kind === "app") return <ApplicationApproval id={ref} />
  if (kind === "req") return <RequestApproval id={ref} />
  if (kind === "mdf") return <FundsApproval id={ref} />
  return <Done title="Approval" body="We couldn't find it." />
}
