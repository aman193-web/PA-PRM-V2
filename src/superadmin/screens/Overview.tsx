import { ArrowRight, Building2, ChevronRight } from "lucide-react"
import { Panel } from "@/components/common"
import { Button } from "@/components/ui/button"
import { ago, money } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { admin, planName, usageByMonth } from "@/superadmin/data"
import { Health, OrgStatus, PlatformControls, Stat } from "@/superadmin/screens/bits"

/** The platform at a glance: customers, revenue, usage, what needs attention, and the two platform-wide switches. */
export function SaOverview() {
  const { state } = useStore()
  const p = state.platform
  const live = p.orgs.filter((o) => o.status !== "suspended")
  const users = p.orgs.reduce((n, o) => n + o.staff + o.partnerUsers, 0)
  const mrr = p.orgs.filter((o) => o.status === "active" || o.status === "onboarding").reduce((n, o) => n + o.mrr, 0)
  const actions = p.orgs.reduce((n, o) => n + o.agentActions, 0)
  const attention = [
    ...p.events.filter((e) => e.status === "open" && e.severity !== "low").map((e) => ({ id: e.id, text: e.text, href: "/s/security", tone: e.severity === "high" ? "bad" : "warn" })),
    ...p.invoices.filter((i) => i.status === "overdue").map((i) => ({ id: i.id, text: `${p.orgs.find((o) => o.id === i.orgId)?.name}: ${i.id} overdue, ${money(i.amount)}`, href: "/s/billing", tone: "bad" })),
    ...p.providers.filter((x) => x.status === "review").map((x) => ({ id: x.id, text: `AI provider waiting for review: ${x.name}`, href: "/s/ai", tone: "warn" })),
    ...p.dataRequests.filter((d) => d.status === "new").map((d) => ({ id: d.id, text: `Data ${d.kind} request from ${p.orgs.find((o) => o.id === d.orgId)?.name}, due ${d.due}`, href: "/s/data", tone: "warn" })),
    ...p.orgs.filter((o) => o.status === "trial" && o.trialEnds).map((o) => ({ id: `t-${o.id}`, text: `${o.name}'s trial ends ${o.trialEnds}`, href: `/s/org/${o.id}`, tone: "info" })),
  ]
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] leading-tight font-bold sm:text-[32px]">Good afternoon, {admin.first}.</h1>
        <p className="mt-1.5 text-[16.5px] text-muted-foreground">{p.orgs.length} customers on the platform, {live.length} signed in and working. {attention.length ? <b className="text-foreground">{attention.length} things need attention.</b> : "Nothing needs attention."}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        <Stat label="Customers" value={String(p.orgs.length)} sub={`${p.orgs.filter((o) => o.status === "active").length} active · ${p.orgs.filter((o) => o.status === "trial").length} trial · ${p.orgs.filter((o) => o.status === "suspended").length} suspended`} href="/s/orgs" />
        <Stat label="People with access" value={users.toLocaleString("en-US")} sub="Staff and partner users, all tenants" href="/s/users" />
        <Stat label="Monthly recurring revenue" value={money(mrr)} sub="Active and onboarding customers" href="/s/billing" />
        <Stat label="Agent actions, 30 days" value={actions.toLocaleString("en-US")} sub={p.aiPaused ? "Paused everywhere" : `${money(p.orgs.reduce((n, o) => n + o.aiCost, 0))} AI cost`} href="/s/ai" />
        <div className="col-span-2 xl:col-span-1"><Stat label="Uptime, 30 days" value="99.96%" sub={p.incidents.some((i) => i.status !== "resolved") ? "1 incident being monitored" : "No open incidents"} href="/s/health" /></div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <div className="space-y-6">
          <Panel title="Needs attention" bodyClass="px-0 sm:px-0 pb-1">
            {attention.length === 0 ? <p className="px-6 pb-4 text-muted-foreground">Nothing right now.</p> : (
              <ul>{attention.map((a) => (
                <li key={a.id} className="border-t first:border-0">
                  <a href={`#${a.href}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 sm:px-6">
                    <span className={cn("size-2.5 shrink-0 rounded-full", a.tone === "bad" ? "bg-bad" : a.tone === "warn" ? "bg-amber" : "bg-primary")} />
                    <span className="min-w-0 flex-1 text-[15px] text-foreground">{a.text}</span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </a>
                </li>
              ))}</ul>
            )}
          </Panel>
          <Panel title="Customers" action={<Button variant="ghost" onClick={() => go("/s/orgs")}>All <ArrowRight /></Button>} bodyClass="px-0 sm:px-0 pb-1">
            <ul>
              {p.orgs.map((o) => (
                <li key={o.id} className="border-t">
                  <a href={`#/s/org/${o.id}`} className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 hover:bg-muted/50 sm:grid-cols-[36px_minmax(0,1fr)_110px_100px_auto] sm:px-6">
                    <span className="grid size-9 place-items-center rounded-[9px] bg-brand-soft text-primary"><Building2 className="size-[18px]" /></span>
                    <span className="min-w-0"><b className="block truncate text-foreground">{o.name}</b><span className="text-[13.5px] text-muted-foreground">{planName(o.plan)} · {o.region} · Stage {o.stage}</span></span>
                    <span className="hidden sm:block"><Health h={o.health} /></span>
                    <b className="hidden text-right text-foreground tabular sm:block">{money(o.mrr)}</b>
                    <OrgStatus o={o} />
                  </a>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <div className="space-y-6">
          <PlatformControls />
          <Panel title="Growth" sub="All tenants, by month">
            <ul className="grid grid-cols-4 gap-2 text-center">
              {usageByMonth.map((m) => (
                <li key={m.month} className="rounded-[10px] bg-muted/60 px-2 py-2.5"><b className="block text-[17px] text-foreground tabular">{m.users}</b><span className="text-[12.5px] text-muted-foreground">users · {m.month}</span></li>
              ))}
            </ul>
          </Panel>
          <Panel title="Recent platform changes" action={<Button variant="ghost" onClick={() => go("/s/audit")}>All <ArrowRight /></Button>}>
            <ul className="space-y-3">{p.audit.slice(0, 5).map((a) => <li key={a.id} className="text-[14.5px]"><span className="block text-foreground">{a.text}</span><span className="text-[13px] text-muted-foreground">{a.actor} · {ago(a.at)}</span></li>)}</ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}
