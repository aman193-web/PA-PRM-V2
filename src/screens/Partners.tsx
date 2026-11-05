import { ArrowRight, Bell, Check, ChevronRight, ListChecks, Phone, UserPlus, Users } from "lucide-react"
import { toast } from "sonner"
import { EmptyState, PageHeader, PageTabs, Panel, PartnerAvatar } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import type { Onboarding } from "@/data/model"
import { ago, date, moneyShort } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { pipelineOf, useQueue, useStore } from "@/store"

export function Partners({ tab = "applications" }: { tab?: string }) {
  const q = useQueue()
  const { state } = useStore()
  return (
    <div>
      <PageHeader title="Partners" sub="Accept new partners, get them through onboarding, and keep an eye on the ones you look after." />
      <PageTabs
        label="Partners"
        value={tab}
        onChange={(v) => go(`/partners/${v}`)}
        items={[
          { value: "applications", label: "Applications", icon: <UserPlus />, count: q.apps.length, tone: "action", hint: "Companies asking to join your programs. Accept, decline or escalate." },
          { value: "onboarding", label: "Onboarding", icon: <ListChecks />, count: state.onboarding.length, tone: "neutral", hint: "Partners can register deals once agreements, documents and tasks are done. Onboarding ends at their first deal." },
          { value: "all", label: "My partners", icon: <Users />, count: state.partners.filter((p) => p.assigned).length, tone: "neutral", hint: "The partners assigned to you. Others show by name only." },
        ]}
      />
      <div>
        {tab === "applications" && <Applications />}
        {tab === "onboarding" && <OnboardingList />}
        {tab === "all" && <MyPartners onOpen={(id) => go(`/partner/${id}`)} />}
      </div>
    </div>
  )
}

