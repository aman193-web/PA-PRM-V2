import { useState } from "react"
import { ArrowRight, Bot, Pause } from "lucide-react"
import { agents, rules, statusMeta, type RuleArea, type Status } from "@hub/content"
import { ruleAreas } from "@hub/content/rules"
import { Callout, ItemLink, PageHead, Panel, StageBadge, StatusChip } from "@hub/components/bits"
import { useNav } from "@hub/lib/nav"
import { cn } from "@hub/lib/utils"

type Tab = "rules" | "sla" | "states" | "agents"

export function Rules() {
  const [tab, setTab] = useState<Tab>("rules")
  const tabs: { id: Tab; label: string }[] = [
    { id: "rules", label: `All rules · ${rules.length}` },
    { id: "sla", label: "SLA timeline" },
    { id: "states", label: "Deal statuses" },
    { id: "agents", label: `AI agents · ${agents.length}` },
  ]
  return (
    <div>
      <PageHead eyebrow="Business logic" title="Rules & SLA" sub="Every rule in plain words, with its numbers, conditions, source and how settled it is." />
      <div role="tablist" aria-label="Rules views" className="mb-6 flex gap-1 overflow-x-auto border-b [scrollbar-width:none]">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={cn("relative h-12 shrink-0 px-4 text-[15px] font-semibold", tab === t.id ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {t.label}
            {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-primary" />}
          </button>
        ))}
      </div>
      {tab === "rules" && <RuleList />}
      {tab === "sla" && <SlaTimeline />}
      {tab === "states" && <States />}
      {tab === "agents" && <Agents />}
    </div>
  )
}

function RuleList() {
  const { open } = useNav()
  const [area, setArea] = useState<RuleArea | "all">("all")
  const [status, setStatus] = useState<Status | "all">("all")
  const list = rules.filter((r) => (area === "all" || r.area === area) && (status === "all" || r.status === status))
  return (
    <div>
      <div className="mb-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {[{ id: "all" as const, label: "All areas" }, ...ruleAreas].map((a) => (
          <button key={a.id} onClick={() => setArea(a.id)} aria-pressed={area === a.id} className={cn("h-9 shrink-0 rounded-full border px-3.5 text-[14px] font-medium", area === a.id ? "border-primary bg-brand-soft text-primary" : "bg-card text-foreground hover:border-border-strong")}>
            {a.label}
          </button>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-2 text-[14px]">
        <span className="text-muted-foreground">Status:</span>
        {(["all", "confirmed", "specified", "proposed", "default", "open", "assumption"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} aria-pressed={status === s} className={cn("h-8 rounded-full border px-3", status === s ? "border-foreground bg-foreground text-background" : "bg-card text-foreground")}>
            {s === "all" ? "Any" : statusMeta[s].label}
          </button>
        ))}
      </div>
      <ul className="grid gap-3 lg:grid-cols-2">
        {list.map((r) => (
          <li key={r.id}>
            <button onClick={() => open(r.id)} className="flex h-full w-full flex-col rounded-[14px] border bg-card p-4 text-left transition hover:border-primary/60">
              <span className="flex w-full items-center gap-2">
                <span className="font-mono text-[12.5px] text-muted-foreground">{r.id}</span>
                <span className="flex-1" />
                <StageBadge stage={r.stage} />
                <StatusChip status={r.status} />
              </span>
              <b className="mt-2 text-[16px] leading-snug text-foreground">{r.title}</b>
              <span className="mt-1 text-[14.5px]">{r.summary}</span>
              {r.numbers?.length ? <span className="mt-3 flex flex-wrap gap-1.5">{r.numbers.map((n) => <span key={n} className="rounded-md bg-muted px-2 py-0.5 font-mono text-[12.5px] text-foreground">{n}</span>)}</span> : null}
            </button>
          </li>
        ))}
      </ul>
      {!list.length && <p className="py-10 text-center text-muted-foreground">No rules match those filters.</p>}
    </div>
  )
}

function SlaTimeline() {
  const marks = [
    { at: 0, label: "Submitted", text: "The clock starts when a registration needs a person. Clean deals never start a clock: the rules decide in 60 s.", id: "R-REG-13", tone: "bg-primary" },
    { at: 50, label: "50% · Nudge", text: "The SLA agent reminds the PAM by push, Slack or email.", id: "R-SLA-2", tone: "bg-amber" },
    { at: 80, label: "80% · Escalate", text: "The channel chief is alerted and can decide in one tap.", id: "R-SLA-3", tone: "bg-[#e0711e]" },
    { at: 100, label: "100% · Deadline", text: "Recommended default: alert the chief and hand to a backup reviewer. Never auto-approve.", id: "R-SLA-4", tone: "bg-bad" },
  ]
  return (
    <div className="space-y-6">
      <Panel title="What happens as the clock runs" sub="One exception registration, from submission to deadline.">
        <div className="relative mt-4 mb-2 h-3 rounded-full bg-gradient-to-r from-primary via-amber to-bad">
          {marks.map((m) => <span key={m.at} className="absolute -top-1.5 size-6 -translate-x-1/2 rounded-full border-4 border-card bg-foreground" style={{ left: `${m.at}%` }} />)}
        </div>
        <ol className="mt-8 grid gap-3 md:grid-cols-4">
          {marks.map((m) => (
            <li key={m.at} className="rounded-[12px] border p-4">
              <span className={cn("inline-block size-2.5 rounded-full", m.tone)} />
              <b className="mt-1.5 block text-[15.5px] text-foreground">{m.label}</b>
              <span className="mt-1 block text-[14.5px]">{m.text}</span>
              <span className="mt-3 block"><ItemLink id={m.id} compact /></span>
            </li>
          ))}
        </ol>
      </Panel>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Pausing for information" sub="R-SLA-7">
          <ol className="space-y-3 text-[15px]">
            {["The PAM asks for more information.", "Status becomes Info requested and the clock stops.", "The partner replies.", "The clock resumes from where it stopped (it doesn't reset).", "The checks run again: auto-approved, or back to the PAM."].map((s, i) => (
              <li key={s} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-[12.5px] font-bold text-primary">{i + 1}</span>{s}</li>
            ))}
          </ol>
          <div className="mt-4"><ItemLink id="flow-pam-info" /></div>
        </Panel>
        <Panel title="Settings that shape the SLA">
          <div className="grid gap-2">
            {["R-SLA-1", "R-SLA-5", "R-SLA-6", "R-SLA-8", "R-SLA-9"].map((id) => <ItemLink key={id} id={id} />)}
          </div>
          <div className="mt-4"><Callout tone="warn">The clock type (business vs calendar hours) and the 100% behaviour are still open decisions (G9, G10).</Callout></div>
        </Panel>
      </div>
    </div>
  )
}

