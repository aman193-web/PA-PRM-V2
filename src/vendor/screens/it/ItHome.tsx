import type { ReactNode } from "react"
import { ArrowRight, CheckCircle2, ChevronRight, GitMerge, KeyRound, Plug, ShieldCheck, Shuffle, UserMinus, Users, Workflow } from "lucide-react"
import { Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { salesforce } from "@/data/model"
import { Kpi } from "@/partner/bits"
import { securityPackage } from "@/vendor/admin"
import { useAdmin, useVendor, type ItTask } from "@/vendor/useVendor"
import { AskBar, Greeting, Recent } from "@/vendor/screens/ops/OpsHome"

export const taskIcon: Record<ItTask["kind"], ReactNode> = { mapping: <Shuffle />, connector: <Plug />, group: <Users />, leaver: <UserMinus />, merge: <GitMerge />, support: <KeyRound /> }
const taskTile: Record<ItTask["kind"], string> = { mapping: "bg-brand-soft text-primary", connector: "bg-amber-soft text-amber-ink", group: "bg-secondary text-foreground", leaver: "bg-bad-soft text-bad", merge: "bg-ok-soft text-ok", support: "bg-bad-soft text-bad" }

export function TaskRow({ t }: { t: ItTask }) {
  return (
    <li className="border-b last:border-0">
      <a href={`#${t.href}`} className="grid grid-cols-[40px_minmax(0,1fr)_20px] items-center gap-4 px-5 py-3.5 hover:bg-muted/50 sm:px-6">
        <span className={cn("grid size-10 place-items-center rounded-[10px] [&_svg]:size-5", taskTile[t.kind])}>{taskIcon[t.kind]}</span>
        <span className="min-w-0"><b className="block text-[15.5px] leading-snug text-foreground">{t.title}</b><span className="text-[14px] text-muted-foreground">{t.sub}</span></span>
        <ChevronRight className="size-5 text-muted-foreground" />
      </a>
    </li>
  )
}

/** The CRM admin's laptop view: is everything connected, and what's waiting for an admin's approval. */
export function ItHome() {
  const { state } = useStore()
  const { me } = useVendor()
  const a = useAdmin()
  const synced = a.writes.filter((w) => w.status === "synced").length
  return (
    <div className="space-y-6">
      <Greeting name={me.first} line={<>Salesforce, Okta and Slack are connected.{a.tasks.length ? <> <b className="text-foreground">{a.tasks.length} {a.tasks.length === 1 ? "thing needs" : "things need"} you.</b></> : " Nothing needs you."}</>} />
      <AskBar placeholder="Ask about integrations, users or the audit log…" example="Is Salesforce in sync?" />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <div className="relative col-span-2 overflow-hidden rounded-[14px] bg-night p-6 text-white">
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative flex h-full flex-col">
            <p className="text-[15px] font-medium text-[#b9cbe4]">Salesforce sync lag</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
              <span className="text-[48px] leading-none font-bold tabular">1 min 40 s</span>
              <span className="text-[15.5px] text-[#cfe0f7]">Target under 5 minutes (R-SEC-7)</span>
            </div>
            <div className="mt-5 h-2.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-amber" style={{ width: `${(salesforce.lagSeconds / 300) * 100}%` }} /></div>
            <p className="mt-2 text-[14.5px] text-[#cfe0f7]">{synced} of the last {a.writes.length} writes went through{a.retrying.length ? ` · ${a.retrying.length} retrying` : ""} · 99.97% available this month</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <Button size="lg" className="bg-white text-night hover:bg-white/90" onClick={() => go("/v/mappings")}><Shuffle /> Review mappings</Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => go("/v/connections")}><Workflow /> Connections</Button>
            </div>
          </div>
        </div>
        <Kpi icon={<Shuffle />} label="Waiting for your approval" value={String(a.pendingMappings.length + a.requested.length)} sub={`${a.pendingMappings.length} field ${a.pendingMappings.length === 1 ? "mapping" : "mappings"} · ${a.requested.length} ${a.requested.length === 1 ? "connector" : "connectors"}`} href="/v/mappings" />
        <Kpi icon={<Users />} label="People with PRM access" value={String(a.provisioned)} sub={a.newGroups.length ? `${a.newGroups.reduce((n, g) => n + g.people, 0)} more waiting for a role` : "From Okta groups, through SCIM"} href="/v/users" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <Panel title="Needs you" sub="Things only an admin can do" bodyClass="px-0 sm:px-0 pb-1">
          {a.tasks.length === 0 ? <p className="px-6 pb-4 text-muted-foreground">You're all caught up.</p> : <ul>{a.tasks.map((t) => <TaskRow key={t.id} t={t} />)}</ul>}
        </Panel>
        <div className="space-y-6">
          <Panel title={<span className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /> Security package</span>} sub="Reviewed before go-live (Stage 0)" action={<Button variant="ghost" onClick={() => go("/v/connections")}>Setup <ArrowRight /></Button>}>
            <ul className="space-y-2.5">
              {securityPackage.map((x) => (
                <li key={x.item} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" />
                  <span className="min-w-0"><span className="block text-[15px] text-foreground">{x.item}</span><span className="text-[13.5px] text-muted-foreground">{x.status} · {x.note}</span></span>
                </li>
              ))}
            </ul>
          </Panel>
          <Recent items={state.itFeed} />
        </div>
      </div>
      <p className="text-[14px] text-muted-foreground"><Badge variant="outline" className="mr-2 border-dashed">Stage 0</Badge>You see what support needs: connections, users and the audit log. Program rules, credit and partner decisions stay with their owners.</p>
    </div>
  )
}
