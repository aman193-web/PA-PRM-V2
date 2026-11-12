import { useState, type ReactNode } from "react"
import { ArrowRight, CheckCircle2, ChevronRight, Copy, Flag, Hourglass, Inbox, RefreshCw, Scale, Users } from "lucide-react"
import { toast } from "sonner"
import { EmptyState, PageHeader, PageTabs, Panel, DecisionOption } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ago, date } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { AiCard, Decide } from "@/chief/screens/Approvals"
import { exceptionKindLabel, type DataException, type ExceptionKind } from "@/vendor/data"
import { partnerNameOf, useOps } from "@/vendor/useVendor"

export const kindIcon: Record<ExceptionKind, ReactNode> = { write: <RefreshCw />, mismatch: <Scale />, match: <Copy />, stale: <Hourglass /> }
export const kindTile: Record<ExceptionKind, string> = { write: "bg-amber-soft text-amber-ink", mismatch: "bg-bad-soft text-bad", match: "bg-brand-soft text-primary", stale: "bg-secondary text-foreground" }

export function StatusBadge({ x }: { x: DataException }) {
  if (x.status === "resolved") return <Badge className="border-0 bg-ok-soft text-ok">Resolved</Badge>
  if (x.status === "waiting") return <Badge className="border-0 bg-brand-soft text-primary">With someone else</Badge>
  return <Badge className={cn("border-0", x.kind === "mismatch" ? "bg-bad-soft text-bad" : "bg-amber-soft text-amber-ink")}>Open</Badge>
}

/** Did a partner manager report the same problem from their Salesforce page? */
export function useFlagged(x: DataException) {
  const { state } = useStore()
  return !!x.issueId && !!state.crmIssues.find((i) => i.id === x.issueId)?.reported
}

export function ExceptionRow({ x, compact }: { x: DataException; compact?: boolean }) {
  const flagged = useFlagged(x)
  return (
    <li className="border-b last:border-0">
      <a href={`#/v/exception/${x.id}`} className={cn("grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-5 py-4 hover:bg-muted/50 sm:px-6", !compact && "md:grid-cols-[40px_minmax(0,1fr)_180px_130px_20px]")}>
        <span className={cn("grid size-10 place-items-center rounded-[10px] [&_svg]:size-5", kindTile[x.kind])}>{kindIcon[x.kind]}</span>
        <span className="min-w-0">
          <b className={cn("block text-[16px] leading-snug text-foreground", !compact && "md:truncate")}>{x.title}</b>
          <span className="flex flex-wrap items-center gap-x-2 text-[14px] text-muted-foreground">
            <span>{exceptionKindLabel[x.kind]} · {x.source} · {ago(x.found)}</span>
            {flagged && x.status !== "resolved" && <span className="inline-flex items-center gap-1 font-medium text-amber-ink"><Flag className="size-3.5" /> Jordan Lee flagged it too</span>}
          </span>
        </span>
        {!compact && <span className="hidden truncate text-[14.5px] text-muted-foreground md:block">{x.partnerId ? <PartnerName id={x.partnerId} /> : "Salesforce data"}</span>}
        <span className={cn("justify-self-end", !compact && "md:justify-self-start")}><StatusBadge x={x} /></span>
        {!compact && <ChevronRight className="hidden size-5 text-muted-foreground md:block" />}
      </a>
    </li>
  )
}

function PartnerName({ id }: { id: string }) {
  const { state } = useStore()
  return <>{partnerNameOf(state, id)}</>
}

export function Exceptions({ tab }: { tab?: string }) {
  const o = useOps()
  const t = tab === "waiting" || tab === "resolved" ? tab : "open"
  const rows = t === "open" ? o.open : t === "waiting" ? o.waiting : o.resolved
  return (
    <div>
      <PageHeader title="Exceptions" sub="Data problems the agents couldn't settle on their own: failed Salesforce writes, uncertain matches, revenue mismatches and stale deals. Nothing is lost while it waits; writes are queued and retried." />
      <PageTabs
        label="Exception views"
        value={t}
        onChange={(v) => go(`/v/exceptions/${v}`)}
        items={[
          { value: "open", label: "Open", icon: <Inbox />, count: o.open.length, tone: "action" },
          { value: "waiting", label: "With someone else", icon: <Users />, count: o.waiting.length, hint: "Handed to a partner manager, an opportunity owner or the automatic retries. Still yours to close." },
          { value: "resolved", label: "Resolved", icon: <CheckCircle2 />, count: o.resolved.length },
        ]}
      />
      <Panel bodyClass="p-0 sm:p-0">
        {rows.length === 0 ? (
          <EmptyState icon={<CheckCircle2 className="size-6" />} title={t === "open" ? "No open exceptions" : "Nothing here"} body={t === "open" ? "New ones show up here and in your notifications." : undefined} />
        ) : (
          <ul>{rows.map((x) => <ExceptionRow key={x.id} x={x} />)}</ul>
        )}
      </Panel>
    </div>
  )
}

