import { useState } from "react"
import { Building2, CheckCircle2, Hourglass, MessageSquareText, Scale, Split, Store, Timer } from "lucide-react"
import { AiTag, Confidence, EmptyState, PageHeader, Panel, SlaMeter } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ago, date, money } from "@/lib/format"
import { cn } from "@/lib/utils"
import { slaPct } from "@/store"
import { Kpi } from "@/partner/bits"
import { conflictHistory, dealOwners } from "@/vendor/sales"
import { useSales, type AskOption, type Risk } from "@/vendor/useVendor"
import { AskDialog } from "@/vendor/screens/cro/Risk"

type Conflict = ReturnType<typeof useSales>["conflicts"][number]

function Outcome({ c }: { c: Conflict }) {
  const r = c.reg
  if (r.state === "approved") return <Badge className="border-0 bg-ok-soft text-ok">Approved{r.crm?.linked === "existing" ? " and linked" : ""}</Badge>
  if (r.state === "rejected") return <Badge className="border-0 bg-secondary text-foreground">Rejected</Badge>
  if (r.state === "info_requested") return <Badge className="border-0 bg-amber-soft text-amber-ink">Waiting for the partner</Badge>
  return <Badge className="border-0 bg-brand-soft text-primary">With Jordan Lee</Badge>
}

function ConflictCard({ c, onAsk }: { c: Conflict; onAsk: (o: AskOption) => void }) {
  const r = c.reg
  const k = r.conflict!
  const open = r.state === "under_review" || r.state === "info_requested"
  return (
    <Panel
      title={<span className="flex flex-wrap items-center gap-2">{r.customer} <Outcome c={c} /></span>}
      sub={<>{c.kind === "direct" ? "Partner against a Brightline seller" : "Partner against partner"} · registered {ago(r.submittedAt)}</>}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[12px] border p-4">
          <p className="flex items-center gap-2 text-[13.5px] font-semibold text-muted-foreground"><Store className="size-4" /> Partner registration</p>
          <b className="mt-1 block text-foreground">{c.partner}</b>
          <p className="text-[14.5px] text-muted-foreground">{r.rep} · {r.product}</p>
          <p className="mt-1 text-[15px] text-foreground tabular">{money(r.value)} · closes {date(r.closeDate, { month: "short", day: "numeric" })}</p>
        </div>
        <div className="rounded-[12px] border p-4">
          <p className="flex items-center gap-2 text-[13.5px] font-semibold text-muted-foreground">{c.kind === "direct" ? <Building2 className="size-4" /> : <Split className="size-4" />} {c.kind === "direct" ? "Brightline opportunity" : "Earlier registration"}</p>
          <b className="mt-1 block text-foreground">{k.title}</b>
          <p className="text-[14.5px] text-muted-foreground">{k.owner}</p>
          <p className="mt-1 text-[15px] text-foreground">{k.stage}</p>
        </div>
      </div>
      {r.ai && (
        <div className="mt-4 rounded-[12px] bg-brand-soft/40 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><AiTag>Deal Desk recommendation</AiTag><Confidence value={r.ai.confidence} /></div>
          <p className="mt-1 font-semibold text-foreground">{r.ai.headline}</p>
        </div>
      )}
      {c.notes.map((n) => (
        <p key={n.at} className="mt-3 rounded-[12px] border border-primary/30 px-4 py-3 text-[15px] text-foreground"><b>{n.by}</b> added context {ago(n.at)}: "{n.text}"</p>
      ))}
      {open ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {r.state === "under_review" ? <span className="min-w-[220px] flex-1"><SlaMeter reg={r} /></span> : <span className="text-[14.5px] text-muted-foreground">The review deadline is paused until the partner answers.</span>}
          <Button size="sm" variant="outline" onClick={() => onAsk({ to: "pam", name: "Jordan Lee", why: "Decides partner registrations and conflicts", text: `${r.customer}: ${c.partner}'s registration overlaps ${k.owner}${c.kind === "direct" ? "'s opportunity" : ""}. ${slaPct(r)}% of the deadline is used. What's your call?` })}>
            <MessageSquareText /> Ask Jordan Lee
          </Button>
        </div>
      ) : (
        <p className="mt-4 flex gap-2 text-[15px] text-foreground"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" />
          {r.decision?.actor ?? "Jordan Lee"} {r.state} it {r.decision ? ago(r.decision.at) : ""}{r.decision?.reason ? `: ${r.decision.reason}` : ""}.{r.state === "approved" && c.kind === "direct" ? ` ${c.partner} is on ${dealOwners[r.id] ?? "the seller"}'s opportunity now.` : ""}
        </p>
      )}
    </Panel>
  )
}

