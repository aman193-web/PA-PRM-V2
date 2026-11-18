import { useState } from "react"
import { Bot, KeyRound, LogIn, Mail, Send, Settings2, ShieldCheck, TriangleAlert, UserMinus, UserPlus, Users, UserCheck } from "lucide-react"
import { toast } from "sonner"
import { PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NOW, ago, date } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { partnerAdmins, prmRoles, serviceAccounts, staffRoles, type GroupMap, type StaffUser } from "@/vendor/admin"
import { useAdmin } from "@/vendor/useVendor"

function NewGroup({ g }: { g: GroupMap }) {
  const { dispatch } = useStore()
  const [role, setRole] = useState("")
  return (
    <Panel className="border-amber/50" title={<span className="flex flex-wrap items-center gap-2"><Users className="size-5 text-amber-ink" /> {g.group} needs a PRM role</span>} sub={`${g.people} people pushed from Okta ${g.pushedAt ? ago(g.pushedAt) : ""}. Until it has a role, they can't sign in.`}>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <p className="mb-1.5 text-[14px] font-medium text-muted-foreground">Role</p>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="h-11 w-full text-[15.5px]"><SelectValue placeholder="Choose a role" /></SelectTrigger>
            <SelectContent>{prmRoles.map((r) => <SelectItem key={r.role} value={r.role}>{r.role}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button size="lg" disabled={!role} onClick={() => { dispatch({ type: "itGroup", id: g.id, role }); toast.success(`${g.people} people can sign in as ${role}`, { description: "Okta keeps the group in sync from now on." }) }}>Give the role</Button>
      </div>
      {role && <p className="mt-2 text-[14.5px] text-muted-foreground">{role}: {prmRoles.find((r) => r.role === role)?.sees}.</p>}
    </Panel>
  )
}

const ME = "u-kai"

/** Add one person directly: someone not in an Okta group yet, such as a contractor. Okta-provisioned people come through SCIM. */
function AddUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [title, setTitle] = useState("")
  const [role, setRole] = useState("")
  const [contractorOk, setContractorOk] = useState(false)
  const mail = email.trim().toLowerCase()
  const validMail = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(mail)
  // Demo rule: a brightline.io address already has an Okta login. Anyone else needs a contractor account in Okta first (G50).
  const inOkta = validMail && mail.endsWith("@brightline.io")
  const exists = state.staff.some((u) => u.email?.toLowerCase() === mail || u.name.toLowerCase() === name.trim().toLowerCase())
  const ok = name.trim().length >= 3 && validMail && !exists && !!role && (inOkta || contractorOk)
  const add = () => {
    const user: StaffUser = {
      id: `u-${Date.now()}`, name: name.trim(), title: title.trim() || role, role, email: mail, status: "invited", source: "manual",
      signIn: inOkta ? "sso" : "contractor", group: inOkta ? "Added directly" : "Okta contractor account",
      changed: { by: "Kai Brennan", at: NOW.toISOString(), text: inOkta ? "Invitation emailed: a sign-in link to Brightline SSO" : "Okta contractor account created; invitation emailed" },
    }
    dispatch({ type: "itAddUser", user })
    toast.success(`Invitation sent to ${user.email}`, { description: "A sign-in link, no password. They sign in with Brightline SSO and MFA; the account turns Active on their first sign-in." })
    onClose()
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Add a user</DialogTitle>
          <DialogDescription>For someone who isn't in an Okta group yet, such as a contractor. Most people arrive from Okta automatically.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label htmlFor="nu-name" className="text-[15px]">Full name</Label><Input id="nu-name" value={name} onChange={(e) => setName(e.target.value)} className="h-11 text-[15.5px]" placeholder="e.g. Nora Webb" /></div>
            <div className="grid gap-1.5"><Label htmlFor="nu-title" className="text-[15px]">Job title <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="nu-title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 text-[15.5px]" /></div>
          </div>
          <div className="grid gap-1.5"><Label htmlFor="nu-mail" className="text-[15px]">Work email</Label><Input id="nu-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 text-[15.5px]" placeholder="name@brightline.io" /></div>
          {exists && <p className="-mt-2 text-[14px] text-bad">This person already has a PRM account.</p>}
          {validMail && !exists && (inOkta ? (
            <p className="-mt-2 flex gap-2 text-[14px] text-ok"><ShieldCheck className="mt-0.5 size-4 shrink-0" /> Found in Okta: they already have a Brightline login.</p>
          ) : (
            <div className="-mt-1 rounded-[12px] border border-amber/50 bg-amber-soft/40 px-3 py-2.5 text-[14px]">
              <p className="flex gap-2 text-foreground"><TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-ink" /> Not a Brightline address, so this person has no Okta login and can't use SSO yet.</p>
              <label className="mt-2 flex cursor-pointer items-start gap-2 text-foreground">
                <input type="checkbox" checked={contractorOk} onChange={(e) => setContractorOk(e.target.checked)} className="mt-1 size-4 accent-[var(--primary)]" />
                <span>Create a contractor account in Okta for them first, with an end date and MFA</span>
              </label>
              <p className="mt-1.5 text-[13px] text-muted-foreground">Letting them sign in with an email link instead, as partners do, isn't decided (G50).</p>
            </div>
          ))}
          <div className="grid gap-1.5">
            <Label className="text-[15px]">PRM role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-11 w-full text-[15.5px]"><SelectValue placeholder="Choose a role" /></SelectTrigger>
              <SelectContent>{staffRoles.map((r) => <SelectItem key={r.role} value={r.role}>{r.role}</SelectItem>)}</SelectContent>
            </Select>
            {role && <p className="text-[14px] text-muted-foreground">Sees: {staffRoles.find((r) => r.role === role)?.sees}.</p>}
          </div>
        </div>
        <div className="rounded-[12px] bg-muted/60 px-4 py-3 text-[14px]">
          <p className="flex items-center gap-2 font-semibold text-foreground"><KeyRound className="size-4 text-primary" /> How they sign in</p>
          <ol className="mt-1.5 list-decimal space-y-0.5 pl-5 text-muted-foreground">
            <li>They get an invitation email with a sign-in link. No password is ever sent.</li>
            <li>The link opens Brightline's SSO (Okta): their normal company login, plus MFA.</li>
            <li>On that first sign-in the account turns from Invited to Active, with this role.</li>
          </ol>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!ok} onClick={add}><UserPlus /> Send invitation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** One user: change their role, deactivate or reactivate them, or resend an invitation. Every change is in the audit log. */
function ManageUser({ u, onClose }: { u: StaffUser | null; onClose: () => void }) {
  const { dispatch } = useStore()
  const [role, setRole] = useState(u?.role ?? "")
  if (!u) return null
  const self = u.id === ME
  const fromOkta = (u.source ?? "okta") === "okta"
  const off = u.status === "deactivated"
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 data-[side=right]:sm:max-w-[440px]">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="text-[18px]">{u.name}</SheetTitle>
          <SheetDescription className="text-[14px]">{u.title} · {u.email ?? `${u.name.toLowerCase().replace(/ /g, ".")}@brightline.io`}</SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-5 py-5">
          <dl className="grid grid-cols-2 gap-3 text-[14.5px]">
            <div className="rounded-[12px] bg-muted/60 px-3 py-2.5"><dt className="text-muted-foreground">Status</dt><dd className="font-semibold text-foreground capitalize">{u.status}</dd></div>
            <div className="rounded-[12px] bg-muted/60 px-3 py-2.5"><dt className="text-muted-foreground">Comes from</dt><dd className="font-semibold text-foreground">{fromOkta ? "Okta (SCIM)" : "Added by IT"}</dd></div>
            <div className="col-span-2 rounded-[12px] bg-muted/60 px-3 py-2.5"><dt className="text-muted-foreground">Signs in with</dt><dd className="font-semibold text-foreground">{u.signIn === "contractor" ? "Brightline SSO, with an Okta contractor account" : "Brightline SSO (Okta) and MFA"} · no PRM password</dd></div>
            <div className="col-span-2 rounded-[12px] bg-muted/60 px-3 py-2.5"><dt className="text-muted-foreground">Group</dt><dd className="font-mono text-[13.5px] text-foreground">{u.group}</dd></div>
          </dl>

          <div className="space-y-2">
            <Label className="text-[15px]">PRM role</Label>
            <Select value={role} onValueChange={setRole} disabled={off || self}>
              <SelectTrigger className="h-11 w-full text-[15.5px]"><SelectValue /></SelectTrigger>
              <SelectContent>{staffRoles.map((r) => <SelectItem key={r.role} value={r.role}>{r.role}</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-[13.5px] text-muted-foreground">{self ? "You can't change your own role; another admin has to." : fromOkta ? "Set here, it applies now. Okta's group sets it again at the next sync unless the group changes too." : staffRoles.find((r) => r.role === role)?.sees}</p>
            <Button className="w-full" disabled={role === u.role || off || self} onClick={() => { dispatch({ type: "itSetRole", userId: u.id, role }); toast.success(`${u.name} is now ${role}`, { description: "What they can see changes at once. Logged in the audit log." }) }}><ShieldCheck /> Change role</Button>
          </div>

          {u.status === "invited" && (
            <div className="rounded-[12px] border border-primary/30 bg-brand-soft/30 px-4 py-3 text-[14px]">
              <p className="flex items-center gap-2 font-semibold text-foreground"><Mail className="size-4 text-primary" /> Waiting for their first sign-in</p>
              <p className="mt-1 text-muted-foreground">An invitation went to {u.email}: a link to Brightline's SSO{u.signIn === "contractor" ? ", using the contractor account created in Okta" : ""}. No password. They sign in with MFA and the account turns Active.</p>
              <Button size="sm" variant="outline" className="mt-2.5 bg-card" onClick={() => { dispatch({ type: "itSetStatus", userId: u.id, status: "active", firstSignIn: true }); toast.success(`${u.name} signed in`, { description: "Brightline SSO and MFA. The account is Active now." }) }}><LogIn /> Simulate their first sign-in (demo)</Button>
            </div>
          )}
          <div className="space-y-2 border-t pt-5">
            {u.status === "invited" && <Button variant="outline" className="w-full" onClick={() => { dispatch({ type: "itResendInvite", userId: u.id }); toast.success("Invitation sent again", { description: `${u.email} · a sign-in link, no password` }) }}><Mail /> Resend invitation</Button>}
            {off ? (
              <Button variant="outline" className="w-full" onClick={() => { dispatch({ type: "itSetStatus", userId: u.id, status: "active" }); toast.success(`${u.name} is active again`) }}><UserCheck /> Reactivate</Button>
            ) : (
              <Button variant="outline" className="w-full border-bad/40 text-bad hover:bg-bad-soft hover:text-bad" disabled={self} onClick={() => { dispatch({ type: "itSetStatus", userId: u.id, status: "deactivated" }); toast.success(`${u.name} is deactivated`, { description: `Signed out everywhere.${u.partners ? " Dana Ortiz is told their partners need a new partner manager." : ""}` }); onClose() }}><UserMinus /> Deactivate</Button>
            )}
            <p className="text-[13.5px] text-muted-foreground">{self ? "You can't deactivate yourself." : "Deactivating signs them out everywhere at once. Their history stays in the audit log."}</p>
          </div>
          {u.changed && <p className="rounded-[12px] border px-3 py-2.5 text-[14px] text-muted-foreground">Last change: {u.changed.text} · {u.changed.by} · {ago(u.changed.at)}</p>}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function ItUsers() {
  const { state, dispatch } = useStore()
  const a = useAdmin()
  const [adding, setAdding] = useState(false)
  const [managing, setManaging] = useState<string | null>(null)
  const picked = state.staff.find((u) => u.id === managing) ?? null
  return (
    <div className="space-y-6">
      <PageHeader
        title="Users and roles"
        sub="Brightline users come from Okta through SCIM, with MFA, and their Okta group sets their PRM role. You can also add a person directly and manage anyone's role and access."
        actions={<Button size="lg" onClick={() => setAdding(true)}><UserPlus /> Add user</Button>}
      />
      {a.newGroups.map((g) => <NewGroup key={g.id} g={g} />)}
      {state.staff.filter((u) => u.status === "leaving").map((u) => {
        const told = state.toldChief.includes(u.id)
        return (
          <Panel key={u.id} className={cn(!told && "border-bad/40")} title={<span className="flex flex-wrap items-center gap-2"><UserMinus className={cn("size-5", told ? "text-muted-foreground" : "text-bad")} /> {u.name} leaves on {date(u.leavesOn!, { month: "short", day: "numeric" })}</span>} sub={`${u.title} · ${u.group}`}>
            <p className="text-[15.5px] text-foreground">{u.note}</p>
            {told ? <p className="mt-3 text-[15px] text-ok">You told Dana Ortiz. Moving the partners is the channel chief's call (G32).</p> : (
              <Button className="mt-3" onClick={() => { dispatch({ type: "itTellChief", userId: u.id }); toast.success("Dana Ortiz is told", { description: `${u.partners} partners need a new partner manager before ${date(u.leavesOn!, { month: "short", day: "numeric" })}.` }) }}><Send /> Tell Dana Ortiz</Button>
            )}
          </Panel>
        )
      })}

      <Panel title="Brightline users" sub={`${state.staff.filter((u) => u.status !== "deactivated").length} named here; ${a.provisioned} people in all have PRM access through their Okta groups. Manage anyone's role or access.`} bodyClass="px-0 sm:px-0 pb-1">
        <div className="hidden gap-x-4 border-y bg-surface-2/60 px-6 py-3 text-[14px] font-medium text-muted-foreground md:grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_140px_90px]">
          <span>Person</span><span>PRM role</span><span>Okta group</span><span>Status</span><span />
        </div>
        <ul>
          {state.staff.map((u) => (
            <li key={u.id} className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 border-b px-5 py-3 last:border-0 sm:px-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_140px_90px]", u.status === "deactivated" && "opacity-60")}>
              <span className="min-w-0"><b className="block truncate text-foreground">{u.name}</b><span className="block truncate text-[13.5px] text-muted-foreground">{u.title}</span></span>
              <span className="text-[14.5px] text-foreground md:order-none">{u.role}</span>
              <span className="col-span-2 truncate font-mono text-[13px] text-muted-foreground md:col-span-1">{u.group}</span>
              <span className="col-span-2 md:col-span-1">
                {u.status === "active" ? <span className="text-[14px] text-muted-foreground">Active{u.lastSignIn ? ` · ${ago(u.lastSignIn)}` : ""}</span>
                  : u.status === "invited" ? <Badge className="border-0 bg-brand-soft text-primary">Invited</Badge>
                  : u.status === "leaving" ? <Badge className="border-0 bg-amber-soft text-amber-ink">Leaving {date(u.leavesOn!, { month: "short", day: "numeric" })}</Badge>
                    : <Badge className="border-0 bg-secondary text-foreground">Deactivated</Badge>}
              </span>
              <span className="col-span-2 md:col-span-1 md:text-right"><Button size="sm" variant="outline" onClick={() => setManaging(u.id)} aria-label={`Manage ${u.name}`}><Settings2 /> Manage</Button></span>
            </li>
          ))}
        </ul>
      </Panel>

      <AddUserDialog key={`add-${adding}`} open={adding} onClose={() => setAdding(false)} />
      <ManageUser key={managing ?? "none"} u={picked} onClose={() => setManaging(null)} />
      <div className="grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <Panel title="Okta groups and PRM roles" sub="SCIM keeps each group in sync" bodyClass="px-0 sm:px-0 pb-1">
          <ul>
            {state.groups.map((g) => (
              <li key={g.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 border-t px-5 py-2.5 sm:px-6">
                <span className="min-w-0"><span className="block truncate font-mono text-[13.5px] text-foreground">{g.group}</span><span className="text-[13.5px] text-muted-foreground">{g.people} {g.people === 1 ? "person" : "people"}</span></span>
                {g.role ? <span className="self-center text-[14.5px] text-foreground">{g.role}</span> : <Badge className="self-center border-0 bg-amber-soft text-amber-ink">No role yet</Badge>}
              </li>
            ))}
          </ul>
        </Panel>
        <div className="space-y-6">
          <Panel title={<span className="flex items-center gap-2"><Bot className="size-5 text-primary" /> Service accounts</span>} sub="Not people. Agents have no access of their own (R-AG-4)">
            <ul className="space-y-3">{serviceAccounts.map((s) => <li key={s.name}><b className="block text-[15px] text-foreground">{s.what}</b><span className="block font-mono text-[13px] text-muted-foreground">{s.name}</span><span className="text-[14px] text-muted-foreground">{s.scope}</span></li>)}</ul>
          </Panel>
          <Panel title="Partner companies" sub="Each partner's own admin manages its users. You help with support only">
            <ul className="space-y-2.5">
              {partnerAdmins.map((p) => (
                <li key={p.company} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0"><b className="block text-[15px] text-foreground">{p.company}</b><span className="text-[13.5px] text-muted-foreground">Admin: {p.admin} · {p.signIn}</span></span>
                  <span className="shrink-0 text-[14px] text-muted-foreground">{p.users} users</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}
