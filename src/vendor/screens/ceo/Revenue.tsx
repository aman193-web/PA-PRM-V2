import { useState } from "react"
import { Download, Link2, Presentation, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { PageHeader, Panel, PartnerAvatar } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { PartnerRole } from "@/data/model"
import { money, moneyShort } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { budget } from "@/chief/data"
import { exportBoardView } from "@/chief/screens/Partners"
import { modelProposal, modelVersions, unverified } from "@/vendor/data"
import { useExec } from "@/vendor/useVendor"

/** Quarter bars. Each past quarter keeps the attribution model that was in force at the time. */
export function QuarterBars({ rows, light }: { rows: ReturnType<typeof useExec>["byQuarter"]; light?: boolean }) {
  const max = Math.max(...rows.map((r) => r.won))
  return (
    <div className="grid grid-cols-4 items-end gap-3">
      {rows.map((r) => (
        <div key={r.q} className="flex flex-col items-center gap-1.5">
          <span className={cn("text-[14px] font-semibold tabular", light ? "text-white" : "text-foreground")}>{moneyShort(r.won)}</span>
          <div className={cn("flex h-28 w-full items-end rounded-[8px]", light ? "bg-white/8" : "bg-muted")}>
            <div className={cn("w-full rounded-[8px]", "toDate" in r ? "bg-amber" : light ? "bg-[#3b8cf5]" : "bg-primary")} style={{ height: `${Math.max(6, (r.won / max) * 100)}%` }} />
          </div>
          <span className={cn("text-[13.5px]", light ? "text-[#cfe0f7]" : "text-muted-foreground")}>{r.q}{"toDate" in r ? " to date" : ""}</span>
          <span className={cn("rounded-full px-2 text-[12px] font-medium", light ? "bg-white/10 text-[#cfe0f7]" : "bg-secondary text-muted-foreground")}>Model v{r.model}</span>
        </div>
      ))}
    </div>
  )
}

function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1)
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="flex justify-between gap-2 text-[15px]"><span className="text-foreground">{r.label}</span><b className="text-foreground tabular">{money(r.value)}</b></span>
          <span className="mt-1 block h-2 rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${(r.value / max) * 100}%` }} /></span>
        </li>
      ))}
    </ul>
  )
}

