import { Fragment, useState } from "react"
import { BadgeCheck, ChevronDown, Download, Lock, ShieldCheck, TrendingUp, Trophy } from "lucide-react"
import { toast } from "sonner"
import { PageHeader, Panel } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { money, shortDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { company } from "@/partner/data"
import { usePartner, usePartnerData, type CreditItem } from "@/partner/usePartner"
import { CreditKind, Kpi, ShareBar } from "@/partner/bits"

function exportCsv(rows: CreditItem[]) {
  const head = ["Account", "Product", "Deal value", "Ridgeway role", "Ridgeway share %", "Ridgeway credit", "Status", "Salesforce match", "Rep", "Close date"]
  const body = rows.map((c) => [c.account, c.product, c.value, c.role, c.share, c.credited, c.kind === "verified" ? "Won" : "Open", c.recon ?? "", c.rep ?? "", c.closeDate])
  const csv = [head, ...body].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")
  const a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
  a.download = "ridgeway-brightline-credit.csv"
  a.click()
  URL.revokeObjectURL(a.href)
}

function Row({ c, showRep }: { c: CreditItem; showRep: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="border-b last:border-0">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 px-5 py-4 text-left hover:bg-muted/50 sm:px-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_120px_130px_24px]">
        <span className="min-w-0">
          <b className="block truncate text-[16px] text-foreground">{c.account}</b>
          <span className="block truncate text-[14px] text-muted-foreground">{c.product}{showRep && c.rep ? ` · ${c.rep}` : ""} · {c.kind === "verified" ? `won ${shortDate(c.closeDate)}` : c.stage}</span>
        </span>
        <span className="text-right text-[16px] font-semibold text-foreground tabular md:order-3">{money(c.credited)}</span>
        <span className="col-span-2 flex flex-wrap items-center gap-2 text-[14.5px] md:order-2 md:col-span-1">
          <span className="text-foreground">{c.role} · {c.share}%</span>
          {c.others > 0 && <span className="inline-flex items-center gap-1 text-muted-foreground"><Lock className="size-3.5" />+{c.others} private</span>}
        </span>
        <span className="hidden md:order-4 md:block"><CreditKind c={c} /></span>
        <ChevronDown className={cn("hidden size-5 text-muted-foreground transition md:order-5 md:block", open && "rotate-180")} />
      </button>
      {open && (
        <div className="grid gap-5 bg-muted/30 px-5 py-5 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <ShareBar c={c} />
            <p className="mt-3 text-[15px] text-foreground">{c.why}</p>
            <p className="mt-1 text-[14px] text-muted-foreground">Deal value {money(c.value)}. Value counts once; each partner sees only its own share.</p>
            {c.recon && <p className="mt-2 text-[14px] text-muted-foreground">{c.recon === "matched" ? "Matched to Salesforce closed-won." : c.recon === "mismatch" ? "Being checked against Salesforce by Brightline RevOps." : "Waiting to match with Salesforce."}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <p className="text-[13.5px] font-semibold tracking-wide text-muted-foreground uppercase">Ridgeway's work on it</p>
              <ul className="mt-1.5 space-y-1 text-[14.5px] text-foreground">{c.touches.map((t, i) => <li key={i}>{shortDate(t.at)} · {t.text}</li>)}</ul>
            </div>
            <div>
              <p className="text-[13.5px] font-semibold tracking-wide text-muted-foreground uppercase">Credit history</p>
              <ul className="mt-1.5 space-y-1 text-[14.5px] text-foreground">{c.versions.map((v, i) => <li key={i}>{shortDate(v.at)} · {v.note}</li>)}</ul>
            </div>
          </div>
          {c.regId && <a href={`#/p/deal/${c.regId}`} className="text-[15px] font-semibold text-primary hover:underline lg:col-span-2">Open the deal to dispute or see its timeline</a>}
        </div>
      )}
    </li>
  )
}

export function Credit() {
  const { isExec } = usePartner()
  const d = usePartnerData()
  const [withOpen, setWithOpen] = useState(!isExec)
  // Executive views show verified credit only by default (R-CR-10).
  const rows = d.credit.filter((c) => withOpen || c.kind === "verified")
  const won = d.credit.filter((c) => c.kind === "verified")
  const byRep = [...new Set(won.map((c) => c.rep).filter(Boolean))].map((r) => ({ rep: r!, total: won.filter((c) => c.rep === r).reduce((n, c) => n + c.credited, 0) })).sort((a, b) => b.total - a.total)
  const max = Math.max(1, ...byRep.map((r) => r.total))

  return (
    <div>
      <PageHeader
        title={isExec ? "Revenue and credit" : "My credit"}
        sub={isExec ? `What ${company.name} has earned with Brightline. Every won figure is matched to Salesforce closed-won. You see Ridgeway's share only, never another partner's.` : "Your share of every deal you registered, and why. Other partners on a deal stay private."}
        actions={isExec ? <Button size="lg" variant="outline" onClick={() => { exportCsv(rows); toast.success("Exported Ridgeway's credit", { description: "ridgeway-brightline-credit.csv" }) }}><Download /> Export CSV</Button> : undefined}
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Kpi icon={<BadgeCheck />} label={isExec ? "Verified revenue, 2026" : "Verified credit, 2026"} value={money(d.verifiedTotal)} sub={`${won.length} won deals · matched to closed-won`} />
        <Kpi icon={<TrendingUp />} label="Credit on open deals" value={money(d.pipelineTotal)} sub="Counts once a deal is won" />
        <Kpi icon={<ShieldCheck />} label={isExec ? "Approved this week" : "Value created this week"} value={money(d.weekValue)} sub={`${d.thisWeek.length} deal${d.thisWeek.length === 1 ? "" : "s"} protected`} />
      </div>

      <div className={cn("grid gap-6", isExec && "xl:grid-cols-[1fr_320px]")}>
        <Panel
          title={withOpen ? "All credit" : "Verified credit"}
          sub={withOpen ? "Won deals and the credit expected on open ones" : "Won deals only, as executive views show by default"}
          action={<label className="flex items-center gap-2 text-[14.5px] font-medium text-foreground"><Switch checked={withOpen} onCheckedChange={setWithOpen} /> Include open deals</label>}
          bodyClass="px-0 sm:px-0 pb-1"
        >
          <div className="hidden gap-4 border-y px-6 py-3 text-[14px] font-medium text-muted-foreground md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_120px_130px_24px]">
            <span>Deal</span><span>Ridgeway's role</span><span className="text-right">Credit</span><span>Status</span><span />
          </div>
          <ul>{rows.map((c) => <Fragment key={c.key}><Row c={c} showRep={isExec} /></Fragment>)}</ul>
        </Panel>
        {isExec && (
          <Panel title="Won revenue by rep" sub="2026, verified">
            <ul className="space-y-4">
              {byRep.map((r) => (
                <li key={r.rep}>
                  <div className="flex justify-between text-[15px]"><span className="text-foreground">{r.rep}</span><b className="text-foreground tabular">{money(r.total)}</b></div>
                  <div className="mt-1.5 h-2.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(r.total / max) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
            <p className="mt-5 flex gap-2 rounded-[12px] bg-ok-soft/60 px-3 py-2.5 text-[14.5px] text-foreground"><Trophy className="mt-0.5 size-4 shrink-0 text-ok" /> Every won deal this year is matched to Salesforce. Nothing is waiting on RevOps.</p>
          </Panel>
        )}
      </div>
    </div>
  )
}
