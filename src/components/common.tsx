import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Tabs as TabsPrimitive } from "radix-ui"
import { AlertTriangle, ArrowLeft, Check, Pause, Sparkles, X } from "lucide-react"
import type { Check as CheckT, Registration } from "@/data/model"
import { hoursLeft, initials } from "@/lib/format"
import { slaPct } from "@/store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-[21px] font-extrabold tracking-tight", light ? "text-white" : "text-foreground", className)}>
      <svg viewBox="0 0 28 24" className="h-6 w-7" aria-hidden>
        <path d="M6 22 11 2M13 22 18 2M20 22 25 2" stroke="#3b8cf5" strokeWidth="3" strokeLinecap="round" />
      </svg>
      PRM<i className="not-italic text-amber">.</i>
    </span>
  )
}

const tints = [
  "bg-brand-soft text-primary",
  "bg-amber-soft text-amber-ink",
  "bg-ok-soft text-ok",
  "bg-[#f1ecfd] text-[#6d3fd1] dark:bg-[#2a2147] dark:text-[#c4b0ff]",
  "bg-[#e8f6fb] text-[#06779e] dark:bg-[#10303d] dark:text-[#7fd3f0]",
]
export function PartnerAvatar({ name, className, size = "md" }: { name: string; className?: string; size?: "sm" | "md" | "lg" }) {
  const t = tints[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % tints.length]
  return (
    <span
      aria-hidden
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-[10px] font-semibold",
        size === "sm" && "size-8 text-[13px]",
        size === "md" && "size-10 text-sm",
        size === "lg" && "size-12 text-base",
        t,
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}

export function PageHeader({ title, sub, back, actions }: { title: ReactNode; sub?: ReactNode; back?: { label: string; href: string }; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 flex-1 basis-80">
        {back && (
          <a href={`#${back.href}`} className="mb-3 inline-flex items-center gap-1.5 text-[15px] font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> {back.label}
          </a>
        )}
        <h1 className="text-[26px] leading-tight font-bold sm:text-[28px]">{title}</h1>
        {sub && <p className="mt-1.5 text-[16px] text-muted-foreground">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ title, sub, action, children, className, bodyClass }: { title?: ReactNode; sub?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={cn("rounded-[14px] border bg-card shadow-[0_1px_2px_#172b4508,0_6px_18px_#172b4508]", className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6">
          <div className="min-w-0">
            {title && <h2 className="text-[17px] font-semibold">{title}</h2>}
            {sub && <p className="mt-0.5 text-[14px] text-muted-foreground">{sub}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn("p-5 sm:px-6", title && "pt-4", bodyClass)}>{children}</div>
    </section>
  )
}

export function SlaMeter({ reg, size = "sm" }: { reg: Registration; size?: "sm" | "lg" }) {
  const p = slaPct(reg)
  const paused = reg.state === "info_requested"
  const tone = paused ? "bg-muted-foreground/40" : p >= 80 ? "bg-bad" : p >= 50 ? "bg-amber" : "bg-primary"
  const label = paused ? "SLA paused" : hoursLeft(reg.slaHours - reg.usedHours)
  if (size === "sm")
    return (
      <div className="w-full min-w-28">
        <div className="flex items-center justify-between gap-2 text-[13px]">
          <span className={cn("font-semibold", paused ? "text-muted-foreground" : p >= 80 ? "text-bad" : p >= 50 ? "text-amber-ink" : "text-foreground")}>
            {paused && <Pause className="mr-1 inline size-3.5 -translate-y-px" />}
            {label}
          </span>
          <span className="text-muted-foreground tabular">{p}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full rounded-full", tone)} style={{ width: `${Math.max(p, 4)}%` }} />
        </div>
      </div>
    )
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn("text-[22px] font-bold tabular", paused ? "text-muted-foreground" : p >= 80 ? "text-bad" : p >= 50 ? "text-amber-ink" : "text-foreground")}>
          {label}
        </span>
        <span className="text-[14px] text-muted-foreground">
          {p}% of {reg.slaHours} business hours
        </span>
      </div>
      <div className="relative mt-3 h-3 rounded-full bg-muted">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${Math.max(p, 3)}%` }} />
        {[50, 80].map((m) => (
          <span key={m} className="absolute -top-1 h-5 w-0.5 rounded bg-foreground/25" style={{ left: `${m}%` }} />
        ))}
      </div>
      <div className="relative mt-2 h-5 text-[13px] text-muted-foreground">
        <span className="absolute -translate-x-1/2" style={{ left: "50%" }}>Nudge</span>
        <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: "80%" }}>Chief alerted</span>
      </div>
    </div>
  )
}

export function RegStateBadge({ reg }: { reg: Registration }) {
  const map = {
    under_review: { label: "Waiting for you", cls: "bg-amber-soft text-amber-ink" },
    info_requested: { label: "Info requested", cls: "bg-secondary text-foreground" },
    approved: { label: reg.decision?.by === "rules" ? "Auto-approved" : "Approved", cls: "bg-ok-soft text-ok" },
    rejected: { label: "Rejected", cls: "bg-bad-soft text-bad" },
    won: { label: "Won", cls: "bg-ok-soft text-ok" },
    lost: { label: "Lost", cls: "bg-secondary text-muted-foreground" },
    expired: { label: "Expired", cls: "bg-secondary text-muted-foreground" },
  } as const
  const m = map[reg.state]
  return <Badge className={cn("border-0", m.cls)}>{m.label}</Badge>
}

export function CheckIcon({ status, className }: { status: CheckT["status"]; className?: string }) {
  if (status === "pass")
    return (
      <span className={cn("grid size-6 shrink-0 place-items-center rounded-full bg-ok-soft text-ok", className)}>
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    )
  if (status === "fail")
    return (
      <span className={cn("grid size-6 shrink-0 place-items-center rounded-full bg-bad-soft text-bad", className)}>
        <X className="size-3.5" strokeWidth={3} />
      </span>
    )
  return (
    <span className={cn("grid size-6 shrink-0 place-items-center rounded-full bg-amber-soft text-amber-ink", className)}>
      <AlertTriangle className="size-3.5" strokeWidth={2.5} />
    </span>
  )
}

const checkOrder = { fail: 0, warn: 1, pass: 2 }

export function CheckList({ checks }: { checks: CheckT[] }) {
  // Problems first, so the reason a deal needs a person is the first thing read.
  const sorted = [...checks].sort((a, b) => checkOrder[a.status] - checkOrder[b.status])
  return (
    <ul className="divide-y">
      {sorted.map((c) => (
        <li key={c.label} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
          <CheckIcon status={c.status} className="mt-0.5" />
          <div className="min-w-0">
            <p className="font-medium text-foreground">{c.label}</p>
            <p className="text-[14px] text-muted-foreground">{c.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function Confidence({ value }: { value: number }) {
  const v = Math.round(value * 100)
  return (
    <span className="inline-flex items-center gap-2 text-[14px] text-muted-foreground">
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <span className="block h-full rounded-full bg-primary" style={{ width: `${v}%` }} />
      </span>
      {v}% confident
    </span>
  )
}

export function AiTag({ children = "AI recommendation" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold tracking-wide text-primary uppercase">
      <Sparkles className="size-4" /> {children}
    </span>
  )
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-ok-soft text-ok">{icon ?? <Check className="size-6" />}</span>
      <p className="text-[17px] font-semibold text-foreground">{title}</p>
      {body && <p className="mt-1 max-w-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Sparkline({ data, tone = "primary", className }: { data: number[]; tone?: "primary" | "ok" | "amber" | "bad"; className?: string }) {
  const w = 120, h = 36
  const max = Math.max(...data), min = Math.min(...data)
  const pts = data.map((d, i) => [(i / (data.length - 1)) * w, h - 4 - ((d - min) / (max - min || 1)) * (h - 8)])
  const color = { primary: "var(--primary)", ok: "var(--ok)", amber: "#e08a1e", bad: "var(--bad)" }[tone]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-9 w-30", className)} aria-hidden>
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pts.map((p) => p.join(",")).join(" ")} />
      <circle cx={pts.at(-1)![0]} cy={pts.at(-1)![1]} r="3.5" fill={color} />
    </svg>
  )
}

export function Stage2Tag() {
  return (
    <Badge variant="outline" className="border-dashed text-muted-foreground">
      Stage 2 preview
    </Badge>
  )
}

export function SalesforceMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 34" className={cn("h-4 w-6", className)} aria-hidden>
      <path
        fill="#00a1e0"
        d="M20 4.2a8.4 8.4 0 0 1 6.1-2.6c3.2 0 6 1.8 7.4 4.4a10.2 10.2 0 0 1 4.2-.9C43.4 5.1 48 9.7 48 15.4s-4.6 10.3-10.3 10.3c-.7 0-1.4-.1-2-.2a7.5 7.5 0 0 1-9.8 3.1 8.6 8.6 0 0 1-16-.4c-.5.1-1.1.2-1.7.2A8.2 8.2 0 0 1 4.1 13a9.4 9.4 0 0 1 15.9-8.8Z"
      />
    </svg>
  )
}

export function BackButton({ href, label }: { href: string; label: string }) {
  return (
    <Button variant="ghost" asChild className="-ml-3 text-muted-foreground">
      <a href={`#${href}`}>
        <ArrowLeft /> {label}
      </a>
    </Button>
  )
}

const optionTones = {
  ok: { tile: "bg-ok-soft text-ok", on: "border-ok bg-ok-soft/45", dot: "border-ok bg-ok" },
  bad: { tile: "bg-bad-soft text-bad", on: "border-bad bg-bad-soft/45", dot: "border-bad bg-bad" },
  amber: { tile: "bg-amber-soft text-amber-ink", on: "border-amber bg-amber-soft/55", dot: "border-amber-ink bg-amber-ink" },
  primary: { tile: "bg-brand-soft text-primary", on: "border-primary bg-brand-soft/55", dot: "border-primary bg-primary" },
}

/** One selectable decision: icon, what it does, and what happens next. Used for every decision panel. */
export function DecisionOption({ active, tone, onClick, icon, label, sub, suggested }: {
  active: boolean
  tone: keyof typeof optionTones
  onClick: () => void
  icon: ReactNode
  label: string
  sub: string
  suggested?: boolean
}) {
  const t = optionTones[tone]
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-[12px] border-2 p-3 text-left transition",
        active ? t.on : "border-border bg-card hover:border-border-strong hover:bg-muted/40",
      )}
    >
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-[10px] [&_svg]:size-5", t.tile)}>{icon}</span>
      <span className="min-w-0 flex-1 leading-snug">
        <span className="flex flex-wrap items-center gap-2">
          <b className="text-[16px] font-semibold text-foreground">{label}</b>
          {suggested && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-px text-[12.5px] font-semibold text-primary">
              <Sparkles className="size-3" /> Suggested
            </span>
          )}
        </span>
        <span className="block text-[14px] text-muted-foreground">{sub}</span>
      </span>
      <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border-2", active ? t.dot : "border-border-strong")}>
        {active && <span className="size-2 rounded-full bg-white" />}
      </span>
    </button>
  )
}

