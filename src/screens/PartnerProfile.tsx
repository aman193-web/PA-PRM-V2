import { useMemo, useState } from "react"
import { ArrowRight, Briefcase, CalendarDays, Check, Clock, FileSignature, Lock, Mail, MapPin, MessageSquarePlus, Phone, PieChart, Sparkles, Star, UserRound, Users } from "lucide-react"
import { toast } from "sonner"
import { CheckIcon, EmptyState, PageHeader, PageTabs, Panel, PartnerAvatar } from "@/components/common"
import { useCopilot } from "@/components/Copilot"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { Partner, Person } from "@/data/model"
import { ago, date, money, moneyShort, NOW } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { DealsList, daysUntil } from "@/screens/Deals"
import { OnboardingTrack } from "@/screens/Partners"

const tel = (p: string) => `tel:${p.replace(/\s/g, "")}`

/** Reasons worth a call, built from live queue, onboarding, lead and health data. */
function useTalkingPoints(p: Partner) {
  const { state } = useStore()
  return useMemo(() => {
    const out: { text: string; href: string; tone: "bad" | "amber" | "info" }[] = []
    const mine = state.registrations.filter((r) => r.partnerId === p.id)
    const waiting = mine.filter((r) => r.state === "under_review")
    if (waiting.length) out.push({ text: `${waiting.length} deal${waiting.length > 1 ? "s" : ""} waiting for your decision`, href: `/registration/${waiting[0].id}`, tone: "amber" })
    mine.filter((r) => r.state === "info_requested").forEach((r) => out.push({ text: `Hasn't answered your question on ${r.customer}`, href: `/registration/${r.id}`, tone: "amber" }))
    state.extensions.filter((e) => e.partnerId === p.id && e.status === "pending").forEach((e) => out.push({ text: `Asked to extend ${e.customer} protection (ends in ${e.daysLeft} days)`, href: "/queue/extensions", tone: "amber" }))
    mine.filter((r) => r.state === "approved" && r.protectedUntil && daysUntil(r.protectedUntil) <= 21 && !state.extensions.some((e) => e.registrationId === r.id && e.status === "pending"))
      .forEach((r) => out.push({ text: `${r.customer} protection ends in ${daysUntil(r.protectedUntil!)} days`, href: `/registration/${r.id}`, tone: "info" }))
    state.leads.filter((l) => l.partnerId === p.id && l.status === "offered").forEach((l) => out.push({ text: `Hasn't accepted the ${l.company} lead yet`, href: "/deals/leads", tone: "info" }))
    const ob = state.onboarding.find((o) => o.partnerId === p.id)
    if (ob && ob.idleDays >= 5) out.push({ text: `Onboarding idle for ${ob.idleDays} days`, href: "/partners/onboarding", tone: "amber" })
    const h = state.health.find((x) => x.partnerId === p.id && x.status === "open")
    if (h) out.push({ text: `${h.metric}. Coach: ${h.suggestion.title.toLowerCase()}`, href: "/health", tone: h.trend === "at_risk" ? "bad" : "info" })
    return out.slice(0, 4)
  }, [state, p.id])
}

function agreementsFor(p: Partner, steps?: { done: number; total: number }) {
  if (p.status === "onboarding") {
    const signed = steps?.done ?? 0
    return [
      { name: "Program terms", status: "pass" as const, detail: "Accepted on the application" },
      { name: "Mutual NDA", status: signed >= 1 ? ("pass" as const) : ("warn" as const), detail: signed >= 1 ? "Signed" : "Waiting for signature" },
      { name: "Partner agreement", status: signed >= 2 ? ("pass" as const) : ("warn" as const), detail: signed >= 2 ? "Signed" : "Sent, waiting for signature" },
    ]
  }
  const since = p.since ?? "2024-01-01"
  const renew = `${NOW.getFullYear() + 1}${since.slice(4)}`
  return [
    { name: "Partner agreement", status: "pass" as const, detail: `Signed ${date(since)} · renews ${date(renew)}` },
    { name: "Mutual NDA", status: "pass" as const, detail: `Signed ${date(since)}` },
    { name: `${p.program} program terms`, status: "pass" as const, detail: "Current version accepted" },
  ]
}

