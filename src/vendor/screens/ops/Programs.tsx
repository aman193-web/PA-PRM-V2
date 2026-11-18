import { useState } from "react"
import { Clock3, History, Layers, PencilLine, Plus, Rocket, Send } from "lucide-react"
import { toast } from "sonner"
import { PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { NOW, ago, money } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { templateIds, type ChangeRequest, type ProgramId, type ProgramInfo, type RuleSet } from "@/chief/data"
import { useLivePrograms } from "@/chief/useChief"
import { marketplaceTemplate, people, ruleFields, type RuleField } from "@/vendor/data"

export function RequestStatus({ status }: { status: ChangeRequest["status"] }) {
  if (status === "approved") return <Badge className="shrink-0 border-0 bg-ok-soft text-ok">Approved</Badge>
  if (status === "declined") return <Badge className="shrink-0 border-0 bg-bad-soft text-bad">Declined</Badge>
  return <Badge className="shrink-0 border-0 bg-amber-soft text-amber-ink"><Clock3 /> With Dana</Badge>
}

const fmt = (field: RuleField, v: number) => {
  const f = ruleFields.find((x) => x.key === field)!
  return f.unit === "$" ? money(v) : `${v} ${f.unit}`
}

function impactFor(field: RuleField, program: ProgramId, from: number, to: number): string[] {
  const all = `Applies to every partner in the ${program} program, whoever looks after them`
  if (field === "autoApprove")
    return [`Clean ${program} deals up to ${money(to)} are decided by rules in 60 seconds`, to > from ? `Deals between ${money(from)} and ${money(to)} stop waiting for a partner manager` : `Deals between ${money(to)} and ${money(from)} go back to a partner manager`, "Conflicts, duplicates and low-confidence deals still go to a person", all]
  if (field === "reviewHours") return [`Partner managers get ${to} business hours to decide ${program} deals up to $100,000`, "The nudge at 50% and your alert at 80% move with it", all]
  if (field === "protectionDays") return [`Newly approved ${program} deals are protected for ${to} days`, "Deals already approved keep the window they were given", all]
  return [`${program} partners get ${to} hours to accept a lead before it's reassigned`, all]
}

function ProposeDialog({ program, onClose }: { program: ProgramId | null; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const live = useLivePrograms().filter((p) => p.live)
  const [prog, setProg] = useState<ProgramId>(program ?? "Reseller")
  const [field, setField] = useState<RuleField>("protectionDays")
  const [value, setValue] = useState("")
  const [why, setWhy] = useState("")
  const rules = state.programRules[prog]
  const current = rules[field] as number
  const next = Number(value)
  const f = ruleFields.find((x) => x.key === field)!
  const ok = next > 0 && next !== current && why.trim().length >= 10
  const send = () => {
    const req: ChangeRequest = {
      id: `CR-${21 + state.requests.length}`, kind: "rule", programs: [prog],
      title: `${prog} program: ${f.label.toLowerCase()} ${next > current ? "up" : "down"} to ${fmt(field, next)}`,
      from: people.revops.name, fromRole: "RevOps", at: NOW.toISOString(),
      current: `${fmt(field, current)} (version ${rules.version})`, proposed: `${fmt(field, next)}`,
      why: why.trim(), impact: impactFor(field, prog, current, next), status: "pending",
      patch: { [field]: next } as Partial<RuleSet>,
    }
    dispatch({ type: "proposeRule", req })
    toast.success("Sent to Dana Ortiz", { description: `${req.title}. It becomes version ${rules.version + 1} once approved.` })
    onClose()
  }
  return (
    <Dialog open={!!program} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Propose a rule change</DialogTitle>
          <DialogDescription>Dana Ortiz approves it. Approving makes a new rules version; nothing is edited in place.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-[15px]">Program</Label>
              <Select value={prog} onValueChange={(v) => setProg(v as ProgramId)}>
                <SelectTrigger className="h-11 w-full text-[15.5px]"><SelectValue /></SelectTrigger>
                <SelectContent>{live.map((p) => <SelectItem key={p.id} value={p.id}>{p.id}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-[15px]">Rule</Label>
              <Select value={field} onValueChange={(v) => { setField(v as RuleField); setValue("") }}>
                <SelectTrigger className="h-11 w-full text-[15.5px]"><SelectValue /></SelectTrigger>
                <SelectContent>{ruleFields.map((x) => <SelectItem key={x.key} value={x.key}>{x.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <p className="-mt-1 text-[14px] text-muted-foreground">{f.help} Now: <b className="text-foreground">{fmt(field, current)}</b> <span className="font-mono text-[12.5px]">{f.ref}</span></p>
          <div className="grid gap-1.5">
            <Label htmlFor="newval" className="text-[15px]">New value ({f.unit === "$" ? "dollars" : f.unit})</Label>
            <Input id="newval" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ""))} className="h-11 text-[15.5px]" placeholder={String(current)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="why" className="text-[15px]">Why</Label>
            <Textarea id="why" value={why} onChange={(e) => setWhy(e.target.value)} rows={3} className="text-[15.5px]" placeholder="What the data shows. Dana reads this first." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!ok} onClick={send}><Send /> Send to Dana</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type Rules = { autoApprove: number; reviewHours: number; protectionDays: number; leadHours: number }
const rulesLine = (t: Rules) => `${money(t.autoApprove)} auto-approve, ${t.reviewHours}-hour reviews, ${t.protectionDays}-day protection and ${t.leadHours}-hour lead acceptance`

/** Send a not-launched program to the chief: the Marketplace template, or a program RevOps created that was declined. */
function LaunchDialog({ program, onClose }: { program: ProgramId | null; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const isMarketplace = program === "Marketplace"
  const [why, setWhy] = useState(isMarketplace ? "Three enterprise customers asked to buy through their cloud marketplace commitments this quarter. We have no program for partners who sell that way." : "")
  if (!program) return null
  const r = state.programRules[program]
  const t: Rules = isMarketplace ? marketplaceTemplate : { autoApprove: r.autoApprove, reviewHours: r.reviewHours, protectionDays: r.protectionDays, leadHours: r.leadHours }
  const send = () => {
    const req: ChangeRequest = {
      id: `CR-${21 + state.requests.length}`, kind: "rule", programs: [program], launch: true,
      title: `Launch the ${program} program${isMarketplace ? " from its template" : ""}`,
      from: people.revops.name, fromRole: "RevOps", at: NOW.toISOString(),
      current: "Not launched", proposed: `Live with ${rulesLine(t)}`,
      why: why.trim(),
      impact: [`Partners can be added to the ${program} program once it's live`, `${program} deals use these rules from day one, as version 1`, "Budget and tiers for the program are set separately", "Every other program keeps its own rules"],
      status: "pending", patch: t,
    }
    dispatch({ type: "proposeRule", req })
    toast.success("Sent to Dana Ortiz", { description: `The ${program} program goes live when Dana approves its rules.` })
    onClose()
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Set up the {program} program</DialogTitle>
          <DialogDescription>{isMarketplace ? "From the Marketplace template." : "With the rules you gave it."} It goes live only when Dana Ortiz approves its rules.</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-2 gap-3">
          {[["Auto-approve limit", money(t.autoApprove)], ["Review deadline", `${t.reviewHours} business hours`], ["Protection window", `${t.protectionDays} days`], ["Lead acceptance", `${t.leadHours} hours`]].map(([k, v]) => (
            <div key={k} className="rounded-[12px] bg-muted/60 px-4 py-3"><dt className="text-[13.5px] text-muted-foreground">{k}</dt><dd className="font-semibold text-foreground">{v}</dd></div>
          ))}
        </dl>
        <div className="grid gap-1.5">
          <Label htmlFor="lwhy" className="text-[15px]">Why now</Label>
          <Textarea id="lwhy" value={why} onChange={(e) => setWhy(e.target.value)} rows={3} className="text-[15.5px]" placeholder="What the data shows. Dana reads this first." />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={why.trim().length < 10} onClick={send}><Rocket /> Send for approval</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const templateWhat: Record<string, string> = {
  Reseller: "Partners buy Brightline products and resell them to their own customers",
  Services: "Partners implement and support Brightline for customers",
  Referral: "Partners introduce customers; Brightline sells to them directly",
  Technology: "Partners whose products connect to Brightline",
  Marketplace: "Customers buy Brightline through a cloud marketplace",
}

/** Create a brand-new program: pick a template, name it, adjust its starting rules, and send it to the chief (R-APR-2). */
function NewProgramDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const taken = new Set([...Object.keys(state.programRules)].map((x) => x.toLowerCase()))
  const [template, setTemplate] = useState<string>("Reseller")
  const startFrom = (id: string): Rules => {
    const r = id === "Marketplace" ? marketplaceTemplate : state.programRules[id]
    return { autoApprove: r.autoApprove, reviewHours: r.reviewHours, protectionDays: r.protectionDays, leadHours: r.leadHours }
  }
  const [name, setName] = useState("")
  const [what, setWhat] = useState(templateWhat.Reseller)
  const [rules, setRules] = useState<Rules>(startFrom("Reseller"))
  const [why, setWhy] = useState("")
  const clean = name.trim().replace(/\s+program$/i, "")
  const clash = !!clean && taken.has(clean.toLowerCase())
  const ok = clean.length >= 3 && !clash && what.trim().length >= 10 && why.trim().length >= 10 && Object.values(rules).every((v) => v > 0)
  const pick = (id: string) => { setTemplate(id); setRules(startFrom(id)); setWhat(templateWhat[id]) }
  const send = () => {
    const program: ProgramInfo = { id: clean, what: what.trim(), live: false, budget: 0, spent: 0, template, createdBy: people.revops.name }
    const req: ChangeRequest = {
      id: `CR-${21 + state.requests.length}`, kind: "rule", programs: [clean], launch: true, newProgram: program,
      title: `New program: ${clean}, from the ${template} template`,
      from: people.revops.name, fromRole: "RevOps", at: NOW.toISOString(),
      current: "Doesn't exist yet", proposed: `Live with ${rulesLine(rules)}`,
      why: why.trim(),
      impact: [`A new partner track: ${what.trim().charAt(0).toLowerCase()}${what.trim().slice(1)}`, `Starts from the ${template} template's rules, as version 1`, "Partners join once it's live; budget and tiers are set separately", "Every other program keeps its own rules"],
      status: "pending", patch: rules,
    }
    dispatch({ type: "proposeRule", req })
    toast.success(`${clean} program sent to Dana Ortiz`, { description: "It shows as Not launched until Dana approves its rules." })
    onClose()
  }
  const field = (key: keyof Rules, label: string, unit: string) => (
    <div className="grid gap-1.5">
      <Label htmlFor={`np-${key}`} className="text-[14.5px]">{label} <span className="font-normal text-muted-foreground">({unit})</span></Label>
      <Input id={`np-${key}`} inputMode="numeric" value={String(rules[key])} onChange={(e) => setRules({ ...rules, [key]: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 })} className="h-11 text-[15.5px]" />
    </div>
  )
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>New program</DialogTitle>
          <DialogDescription>Start from a template and adjust its rules. It shows as Not launched until Dana Ortiz approves; then it's version 1.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-[15px]">Template</Label>
              <Select value={template} onValueChange={pick}>
                <SelectTrigger className="h-11 w-full text-[15.5px]"><SelectValue /></SelectTrigger>
                <SelectContent>{templateIds.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="np-name" className="text-[15px]">Program name</Label>
              <Input id="np-name" value={name} onChange={(e) => setName(e.target.value)} className="h-11 text-[15.5px]" placeholder="e.g. Distributor" />
            </div>
          </div>
          {clash && <p className="-mt-2 text-[14px] text-bad">A program called {clean} already exists.</p>}
          <div className="grid gap-1.5">
            <Label htmlFor="np-what" className="text-[15px]">What it's for</Label>
            <Input id="np-what" value={what} onChange={(e) => setWhat(e.target.value)} className="h-11 text-[15.5px]" />
          </div>
          <div>
            <p className="mb-2 text-[14px] text-muted-foreground">Starting rules, from the {template} template. Change any of them.</p>
            <div className="grid grid-cols-2 gap-3">
              {field("autoApprove", "Auto-approve limit", "$")}
              {field("reviewHours", "Review deadline", "business hours")}
              {field("protectionDays", "Protection window", "days")}
              {field("leadHours", "Lead acceptance", "hours")}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="np-why" className="text-[15px]">Why</Label>
            <Textarea id="np-why" value={why} onChange={(e) => setWhy(e.target.value)} rows={3} className="text-[15.5px]" placeholder="Who it's for and what the data shows. Dana reads this first." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!ok} onClick={send}><Send /> Send to Dana</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** RevOps sets programs up from templates and proposes rule changes; the channel chief approves (R-APR-2, R-APR-6). */
export function OpsPrograms() {
  const { state } = useStore()
  const programs = useLivePrograms()
  const [propose, setPropose] = useState<ProgramId | null>(null)
  const [launching, setLaunching] = useState<ProgramId | null>(null)
  const [creating, setCreating] = useState(false)
  const mine = state.requests.filter((r) => r.from === people.revops.name)
  return (
    <div className="space-y-6">
      <PageHeader
        title="Programs and rules"
        sub="You create programs from templates and propose rule changes. Dana Ortiz approves them. Every change is a new version; nothing is edited in place."
        actions={<><Button variant="outline" onClick={() => setPropose("Reseller")}><PencilLine /> Propose a change</Button><Button onClick={() => setCreating(true)}><Plus /> New program</Button></>}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {programs.map((p) => {
          const r = state.programRules[p.id]
          const pending = state.requests.filter((x) => x.status === "pending" && x.programs !== "all" && x.programs.includes(p.id))
          return (
            <Panel key={p.id} className={cn(!p.live && "border-dashed")}>
              <div className="flex items-start justify-between gap-3">
                <span className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-brand-soft text-primary"><Layers className="size-5" /></span>
                  <span><b className="block text-[17px] text-foreground">{p.id}</b><span className="text-[13.5px] text-muted-foreground">{p.live ? `Rules version ${r.version}` : p.template ? `New · from the ${p.template} template` : "Template only"}</span></span>
                </span>
                {p.live ? <Badge className="border-0 bg-ok-soft text-ok">Live</Badge> : <Badge variant="outline" className="border-dashed">Not launched</Badge>}
              </div>
              <p className="mt-3 text-[14.5px] text-muted-foreground">{p.what}</p>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[14.5px]">
                <dt className="text-muted-foreground">Auto-approve</dt><dd className="text-right font-medium text-foreground tabular">{money(r.autoApprove)}{r.autoApproveTop ? ` · ${money(r.autoApproveTop)} top` : ""}</dd>
                <dt className="text-muted-foreground">Review deadline</dt><dd className="text-right font-medium text-foreground">{r.reviewHours} h{r.bigDealHours !== r.reviewHours ? ` · ${r.bigDealHours} h over $100K` : ""}</dd>
                <dt className="text-muted-foreground">Protection</dt><dd className="text-right font-medium text-foreground">{r.protectionDays} days</dd>
                <dt className="text-muted-foreground">Lead acceptance</dt><dd className="text-right font-medium text-foreground">{r.leadHours} h</dd>
              </dl>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {pending.length > 0 && <Badge className="border-0 bg-amber-soft text-amber-ink"><Clock3 /> {pending.length} with Dana</Badge>}
                {p.live
                  ? <Button size="sm" variant="outline" className="ml-auto" onClick={() => setPropose(p.id)}><PencilLine /> Propose a change</Button>
                  : !pending.length && <Button size="sm" className="ml-auto" onClick={() => setLaunching(p.id)}><Rocket /> {p.template ? "Send to Dana again" : "Set up from the template"}</Button>}
              </div>
            </Panel>
          )
        })}
      </div>

      <Panel title={<span className="flex items-center gap-2"><History className="size-5 text-primary" /> What you've sent</span>} sub="Dana's decisions show here and in your notifications" bodyClass="px-0 sm:px-0 pb-1">
        {mine.length === 0 ? <p className="px-6 pb-4 text-muted-foreground">Nothing sent yet.</p> : (
          <ul>
            {mine.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 border-t px-5 py-4 sm:px-6">
                <span className="min-w-0 flex-1">
                  <b className="block text-foreground">{r.title}</b>
                  <span className="block text-[14px] text-muted-foreground">{r.current} → {r.proposed}</span>
                  <span className="block text-[13.5px] text-muted-foreground">{r.id} · sent {ago(r.at)}{r.note ? ` · Dana: "${r.note}"` : ""}</span>
                </span>
                <RequestStatus status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <p className="text-[14px] text-muted-foreground">You can't approve your own changes (R-APR-2). Rules that are the same in every program, like nudges at 50% and escalation at 80%, are changed the same way.</p>
      <ProposeDialog key={`propose-${propose ?? "none"}`} program={propose} onClose={() => setPropose(null)} />
      <LaunchDialog key={`launch-${launching ?? "none"}`} program={launching} onClose={() => setLaunching(null)} />
      <NewProgramDialog key={`new-${creating}`} open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}
