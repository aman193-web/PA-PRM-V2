import { useState } from "react"
import { ArrowRight, ArrowRightLeft, Bell, Clock3, Timer, Users } from "lucide-react"
import { toast } from "sonner"
import { AddedTag, PageHeader, Panel, PartnerAvatar } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Partner } from "@/data/model"
import { ago, money } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { ownerOf, useRevenue } from "@/chief/useChief"

const managerNames = ["Jordan Lee", "Rui Costa", "Mei Tan"]
const reasons = ["Territory change", "Balancing workload", "Partner asked for a change", "Partner manager is leaving"]

/** Move a partner to another partner manager. Standard practice; the documents don't say who does this. */
export function MoveDialog({ p, onClose }: { p: Partner | null; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const from = p ? ownerOf(p) : ""
  const [to, setTo] = useState<string | null>(null)
  const [reason, setReason] = useState(reasons[0])
  const [note, setNote] = useState("")
  if (!p) return null
  const open = state.registrations.filter((r) => r.partnerId === p.id && ["under_review", "info_requested", "approved"].includes(r.state)).length
  const exts = state.extensions.filter((e) => e.partnerId === p.id && e.status === "pending").length
  const leads = state.leads.filter((l) => l.partnerId === p.id && ["offered", "accepted"].includes(l.status)).length
  const close = () => { setTo(null); setNote(""); setReason(reasons[0]); onClose() }
  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{from === "Not assigned" ? "Assign" : "Move"} {p.name}</DialogTitle>
          <DialogDescription>Now with <b className="text-foreground">{from}</b>. Pick who looks after them from now on.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2" role="radiogroup" aria-label="New partner manager">
          {managerNames.filter((m) => m !== from).map((m) => (
            <button key={m} type="button" role="radio" aria-checked={to === m} onClick={() => setTo(m)} className={cn("flex h-12 items-center justify-between rounded-[12px] border-2 px-4 text-left text-[15.5px] text-foreground", to === m ? "border-primary bg-brand-soft/50" : "border-border hover:border-border-strong")}>
              {m} <span className="text-[14px] text-muted-foreground">{m === "Jordan Lee" ? "North America" : m === "Rui Costa" ? "EMEA" : "APAC"}</span>
            </button>
          ))}
        </div>
        <div className="grid gap-1.5">
          <Label className="text-[14.5px]">Why</Label>
          <div className="flex flex-wrap gap-2">
            {reasons.map((r) => <button key={r} type="button" onClick={() => setReason(r)} className={cn("h-9 rounded-full border px-3 text-[14px]", reason === r ? "border-primary bg-brand-soft text-primary" : "bg-card text-foreground")}>{r}</button>)}
          </div>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="mt-1 text-[15px]" placeholder="Optional note for both partner managers" />
        </div>
        <p className="rounded-[12px] bg-muted/60 px-4 py-3 text-[14.5px] text-foreground">
          Moves with the partner: <b>{open}</b> open deal{open === 1 ? "" : "s"}, <b>{exts}</b> extension request{exts === 1 ? "" : "s"}, <b>{leads}</b> lead{leads === 1 ? "" : "s"}. Both partner managers and the partner are told.
        </p>
        <DialogFooter>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button disabled={!to} onClick={() => {
            dispatch({ type: "chiefAssign", partnerId: p.id, to: to!, reason: note.trim() ? `${reason}: ${note.trim()}` : reason })
            toast.success(`${p.name} now with ${to}`, { description: "Open deals, requests and leads moved with them. Both partner managers were told." })
            close()
          }}>{to ? `Move to ${to}` : "Pick a partner manager"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Assignments() {
  const { state } = useStore()
  const [moving, setMoving] = useState<Partner | null>(null)
  return (
    <Panel
      className="mt-6"
      title={<span className="flex flex-wrap items-center gap-2"><ArrowRightLeft className="size-5 text-primary" /> Who looks after which partner <AddedTag /></span>}
      sub="Move a partner to another partner manager, or assign one nobody looks after. The documents don't say who does this; in practice it's the channel chief."
      bodyClass="px-0 sm:px-0 pb-1"
    >
      <div className="hidden gap-x-4 border-y bg-surface-2/60 px-6 py-3 text-[14px] font-medium text-muted-foreground md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_120px_110px]">
        <span>Partner</span><span>Partner manager</span><span className="text-right">Won 2026</span><span />
      </div>
      <ul>
        {state.partners.map((p) => {
          const owner = ownerOf(p)
          return (
            <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b px-5 py-3.5 last:border-0 sm:px-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_120px_110px]">
              <span className="flex min-w-0 items-center gap-3">
                <PartnerAvatar name={p.name} size="sm" />
                <span className="min-w-0"><b className="block truncate text-foreground">{p.name}</b><span className="text-[13.5px] text-muted-foreground">{p.tier} · {p.region}{p.status === "onboarding" ? " · onboarding" : ""}</span></span>
              </span>
              <span className={cn("col-start-1 text-[15px] md:col-start-auto", owner === "Not assigned" ? "font-semibold text-amber-ink" : "text-foreground")}>{owner}</span>
              <span className="hidden text-right text-foreground tabular md:block">{money(p.wonThisYear)}</span>
              <span className="col-start-2 row-span-2 row-start-1 justify-self-end md:col-start-auto md:row-span-1 md:row-start-auto">
                <Button size="sm" variant={owner === "Not assigned" ? "default" : "outline"} onClick={() => setMoving(p)}>{owner === "Not assigned" ? "Assign" : "Move"}</Button>
              </span>
            </li>
          )
        })}
      </ul>
      <p className="px-6 pt-3 pb-3 text-[14px] text-muted-foreground">Rui's and Mei's own partners are sample totals in this demo, so only these partners can be moved.</p>
      {state.assignments.length > 0 && (
        <div className="mx-5 mb-4 rounded-[12px] border px-4 py-3 sm:mx-6">
          <p className="text-[14px] font-semibold text-muted-foreground">Recent moves</p>
          <ul className="mt-1.5 space-y-1.5">
            {state.assignments.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-x-2 text-[14.5px] text-foreground">
                <b>{a.partner}</b> {a.from} <ArrowRight className="size-3.5 text-muted-foreground" /> {a.to} <span className="text-muted-foreground">· {a.reason} · {ago(a.at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <MoveDialog p={moving} onClose={() => setMoving(null)} />
    </Panel>
  )
}

export function ChiefTeam() {
  const rev = useRevenue()
  return (
    <div>
      <PageHeader title="Partner managers" sub="How each partner manager's queue and partners are doing. You're alerted when a decision passes 80% of its deadline." />
      <div className="grid gap-4 lg:grid-cols-3">
        {rev.managers.map((m) => (
          <Panel key={m.id}>
            <div className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-night text-[15px] font-bold text-white">{m.initials}</span>
              <span className="min-w-0 flex-1"><b className="block text-[17px] text-foreground">{m.name}</b><span className="text-[14.5px] text-muted-foreground">{m.region} · {m.partners} partners</span></span>
              {m.live && <Badge variant="secondary">Live</Badge>}
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3">
              {[
                ["Verified revenue", money(m.wonThisYear)],
                ["Open pipeline", money(m.pipeline)],
                ["Decided on time", `${m.slaMet}%`],
                ["Median decision", `${m.medianHours} h`],
              ].map(([k, v]) => <div key={k} className="rounded-[12px] bg-muted/60 px-3 py-2.5"><dt className="text-[13.5px] text-muted-foreground">{k}</dt><dd className="text-[19px] font-bold text-foreground tabular">{v}</dd></div>)}
            </dl>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4 text-[15px]">
              <span className="inline-flex items-center gap-1.5 text-foreground"><Clock3 className="size-4 text-muted-foreground" /> {m.queue} waiting</span>
              <span className={cn("inline-flex items-center gap-1.5", m.atRisk ? "font-semibold text-bad" : "text-muted-foreground")}><Timer className="size-4" /> {m.atRisk} near deadline</span>
              <Button size="sm" variant="outline" className="ml-auto" disabled={!m.atRisk} onClick={() => toast.success(`Nudged ${m.name}`, { description: "Sent in Slack and email with the deals near their deadline." })}><Bell /> Nudge</Button>
            </div>
          </Panel>
        ))}
      </div>
      <Assignments />
      <Panel className="mt-6" title={<span className="flex items-center gap-2"><Users className="size-5 text-primary" /> How escalation works</span>}>
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            ["50% of the deadline", "The SLA agent nudges the partner manager by push, Slack or email."],
            ["80% of the deadline", "You're alerted and the deal appears in your Approvals. Decide it or nudge them."],
            ["100% of the deadline", "The deal is reassigned to a backup reviewer. It's never auto-approved on a timer."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-[14px] font-bold text-primary">{i + 1}</span><span><b className="block text-foreground">{t}</b><span className="text-[14.5px] text-muted-foreground">{d}</span></span></li>
          ))}
        </ol>
      </Panel>
    </div>
  )
}
