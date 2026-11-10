import type { ReactNode } from "react"
import { ArrowRight, CircleArrowUp, Clock3, Cpu, Download, PieChart, Scale, Sparkles, Timer, UserPlus, Coins } from "lucide-react"
import { Panel, PartnerAvatar } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ago, money } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { budget, chief } from "@/chief/data"
import { kindLabel, useApprovals, useRevenue, type ApprovalKind } from "@/chief/useChief"
import { useChiefAssistant } from "@/chief/ChiefShell"
import { exportBoardView } from "@/chief/screens/Partners"

export const kindIcon: Record<ApprovalKind, ReactNode> = {
  deal: <Timer />, split: <Scale />, extension: <Clock3 />, application: <UserPlus />, rule: <CircleArrowUp />, autonomy: <Cpu />, funds: <Coins />,
}
export const toneTile = { bad: "bg-bad-soft text-bad", amber: "bg-amber-soft text-amber-ink", primary: "bg-brand-soft text-primary" }

export function ChiefHome() {
  const approvals = useApprovals()
  const rev = useRevenue()
  const { state } = useStore()
  const { ask } = useChiefAssistant()
  const pct = Math.round((rev.won / budget.revenueTarget) * 100)
  const roi = rev.won / budget.spent
  const atRisk = rev.all.filter((p) => p.trend === "at_risk" || p.trend === "stalling")
  const urgent = approvals.filter((a) => a.tone === "bad").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] leading-tight font-bold sm:text-[32px]">Good afternoon, {chief.first}.</h1>
        <p className="mt-1.5 text-[16.5px] text-muted-foreground">
          {approvals.length ? <>{approvals.length} decisions are waiting for you{urgent ? <>, and <b className="text-bad">{urgent} can't wait</b></> : null}.</> : "Nothing is waiting for your approval."}
        </p>
      </div>

      <button onClick={() => ask()} className="flex h-14 w-full items-center gap-3 rounded-[14px] border bg-card px-5 text-left text-[16px] text-muted-foreground shadow-[0_1px_2px_#172b4508] transition hover:border-primary/60">
        <Sparkles className="size-5 text-primary" />
        <span className="flex-1 truncate">Ask about partners, approvals or the budget…</span>
        <span className="hidden text-[14px] sm:inline">e.g. "Is the program worth the budget?"</span>
      </button>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <div className="relative col-span-2 overflow-hidden rounded-[14px] bg-night p-6 text-white">
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative flex h-full flex-col">
            <p className="text-[15px] font-medium text-[#b9cbe4]">Partner revenue, {budget.year} · verified</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
              <span className="text-[48px] leading-none font-bold tabular">{money(rev.won)}</span>
              <span className="text-[15.5px] text-[#cfe0f7]">matched to Salesforce closed-won</span>
            </div>
            <div className="mt-5">
              <div className="flex justify-between text-[14.5px] text-[#cfe0f7]"><span>Annual target {money(budget.revenueTarget)}</span><span className="tabular">{pct}%</span></div>
              <div className="mt-1.5 h-2.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-amber" style={{ width: `${pct}%` }} /></div>
            </div>
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <Button size="lg" className="bg-white text-night hover:bg-white/90" onClick={() => go("/c/partners")}><PieChart /> Revenue by partner</Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => exportBoardView(rev.all)}><Download /> Board view</Button>
            </div>
          </div>
        </div>
        <a href="#/c/approvals" className="group flex flex-col rounded-[14px] border bg-card p-4 shadow-[0_1px_2px_#172b4508,0_6px_18px_#172b4508] transition hover:border-primary/60 sm:p-6">
          <span className="grid size-10 place-items-center rounded-[10px] bg-amber-soft text-amber-ink [&_svg]:size-5"><Scale /></span>
          <p className="mt-4 text-[15px] font-medium text-muted-foreground">Waiting for your approval</p>
          <p className="text-[36px] leading-tight font-bold text-foreground tabular">{approvals.length}</p>
          <p className="mt-auto pt-2 text-[14.5px] text-muted-foreground">{urgent ? `${urgent} past 80% of a deadline` : "None near a deadline"}</p>
        </a>
        <a href="#/c/program" className="group flex flex-col rounded-[14px] border bg-card p-4 shadow-[0_1px_2px_#172b4508,0_6px_18px_#172b4508] transition hover:border-primary/60 sm:p-6">
          <span className="grid size-10 place-items-center rounded-[10px] bg-ok-soft text-ok [&_svg]:size-5"><PieChart /></span>
          <p className="mt-4 text-[15px] font-medium text-muted-foreground">Return on program budget</p>
          <p className="text-[36px] leading-tight font-bold text-foreground tabular">{roi.toFixed(1)}x</p>
          <p className="mt-auto pt-2 text-[14.5px] text-muted-foreground">{money(budget.spent)} spent of {money(budget.annual)}</p>
        </a>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <Panel title="Decide next" sub="Escalations first. Each one shows who sent it and why." action={<Button variant="ghost" onClick={() => go("/c/approvals")}>All {approvals.length} <ArrowRight /></Button>} bodyClass="px-0 sm:px-0 pb-2">
          {approvals.length === 0 ? <p className="px-6 pb-4 text-muted-foreground">You're all caught up.</p> : (
            <ul>
              {approvals.slice(0, 5).map((a) => (
                <li key={a.id} className="border-t first:border-t-0">
                  <a href={`#/c/approval/${a.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 sm:px-6">
                    <span className={cn("grid size-10 shrink-0 place-items-center rounded-[10px] [&_svg]:size-5", toneTile[a.tone])}>{kindIcon[a.kind]}</span>
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-[16px] text-foreground">{a.title}</b>
                      <span className="block truncate text-[14px] text-muted-foreground">{kindLabel[a.kind]} · from {a.from}</span>
                    </span>
                    <Badge variant="secondary" className={cn("hidden sm:inline-flex", a.tone === "bad" && "bg-bad-soft text-bad")}>{a.tag}</Badge>
                    <span className="hidden text-[15px] font-semibold text-primary md:inline">Review</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Top partners" sub="Verified revenue this year" action={<Button variant="ghost" onClick={() => go("/c/partners")}>All <ArrowRight /></Button>}>
          <ul className="space-y-3.5">
            {rev.top.map((p) => (
              <li key={p.id}>
                <a href={`#/c/partners/${p.id}`} className="flex items-center gap-3">
                  <PartnerAvatar name={p.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between gap-2 text-[15px]"><b className="truncate text-foreground">{p.name}</b><b className="text-foreground tabular">{money(p.won)}</b></span>
                    <span className="mt-1 block h-2 rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${(p.won / rev.top[0].won) * 100}%` }} /></span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr] [&>*]:min-w-0">
        <Panel title="Partners to watch" sub="Stalling or at risk, with their partner manager">
          <ul className="divide-y">
            {atRisk.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <PartnerAvatar name={p.name} size="sm" />
                <span className="min-w-0 flex-1"><b className="block text-foreground">{p.name}</b><span className="text-[14px] text-muted-foreground">{p.manager} · {money(p.pipeline)} open</span></span>
                <Badge className={cn("border-0", p.trend === "at_risk" ? "bg-bad-soft text-bad" : "bg-amber-soft text-amber-ink")}>{p.trend === "at_risk" ? "At risk" : "Stalling"}</Badge>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Recent">
          <ul className="space-y-3">
            {state.chiefFeed.slice(0, 6).map((a) => (
              <li key={a.id} className="flex items-start gap-3">
                <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0 flex-1">
                  {a.href ? <a href={`#${a.href}`} className="text-foreground hover:text-primary">{a.text}</a> : <span className="text-foreground">{a.text}</span>}
                  <p className="text-[13.5px] text-muted-foreground">{ago(a.at)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
