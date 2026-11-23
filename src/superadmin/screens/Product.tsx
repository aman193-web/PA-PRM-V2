import { useState } from "react"
import { Bell, Check, CircleDollarSign, Cpu, Mail, Plug, Rocket, ShieldAlert, X } from "lucide-react"
import { toast } from "sonner"
import { PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { date, money } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { agentReleases, apiStats, connectors, planName, plans } from "@/superadmin/data"
import { Bars, ConfirmButton, PlatformControls, Stat } from "@/superadmin/screens/bits"

/* ---------------- Plans and billing ---------------- */

export function SaBilling() {
  const { state, dispatch } = useStore()
  const p = state.platform
  const mrr = p.orgs.filter((o) => o.status === "active" || o.status === "onboarding").reduce((n, o) => n + o.mrr, 0)
  const overdue = p.invoices.filter((i) => i.status === "overdue")
  const name = (id: string) => p.orgs.find((o) => o.id === id)?.name ?? id
  return (
    <div className="space-y-6">
      <PageHeader title="Plans and billing" sub="What each customer pays, what each plan includes, and invoices. Example prices." />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Monthly recurring revenue" value={money(mrr)} sub={`${money(mrr * 12)} a year`} />
        <Stat label="Paying customers" value={String(p.orgs.filter((o) => o.mrr > 0 && o.status !== "suspended").length)} sub={`${p.orgs.filter((o) => o.status === "trial").length} on trial`} />
        <Stat label="Overdue" value={money(overdue.reduce((n, i) => n + i.amount, 0))} sub={`${overdue.length} invoices`} />
        <Stat label="AI cost passed through" value={money(p.orgs.reduce((n, o) => n + o.aiCost, 0))} sub="This month, all tenants" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((pl) => {
          const on = p.orgs.filter((o) => o.plan === pl.id)
          return (
            <Panel key={pl.id} title={pl.name} sub={pl.price}>
              <p className="text-[14px] text-muted-foreground">{pl.staff} · {pl.partners} · {pl.aiActions}</p>
              <ul className="mt-3 space-y-1.5">{pl.features.map((f) => <li key={f} className="flex gap-2 text-[14.5px] text-foreground"><Check className="mt-0.5 size-4 shrink-0 text-ok" />{f}</li>)}</ul>
              <p className="mt-4 text-[14px] text-muted-foreground">{on.length ? `Used by ${on.map((o) => o.name).join(", ")}` : "No customers yet"}</p>
            </Panel>
          )
        })}
      </div>
      <Panel title="Invoices" sub="Newest first" bodyClass="px-0 sm:px-0 pb-1">
        <ul>
          {p.invoices.map((i) => (
            <li key={i.id} className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-t px-5 py-3 first:border-0 sm:px-6 md:grid-cols-[minmax(0,1fr)_110px_110px_100px_auto]", i.status === "overdue" && "bg-bad-soft/20")}>
              <span className="min-w-0"><b className="block text-foreground">{name(i.orgId)}</b><span className="text-[13.5px] text-muted-foreground">{i.id} · {i.period} · {planName(p.orgs.find((o) => o.id === i.orgId)?.plan ?? "")}</span></span>
              <b className="text-right text-foreground tabular">{money(i.amount)}</b>
              <span className="text-[14px] text-muted-foreground">Due {date(i.due, { month: "short", day: "numeric" })}</span>
              <Badge className={cn("w-fit border-0", i.status === "paid" ? "bg-ok-soft text-ok" : i.status === "overdue" ? "bg-bad-soft text-bad" : "bg-secondary text-foreground")}>{i.status === "paid" ? "Paid" : i.status === "overdue" ? "Overdue" : "Open"}</Badge>
              <span className="col-span-2 flex gap-1.5 md:col-span-1 md:justify-end">
                {i.status !== "paid" && <Button size="sm" variant="ghost" onClick={() => { dispatch({ type: "saInvoice", id: i.id, action: "remind" }); toast.success("Reminder sent", { description: `To ${p.orgs.find((o) => o.id === i.orgId)?.adminEmail}` }) }}><Mail /> Remind</Button>}
                {i.status !== "paid" && <Button size="sm" variant="outline" onClick={() => { dispatch({ type: "saInvoice", id: i.id, action: "paid" }); toast.success(`${i.id} marked as paid`) }}><CircleDollarSign /> Mark paid</Button>}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}

/* ---------------- Features and releases ---------------- */

export function SaFlags() {
  const { state, dispatch } = useStore()
  const p = state.platform
  const [pct, setPct] = useState<Record<string, number>>({})
  return (
    <div className="space-y-6">
      <PageHeader title="Features and releases" sub="Switch features on or off per customer, and roll releases out gradually. A feature outside a customer's plan can still be switched on as an exception." />
      <Panel title="Feature flags" sub="Each column is a customer. Plans set the defaults for new customers." bodyClass="px-0 sm:px-0 pb-1">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-[14.5px]">
            <thead><tr className="border-y bg-surface-2/60 text-left text-[13.5px] text-muted-foreground"><th className="px-6 py-2.5 font-medium">Feature</th>{p.orgs.map((o) => <th key={o.id} className="px-2 py-2.5 text-center font-medium">{o.name.split(" ")[0]}</th>)}<th className="px-4 py-2.5 text-right font-medium">Everyone</th></tr></thead>
            <tbody>
              {p.flags.map((f) => {
                const all = p.orgs.every((o) => f.on[o.id])
                return (
                  <tr key={f.id} className="border-b last:border-0">
                    <td className="px-6 py-3"><b className="block text-foreground">{f.name}</b><span className="text-[13px] text-muted-foreground">Stage {f.stage} · in {f.plans.map(planName).join(", ")}</span></td>
                    {p.orgs.map((o) => <td key={o.id} className="px-2 text-center"><Switch checked={!!f.on[o.id]} onCheckedChange={(v) => { dispatch({ type: "saFlag", flag: f.id, orgId: o.id, on: v }); toast.success(`${f.name} ${v ? "on" : "off"} for ${o.name}`) }} aria-label={`${f.name} for ${o.name}`} /></td>)}
                    <td className="px-4 text-right">
                      <ConfirmButton size="sm" variant="outline" label={all ? "Off for all" : "On for all"} title={`${all ? "Turn off" : "Turn on"} ${f.name} for every customer?`} body={all ? "Customers lose this feature at their next page load. Their data is kept." : "Every customer gets it, including those whose plan doesn't include it."} onConfirm={() => { dispatch({ type: "saFlag", flag: f.id, orgId: "all", on: !all }); toast.success(`${f.name} ${all ? "off" : "on"} for everyone`) }} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title={<span className="flex items-center gap-2"><Rocket className="size-5 text-primary" /> Releases</span>} sub="Rolled out to a share of customers first; Brightline gets new releases in the first wave">
        <ul className="space-y-4">
          {p.releases.map((r) => {
            const v = pct[r.version] ?? r.rollout
            return (
              <li key={r.version} className="rounded-[12px] border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><b className="text-[16px] text-foreground">Release {r.version} <span className="text-[13.5px] font-normal text-muted-foreground">· {date(r.date)}</span></b><Badge className={cn("border-0", r.status === "live" ? "bg-ok-soft text-ok" : r.status === "rolling" ? "bg-amber-soft text-amber-ink" : "bg-secondary text-foreground")}>{r.status === "live" ? "Live everywhere" : r.status === "rolling" ? `Rolling out · ${r.rollout}%` : "Scheduled"}</Badge></div>
                <ul className="mt-2 space-y-1">{r.notes.map((n) => <li key={n} className="text-[14.5px] text-foreground">· {n}</li>)}</ul>
                {r.status !== "live" && (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <input type="range" min={0} max={100} step={25} value={v} onChange={(e) => setPct({ ...pct, [r.version]: Number(e.target.value) })} className="w-48 accent-[var(--primary)]" aria-label={`Rollout for ${r.version}`} />
                    <span className="w-12 text-[14.5px] font-semibold tabular">{v}%</span>
                    <Button size="sm" variant="outline" disabled={v === r.rollout} onClick={() => { dispatch({ type: "saRollout", version: r.version, pct: v }); toast.success(`Release ${r.version} at ${v}% of customers`) }}>Apply</Button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </Panel>
    </div>
  )
}

/* ---------------- AI platform ---------------- */

export function SaAi() {
  const { state, dispatch } = useStore()
  const p = state.platform
  return (
    <div className="space-y-6">
      <PageHeader title="AI platform" sub="The agents the product team ships, the AI providers customers may use, and AI spend per customer. Each customer's own AI supervisor tunes their agents within what you allow here." />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr] [&>*]:min-w-0">
        <div className="space-y-6">
          <Panel title="AI providers" sub="A provider is a data processor: it's approved here before any customer can choose it">
            <ul className="space-y-3">
              {p.providers.map((x) => (
                <li key={x.id} className={cn("rounded-[12px] border p-4", x.status === "review" && "border-amber/60")}>
                  <div className="flex flex-wrap items-center justify-between gap-2"><b className="text-foreground">{x.name}</b><Badge className={cn("border-0", x.status === "approved" ? "bg-ok-soft text-ok" : x.status === "review" ? "bg-amber-soft text-amber-ink" : "bg-bad-soft text-bad")}>{x.status === "approved" ? "Approved" : x.status === "review" ? "In security review" : "Blocked"}</Badge></div>
                  <p className="text-[14px] text-muted-foreground">{x.models} · regions {x.regions}</p>
                  <p className="mt-1 text-[14px] text-foreground">{x.note}</p>
                  {x.status === "review" && (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" className="bg-ok text-white hover:bg-ok/90" onClick={() => { dispatch({ type: "saProvider", id: x.id, status: "approved" }); toast.success(`${x.name} approved`, { description: "Customers' AI supervisors can choose it now." }) }}><Check /> Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => { dispatch({ type: "saProvider", id: x.id, status: "blocked" }); toast.success(`${x.name} blocked`) }}><X /> Block</Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Agent versions" sub="Shipped by the product team; customers get them with each release" bodyClass="px-0 sm:px-0 pb-1">
            <ul>{agentReleases.map((a) => <li key={a.agent} className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3 first:border-0 sm:px-6"><span><b className="text-foreground">{a.agent}</b> <span className="text-[13.5px] text-muted-foreground">· {a.version}, was {a.previous}</span></span><Badge variant="outline">{a.rolledTo}</Badge></li>)}</ul>
          </Panel>
        </div>
        <div className="space-y-6">
          <PlatformControls />
          <Panel title={<span className="flex items-center gap-2"><Cpu className="size-5 text-primary" /> AI spend by customer</span>} sub="This month against each customer's cap">
            <Bars rows={p.orgs.map((o) => ({ label: `${o.name} · cap ${money(o.aiCap)}`, value: o.aiCost, tone: o.aiCost / o.aiCap > 0.85 ? "bg-bad" : "bg-primary" }))} fmt={money} />
            <p className="mt-3 text-[13.5px] text-muted-foreground">Change a customer's cap on its organization page.</p>
          </Panel>
          <p className="flex gap-2 rounded-[12px] bg-amber-soft/60 px-4 py-3 text-[14.5px] text-foreground"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-ink" /> No setting here can let an agent move money, change access, export data, demote or terminate a partner (R-AG-2).</p>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Integrations and API ---------------- */

export function SaIntegrations() {
  return (
    <div className="space-y-6">
      <PageHeader title="Integrations and API" sub="The connectors the platform offers, how many customers use each, and their error rates. Each customer's IT admin connects and approves their own." />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        <Stat label="API calls, 24 h" value={apiStats.calls24h.toLocaleString("en-US")} sub={`${apiStats.errors24h}% errors`} />
        <Stat label="API keys" value={String(apiStats.keys)} sub="Across every customer" />
        <Stat label="Webhooks" value={String(apiStats.webhooks)} sub="Active subscriptions" />
        <Stat label="MCP clients" value={String(apiStats.mcpClients)} sub="AI assistants connected" />
        <div className="col-span-2 xl:col-span-1"><Stat label="Connectors" value={String(connectors.filter((c) => c.status === "ga").length)} sub={`${connectors.filter((c) => c.status === "beta").length} in beta`} /></div>
      </div>
      <Panel title={<span className="flex items-center gap-2"><Plug className="size-5 text-primary" /> Connectors</span>} bodyClass="px-0 sm:px-0 pb-1">
        <div className="hidden gap-x-4 border-y bg-surface-2/60 px-6 py-3 text-[14px] font-medium text-muted-foreground md:grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_110px_100px_100px]">
          <span>Connector</span><span>Available on</span><span>Status</span><span className="text-right">Customers</span><span className="text-right">Errors</span>
        </div>
        <ul>
          {connectors.map((c) => (
            <li key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b px-5 py-3 last:border-0 sm:px-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_110px_100px_100px]">
              <span className="min-w-0"><b className="block text-foreground">{c.name}</b><span className="text-[13.5px] text-muted-foreground">{c.kind}</span></span>
              <span className="hidden text-[14px] text-foreground md:block">{c.plans}</span>
              <Badge className={cn("w-fit border-0", c.status === "ga" ? "bg-ok-soft text-ok" : c.status === "beta" ? "bg-amber-soft text-amber-ink" : "bg-secondary text-foreground")}>{c.status === "ga" ? "Available" : c.status === "beta" ? "Beta" : "Planned"}</Badge>
              <span className="hidden text-right tabular md:block">{c.tenants}</span>
              <span className={cn("hidden text-right tabular md:block", c.errorRate > 1 ? "font-semibold text-bad" : "text-foreground")}>{c.errorRate}%</span>
            </li>
          ))}
        </ul>
      </Panel>
      <p className="flex gap-2 text-[14px] text-muted-foreground"><Bell className="mt-0.5 size-4 shrink-0" /> HubSpot's error rate is above 1%: worth checking before it leaves beta in release 2.0.</p>
    </div>
  )
}
