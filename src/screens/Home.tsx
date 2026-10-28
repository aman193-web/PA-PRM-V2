import { ArrowRight, Clock3, FileSignature, Gauge, Phone, Sparkles, Timer, UserPlus } from "lucide-react"
import { Panel, PartnerAvatar, SlaMeter } from "@/components/common"
import { useCopilot } from "@/components/Copilot"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { me, reviewReasonShort } from "@/data/model"
import { ago, money } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useQueue, useStore } from "@/store"

export function Home() {
  const { state } = useStore()
  const q = useQueue()
  const { ask } = useCopilot()
  const name = (id: string) => state.partners.find((p) => p.id === id)?.name ?? id

  const waitingValue = q.toDecide.reduce((n, r) => n + r.value, 0)
  const urgent = q.toDecide[0]
  const auto = state.registrations.filter((r) => r.decision?.by === "rules")
  const median = auto.length ? Math.round(auto.map((r) => r.decision!.seconds!).sort((a, b) => a - b).reduce((a, b) => a + b) / auto.length) : 0

  const solace = state.registrations.find((r) => r.id === "REG-2027")
  const orchid = state.extensions.find((e) => e.id === "EXT-309")
  const keystoneReminder = state.reminders["keystone"]
  const calls = [
    solace?.state === "info_requested" && {
      who: "Marcus Bell", partner: "Ridgeway IT", phone: "+1 312 555 0142",
      why: "Hasn't answered your question on Solace Retail for a day. The SLA is paused until he does.",
      href: "/registration/REG-2027", tag: "Info requested",
    },
    {
      who: "Owen Park", partner: "Keystone Data", phone: "+1 202 555 0164",
      why: keystoneReminder ? "Reminder sent today. Insurance certificate and one task still missing." : "Onboarding idle for 6 days. Insurance certificate and one task missing.",
      href: "/partners/onboarding", tag: "Onboarding",
    },
    orchid?.status === "pending" && {
      who: "Tara Quinn", partner: "Summit Resale", phone: "+1 214 555 0177",
      why: "Orchid Foods protection ends in 4 days. She asked for 60 more days with no recent activity.",
      href: "/queue/extensions", tag: "Protection ending",
    },
  ].filter(Boolean) as { who: string; partner: string; phone: string; why: string; href: string; tag: string }[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] leading-tight font-bold sm:text-[32px]">Good afternoon, {me.name.split(" ")[0]}.</h1>
        <p className="mt-1.5 text-[16.5px] text-muted-foreground">
          {q.toDecide.length ? (
            <>
              {q.toDecide.length} registration{q.toDecide.length > 1 ? "s" : ""} need your decision
              {q.atRisk.length ? <>, and <b className="text-bad">{q.atRisk.length} is close to its SLA deadline</b></> : null}.
            </>
          ) : (
            "Your review queue is clear. Here's who to talk to today."
          )}
        </p>
      </div>

      <button
        onClick={() => ask()}
        className="flex h-14 w-full items-center gap-3 rounded-[14px] border bg-card px-5 text-left text-[16px] text-muted-foreground shadow-[0_1px_2px_#172b4508] transition hover:border-primary/60"
      >
        <Sparkles className="size-5 text-primary" />
        <span className="flex-1 truncate">Ask about a deal, a partner or your queue…</span>
        <span className="hidden text-[14px] sm:inline">e.g. "Who should I call today?"</span>
      </button>

      {/* Main number first: registrations waiting and SLA risk */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <div className="relative col-span-2 overflow-hidden rounded-[14px] bg-night p-6 text-white">
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative flex h-full flex-col">
            <p className="text-[15px] font-medium text-[#b9cbe4]">Waiting for your decision</p>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-[52px] leading-none font-bold tabular">{q.toDecide.length}</span>
              <span className="text-[16px] text-[#cfe0f7]">registrations · {money(waitingValue)}</span>
            </div>
            {q.atRisk.length > 0 && (
              <p className="mt-3 inline-flex items-center gap-2 text-[15px] font-semibold text-amber">
                <Timer className="size-4" /> {q.atRisk.length} past 80% of its SLA, {me.chief} has been alerted
              </p>
            )}
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              {urgent ? (
                <Button size="lg" className="bg-white text-night hover:bg-white/90" onClick={() => go(`/registration/${urgent.id}`)}>
                  Start with {urgent.customer} <ArrowRight />
                </Button>
              ) : (
                <Button size="lg" className="bg-white text-night hover:bg-white/90" onClick={() => go("/queue/decided")}>
                  See decisions <ArrowRight />
                </Button>
              )}
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => go("/queue")}>
                Open queue
              </Button>
            </div>
          </div>
        </div>
        <Tile icon={<Clock3 />} label="Extension requests" value={q.extensions.length} sub="Protection ends within 6 days" href="/queue/extensions" />
        <Tile icon={<UserPlus />} label="New applications" value={q.apps.length} sub="Partners waiting to join" href="/partners/applications" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <Panel
          title="Decide next"
          sub="Most urgent first. Clean deals were already decided by the rules."
          action={<Button variant="ghost" onClick={() => go("/queue")}>All {q.toDecide.length} <ArrowRight /></Button>}
          bodyClass="px-0 sm:px-0 pb-2"
        >
          {q.toDecide.length === 0 ? (
            <p className="px-6 pb-4 text-muted-foreground">Nothing waiting. New registrations the rules can't decide will show up here.</p>
          ) : (
            <ul>
              {q.toDecide.slice(0, 4).map((r) => (
                <li key={r.id} className="border-t first:border-t-0">
                  <a href={`#/registration/${r.id}`} className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 px-5 py-4 hover:bg-muted/50 sm:grid-cols-[auto_1fr_180px_auto] sm:px-6">
                    <PartnerAvatar name={name(r.partnerId)} />
                    <div className="min-w-0">
                      <p className="truncate text-[16px] font-semibold text-foreground">
                        {r.customer} <span className="font-normal text-muted-foreground">· {money(r.value)}</span>
                      </p>
                      <p className="truncate text-[14px] text-muted-foreground">{name(r.partnerId)} · {r.reasons.map((x) => reviewReasonShort[x]).join(" · ")}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1"><SlaMeter reg={r} /></div>
                    <span aria-hidden className={cn(buttonVariants({ variant: "outline" }), "hidden sm:inline-flex")}>Review</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Who to call today" sub="Partners who need a nudge from you, and why.">
          <ul className="space-y-3">
            {calls.map((c) => (
              <li key={c.who} className="rounded-[12px] border p-4">
                <div className="flex items-start gap-3">
                  <PartnerAvatar name={c.partner} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="text-foreground">{c.who}</b>
                      <span className="text-[14px] text-muted-foreground">{c.partner}</span>
                    </div>
                    <p className="mt-1 text-[14.5px]">{c.why}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <a href={`tel:${c.phone.replace(/\s/g, "")}`}><Phone /> Call</a>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => go(c.href)}>Open</Button>
                      <Badge variant="secondary" className="ml-auto">{c.tag}</Badge>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.45fr]">
        <Panel title="Time to decision today" sub="Live counter across your programs">
          <div className="flex items-end gap-6">
            <div>
              <p className="text-[40px] leading-none font-bold text-foreground tabular">{median} s</p>
              <p className="mt-2 text-[14.5px] text-muted-foreground">median for rule decisions</p>
            </div>
            <div className="flex-1 space-y-2 pb-1">
              <Row icon={<Gauge className="size-4" />} k="Decided by rules" v={`${auto.length} today`} />
              <Row icon={<FileSignature className="size-4" />} k="Waiting for you" v={`${q.toDecide.length}`} />
              <Row icon={<Timer className="size-4" />} k="SLA met this week" v="96%" />
            </div>
          </div>
        </Panel>
        <Panel title="Recent activity">
          <ul className="space-y-3">
            {state.activity.slice(0, 5).map((a) => (
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

function Tile({ icon, label, value, sub, href }: { icon: React.ReactNode; label: string; value: number; sub: string; href: string }) {
  return (
    <a href={`#${href}`} className="group flex flex-col rounded-[14px] border bg-card p-4 sm:p-6 shadow-[0_1px_2px_#172b4508,0_6px_18px_#172b4508] transition hover:border-primary/60">
      <span className="grid size-10 place-items-center rounded-[10px] bg-brand-soft text-primary [&_svg]:size-5">{icon}</span>
      <p className="mt-4 text-[15px] font-medium text-muted-foreground">{label}</p>
      <p className="text-[36px] leading-tight font-bold text-foreground tabular">{value}</p>
      <p className="mt-auto flex items-center justify-between pt-2 text-[14.5px] text-muted-foreground">
        {sub} <ArrowRight className="size-4 text-primary opacity-0 transition group-hover:opacity-100" />
      </p>
    </a>
  )
}

function Row({ icon, k, v }: { icon: React.ReactNode; k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[14.5px]">
      <span className="inline-flex items-center gap-2 text-muted-foreground">{icon}{k}</span>
      <b className="text-foreground tabular">{v}</b>
    </div>
  )
}
