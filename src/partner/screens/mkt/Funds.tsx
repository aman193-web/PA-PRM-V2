import { useState } from "react"
import { Check, Coins, FileCheck2, Paperclip, Plus, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { EmptyState, PageHeader, Panel } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { date, money, NOW } from "@/lib/format"
import { go } from "@/lib/router"
import { useStore } from "@/store"
import type { MdfRequest } from "@/partner/marketing"
import { usePartner } from "@/partner/usePartner"
import { useMarketing } from "@/partner/useMarketing"
import { StageTag } from "@/partner/bits"
import { MdfBadge, stat } from "@/partner/screens/mkt/bits"

/** Paid, committed, waiting and available, as one bar. */
export function FundsBar({ allowance, paid, committed, waiting, available }: { allowance: number; paid: number; committed: number; waiting: number; available: number }) {
  const pct = (n: number) => `${allowance ? (n / allowance) * 100 : 0}%`
  const parts = [
    { label: "Paid", value: paid, cls: "bg-ok" },
    { label: "Approved, not yet claimed", value: committed, cls: "bg-primary" },
    { label: "Waiting for Brightline", value: waiting, cls: "bg-amber" },
    { label: "Available to request", value: available, cls: "bg-muted-foreground/25" },
  ]
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">{parts.map((p) => <span key={p.label} className={p.cls} style={{ width: pct(p.value) }} />)}</div>
      <ul className="mt-3 grid gap-y-1.5">
        {parts.map((p) => <li key={p.label} className="flex items-center gap-2 text-[14.5px]"><span className={`size-2.5 rounded-full ${p.cls}`} /><span className="flex-1 text-muted-foreground">{p.label}</span><b className="text-foreground tabular">{money(p.value)}</b></li>)}
      </ul>
    </div>
  )
}

