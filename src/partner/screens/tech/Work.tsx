import { CheckCircle2, ChevronRight, ClipboardCheck, Clock3, Hourglass, Lock, Plus } from "lucide-react"
import { EmptyState, PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { date, money } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { usePartner } from "@/partner/usePartner"
import { TODAY, useDelivery, type EngagementView } from "@/partner/useDelivery"
import { ShareBar, StageTag } from "@/partner/bits"

export function StageBadge({ v }: { v: EngagementView }) {
  const cls = v.won ? "bg-ok text-white" : v.canLog ? "bg-brand-soft text-primary" : "bg-amber-soft text-amber-ink"
  return <Badge className={cn("border-0", cls)}>{v.stage}</Badge>
}

export function Work() {
  const { company } = usePartner()
  const t = useDelivery()
  return (
    <div>
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">Deals you work on <StageTag /></span>}
        sub={`${company.name} deals where you're on the delivery team. Other ${company.short} deals stay with the people who run them.`}
        actions={<Button size="lg" onClick={() => go("/p/log")}><Plus /> Log a milestone</Button>}
      />
      <Panel bodyClass="p-0 sm:p-0">
        {t.views.length === 0 ? <EmptyState title="No deals yet" body="Hannah Cho adds you when a deal needs you." /> : (
          <ul>
            <li aria-hidden className="hidden gap-x-4 border-b bg-surface-2/60 px-6 py-3 text-[14px] font-medium text-muted-foreground md:grid md:grid-cols-[minmax(0,1.5fr)_110px_minmax(0,1fr)_minmax(0,1.3fr)_20px]">
              <span>Deal</span><span className="text-right">Value</span><span>Stage</span><span>Your next task</span><span />
            </li>
            {t.views.map((v) => {
              const next = v.myOpenTasks[0]
              return (
                <li key={v.e.id} className="border-b last:border-0">
                  <a href={`#/p/work/${v.e.id}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 px-5 py-4 hover:bg-muted/50 sm:px-6 md:grid-cols-[minmax(0,1.5fr)_110px_minmax(0,1fr)_minmax(0,1.3fr)_20px]">
                    <span className="min-w-0"><b className="block truncate text-[16px] text-foreground">{v.e.account}</b><span className="block truncate text-[14px] text-muted-foreground">{v.e.product} · {v.e.myRole}</span></span>
                    <span className="text-right text-[16px] font-semibold text-foreground tabular">{money(v.e.value)}</span>
                    <span className="col-span-2 md:col-span-1"><StageBadge v={v} /></span>
                    <span className={cn("col-span-2 text-[14.5px] font-medium md:col-span-1", next ? (next.due < TODAY ? "text-bad" : "text-foreground") : "text-muted-foreground")}>
                      {next ? `${next.title} · ${next.due < TODAY ? "overdue" : "due"} ${date(next.due)}` : "Nothing open for you"}
                    </span>
                    <ChevronRight className="hidden size-5 text-muted-foreground md:block" />
                  </a>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
      <p className="mt-4 text-[14px] text-muted-foreground">Joint plans are shared with Brightline's account executive on each deal. Co-sell plans arrive in Stage 2.</p>
    </div>
  )
}

export function Engagement({ id }: { id?: string }) {
  const { me, company } = usePartner()
  const t = useDelivery()
  const v = t.views.find((x) => x.e.id === id)
  if (!v) return (
    <div>
      <PageHeader title="Deal" back={{ label: "Deals you work on", href: "/p/work" }} />
      <Panel><EmptyState icon={<Lock className="size-6" />} title="You're not on this deal" body={`You see only the ${company.short} deals you work on.`} /></Panel>
    </div>
  )
  const { e } = v
  return (
    <div>
      <PageHeader
        back={{ label: "Deals you work on", href: "/p/work" }}
        title={<span className="flex flex-wrap items-center gap-3">{e.account} <StageBadge v={v} /></span>}
        sub={<>{e.product} · {money(e.value)} · you're the {e.myRole.toLowerCase()} · Brightline AE {e.brightlineAe}</>}
        actions={v.canLog ? <Button size="lg" onClick={() => go(`/p/log/${e.id}`)}><ClipboardCheck /> Log a milestone</Button> : undefined}
      />
      {v.blockedWhy && <p className="mb-6 flex gap-2.5 rounded-[12px] bg-amber-soft/60 px-4 py-3 text-[15px] text-foreground"><Hourglass className="mt-0.5 size-5 shrink-0 text-amber-ink" />{v.blockedWhy}</p>}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title="Joint plan" sub="Owners and dates agreed with Brightline and the customer">
            <ul className="space-y-2.5">
              {e.tasks.map((task) => {
                const mine = task.owner === me.name && task.status === "open"
                return (
                  <li key={task.id} className={cn("flex flex-wrap items-center gap-3 rounded-[12px] border p-3.5", mine && task.due < TODAY && "border-bad/40")}>
                    <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", task.status === "done" ? "bg-ok-soft text-ok" : "bg-muted text-muted-foreground")}>{task.status === "done" ? <CheckCircle2 className="size-4.5" /> : <Clock3 className="size-4.5" />}</span>
                    <span className="min-w-0 flex-1">
                      <b className="block text-[15.5px] text-foreground">{task.title}</b>
                      <span className="text-[14px] text-muted-foreground">{task.owner} · {task.side} · {task.status === "done" ? `done ${date(task.doneAt!)}` : `${task.due < TODAY ? "overdue since" : "due"} ${date(task.due)}`}</span>
                    </span>
                    {mine && v.canLog && <Button size="sm" onClick={() => go(`/p/log/${e.id}/${task.id}`)}>Done · log it</Button>}
                  </li>
                )
              })}
            </ul>
          </Panel>
          <Panel title="Delivery recorded on the deal" sub={`${company.short}'s touches on the Salesforce opportunity. Touches are permanent evidence: nobody can edit them.`}>
            {v.teamTouches.length ? (
              <ol className="relative space-y-4 border-l pl-5">
                {[...v.teamTouches].reverse().map((tc) => (
                  <li key={tc.id} className="relative">
                    <span className={cn("absolute top-1.5 -left-[25px] size-2.5 rounded-full", tc.by === me.name ? "bg-primary" : "bg-border-strong")} />
                    <p className="text-[15.5px] text-foreground"><b>{tc.kind}</b> · {tc.text}</p>
                    <p className="text-[13.5px] text-muted-foreground">{date(tc.at)} · {tc.by === me.name ? "you" : tc.by ?? company.short}</p>
                  </li>
                ))}
              </ol>
            ) : <p className="text-muted-foreground">Nothing recorded yet.</p>}
            {v.others > 0 && <p className="mt-4 flex items-center gap-2 text-[14px] text-muted-foreground"><Lock className="size-3.5" /> {v.others} other partner{v.others > 1 ? "s" : ""} on this deal · their touches and shares are private</p>}
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title={`${company.short}'s credit`} sub={v.won ? "Verified: matched to Salesforce closed-won" : "On an open deal: verified when it closes won"}>
            {v.line ? (
              <>
                <p className="text-[32px] leading-none font-bold text-foreground tabular">{money(v.credited)}</p>
                <p className="mt-1 mb-4 text-[14.5px] text-muted-foreground">{v.line.share}% of {money(e.value)} as {v.line.role}</p>
                <ShareBar c={{ share: v.line.share, others: v.others, role: v.line.role }} />
              </>
            ) : <p className="text-muted-foreground">Credit is set when Brightline approves the registration.</p>}
            <p className="mt-4 text-[14px] text-muted-foreground">Your milestones are evidence the attribution agent uses. Think the split is wrong? Ask Jordan Lee (disputes arrive in Stage 2).</p>
          </Panel>
          <Panel title="Your part">
            <dl className="grid gap-3 text-[15px]">
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Your milestones logged</dt><dd className="font-semibold text-foreground tabular">{v.myTouches.length}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Your open tasks</dt><dd className="font-semibold text-foreground tabular">{v.myOpenTasks.length}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Phase</dt><dd className="font-semibold text-foreground">{e.phase}</dd></div>
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  )
}