/** All partner revenue, verified by default, with unverified credit on a switch (persona note, R-CR-10). */
export function ExecRevenue() {
  const e = useExec()
  const [reported, setReported] = useState(false)
  const [inferred, setInferred] = useState(false)
  const extra = (reported ? unverified.partnerReported.amount : 0) + (inferred ? unverified.aiInferred.amount : 0)
  const v2 = modelVersions.find((m) => m.version === 2)!
  const roles = Object.keys(v2.weights!) as PartnerRole[]
  return (
    <div className="space-y-6">
      <PageHeader title="Partner revenue" sub="Everything partners brought in this year. Verified figures are matched to Salesforce closed-won; nothing else counts unless you switch it on." actions={<Button variant="outline" onClick={() => go("/v/board")}><Presentation /> Board view</Button>} />

      <Panel>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[15px] text-muted-foreground">{extra ? "Verified plus unverified credit" : "Verified partner revenue, 2026"}</p>
            <p className="text-[42px] leading-tight font-bold text-foreground tabular">{money(e.rev.won + extra)}</p>
            <p className="text-[15px] text-muted-foreground">{extra ? <>Of which <b className="text-foreground">{money(e.rev.won)}</b> is verified. The rest isn't matched to closed-won.</> : <>{e.pct}% of the {money(budget.revenueTarget)} target · {Math.round(e.share * 100)}% of Brightline's revenue</>}</p>
          </div>
          <div className="grid gap-3">
            <label className="flex items-center gap-3 text-[15px]"><Switch checked disabled aria-readonly /> <span><b className="text-foreground">Verified</b> <span className="text-muted-foreground">· always on</span></span></label>
            <label className="flex cursor-pointer items-start gap-3 text-[15px]"><Switch checked={reported} onCheckedChange={setReported} /> <span><b className="text-foreground">{unverified.partnerReported.label}</b> <span className="text-muted-foreground">· +{money(unverified.partnerReported.amount)}</span><span className="block max-w-[340px] text-[13.5px] text-muted-foreground">{unverified.partnerReported.help}</span></span></label>
            <label className="flex cursor-pointer items-start gap-3 text-[15px]"><Switch checked={inferred} onCheckedChange={setInferred} /> <span><b className="text-foreground">{unverified.aiInferred.label}</b> <span className="text-muted-foreground">· +{money(unverified.aiInferred.amount)}</span><span className="block max-w-[340px] text-[13.5px] text-muted-foreground">{unverified.aiInferred.help}</span></span></label>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <Panel title="Sourced and influenced" sub="Verified revenue, by what partners did">
          <div className="flex h-4 overflow-hidden rounded-full">
            <span className="bg-primary" style={{ width: `${(e.sourced / e.rev.won) * 100}%` }} />
            <span className="bg-amber" style={{ width: `${(e.influenced / e.rev.won) * 100}%` }} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-[12px] bg-muted/60 px-4 py-3"><dt className="flex items-center gap-2 text-[14px] text-muted-foreground"><span className="size-2.5 rounded-full bg-primary" /> Sourced by partners</dt><dd className="text-[22px] font-bold text-foreground tabular">{money(e.sourced)}</dd></div>
            <div className="rounded-[12px] bg-muted/60 px-4 py-3"><dt className="flex items-center gap-2 text-[14px] text-muted-foreground"><span className="size-2.5 rounded-full bg-amber" /> Influenced</dt><dd className="text-[22px] font-bold text-foreground tabular">{money(e.influenced)}</dd></div>
          </dl>
          <p className="mt-3 text-[14px] text-muted-foreground">Sourced: the partner brought the deal. Influenced: Brightline sourced it and partners helped close or deliver it.</p>
        </Panel>
        <Panel title="By quarter" sub="Past quarters keep the model in force at the time">
          <QuarterBars rows={e.byQuarter} />
        </Panel>
        <Panel title="By program"><Bars rows={e.programs.map((p) => ({ label: `${p.program} program`, value: p.won }))} /></Panel>
        <Panel title="Top partners" sub="Verified revenue this year">
          <ul className="space-y-3">
            {e.rev.all.slice(0, 7).map((p) => (
              <li key={p.id} className="flex items-center gap-3">
                <PartnerAvatar name={p.name} size="sm" />
                <span className="min-w-0 flex-1"><b className="block truncate text-foreground">{p.name}</b><span className="text-[13.5px] text-muted-foreground">{p.tier} {p.program.toLowerCase()} · {p.region}</span></span>
                <b className="text-foreground tabular">{money(p.won)}</b>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title={<span className="flex flex-wrap items-center gap-2"><ShieldCheck className="size-5 text-primary" /> Attribution model in force: version 2 {e.model3?.status === "approved" ? <Badge className="border-0 bg-ok-soft text-ok">Version 3 from Jan 1, 2027</Badge> : e.model3?.status === "pending" ? <Badge className="border-0 bg-amber-soft text-amber-ink">Version 3 waiting for you</Badge> : null}</span>} sub={`${v2.name}. ${v2.note} Approved by ${v2.approvedBy}.`}>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {roles.map((r) => (
            <div key={r} className="rounded-[12px] bg-muted/60 px-3 py-2.5 text-center">
              <p className="text-[13px] text-muted-foreground">{r}</p>
              <p className="text-[19px] font-bold text-foreground tabular">{v2.weights![r]}</p>
              {e.model3?.status !== "declined" && modelProposal.weights[r] !== v2.weights![r] && <p className="text-[12.5px] font-semibold text-primary">v3: {modelProposal.weights[r]}</p>}
            </div>
          ))}
        </div>
        <p className="mt-3 text-[14px] text-muted-foreground">Each partner's share is its role weight divided by the total for the deal. Approved overrides stay as they are.</p>
      </Panel>
    </div>
  )
}

/** One board-ready slide: verified figures only (persona: "Share the board view"). */
export function BoardView() {
  const { dispatch } = useStore()
  const e = useExec()
  const share = async () => {
    try { await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#/v/board`) } catch { /* clipboard not allowed here */ }
    dispatch({ type: "shareBoard" })
    toast.success("Link copied", { description: "Opens a read-only board view with verified figures only. Directors sign in with Brightline SSO." })
  }
  const programs = e.programs.filter((p) => p.won > 0)
  const maxP = Math.max(...programs.map((p) => p.won))
  return (
    <div className="space-y-6">
      <PageHeader title="Board view" sub="One slide for the board. Verified figures only, matched to Salesforce closed-won." actions={<>
        <Button variant="outline" onClick={() => exportBoardView(e.rev.all)}><Download /> Download the figures</Button>
        <Button onClick={share}><Link2 /> Copy share link</Button>
      </>} />
      <section className="relative overflow-hidden rounded-[18px] bg-night p-6 text-white shadow-[0_12px_40px_#0b1b3540] sm:p-8 lg:aspect-[16/9]">
        <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative flex h-full flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold tracking-wide text-[#ffb359] uppercase">Brightline partner channel</p>
              <h2 className="mt-1 text-[24px] font-bold text-white sm:text-[28px]">2026 to date: {e.roi.toFixed(1)}x return on the program</h2>
            </div>
            <span className="rounded-full border border-white/20 px-3 py-1 text-[13px] text-[#cfe0f7]">Verified only · model v2</span>
          </div>
          <div className="grid gap-6 lg:flex-1 lg:grid-cols-[1.1fr_1fr_1fr]">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[14.5px] text-[#b9cbe4]">Verified partner revenue</p>
                <p className="text-[44px] leading-none font-bold tabular">{moneyShort(e.rev.won)}</p>
                <div className="mt-3 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-amber" style={{ width: `${e.pct}%` }} /></div>
                <p className="mt-1.5 text-[14px] text-[#cfe0f7]">{e.pct}% of the {moneyShort(budget.revenueTarget)} target</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[12px] bg-white/6 px-3 py-2.5"><p className="text-[13px] text-[#b9cbe4]">Program cost</p><p className="text-[20px] font-bold tabular">{moneyShort(budget.spent)}</p></div>
                <div className="rounded-[12px] bg-white/6 px-3 py-2.5"><p className="text-[13px] text-[#b9cbe4]">Share of revenue</p><p className="text-[20px] font-bold tabular">{Math.round(e.share * 100)}%</p></div>
              </div>
            </div>
            <div>
              <p className="mb-2 text-[14.5px] text-[#b9cbe4]">By quarter</p>
              <QuarterBars rows={e.byQuarter} light />
            </div>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-[14.5px] text-[#b9cbe4]">Top partners</p>
                <ul className="space-y-1.5">{e.rev.top.map((p) => <li key={p.id} className="flex justify-between gap-3 text-[14.5px]"><span className="truncate">{p.name}</span><b className="tabular">{moneyShort(p.won)}</b></li>)}</ul>
              </div>
              <div>
                <p className="mb-2 text-[14.5px] text-[#b9cbe4]">By program</p>
                <ul className="space-y-1.5">{programs.map((p) => <li key={p.program} className="text-[13.5px]"><span className="flex justify-between"><span>{p.program}</span><b className="tabular">{moneyShort(p.won)}</b></span><span className="mt-0.5 block h-1.5 rounded-full bg-white/10"><span className="block h-full rounded-full bg-[#3b8cf5]" style={{ width: `${(p.won / maxP) * 100}%` }} /></span></li>)}</ul>
              </div>
            </div>
          </div>
          <p className="text-[12.5px] text-[#9fb4d3]">Verified: matched to Salesforce closed-won. Partner-reported and AI-inferred credit are excluded. Attribution model version 2 (role-based) for all of 2026. Budget figures are examples.</p>
        </div>
      </section>
    </div>
  )
}
