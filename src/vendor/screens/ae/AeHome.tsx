import { ArrowRight, Building2, CalendarDays, Clock3, Handshake, MessageSquarePlus, Users } from "lucide-react"
import { Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { date, money } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { Kpi } from "@/partner/bits"
import { partnerNameOf, useSeller, useVendor } from "@/vendor/useVendor"
import { AskBar, Greeting, Recent } from "@/vendor/screens/ops/OpsHome"

interface Todo { key: string; title: string; body: string; href: string; cta: string; icon: React.ReactNode; tone: "amber" | "primary" | "bad" }
const tile = { amber: "bg-amber-soft text-amber-ink", primary: "bg-brand-soft text-primary", bad: "bg-bad-soft text-bad" }

export function AeHome() {
  const { state } = useStore()
  const { me } = useVendor()
  const s = useSeller()
  const todos: Todo[] = [
    ...s.inReview.map(({ v, r }) => ({ key: r.id, title: `${partnerNameOf(state, r.partnerId)} registered a deal on ${v.a.name}`, body: `Jordan Lee is reviewing it. ${state.sellerNotes[r.id]?.length ? "You've added your context." : "Tell Jordan what you know before the decision."}`, href: `/v/account/${v.a.id}`, cta: state.sellerNotes[r.id]?.length ? "Open" : "Add context", icon: <MessageSquarePlus />, tone: "amber" as const })),
    ...s.dueSoon.map(({ v, p, c }) => ({ key: `${c.id}-${p.id}`, title: p.text, body: `${v.a.name} · joint plan with ${partnerNameOf(state, c.partnerId)} · due ${date(p.due)}`, href: `/v/account/${v.a.id}`, cta: "Open plan", icon: <CalendarDays />, tone: "primary" as const })),
    ...s.needPartner.map((v) => ({ key: v.a.id, title: `${v.a.name} has no partner yet`, body: v.a.need!, href: `/v/find/${v.a.id}`, cta: "Find a partner", icon: <Handshake />, tone: "primary" as const })),
  ]
  return (
    <div className="space-y-6">
      <Greeting name={me.first} line={todos.length ? <>{todos.length} things on your accounts need you.</> : "Nothing needs you on your accounts."} />
      <AskBar placeholder="Ask about your accounts and partners…" example="Who should I bring in on Solstice Hotels?" />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <div className="relative col-span-2 overflow-hidden rounded-[14px] bg-night p-6 text-white">
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative flex h-full flex-col">
            <p className="text-[15px] font-medium text-[#b9cbe4]">Partner-involved deals on your accounts</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
              <span className="text-[48px] leading-none font-bold tabular">{money(s.involvedValue)}</span>
              <span className="text-[15.5px] text-[#cfe0f7]">{s.involved.length} of {s.views.length} accounts</span>
            </div>
            <div className="mt-5 h-2.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-amber" style={{ width: `${(s.involvedValue / s.totalValue) * 100}%` }} /></div>
            <p className="mt-2 text-[14.5px] text-[#cfe0f7]">{money(s.totalValue)} across all your accounts</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <Button size="lg" className="bg-white text-night hover:bg-white/90" onClick={() => go("/v/find")}><Handshake /> Find a partner</Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => go("/v/accounts")}><Building2 /> My accounts</Button>
            </div>
          </div>
        </div>
        <Kpi icon={<Clock3 />} label="Co-sell requests out" value={String(s.sent.length)} sub="Partners answer within 48 hours" href="/v/cosell" />
        <Kpi icon={<Users />} label="Joint plan steps yours" value={String(s.mySteps.length)} sub={s.dueSoon.length ? `${s.dueSoon.length} due in the next 10 days` : "None due soon"} href="/v/cosell" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <Panel title="Needs you" sub="Partner activity on your accounts first" bodyClass="px-0 sm:px-0 pb-1">
          {todos.length === 0 ? <p className="px-6 pb-4 text-muted-foreground">You're all caught up.</p> : (
            <ul>
              {todos.map((t) => (
                <li key={t.key} className="border-t first:border-t-0">
                  <a href={`#${t.href}`} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 sm:px-6">
                    <span className={cn("grid size-10 shrink-0 place-items-center rounded-[10px] [&_svg]:size-5", tile[t.tone])}>{t.icon}</span>
                    <span className="min-w-0 flex-1"><b className="block text-[16px] leading-snug text-foreground">{t.title}</b><span className="block text-[14px] text-muted-foreground">{t.body}</span></span>
                    <span className="hidden shrink-0 text-[15px] font-semibold text-primary sm:inline">{t.cta}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <div className="space-y-6">
          <Panel title="Partners on your accounts" action={<Button variant="ghost" onClick={() => go("/v/accounts")}>All <ArrowRight /></Button>}>
            <ul className="space-y-3">
              {s.involved.map((v) => (
                <li key={v.a.id}>
                  <a href={`#/v/account/${v.a.id}`} className="flex items-center justify-between gap-3">
                    <span className="min-w-0"><b className="block truncate text-foreground">{v.a.name}</b><span className="block truncate text-[14px] text-muted-foreground">{v.partners.map((p) => `${p.name} · ${p.role}`).join(", ")}</span></span>
                    <Badge variant="secondary" className="shrink-0 tabular">{money(v.a.value)}</Badge>
                  </a>
                </li>
              ))}
            </ul>
          </Panel>
          <Recent items={state.sellerFeed} />
        </div>
      </div>
    </div>
  )
}
