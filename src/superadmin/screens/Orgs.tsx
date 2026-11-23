import { useState } from "react"
import { Building2, ChevronRight, LifeBuoy, Pause, Play, Plus, Search } from "lucide-react"
import { toast } from "sonner"
import { EmptyState, PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { NOW, ago, date, money } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { planName, plans, type Org, type PlanId } from "@/superadmin/data"
import { Health, OrgStatus, Stat } from "@/superadmin/screens/bits"
import { Facts } from "@/chief/screens/Approvals"

/** Create a customer: company, plan, region and its first admin, who gets an invitation. */
function CreateOrg({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const [name, setName] = useState("")
  const [domain, setDomain] = useState("")
  const [plan, setPlan] = useState<PlanId>("growth")
  const [region, setRegion] = useState<"US" | "EU">("US")
  const [adminName, setAdminName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [trial, setTrial] = useState(true)
  const d = domain.trim().toLowerCase()
  const taken = state.platform.orgs.some((o) => o.domain === d || o.name.toLowerCase() === name.trim().toLowerCase())
  const ok = name.trim().length >= 2 && /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d) && !taken && adminName.trim().length >= 3 && adminEmail.trim().toLowerCase().endsWith(`@${d}`)
  const create = () => {
    const p = plans.find((x) => x.id === plan)!
    const org: Org = {
      id: d.split(".")[0], name: name.trim(), domain: d, industry: "Not set", plan, region, status: trial ? "trial" : "onboarding", stage: "0 · sandbox",
      createdAt: NOW.toISOString().slice(0, 10), admin: adminName.trim(), adminEmail: adminEmail.trim().toLowerCase(), sso: "Not set up yet", crm: "Not connected",
      staff: 1, partnerUsers: 0, partners: 0, mrr: trial ? 0 : p.monthly, agentActions: 0, aiCost: 0, aiCap: plan === "starter" ? 150 : plan === "growth" ? 1_000 : 1_500,
      syncLagSec: 0, health: "good", trialEnds: trial ? "2026-11-27" : undefined, note: "New: waiting for the admin to accept the invitation and connect the CRM.",
    }
    dispatch({ type: "saCreateOrg", org })
    toast.success(`${org.name} is created`, { description: `${adminName} gets an invitation to set up SSO and connect the CRM. Data stays in the ${region}.` })
    onClose(); go(`/s/org/${org.id}`)
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader><DialogTitle>New organization</DialogTitle><DialogDescription>A new customer gets its own isolated tenant (R-SEC-1). Its first admin is invited to set up sign-in and connect the CRM.</DialogDescription></DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label htmlFor="o-name">Company name</Label><Input id="o-name" value={name} onChange={(e) => setName(e.target.value)} className="h-11" placeholder="e.g. Fernhill Data" /></div>
            <div className="grid gap-1.5"><Label htmlFor="o-dom">Email domain</Label><Input id="o-dom" value={domain} onChange={(e) => setDomain(e.target.value)} className="h-11" placeholder="fernhill.com" /></div>
          </div>
          {taken && <p className="-mt-2 text-[14px] text-bad">That company or domain is already a customer.</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label>Plan</Label>
              <Select value={plan} onValueChange={(v) => setPlan(v as PlanId)}><SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent>{plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} · {p.price}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="grid gap-1.5"><Label>Data region</Label>
              <Select value={region} onValueChange={(v) => setRegion(v as "US" | "EU")}><SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="US">United States</SelectItem><SelectItem value="EU">European Union</SelectItem></SelectContent></Select>
            </div>
          </div>
          <p className="-mt-2 text-[13.5px] text-muted-foreground">The region can't be changed later without a data migration.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label htmlFor="o-an">First admin</Label><Input id="o-an" value={adminName} onChange={(e) => setAdminName(e.target.value)} className="h-11" placeholder="Their IT / CRM admin" /></div>
            <div className="grid gap-1.5"><Label htmlFor="o-ae">Their work email</Label><Input id="o-ae" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="h-11" placeholder={d ? `name@${d}` : "name@company.com"} /></div>
          </div>
          {adminEmail && d && !adminEmail.trim().toLowerCase().endsWith(`@${d}`) && <p className="-mt-2 text-[14px] text-bad">The admin's email must be on {d}.</p>}
          <label className="flex items-center justify-between gap-3 rounded-[12px] border px-4 py-3"><span><b className="block text-[15px] text-foreground">Start as a 30-day trial</b><span className="text-[13.5px] text-muted-foreground">No invoice until the trial converts</span></span><Switch checked={trial} onCheckedChange={setTrial} /></label>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={!ok} onClick={create}><Plus /> Create and invite</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SaOrgs() {
  const { state } = useStore()
  const [q, setQ] = useState("")
  const [creating, setCreating] = useState(false)
  const rows = state.platform.orgs.filter((o) => `${o.name} ${o.domain} ${o.status} ${o.plan}`.toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <div>
      <PageHeader title="Organizations" sub="Every customer on the platform. Each is an isolated tenant: its own users, partners, data, rules and agents." actions={<Button size="lg" onClick={() => setCreating(true)}><Plus /> New organization</Button>} />
      <div className="relative mb-4 max-w-[420px]">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name, domain, plan or status" aria-label="Filter organizations" className="h-11 w-full rounded-[12px] border bg-card pr-3 pl-11 text-[15.5px] text-foreground outline-none focus:border-primary" />
      </div>
      <Panel bodyClass="p-0 sm:p-0">
        <div className="hidden gap-x-4 border-b bg-surface-2/60 px-6 py-3 text-[14px] font-medium text-muted-foreground lg:grid lg:grid-cols-[minmax(0,1.5fr)_110px_70px_110px_120px_110px_110px_20px]">
          <span>Organization</span><span>Plan</span><span>Region</span><span className="text-right">People</span><span className="text-right">MRR</span><span>Health</span><span>Status</span><span />
        </div>
        {rows.length === 0 ? <EmptyState icon={<Building2 className="size-6" />} title="No organizations match" /> : (
          <ul>
            {rows.map((o) => (
              <li key={o.id} className="border-b last:border-0">
                <a href={`#/s/org/${o.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-muted/50 sm:px-6 lg:grid-cols-[minmax(0,1.5fr)_110px_70px_110px_120px_110px_110px_20px]">
                  <span className="min-w-0"><b className="block truncate text-foreground">{o.name}</b><span className="text-[13.5px] text-muted-foreground">{o.domain} · since {date(o.createdAt, { month: "short", year: "numeric" })}</span></span>
                  <span className="hidden text-[14.5px] text-foreground lg:block">{planName(o.plan)}</span>
                  <span className="hidden text-[14.5px] text-foreground lg:block">{o.region}</span>
                  <span className="hidden text-right text-[14.5px] text-foreground tabular lg:block">{o.staff + o.partnerUsers}</span>
                  <b className="hidden text-right text-foreground tabular lg:block">{money(o.mrr)}</b>
                  <span className="hidden lg:block"><Health h={o.health} /></span>
                  <span className="justify-self-end lg:justify-self-start"><OrgStatus o={o} /></span>
                  <ChevronRight className="hidden size-5 text-muted-foreground lg:block" />
                  <span className="col-span-2 text-[13.5px] text-muted-foreground lg:hidden">{planName(o.plan)} · {o.region} · {o.staff + o.partnerUsers} people · {money(o.mrr)} a month</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <CreateOrg key={`c-${creating}`} open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}

/** One customer: profile, plan, usage against limits, features, AI cap, support access, suspend or reactivate. */
export function SaOrg({ id = "" }: { id?: string }) {
  const { state, dispatch } = useStore()
  const o = state.platform.orgs.find((x) => x.id === id)
  const [suspending, setSuspending] = useState(false)
  const [reason, setReason] = useState("")
  const [asking, setAsking] = useState(false)
  const [why, setWhy] = useState("")
  const [cap, setCap] = useState(String(o?.aiCap ?? ""))
  if (!o) return <div><PageHeader title="Organization" back={{ label: "Organizations", href: "/s/orgs" }} /><Panel><EmptyState title="We couldn't find that organization" /></Panel></div>
  const plan = plans.find((p) => p.id === o.plan)!
  const flags = state.platform.flags
  const access = state.platform.support.filter((x) => x.orgId === o.id)
  const live = access.find((x) => x.status === "granted" || x.status === "requested")
  const invoices = state.platform.invoices.filter((i) => i.orgId === o.id)
  const aiPct = Math.min(100, Math.round((o.aiCost / o.aiCap) * 100))
  return (
    <div className="space-y-6">
      <PageHeader back={{ label: "Organizations", href: "/s/orgs" }} title={<span className="flex flex-wrap items-center gap-3">{o.name} <OrgStatus o={o} /></span>} sub={`${o.domain} · ${o.industry} · ${plan.name} plan · data in the ${o.region} · Stage ${o.stage}`}
        actions={o.status === "suspended"
          ? <Button onClick={() => { dispatch({ type: "saOrgStatus", id: o.id, status: "active", reason: "" }); toast.success(`${o.name} is active again`, { description: "Its people can sign in now." }) }}><Play /> Reactivate</Button>
          : <Button variant="outline" className="border-bad/40 text-bad hover:bg-bad-soft hover:text-bad" onClick={() => setSuspending(true)}><Pause /> Suspend</Button>} />
      {o.note && <p className="rounded-[12px] border border-amber/50 bg-amber-soft/40 px-4 py-3 text-[15px] text-foreground">{o.note}</p>}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="People" value={String(o.staff + o.partnerUsers)} sub={`${o.staff} staff · ${o.partnerUsers} partner users · ${plan.staff}`} />
        <Stat label="Partners" value={String(o.partners)} sub={plan.partners} />
        <Stat label="Monthly revenue" value={money(o.mrr)} sub={o.status === "trial" ? `Trial ends ${o.trialEnds}` : plan.price} />
        <Stat label="Agent actions, 30 days" value={o.agentActions.toLocaleString("en-US")} sub={`${money(o.aiCost)} AI cost`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr] [&>*]:min-w-0">
        <div className="space-y-6">
          <Panel title="Features for this customer" sub={`${plan.name} includes ${flags.filter((f) => f.plans.includes(o.plan)).length} of ${flags.length}; you can switch any on or off`} bodyClass="px-0 sm:px-0 pb-1">
            <ul>
              {flags.map((f) => {
                const on = !!f.on[o.id]
                const inPlan = f.plans.includes(o.plan)
                return (
                  <li key={f.id} className="flex items-center justify-between gap-3 border-t px-5 py-3 sm:px-6">
                    <span className="min-w-0"><b className="block text-[15px] text-foreground">{f.name} <span className="font-mono text-[12px] font-normal text-muted-foreground">Stage {f.stage}</span></b><span className="text-[13.5px] text-muted-foreground">{inPlan ? f.what : `Not in ${plan.name}: switching it on is an exception`}</span></span>
                    <Switch checked={on} onCheckedChange={(v) => { dispatch({ type: "saFlag", flag: f.id, orgId: o.id, on: v }); toast.success(`${f.name} ${v ? "on" : "off"} for ${o.name}`) }} aria-label={`${f.name} for ${o.name}`} />
                  </li>
                )
              })}
            </ul>
          </Panel>
          <Panel title="Invoices" action={<Button variant="ghost" onClick={() => go("/s/billing")}>Billing</Button>} bodyClass="px-0 sm:px-0 pb-1">
            {invoices.length === 0 ? <p className="px-6 pb-4 text-muted-foreground">No invoices yet.</p> : (
              <ul>{invoices.map((i) => <li key={i.id} className="flex items-center justify-between gap-3 border-t px-5 py-3 sm:px-6"><span><b className="text-foreground">{i.id}</b> <span className="text-muted-foreground">· {i.period}</span></span><span className="flex items-center gap-3"><b className="tabular">{money(i.amount)}</b><Badge className={cn("border-0", i.status === "paid" ? "bg-ok-soft text-ok" : i.status === "overdue" ? "bg-bad-soft text-bad" : "bg-secondary text-foreground")}>{i.status}</Badge></span></li>)}</ul>
            )}
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Profile">
            <Facts rows={[["Admin", `${o.admin} · ${o.adminEmail}`], ["Sign-in", o.sso], ["CRM", o.crm], ["Customer since", date(o.createdAt)], ["CRM sync lag", o.syncLagSec ? `${Math.round(o.syncLagSec / 60)} min ${o.syncLagSec % 60} s` : "Not syncing"], ["Health", <Health key="h" h={o.health} />]]} />
          </Panel>
          <Panel title="Plan">
            <div className="flex flex-wrap items-end gap-3">
              <div className="grid min-w-[200px] flex-1 gap-1.5"><Label>Plan</Label>
                <Select value={o.plan} onValueChange={(v) => { dispatch({ type: "saPlan", id: o.id, plan: v as PlanId }); toast.success(`${o.name} moved to ${planName(v)}`, { description: "Features in the new plan switch on at the next sign-in. Billing changes from the next invoice." }) }}>
                  <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent>{plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} · {p.price}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <ul className="mt-3 space-y-1 text-[14px] text-muted-foreground">{plan.features.map((f) => <li key={f}>· {f}</li>)}</ul>
          </Panel>
          <Panel title="AI spend" sub="Agents pause for this customer if the cap is reached">
            <div className="flex justify-between text-[14.5px]"><span>{money(o.aiCost)} of {money(o.aiCap)} this month</span><b className="tabular">{aiPct}%</b></div>
            <div className="mt-1.5 h-2.5 rounded-full bg-muted"><div className={cn("h-full rounded-full", aiPct > 85 ? "bg-bad" : "bg-primary")} style={{ width: `${aiPct}%` }} /></div>
            <div className="mt-3 flex gap-2"><Input inputMode="numeric" value={cap} onChange={(e) => setCap(e.target.value.replace(/[^0-9]/g, ""))} className="h-10 max-w-[160px]" aria-label="Monthly AI cap in dollars" /><Button variant="outline" disabled={!cap || Number(cap) === o.aiCap} onClick={() => { dispatch({ type: "saAiCap", id: o.id, cap: Number(cap) }); toast.success(`AI cap set to ${money(Number(cap))} a month`) }}>Set cap</Button></div>
          </Panel>
          <Panel title={<span className="flex items-center gap-2"><LifeBuoy className="size-5 text-primary" /> Support access</span>} sub="Read-only, time-limited, and only with the customer's approval">
            {live ? (
              <div className="space-y-2">
                <p className="text-[15px] text-foreground"><b>{live.engineer}</b> · {live.ticket} · {live.status === "granted" ? `granted by ${live.decidedBy}, until ${live.until ? new Date(live.until).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : ""}` : `waiting for ${o.admin} to approve`}</p>
                <p className="text-[14px] text-muted-foreground">{live.reason}</p>
                {live.status === "granted" && <Button size="sm" variant="outline" onClick={() => { dispatch({ type: "saSupportEnd", id: live.id }); toast.success("Support access ended") }}>End access now</Button>}
              </div>
            ) : asking ? (
              <div className="space-y-2">
                <Textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={2} placeholder="What you need to look at, and why" />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setAsking(false)}>Cancel</Button>
                  <Button disabled={why.trim().length < 10} onClick={() => { dispatch({ type: "saSupportRequest", req: { id: `SA-${32 + state.platform.support.length}`, orgId: o.id, engineer: "Rowan Ellis", reason: why.trim(), ticket: `SUP-${1190 + state.platform.support.length}`, hours: 2, status: "requested", at: NOW.toISOString() } }); toast.success(`Asked ${o.admin} for access`, { description: "Read-only, 2 hours, once they approve." }); setAsking(false); setWhy("") }}>Ask for 2 hours</Button>
                </div>
              </div>
            ) : (
              <>
                {access.length > 0 && <p className="mb-2 text-[14px] text-muted-foreground">Last: {access[0].engineer}, {access[0].status}, {ago(access[0].at)}</p>}
                <Button variant="outline" disabled={o.status === "suspended"} onClick={() => setAsking(true)}><LifeBuoy /> Ask for support access</Button>
              </>
            )}
          </Panel>
        </div>
      </div>

      <Dialog open={suspending} onOpenChange={setSuspending}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader><DialogTitle>Suspend {o.name}?</DialogTitle><DialogDescription>Nobody at {o.name} or its partners can sign in, and its agents and syncs stop. Data is kept for 90 days. You can reactivate it any time.</DialogDescription></DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Reason, for the customer and the log" />
          <DialogFooter><Button variant="outline" onClick={() => setSuspending(false)}>Cancel</Button><Button className="bg-bad text-white hover:bg-bad/90" disabled={reason.trim().length < 5} onClick={() => { dispatch({ type: "saOrgStatus", id: o.id, status: "suspended", reason: reason.trim() }); toast.warning(`${o.name} is suspended`, { description: `${o.admin} is told why.` }); setSuspending(false) }}><Pause /> Suspend</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
