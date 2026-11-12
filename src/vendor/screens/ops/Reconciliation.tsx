import { ArrowRight, BookLock, CheckCircle2, CircleAlert, Scale } from "lucide-react"
import { PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { date, money } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { Kpi } from "@/partner/bits"
import { useOps } from "@/vendor/useVendor"

const reconBadge = { matched: "bg-ok-soft text-ok", pending: "bg-secondary text-foreground", mismatch: "bg-bad-soft text-bad" }
const reconLabel = { matched: "Matched", pending: "Waiting for Salesforce", mismatch: "On hold" }

/** Closed-won partner deals against Salesforce, and the append-only revenue ledger (J-02, R-CR-9). */
export function Reconciliation() {
  const { state } = useStore()
  const o = useOps()
  return (
    <div className="space-y-6">
      <PageHeader title="Reconciliation" sub="Every partner credit figure has to tie back to a Salesforce closed-won amount. Matched deals count as verified; anything that doesn't match is held until you settle it." />
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Kpi icon={<CheckCircle2 />} label="Matched to closed-won" value={`${o.matchedPct}%`} sub={`${o.rows.length - o.held.length} of ${o.rows.length} closed-won partner deals`} />
        <Kpi icon={<Scale />} label="Verified partner revenue" value={money(o.matchedValue)} sub="These deals, matched to Salesforce" />
        <Kpi icon={<CircleAlert />} label="On hold" value={money(o.heldValue)} sub={o.held.length ? o.held.map((r) => r.account).join(", ") : "Nothing held"} href={o.held.length ? "/v/exceptions" : undefined} />
      </div>

      <Panel title="Closed-won partner deals" sub="Newest first" bodyClass="px-0 sm:px-0 pb-1">
        <div className="hidden gap-x-4 border-y bg-surface-2/60 px-6 py-3 text-[14px] font-medium text-muted-foreground md:grid md:grid-cols-[minmax(0,1.2fr)_110px_minmax(0,1fr)_130px_minmax(0,1.3fr)]">
          <span>Account</span><span className="text-right">Amount</span><span>Partners</span><span>Status</span><span>Detail</span>
        </div>
        <ul>
          {o.rows.map((r) => {
            const ex = r.oppId ? state.exceptions.find((x) => x.oppId === r.oppId && x.status !== "resolved") : undefined
            return (
              <li key={r.key} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-b px-5 py-3.5 last:border-0 sm:px-6 md:grid-cols-[minmax(0,1.2fr)_110px_minmax(0,1fr)_130px_minmax(0,1.3fr)]">
                <span className="min-w-0"><b className="block truncate text-foreground">{r.account}</b><span className="text-[13.5px] text-muted-foreground">Closed {date(r.closeDate)}</span></span>
                <b className="text-right text-foreground tabular">{money(r.value)}</b>
                <span className="col-span-2 truncate text-[14.5px] text-muted-foreground md:col-span-1">{r.partners.join(", ")}</span>
                <span><Badge className={cn("border-0", reconBadge[r.status])}>{reconLabel[r.status]}</Badge></span>
                <span className="flex min-w-0 items-center justify-between gap-2 text-[14px] text-muted-foreground">
                  <span className="truncate">{r.note}</span>
                  {ex && <Button size="sm" variant="outline" className="shrink-0" onClick={() => go(`/v/exception/${ex.id}`)}>Resolve <ArrowRight /></Button>}
                </span>
              </li>
            )
          })}
        </ul>
      </Panel>

      <Panel title={<span className="flex items-center gap-2"><BookLock className="size-5 text-primary" /> Revenue ledger</span>} sub="Append-only. A correction is a new entry; the original stays, so past reports can always be rebuilt." bodyClass="px-0 sm:px-0 pb-1">
        <ul>
          {state.ledger.map((l) => (
            <li key={l.id} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 border-t px-5 py-3.5 sm:px-6 md:grid-cols-[90px_minmax(0,1fr)_120px]">
              <span className="font-mono text-[13.5px] text-muted-foreground">{l.id}</span>
              <span className="row-start-2 min-w-0 md:row-start-auto">
                <b className="block text-foreground">{l.account}</b>
                <span className="block text-[14px] text-muted-foreground">{l.text}</span>
                <span className="block text-[13px] text-muted-foreground">{l.by} · {date(l.at)}</span>
              </span>
              <b className={cn("text-right tabular", l.amount < 0 ? "text-bad" : "text-foreground")}>{l.amount < 0 ? `−${money(-l.amount)}` : money(l.amount)}</b>
            </li>
          ))}
        </ul>
      </Panel>
      <p className="text-[14px] text-muted-foreground">You can correct amounts and dates to match Salesforce. Changing who gets credit, or how it's shared, needs the channel chief (R-CR-2).</p>
    </div>
  )
}
