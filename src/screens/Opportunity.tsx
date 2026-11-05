import { useMemo, useState } from "react"
import { ArrowRight, Hourglass, Lock, Minus, Plus, Scale, Send, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { PageHeader, Panel, PartnerAvatar, SalesforceMark } from "@/components/common"
import { ShareBar, SplitStatus, shareColors } from "@/screens/Credit"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Opportunity, PartnerRole } from "@/data/model"
import { me, partnerRoles } from "@/data/model"
import { ago, date, money, shortDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { modelSplit, useStore } from "@/store"

export function OpportunityScreen({ id }: { id: string }) {
  const { state, dispatch, partner } = useStore()
  const o = state.opportunities.find((x) => x.id === id)
  const [adding, setAdding] = useState(false)
  const [proposing, setProposing] = useState(false)
  if (!o) return <PageHeader title="Opportunity not found" back={{ label: "Credit splits", href: "/credit" }} />
  const closed = o.stage.startsWith("Closed")

  return (
    <div>
      <PageHeader
        back={{ label: "Credit splits", href: "/credit" }}
        title={o.account}
        sub={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <b className="text-foreground">{money(o.value)}</b>·<span>{o.stage}</span>·<span>{closed ? "Closed" : "Closes"} {shortDate(o.closeDate)}</span>·<span>AE {o.owner}</span>·
            <span className="inline-flex items-center gap-1"><SalesforceMark /> {o.id}</span>
          </span>
        }
        actions={
          <>
            <Button variant="outline" size="lg" onClick={() => setAdding(true)} disabled={closed}><UserPlus /> Add partner</Button>
            <Button size="lg" onClick={() => setProposing(true)} disabled={!!o.proposal || o.lines.length < 2 || closed}><Scale /> Propose split change</Button>
          </>
        }
      />

      {o.proposal && (
        <div className="mb-6 flex flex-wrap items-start gap-4 rounded-[14px] border border-amber/60 bg-amber-soft px-5 py-4">
          <Hourglass className="mt-0.5 size-5 shrink-0 text-amber-ink" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-amber-ink">Your proposed split is waiting for {o.proposal.approver}</p>
            <p className="text-[15px] text-foreground">Sent {ago(o.proposal.at)}. You can't approve your own proposal; the current split stays in force until it's approved.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {o.proposal.lines.map((l) => {
                const before = o.lines.find((x) => x.partnerId === l.partnerId)?.share ?? 0
                return (
                  <div key={l.partnerId} className="flex items-center justify-between rounded-[10px] bg-card px-3 py-2 text-[15px]">
                    <span className="text-foreground">{partner(l.partnerId)?.name}</span>
                    <span className="tabular"><span className="text-muted-foreground line-through">{before}%</span> <ArrowRight className="inline size-3.5" /> <b className="text-foreground">{l.share}%</b></span>
                  </div>
                )
              })}
            </div>
            <p className="mt-2 text-[14.5px]"><b className="text-foreground">Reason:</b> {o.proposal.reason}</p>
          </div>
          <Button variant="outline" className="bg-card" onClick={() => { dispatch({ type: "withdraw", oppId: o.id }); toast("Proposal withdrawn") }}>Withdraw</Button>
        </div>
      )}

      {!o.proposal && o.proposalOutcome && (
        <div className={cn("mb-6 rounded-[14px] border px-5 py-4 text-[15px]", o.proposalOutcome.approved ? "border-ok/40 bg-ok-soft/60" : "border-bad/40 bg-bad-soft/60")}>
          <b className={o.proposalOutcome.approved ? "text-ok" : "text-bad"}>{o.proposalOutcome.by} {o.proposalOutcome.approved ? "approved your split" : "declined your split"}</b>
          <span className="text-foreground"> · {ago(o.proposalOutcome.at)}. {o.proposalOutcome.approved ? "It's live, versioned, and every partner on the deal was told why." : o.proposalOutcome.reason}</span>
        </div>
      )}

      {o.reconciliation && (
        <div className={cn("mb-6 rounded-[14px] border px-5 py-4 text-[15px]", o.reconciliation === "matched" ? "border-ok/40 bg-ok-soft/60" : "border-bad/40 bg-bad-soft/60")}>
          <b className={o.reconciliation === "matched" ? "text-ok" : "text-bad"}>{o.reconciliation === "matched" ? "Reconciled" : "Mismatch"}</b>
          <span className="text-foreground"> · {o.reconciliationNote}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <Panel title="Partners and credit" sub="Every partner on the deal, with a role and a share" action={<SplitStatus o={o} />}>
            <ShareBar lines={o.lines} className="h-4" />
            <ul className="mt-5 divide-y">
              {o.lines.map((l, i) => {
                const p = partner(l.partnerId)!
                return (
                  <li key={l.partnerId} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-3.5 first:pt-0">
                    <span className="relative">
                      <PartnerAvatar name={p.name} />
                      <span className={cn("absolute -right-1 -bottom-1 size-3.5 rounded-full border-2 border-card", shareColors[i % shareColors.length])} />
                    </span>
                    <span className="min-w-0">
                      <b className="flex items-center gap-2 text-foreground">{p.name}{!p.assigned && <Badge variant="outline" className="font-normal text-muted-foreground"><Lock /> Not yours</Badge>}</b>
                      <span className="text-[14.5px] text-muted-foreground">{l.role}</span>
                    </span>
                    <span className="text-right">
                      <b className="block text-[20px] text-foreground tabular">{l.share}%</b>
                      <span className="text-[14px] text-muted-foreground tabular">{money(Math.round((o.value * l.share) / 100))}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
            <p className="mt-4 rounded-[10px] bg-muted px-4 py-3 text-[14.5px]">
              Deal value is counted once: <b className="text-foreground">{money(o.value)}</b>. Shares add up to 100%. Each partner sees only its own role and credit.
            </p>
          </Panel>

          <Panel title="Partner touches" sub="The evidence behind the split, oldest first">
            <ol className="relative space-y-5 before:absolute before:top-2 before:bottom-2 before:left-[19px] before:w-px before:bg-border">
              {o.touches.map((t) => {
                const p = partner(t.partnerId)!
                return (
                  <li key={t.id} className="relative flex gap-4">
                    <PartnerAvatar name={p.name} className="relative ring-4 ring-card" />
                    <div className="min-w-0 pt-0.5">
                      <p className="text-foreground"><b>{p.name}</b> · {t.text}</p>
                      <p className="text-[14px] text-muted-foreground">{t.kind} · {date(t.at)}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </Panel>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Panel title="How the split is set">
            <ol className="space-y-3 text-[15px]">
              {[
                "The Attribution agent applies the program's role-based model.",
                "You can add partners and roles, or propose a different split with evidence.",
                `${me.chief} (channel chief) approves or rejects your proposal.`,
                "Partners are told about any change to their credit, and why.",
              ].map((s, i) => (
                <li key={s} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-[13px] font-bold text-primary">{i + 1}</span>{s}</li>
              ))}
            </ol>
          </Panel>
          <Panel title="Split history">
            {o.versions.length ? (
              <ul className="space-y-3">
                {o.versions.map((v) => (
                  <li key={v.version} className="text-[15px]">
                    <b className="text-foreground">Version {v.version}</b> <span className="text-muted-foreground">· {shortDate(v.at)}</span>
                    <p>{v.note}</p>
                    <p className="text-[14px] text-muted-foreground">{v.by}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">Still on the first model split. Changes are versioned, never edited in place.</p>
            )}
          </Panel>
        </aside>
      </div>

      <AddPartnerDialog o={o} open={adding} onClose={() => setAdding(false)} />
      {proposing && <ProposeDialog o={o} onClose={() => setProposing(false)} />}
    </div>
  )
}

function AddPartnerDialog({ o, open, onClose }: { o: Opportunity; open: boolean; onClose: () => void }) {
  const { state, dispatch, partner } = useStore()
  const options = state.partners.filter((p) => p.status === "active" && !o.lines.some((l) => l.partnerId === p.id))
  const [pid, setPid] = useState("")
  const [role, setRole] = useState<PartnerRole>("Implementation")
  const [note, setNote] = useState("")
  const preview = useMemo(() => (pid ? modelSplit([...o.lines, { partnerId: pid, role }]) : null), [pid, role, o.lines])
  const suggested = o.touches.find((t) => !o.lines.some((l) => l.partnerId === t.partnerId))

  const close = () => { setPid(""); setNote(""); onClose() }
  const submit = () => {
    dispatch({ type: "addPartner", oppId: o.id, partnerId: pid, role, note })
    toast.success(`${partner(pid)?.name} added as ${role}`, { description: "Credit was recalculated by the program model. Each partner is told about its new share." })
    close()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a partner to {o.account}</DialogTitle>
          <DialogDescription>The split is recalculated by the program model straight away.</DialogDescription>
        </DialogHeader>
        {suggested && !pid && (
          <button
            onClick={() => { setPid(suggested.partnerId); setRole("Implementation"); setNote(suggested.text) }}
            className="flex items-start gap-3 rounded-[12px] border border-primary/30 bg-brand-soft/60 p-3 text-left"
          >
            <PartnerAvatar name={partner(suggested.partnerId)!.name} size="sm" />
            <span className="text-[15px]">
              <b className="text-foreground">Suggested: {partner(suggested.partnerId)!.name}</b>
              <span className="block text-muted-foreground">Logged a touch but isn't on the deal: "{suggested.text}"</span>
            </span>
          </button>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-[15px]">Partner</Label>
            <Select value={pid} onValueChange={setPid}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Choose a partner" /></SelectTrigger>
              <SelectContent>{options.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[15px]">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as PartnerRole)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{partnerRoles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-[15px]">What did they do? <span className="font-normal text-muted-foreground">(saved as a touch)</span></Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Delivered the dashboard migration" />
        </div>
        {preview && (
          <div className="rounded-[12px] border p-4">
            <p className="mb-3 text-[14px] font-semibold text-muted-foreground">New split from the model</p>
            <ShareBar lines={preview} />
            <ul className="mt-3 space-y-1.5 text-[15px]">
              {preview.map((l) => {
                const before = o.lines.find((x) => x.partnerId === l.partnerId)?.share
                return (
                  <li key={l.partnerId} className="flex justify-between">
                    <span className="text-foreground">{partner(l.partnerId)?.name} <span className="text-muted-foreground">· {l.role}</span></span>
                    <span className="tabular">{before !== undefined && <span className="text-muted-foreground">{before}% → </span>}<b className="text-foreground">{l.share}%</b></span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button disabled={!pid} onClick={submit}><UserPlus /> Add partner</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ProposeDialog({ o, onClose }: { o: Opportunity; onClose: () => void }) {
  const { dispatch, partner } = useStore()
  const [shares, setShares] = useState<Record<string, number>>(() => Object.fromEntries(o.lines.map((l) => [l.partnerId, l.share])))
  const [reason, setReason] = useState("")
  const [evidence, setEvidence] = useState<string[]>([])
  const total = Object.values(shares).reduce((a, b) => a + b, 0)
  const changed = o.lines.some((l) => shares[l.partnerId] !== l.share)
  const ok = total === 100 && changed && reason.trim().length > 10 && evidence.length > 0
  const set = (id: string, v: number) => setShares((s) => ({ ...s, [id]: Math.max(0, Math.min(100, Math.round(v))) }))
  const lines = o.lines.map((l) => ({ ...l, share: shares[l.partnerId] }))

  const submit = () => {
    dispatch({ type: "propose", oppId: o.id, lines, reason, evidence })
    toast.success(`Sent to ${me.chief} for approval`, { description: "The current split stays until it's approved." })
    onClose()
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Propose a new split for {o.account}</DialogTitle>
          <DialogDescription>{me.chief} approves it. You can't approve your own proposal.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {o.lines.map((l, i) => {
            const p = partner(l.partnerId)!
            const v = shares[l.partnerId]
            return (
              <div key={l.partnerId} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-[12px] border p-3 sm:grid-cols-[1fr_auto_auto]">
                <span className="flex min-w-0 items-center gap-3">
                  <span className={cn("size-3 shrink-0 rounded-full", shareColors[i % shareColors.length])} />
                  <span className="min-w-0">
                    <b className="block truncate text-foreground">{p.name}</b>
                    <span className="text-[14px] text-muted-foreground">{l.role} · now {l.share}%</span>
                  </span>
                </span>
                <span className="hidden text-[14.5px] text-muted-foreground sm:block tabular">{money(Math.round((o.value * v) / 100))}</span>
                <span className="flex items-center gap-1.5">
                  <Button variant="outline" size="icon" aria-label={`Lower ${p.name}`} onClick={() => set(l.partnerId, v - 5)}><Minus /></Button>
                  <span className="relative">
                    <Input type="number" inputMode="numeric" value={v} onChange={(e) => set(l.partnerId, Number(e.target.value))} className="w-[74px] pr-7 text-center text-[16px] font-semibold tabular" aria-label={`${p.name} share`} />
                    <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground">%</span>
                  </span>
                  <Button variant="outline" size="icon" aria-label={`Raise ${p.name}`} onClick={() => set(l.partnerId, v + 5)}><Plus /></Button>
                </span>
              </div>
            )
          })}
        </div>

        <div className={cn("flex items-center justify-between rounded-[10px] px-4 py-2.5 text-[15px]", total === 100 ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad")}>
          <span className="font-semibold">{total === 100 ? "Adds up to 100%" : `Adds up to ${total}%; it must be 100%`}</span>
          <ShareBar lines={lines.map((l) => ({ ...l, share: total ? (l.share / total) * 100 : 0 }))} className="w-40" />
        </div>

        <div className="space-y-2">
          <Label className="text-[15px]">Evidence <span className="font-normal text-muted-foreground">(pick at least one touch)</span></Label>
          <div className="grid gap-2">
            {o.touches.map((t) => {
              const label = `${t.kind} · ${shortDate(t.at)}`
              const on = evidence.includes(label)
              return (
                <Label key={t.id} className={cn("flex cursor-pointer items-start gap-3 rounded-[10px] border p-3 text-[15px] font-normal", on && "border-primary bg-brand-soft/60")}>
                  <Checkbox checked={on} onCheckedChange={(c) => setEvidence((e) => (c ? [...e, label] : e.filter((x) => x !== label)))} className="mt-0.5" />
                  <span><b className="text-foreground">{partner(t.partnerId)?.name}</b> · {t.text} <span className="text-muted-foreground">({shortDate(t.at)})</span></span>
                </Label>
              )
            })}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-[15px]">Why should the split change?</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Northpeak ran discovery, the executive meeting and wrote the statement of work." />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!ok} onClick={submit}><Send /> Send for approval</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