function Applications() {
  const { state } = useStore()
  const pending = state.applications.filter((a) => a.status === "new")
  const decided = state.applications.filter((a) => a.status !== "new")
  return (
    <div className="space-y-6">
      {pending.length === 0 ? (
        <Panel><EmptyState title="No applications waiting" body="New partner applications for your region and programs will appear here." /></Panel>
      ) : (
        <ul className="grid gap-3">
          {pending.map((a) => {
            const warns = a.checks.filter((c) => c.status !== "pass").length + a.agreements.filter((g) => g.status === "missing").length
            return (
              <li key={a.id}>
                <a href={`#/application/${a.id}`} className="grid gap-4 rounded-[14px] border bg-card p-5 shadow-[0_1px_2px_#172b4508] transition hover:border-primary/60 sm:p-6 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <div className="flex min-w-0 items-start gap-4">
                    <PartnerAvatar name={a.company} size="lg" />
                    <div className="min-w-0">
                      <p className="text-[18px] font-semibold text-foreground">{a.company}</p>
                      <p className="text-[15px] text-muted-foreground">{a.program} program · {a.hq} · {a.employees} people</p>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {a.agreements.map((g) => (
                          <Badge key={g.name} variant="outline" className={cn(g.status === "missing" && "border-amber/70 text-amber-ink")}>
                            {g.status === "signed" || g.status === "accepted" ? <Check className="text-ok" /> : null}
                            {g.name}{g.status === "missing" ? ": not on file" : g.status === "after_accept" ? ": after accept" : ""}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-[15px] md:text-right">
                    <p className="text-muted-foreground">Applied {ago(a.appliedAt)}</p>
                    <p className={cn("font-semibold", warns ? "text-amber-ink" : "text-ok")}>{warns ? `${warns} thing${warns > 1 ? "s" : ""} to check` : "All checks passed"}</p>
                  </div>
                  <span aria-hidden className={buttonVariants()}>Review <ArrowRight /></span>
                </a>
              </li>
            )
          })}
        </ul>
      )}
      {decided.length > 0 && (
        <Panel title="Decided applications">
          <ul className="divide-y">
            {decided.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <span className="font-medium text-foreground">{a.company} <span className="font-normal text-muted-foreground">· {a.program}</span></span>
                {a.status === "accepted" && <Badge className="border-0 bg-ok-soft text-ok">Accepted · onboarding</Badge>}
                {a.status === "rejected" && <Badge className="border-0 bg-bad-soft text-bad">Declined · {a.outcomeNote}</Badge>}
                {a.status === "escalated" && <Badge className="border-0 bg-brand-soft text-primary">With the channel chief</Badge>}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  )
}

export function OnboardingTrack({ ob }: { ob: Onboarding }) {
  const steps = [
    { label: "Accepted", done: true, detail: date(ob.acceptedAt, { month: "short", day: "numeric" }) },
    ...ob.steps.map((s) => ({ label: s.label, done: s.done === s.total, detail: `${s.done} of ${s.total}` })),
    { label: "Can register deals", done: ob.eligible, detail: ob.eligible ? "Eligible" : "After the steps above" },
    { label: "First deal registered", done: ob.firstDeal, detail: ob.firstDeal ? "Done" : "Completes onboarding" },
  ]
  const current = steps.findIndex((s) => !s.done)
  return (
    <ol className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {steps.map((s, i) => (
        <li key={s.label} className={cn("rounded-[10px] border p-3", s.done ? "border-ok/30 bg-ok-soft/50" : i === current ? "border-amber bg-amber-soft/60" : "bg-card")}>
          <span className="flex items-center gap-2">
            <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-[13px] font-bold", s.done ? "bg-ok text-white" : i === current ? "bg-amber text-[#2a1a00]" : "bg-muted text-muted-foreground")}>
              {s.done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <b className="text-[14.5px] leading-tight text-foreground">{s.label}</b>
          </span>
          <span className="mt-1 block pl-8 text-[13.5px] text-muted-foreground">{s.detail}</span>
        </li>
      ))}
    </ol>
  )
}

function OnboardingList() {
  const { state, dispatch, partner } = useStore()
  if (!state.onboarding.length) return <Panel><EmptyState title="Nobody onboarding" body="Partners you accept appear here until they register their first deal." /></Panel>
  return (
    <div className="space-y-4">
      {state.onboarding.map((ob) => {
        const p = partner(ob.partnerId)!
        const missing = ob.steps.filter((s) => s.missing).map((s) => s.missing)
        const reminded = state.reminders[ob.partnerId]
        return (
          <Panel key={ob.partnerId}>
            <div className="flex flex-wrap items-start gap-4">
              <PartnerAvatar name={p.name} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-[18px] font-semibold text-foreground">{p.name}</p>
                <p className="text-[15px] text-muted-foreground">{p.program} program · {p.tier} · accepted {ago(ob.acceptedAt)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {ob.idleDays >= 5 && !reminded && <Badge className="h-7 border-0 bg-amber-soft px-3 text-amber-ink">Idle {ob.idleDays} days</Badge>}
                <Button variant="outline" asChild><a href={`tel:${p.contact.phone.replace(/\s/g, "")}`}><Phone /> Call {p.contact.name.split(" ")[0]}</a></Button>
                <Button
                  variant={reminded ? "ghost" : ob.idleDays >= 5 ? "default" : "outline"}
                  disabled={!!reminded || (ob.eligible && missing.length === 0 && ob.firstDeal)}
                  onClick={() => {
                    dispatch({ type: "remind", partnerId: ob.partnerId })
                    toast.success(`Reminder sent to ${p.contact.name}`, { description: missing.length ? `Asked for: ${missing.join("; ")}` : "Nudged to register their first deal." })
                  }}
                >
                  {reminded ? <><Check /> Reminder sent</> : <><Bell /> Send reminder</>}
                </Button>
              </div>
            </div>
            <div className="mt-5"><OnboardingTrack ob={ob} /></div>
            {missing.length > 0 ? (
              <p className="mt-4 text-[15px]"><b className="text-foreground">Still missing:</b> {missing.join(" · ")}</p>
            ) : ob.eligible && !ob.firstDeal ? (
              <p className="mt-4 text-[15px] text-ok"><b>Ready to sell.</b> <span className="text-body">Waiting for their first registered deal.</span></p>
            ) : null}
          </Panel>
        )
      })}
    </div>
  )
}

function MyPartners({ onOpen }: { onOpen: (id: string) => void }) {
  const { state } = useStore()
  const mine = state.partners.filter((p) => p.assigned)
  return (
    <div className="space-y-3">
      <Panel bodyClass="p-0 sm:p-0">
        <div className="hidden grid-cols-[1.6fr_1fr_120px_120px_130px] gap-4 border-b px-6 py-3 text-[14px] font-medium text-muted-foreground md:grid">
          <span>Partner</span><span>Program</span><span className="text-right">Pipeline</span><span className="text-right">Won this year</span><span>Last activity</span>
        </div>
        <ul>
          {mine.map((p) => (
            <li key={p.id} className="border-b last:border-0">
              <button onClick={() => onOpen(p.id)} className="grid w-full gap-2 px-5 py-4 text-left hover:bg-muted/50 sm:px-6 md:grid-cols-[1.6fr_1fr_120px_120px_130px] md:items-center md:gap-4">
                <span className="flex min-w-0 items-center gap-3">
                  <PartnerAvatar name={p.name} />
                  <span className="min-w-0">
                    <b className="block truncate text-foreground">{p.name}</b>
                    <span className="text-[14px] text-muted-foreground">{p.region}</span>
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-2 text-[15px]">
                  {p.program} · {p.tier}
                  {p.status === "onboarding" && <Badge className="border-0 bg-amber-soft text-amber-ink">Onboarding</Badge>}
                </span>
                <span className="text-[15px] font-semibold text-foreground tabular md:text-right"><span className="text-muted-foreground md:hidden">Pipeline </span>{moneyShort(pipelineOf(state, p.id))}</span>
                <span className="text-[15px] text-foreground tabular md:text-right"><span className="text-muted-foreground md:hidden">Won </span>{moneyShort(p.wonThisYear)}</span>
                <span className="flex items-center justify-between text-[14.5px] text-muted-foreground">{ago(p.lastActivity)}<ChevronRight className="hidden size-4 md:block" /></span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
