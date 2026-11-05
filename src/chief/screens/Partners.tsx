import { useState } from "react"
import { Download, Search, TrendingDown, TrendingUp, X } from "lucide-react"
import { toast } from "sonner"
import { PageHeader, Panel, PartnerAvatar } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { money } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { budget, programs } from "@/chief/data"
import { useRevenue, type PartnerRevenue } from "@/chief/useChief"
import { MoveDialog } from "@/chief/screens/Team"
import type { Partner } from "@/data/model"

export function exportBoardView(rows: PartnerRevenue[]) {
  const head = ["Partner", "Tier", "Program", "Partner manager", "Region", "Verified revenue 2026", "Open pipeline", "Trend"]
  const csv = [head, ...rows.map((p) => [p.name, p.tier, p.program, p.manager, p.region, p.won, p.pipeline, p.trend ?? ""])].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")
  const a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
  a.download = "brightline-revenue-by-partner.csv"
  a.click()
  URL.revokeObjectURL(a.href)
  toast.success("Board view exported", { description: "brightline-revenue-by-partner.csv · verified figures only" })
}

const trendBadge = (t?: PartnerRevenue["trend"]) =>
  t === "rising" ? <Badge className="border-0 bg-ok-soft text-ok"><TrendingUp /> Rising</Badge>
    : t === "stalling" ? <Badge className="border-0 bg-amber-soft text-amber-ink"><TrendingDown /> Stalling</Badge>
      : t === "at_risk" ? <Badge className="border-0 bg-bad-soft text-bad"><TrendingDown /> At risk</Badge>
        : <Badge variant="secondary">Steady</Badge>