export function CroConflicts() {
  const s = useSales()
  const [ask, setAsk] = useState<{ r: Risk; o: AskOption } | null>(null)
  const decidedNow = s.conflicts.filter((c) => c.reg.state !== "under_review" && c.reg.state !== "info_requested").length
  return (
    <div className="space-y-6">
      <PageHeader title="Channel conflicts" sub="When a partner registers a deal a Brightline seller is already working, or that another partner registered first. The partner manager decides; you see both sides and the outcome." />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        <Kpi icon={<Scale />} label="Open now" value={String(s.openConflicts.length)} sub={`${s.openConflicts.filter((c) => c.kind === "direct").length} against a Brightline seller`} />
        <Kpi icon={<CheckCircle2 />} label="Decided this quarter" value={String(conflictHistory.decided + decidedNow)} sub={`${conflictHistory.toPartner} to the partner · ${conflictHistory.toDirect} direct · ${conflictHistory.shared} shared`} />
        <div className="col-span-2 xl:col-span-1"><Kpi icon={<Timer />} label="Median time to decide" value={`${conflictHistory.medianDays} days`} sub="Partner managers, this quarter (example figure)" /></div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr] [&>*]:min-w-0">
        <div className="space-y-6">
          {s.conflicts.length === 0 ? <Panel><EmptyState title="No channel conflicts" body="New ones show up here as soon as a registration overlaps." /></Panel> : s.conflicts.map((c) => (
            <ConflictCard key={c.reg.id} c={c} onAsk={(o) => setAsk({ o, r: { key: `conflict-${c.reg.id}`, account: c.reg.customer, value: c.reg.value, stage: "In review", closeDate: c.reg.closeDate, partners: [c.partner], flags: [], ask: [], nudges: [] } })} />
          ))}
        </div>
        <div className="space-y-6">
          <Panel title="How conflicts are settled">
            <ul className="space-y-3 text-[15px]">
              <li className="flex gap-3"><span className={cn("mt-1 size-2 shrink-0 rounded-full bg-primary")} /><span className="text-foreground">Every registration is checked against Salesforce accounts, open opportunities and other partners' registrations <span className="font-mono text-[12.5px] text-muted-foreground">R-REG-4</span></span></li>
              <li className="flex gap-3"><span className="mt-1 size-2 shrink-0 rounded-full bg-primary" /><span className="text-foreground">A conflict never auto-approves. It goes to the partner manager, who decides with the evidence <span className="font-mono text-[12.5px] text-muted-foreground">R-REG-5</span></span></li>
              <li className="flex gap-3"><span className="mt-1 size-2 shrink-0 rounded-full bg-primary" /><span className="text-foreground">The seller sees the registration on their account and can add context; they can't decide it <span className="font-mono text-[12.5px] text-muted-foreground">G23 · G43</span></span></li>
              <li className="flex gap-3"><Hourglass className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><span className="text-muted-foreground">Stage 2 adds a suggested resolution: split, co-sell or first-in <span className="font-mono text-[12.5px]">R-REG-15</span></span></li>
            </ul>
          </Panel>
        </div>
      </div>
      {ask && <AskDialog key={ask.r.key} risk={ask.r} option={ask.o} onClose={() => setAsk(null)} />}
    </div>
  )
}
