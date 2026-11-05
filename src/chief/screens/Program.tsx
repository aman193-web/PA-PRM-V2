import { ArrowRight, Check, Cpu, History, Info, Layers, Pause, Play, ShieldAlert } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { EmptyState, PageHeader, PageTabs, Panel, PartnerAvatar } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { money, shortDate } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { agents, autonomyLevels, budget, programs, sharedRules, type ChangeRequest, type ProgramId, type RuleSet } from "@/chief/data"
import { useRevenue } from "@/chief/useChief"

const scopeLabel = (r: ChangeRequest) => (r.programs === "all" ? "All programs" : r.programs.map((p) => `${p} program`).join(", "))
const appliesTo = (r: ChangeRequest, p: ProgramId) => r.programs === "all" || r.programs.includes(p)

/** One program's rules as rows: its own settings first, then the rules every program shares. */
function ruleRows(r: RuleSet) {
  return [
    { label: "Auto-approve limit", value: r.autoApproveTop ? `${money(r.autoApproveTop)} for Gold and Platinum partners, ${money(r.autoApprove)} for the rest` : `${money(r.autoApprove)} for every partner`, ref: "R-REG-6", status: r.autoApproveTop ? "Approved by you" : "Proposed default" },
    {
      label: "Review deadline",
      value: r.reviewHours === r.bigDealHours ? `${r.reviewHours} business hours for every deal size (program setting)` : `${r.reviewHours} business hours up to ${money(r.bigDealOver)} · ${r.bigDealHours} above`,
      ref: "R-SLA-1 · R-SLA-6",
      status: r.reviewHours === r.bigDealHours ? "Program setting" : "Specified",
    },
    { label: "Protection window", value: `${r.protectionDays} days`, ref: "R-REG-10", status: "Proposed default" },
    { label: "Lead acceptance", value: `${r.leadHours} hours, then reassigned`, ref: "R-LD-2", status: "Stage 2" },
    ...sharedRules.map((x) => ({ ...x, shared: true })),
  ] as { label: string; value: string; ref: string; status: string; shared?: boolean }[]
}

function RulesTable({ r, live }: { r: RuleSet; live: boolean }) {
  return (
    <ul>
      {ruleRows(r).map((x) => (
        <li key={x.label} className="grid gap-x-4 gap-y-1 border-t px-5 py-3.5 sm:grid-cols-[200px_1fr_auto] sm:items-center sm:px-6">
          <b className="text-foreground">{x.label}</b>
          <span className="text-[15px] text-foreground">{x.value} <span className="font-mono text-[12.5px] whitespace-nowrap text-muted-foreground">{x.ref}</span>{x.shared && <span className="ml-2 text-[13px] text-muted-foreground">· same in every program</span>}</span>
          <Badge variant="outline" className={cn(x.status === "Approved by you" && "border-ok/50 text-ok", !live && "border-dashed")}>{live ? x.status : "Template"}</Badge>
        </li>
      ))}
    </ul>
  )
}

function Requests({ list }: { list: ChangeRequest[] }) {
  if (!list.length) return <p className="text-muted-foreground">Nothing waiting.</p>
  return (
    <ul className="space-y-3">
      {list.map((r) => (
        <li key={r.id} className="rounded-[12px] border p-4">
          <div className="flex flex-wrap gap-2"><Badge variant="secondary">{r.kind === "rule" ? "Rule change" : "AI autonomy"}</Badge><Badge variant="outline">{scopeLabel(r)}</Badge></div>
          <p className="mt-2 font-semibold text-foreground">{r.title}</p>
          <p className="text-[14px] text-muted-foreground">From {r.from} ({r.fromRole})</p>
          <Button size="sm" className="mt-3" onClick={() => go(`/c/approval/req-${r.id}`)}>Review <ArrowRight /></Button>
        </li>
      ))}
    </ul>
  )
}

