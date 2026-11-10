import type { ReactNode } from "react"
import { ChevronRight, Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Registration } from "@/data/model"
import { date, money, NOW } from "@/lib/format"
import { cn } from "@/lib/utils"
import { daysUntil, partnerNext, partnerStatus, toneText, usePartner, usePartnerData, type CreditItem } from "@/partner/usePartner"

/** Registered during this demo session (the demo runs on a fixed clock, so new ones carry "now"). */
export const isJustRegistered = (r: Registration) => r.submittedAt === NOW.toISOString()

function JustRegistered({ reg }: { reg: Registration }) {
  return isJustRegistered(reg) ? <Badge className="border-0 bg-primary text-primary-foreground">Just registered</Badge> : null
}

export function StatusBadge({ reg }: { reg: Registration }) {
  const s = partnerStatus(reg)
  return <Badge className={cn("border-0", s.cls)}>{s.label}</Badge>
}

/** One deal row: the deal, its status and the one next step, in plain words. */
export function DealRows({ rows, empty }: { rows: Registration[]; empty?: ReactNode }) {
  const { isExec } = usePartner()
  const d = usePartnerData()
  if (!rows.length) return <>{empty}</>
  const cols = isExec ? "md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.9fr)_110px_minmax(0,1fr)_minmax(0,1.3fr)_20px]" : "md:grid-cols-[minmax(0,1.7fr)_110px_minmax(0,1fr)_minmax(0,1.4fr)_20px]"
  return (
    <div>
      <div className={cn("hidden gap-4 border-b px-6 py-3 text-[14px] font-medium text-muted-foreground md:grid", cols)}>
        <span>Deal</span>{isExec && <span>Rep</span>}<span className="text-right">Value</span><span>Status</span><span>Next step</span><span />
      </div>
      <ul>
        {rows.map((r) => {
          const n = partnerNext(r, d.pendingExt(r))
          return (
            <li key={r.id} className={cn("border-b last:border-0", isJustRegistered(r) && "bg-brand-soft/40")}>
              <a href={`#/p/deal/${r.id}`} className={cn("grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 px-5 py-4 hover:bg-muted/50 sm:px-6", cols)}>
                <span className="min-w-0">
                  <b className="block truncate text-[16px] text-foreground">{r.customer}</b>
                  <span className="block truncate text-[14px] text-muted-foreground">{r.product}{isExec ? <span className="md:hidden"> · {r.rep}</span> : null}</span>
                </span>
                {isExec && <span className="hidden truncate text-[15px] text-foreground md:block">{r.rep}</span>}
                <span className="text-right text-[16px] font-semibold text-foreground tabular">{money(r.value)}</span>
                <span className="col-span-2 flex flex-wrap items-center gap-x-3 gap-y-1 md:col-span-1"><StatusBadge reg={r} /><JustRegistered reg={r} /><span className={cn("text-[14.5px] font-medium md:hidden", toneText[n.tone])}>{n.text}</span></span>
                <span className={cn("hidden text-[14.5px] font-medium md:block", toneText[n.tone])}>{n.text}</span>
                <ChevronRight className="hidden size-5 text-muted-foreground md:block" />
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Narrow-panel version of the deal list: one stacked row per deal. */
export function CompactDeals({ rows, empty }: { rows: Registration[]; empty?: ReactNode }) {
  const { isExec } = usePartner()
  const d = usePartnerData()
  if (!rows.length) return <>{empty}</>
  return (
    <ul>
      {rows.map((r) => {
        const n = partnerNext(r, d.pendingExt(r))
        return (
          <li key={r.id} className={cn("border-t first:border-t-0", isJustRegistered(r) && "bg-brand-soft/40")}>
            <a href={`#/p/deal/${r.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 sm:px-6">
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <b className="truncate text-[16px] text-foreground">{r.customer}</b>
                  <span className="shrink-0 text-[15.5px] font-semibold text-foreground tabular">{money(r.value)}</span>
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <StatusBadge reg={r} />
                  <JustRegistered reg={r} />
                  <span className={cn("text-[14.5px] font-medium", toneText[n.tone])}>{n.text}</span>
                  {isExec && <span className="text-[14px] text-muted-foreground">· {r.rep}</span>}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </a>
          </li>
        )
      })}
    </ul>
  )
}

export function ProtectionMeter({ reg }: { reg: Registration }) {
  const total = 90
  const left = Math.max(0, daysUntil(reg.protectedUntil!))
  const p = Math.min(100, Math.round((left / total) * 100))
  const tone = left <= 21 ? "bg-amber" : "bg-ok"
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn("text-[24px] font-bold tabular", left <= 21 ? "text-amber-ink" : "text-foreground")}>{left} days left</span>
        <span className="text-[14px] text-muted-foreground">Protected until {date(reg.protectedUntil!)}</span>
      </div>
      <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${Math.max(p, 3)}%` }} />
      </div>
    </div>
  )
}

/** The company's own share, with any other partners shown only as a count (R-CR-5). */
export function ShareBar({ c }: { c: Pick<CreditItem, "share" | "others" | "role"> }) {
  const { company } = usePartner()
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        <span className="h-full bg-primary" style={{ width: `${c.share}%` }} />
        {c.others > 0 && <span className="h-full flex-1 bg-[repeating-linear-gradient(135deg,var(--muted),var(--muted)_6px,var(--border)_6px,var(--border)_12px)]" />}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[14px]">
        <span className="font-semibold text-foreground">{company.short} · {c.role} · {c.share}%</span>
        {c.others > 0 && (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Lock className="size-3.5" /> {c.others} other partner{c.others > 1 ? "s" : ""} · details private</span>
        )}
      </div>
    </div>
  )
}

export function CreditKind({ c }: { c: CreditItem }) {
  if (c.kind === "pipeline") return <Badge variant="secondary">Open deal</Badge>
  if (c.recon === "mismatch") return <Badge className="border-0 bg-amber-soft text-amber-ink">Checking with Salesforce</Badge>
  if (c.recon === "pending") return <Badge className="border-0 bg-secondary text-foreground">Matching</Badge>
  return <Badge className="border-0 bg-ok-soft text-ok">Verified</Badge>
}

export function Kpi({ label, value, sub, icon, href }: { label: string; value: string; sub?: ReactNode; icon: ReactNode; href?: string }) {
  const body = (
    <>
      <span className="grid size-10 place-items-center rounded-[10px] bg-brand-soft text-primary [&_svg]:size-5">{icon}</span>
      <p className="mt-4 text-[15px] font-medium text-muted-foreground">{label}</p>
      <p className="text-[30px] leading-tight font-bold text-foreground tabular sm:text-[34px]">{value}</p>
      {sub && <p className="mt-auto pt-1.5 text-[14.5px] text-muted-foreground">{sub}</p>}
    </>
  )
  const cls = "flex flex-col rounded-[14px] border bg-card p-4 shadow-[0_1px_2px_#172b4508,0_6px_18px_#172b4508] sm:p-6"
  return href ? <a href={`#${href}`} className={cn(cls, "transition hover:border-primary/60")}>{body}</a> : <div className={cls}>{body}</div>
}

export function StageTag({ children = "Stage 2 preview" }: { children?: ReactNode }) {
  return <Badge variant="outline" className="border-dashed text-muted-foreground">{children}</Badge>
}
