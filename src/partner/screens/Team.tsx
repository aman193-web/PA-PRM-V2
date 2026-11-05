import { useState } from "react"
import { MoreHorizontal, ShieldCheck, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ago, initials } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { company, teamRoleHelp, type TeamRole } from "@/partner/data"

const roles: TeamRole[] = ["Partner sales rep", "Partner executive", "Partner marketer", "Partner technical lead"]

export function Team() {
  const { state, dispatch } = useStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<TeamRole>("Partner sales rep")
  const valid = name.trim().length > 1 && /@ridgewayit\.com$/i.test(email.trim())

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        sub={`Who at ${company.name} can use the Brightline portal, and what each person sees. People sign in with a work-email link or Ridgeway's SSO.`}
        actions={<Button size="lg" onClick={() => setOpen(true)}><UserPlus /> Invite someone</Button>}
      />
      <Panel bodyClass="p-0 sm:p-0">
        <div className="hidden gap-4 border-b px-6 py-3 text-[14px] font-medium text-muted-foreground md:grid md:grid-cols-[minmax(0,1.6fr)_140px_150px_minmax(0,1fr)_40px]">
          <span>Person</span><span>Role</span><span>Can register deals</span><span>Status</span><span />
        </div>
        <ul>
          {state.team.map((m) => (
            <li key={m.id} className={cn("grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b px-5 py-4 last:border-0 sm:px-6 md:grid-cols-[minmax(0,1.6fr)_140px_150px_minmax(0,1fr)_40px]", m.status === "deactivated" && "opacity-60")}>
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-[14px] font-semibold text-primary">{initials(m.name)}</span>
                <span className="min-w-0">
                  <b className="block truncate text-[16px] text-foreground">{m.name}{m.name === "Paul Okafor" ? " (you)" : ""}</b>
                  <span className="block truncate text-[14px] text-muted-foreground">{m.email}</span>
                </span>
              </span>
              <span className="justify-self-end md:justify-self-start"><Badge variant="secondary">{m.role}</Badge></span>
              <label className="flex items-center gap-2 text-[14.5px] text-foreground">
                <Switch checked={m.canRegister} disabled={m.status !== "active" || m.role === "Partner executive"} onCheckedChange={(v) => { dispatch({ type: "setCanRegister", id: m.id, value: v }); toast(v ? `${m.name} can register deals` : `${m.name} can no longer register deals`) }} aria-label={`${m.name} can register deals`} />
                <span className="md:hidden">Can register deals</span>
                <span className="hidden md:inline">{m.canRegister ? "Yes" : "No"}</span>
              </label>
              <span className="text-[14.5px] text-muted-foreground">
                {m.status === "active" ? <>Active{m.lastActive ? ` · ${ago(m.lastActive)}` : ""}{m.certified ? <span className="ml-2 inline-flex items-center gap-1 text-ok"><ShieldCheck className="size-3.5" />{m.certified}</span> : null}</> : m.status === "invited" ? <span className="text-amber-ink">Invited · hasn't signed in yet</span> : "Deactivated"}
              </span>
              <span className="col-start-2 row-start-1 justify-self-end md:col-auto md:row-auto">
                {m.name !== "Paul Okafor" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${m.name}`}><MoreHorizontal /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {m.status === "invited" && <DropdownMenuItem onSelect={() => toast.success(`Invitation sent again to ${m.email}`)}>Resend invitation</DropdownMenuItem>}
                      {m.status === "deactivated"
                        ? <DropdownMenuItem onSelect={() => dispatch({ type: "setMemberStatus", id: m.id, status: "active" })}>Reactivate</DropdownMenuItem>
                        : <DropdownMenuItem onSelect={() => { dispatch({ type: "setMemberStatus", id: m.id, status: "deactivated" }); toast(`${m.name} deactivated`, { description: "Their deals stay with Ridgeway. You can reactivate them any time." }) }}>Deactivate</DropdownMenuItem>}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="What each role sees" sub="Enforced by the platform, not just hidden on screen">
        <dl className="grid gap-4 sm:grid-cols-2">
          {roles.map((r) => (
            <div key={r} className="rounded-[12px] border p-4">
              <dt className="font-semibold text-foreground">{r}</dt>
              <dd className="mt-1 text-[14.5px] text-muted-foreground">{teamRoleHelp[r]}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-[14px] text-muted-foreground">Nobody at Ridgeway can see another partner's deals or credit, even on a deal you share with them.</p>
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite someone from {company.name}</DialogTitle>
            <DialogDescription>They get an email with a sign-in link. No password to set up.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5"><Label htmlFor="iv-name">Name</Label><Input id="iv-name" value={name} onChange={(e) => setName(e.target.value)} className="h-11 text-[16px]" placeholder="e.g. Sara Lopez" /></div>
            <div className="grid gap-1.5"><Label htmlFor="iv-email">Work email</Label><Input id="iv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 text-[16px]" placeholder="name@ridgewayit.com" />
              {email && !/@ridgewayit\.com$/i.test(email.trim()) && <p className="text-[13.5px] text-bad">Use a @ridgewayit.com address. Only Ridgeway people can join Ridgeway's portal.</p>}
            </div>
            <div className="grid gap-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as TeamRole)}>
                <SelectTrigger className="h-11 text-[16px]"><SelectValue /></SelectTrigger>
                <SelectContent>{roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-[13.5px] text-muted-foreground">{teamRoleHelp[role]}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!valid} onClick={() => {
              dispatch({ type: "invite", member: { id: `u${Date.now()}`, name: name.trim(), title: role, email: email.trim(), role, canRegister: role === "Partner sales rep" || role === "Partner executive", status: "invited" } })
              toast.success(`Invitation sent to ${email.trim()}`)
              setOpen(false); setName(""); setEmail(""); setRole("Partner sales rep")
            }}>Send invitation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
