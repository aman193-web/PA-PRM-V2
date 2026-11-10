import { ArrowRight, CalendarClock, CheckCircle2, ChevronRight, Coins, FilePenLine, Megaphone, Plus, Radio, Rocket } from "lucide-react"
import { toast } from "sonner"
import { EmptyState, PageHeader, PageTabs, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { date, money, shortDate } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { contentKits, disclosure, type Campaign } from "@/partner/marketing"
import { partnerStatus } from "@/partner/usePartner"
import { useMarketing } from "@/partner/useMarketing"
import { StageTag } from "@/partner/bits"
import { CampaignBadge, LockedClaims, MdfBadge, stat, TrackedLink } from "@/partner/screens/mkt/bits"

type Tab = "running" | "drafts" | "ended"

function CampaignRow({ c }: { c: Campaign }) {
  const m = useMarketing()
  const s = m.stats[c.id]
  const kit = contentKits.find((k) => k.id === c.kitId)
  return (
    <li className="border-b last:border-0">
      <a href={`#/p/campaign/${c.id}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-4 hover:bg-muted/50 sm:px-6 md:grid-cols-[minmax(0,1.7fr)_90px_80px_120px_120px_20px]">
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2"><b className="text-[16px] text-foreground">{c.name}</b><CampaignBadge c={c} /></span>
          <span className="mt-0.5 block truncate text-[14px] text-muted-foreground">{kit?.title} · {c.channels.join(", ")} · {shortDate(c.start)} to {shortDate(c.end)}</span>
        </span>
        <span className="hidden text-right tabular md:block"><b className="block text-foreground">{stat(c.clicks)}</b><span className="text-[13px] text-muted-foreground">clicks</span></span>
        <span className="hidden text-right tabular md:block"><b className="block text-foreground">{s.leadCount}</b><span className="text-[13px] text-muted-foreground">leads</span></span>
        <span className="hidden text-right tabular md:block"><b className="block text-foreground">{money(s.pipeline)}</b><span className="text-[13px] text-muted-foreground">open pipeline</span></span>
        <span className="hidden text-right tabular md:block"><b className="block text-foreground">{money(s.wonValue)}</b><span className="text-[13px] text-muted-foreground">won</span></span>
        <ChevronRight className="size-5 text-muted-foreground" />
        <span className="col-span-2 text-[14px] text-muted-foreground md:hidden">{stat(c.clicks)} clicks · {s.leadCount} leads · {money(s.pipeline)} pipeline · {money(s.wonValue)} won</span>
      </a>
    </li>
  )
}

export function Campaigns({ tab }: { tab?: string }) {
  const m = useMarketing()
  const t = (["running", "drafts", "ended"].includes(tab ?? "") ? tab : "running") as Tab
  const groups: Record<Tab, Campaign[]> = {
    running: m.campaigns.filter((c) => c.status === "live" || c.status === "scheduled"),
    drafts: m.campaigns.filter((c) => c.status === "draft"),
    ended: m.campaigns.filter((c) => c.status === "ended"),
  }
  return (
    <div>
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">Your campaigns <StageTag /></span>}
        sub="Each one uses a Brightline-approved kit and your own tracked link, so the leads and deals it produces are counted for you."
        actions={<Button size="lg" onClick={() => go("/p/launch")}><Plus /> Launch a campaign</Button>}
      />
      <PageTabs
        label="Campaign views"
        value={t}
        onChange={(v) => go(`/p/campaigns/${v}`)}
        items={[
          { value: "running", label: "Live and scheduled", icon: <Radio />, count: groups.running.length },
          { value: "drafts", label: "Drafts", icon: <FilePenLine />, count: groups.drafts.length },
          { value: "ended", label: "Ended", icon: <CheckCircle2 />, count: groups.ended.length },
        ]}
      />
      <Panel bodyClass="p-0 sm:p-0">
        {groups[t].length ? (
          <ul>
            <li aria-hidden className="hidden gap-x-4 border-b bg-surface-2/60 px-6 py-3 text-[14px] font-medium text-muted-foreground md:grid md:grid-cols-[minmax(0,1.7fr)_90px_80px_120px_120px_20px]">
              <span>Campaign</span><span className="text-right">Clicks</span><span className="text-right">Leads</span><span className="text-right">Pipeline</span><span className="text-right">Won</span><span />
            </li>
            {groups[t].map((c) => <CampaignRow key={c.id} c={c} />)}
          </ul>
        ) : (
          <EmptyState icon={<Megaphone className="size-6" />} title="Nothing here" body="Launch a campaign from a Brightline kit in three steps." action={<Button onClick={() => go("/p/launch")}><Plus /> Launch a campaign</Button>} />
        )}
      </Panel>
      <p className="mt-4 text-[14px] text-muted-foreground">Pipeline counts deals Ridgeway's reps registered from your campaign leads that are still open. Won counts closed-won deals, matched to Salesforce.</p>
    </div>
  )
}

function Funnel({ steps }: { steps: { label: string; value: number; note?: string }[] }) {
  const max = Math.max(...steps.map((s) => s.value), 1)
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => (
        <li key={s.label}>
          <div className="flex items-baseline justify-between gap-3 text-[15px]">
            <span className="text-foreground">{s.label}</span>
            <span className="font-semibold text-foreground tabular">
              {stat(s.value)}
              {s.note ? <span className="ml-2 text-[13px] font-normal text-muted-foreground">{s.note}</span> : i > 0 && steps[i - 1].value > 0 && <span className="ml-2 text-[13px] font-normal text-muted-foreground">{Math.round((s.value / steps[i - 1].value) * 1000) / 10}%</span>}
            </span>
          </div>
          <div className="mt-1.5 h-2.5 rounded-full bg-muted"><div className={cn("h-full rounded-full", i === 3 ? "bg-ok" : "bg-primary")} style={{ width: `${Math.max(3, (s.value / max) * 100)}%` }} /></div>
        </li>
      ))}
    </ol>
  )
}

export function CampaignDetail({ id }: { id?: string }) {
  const { state, dispatch } = useStore()
  const m = useMarketing()
  const c = m.campaigns.find((x) => x.id === id)
  if (!c) return (
    <div>
      <PageHeader title="Campaign" back={{ label: "Campaigns", href: "/p/campaigns" }} />
      <Panel><EmptyState title="We couldn't find that campaign" body="You see only the campaigns you run." /></Panel>
    </div>
  )
  const s = m.stats[c.id]
  const kit = contentKits.find((k) => k.id === c.kitId)!
  const mdf = c.mdfId ? state.mdf.find((x) => x.id === c.mdfId) : undefined
  const launch = () => {
    const status = c.start > "2026-10-28" ? "scheduled" : "live"
    dispatch({ type: "launchCampaign", campaign: { ...c, status, note: undefined } })
    toast.success(status === "live" ? `${c.name} is live` : `${c.name} is scheduled`, { description: "Your tracked link is ready. Leads from it land in Leads." })
  }
  return (
    <div>
      <PageHeader
        back={{ label: "Campaigns", href: "/p/campaigns" }}
        title={<span className="flex flex-wrap items-center gap-3">{c.name} <CampaignBadge c={c} /></span>}
        sub={<>{kit.title} kit · {c.channels.join(", ")} · {date(c.start)} to {date(c.end)}</>}
        actions={c.status === "draft" ? <Button size="lg" onClick={launch}><Rocket /> {c.start > "2026-10-28" ? "Schedule it" : "Launch now"}</Button> : undefined}
      />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title="What it produced" sub="Counted from your tracked link. Brightline sees these totals, never who you sent it to.">
            {c.status === "draft" ? <p className="text-muted-foreground">Nothing yet: the campaign isn't live.</p> : (
              <Funnel steps={[
                { label: "Clicks on your link", value: c.clicks },
                { label: "Leads", value: s.leadCount },
                { label: "Deals registered", value: s.regs.length },
                { label: "Deals won", value: s.won.length, note: money(s.wonValue) },
              ]} />
            )}
          </Panel>
          <Panel title="Deals from this campaign" sub="Registered by Ridgeway's reps from your leads. You see the deal, not its credit or terms." bodyClass="px-0 sm:px-0 pb-1 pt-1">
            {s.regs.length ? (
              <ul>
                {s.regs.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 border-t px-5 py-3.5 first:border-t-0 sm:px-6">
                    <span className="min-w-0 flex-1"><b className="block text-foreground">{r.customer}</b><span className="text-[14px] text-muted-foreground">{r.product} · {r.rep}</span></span>
                    <Badge className={cn("border-0", partnerStatus(r).cls)}>{partnerStatus(r).label}</Badge>
                    <b className="w-[96px] text-right text-foreground tabular">{money(r.value)}</b>
                  </li>
                ))}
              </ul>
            ) : <p className="px-6 pb-4 text-muted-foreground">No deals yet. When a rep registers one of your leads, it shows here.</p>}
          </Panel>
          <Panel title="Leads from this campaign" action={<Button variant="ghost" onClick={() => go("/p/leads")}>Leads <ArrowRight /></Button>} bodyClass="px-0 sm:px-0 pb-1 pt-1">
            {s.leads.length ? (
              <ul>
                {s.leads.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center gap-3 border-t px-5 py-3.5 first:border-t-0 sm:px-6">
                    <span className="min-w-0 flex-1"><b className="block text-foreground">{l.company}</b><span className="text-[14px] text-muted-foreground">{l.activity}</span></span>
                    <Badge variant="secondary">{l.status === "new" ? "To hand off" : l.status === "with_rep" ? `With ${l.assignee}` : l.status === "converted" ? `Registered by ${l.assignee}` : "Returned"}</Badge>
                  </li>
                ))}
              </ul>
            ) : <p className="px-6 pb-4 text-muted-foreground">{c.earlierLeads ? `${c.earlierLeads} leads, all handed off and closed out.` : "No leads yet."}</p>}
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Your tracked link" sub="Use it everywhere you share this campaign">
            <TrackedLink link={c.link} />
          </Panel>
          <Panel title="What's published" sub={`${kit.pieces.length} pieces from Brightline's kit, with Ridgeway's logo in the approved area`}>
            <ul className="mb-4 space-y-1.5">{kit.pieces.map((p) => <li key={p.title} className="flex gap-2 text-[15px]"><span className="w-[118px] shrink-0 text-muted-foreground">{p.kind}</span><span className="text-foreground">{p.title}</span></li>)}</ul>
            <LockedClaims claims={kit.claims} disclosure={disclosure} />
          </Panel>
          <Panel title="Funds" sub="Market development funds for this campaign">
            {mdf ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2"><b className="text-[20px] text-foreground tabular">{money(mdf.amount)}</b><MdfBadge m={mdf} /></div>
                <p className="text-[14.5px] text-muted-foreground">{mdf.activity}</p>
                <Button variant="outline" className="mt-1" onClick={() => go("/p/funds")}><Coins /> Open funds</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[15px] text-muted-foreground">No funds on this campaign. You can still ask for some before it ends.</p>
                {c.status !== "ended" && <Button variant="outline" onClick={() => go(`/p/funds/request/${c.id}`)}><Coins /> Request funds</Button>}
              </div>
            )}
          </Panel>
          {c.status === "scheduled" && <p className="flex gap-2 text-[14.5px] text-muted-foreground"><CalendarClock className="mt-0.5 size-4 shrink-0" /> Goes live on {date(c.start)}. Registrations so far count toward its results.</p>}
        </div>
      </div>
    </div>
  )
}
