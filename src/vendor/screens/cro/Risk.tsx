import { useState } from "react"
import { CheckCircle2, Clock3, Hourglass, MessageSquareText, ShieldOff, Sparkles, Users } from "lucide-react"
import { toast } from "sonner"
import { EmptyState, PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { NOW, ago, date, money } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { sellersWithPortal } from "@/vendor/sales"
import { useSales, type AskOption, type Risk, type RiskFlag } from "@/vendor/useVendor"

const flagIcon: Record<RiskFlag["kind"], React.ReactNode> = { deadline: <Clock3 />, protection: <ShieldOff />, stale: <Hourglass />, partner: <Users /> }
const flagTile: Record<RiskFlag["kind"], string> = { deadline: "bg-bad-soft text-bad", protection: "bg-amber-soft text-amber-ink", stale: "bg-secondary text-foreground", partner: "bg-brand-soft text-primary" }
const reach = (o: AskOption) => (o.to === "seller" && !sellersWithPortal.includes(o.name) ? "by Slack and email" : o.to === "chief" ? "in Dana's portal and Slack" : "in their portal and Slack")

/** Ask the person who can act. The CRO sees everything but decides nothing here. */
export function AskDialog({ risk, option, onClose }: { risk: Risk | null; option: AskOption | null; onClose: () => void }) {
  const { dispatch } = useStore()
  const [text, setText] = useState(option?.text ?? "")
  if (!risk || !option) return null
  const send = () => {
    dispatch({ type: "croNudge", nudge: { id: `N-${Date.now()}`, key: risk.key, account: risk.account, to: option.to, toName: option.name, text: text.trim(), at: NOW.toISOString() } })
    toast.success(`Sent to ${option.name}`, { description: `${option.why}. You'll see here when it's settled.` })
    onClose()
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Ask {option.name} about {risk.account}</DialogTitle>
          <DialogDescription>{option.why}. It reaches them {reach(option)}. They decide; you'll see the outcome here.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor="ask" className="text-[15px]">Message</Label>
          <Textarea id="ask" value={text} onChange={(e) => setText(e.target.value)} rows={4} className="text-[15.5px]" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!text.trim()} onClick={send}><MessageSquareText /> Send to {option.name}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RiskCard({ r, compact, onAsk }: { r: Risk; compact?: boolean; onAsk: (o: AskOption) => void }) {
  const main = r.flags[0]
  return (
    <li className={cn("border-b px-5 py-4 last:border-0 sm:px-6", !compact && "sm:py-5")}>
      <div className="flex items-start gap-4">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-[10px] [&_svg]:size-5", flagTile[main.kind])}>{flagIcon[main.kind]}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <b className="text-[16px] text-foreground">{r.account}</b>
            <b className="text-foreground tabular">{money(r.value)}</b>
          </div>
          <p className="text-[14px] text-muted-foreground">{r.stage} · closes {date(r.closeDate, { month: "short", day: "numeric" })}{r.partners.length ? ` · ${r.partners.join(", ")}` : " · no partner"}{r.owner ? ` · ${r.owner}` : ""}</p>
          <ul className="mt-2 space-y-1.5">
            {r.flags.map((f) => (
              <li key={f.label} className="text-[15px]">
                <span className="flex flex-wrap items-center gap-2 font-semibold text-foreground">{f.label}{f.ai && <Badge className="gap-1 border-0 bg-brand-soft text-primary"><Sparkles className="size-3" /> AI flag</Badge>}</span>
                {!compact && <span className="block text-[14.5px] text-muted-foreground">{f.detail}</span>}
              </li>
            ))}
          </ul>
          {r.underway && <p className="mt-2 flex gap-2 text-[14.5px] text-foreground"><Hourglass className="mt-0.5 size-4 shrink-0 text-primary" /> {r.underway}</p>}
          {r.nudges.map((n) => <p key={n.id} className="mt-2 flex gap-2 text-[14.5px] text-ok"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /> You asked {n.toName} {ago(n.at)}</p>)}
          {!compact && (
            <div className="mt-3 flex flex-wrap gap-2">
              {r.ask.map((o) => (
                <Button key={o.name} size="sm" variant={r.nudges.some((n) => n.toName === o.name) ? "ghost" : "outline"} onClick={() => onAsk(o)}>
                  <MessageSquareText /> Ask {o.name} <span className="font-normal text-muted-foreground">· {o.to === "pam" ? "partner manager" : o.to === "chief" ? "channel chief" : "seller"}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

export function CroRisk() {
  const s = useSales()
  const [ask, setAsk] = useState<{ r: Risk; o: AskOption } | null>(null)
  const nobody = s.risks.filter((r) => !r.underway && !r.nudges.length)
  return (
    <div className="space-y-6">
      <PageHeader title="Deals at risk" sub="Partner deals that could slip or lose their partner, largest first. You don't decide them; ask the person who can." />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr] [&>*]:min-w-0">
        <div className="space-y-6">
          <Panel title={`${s.risks.length} deals · ${money(s.riskValue)}`} sub={nobody.length ? `${nobody.length} with nobody on them yet` : "Someone is on every one of them"} bodyClass="px-0 sm:px-0 pb-1">
            {s.risks.length === 0 ? <EmptyState title="No partner deals at risk" body="New risks show up here and in your notifications." /> : (
              <ul>{s.risks.map((r) => <RiskCard key={r.key} r={r} onAsk={(o) => setAsk({ r, o })} />)}</ul>
            )}
          </Panel>
          {s.settled.length > 0 && (
            <Panel title="Settled after you asked" sub="The risk cleared once someone acted">
              <ul className="space-y-3">
                {s.settled.map((n) => (
                  <li key={n.id} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" />
                    <span><b className="text-foreground">{n.account}</b><span className="block text-[14px] text-muted-foreground">You asked {n.toName} {ago(n.at)}. It's no longer at risk.</span></span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
        <div className="space-y-6">
          <Panel title="What counts as at risk">
            <ul className="space-y-3 text-[15px]">
              {([
                ["deadline", "A registration past 80% of its review deadline", "The channel chief is alerted at 80% (R-SLA-3)"],
                ["protection", "Protection ends within 14 days, before the expected close", "The partner could lose the deal it registered (R-REG-10)"],
                ["stale", "No Salesforce activity for 45 days or more", "Flagged by the Data Steward agent"],
                ["partner", "A deal that needs a partner and has none", "AI flag, Stage 2 preview (PD-05)"],
              ] as [RiskFlag["kind"], string, string][]).map(([k, t, d]) => (
                <li key={k} className="flex gap-3">
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-[8px] [&_svg]:size-4", flagTile[k])}>{flagIcon[k]}</span>
                  <span><span className="block text-foreground">{t}</span><span className="text-[14px] text-muted-foreground">{d}</span></span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Who you can ask">
            <ul className="space-y-2.5 text-[15px] text-foreground">
              <li><b>Jordan Lee</b>, partner manager: registrations, extensions, the partner</li>
              <li><b>The seller</b> who owns the opportunity: close date, stage, co-sell</li>
              <li><b>Dana Ortiz</b>, channel chief: escalated deals and second extensions</li>
            </ul>
            <p className="mt-3 text-[14px] text-muted-foreground">Asking is added beyond the documents, which only say the CRO can view and export. It never changes a deal.</p>
          </Panel>
        </div>
      </div>
      {ask && <AskDialog key={`${ask.r.key}-${ask.o.name}`} risk={ask.r} option={ask.o} onClose={() => setAsk(null)} />}
    </div>
  )
}
