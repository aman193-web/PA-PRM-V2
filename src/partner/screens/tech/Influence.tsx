import { useState } from "react"
import { Briefcase, ChevronDown, Handshake, TrendingUp } from "lucide-react"
import { PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { date, money } from "@/lib/format"
import { cn } from "@/lib/utils"
import { usePartner } from "@/partner/usePartner"
import { useDelivery } from "@/partner/useDelivery"
import { Kpi, ShareBar } from "@/partner/bits"

/** Revenue on deals the technical lead delivered on, and the company's credit on them (J-02, R-CR-5). */
export function Influence() {
  const { company } = usePartner()
  const t = useDelivery()
  const [open, setOpen] = useState<string | null>(null)
  const rows = t.views.filter((v) => v.line)
  return (
    <div className="space-y-6">
      <PageHeader title="Your influence" sub={`Revenue on deals you delivered on, and ${company.short}'s credit on them. Won figures are matched to Salesforce closed-won. Other partners' shares stay private.`} />
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Kpi icon={<TrendingUp />} label="Influenced revenue, 2026" value={money(t.influenced)} sub="Closed-won deals with your milestones" />
        <Kpi icon={<Handshake />} label={`${company.short}'s credit on them`} value={money(t.creditWon)} sub="Verified, by its role on each deal" />
        <Kpi icon={<Briefcase />} label="Open pipeline you're delivering on" value={money(t.pipeline)} sub={`${money(t.creditPipeline)} of ${company.short} credit if won`} />
      </div>
      <Panel bodyClass="p-0 sm:p-0">
        <ul>
          {rows.map((v) => {
            const isOpen = open === v.e.id
            return (
              <li key={v.e.id} className="border-b last:border-0">
                <button type="button" onClick={() => setOpen(isOpen ? null : v.e.id)} aria-expanded={isOpen} className="grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-4 text-left hover:bg-muted/50 sm:px-6 md:grid-cols-[minmax(0,1.4fr)_120px_minmax(0,1.3fr)_120px_20px]">
                  <span className="min-w-0"><b className="block truncate text-[16px] text-foreground">{v.e.account}</b><span className="block truncate text-[14px] text-muted-foreground">{v.e.product} · {v.stage}</span></span>
                  <span className="text-right text-[16px] font-semibold text-foreground tabular">{money(v.e.value)}</span>
                  <span className="col-span-2 md:col-span-1"><ShareBar c={{ share: v.line!.share, others: v.others, role: v.line!.role }} /></span>
                  <span className="text-right"><b className="block text-foreground tabular">{money(v.credited)}</b>{v.won ? <Badge className="border-0 bg-ok-soft text-ok">Verified</Badge> : <Badge variant="secondary">Open deal</Badge>}</span>
                  <ChevronDown className={cn("size-5 text-muted-foreground transition", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="border-t bg-muted/30 px-5 py-4 sm:px-6">
                    <p className="text-[14.5px] font-semibold text-foreground">Why {company.short} is credited</p>
                    <p className="text-[14.5px] text-muted-foreground">Role-based split: {v.line!.role} weight{v.others ? `, shared with ${v.others} other partner${v.others > 1 ? "s" : ""}` : ", only partner on the deal"}.</p>
                    <p className="mt-3 text-[14.5px] font-semibold text-foreground">Your milestones on this deal</p>
                    {v.myTouches.length ? <ul className="mt-1 space-y-1">{v.myTouches.map((tc) => <li key={tc.id} className="text-[14.5px] text-muted-foreground">{date(tc.at)} · <b className="text-foreground">{tc.kind}</b> · {tc.text}</li>)}</ul> : <p className="text-[14.5px] text-muted-foreground">None logged yet.</p>}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </Panel>
      <p className="text-[14px] text-muted-foreground">You see {company.short}'s share only, never another partner's (R-CR-5). Credit is set by Brightline's model; you can't change it. Disputes go to Jordan Lee and arrive in Stage 2.</p>
    </div>
  )
}
