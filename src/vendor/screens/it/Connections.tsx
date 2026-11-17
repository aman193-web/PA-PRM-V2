import { useState } from "react"
import { Check, CheckCircle2, GitMerge, Lock, Plug, RefreshCw, X } from "lucide-react"
import { toast } from "sonner"
import { PageHeader, Panel, SalesforceMark } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ago, date } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { Facts } from "@/chief/screens/Approvals"
import { connectionKindLabel, integrationScope, type Connection, type ConnectionKind } from "@/vendor/admin"
import { useAdmin } from "@/vendor/useVendor"

function Status({ c }: { c: Connection }) {
  if (c.status === "connected") return <Badge className="border-0 bg-ok-soft text-ok">Connected</Badge>
  if (c.status === "requested") return <Badge className="border-0 bg-amber-soft text-amber-ink">Waiting for you</Badge>
  if (c.status === "declined") return <Badge className="border-0 bg-secondary text-foreground">Turned down</Badge>
  return <Badge variant="outline" className="border-dashed text-muted-foreground">Stage 2</Badge>
}

function ConnectorReview({ c }: { c: Connection }) {
  const { dispatch } = useStore()
  const [declining, setDeclining] = useState(false)
  const [note, setNote] = useState("")
  const r = c.request!
  const decide = (approve: boolean) => {
    dispatch({ type: "itConnector", id: c.id, approve, note: note.trim() || undefined })
    toast.success(approve ? `${c.name} connected` : `${c.name} turned down`, { description: `${r.by} is told. Logged in the audit log.` })
  }
  return (
    <Panel className="border-amber/50" title={<span className="flex flex-wrap items-center gap-2"><Plug className="size-5 text-amber-ink" /> Connect {c.name}? <Status c={c} /></span>} sub={`${r.by} (${r.byRole}) asked ${ago(r.at)}`}>
      <p className="text-[15.5px] text-foreground">"{r.why}"</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[14px] font-semibold text-muted-foreground">It would be able to</p>
          <ul className="mt-1.5 space-y-1.5">{r.scopes.map((x) => <li key={x} className="flex gap-2 text-[15px] text-foreground"><Check className="mt-0.5 size-4 shrink-0 text-ok" />{x}</li>)}</ul>
        </div>
        <div>
          <p className="text-[14px] font-semibold text-muted-foreground">It couldn't</p>
          <ul className="mt-1.5 space-y-1.5">{r.notScopes.map((x) => <li key={x} className="flex gap-2 text-[15px] text-foreground"><X className="mt-0.5 size-4 shrink-0 text-bad" />{x}</li>)}</ul>
        </div>
      </div>
      {declining && <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="mt-4 text-[15.5px]" placeholder={`Why not? ${r.by.split(" ")[0]} sees this`} />}
      <div className="mt-4 flex flex-wrap gap-2">
        {declining ? (
          <>
            <Button variant="outline" onClick={() => setDeclining(false)}>Cancel</Button>
            <Button className="bg-bad text-white hover:bg-bad/90" disabled={!note.trim()} onClick={() => decide(false)}>Turn down</Button>
          </>
        ) : (
          <>
            <Button className="bg-ok text-white hover:bg-ok/90" onClick={() => decide(true)}><Check /> Approve and connect</Button>
            <Button variant="outline" onClick={() => setDeclining(true)}>Turn down</Button>
          </>
        )}
      </div>
    </Panel>
  )
}

