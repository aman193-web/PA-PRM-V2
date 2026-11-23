import { useState } from "react"
import { KeyRound, Lock, LogOut, RotateCcw, Search, ShieldCheck, Unlock, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { EmptyState, PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NOW, ago } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { otherUsers, platformRoles, type TeamMember } from "@/superadmin/data"
import { permissions } from "@hub/content/permissions"
import { personas, roleOrder } from "@hub/content/personas"
import type { Cell, RoleId } from "@hub/content/types"

/* ---------------- Users across every tenant ---------------- */

interface Person { name: string; email: string; org: string; orgId: string; role: string; kind: "Staff" | "Partner user"; mfa: boolean; lastSignIn?: string; status: string }

export function SaUsers() {
  const { state, dispatch } = useStore()
  const [q, setQ] = useState("")
  const [org, setOrg] = useState("all")
  const people: Person[] = [
    ...state.staff.map((u) => ({ name: u.name, email: u.email ?? `${u.name.toLowerCase().replace(/ /g, ".")}@brightline.io`, org: "Brightline", orgId: "brightline", role: u.role, kind: "Staff" as const, mfa: true, lastSignIn: u.lastSignIn, status: u.status })),
    ...state.team.map((m) => ({ name: m.name, email: m.email, org: "Brightline · Ridgeway IT", orgId: "brightline", role: m.role, kind: "Partner user" as const, mfa: false, lastSignIn: m.lastActive, status: m.status })),
    ...otherUsers.map((u) => ({ name: u.name, email: u.email, org: state.platform.orgs.find((o) => o.id === u.orgId)?.name ?? u.orgId, orgId: u.orgId, role: u.role, kind: "Staff" as const, mfa: u.mfa, lastSignIn: u.lastSignIn, status: state.platform.orgs.find((o) => o.id === u.orgId)?.status === "suspended" ? "suspended" : "active" })),
  ]
  const t = q.trim().toLowerCase()
  const rows = people.filter((p) => (org === "all" || p.orgId === org) && (!t || `${p.name} ${p.email} ${p.role}`.toLowerCase().includes(t)))
  const act = (p: Person, action: "lock" | "unlock" | "resetMfa" | "signOut", msg: string) => { dispatch({ type: "saUser", email: p.email, name: p.name, action }); toast.success(msg, { description: "Logged in the platform audit log. The customer's admin is told." }) }
  return (
    <div>
      <PageHeader title="Users" sub="Everyone who can sign in, across every tenant. Day-to-day user management belongs to each customer's IT admin; use these for security and support: lock an account, reset MFA, sign someone out everywhere." />
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1 basis-80">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or role" aria-label="Search users" className="h-11 w-full rounded-[12px] border bg-card pr-3 pl-11 text-[15.5px] text-foreground outline-none focus:border-primary" />
        </div>
        <Select value={org} onValueChange={setOrg}>
          <SelectTrigger className="h-11 w-[220px]" aria-label="Organization"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Every organization</SelectItem>{state.platform.orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Panel title={`${rows.length} people`} sub="Brightline's people come live from its portals; other tenants show their admins" bodyClass="px-0 sm:px-0 pb-1">
        {rows.length === 0 ? <EmptyState title="Nobody matches" /> : (
          <ul>
            {rows.map((p) => {
              const f = state.platform.userFlags[p.email] ?? {}
              return (
                <li key={p.email + p.org} className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-t px-5 py-3 sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_120px_auto]", f.locked && "bg-bad-soft/20")}>
                  <span className="min-w-0"><b className="block truncate text-foreground">{p.name}</b><span className="block truncate text-[13.5px] text-muted-foreground">{p.email}</span></span>
                  <span className="min-w-0 text-[14px] text-foreground lg:order-none"><span className="block truncate">{p.role}</span><span className="block truncate text-[13px] text-muted-foreground">{p.org} · {p.kind}</span></span>
                  <span className="col-span-2 flex flex-wrap items-center gap-1.5 lg:col-span-1">
                    {f.locked ? <Badge className="border-0 bg-bad-soft text-bad">Locked</Badge> : <Badge className="border-0 bg-secondary text-foreground capitalize">{p.status}</Badge>}
                    {p.mfa ? <Badge variant="outline">MFA</Badge> : <Badge variant="outline" className="border-amber/60 text-amber-ink">Email link</Badge>}
                    {p.lastSignIn && <span className="text-[12.5px] text-muted-foreground">{ago(f.signedOut ?? p.lastSignIn)}</span>}
                  </span>
                  <span className="col-span-2 flex flex-wrap gap-1.5 lg:col-span-1 lg:justify-end">
                    {f.locked ? <Button size="sm" variant="outline" onClick={() => act(p, "unlock", `${p.name} is unlocked`)}><Unlock /> Unlock</Button> : <Button size="sm" variant="outline" onClick={() => act(p, "lock", `${p.name} is locked`)}><Lock /> Lock</Button>}
                    {p.mfa && <Button size="sm" variant="ghost" onClick={() => act(p, "resetMfa", `MFA reset for ${p.name}`)}><RotateCcw /> Reset MFA</Button>}
                    <Button size="sm" variant="ghost" onClick={() => act(p, "signOut", `${p.name} is signed out everywhere`)}><LogOut /> Sign out</Button>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
    </div>
  )
}

/* ---------------- Default role templates (from the hub's permission matrix) ---------------- */

const cellOptions: { value: Cell; label: string }[] = [
  { value: "yes", label: "Yes" }, { value: "own", label: "Own only" }, { value: "assigned", label: "Assigned only" },
  { value: "approval", label: "With approval" }, { value: "open", label: "Not decided" }, { value: "no", label: "No" },
]
const cellTone: Record<string, string> = { yes: "text-ok", own: "text-primary", assigned: "text-primary", approval: "text-amber-ink", open: "text-muted-foreground", no: "text-muted-foreground", na: "text-muted-foreground" }
/** Never grantable, whatever the role: the documents rule these out for everyone. */
const lockedRows: Record<string, string> = { "change-credit": "Nobody edits credit directly; only approved overrides (MP-04)", "see-other-partner-credit": "No partner ever sees another partner's credit (MP-03)" }

export function SaRoles() {
  const { state, dispatch } = useStore()
  const [role, setRole] = useState<RoleId>("pam")
  const persona = personas.find((p) => p.id === role)!
  const changed = Object.keys(state.platform.permOverrides).filter((k) => k.endsWith(`.${role}`)).length
  const areas = [...new Set(permissions.map((p) => p.area))]
  return (
    <div className="space-y-6">
      <PageHeader title="Roles and permissions" sub="The default role templates every new customer starts with. They come from the PRM Knowledge Hub's permission matrix; changes here apply to new tenants and are logged. One permission engine enforces them for people, APIs and agents (R-SEC-4)." />
      <div className="grid gap-4 md:gap-6 xl:grid-cols-[300px_1fr] [&>*]:min-w-0">
        <Select value={role} onValueChange={(v) => setRole(v as RoleId)}>
          <SelectTrigger className="h-11 w-full bg-card md:hidden" aria-label="Role"><SelectValue /></SelectTrigger>
          <SelectContent>{roleOrder.map((r) => <SelectItem key={r} value={r}>{personas.find((x) => x.id === r)!.short}</SelectItem>)}</SelectContent>
        </Select>
        <Panel className="hidden md:block" title="Roles" sub="12 personas" bodyClass="px-2 sm:px-2 pb-2">
          <ul className="grid gap-0.5">
            {roleOrder.map((r) => {
              const p = personas.find((x) => x.id === r)!
              const n = Object.keys(state.platform.permOverrides).filter((k) => k.endsWith(`.${r}`)).length
              return (
                <li key={r}>
                  <button onClick={() => setRole(r)} className={cn("flex w-full items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-left", role === r ? "bg-brand-soft text-primary" : "hover:bg-muted")}>
                    <span className="min-w-0"><b className="block truncate text-[15px]">{p.short}</b><span className="text-[12.5px] text-muted-foreground">{p.side === "vendor" ? "Vendor staff" : "Partner user"}</span></span>
                    {n > 0 && <Badge className="border-0 bg-amber-soft text-amber-ink">{n} changed</Badge>}
                  </button>
                </li>
              )
            })}
          </ul>
        </Panel>
        <Panel title={<span className="flex flex-wrap items-center gap-2"><KeyRound className="size-5 text-primary" /> {persona.title}</span>} sub={`${persona.summary} ${changed ? `${changed} permission${changed === 1 ? "" : "s"} changed from the hub default.` : "Matches the hub default."}`} bodyClass="px-0 sm:px-0 pb-1">
          {areas.map((area) => (
            <div key={area}>
              <p className="border-t bg-surface-2/60 px-5 py-2 text-[13px] font-semibold tracking-wide text-muted-foreground uppercase sm:px-6">{area}</p>
              <ul>
                {permissions.filter((p) => p.area === area).map((p) => {
                  const key = `${p.id}.${role}`
                  const base = (p.cells[role] ?? "no") as Cell
                  const now = (state.platform.permOverrides[key] ?? base) as Cell
                  const locked = lockedRows[p.id]
                  return (
                    <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_170px] items-center gap-3 border-t px-5 py-2.5 first:border-0 sm:px-6">
                      <span className="min-w-0"><span className="block text-[14.5px] text-foreground">{p.title} <span className="font-mono text-[11.5px] text-muted-foreground">{p.stage}</span></span>{locked ? <span className="text-[12.5px] text-muted-foreground">{locked}</span> : now !== base ? <span className="text-[12.5px] text-amber-ink">Hub default: {cellOptions.find((c) => c.value === base)?.label ?? base}</span> : null}</span>
                      {locked ? <span className="flex items-center gap-1.5 text-[14px] text-muted-foreground"><Lock className="size-3.5" /> Nobody</span> : (
                        <Select value={now} onValueChange={(v) => { dispatch({ type: "saPerm", key, cell: v }); toast.success(`${persona.short}: ${p.title.toLowerCase()} is now "${cellOptions.find((c) => c.value === v)?.label}"`, { description: "Applies to new tenants. Logged." }) }}>
                          <SelectTrigger className={cn("h-9 w-full text-[14px] font-semibold", cellTone[now])} aria-label={`${p.title} for ${persona.short}`}><SelectValue /></SelectTrigger>
                          <SelectContent>{cellOptions.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  )
}

/* ---------------- The platform team ---------------- */

export function SaTeam() {
  const { state, dispatch } = useStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<TeamMember["role"]>("Support")
  const ok = name.trim().length >= 3 && /@prm-platform\.io$/.test(email.trim().toLowerCase())
  return (
    <div className="space-y-6">
      <PageHeader title="Platform team" sub="The PRM company's own people who run the platform. They sign in with a hardware key from the company network, and every action is in the platform audit log." actions={<Button size="lg" onClick={() => setOpen(true)}><UserPlus /> Invite</Button>} />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <Panel title="People" bodyClass="px-0 sm:px-0 pb-1">
          <ul>{state.platform.team.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 first:border-0 sm:px-6">
              <span className="min-w-0"><b className="block text-foreground">{m.name}</b><span className="text-[13.5px] text-muted-foreground">{m.email}</span></span>
              <span className="flex items-center gap-2"><Badge variant="outline">{m.role}</Badge>{m.status === "invited" ? <Badge className="border-0 bg-brand-soft text-primary">Invited</Badge> : <span className="text-[13px] text-muted-foreground">{m.lastSignIn ? ago(m.lastSignIn) : ""}</span>}</span>
            </li>
          ))}</ul>
        </Panel>
        <Panel title={<span className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /> Platform roles</span>}>
          <ul className="space-y-3">{platformRoles.map((r) => <li key={r.role}><b className="block text-[15px] text-foreground">{r.role}</b><span className="text-[14px] text-muted-foreground">{r.can}</span></li>)}</ul>
          <p className="mt-4 text-[13.5px] text-muted-foreground">Nobody on the platform team can see a customer's data without that customer's approval (support access).</p>
        </Panel>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader><DialogTitle>Invite to the platform team</DialogTitle><DialogDescription>Company addresses only. They set up a hardware key at first sign-in.</DialogDescription></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5"><Label htmlFor="t-n">Name</Label><Input id="t-n" value={name} onChange={(e) => setName(e.target.value)} className="h-11" /></div>
            <div className="grid gap-1.5"><Label htmlFor="t-e">Email</Label><Input id="t-e" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" placeholder="name@prm-platform.io" /></div>
            <div className="grid gap-1.5"><Label>Role</Label><Select value={role} onValueChange={(v) => setRole(v as TeamMember["role"])}><SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent>{platformRoles.map((r) => <SelectItem key={r.role} value={r.role}>{r.role}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!ok} onClick={() => { dispatch({ type: "saInvite", member: { id: `p-${Date.now()}`, name: name.trim(), email: email.trim().toLowerCase(), role, status: "invited", lastSignIn: undefined } }); toast.success(`${name} is invited as ${role}`); setOpen(false); setName(""); setEmail("") }}>Send invitation</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <p className="text-[13.5px] text-muted-foreground">Signed in now: {state.platform.team[0].name} · {new Date(NOW).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
    </div>
  )
}
