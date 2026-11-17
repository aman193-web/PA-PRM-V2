import { useState } from "react"
import { Bot, Send, UserMinus, Users } from "lucide-react"
import { toast } from "sonner"
import { PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ago, date } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { partnerAdmins, prmRoles, serviceAccounts, type GroupMap } from "@/vendor/admin"
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

export function ItUsers() {
  const { state, dispatch } = useStore()
  const a = useAdmin()
  return (
    <div className="space-y-6">
      <PageHeader title="Users and roles" sub="Brightline users come from Okta through SCIM, with MFA. A person's Okta group sets their PRM role; leavers are signed out everywhere when Okta deactivates them." />
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

      <Panel title="Brightline users" sub={`${state.staff.filter((u) => u.status !== "deactivated").length} named here; ${a.provisioned} people in all have PRM access through their Okta groups`} bodyClass="px-0 sm:px-0 pb-1">
        <div className="hidden gap-x-4 border-y bg-surface-2/60 px-6 py-3 text-[14px] font-medium text-muted-foreground md:grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_140px]">
          <span>Person</span><span>PRM role</span><span>Okta group</span><span>Status</span>
        </div>
        <ul>
          {state.staff.map((u) => (
            <li key={u.id} className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 border-b px-5 py-3 last:border-0 sm:px-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_140px]", u.status === "deactivated" && "opacity-60")}>
              <span className="min-w-0"><b className="block truncate text-foreground">{u.name}</b><span className="block truncate text-[13.5px] text-muted-foreground">{u.title}</span></span>
              <span className="text-[14.5px] text-foreground md:order-none">{u.role}</span>
              <span className="col-span-2 truncate font-mono text-[13px] text-muted-foreground md:col-span-1">{u.group}</span>
              <span className="col-span-2 md:col-span-1">
                {u.status === "active" ? <span className="text-[14px] text-muted-foreground">Active · {u.lastSignIn ? ago(u.lastSignIn) : ""}</span>
                  : u.status === "leaving" ? <Badge className="border-0 bg-amber-soft text-amber-ink">Leaving {date(u.leavesOn!, { month: "short", day: "numeric" })}</Badge>
                    : <Badge className="border-0 bg-secondary text-foreground">Deactivated</Badge>}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

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
