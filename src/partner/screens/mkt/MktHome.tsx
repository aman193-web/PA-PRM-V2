import { ArrowRight, CheckCircle2, Coins, Inbox, Megaphone, Plus, Sparkles, Undo2 } from "lucide-react"
import { Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { date, money } from "@/lib/format"
import { go } from "@/lib/router"
import { usePartner } from "@/partner/usePartner"
import { useMarketing } from "@/partner/useMarketing"
import { Kpi } from "@/partner/bits"
import { greeting, ManagerPanel, Recent, TodoPanel, type Todo } from "@/partner/screens/Home"
import { CampaignBadge, stat } from "@/partner/screens/mkt/bits"

export function useMktTodos(): Todo[] {
  const m = useMarketing()
  const name = (id: string) => m.campaigns.find((c) => c.id === id)?.name ?? "your campaign"
  const out: Todo[] = []
  for (const l of m.toHandOff.filter((x) => x.status === "returned"))
    out.push({ key: l.id, icon: <Undo2 />, tone: "bad", title: `${l.company} came back from ${l.assignee}`, body: `"${l.returnReason}" Hand it to someone else, or leave it.`, cta: "Review", href: "/p/leads", tag: "Returned" })
  for (const l of m.toHandOff.filter((x) => x.status === "new"))
    out.push({ key: l.id, icon: <Inbox />, tone: "amber", title: `Hand ${l.company} to a rep`, body: `${l.industry} · ${l.region} · about ${money(l.estValue)}. ${l.activity}.`, cta: "Hand off", href: "/p/leads", tag: name(l.campaignId).split(":")[0] })
  for (const r of m.claimable.filter((x) => m.campaigns.find((c) => c.id === x.campaignId)?.status !== "draft"))
    out.push({ key: r.id, icon: <Coins />, tone: "primary", title: `Claim ${money(r.amount)} for ${r.campaign}`, body: "File the claim when the campaign ends. Results from your tracked link are attached for you.", cta: "Prepare the claim", href: "/p/funds", tag: `Claim by ${date(r.claimDue!)}` })
  for (const c of m.campaigns.filter((x) => x.status === "draft" && x.note?.startsWith("Funds approved")))
    out.push({ key: c.id, icon: <Megaphone />, tone: "primary", title: `Launch ${c.name}`, body: "Brightline approved the funds. Your kit and tracked link are ready.", cta: "Launch", href: `/p/campaign/${c.id}`, tag: "Ready" })
  for (const k of m.newKits)
    out.push({ key: k.id, icon: <Sparkles />, tone: "primary", title: `New kit: ${k.title}`, body: `${k.summary} Approved until ${date(k.approvedUntil)}.`, cta: "See the kit", href: `/p/launch/${k.id}`, tag: "New from Brightline" })
  return out
}

export function MktHome() {
  const { me } = usePartner()
  const m = useMarketing()
  const todos = useMktTodos()
  const running = m.campaigns.filter((c) => c.status === "live" || c.status === "scheduled" || c.status === "draft")
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] leading-tight font-bold sm:text-[32px]">{greeting()}, {me.first}.</h1>
        <p className="mt-1.5 text-[16.5px] text-muted-foreground">
          {todos.length ? `${todos.length} thing${todos.length > 1 ? "s" : ""} need you. ` : ""}Here's the pipeline your campaigns have produced for Ridgeway.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <div className="relative col-span-2 overflow-hidden rounded-[14px] bg-night p-6 text-white">
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative flex h-full flex-col">
            <p className="text-[15px] font-medium text-[#b9cbe4]">Pipeline from your campaigns</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
              <span className="text-[48px] leading-none font-bold tabular">{money(m.pipeline)}</span>
              <span className="text-[15.5px] text-[#cfe0f7]">in {m.openDeals.length} open deal{m.openDeals.length === 1 ? "" : "s"} registered from your leads</span>
            </div>
            <p className="mt-3 text-[15px] text-[#cfe0f7]"><b className="text-white tabular">{money(m.won)}</b> won this year from your campaigns · counted from your tracked links</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <Button size="lg" className="bg-white text-night hover:bg-white/90" onClick={() => go("/p/launch")}><Plus /> Launch a campaign</Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => go("/p/campaigns")}>See campaigns <ArrowRight /></Button>
            </div>
          </div>
        </div>
        <Kpi icon={<Inbox />} label="Leads to hand to a rep" value={String(m.toHandOff.length)} sub={`${m.withReps.length} with reps now`} href="/p/leads" />
        <Kpi icon={<Coins />} label="Funds you can request" value={money(m.funds.available)} sub={`${money(m.funds.waiting)} waiting for Brightline`} href="/p/funds" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <TodoPanel todos={todos} empty="Nothing needs you right now. We'll tell you when a campaign brings in a lead." />
        <div className="space-y-6">
          <Panel title="Running and planned" action={<Button variant="ghost" onClick={() => go("/p/campaigns")}>All <ArrowRight /></Button>} bodyClass="px-0 sm:px-0 pb-1 pt-1">
            <ul>
              {running.map((c) => {
                const s = m.stats[c.id]
                return (
                  <li key={c.id} className="border-t first:border-t-0">
                    <a href={`#/p/campaign/${c.id}`} className="block px-5 py-3.5 hover:bg-muted/50 sm:px-6">
                      <span className="flex items-start justify-between gap-3">
                        <b className="min-w-0 text-[15.5px] leading-snug text-foreground">{c.name}</b>
                        <CampaignBadge c={c} />
                      </span>
                      <span className="mt-1 block text-[14px] text-muted-foreground">
                        {c.status === "draft" ? c.note ?? "Draft" : `${stat(c.clicks)} clicks · ${s.leadCount} lead${s.leadCount === 1 ? "" : "s"} · ${money(s.pipeline)} pipeline`}
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </Panel>
          <Recent />
          <ManagerPanel />
        </div>
      </div>

      {m.converted.length > 0 && (
        <Panel title="Leads that became deals" sub="Registered by Ridgeway's reps from your campaigns">
          <ul className="flex flex-wrap gap-2">{m.converted.map((l) => <Badge key={l.id} variant="secondary" className="text-[14px]"><CheckCircle2 className="size-3.5" /> {l.company} · {l.assignee}</Badge>)}</ul>
        </Panel>
      )}
    </div>
  )
}