const optionIcon = { ok: <CheckCircle2 />, primary: <ArrowRight />, amber: <Hourglass />, bad: <Flag /> }

export function ExceptionDetail({ id = "" }: { id?: string }) {
  const { state, dispatch } = useStore()
  const x = state.exceptions.find((e) => e.id === id)
  const flagged = useFlagged(x ?? ({} as DataException))
  const [choice, setChoice] = useState<string | null>(null)
  const [note, setNote] = useState("")
  if (!x) return <div><PageHeader title="Exception" back={{ label: "Exceptions", href: "/v/exceptions" }} /><Panel><EmptyState title="We couldn't find it" /></Panel></div>
  const picked = x.options.find((o) => o.id === choice)
  const options = x.status === "waiting" ? x.options.filter((o) => o.id !== x.resolution?.choice) : x.options
  const submit = () => {
    dispatch({ type: "resolveException", id: x.id, choice: choice!, note: note.trim() || undefined })
    toast.success(picked!.label, { description: "Logged with your name. Anyone affected is told." })
    go("/v/exceptions")
  }
  return (
    <div>
      <PageHeader
        back={{ label: "Exceptions", href: "/v/exceptions" }}
        title={<span className="flex flex-wrap items-center gap-3">{x.title} <StatusBadge x={x} /></span>}
        sub={<>{exceptionKindLabel[x.kind]} · flagged by the {x.source.toLowerCase()} {ago(x.found)}{x.partnerId ? ` · ${partnerNameOf(state, x.partnerId)}` : ""}</>}
      />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title="What's wrong">
            <p className="text-[16px] text-foreground">{x.detail}</p>
            {flagged && x.status !== "resolved" && <p className="mt-3 flex gap-2 rounded-[12px] bg-amber-soft/60 px-4 py-3 text-[15px] text-foreground"><Flag className="mt-0.5 size-4 shrink-0 text-amber-ink" /> Jordan Lee reported this from the Salesforce page too, so a partner manager is waiting on it.</p>}
            {x.compare && (
              <div className="mt-4 overflow-hidden rounded-[12px] border">
                <div className="grid grid-cols-[120px_1fr_1fr] gap-x-3 bg-surface-2/60 px-4 py-2.5 text-[13.5px] font-medium text-muted-foreground sm:grid-cols-[150px_1fr_1fr]">
                  <span /><span>PRM</span><span>{x.kind === "match" ? "Second record" : "Salesforce"}</span>
                </div>
                {x.compare.map((c) => (
                  <div key={c.label} className="grid grid-cols-[120px_1fr_1fr] gap-x-3 border-t px-4 py-2.5 text-[15px] sm:grid-cols-[150px_1fr_1fr]">
                    <span className="text-muted-foreground">{c.label}</span>
                    <span className="text-foreground">{c.ours}</span>
                    <span className={c.match ? "text-foreground" : "font-semibold text-bad"}>{c.theirs}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {x.oppId && <Button variant="outline" size="sm" onClick={() => go("/v/revenue")}>See it in reconciliation <ArrowRight /></Button>}
            </div>
          </Panel>
          {x.status !== "resolved" && <AiCard who={x.source} headline={x.ai.headline} confidence={x.ai.confidence} evidence={x.ai.evidence} />}
          {x.limit && <p className="rounded-[12px] border border-dashed px-4 py-3 text-[15px] text-muted-foreground">{x.limit}</p>}
        </div>
        {x.status === "resolved" ? (
          <Panel title="Resolved" className="xl:sticky xl:top-[92px]">
            <p className="text-[16px] text-foreground">{x.resolution?.text}</p>
            <p className="mt-2 text-[14px] text-muted-foreground">{x.resolution?.by} · {x.resolution ? date(x.resolution.at) : ""}{x.resolution?.ledgerId ? ` · ${x.resolution.ledgerId}` : ""}</p>
            <Button variant="outline" className="mt-4" onClick={() => go("/v/exceptions")}>Back to exceptions</Button>
          </Panel>
        ) : (
          <div className="space-y-4">
            {x.status === "waiting" && x.resolution && (
              <Panel title="Handed on"><p className="text-[15.5px] text-foreground">{x.resolution.text}</p><p className="mt-1 text-[14px] text-muted-foreground">{ago(x.resolution.at)} · still yours to close</p></Panel>
            )}
            <Decide ready={!!choice} tone={picked ? (picked.tone === "ok" ? "ok" : "primary") : null} label={picked ? picked.label : "Choose an option"} onSubmit={submit}>
              {options.map((o) => (
                <DecisionOption key={o.id} active={choice === o.id} tone={o.tone} onClick={() => setChoice(o.id)} icon={optionIcon[o.tone]} label={o.label} sub={o.sub} suggested={o.suggested} />
              ))}
              {choice && <Textarea value={note} onChange={(ev) => setNote(ev.target.value)} rows={2} className="text-[15.5px]" placeholder="Optional note for the log" />}
            </Decide>
          </div>
        )}
      </div>
    </div>
  )
}
