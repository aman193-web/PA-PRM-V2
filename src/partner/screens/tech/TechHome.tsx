import { ArrowRight, Briefcase, CalendarClock, ClipboardCheck, GraduationCap, ListChecks, TrendingUp } from "lucide-react"
import { Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { date, money } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { ladder } from "@/partner/delivery"
import { usePartner } from "@/partner/usePartner"
import { TODAY, useDelivery } from "@/partner/useDelivery"
import { Kpi } from "@/partner/bits"
import { greeting, ManagerPanel, Recent, TodoPanel, type Todo } from "@/partner/screens/Home"

export function useTechTodos(): Todo[] {
  const t = useDelivery()
  const out: Todo[] = []
  for (const { t: task, v } of t.tasks.filter((x) => x.t.due <= "2026-11-03"))
    out.push({
      key: `${v.e.id}-${task.id}`, icon: <ClipboardCheck />, tone: task.due < TODAY ? "bad" : "amber",
      title: `${task.title} · ${v.e.account}`,
      body: v.canLog ? `On the joint plan with ${v.e.brightlineAe} (Brightline). Mark it done and it's logged as a touch.` : v.blockedWhy ?? "",
      cta: v.canLog ? "Log it" : "Open the deal", href: v.canLog ? `/p/log/${v.e.id}/${task.id}` : `/p/work/${v.e.id}`,
      tag: task.due < TODAY ? `Overdue · ${date(task.due)}` : `Due ${date(task.due)}`,
    })
  for (const k of t.examReady)
    out.push({ key: k.id, icon: <GraduationCap />, tone: "primary", title: `Take the ${k.product} certification exam`, body: k.needFor ?? k.next, cta: "Take the exam", href: "/p/skills", tag: "Skills" })
  return out
}

export function TechHome() {
  const { me, company } = usePartner()
  const t = useDelivery()
  const todos = useTechTodos()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] leading-tight font-bold sm:text-[32px]">{greeting()}, {me.first}.</h1>
        <p className="mt-1.5 text-[16.5px] text-muted-foreground">
          {todos.length ? `${todos.length} thing${todos.length > 1 ? "s" : ""} need you. ` : ""}Here's the revenue your delivery work has influenced for {company.name}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <div className="relative col-span-2 overflow-hidden rounded-[14px] bg-night p-6 text-white">
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative flex h-full flex-col">
            <p className="text-[15px] font-medium text-[#b9cbe4]">Influenced revenue, 2026</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
              <span className="text-[48px] leading-none font-bold tabular">{money(t.influenced)}</span>
              <span className="text-[15.5px] text-[#cfe0f7]">closed-won deals you delivered on, matched to Salesforce</span>
            </div>
            <p className="mt-3 text-[15px] text-[#cfe0f7]">{company.short}'s credit on them: <b className="text-white tabular">{money(t.creditWon)}</b> · other partners' shares stay private</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {t.skills.map((k) => <span key={k.id} className="rounded-full bg-white/10 px-2.5 py-1 text-[13px] text-[#dbe7f7]">{k.product} · <b className="text-white">{k.level}</b></span>)}
            </div>
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <Button size="lg" className="bg-white text-night hover:bg-white/90" onClick={() => go("/p/log")}><ClipboardCheck /> Log a milestone</Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => go("/p/influence")}>See your influence <ArrowRight /></Button>
            </div>
          </div>
        </div>
        <Kpi icon={<Briefcase />} label="Deals you work on" value={String(t.views.length)} sub={`${money(t.pipeline)} open pipeline you're delivering on`} href="/p/work" />
        <Kpi icon={<ListChecks />} label="Your tasks due this week" value={String(t.overdue.length + t.thisWeek.length)} sub={t.overdue.length ? `${t.overdue.length} overdue` : "On the joint plans"} href="/p/work" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <TodoPanel todos={todos} empty="Nothing needs you right now. Joint-plan tasks show here when they're due." />
        <div className="space-y-6">
          <Panel title="Your skills ladder" sub="Learned → Certified → Sell-Ready → Proven" action={<Button variant="ghost" onClick={() => go("/p/skills")}>Skills <ArrowRight /></Button>}>
            <ul className="space-y-3">
              {t.skills.map((k) => {
                const rank = ladder.indexOf(k.level)
                return (
                  <li key={k.id}>
                    <div className="flex items-baseline justify-between gap-3"><b className="text-foreground">{k.product}</b><span className="text-[14px] text-muted-foreground">{k.level}</span></div>
                    <div className="mt-1.5 grid grid-cols-4 gap-1">{ladder.map((l, i) => <span key={l} className={cn("h-2 rounded-full", i <= rank ? (rank === 3 ? "bg-ok" : "bg-primary") : "bg-muted")} />)}</div>
                  </li>
                )
              })}
            </ul>
          </Panel>
          <Recent />
          <ManagerPanel />
        </div>
      </div>

      <Panel title="Coming up on the joint plans" sub="Your tasks, across every deal you work on" action={<Button variant="ghost" onClick={() => go("/p/work")}>All deals <ArrowRight /></Button>} bodyClass="px-0 sm:px-0 pb-1 pt-1">
        {t.tasks.length ? (
          <ul>
            {t.tasks.map(({ t: task, v }) => (
              <li key={`${v.e.id}-${task.id}`} className="border-t first:border-t-0">
                <a href={`#/p/work/${v.e.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3.5 hover:bg-muted/50 sm:px-6">
                  <CalendarClock className={cn("size-5 shrink-0", task.due < TODAY ? "text-bad" : "text-muted-foreground")} />
                  <span className="min-w-0 flex-1"><b className="block text-foreground">{task.title}</b><span className="text-[14px] text-muted-foreground">{v.e.account} · {v.e.product}</span></span>
                  <Badge variant="secondary" className={cn(task.due < TODAY && "bg-bad-soft text-bad")}>{task.due < TODAY ? "Overdue" : "Due"} {date(task.due)}</Badge>
                </a>
              </li>
            ))}
          </ul>
        ) : <p className="flex items-center gap-2 px-6 pb-4 text-muted-foreground"><TrendingUp className="size-4" /> No open tasks.</p>}
      </Panel>
    </div>
  )
}
