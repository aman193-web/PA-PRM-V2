import { Award, Check, CircleDollarSign, FileCheck2, FileWarning, Lock, Upload } from "lucide-react"
import { toast } from "sonner"
import { PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { money } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { benefitsNow, company, mdf, nextTier, tierLadder } from "@/partner/data"
import { StageTag } from "@/partner/bits"

export function Program() {
  const { state, dispatch } = useStore()
  const at = tierLadder.indexOf(company.tier as (typeof tierLadder)[number])
  const certified = state.team.filter((m) => m.certified && m.status === "active").length
  const reqs = nextTier.requirements.map((r) => (r.label === "Certified sales reps" ? { ...r, have: certified } : r))
  const met = reqs.filter((r) => r.have >= r.need).length

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">Program <Badge variant="outline" className="border-dashed text-muted-foreground">Example program terms</Badge></span>}
        sub={`${company.name} is a ${company.tier} ${company.program.toLowerCase()} partner. Only verified outcomes count toward the next tier: won deals and certifications, not logins or downloads.`}
      />

      <Panel>
        <ol className="grid grid-cols-4 gap-2" aria-label="Tiers">
          {tierLadder.map((t, i) => (
            <li key={t} className={cn("rounded-[12px] border-2 px-3 py-3 text-center", i === at ? "border-amber bg-amber-soft/50" : i < at ? "border-transparent bg-muted/60" : "border-dashed")}>
              <Award className={cn("mx-auto size-6", i === at ? "text-amber-ink" : i < at ? "text-ok" : "text-muted-foreground")} />
              <b className={cn("mt-1 block text-[15.5px]", i > at ? "text-muted-foreground" : "text-foreground")}>{t}</b>
              <span className="text-[13px] text-muted-foreground">{i === at ? "You are here" : i < at ? "Reached" : "Next"}</span>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Panel title={`What it takes to reach ${nextTier.name}`} sub={`${met} of ${reqs.length} requirements met`}>
          <ul className="space-y-5">
            {reqs.map((r) => {
              const pct = Math.min(100, Math.round((r.have / r.need) * 100))
              const done = r.have >= r.need
              return (
                <li key={r.label}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="flex items-center gap-2 text-[15.5px] font-medium text-foreground">{done && <Check className="size-4 text-ok" />}{r.label}</span>
                    <span className="text-[15px] text-muted-foreground tabular">
                      <b className="text-foreground">{r.money ? money(r.have) : r.have}</b> of {r.money ? money(r.need) : r.need}{r.unit ? ` ${r.unit}` : ""}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", done ? "bg-ok" : "bg-amber")} style={{ width: `${Math.max(pct, 3)}%` }} /></div>
                </li>
              )
            })}
          </ul>
          <p className="mt-5 rounded-[12px] bg-brand-soft/50 px-4 py-3 text-[15px] text-foreground">Quickest win: two more reps through the Platform sales certification. Marcus is 42% through it.</p>
        </Panel>
        <Panel title={`${nextTier.name} unlocks`}>
          <ul className="space-y-3">
            {nextTier.unlocks.map((u) => <li key={u} className="flex gap-3 text-[15.5px] text-foreground"><Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />{u}</li>)}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title={`Your ${company.tier} benefits`}>
          <ul className="divide-y">
            {benefitsNow.map((b) => (
              <li key={b.name} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <span className="min-w-0"><b className="block text-[15.5px] text-foreground">{b.name}</b><span className="text-[14px] text-muted-foreground">{b.detail}</span></span>
                {b.inUse ? <Badge className="border-0 bg-ok-soft text-ok">In use</Badge> : <Badge variant="secondary">Not used yet</Badge>}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Agreements and compliance" sub="Keep these current to stay eligible to register deals">
          <ul className="divide-y">
            {state.agreements.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-[10px]", g.status === "expiring" ? "bg-amber-soft text-amber-ink" : "bg-ok-soft text-ok")}>{g.status === "expiring" ? <FileWarning className="size-5" /> : <FileCheck2 className="size-5" />}</span>
                <span className="min-w-0 flex-1"><b className="block text-[15.5px] text-foreground">{g.name}</b><span className="text-[14px] text-muted-foreground">{g.detail}</span></span>
                {g.status === "expiring" && <Button size="sm" onClick={() => { dispatch({ type: "uploadAgreement", id: g.id }); toast.success("Certificate uploaded", { description: "Jordan Lee is notified. You stay eligible to register deals." }) }}><Upload /> Upload</Button>}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title={<span className="flex flex-wrap items-center gap-3">Marketing development funds <StageTag /></span>} sub="Request funds for campaigns with Brightline. Requests and claims arrive in Stage 2.">
        <div className="flex flex-wrap items-center gap-6">
          <span className="grid size-12 place-items-center rounded-[12px] bg-brand-soft text-primary"><CircleDollarSign className="size-6" /></span>
          <div><p className="text-[14.5px] text-muted-foreground">Available this year</p><p className="text-[28px] font-bold text-foreground tabular">{money(mdf.available)}</p></div>
          <div className="min-w-52 flex-1">
            <div className="flex justify-between text-[14px] text-muted-foreground"><span>{money(mdf.used)} used</span><span>{money(mdf.yearly)} a year</span></div>
            <div className="mt-1.5 h-2.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(mdf.used / mdf.yearly) * 100}%` }} /></div>
          </div>
          <Button variant="outline" disabled>Request funds</Button>
        </div>
      </Panel>
    </div>
  )
}
