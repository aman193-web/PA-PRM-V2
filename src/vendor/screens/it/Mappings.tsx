import { useState } from "react"
import { ArrowRight, Check, CheckCircle2, ShieldAlert, Shuffle, X } from "lucide-react"
import { toast } from "sonner"
import { AiTag, Confidence, EmptyState, PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { date } from "@/lib/format"
import { useStore } from "@/store"
import type { FieldMapping } from "@/vendor/admin"

function MappingCard({ m }: { m: FieldMapping }) {
  const { dispatch } = useStore()
  const [declining, setDeclining] = useState(false)
  const [note, setNote] = useState("")
  const decide = (decision: "approve" | "alt" | "reject") => {
    dispatch({ type: "itMapping", id: m.id, decision, note: note.trim() || undefined })
    const target = (decision === "alt" ? m.alt!.target : m.target).split(" (")[0]
    toast.success(decision === "reject" ? "Mapping turned down" : `Mapped to ${target}`, { description: decision === "reject" ? "The Data Steward agent won't suggest it again." : "Writes start with the next sync. RevOps is told." })
  }
  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-2"><AiTag>Suggested by the {m.by}</AiTag>{m.confidence && <Confidence value={m.confidence} />}</div>
      <div className="mt-3 grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.3fr)]">
        <div className="rounded-[12px] border px-4 py-3"><span className="block text-[13px] text-muted-foreground">PRM · {m.prmObject}</span><b className="text-foreground">{m.prm}</b></div>
        <span className="hidden justify-self-center text-muted-foreground sm:block"><ArrowRight className="size-5" /></span>
        <div className="rounded-[12px] border px-4 py-3"><span className="block text-[13px] text-muted-foreground">Salesforce · {m.direction === "Write" ? "PRM writes it" : "PRM reads it"}</span><b className="break-words text-foreground">{m.target}</b></div>
      </div>
      <p className="mt-3 text-[15.5px] text-foreground">{m.why}</p>
      {m.samples && (
        <div className="mt-3 overflow-hidden rounded-[12px] border">
          <p className="bg-surface-2/60 px-4 py-2 text-[13.5px] font-medium text-muted-foreground">Sample values from this week</p>
          {m.samples.map(([k, v]) => <div key={k} className="grid grid-cols-2 gap-3 border-t px-4 py-2 text-[14.5px]"><span className="text-muted-foreground">{k}</span><span className="text-foreground">{v}</span></div>)}
        </div>
      )}
      {m.caution && (
        <p className="mt-3 flex gap-2 rounded-[12px] bg-amber-soft/60 px-4 py-3 text-[15px] text-foreground"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-ink" /><span>{m.caution}{m.alt && <> The agent's safer option: <b>{m.alt.target}</b>. {m.alt.note}.</>}</span></p>
      )}
      {declining && <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="mt-3 text-[15.5px]" placeholder="Optional: why, for the log" />}
      <div className="mt-4 flex flex-wrap gap-2">
        {declining ? (
          <>
            <Button variant="outline" onClick={() => setDeclining(false)}>Cancel</Button>
            <Button className="bg-bad text-white hover:bg-bad/90" onClick={() => decide("reject")}><X /> Turn down</Button>
          </>
        ) : (
          <>
            {m.alt ? (
              <>
                <Button className="bg-ok text-white hover:bg-ok/90" onClick={() => decide("alt")}><Check /> Use {m.alt.target.split(" (")[0].split(".")[1]}</Button>
                <Button variant="outline" onClick={() => decide("approve")}>Approve as suggested</Button>
              </>
            ) : (
              <Button className="bg-ok text-white hover:bg-ok/90" onClick={() => decide("approve")}><Check /> Approve</Button>
            )}
            <Button variant="ghost" onClick={() => setDeclining(true)}>Turn down</Button>
          </>
        )}
      </div>
    </Panel>
  )
}

export function ItMappings() {
  const { state } = useStore()
  const pending = state.mappings.filter((m) => m.status === "pending")
  const done = state.mappings.filter((m) => m.status !== "pending").sort((a, b) => (b.decidedAt ?? "").localeCompare(a.decidedAt ?? ""))
  return (
    <div className="space-y-6">
      <PageHeader title="Field mappings" sub="How PRM fields line up with Salesforce. The Data Steward agent suggests mappings; nothing is written until you approve one." />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <div className="space-y-6">
          {pending.length === 0 ? <Panel><EmptyState icon={<CheckCircle2 className="size-6" />} title="No mappings waiting" body="New suggestions show up here and in your notifications." /></Panel> : pending.map((m) => <MappingCard key={m.id} m={m} />)}
        </div>
        <Panel title={<span className="flex items-center gap-2"><Shuffle className="size-5 text-primary" /> In use</span>} sub="Newest first" bodyClass="px-0 sm:px-0 pb-1">
          <ul>
            {done.map((m) => (
              <li key={m.id} className="border-t px-5 py-3 sm:px-6">
                <span className="flex flex-wrap items-center justify-between gap-2"><b className="text-[15px] text-foreground">{m.prm}</b>{m.status === "approved" ? <Badge variant="outline">{m.direction}</Badge> : <Badge className="border-0 bg-secondary text-foreground">Turned down</Badge>}</span>
                <span className="block break-words text-[14px] text-muted-foreground">{m.status === "approved" ? `→ ${(m.used ?? m.target).split(" (")[0]}` : `Not mapped to ${m.target.split(" (")[0]}`}</span>
                <span className="block text-[13px] text-muted-foreground">{m.decidedBy} · {m.decidedAt ? date(m.decidedAt) : ""}{m.by === "Data Steward agent" ? " · suggested by the Data Steward agent" : ""}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <p className="text-[14px] text-muted-foreground">The AI supervisor has the Data Steward agent's suggestions at {state.actionLevels["data-steward.suggest"]}, and it can never go above A2: approving a mapping is always yours. Every change is in the audit log.</p>
    </div>
  )
}
