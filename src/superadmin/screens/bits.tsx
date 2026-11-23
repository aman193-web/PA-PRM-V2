import { useState, type ReactNode } from "react"
import { Pause, Play, Power, Wrench } from "lucide-react"
import { toast } from "sonner"
import { Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { orgStatusLabel, type Org } from "@/superadmin/data"

export function OrgStatus({ o }: { o: Pick<Org, "status"> }) {
  const tone = { active: "bg-ok-soft text-ok", trial: "bg-brand-soft text-primary", onboarding: "bg-amber-soft text-amber-ink", suspended: "bg-bad-soft text-bad" }[o.status]
  return <Badge className={cn("border-0", tone)}>{orgStatusLabel[o.status]}</Badge>
}

export function Health({ h }: { h: Org["health"] }) {
  return <span className="inline-flex items-center gap-1.5 text-[14px] text-foreground"><span className={cn("size-2.5 rounded-full", h === "good" ? "bg-ok" : h === "watch" ? "bg-amber" : "bg-bad")} />{h === "good" ? "Healthy" : h === "watch" ? "Watch" : "Problem"}</span>
}

export function Stat({ label, value, sub, href }: { label: string; value: string; sub?: ReactNode; href?: string }) {
  const body = (
    <>
      <p className="text-[14.5px] font-medium text-muted-foreground">{label}</p>
      <p className="text-[28px] leading-tight font-bold text-foreground tabular">{value}</p>
      {sub && <p className="mt-auto pt-1 text-[13.5px] text-muted-foreground">{sub}</p>}
    </>
  )
  const cls = "flex flex-col rounded-[14px] border bg-card p-4 shadow-[0_1px_2px_#172b4508] sm:p-5"
  return href ? <a href={`#${href}`} className={cn(cls, "transition hover:border-primary/60")}>{body}</a> : <div className={cls}>{body}</div>
}

export function Bars({ rows, fmt = (n: number) => n.toLocaleString("en-US") }: { rows: { label: string; value: number; tone?: string }[]; fmt?: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="flex justify-between gap-2 text-[14.5px]"><span className="truncate text-foreground">{r.label}</span><b className="text-foreground tabular">{fmt(r.value)}</b></span>
          <span className="mt-1 block h-2 rounded-full bg-muted"><span className={cn("block h-full rounded-full", r.tone ?? "bg-primary")} style={{ width: `${(r.value / max) * 100}%` }} /></span>
        </li>
      ))}
    </ul>
  )
}

/** Confirm a platform-wide action: these affect every tenant, so they always ask first. */
export function ConfirmButton({ label, title, body, onConfirm, danger, icon, size = "default", variant }: { label: ReactNode; title: string; body: string; onConfirm: () => void; danger?: boolean; icon?: ReactNode; size?: "default" | "sm" | "lg"; variant?: "default" | "outline" }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size={size} variant={variant ?? (danger ? "default" : "outline")} className={cn(danger && variant !== "outline" && "bg-bad text-white hover:bg-bad/90")} onClick={() => setOpen(true)}>{icon}{label}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{body}</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className={cn(danger && "bg-bad text-white hover:bg-bad/90")} onClick={() => { onConfirm(); setOpen(false) }}>{icon}{label}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** The two switches that reach every tenant at once: the AI kill switch and maintenance mode. */
export function PlatformControls() {
  const { state, dispatch } = useStore()
  const p = state.platform
  return (
    <Panel title="Platform controls" sub="These reach every tenant at once, and every use is logged">
      <ul className="space-y-4">
        <li className={cn("rounded-[12px] border p-4", p.aiPaused && "border-bad/50 bg-bad-soft/30")}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="min-w-0"><b className="flex items-center gap-2 text-foreground"><Power className="size-4 text-bad" /> AI kill switch</b><span className="text-[14px] text-muted-foreground">{p.aiPaused ? "Every agent is paused for every tenant. People do the work by hand." : "Stops every agent for every tenant within seconds (R-AG-3)."}</span></span>
            {p.aiPaused
              ? <Button onClick={() => { dispatch({ type: "saAiPause" }); toast.success("AI agents are back on for every tenant") }}><Play /> Turn agents back on</Button>
              : <ConfirmButton danger icon={<Pause />} label="Pause every agent" title="Pause every AI agent, for every tenant?" body="All agents stop within seconds for every customer. Partner managers decide by hand; the rules still approve clean deals. Each tenant's AI supervisor and partner managers are told." onConfirm={() => { dispatch({ type: "saAiPause" }); toast.warning("Every AI agent is paused", { description: "All tenants are told." }) }} />}
          </div>
        </li>
        <li className={cn("rounded-[12px] border p-4", p.maintenance && "border-amber/60 bg-amber-soft/30")}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="min-w-0"><b className="flex items-center gap-2 text-foreground"><Wrench className="size-4 text-amber-ink" /> Maintenance mode</b><span className="text-[14px] text-muted-foreground">{p.maintenance ? "Every tenant is read-only and sees a banner." : "Makes every tenant read-only with a banner, for upgrades and migrations."}</span></span>
            {p.maintenance
              ? <Button onClick={() => { dispatch({ type: "saMaintenance" }); toast.success("Maintenance mode is off") }}>End maintenance</Button>
              : <ConfirmButton icon={<Wrench />} label="Start maintenance" title="Make every tenant read-only?" body="Everyone can still sign in and look, but nothing can be changed until you end maintenance. A banner explains it in every portal." onConfirm={() => { dispatch({ type: "saMaintenance" }); toast.warning("Maintenance mode is on", { description: "Every portal shows the banner." }) }} />}
          </div>
        </li>
      </ul>
    </Panel>
  )
}