function Agents() {
  const { state, dispatch } = useStore()
  return (
    <Panel title={<span className="flex items-center gap-2"><Cpu className="size-5 text-primary" /> AI agent autonomy</span>} sub="Agents work across every program. A0 observes … A4 acts alone within limits. Every action is logged and can be reversed.">
      <ul className="grid gap-4 lg:grid-cols-2">
        {agents.map((a) => {
          const level = state.agentLevels[a.id]
          const idx = autonomyLevels.findIndex((l) => l.id === level)
          const paused = state.pausedAgents.includes(a.id)
          return (
            <li key={a.id} className={cn("rounded-[12px] border p-4", paused && "border-amber/60 bg-amber-soft/30")}>
              <div className="flex items-start justify-between gap-3">
                <span><b className="flex items-center gap-2 text-foreground">{a.name}
                  <Tooltip>
                    <TooltipTrigger asChild><button type="button" className="text-muted-foreground hover:text-primary" aria-label={`What the ${a.name} does`}><Info className="size-4" /></button></TooltipTrigger>
                    <TooltipContent className="max-w-[300px] text-[13.5px] leading-snug">
                      <div className="block">
                        <p className="font-semibold">{a.name}</p>
                        <p className="mt-1">{a.does}</p>
                        <p className="mt-2"><span className="font-semibold">Now ({level} · {autonomyLevels[idx]?.label}):</span> {a.at[level as keyof typeof a.at]}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                  {paused && <Badge className="border-0 bg-amber-soft text-amber-ink">Paused</Badge>}</b><span className="text-[14px] text-muted-foreground">{a.job}</span></span>
                <Button size="sm" variant={paused ? "default" : "ghost"} onClick={() => {
                  dispatch({ type: "toggleAgent", id: a.id })
                  toast(paused ? `${a.name} resumed` : `${a.name} paused`, { description: paused ? "It picks up from where it stopped." : "It stops acting now. Partner managers take over its work until you resume it." })
                }}>{paused ? <><Play /> Resume</> : <><Pause /> Pause</>}</Button>
              </div>
              <ol className={cn("mt-3 grid grid-cols-5 gap-1", paused && "opacity-50")}>
                {autonomyLevels.map((l, i) => (
                  <li key={l.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label={`${l.id} ${l.label}`} className={cn("w-full cursor-help rounded-[8px] px-1 py-1.5 text-center text-[12.5px] font-semibold", i === idx ? "bg-primary text-primary-foreground" : i < idx ? "bg-brand-soft text-primary" : "bg-muted text-muted-foreground")}>{l.id}</button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[280px] text-[13.5px] leading-snug">
                        <div className="block">
                          <p className="font-semibold">{l.id} · {l.label}{i === idx ? " (current)" : ""}</p>
                          <p className="mt-1">{l.means}</p>
                          <p className="mt-2"><span className="font-semibold">For this agent:</span> {a.at[l.id]}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </li>
                ))}
              </ol>
              <p className="mt-2 flex items-center gap-1.5 text-[14px] text-foreground"><Check className="size-4 text-ok" /> {paused ? "Paused · was " : ""}{autonomyLevels[idx]?.label}</p>
            </li>
          )
        })}
      </ul>
      <p className="mt-4 flex gap-2 rounded-[12px] bg-amber-soft/60 px-4 py-3 text-[15px] text-foreground"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-ink" /> Always a person, at any level: money, contracts, access, data export, tier demotion and partner termination (R-AG-2).</p>
    </Panel>
  )
}

function Overview() {
  const { state } = useStore()
  const rev = useRevenue()
  const roi = rev.won / budget.spent
  const pending = state.requests.filter((r) => r.status === "pending")
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Panel title="Are the programs worth it?" sub={`All programs, ${budget.year} to date`}>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
            <div><p className="text-[14.5px] text-muted-foreground">Verified partner revenue</p><p className="text-[34px] leading-tight font-bold text-foreground tabular">{money(rev.won)}</p></div>
            <div><p className="text-[14.5px] text-muted-foreground">Program cost</p><p className="text-[34px] leading-tight font-bold text-foreground tabular">{money(budget.spent)}</p></div>
            <div><p className="text-[14.5px] text-muted-foreground">Return</p><p className="text-[34px] leading-tight font-bold text-ok tabular">{roi.toFixed(1)}x</p></div>
          </div>
          <div className="mt-5">
            <div className="flex justify-between text-[14.5px] text-muted-foreground"><span>Budget used</span><span className="tabular">{money(budget.spent)} of {money(budget.annual)}</span></div>
            <div className="mt-1.5 h-2.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(budget.spent / budget.annual) * 100}%` }} /></div>
          </div>
          <ul className="mt-5 divide-y">{budget.lines.map((l) => <li key={l.label} className="flex justify-between py-2.5 text-[15px] first:pt-0 last:pb-0"><span className="text-foreground">{l.label}</span><b className="text-foreground tabular">{money(l.amount)}</b></li>)}</ul>
        </Panel>
        <Panel title="Changes waiting for you" sub="Each one says which programs it changes"><Requests list={pending} /></Panel>
      </div>

      <Panel title="Programs" sub="Each program is a partner track with its own rules. RevOps sets them up from a template; you approve." bodyClass="px-0 sm:px-0 pb-1">
        <div className="hidden gap-x-4 border-y bg-surface-2/60 px-6 py-3 text-[14px] font-medium text-muted-foreground md:grid md:grid-cols-[minmax(0,1.6fr)_90px_130px_150px_80px_90px_20px]">
          <span>Program</span><span className="text-right">Partners</span><span className="text-right">Verified 2026</span><span>Budget used</span><span className="text-right">Return</span><span>Rules</span><span />
        </div>
        <ul>
          {programs.map((p) => {
            const members = rev.all.filter((x) => x.program === p.id)
            const won = members.reduce((n, x) => n + x.won, 0)
            const rules = state.programRules[p.id]
            return (
              <li key={p.id} className="border-b last:border-0">
                <a href={`#/c/program/${p.id}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-4 hover:bg-muted/50 sm:px-6 md:grid-cols-[minmax(0,1.6fr)_90px_130px_150px_80px_90px_20px]">
                  <span className="min-w-0"><b className="block text-foreground">{p.id} program</b><span className="block truncate text-[14px] text-muted-foreground">{p.what}</span></span>
                  <span className="text-right text-foreground tabular">{p.live ? members.length : "—"}</span>
                  <span className="hidden text-right font-semibold text-foreground tabular md:block">{p.live ? money(won) : "—"}</span>
                  <span className="hidden md:block">{p.live ? <><span className="block h-2 rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${(p.spent / p.budget) * 100}%` }} /></span><span className="text-[13px] text-muted-foreground tabular">{money(p.spent)} of {money(p.budget)}</span></> : <span className="text-muted-foreground">—</span>}</span>
                  <span className="hidden text-right font-semibold text-ok tabular md:block">{p.live && p.spent ? `${(won / p.spent).toFixed(1)}x` : "—"}</span>
                  <span className="hidden md:block">{p.live ? <Badge variant="secondary">v{rules.version}</Badge> : <Badge variant="outline" className="border-dashed">Not launched</Badge>}</span>
                  <ArrowRight className="hidden size-4 text-muted-foreground md:block" />
                </a>
              </li>
            )
          })}
        </ul>
      </Panel>

      <Agents />
    </div>
  )
}

