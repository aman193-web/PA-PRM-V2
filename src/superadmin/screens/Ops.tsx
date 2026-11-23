import { useState } from "react"
import { Activity, Megaphone, Send, Wrench } from "lucide-react"
import { toast } from "sonner"
import { PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ago, money, NOW } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { moduleAdoption, planName, servicesSeed, usageByMonth } from "@/superadmin/data"
import { Bars, Health, PlatformControls, Stat } from "@/superadmin/screens/bits"

/* ---------------- System health ---------------- */

export function SaHealth() {
  const { state, dispatch } = useStore()
  const p = state.platform
  return (
    <div className="space-y-6">
      <PageHeader title="System health" sub="How each part of the platform is running, open incidents, and each customer's CRM sync." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {servicesSeed.map((s) => (
          <div key={s.id} className={cn("rounded-[14px] border bg-card p-4", s.status !== "ok" && "border-amber/60")}>
            <div className="flex items-center justify-between gap-2"><b className="text-foreground">{s.name}</b><span className={cn("inline-flex items-center gap-1.5 text-[13.5px] font-medium", s.status === "ok" ? "text-ok" : "text-amber-ink")}><span className={cn("size-2.5 rounded-full", s.status === "ok" ? "bg-ok" : "bg-amber")} />{s.status === "ok" ? "Running" : "Slower than usual"}</span></div>
            <p className="mt-1 text-[14px] text-muted-foreground">{s.uptime}% up, 30 days · {s.p95}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr] [&>*]:min-w-0">
        <div className="space-y-6">
          <Panel title={<span className="flex items-center gap-2"><Activity className="size-5 text-primary" /> Incidents</span>} bodyClass="px-0 sm:px-0 pb-1">
            <ul>
              {p.incidents.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-3 border-t px-5 py-3.5 first:border-0 sm:px-6">
                  <span className="min-w-0 flex-1"><b className="block text-foreground">{i.title}</b><span className="text-[13.5px] text-muted-foreground">{i.id} · {ago(i.at)} · {i.impact}</span></span>
                  <Badge className={cn("border-0", i.status === "resolved" ? "bg-ok-soft text-ok" : i.status === "monitoring" ? "bg-amber-soft text-amber-ink" : "bg-bad-soft text-bad")}>{i.status === "resolved" ? "Resolved" : i.status === "monitoring" ? "Monitoring" : "Investigating"}</Badge>
                  {i.status !== "resolved" && <Button size="sm" variant="outline" onClick={() => { dispatch({ type: "saIncident", id: i.id, status: "resolved" }); toast.success(`${i.id} resolved`, { description: "Affected customers are told." }) }}>Mark resolved</Button>}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="CRM sync by customer" sub="Time for a change to reach the customer's CRM. Target: under 2 minutes." bodyClass="px-0 sm:px-0 pb-1">
            <ul>
              {p.orgs.map((o) => (
                <li key={o.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 border-t px-5 py-3 first:border-0 sm:px-6">
                  <span className="min-w-0"><b className="block truncate text-foreground">{o.name}</b><span className="text-[13.5px] text-muted-foreground">{o.crm} · {o.region}</span></span>
                  <span className={cn("tabular text-[14.5px]", o.syncLagSec > 120 ? "font-semibold text-bad" : "text-foreground")}>{o.status === "suspended" ? "Stopped" : o.syncLagSec < 60 ? `${o.syncLagSec} s` : `${Math.floor(o.syncLagSec / 60)} min ${o.syncLagSec % 60} s`}</span>
                  <Health h={o.health} />
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <PlatformControls />
      </div>
    </div>
  )
}

/* ---------------- Announcements ---------------- */

export function SaAnnounce() {
  const { state, dispatch } = useStore()
  const p = state.platform
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [audience, setAudience] = useState("All tenants")
  const [kind, setKind] = useState<"info" | "maintenance">("info")
  const [window, setWindow] = useState("Sunday Nov 1, 02:00 to 03:00 UTC")
  const audiences = ["All tenants", ...p.orgs.filter((o) => o.status !== "suspended").map((o) => o.name), "Enterprise customers", "Growth customers"]
  const publish = () => {
    dispatch({ type: "saAnnounce", a: { id: `AN-${13 + p.announcements.length}`, title: title.trim(), body: body.trim(), audience, kind, status: "live", at: NOW.toISOString(), window: kind === "maintenance" ? window : undefined } })
    toast.success("Published", { description: `${audience} see it as a banner at the top of every page.` })
    setTitle(""); setBody("")
  }
  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" sub="A banner at the top of every page in the chosen customers' portals: for releases, planned maintenance or an incident." />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr] [&>*]:min-w-0">
        <Panel title={<span className="flex items-center gap-2"><Megaphone className="size-5 text-primary" /> New announcement</span>}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Kind</Label><Select value={kind} onValueChange={(v) => setKind(v as "info" | "maintenance")}><SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="info">News or release</SelectItem><SelectItem value="maintenance">Planned maintenance</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Who sees it</Label><Select value={audience} onValueChange={setAudience}><SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent>{audiences.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="an-title">Headline</Label><Input id="an-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "maintenance" ? "Planned maintenance this Sunday" : "Release 2.0 is coming"} className="h-11" /></div>
            <div className="space-y-1.5"><Label htmlFor="an-body">Details</Label><Textarea id="an-body" value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="One or two plain sentences: what changes and what people should do." /></div>
            {kind === "maintenance" && <div className="space-y-1.5"><Label htmlFor="an-window">When</Label><Input id="an-window" value={window} onChange={(e) => setWindow(e.target.value)} className="h-11" /><p className="text-[13.5px] text-muted-foreground">During the window, turn on maintenance mode from System health so portals go read-only.</p></div>}
            <div className="rounded-[12px] border border-dashed p-3">
              <p className="mb-2 text-[13px] font-medium text-muted-foreground">Preview</p>
              <div className={cn("rounded-[10px] px-4 py-2.5 text-[14.5px]", kind === "maintenance" ? "bg-amber-soft text-foreground" : "bg-brand-soft text-foreground")}><b>{title || "Your headline"}</b>{body ? ` · ${body}` : ""}{kind === "maintenance" && window ? ` · ${window}` : ""}</div>
            </div>
            <Button className="w-full sm:w-auto" disabled={!title.trim()} onClick={publish}><Send /> Publish to {audience}</Button>
          </div>
        </Panel>
        <Panel title="Published" bodyClass="px-0 sm:px-0 pb-1">
          <ul>
            {p.announcements.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 border-t px-5 py-3.5 first:border-0 sm:px-6">
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-[9px]", a.kind === "maintenance" ? "bg-amber-soft text-amber-ink" : "bg-brand-soft text-primary")}>{a.kind === "maintenance" ? <Wrench className="size-[18px]" /> : <Megaphone className="size-[18px]" />}</span>
                <span className="min-w-0 flex-1"><b className="block text-foreground">{a.title}</b><span className="text-[13.5px] text-muted-foreground">{a.audience} · {ago(a.at)}{a.window ? ` · ${a.window}` : ""}</span></span>
                {a.status === "live"
                  ? <><Badge className="border-0 bg-ok-soft text-ok">Showing</Badge><Button size="sm" variant="outline" onClick={() => { dispatch({ type: "saAnnounceEnd", id: a.id }); toast.success("Taken down") }}>Take down</Button></>
                  : <Badge variant="outline">Ended</Badge>}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}

/* ---------------- Usage and analytics ---------------- */

export function SaAnalytics() {
  const { state } = useStore()
  const p = state.platform
  const last = usageByMonth[usageByMonth.length - 1]
  const prev = usageByMonth[usageByMonth.length - 2]
  const growth = (a: number, b: number) => `${a >= b ? "+" : ""}${Math.round(((a - b) / b) * 100)}% on last month`
  return (
    <div className="space-y-6">
      <PageHeader title="Usage and analytics" sub="How customers use the platform: people, decisions, agent work and which modules they've switched on." />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Active users, October" value={String(last.users)} sub={growth(last.users, prev.users)} />
        <Stat label="Deal decisions" value={last.decisions.toLocaleString("en-US")} sub={growth(last.decisions, prev.decisions)} />
        <Stat label="Agent actions" value={last.actions.toLocaleString("en-US")} sub={growth(last.actions, prev.actions)} />
        <Stat label="AI cost per decision" value={money(Math.round(p.orgs.reduce((n, o) => n + o.aiCost, 0) / last.decisions * 100) / 100)} sub="Across every tenant" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Panel title="Active users by month"><Bars rows={usageByMonth.map((m) => ({ label: m.month, value: m.users }))} /></Panel>
        <Panel title="Agent actions by month"><Bars rows={usageByMonth.map((m) => ({ label: m.month, value: m.actions, tone: "bg-amber" }))} /></Panel>
        <Panel title="Modules switched on" sub="Share of customers using each"><Bars rows={moduleAdoption.map((m) => ({ label: m.module, value: m.pct, tone: "bg-ok" }))} fmt={(n) => `${n}%`} /></Panel>
        <Panel title="By customer" bodyClass="px-0 sm:px-0 pb-1">
          <ul>
            {p.orgs.map((o) => (
              <li key={o.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 border-t px-5 py-3 first:border-0 sm:grid-cols-[minmax(0,1fr)_90px_110px] sm:px-6">
                <span className="min-w-0"><b className="block truncate text-foreground">{o.name}</b><span className="text-[13.5px] text-muted-foreground">{planName(o.plan)} · {o.partners} partners</span></span>
                <span className="text-right text-[14.5px] tabular">{(o.staff + o.partnerUsers).toLocaleString("en-US")} <span className="text-muted-foreground">users</span></span>
                <span className="hidden text-right text-[14.5px] tabular sm:block">{o.agentActions.toLocaleString("en-US")} <span className="text-muted-foreground">actions</span></span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