export function PartnerProfile({ id, tab = "overview" }: { id: string; tab?: string }) {
  const { state, partner } = useStore()
  const { ask } = useCopilot()
  const p = partner(id)
  if (!p) return <PageHeader title="Partner not found" back={{ label: "Partners", href: "/partners/all" }} />
  if (!p.assigned)
    return (
      <div>
        <PageHeader back={{ label: "Partners", href: "/partners/all" }} title={<span className="flex items-center gap-3"><PartnerAvatar name={p.name} size="lg" />{p.name}</span>} sub={`${p.program} · ${p.region}`} />
        <Panel><EmptyState icon={<Lock className="size-6" />} title="Not assigned to you" body="You see this partner's name on shared deals, but not their details or commercial terms." /></Panel>
      </div>
    )

  const regs = state.registrations.filter((r) => r.partnerId === id)
  const open = regs.filter((r) => ["approved", "under_review", "info_requested"].includes(r.state))
  const closed = regs.filter((r) => r.state === "won" || r.state === "lost")
  const winRate = closed.length ? Math.round((closed.filter((r) => r.state === "won").length / closed.length) * 100) : null
  const people: Person[] = p.people ?? [{ ...p.contact, canRegister: true }]
  const leads = state.leads.filter((l) => l.partnerId === id)
  const base = `/partner/${id}`

  return (
    <div>
      <PageHeader
        back={{ label: "My partners", href: "/partners/all" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <PartnerAvatar name={p.name} size="lg" />
            {p.name}
            {p.status === "onboarding" ? <Badge className="border-0 bg-amber-soft text-amber-ink">Onboarding</Badge> : <Badge className="border-0 bg-ok-soft text-ok">Active</Badge>}
          </span>
        }
        sub={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5"><Star className="size-4" />{p.tier} · {p.program}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{p.region}</span>
            {p.since && <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" />Partner since {date(p.since, { month: "short", year: "numeric" })}</span>}
          </span>
        }
        actions={
          <>
            <Button size="lg" asChild><a href={tel(p.contact.phone)}><Phone /> Call {p.contact.name.split(" ")[0]}</a></Button>
            <Button size="lg" variant="outline" asChild><a href={`mailto:${p.contact.email}`}><Mail /> Email</a></Button>
            <Button size="lg" variant="ghost" onClick={() => ask(`How is ${p.name} doing?`)}><Sparkles className="text-primary" /> Ask</Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat k="Open pipeline" v={moneyShort(open.reduce((n, r) => n + r.value, 0) || p.pipeline)} sub={`${open.length} open deals`} />
        <Stat k="Won this year" v={moneyShort(p.wonThisYear)} sub={winRate === null ? "Closed-won in Salesforce" : `Win rate ${winRate}% on registered deals`} />
        <Stat k="Partner quality" v={p.quality.toFixed(2)} sub={p.quality < 0.7 ? "Below the 0.70 auto-approve bar" : "Clean deals auto-approve"} tone={p.quality < 0.7 ? "amber" : undefined} />
        <Stat k="Last activity" v={ago(p.lastActivity)} sub={p.contact.name} />
      </div>

      <PageTabs
        label={`${p.name} sections`}
        value={tab}
        onChange={(v) => go(v === "overview" ? base : `${base}/${v}`)}
        items={[
          { value: "overview", label: "Overview", icon: <UserRound /> },
          { value: "deals", label: "Deals & leads", icon: <Briefcase />, count: regs.length + leads.length, tone: "neutral" },
          { value: "people", label: "People", icon: <Users />, count: people.length, tone: "neutral" },
          { value: "agreements", label: "Agreements", icon: <FileSignature /> },
          { value: "activity", label: "Notes & activity", icon: <Clock /> },
        ]}
      />

      {tab === "overview" && <Overview p={p} />}
      {tab === "deals" && (
        <div className="space-y-6">
          <Panel title="Deals" sub="Every deal this partner registered" bodyClass="p-0 sm:p-0" action={<Button variant="ghost" onClick={() => go("/deals")}>All deals <ArrowRight /></Button>}>
            {regs.length ? <DealsList rows={[...regs].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))} showPartner={false} /> : <p className="px-6 pb-5 text-muted-foreground">No deals registered yet.</p>}
          </Panel>
          <Panel title="Leads sent to them" bodyClass="pt-2">
            {leads.length ? (
              <ul className="divide-y">
                {leads.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <span><b className="text-foreground">{l.company}</b> <span className="text-muted-foreground">· ~{money(l.estValue)} · {l.product}</span></span>
                    <Badge variant="secondary" className="capitalize">{l.status === "offered" ? "Waiting to accept" : l.status}</Badge>
                  </li>
                ))}
              </ul>
            ) : <p className="text-muted-foreground">No leads sent yet.</p>}
          </Panel>
        </div>
      )}
      {tab === "people" && <People people={people} />}
      {tab === "agreements" && <Agreements p={p} />}
      {tab === "activity" && <Activity p={p} />}
    </div>
  )
}

