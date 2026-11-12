import type { ReactNode } from "react"
import { ArrowRight, Award, Briefcase, CircleHelp, Clock3, FileWarning, Handshake, Inbox, Mail, MessageSquareText, Phone, Plus, ShieldCheck, Sparkles, TrendingUp } from "lucide-react"
import { Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ago, hoursLeft, money } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { company, nextTier, partnerManager } from "@/partner/data"
import { ruleLimit, type ProgramId } from "@/chief/data"
import { daysUntil, leadLeft, usePartner, usePartnerData, usePartnerFeed } from "@/partner/usePartner"
import { usePartnerAssistant } from "@/partner/Assistant"
import { CompactDeals, DealRows, Kpi } from "@/partner/bits"
import { useCoSellInbox } from "@/partner/screens/Leads"
import { sellerAccounts } from "@/vendor/data"

export interface Todo { key: string; icon: ReactNode; tone: "bad" | "amber" | "primary"; title: string; body: string; cta: string; href: string; tag: string }

function useTodos(): Todo[] {
  const { state } = useStore()
  const { isExec } = usePartner()
  const d = usePartnerData()
  const cosell = useCoSellInbox()
  const out: Todo[] = []
  for (const r of d.needsReply)
    out.push({ key: r.id, icon: <CircleHelp />, tone: "bad", title: `Answer Jordan's question on ${r.customer}`, body: `"${r.infoRequest?.asked}"${isExec ? ` · ${r.rep}'s deal` : ""}`, cta: "Answer", href: `/p/deal/${r.id}`, tag: "Review paused" })
  for (const l of d.offers)
    out.push({ key: l.id, icon: <Inbox />, tone: "amber", title: `${isExec ? "Assign" : "Accept"} the ${l.company} lead`, body: `${l.industry} · ${l.region} · about ${money(l.estValue)}. ${isExec ? "Pick a rep or decline." : "Sent to you by name."}`, cta: "Review lead", href: "/p/leads", tag: `${hoursLeft(leadLeft(l)).replace(" left", "")} to accept` })
  for (const c of cosell.waiting) {
    const a = sellerAccounts.find((x) => x.id === c.accountId)!
    out.push({ key: c.id, icon: <Handshake />, tone: "amber", title: `${c.from} wants to co-sell a ${a.industry.toLowerCase()} deal`, body: `${a.product} · about ${money(a.value)} · as ${c.role} partner. The account unlocks when you accept.`, cta: "Review", href: "/p/leads/cosell", tag: "Co-sell" })
  }
  for (const r of d.expiring)
    out.push({ key: `x${r.id}`, icon: <Clock3 />, tone: "amber", title: `${r.customer} protection ends in ${daysUntil(r.protectedUntil!)} days`, body: `${r.crmStage ?? "Open"} in Brightline's CRM${isExec ? ` · ${r.rep}` : ""}. Ask for more time if it's still moving.`, cta: "Ask for time", href: `/p/deal/${r.id}`, tag: "Protection" })
  if (isExec)
    for (const g of state.agreements.filter((x) => x.status === "expiring"))
      out.push({ key: g.id, icon: <FileWarning />, tone: "primary", title: `${g.name} expires Nov 30`, body: "Upload the renewed certificate to stay eligible to register deals.", cta: "Upload", href: "/p/program", tag: "Compliance" })
  return out
}

const toneTile = { bad: "bg-bad-soft text-bad", amber: "bg-amber-soft text-amber-ink", primary: "bg-brand-soft text-primary" }

function NeedsYou() {
  return <TodoPanel todos={useTodos()} empty="Nothing needs you right now. We'll notify you when Jordan replies or a lead arrives." />
}

/** The "Needs you" list every partner home uses: one card per thing to do, most urgent first. */
export function TodoPanel({ todos, empty }: { todos: Todo[]; empty: string }) {
  return (
    <Panel title="Needs you" sub={todos.length ? "Most urgent first." : undefined}>
      {todos.length === 0 ? (
        <p className="text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {todos.map((t) => (
            <li key={t.key} className="flex items-start gap-3 rounded-[12px] border p-4">
              <span className={cn("grid size-10 shrink-0 place-items-center rounded-[10px] [&_svg]:size-5", toneTile[t.tone])}>{t.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{t.title}</p>
                <p className="mt-0.5 text-[14.5px] text-muted-foreground">{t.body}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={() => go(t.href)}>{t.cta} <ArrowRight /></Button>
                  <Badge variant="secondary" className="ml-auto">{t.tag}</Badge>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export function Recent() {
  const items = usePartnerFeed()
  return (
    <Panel title="Recent">
      <ul className="space-y-3">
        {items.slice(0, 6).map((a) => (
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
  )
}

export function ManagerPanel() {
  return (
    <Panel title="Your partner manager" className="lg:hidden">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-night text-[14px] font-bold text-white">{partnerManager.initials}</span>
        <div className="min-w-0 flex-1 leading-tight">
          <b className="block text-[16px] text-foreground">{partnerManager.name}</b>
          <span className="text-[14px] text-muted-foreground">Brightline · replies within 1 business day</span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="outline" asChild><a href={`tel:${partnerManager.phone.replace(/\s/g, "")}`}><Phone /> Call</a></Button>
        <Button variant="outline" asChild><a href={`mailto:${partnerManager.email}`}><Mail /> Email</a></Button>
      </div>
    </Panel>
  )
}

export function greeting() {
  return "Good afternoon"
}

function RepHome() {
  const { me } = usePartner()
  const { state } = useStore()
  const limit = ruleLimit(state.programRules[company.program as ProgramId], company.tier)
  const d = usePartnerData()
  const { ask } = usePartnerAssistant()
  const todos = useTodos()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] leading-tight font-bold sm:text-[32px]">{greeting()}, {me.first}.</h1>
        <p className="mt-1.5 text-[16.5px] text-muted-foreground">
          {todos.length ? <>{todos.length} thing{todos.length > 1 ? "s" : ""} need you today. Everything else is moving.</> : "Nothing needs you. Register your next deal in three taps."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <div className="relative col-span-2 overflow-hidden rounded-[14px] bg-night p-6 text-white">
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative flex h-full flex-col">
            <p className="text-[15px] font-medium text-[#b9cbe4]">Register a deal</p>
            <p className="mt-1 max-w-[30ch] text-[22px] leading-snug font-bold">Describe it or paste the customer's email. We'll fill in the rest.</p>
            <p className="mt-2 text-[14.5px] text-[#cfe0f7]">Clean deals up to {money(limit)} are approved in about a minute.</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <Button size="lg" className="bg-white text-night hover:bg-white/90" onClick={() => go("/p/register")}><Plus /> Register a deal</Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => ask("What needs me today?")}><Sparkles /> Ask</Button>
            </div>
          </div>
        </div>
        <Kpi icon={<ShieldCheck />} label="Value created this week" value={money(d.weekValue)} sub={`${d.thisWeek.length} deal${d.thisWeek.length === 1 ? "" : "s"} approved and protected`} href="/p/credit" />
        <Kpi icon={<TrendingUp />} label="Verified credit this year" value={money(d.verifiedTotal)} sub="From won deals, matched to Salesforce" href="/p/credit" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <NeedsYou />
        <div className="space-y-6">
          <Panel title="With Jordan for review" sub="You'll be notified the moment it's decided." action={<Button variant="ghost" onClick={() => go("/p/deals/review")}>All <ArrowRight /></Button>} bodyClass="px-0 sm:px-0 pb-1 pt-1">
            <CompactDeals rows={d.inReview} empty={<p className="px-6 pb-4 text-muted-foreground">Nothing in review.</p>} />
          </Panel>
          <Recent />
          <ManagerPanel />
        </div>
      </div>
    </div>
  )
}

function ExecHome() {
  const { me } = usePartner()
  const d = usePartnerData()
  const { state } = useStore()
  const rev = nextTier.requirements[0]
  const pct = Math.round((rev.have / rev.need) * 100)
  const open = d.deals.filter((r) => ["approved", "under_review", "info_requested"].includes(r.state))
  const reps = state.team.filter((m) => m.role === "Partner sales rep" && m.status === "active")
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] leading-tight font-bold sm:text-[32px]">{greeting()}, {me.first}.</h1>
        <p className="mt-1.5 text-[16.5px] text-muted-foreground">Here's what the Brightline program is worth to {company.name} this year.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <div className="relative col-span-2 overflow-hidden rounded-[14px] bg-night p-6 text-white">
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative flex h-full flex-col">
            <p className="text-[15px] font-medium text-[#b9cbe4]">Verified revenue with Brightline, 2026</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
              <span className="text-[48px] leading-none font-bold tabular">{money(d.verifiedTotal)}</span>
              <span className="text-[15.5px] text-[#cfe0f7]">matched to Salesforce closed-won</span>
            </div>
            <div className="mt-5">
              <div className="flex justify-between text-[14.5px] text-[#cfe0f7]"><span>{company.tier} → {nextTier.name} revenue goal</span><span className="tabular">{pct}% of {money(rev.need)}</span></div>
              <div className="mt-1.5 h-2.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-amber" style={{ width: `${pct}%` }} /></div>
            </div>
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <Button size="lg" className="bg-white text-night hover:bg-white/90" onClick={() => go("/p/credit")}>See revenue <ArrowRight /></Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => go("/p/program")}><Award /> What unlocks {nextTier.name}</Button>
            </div>
          </div>
        </div>
        <Kpi icon={<Briefcase />} label="Open pipeline" value={money(open.reduce((n, r) => n + r.value, 0))} sub={`${open.length} Ridgeway deals · ${money(d.pipelineTotal)} your credit`} href="/p/deals" />
        <Kpi icon={<Inbox />} label="Leads to assign" value={String(d.offers.length)} sub="From Brightline · 48 h to accept" href="/p/leads" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <NeedsYou />
        <div className="space-y-6">
          <Panel title="Your team" sub="Open deals and won revenue this year" action={<Button variant="ghost" onClick={() => go("/p/team")}>Team <ArrowRight /></Button>}>
            <ul className="divide-y">
              {reps.map((m) => {
                const mine = d.deals.filter((r) => r.rep === m.name)
                const op = mine.filter((r) => ["approved", "under_review", "info_requested"].includes(r.state))
                const won = mine.filter((r) => r.state === "won").reduce((n, r) => n + r.value, 0)
                return (
                  <li key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-[13px] font-bold text-primary">{m.name.split(" ").map((x) => x[0]).join("")}</span>
                    <span className="min-w-0 flex-1">
                      <b className="block text-foreground">{m.name}</b>
                      <span className="text-[14px] text-muted-foreground">{op.length} open · {money(op.reduce((n, r) => n + r.value, 0))}</span>
                    </span>
                    <span className="text-right"><b className="block text-foreground tabular">{money(won)}</b><span className="text-[13px] text-muted-foreground">won</span></span>
                  </li>
                )
              })}
            </ul>
          </Panel>
          <Recent />
          <ManagerPanel />
        </div>
      </div>

      <Panel title="Deals that need a reply or more time" sub="Across the whole team" bodyClass="px-0 sm:px-0 pb-1 pt-2" action={<Button variant="ghost" onClick={() => go("/p/deals")}>All deals <ArrowRight /></Button>}>
        <DealRows rows={[...d.needsReply, ...d.expiring, ...d.inReview]} empty={<p className="flex items-center gap-2 px-6 pb-4 text-muted-foreground"><MessageSquareText className="size-4" /> Nothing waiting on Ridgeway.</p>} />
      </Panel>
    </div>
  )
}

export function PartnerHome() {
  const { isExec } = usePartner()
  return isExec ? <ExecHome /> : <RepHome />
}