export function ItConnections() {
  const { state, dispatch } = useStore()
  const a = useAdmin()
  const sf = state.connections.find((c) => c.id === "salesforce")!
  const groups = (Object.keys(connectionKindLabel) as ConnectionKind[]).filter((k) => k !== "crm")
  return (
    <div className="space-y-6">
      <PageHeader title="Connections" sub="Salesforce, sign-in and the tools approvals travel through. Salesforce stays the system of record; the PRM keeps a cache, not a second copy (R-SEC-8)." />
      {a.requested.map((c) => <ConnectorReview key={c.id} c={c} />)}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <div className="space-y-6">
          <Panel title={<span className="flex items-center gap-3"><SalesforceMark className="h-6 w-9" /> Salesforce <Status c={sf} /></span>} sub={sf.detail}>
            <Facts rows={sf.facts!} />
            {a.merge && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-ok/40 bg-ok-soft/40 px-4 py-3">
                <span className="flex min-w-0 gap-3"><GitMerge className="mt-0.5 size-5 shrink-0 text-ok" /><span><b className="block text-foreground">Merge ACME Mfg. Inc. into Acme Manufacturing</b><span className="text-[14px] text-muted-foreground">{a.merge.resolution?.by} (RevOps) confirmed they're one company. Merging is yours: the integration user can't merge records.</span></span></span>
                <Button className="bg-ok text-white hover:bg-ok/90" onClick={() => { dispatch({ type: "itMerge", exceptionId: a.merge!.id }); toast.success("Records merged in Salesforce", { description: "Ana Costa and Sam Rivera are told." }) }}><GitMerge /> Merge in Salesforce</Button>
              </div>
            )}
          </Panel>
          <Panel title="Writes to Salesforce" sub="Every write is queued and retried, so nothing is lost when Salesforce is slow" bodyClass="px-0 sm:px-0 pb-1">
            <ul>
              {a.writes.map((w) => (
                <li key={w.id} className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-start gap-3 border-t px-5 py-3.5 sm:px-6">
                  {w.status === "synced" ? <CheckCircle2 className="mt-0.5 size-5 text-ok" /> : <RefreshCw className="mt-0.5 size-5 text-amber-ink" />}
                  <span className="min-w-0"><span className="block text-[15px] text-foreground">{w.text}</span><span className="text-[13.5px] text-muted-foreground">{w.source.replace(/^You /, "Jordan Lee ")} · {ago(w.at)}{w.attempt ? ` · ${w.attempt}` : ""}</span></span>
                  {w.status !== "synced" ? <Button size="sm" variant="outline" onClick={() => { dispatch({ type: "itRetry", writeId: w.id }); toast.success("Written to Salesforce", { description: "RevOps and the partner manager see it as fixed." }) }}><RefreshCw /> Retry now</Button> : <span />}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <Panel title={<span className="flex items-center gap-2"><Lock className="size-5 text-primary" /> Integration user</span>} sub="prm-integration@brightline.io · least privilege, scoped at install">
          <ul className="space-y-2.5">
            {integrationScope.can.map(([obj, dir, use]) => (
              <li key={obj} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3">
                <b className="text-[15px] text-foreground">{obj}</b><Badge variant="outline">{dir}</Badge>
                <span className="col-span-2 text-[13.5px] text-muted-foreground">{use}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[14px] font-semibold text-muted-foreground">Can't</p>
          <ul className="mt-1.5 space-y-1.5">{integrationScope.cannot.map((x) => <li key={x} className="flex gap-2 text-[14.5px] text-foreground"><X className="mt-0.5 size-4 shrink-0 text-bad" />{x}</li>)}</ul>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        {groups.map((k) => {
          const list = state.connections.filter((c) => c.kind === k && c.status !== "requested")
          if (!list.length) return null
          return (
            <Panel key={k} title={connectionKindLabel[k]}>
              <ul className="space-y-4">
                {list.map((c) => (
                  <li key={c.id} className={cn(c.status === "stage2" && "opacity-70")}>
                    <span className="flex flex-wrap items-center justify-between gap-2"><b className="text-foreground">{c.name}</b><Status c={c} /></span>
                    <span className="block text-[14px] text-muted-foreground">{c.detail}</span>
                    {c.facts && <ul className="mt-1 space-y-0.5">{c.facts.map(([f, v]) => <li key={f} className="text-[13.5px] text-muted-foreground"><span className="text-foreground">{f}:</span> {v}</li>)}</ul>}
                    {c.decided && <span className="mt-1 block text-[13.5px] text-muted-foreground">{c.status === "connected" ? "Connected" : "Turned down"} by {c.decided.by} {ago(c.decided.at)}{c.decided.note ? `: "${c.decided.note}"` : ""}</span>}
                  </li>
                ))}
              </ul>
            </Panel>
          )
        })}
      </div>
      <p className="text-[14px] text-muted-foreground">Stage 0 exit gate: design-partner data synced end to end in the sandbox on {date("2026-09-18")}.</p>
    </div>
  )
}