function States() {
  const business = ["Draft", "Submitted", "Under review", "Info requested", "Approved", "Rejected", "Won", "Lost", "Expired"]
  const sync = [["Pending", "Write queued after approval"], ["Synced", "In Salesforce"], ["Failed", "Retrying automatically"], ["Exception", "With RevOps"]]
  return (
    <div className="space-y-6">
      <Callout>Recommended default for decision D5: one business status the partner sees, and a separate Salesforce sync status, so an outage never changes an approval.</Callout>
      <Panel title="Business status" sub="R-STATE-1">
        <div className="flex flex-wrap items-center gap-2">
          {business.map((s, i) => (
            <span key={s} className="inline-flex items-center gap-2">
              <span className={cn("rounded-[10px] border px-3 py-2 text-[14.5px] font-medium", s === "Info requested" ? "border-dashed border-amber bg-amber-soft text-amber-ink" : ["Approved", "Won"].includes(s) ? "border-ok/40 bg-ok-soft text-ok" : ["Rejected", "Lost", "Expired"].includes(s) ? "bg-muted text-muted-foreground" : "bg-card text-foreground")}>
                {s === "Info requested" && <Pause className="mr-1 inline size-3.5" />}{s}
              </span>
              {i < business.length - 1 && <ArrowRight className="size-4 text-muted-foreground" />}
            </span>
          ))}
        </div>
        <p className="mt-4 text-[14.5px]">"Under review ⇄ Info requested" loops while the PAM waits on the partner. "Auto-approved" is an Approved decision made by the rules, not a separate status.</p>
      </Panel>
      <Panel title="Salesforce sync status" sub="R-STATE-2">
        <ul className="grid gap-3 sm:grid-cols-4">
          {sync.map(([k, v]) => <li key={k} className="rounded-[12px] border p-3"><b className="block text-foreground">{k}</b><span className="text-[14px]">{v}</span></li>)}
        </ul>
        <div className="mt-4"><ItemLink id="flow-crm-write" /></div>
      </Panel>
      <Panel title="How the sources differ" sub="G5">
        <ul className="space-y-2 text-[14.5px]">
          <li><b className="font-mono text-foreground">TechDesign</b> · 9 business states (cited, not seen)</li>
          <li><b className="font-mono text-foreground">Eng. Req.</b> · adds Validating, Auto-approved, Pending review, CRM sync pending, Active, Sync exception</li>
          <li><b className="font-mono text-foreground">Arch</b> · DRAFT → SUBMITTED → VALIDATING → APPROVED / REJECTED / REVIEW_PENDING → CRM_SYNC_PENDING → ACTIVE / SYNC_EXCEPTION → EXPIRED</li>
        </ul>
      </Panel>
    </div>
  )
}

function Agents() {
  const { open } = useNav()
  const levels = [["A0", "Observe"], ["A1", "Recommend"], ["A2", "Draft"], ["A3", "Act with approval"], ["A4", "Act alone within limits"]]
  return (
    <div className="space-y-6">
      <Panel title="Autonomy levels" sub="R-AG-1 · set per tenant, program and action">
        <ol className="grid gap-2 sm:grid-cols-5">
          {levels.map(([k, v], i) => (
            <li key={k} className="rounded-[12px] border p-3" style={{ background: `color-mix(in oklab, var(--primary) ${6 + i * 6}%, var(--card))` }}>
              <b className="font-mono text-[15px] text-foreground">{k}</b>
              <span className="block text-[14px]">{v}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4"><Callout tone="warn">Always human, and can't be raised: money, contracts, access, data export, tier demotion, partner termination (R-AG-2).</Callout></div>
      </Panel>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {agents.map((a) => (
          <li key={a.id}>
            <button onClick={() => open(a.id)} className="flex h-full w-full flex-col rounded-[14px] border bg-card p-4 text-left hover:border-primary/60">
              <span className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-night text-night-ink"><Bot className="size-4" /></span><b className="flex-1 text-[15.5px] text-foreground">{a.title}</b><StageBadge stage={a.stage} /></span>
              <span className="mt-2 text-[14.5px]">{a.summary}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="grid gap-2 sm:grid-cols-3">{["R-AG-3", "R-AG-4", "R-AG-5"].map((id) => <ItemLink key={id} id={id} />)}</div>
    </div>
  )
}