function ProgramView({ id }: { id: ProgramId }) {
  const { state } = useStore()
  const rev = useRevenue()
  const p = programs.find((x) => x.id === id)!
  const rules = state.programRules[id]
  const members = rev.all.filter((x) => x.program === id)
  const won = members.reduce((n, x) => n + x.won, 0)
  const managers = [...new Set(members.map((x) => x.manager))].filter((m) => m !== "Not assigned")
  const pending = state.requests.filter((r) => r.status === "pending" && appliesTo(r, id))

  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-wrap items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-[12px] bg-brand-soft text-primary"><Layers className="size-6" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="flex flex-wrap items-center gap-2 text-[20px] font-bold">{p.id} program {p.live ? <Badge className="border-0 bg-ok-soft text-ok">Live</Badge> : <Badge variant="outline" className="border-dashed">Not launched</Badge>}</h2>
            <p className="text-[15.5px] text-muted-foreground">{p.what}</p>
            {p.live && <p className="mt-1 text-[14.5px] text-muted-foreground">Looked after by {managers.join(", ") || "nobody yet"}. Rules apply to every partner in the program, whoever looks after them.</p>}
          </div>
        </div>
        {p.live && (
          <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Partners", String(members.length)],
              ["Verified 2026", money(won)],
              ["Budget used", `${money(p.spent)} of ${money(p.budget)}`],
              ["Return", p.spent ? `${(won / p.spent).toFixed(1)}x` : "—"],
            ].map(([k, v]) => <div key={k} className="rounded-[12px] bg-muted/60 px-4 py-3"><dt className="text-[13.5px] text-muted-foreground">{k}</dt><dd className="text-[19px] font-bold text-foreground tabular">{v}</dd></div>)}
          </dl>
        )}
      </Panel>

      {!p.live && (
        <Panel><EmptyState icon={<Layers className="size-6" />} title="Not launched yet" body="RevOps can create it from the Marketplace template. You approve its rules before any partner can join. Below are the template's starting rules." /></Panel>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title={`Rules in force · version ${rules.version}`} sub={p.live ? "Changes need your approval and create a new version; nothing is edited in place." : "Template rules, not in force"} bodyClass="px-0 sm:px-0 pb-1">
          <RulesTable r={rules} live={p.live} />
        </Panel>
        <div className="space-y-6">
          <Panel title="Changes waiting for this program"><Requests list={pending} /></Panel>
          <Panel title={<span className="flex items-center gap-2"><History className="size-5 text-primary" /> Rule history</span>}>
            <ul className="space-y-3">
              {rules.history.map((h) => (
                <li key={h.version} className="flex gap-3">
                  <Badge variant="secondary" className="shrink-0">v{h.version}</Badge>
                  <span className="min-w-0 text-[14.5px]"><span className="block text-foreground">{h.note}</span><span className="text-muted-foreground">{h.by} · {shortDate(h.at)}</span></span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      {p.live && (
        <Panel title="Partners in this program" bodyClass="px-0 sm:px-0 pb-1">
          <ul>
            {members.map((m) => (
              <li key={m.id} className="border-t">
                <a href={`#/c/partners/${m.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 sm:px-6">
                  <PartnerAvatar name={m.name} size="sm" />
                  <span className="min-w-0 flex-1"><b className="block truncate text-foreground">{m.name}</b><span className="text-[13.5px] text-muted-foreground">{m.tier} · {m.manager}</span></span>
                  <b className="text-foreground tabular">{money(m.won)}</b>
                </a>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  )
}

export function ChiefProgram({ id }: { id?: string }) {
  const { state } = useStore()
  const rev = useRevenue()
  const current = programs.find((p) => p.id === id)?.id
  // Tab badges count only changes aimed at that program; all-program AI changes show on "All programs".
  const waiting = (p: ProgramId) => state.requests.filter((r) => r.status === "pending" && r.programs !== "all" && r.programs.includes(p)).length
  return (
    <div>
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">Programs and rules <Badge variant="outline" className="border-dashed text-muted-foreground">Example budget figures</Badge></span>}
        sub="Each program is a partner track with its own rules. Defend the budget, approve rule changes per program, and decide how much the AI agents may do."
      />
      <PageTabs
        label="Programs"
        value={current ?? "all"}
        onChange={(v) => go(v === "all" ? "/c/program" : `/c/program/${v}`)}
        items={[
          { value: "all", label: "All programs", count: state.requests.filter((r) => r.status === "pending").length, tone: "action" },
          ...programs.map((p) => ({ value: p.id, label: p.id, count: waiting(p.id) || (p.live ? rev.all.filter((x) => x.program === p.id).length : 0), tone: (waiting(p.id) ? "action" : "neutral") as "action" | "neutral" })),
        ]}
      />
      {current ? <ProgramView id={current} /> : <Overview />}
    </div>
  )
}