function PartnerSheet({ p, onClose, onMove }: { p: PartnerRevenue | undefined; onClose: () => void; onMove: (p: Partner) => void }) {
  const { state } = useStore()
  const live = p?.live ? state.partners.find((x) => x.id === p.id) : undefined
  const regs = p?.live ? state.registrations.filter((r) => r.partnerId === p.id) : []
  const open = regs.filter((r) => ["approved", "under_review", "info_requested"].includes(r.state))
  const h = p?.live ? state.health.find((x) => x.partnerId === p.id) : undefined
  return (
    <Sheet open={!!p} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto data-[side=right]:sm:max-w-[480px]">
        {p && (
          <>
            <SheetHeader className="border-b px-6 py-5">
              <div className="flex items-center gap-3"><PartnerAvatar name={p.name} size="lg" /><div><SheetTitle className="text-[20px]">{p.name}</SheetTitle><SheetDescription className="text-[14.5px]">{p.tier} {p.program.toLowerCase()} · {p.region}</SheetDescription></div></div>
            </SheetHeader>
            <div className="space-y-5 px-6 py-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[12px] bg-muted/60 p-4"><p className="text-[14px] text-muted-foreground">Verified 2026</p><p className="text-[24px] font-bold text-foreground tabular">{money(p.won)}</p></div>
                <div className="rounded-[12px] bg-muted/60 p-4"><p className="text-[14px] text-muted-foreground">Open pipeline</p><p className="text-[24px] font-bold text-foreground tabular">{money(p.pipeline)}</p></div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[15px] text-muted-foreground">Partner manager</span>
                <span className="flex items-center gap-2">
                  <b className={p.manager === "Not assigned" ? "text-amber-ink" : "text-foreground"}>{p.manager}</b>
                  {live && <Button size="sm" variant={p.manager === "Not assigned" ? "default" : "outline"} onClick={() => onMove(live)}>{p.manager === "Not assigned" ? "Assign" : "Move"}</Button>}
                </span>
              </div>
              <div className="flex items-center justify-between"><span className="text-[15px] text-muted-foreground">Trend</span>{trendBadge(p.trend)}</div>
              {h && <p className="rounded-[12px] bg-brand-soft/50 px-4 py-3 text-[15px] text-foreground">{h.why}</p>}
              {p.live ? (
                <div>
                  <p className="mb-2 text-[14px] font-semibold text-muted-foreground">Open deals ({open.length})</p>
                  <ul className="divide-y rounded-[12px] border">{open.slice(0, 6).map((r) => <li key={r.id} className="flex justify-between gap-3 px-4 py-2.5 text-[15px]"><span className="truncate text-foreground">{r.customer}</span><b className="text-foreground tabular">{money(r.value)}</b></li>)}</ul>
                </div>
              ) : <p className="text-[14.5px] text-muted-foreground">Deal detail lives with {p.manager}. You see totals here.</p>}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

export function ChiefPartners({ id }: { id?: string }) {
  const rev = useRevenue()
  const { state } = useStore()
  const [moving, setMoving] = useState<Partner | null>(null)
  const [q, setQ] = useState("")
  const [mgr, setMgr] = useState("all")
  const [prog, setProg] = useState("all")
  const managers = [...new Set(rev.all.map((p) => p.manager))]
  // If the filtered manager no longer has partners (e.g. the last unassigned one was just assigned), show everyone.
  const mgrValue = mgr === "all" || managers.includes(mgr) ? mgr : "all"
  const rows = rev.all.filter((p) => (mgrValue === "all" || p.manager === mgrValue) && (prog === "all" || p.program === prog) && (!q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase())))
  const max = Math.max(1, ...rev.all.map((p) => p.won))
  const top5 = rev.all.slice(0, 5).reduce((n, p) => n + p.won, 0)

  return (
    <div>
      <PageHeader
        title="Revenue by partner"
        sub="Verified revenue matched to Salesforce closed-won, across every partner manager. This is what the board sees."
        actions={<Button size="lg" variant="outline" onClick={() => exportBoardView(rows)}><Download /> Export board view</Button>}
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
        {[
          ["Verified revenue, 2026", money(rev.won), `${Math.round((rev.won / budget.revenueTarget) * 100)}% of the ${money(budget.revenueTarget)} target`],
          ["Open partner pipeline", money(rev.pipeline), `${rev.all.length} active partners`],
          ["Top 5 partners' share", `${Math.round((top5 / rev.won) * 100)}%`, "Of verified partner revenue"],
        ].map(([k, v, s]) => (
          <div key={k} className="rounded-[14px] border bg-card p-5 shadow-[0_1px_2px_#172b4508]"><p className="text-[15px] font-medium text-muted-foreground">{k}</p><p className="text-[32px] leading-tight font-bold text-foreground tabular">{v}</p><p className="text-[14.5px] text-muted-foreground">{s}</p></div>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1 basis-60">
          <span className="sr-only">Search partners</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search partners" className="h-11 w-full rounded-[12px] border bg-card pr-3 pl-11 text-[15.5px] text-foreground outline-none focus:border-primary" />
          {q && <button onClick={() => setQ("")} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" aria-label="Clear"><X className="size-4" /></button>}
        </label>
        <Select value={prog} onValueChange={setProg}>
          <SelectTrigger className="h-11 w-44 bg-card text-[15px]" aria-label="Program"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All programs</SelectItem>{programs.filter((x) => x.live).map((x) => <SelectItem key={x.id} value={x.id}>{x.id} program</SelectItem>)}</SelectContent>
        </Select>
        <Select value={mgrValue} onValueChange={setMgr}>
          <SelectTrigger className="h-11 w-52 bg-card text-[15px]" aria-label="Partner manager"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All partner managers</SelectItem>{managers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Panel bodyClass="p-0 sm:p-0">
        <div className="hidden gap-4 border-b px-6 py-3 text-[14px] font-medium text-muted-foreground md:grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.6fr)_120px_130px_110px]">
          <span>Partner</span><span>Verified revenue, 2026</span><span className="text-right">Pipeline</span><span>Manager</span><span>Trend</span>
        </div>
        <ul>
          {rows.map((p) => {
            const unassigned = p.manager === "Not assigned"
            const live = state.partners.find((x) => x.id === p.id)
            return (
            <li key={p.id} className="border-b last:border-0">
              {/* The whole row opens the partner; the name is the keyboard target, and Assign is its own button. */}
              <div onClick={() => go(`/c/partners/${p.id}`)} className="grid w-full cursor-pointer grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-4 text-left hover:bg-muted/50 sm:px-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.6fr)_120px_130px_110px]">
                <span className="flex min-w-0 items-center gap-3"><PartnerAvatar name={p.name} size="sm" /><span className="min-w-0"><button type="button" onClick={(e) => { e.stopPropagation(); go(`/c/partners/${p.id}`) }} className="block max-w-full truncate text-left font-bold text-foreground hover:text-primary">{p.name}</button><span className="text-[13.5px] text-muted-foreground">{p.tier} · {p.program}</span></span></span>
                <span className="col-span-2 flex items-center gap-3 md:col-span-1">
                  <span className="h-2.5 flex-1 rounded-full bg-muted"><span className={cn("block h-full rounded-full", p.won ? "bg-primary" : "")} style={{ width: `${(p.won / max) * 100}%` }} /></span>
                  <b className="w-24 text-right text-foreground tabular">{money(p.won)}</b>
                </span>
                <span className="hidden text-right text-foreground tabular md:block">{money(p.pipeline)}</span>
                {unassigned && live ? (
                  <span className="col-span-2 flex items-center gap-2 md:col-span-1">
                    <span className="text-[14.5px] font-semibold text-amber-ink md:sr-only">Not assigned</span>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); setMoving(live) }}>Assign</Button>
                  </span>
                ) : (
                  <span className="hidden text-[14.5px] text-foreground md:block">{p.manager}</span>
                )}
                <span className="row-start-1 justify-self-end md:row-auto md:justify-self-start">{trendBadge(p.trend)}</span>
              </div>
            </li>
            )
          })}
        </ul>
      </Panel>
      <PartnerSheet p={rev.all.find((p) => p.id === id)} onClose={() => go("/c/partners")} onMove={setMoving} />
      <MoveDialog p={moving} onClose={() => setMoving(null)} />
    </div>
  )
}