function Timeline({ r }: { r: MdfRequest }) {
  const steps: [string, string | undefined, boolean][] = [
    ["Requested", `${r.requestedBy} · ${date(r.submittedAt)}`, true],
    [r.status === "rejected" ? "Declined" : "Approved", r.decidedAt && r.status !== "submitted" ? `${r.decidedBy} · ${date(r.decidedAt)}` : "Waiting for Brightline's channel chief", r.status !== "submitted"],
    ["Claimed with proof", r.claim ? `${money(r.claim.amount)} · ${date(r.claim.at)}` : r.status === "approved" ? `Due by ${date(r.claimDue!)}` : undefined, !!r.claim],
    [r.status === "claim_rejected" ? "Claim declined" : "Paid", r.paidAt ? date(r.paidAt) : undefined, r.status === "paid" || r.status === "claim_rejected"],
  ]
  const shown = r.status === "rejected" ? steps.slice(0, 2) : steps
  return (
    <ol className="mt-4 grid gap-3 sm:grid-cols-4">
      {shown.map(([label, sub, done]) => (
        <li key={label} className="flex gap-2.5 sm:block">
          <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-bold ${done ? "bg-ok text-white" : "bg-muted text-muted-foreground"}`}>{done ? <Check className="size-3.5" strokeWidth={3} /> : "·"}</span>
          <span className="sm:mt-1.5 sm:block"><b className="block text-[14.5px] text-foreground">{label}</b>{sub && <span className="text-[13.5px] text-muted-foreground">{sub}</span>}</span>
        </li>
      ))}
    </ol>
  )
}

function RequestDialog({ open, onOpenChange, campaignId }: { open: boolean; onOpenChange: (o: boolean) => void; campaignId?: string }) {
  const { dispatch } = useStore()
  const { me, company } = usePartner()
  const m = useMarketing()
  const options = m.campaigns.filter((c) => c.status !== "ended" && !c.mdfId)
  const [cid, setCid] = useState(campaignId && options.some((c) => c.id === campaignId) ? campaignId : options[0]?.id ?? "")
  const [activity, setActivity] = useState("")
  const [amount, setAmount] = useState("")
  const [expected, setExpected] = useState("")
  const n = Number(amount) || 0
  const over = n > m.funds.available
  const ready = !!cid && n > 0 && !over && activity.trim().length > 3 && expected.trim().length > 1
  const submit = () => {
    const c = m.campaigns.find((x) => x.id === cid)!
    dispatch({ type: "requestMdf", req: { id: `MDF-${Date.now() % 100000}`, companyId: company.id, campaignId: c.id, campaign: c.name, activity: activity.trim(), amount: n, expected: expected.trim(), requestedBy: me.name, submittedAt: NOW.toISOString(), status: "submitted" } })
    toast.success(`${money(n)} requested for ${c.name}`, { description: "Brightline's channel chief decides. You're told the moment it's decided." })
    onOpenChange(false)
    go("/p/funds")
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Request marketing funds</DialogTitle>
          <DialogDescription>{money(m.funds.available)} of Ridgeway's {money(m.funds.allowance)} is available to request this year.</DialogDescription>
        </DialogHeader>
        {options.length === 0 ? <p className="text-muted-foreground">Every live, scheduled or draft campaign already has funds. Launch a campaign first.</p> : (
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label className="text-[15px]">Campaign</Label>
              <Select value={cid} onValueChange={setCid}>
                <SelectTrigger className="h-11 w-full text-[15px]"><SelectValue /></SelectTrigger>
                <SelectContent>{options.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="act" className="text-[15px]">What the money pays for</Label>
              <Textarea id="act" value={activity} onChange={(e) => setActivity(e.target.value)} rows={2} className="text-[15.5px]" placeholder="e.g. Paid LinkedIn promotion and a webinar platform" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="amt" className="text-[15px]">Amount (USD)</Label>
                <Input id="amt" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))} className="h-11 text-[15.5px]" placeholder="e.g. 1000" />
                {over && <span className="text-[13.5px] text-bad">More than the {money(m.funds.available)} available</span>}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="exp" className="text-[15px]">Expected result</Label>
                <Input id="exp" value={expected} onChange={(e) => setExpected(e.target.value)} className="h-11 text-[15.5px]" placeholder="e.g. 10 leads" />
              </div>
            </div>
            <p className="flex gap-2 text-[14px] text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" /> Money always needs a person at Brightline to approve it. No agent can.</p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!ready} onClick={submit}>Send to Brightline</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ClaimDialog({ r, onClose }: { r: MdfRequest; onClose: () => void }) {
  const { dispatch } = useStore()
  const m = useMarketing()
  const c = m.campaigns.find((x) => x.id === r.campaignId)
  const s = c ? m.stats[c.id] : undefined
  const [invoice, setInvoice] = useState(false)
  const [amount, setAmount] = useState(String(r.amount))
  const n = Math.min(Number(amount) || 0, r.amount)
  const results = c && s ? `${stat(c.clicks)} clicks · ${s.leadCount} leads · ${s.regs.length} deal${s.regs.length === 1 ? "" : "s"} registered (${money(s.pipeline + s.wonValue)})` : "Results attached"
  const submit = () => {
    dispatch({ type: "claimMdf", id: r.id, amount: n, proof: ["Agency invoice (PDF)", "Tracked-link results"], results })
    toast.success(`Claim for ${money(n)} sent`, { description: "Brightline's channel chief reviews it. Payment follows approval." })
    onClose()
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Claim {money(r.amount)} for {r.campaign}</DialogTitle>
          <DialogDescription>Claims are tied to what the campaign produced. Your tracked-link results are attached for you.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="rounded-[12px] bg-muted/60 px-4 py-3">
            <p className="text-[13.5px] font-semibold text-muted-foreground">Results, from your tracked link</p>
            <p className="text-[15.5px] font-medium text-foreground">{results}</p>
          </div>
          <label className="flex items-center gap-3 rounded-[12px] border p-3">
            <Checkbox checked={invoice} onCheckedChange={(v) => setInvoice(!!v)} />
            <span className="flex-1"><b className="block text-[15px] text-foreground">Invoice attached</b><span className="text-[13.5px] text-muted-foreground">Proof of what you spent (demo: nothing is uploaded)</span></span>
            <Paperclip className="size-4 text-muted-foreground" />
          </label>
          <div className="grid gap-1.5 sm:max-w-[220px]">
            <Label htmlFor="camt" className="text-[15px]">Amount spent (USD)</Label>
            <Input id="camt" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))} className="h-11 text-[15.5px]" />
            <span className="text-[13.5px] text-muted-foreground">Up to the {money(r.amount)} approved</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!invoice || n <= 0} onClick={submit}><FileCheck2 /> Send the claim</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function Funds({ request }: { request?: string }) {
  const m = useMarketing()
  const launched = (r: MdfRequest) => m.campaigns.find((c) => c.id === r.campaignId)?.status !== "draft"
  const [asking, setAsking] = useState(!!request)
  const [claiming, setClaiming] = useState<MdfRequest | null>(null)
  const f = m.funds
  return (
    <div>
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">Marketing funds (MDF) <StageTag /></span>}
        sub="Ask before a campaign, claim after it with proof. Brightline's channel chief approves every request and claim: money is never automated."
        actions={<Button size="lg" onClick={() => setAsking(true)} disabled={f.available <= 0}><Plus /> Request funds</Button>}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Panel title="Ridgeway's funds this year" sub={`Gold partners get ${money(f.allowance)} a year (example program terms)`}>
          <p className="text-[15px] text-muted-foreground">Available to request</p>
          <p className="mt-1 mb-4 text-[36px] leading-none font-bold text-foreground tabular">{money(f.available)}</p>
          <FundsBar {...f} />
          <p className="mt-4 text-[14px] text-muted-foreground">Paul Okafor sees the same numbers on Ridgeway's Program page.</p>
        </Panel>
        <Panel title="Requests and claims" bodyClass="p-0 sm:p-0">
          {f.all.length === 0 ? <EmptyState icon={<Coins className="size-6" />} title="No requests yet" /> : (
            <ul>
              {f.all.map((r) => (
                <li key={r.id} className="border-b px-5 py-5 last:border-0 sm:px-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span className="min-w-0"><b className="block text-[16px] text-foreground">{r.campaign}</b><span className="text-[14px] text-muted-foreground">{r.activity} · expects {r.expected}</span></span>
                    <span className="flex items-center gap-3"><b className="text-[18px] text-foreground tabular">{money(r.amount)}</b><MdfBadge m={r} /></span>
                  </div>
                  <Timeline r={r} />
                  {r.reason && (r.status === "rejected" || r.status === "claim_rejected") && <p className="mt-3 rounded-[12px] bg-bad-soft/60 px-3 py-2 text-[14.5px] text-foreground">Dana Ortiz: "{r.reason}"</p>}
                  {r.claim && <p className="mt-3 text-[14px] text-muted-foreground">Claimed with: {r.claim.proof.join(", ")} · {r.claim.results}</p>}
                  {r.status === "approved" && (launched(r)
                    ? <Button className="mt-4" onClick={() => setClaiming(r)}><FileCheck2 /> File the claim</Button>
                    : <p className="mt-4 flex flex-wrap items-center gap-3 text-[14.5px] text-muted-foreground">Launch the campaign first, then claim after it runs. <Button size="sm" variant="outline" onClick={() => go(`/p/campaign/${r.campaignId}`)}>Open the campaign</Button></p>)}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <RequestDialog open={asking} onOpenChange={(o) => { setAsking(o); if (!o && request) go("/p/funds") }} campaignId={request} />
      {claiming && <ClaimDialog r={claiming} onClose={() => setClaiming(null)} />}
    </div>
  )
}