function Overview({ p }: { p: Partner }) {
  const { state, partner } = useStore()
  const points = useTalkingPoints(p)
  const ob = state.onboarding.find((o) => o.partnerId === p.id)
  const open = state.registrations.filter((r) => r.partnerId === p.id && ["approved", "under_review", "info_requested"].includes(r.state)).sort((a, b) => a.closeDate.localeCompare(b.closeDate))
  const opps = state.opportunities.filter((o) => o.lines.some((l) => l.partnerId === p.id))
  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <Panel title="Talk to them about" sub="Built from the queue, leads, onboarding and partner health">
          {points.length ? (
            <ul className="grid gap-2.5 md:grid-cols-2">
              {points.map((t) => (
                <li key={t.text}>
                  <a href={`#${t.href}`} className="flex items-center gap-3 rounded-[12px] border p-3 hover:border-primary/60">
                    <span className={cn("size-2.5 shrink-0 rounded-full", t.tone === "bad" ? "bg-bad" : t.tone === "amber" ? "bg-amber" : "bg-primary")} />
                    <span className="flex-1 text-[15px] text-foreground">{t.text}</span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 text-muted-foreground"><Check className="size-4 text-ok" /> Nothing urgent. A good time for a relationship call.</p>
          )}
        </Panel>
        <Panel title="Open deals" sub="Closing soonest first" bodyClass="p-0 sm:p-0">
          {open.length ? <DealsList rows={open.slice(0, 4)} showPartner={false} /> : <p className="px-6 pb-5 text-muted-foreground">No open deals.</p>}
        </Panel>
      </div>
      {ob && (
        <Panel title="Onboarding">
          <OnboardingTrack ob={ob} />
        </Panel>
      )}
      {opps.length > 0 && (
        <Panel title="Credit on shared opportunities" bodyClass="pt-2">
          <ul className="divide-y">
            {opps.map((o) => {
              const l = o.lines.find((x) => x.partnerId === p.id)!
              const others = o.lines.filter((x) => x.partnerId !== p.id).map((x) => partner(x.partnerId)?.name).join(", ")
              return (
                <li key={o.id}>
                  <a href={`#/opportunity/${o.id}`} className="flex flex-wrap items-center gap-3 py-3 hover:text-primary">
                    <PieChart className="size-4 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <b className="text-foreground">{o.account}</b> <span className="text-muted-foreground">· {money(o.value)} · {o.stage}</span>
                      {others && <span className="block text-[14px] text-muted-foreground">With {others}</span>}
                    </span>
                    <span className="text-right">
                      <b className="block text-foreground tabular">{l.share}% · {l.role}</b>
                      <span className="text-[14px] text-muted-foreground tabular">{money(Math.round((o.value * l.share) / 100))}</span>
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        </Panel>
      )}
    </div>
  )
}

function People({ people }: { people: Person[] }) {
  return (
    <Panel bodyClass="p-0 sm:p-0">
      <ul>
        {people.map((u, i) => (
          <li key={u.email || u.name} className="flex flex-wrap items-center gap-4 border-b px-5 py-4 last:border-0 sm:px-6">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-[14px] font-semibold text-foreground">{u.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
            <span className="min-w-0 flex-1">
              <b className="flex flex-wrap items-center gap-2 text-foreground">
                {u.name}
                {i === 0 && <Badge variant="secondary">Main contact</Badge>}
                {u.canRegister && <Badge className="border-0 bg-ok-soft text-ok">Can register deals</Badge>}
              </b>
              <span className="text-[14px] text-muted-foreground">{u.title} · {u.email}</span>
            </span>
            <span className="flex gap-2">
              <Button variant="outline" asChild><a href={tel(u.phone)}><Phone /> Call</a></Button>
              <Button variant="ghost" size="icon" asChild aria-label={`Email ${u.name}`}><a href={`mailto:${u.email}`}><Mail /></a></Button>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function Agreements({ p }: { p: Partner }) {
  const { state } = useStore()
  const ob = state.onboarding.find((o) => o.partnerId === p.id)
  const list = agreementsFor(p, ob?.steps[0])
  return (
    <Panel sub="Deal registration needs a signed partner agreement">
      <ul className="divide-y">
        {list.map((a) => (
          <li key={a.name} className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0 last:pb-0">
            <CheckIcon status={a.status} />
            <span className="min-w-0 flex-1">
              <b className="block text-foreground">{a.name}</b>
              <span className="text-[14px] text-muted-foreground">{a.detail}</span>
            </span>
            {a.status !== "pass" && (
              <Button variant="outline" onClick={() => toast.success(`Reminder sent to ${p.contact.name}`, { description: `${a.name} is waiting for a signature.` })}>Send reminder</Button>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function Activity({ p }: { p: Partner }) {
  const { state, dispatch } = useStore()
  const [text, setText] = useState("")
  const notes = state.notes[p.id] ?? []
  const events = useMemo(() => {
    const regs = state.registrations.filter((r) => r.partnerId === p.id).map((r) => ({ at: r.submittedAt, text: `Registered ${r.customer} (${money(r.value)})`, href: `/registration/${r.id}` }))
    const touches = state.opportunities.flatMap((o) => o.touches.filter((t) => t.partnerId === p.id).map((t) => ({ at: t.at, text: `${t.text} · ${o.account}`, href: `/opportunity/${o.id}` })))
    const log = state.activity.filter((a) => a.text.includes(p.name)).map((a) => ({ at: a.at, text: a.text, href: a.href }))
    return [...log, ...regs, ...touches].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 14)
  }, [state, p.id, p.name])

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
      <Panel title="Your notes" sub="Only you and your manager can see these">
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!text.trim()) return
            dispatch({ type: "addNote", partnerId: p.id, text: text.trim() })
            setText("")
          }}
        >
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={`What did you agree with ${p.contact.name.split(" ")[0]}?`} />
          <Button type="submit" disabled={!text.trim()}><MessageSquarePlus /> Add note</Button>
        </form>
        <ul className="mt-5 space-y-3">
          {notes.map((n) => (
            <li key={n.at + n.text} className="rounded-[10px] bg-muted px-4 py-3">
              <p className="text-foreground">{n.text}</p>
              <p className="mt-1 text-[13.5px] text-muted-foreground">{ago(n.at)}</p>
            </li>
          ))}
          {!notes.length && <li className="text-muted-foreground">No notes yet.</li>}
        </ul>
      </Panel>
      <Panel title="Activity" sub="Registrations, deal touches and your decisions">
        <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-px before:bg-border">
          {events.map((e) => (
            <li key={e.at + e.text} className="relative pl-6">
              <span className="absolute top-2 left-0 size-[11px] rounded-full border-2 border-card bg-primary" />
              {e.href ? <a href={`#${e.href}`} className="text-foreground hover:text-primary">{e.text}</a> : <span className="text-foreground">{e.text}</span>}
              <p className="text-[13.5px] text-muted-foreground">{date(e.at)}</p>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  )
}

function Stat({ k, v, sub, tone }: { k: string; v: string; sub: string; tone?: "amber" }) {
  return (
    <div className={cn("rounded-[14px] border bg-card p-4 shadow-[0_1px_2px_#172b4508] sm:p-5", tone === "amber" && "border-amber/60")}>
      <p className="text-[14.5px] text-muted-foreground">{k}</p>
      <p className={cn("text-[26px] leading-tight font-bold text-foreground tabular", tone === "amber" && "text-amber-ink")}>{v}</p>
      <p className="text-[13.5px] text-muted-foreground">{sub}</p>
    </div>
  )
}