export interface TabItem {
  value: string
  label: string
  icon?: ReactNode
  count?: number
  /** "action" counts are things waiting on you; "neutral" are just totals. */
  tone?: "action" | "neutral"
  hint?: string
}

/** Page-level tabs: underline style, icon + count, and a one-line hint for the active tab. */
export function PageTabs({ value, onChange, items, label }: { value: string; onChange: (v: string) => void; items: TabItem[]; label: string }) {
  const active = items.find((t) => t.value === value)
  return (
    <TabsPrimitive.Root value={value} onValueChange={onChange} className="mb-5">
      <div className="-mx-4 border-b sm:mx-0">
        <TabsPrimitive.List aria-label={label} className="flex gap-1 overflow-x-auto px-2 [scrollbar-width:none] sm:px-0 [&::-webkit-scrollbar]:hidden">
          {items.map((t) => (
            <TabsPrimitive.Trigger
              key={t.value}
              value={t.value}
              className="group relative inline-flex h-[52px] shrink-0 items-center gap-2 rounded-t-[10px] px-4 text-[15.5px] font-semibold whitespace-nowrap text-muted-foreground transition-colors outline-none hover:bg-muted/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 data-[state=active]:text-foreground"
            >
              {t.icon && <span className="text-muted-foreground group-data-[state=active]:text-primary [&_svg]:size-[18px]">{t.icon}</span>}
              {t.label}
              {t.count ? (
                <span
                  className={cn(
                    "grid min-w-6 place-items-center rounded-full px-1.5 text-[13px] leading-6 font-bold tabular",
                    t.tone === "action" ? "bg-amber text-[#2a1a00]" : "bg-muted text-muted-foreground group-data-[state=active]:bg-brand-soft group-data-[state=active]:text-primary",
                  )}
                >
                  {t.count}
                </span>
              ) : null}
              <span className="absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-primary opacity-0 transition-opacity group-data-[state=active]:opacity-100" />
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>
      </div>
      {active?.hint && <p className="mt-3 text-[15px] text-muted-foreground">{active.hint}</p>}
    </TabsPrimitive.Root>
  )
}
