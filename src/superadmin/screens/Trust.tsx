import { useMemo, useState } from "react"
import { Check, Database, Download, KeyRound, Lock, Search, ShieldCheck, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ago, date, time } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { retention } from "@/superadmin/data"
import { Stat } from "@/superadmin/screens/bits"

/* ---------------- Security and access ---------------- */

export function SaSecurity() {
  const { state, dispatch } = useStore()
  const p = state.platform
  const name = (id: string) => p.orgs.find((o) => o.id === id)?.name ?? id
  const open = p.events.filter((e) => e.status === "open")
  return (
    <div className="space-y-6">
      <PageHeader title="Security and access" sub="Platform-wide sign-in policies, security events across every tenant, and who on the platform team can see customer data right now." />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Open security events" value={String(open.length)} sub={`${open.filter((e) => e.severity === "high").length} high`} />
        <Stat label="Support access now" value={String(p.support.filter((x) => x.status === "granted").length)} sub={`${p.support.filter((x) => x.status === "requested").length} waiting for a tenant`} />
        <Stat label="Tenants with SSO" value={`${p.orgs.filter((o) => o.sso !== "None").length} of ${p.orgs.length}`} sub="Partners without SSO use email links" />
        <Stat label="Platform team with security keys" value={`${p.team.filter((t) => t.status === "active").length} of ${p.team.filter((t) => t.status === "active").length}`} sub="Hardware keys required" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr] [&>*]:min-w-0">
        <div className="space-y-6">
          <Panel title="Security events" sub="Raised by sign-in monitoring across every tenant" bodyClass="px-0 sm:px-0 pb-1">
            <ul>
              {p.events.map((e) => (
                <li key={e.id} className={cn("flex flex-wrap items-start gap-3 border-t px-5 py-3.5 first:border-0 sm:px-6", e.status === "resolved" && "opacity-60")}>
                  <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", e.status === "resolved" ? "bg-ok" : e.severity === "high" ? "bg-bad" : e.severity === "medium" ? "bg-amber" : "bg-primary")} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] text-foreground">{e.text}</span>
                    <span className="text-[13.5px] text-muted-foreground">{e.id} · {name(e.orgId)} · {ago(e.at)} · {e.severity === "high" ? "High" : e.severity === "medium" ? "Medium" : "Low"}</span>
                  </span>
                  {e.status === "open"
                    ? <Button size="sm" variant="outline" onClick={() => { dispatch({ type: "saEvent", id: e.id }); toast.success(`${e.id} resolved`) }}><Check /> Resolve</Button>
                    : <Badge className="border-0 bg-ok-soft text-ok">Resolved</Badge>}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title={<span className="flex items-center gap-2"><KeyRound className="size-5 text-primary" /> Support access</span>} sub="The platform team sees a tenant's data only after that tenant's IT admin approves: read-only, for a set time" bodyClass="px-0 sm:px-0 pb-1">
            {p.support.length === 0 ? <p className="px-6 pb-4 text-muted-foreground">No support access yet. Ask for it from an organization's page.</p> : (
              <ul>
                {p.support.map((x) => (
                  <li key={x.id} className="flex flex-wrap items-center gap-3 border-t px-5 py-3.5 first:border-0 sm:px-6">
                    <span className="min-w-0 flex-1">
                      <b className="block text-foreground">{x.engineer} → {name(x.orgId)}</b>
                      <span className="text-[13.5px] text-muted-foreground">{x.reason} · {x.ticket} · {x.hours} hours{x.decidedBy ? ` · ${x.status === "declined" ? "declined" : "approved"} by ${x.decidedBy}` : ""}{x.status === "granted" && x.until ? ` · until ${time(x.until)}` : ""}</span>
                    </span>
                    <Badge className={cn("border-0", x.status === "granted" ? "bg-ok-soft text-ok" : x.status === "requested" ? "bg-amber-soft text-amber-ink" : x.status === "declined" ? "bg-bad-soft text-bad" : "bg-secondary text-foreground")}>{{ granted: "Access open", requested: "Waiting for the tenant", declined: "Declined", ended: "Ended" }[x.status]}</Badge>
                    {x.status === "granted" && <Button size="sm" variant="outline" onClick={() => { dispatch({ type: "saSupportEnd", id: x.id }); toast.success("Support access ended") }}>End now</Button>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <Panel title={<span className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /> Platform policies</span>} sub="Apply to every tenant. Locked ones protect customers and can't be switched off.">
          <ul className="space-y-3">
            {p.policies.map((x) => (
              <li key={x.id} className="rounded-[12px] border p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0"><b className="block text-foreground">{x.label}</b><span className="text-[14px] text-muted-foreground">{x.help}</span></span>
                  {x.kind === "toggle"
                    ? <Switch checked={!!x.value} disabled={!!x.locked} onCheckedChange={(v) => { dispatch({ type: "saPolicy", id: x.id, value: v }); toast.success(`${x.label}: ${v ? "on" : "off"}`) }} aria-label={x.label} />
                    : (
                      <Select value={String(x.value)} onValueChange={(v) => { dispatch({ type: "saPolicy", id: x.id, value: v }); toast.success(`${x.label}: ${v}`) }}>
                        <SelectTrigger className="h-10 w-[130px] shrink-0"><SelectValue /></SelectTrigger>
                        <SelectContent>{x.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                </div>
                {x.locked && <p className="mt-2 flex items-center gap-1.5 text-[13.5px] text-muted-foreground"><Lock className="size-3.5" /> {x.locked}</p>}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}

/* ---------------- Platform audit log ---------------- */

export function SaAudit() {
  const { state } = useStore()
  const p = state.platform
  const [q, setQ] = useState("")
  const [org, setOrg] = useState("all")
  const [who, setWho] = useState("all")
  const actors = useMemo(() => Array.from(new Set(p.audit.map((a) => a.actor))), [p.audit])
  const rows = p.audit.filter((a) => (org === "all" || (org === "platform" ? !a.orgId : a.orgId === org)) && (who === "all" || a.actor === who) && (!q || `${a.text} ${a.actor} ${a.id}`.toLowerCase().includes(q.toLowerCase())))
  return (
    <div className="space-y-6">
      <PageHeader title="Platform audit log" sub="Every change made from this panel, and every tenant decision about platform access. Append-only: nothing here can be edited or deleted (R-SEC-6)." actions={<Button variant="outline" onClick={() => toast.success("Export started", { description: `${rows.length} entries as CSV. It arrives by email when ready.` })}><Download /> Export</Button>} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <span className="relative flex-1"><Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search changes" className="h-11 pl-10" /></span>
        <Select value={org} onValueChange={setOrg}><SelectTrigger className="h-11 w-full sm:w-[210px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Every organization</SelectItem><SelectItem value="platform">Platform-wide only</SelectItem>{p.orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select>
        <Select value={who} onValueChange={setWho}><SelectTrigger className="h-11 w-full sm:w-[230px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Anyone</SelectItem>{actors.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select>
      </div>
      <Panel bodyClass="px-0 sm:px-0 py-1">
        {rows.length === 0 ? <p className="px-6 py-4 text-muted-foreground">No entries match.</p> : (
          <ul>
            {rows.map((a) => (
              <li key={a.id} className="grid gap-1 border-t px-5 py-3 first:border-0 sm:grid-cols-[150px_minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:px-6">
                <span className="text-[13.5px] text-muted-foreground tabular">{date(a.at, { month: "short", day: "numeric" })}, {time(a.at)}</span>
                <span className="min-w-0"><span className="block text-[15px] text-foreground">{a.text}</span><span className="text-[13.5px] text-muted-foreground">{a.actor} · {a.id}</span></span>
                <Badge variant="outline" className="w-fit">{a.orgId ? p.orgs.find((o) => o.id === a.orgId)?.name ?? a.orgId : "Platform"}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}

/* ---------------- Data and privacy ---------------- */

export function SaData() {
  const { state, dispatch } = useStore()
  const p = state.platform
  const name = (id: string) => p.orgs.find((o) => o.id === id)?.name ?? id
  return (
    <div className="space-y-6">
      <PageHeader title="Data and privacy" sub="Where each customer's data lives, how long it's kept, and export or erasure requests. Requests must be finished within 30 days." />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr] [&>*]:min-w-0">
        <div className="space-y-6">
          <Panel title="Data requests" bodyClass="px-0 sm:px-0 pb-1">
            <ul>
              {p.dataRequests.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-3 border-t px-5 py-3.5 first:border-0 sm:px-6">
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-[9px]", d.kind === "delete" ? "bg-bad-soft text-bad" : "bg-brand-soft text-primary")}>{d.kind === "delete" ? <Trash2 className="size-[18px]" /> : <Download className="size-[18px]" />}</span>
                  <span className="min-w-0 flex-1">
                    <b className="block text-foreground">{d.kind === "delete" ? "Erase" : "Export"}: {d.subject}</b>
                    <span className="text-[13.5px] text-muted-foreground">{d.id} · {name(d.orgId)} · asked by {d.by} on {date(d.asked, { month: "short", day: "numeric" })} · due {date(d.due, { month: "short", day: "numeric" })}</span>
                  </span>
                  {d.status === "new" && <Button size="sm" variant="outline" onClick={() => { dispatch({ type: "saDataRequest", id: d.id, status: "in_progress" }); toast.success(`${d.id} started`) }}>Start</Button>}
                  {d.status === "in_progress" && <Button size="sm" onClick={() => { dispatch({ type: "saDataRequest", id: d.id, status: "done" }); toast.success(`${d.id} complete`, { description: d.kind === "delete" ? "Erased everywhere, including search. Backups age out within 35 days." : `A download link went to ${d.by}.` }) }}><Check /> Mark complete</Button>}
                  {d.status === "done" && <Badge className="border-0 bg-ok-soft text-ok">Done</Badge>}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="How long data is kept" bodyClass="px-0 sm:px-0 pb-1">
            <ul>{retention.map((r) => <li key={r.item} className="grid gap-1 border-t px-5 py-3 first:border-0 sm:grid-cols-[minmax(0,1fr)_170px] sm:px-6"><span><b className="block text-foreground">{r.item}</b><span className="text-[13.5px] text-muted-foreground">{r.why}</span></span><span className="text-[14.5px] font-semibold text-foreground sm:text-right">{r.keep}</span></li>)}</ul>
          </Panel>
        </div>
        <Panel title={<span className="flex items-center gap-2"><Database className="size-5 text-primary" /> Where data lives</span>} sub="Each tenant's data stays in its region; the AI provider must run there too">
          <ul className="space-y-3">
            {p.orgs.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 rounded-[10px] bg-muted/50 px-4 py-3">
                <span className="min-w-0"><b className="block truncate text-foreground">{o.name}</b><span className="text-[13.5px] text-muted-foreground">{o.region === "EU" ? "Frankfurt, EU" : "Virginia, US"} · encrypted at rest{o.plan === "enterprise" ? " · own key available" : ""}</span></span>
                <Badge variant="outline">{o.region}</Badge>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
