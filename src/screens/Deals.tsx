import { useMemo, useState } from "react"
import { ArrowRight, Bell, Bot, Briefcase, ChevronRight, Clock3, Inbox, Search, Send, Sparkles, Trophy, UserCheck, Wallet, X } from "lucide-react"
import { toast } from "sonner"
import { EmptyState, PageHeader, PageTabs, Panel, PartnerAvatar, RegStateBadge, SalesforceMark, SourceTag } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Lead, Registration } from "@/data/model"
import { ago, date, hoursLeft, money, moneyShort, NOW, shortDate } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { slaPct, useStore } from "@/store"

export const daysUntil = (iso: string) => Math.ceil((new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).getTime() - NOW.getTime()) / 86_400_000)

type Filter = "all" | "needs_you" | "active" | "won" | "closed" | "rejected"

const filterOf = (r: Registration): Filter[] => {
  if (r.state === "under_review" || r.state === "info_requested") return ["needs_you"]
  if (r.state === "approved") return ["active"]
  if (r.state === "won") return ["won"]
  if (r.state === "lost" || r.state === "expired") return ["closed"]
  if (r.state === "rejected") return ["rejected"]
  return []
}

/** The one thing to know about a deal right now, in plain words. */
function useNextStep() {
  const { state } = useStore()
  return (r: Registration): { text: string; tone: "bad" | "amber" | "muted" | "ok" } => {
    if (r.state === "under_review") return { text: `Decide · ${hoursLeft(r.slaHours - r.usedHours)}`, tone: slaPct(r) >= 80 ? "bad" : "amber" }
    if (r.state === "info_requested") return { text: `Waiting on ${r.rep}`, tone: "muted" }
    if (r.state === "approved" && r.protectedUntil) {
      const d = daysUntil(r.protectedUntil)
      const asked = state.extensions.some((e) => e.registrationId === r.id && e.status === "pending")
      if (asked) return { text: `Extension requested · ends in ${d} days`, tone: "amber" }
      if (d <= 21) return { text: `Protection ends in ${d} days`, tone: "amber" }
      return { text: `Closes ${shortDate(r.closeDate)}`, tone: "muted" }
    }
    if (r.state === "won") return { text: `Won ${shortDate(r.closeDate)}`, tone: "ok" }
    if (r.state === "lost") return { text: r.lostReason ?? "Lost", tone: "muted" }
    if (r.state === "expired") return { text: `Expired ${r.protectedUntil ? shortDate(r.protectedUntil) : ""}`, tone: "muted" }
    if (r.state === "rejected") return { text: r.decision?.reason ?? "Rejected", tone: "muted" }
    return { text: "", tone: "muted" }
  }
}

const toneClass = { bad: "text-bad", amber: "text-amber-ink", muted: "text-muted-foreground", ok: "text-ok" }

export function DealsList({ rows, showPartner = true }: { rows: Registration[]; showPartner?: boolean }) {
  const { partner } = useStore()
  const next = useNextStep()
  const cols = showPartner ? "md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)_110px_minmax(0,1fr)_minmax(0,1.2fr)_20px]" : "md:grid-cols-[minmax(0,1.6fr)_110px_minmax(0,1fr)_minmax(0,1.3fr)_20px]"
  return (
    <div>
      <div className={cn("hidden gap-4 border-b px-6 py-3 text-[14px] font-medium text-muted-foreground md:grid", cols)}>
        <span>Deal</span>{showPartner && <span>Partner</span>}<span className="text-right">Value</span><span>Status</span><span>Next step</span><span />
      </div>
      <ul>
        {rows.map((r) => {
          const p = partner(r.partnerId)!
          const n = next(r)
          return (
            <li key={r.id} className="border-b last:border-0">
              <a href={`#/registration/${r.id}`} className={cn("grid items-center gap-x-4 gap-y-2 px-5 py-4 hover:bg-muted/50 sm:px-6", cols)}>
                <span className="min-w-0">
                  <b className="block truncate text-[16px] text-foreground">{r.customer}</b>
                  <span className="block truncate text-[14px] text-muted-foreground">{r.product}</span>
                </span>
                {showPartner && (
                  <span className="flex min-w-0 items-center gap-2.5">
                    <PartnerAvatar name={p.name} size="sm" />
                    <span className="truncate text-[15px] text-foreground">{p.name}</span>
                  </span>
                )}
                <span className="text-[16px] font-semibold text-foreground tabular md:text-right">{money(r.value)}</span>
                <span className="flex flex-wrap items-center gap-2">
                  <RegStateBadge reg={r} />
                  {r.decision?.action === "approved" && r.state !== "approved" && (
                    <span className="inline-flex items-center gap-1 text-[13.5px] text-muted-foreground">
                      {r.decision.by === "rules" ? <><Bot className="size-3.5" /> Auto-approved</> : <><UserCheck className="size-3.5" /> Approved by {r.decision.actor ?? "you"}</>}
                    </span>
                  )}
                  {r.decision?.action === "approved" && r.state === "approved" && r.decision.by === "you" && (
                    <span className="inline-flex items-center gap-1 text-[13.5px] text-muted-foreground"><UserCheck className="size-3.5" /> by you</span>
                  )}
                  {r.crmStage && r.state === "approved" && (
                    <span className="inline-flex items-center gap-1 text-[13.5px] text-muted-foreground"><SalesforceMark className="h-3 w-4" />{r.crmStage}</span>
                  )}
                </span>
                <span className={cn("text-[14.5px] font-medium", toneClass[n.tone])}>{n.text}</span>
                <ChevronRight className="hidden size-4 text-muted-foreground md:block" />
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function Deals({ tab = "deals" }: { tab?: string }) {
  const { state } = useStore()
  const leadsWaiting = state.leads.filter((l) => l.status === "new" || l.status === "declined" || l.status === "expired").length
  return (
    <div>
      <PageHeader title="Deals & leads" sub="Every deal and lead from your partners, in one place." />
      <PageTabs
        label="Deals and leads"
        value={tab}
        onChange={(v) => go(`/deals/${v}`)}
        items={[
          { value: "deals", label: "Deals", icon: <Briefcase />, count: state.registrations.filter((r) => state.partners.find((p) => p.id === r.partnerId)?.assigned).length, tone: "neutral", hint: "All registered deals, from first registration to won or lost. Select a deal to open it." },
          { value: "leads", label: "Leads", icon: <Inbox />, count: leadsWaiting, tone: "action", hint: "Leads Brightline hands to your partners. Partners have 48 hours to accept. Lead sharing arrives in Stage 2 (DR-12)." },
        ]}
      />
      {tab === "leads" ? <Leads /> : <DealsTab />}
    </div>
  )
}

function DealsTab() {
  const { state } = useStore()
  const mine = useMemo(() => state.registrations.filter((r) => state.partners.find((p) => p.id === r.partnerId)?.assigned), [state])
  const [filter, setFilter] = useState<Filter>("all")
  const [text, setText] = useState("")
  const [pid, setPid] = useState("all")
  const [sort, setSort] = useState("priority")
  const [by, setBy] = useState<"all" | "rules" | "you">("all")

  const open = mine.filter((r) => ["approved", "under_review", "info_requested"].includes(r.state))
  const ending = mine.filter((r) => r.state === "approved" && r.protectedUntil && daysUntil(r.protectedUntil) <= 21)
  const won = mine.filter((r) => r.state === "won")
  const needs = mine.filter((r) => filterOf(r).includes("needs_you"))

  const counts: Record<Filter, number> = {
    all: mine.length,
    needs_you: needs.length,
    active: mine.filter((r) => r.state === "approved").length,
    won: won.length,
    closed: mine.filter((r) => r.state === "lost" || r.state === "expired").length,
    rejected: mine.filter((r) => r.state === "rejected").length,
  }

  const rows = useMemo(() => {
    const t = text.trim().toLowerCase()
    const list = mine.filter(
      (r) =>
        (filter === "all" || filterOf(r).includes(filter)) &&
        (pid === "all" || r.partnerId === pid) &&
        (by === "all" || (r.decision?.action === "approved" && r.decision.by === by)) &&
        (!t || `${r.customer} ${r.product} ${r.id} ${r.rep}`.toLowerCase().includes(t)),
    )
    const rank = (r: Registration) => (r.state === "under_review" ? 0 : r.state === "info_requested" ? 1 : r.state === "approved" ? 2 : r.state === "won" ? 3 : 4)
    return [...list].sort((a, b) => {
      if (sort === "value") return b.value - a.value
      if (sort === "newest") return b.submittedAt.localeCompare(a.submittedAt)
      if (sort === "close") return a.closeDate.localeCompare(b.closeDate)
      // Needs you first (most urgent SLA), then live deals by close date, then closed ones.
      return rank(a) - rank(b) || (rank(a) === 0 ? slaPct(b) - slaPct(a) : rank(a) >= 3 ? b.closeDate.localeCompare(a.closeDate) : a.closeDate.localeCompare(b.closeDate))
    })
  }, [mine, filter, text, pid, sort, by])

  const chips: { v: Filter; label: string }[] = [
    { v: "all", label: "All" },
    { v: "needs_you", label: "Needs you" },
    { v: "active", label: "In progress" },
    { v: "won", label: "Won" },
    { v: "closed", label: "Lost or expired" },
    { v: "rejected", label: "Rejected" },
  ]
  const partners = state.partners.filter((p) => p.assigned && p.status === "active")

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Summary icon={<Wallet />} k="Open pipeline" v={moneyShort(open.reduce((n, r) => n + r.value, 0))} sub={`${open.length} deals`} onClick={() => setFilter("active")} />
        <Summary icon={<Inbox />} k="Needs you" v={String(needs.length)} sub="Decide or chase" tone={needs.length ? "amber" : undefined} onClick={() => setFilter("needs_you")} />
        <Summary icon={<Clock3 />} k="Protection ending" v={String(ending.length)} sub="Within 3 weeks" onClick={() => setFilter("active")} />
        <Summary icon={<Trophy />} k="Won this quarter" v={moneyShort(won.reduce((n, r) => n + r.value, 0))} sub={`${won.length} deals`} onClick={() => setFilter("won")} />
      </div>

      <Panel bodyClass="p-0 sm:p-0">
        <div className="space-y-3 border-b p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Search deals</span>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground" />
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Search by customer, product or rep"
                className="h-11 w-full rounded-[12px] border bg-card pr-3 pl-11 text-[15.5px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-primary/20"
              />
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex">
              <Select value={pid} onValueChange={setPid}>
                <SelectTrigger className="h-11! w-full lg:w-52" aria-label="Partner"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All my partners</SelectItem>
                  {partners.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={by} onValueChange={(v) => setBy(v as typeof by)}>
                <SelectTrigger className={cn("h-11! w-full lg:w-48", by !== "all" && "border-primary text-primary")} aria-label="Approved by"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Approved by anyone</SelectItem>
                  <SelectItem value="rules">Auto-approved</SelectItem>
                  <SelectItem value="you">Approved by you</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-11! w-full col-span-2 sm:col-span-1 lg:w-48" aria-label="Sort"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Needs you first</SelectItem>
                  <SelectItem value="close">Closing soonest</SelectItem>
                  <SelectItem value="value">Highest value</SelectItem>
                  <SelectItem value="newest">Newest first</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 [scrollbar-width:none]" role="radiogroup" aria-label="Status">
            {chips.map((c) => (
              <button
                key={c.v}
                role="radio"
                aria-checked={filter === c.v}
                onClick={() => setFilter(c.v)}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[14.5px] font-medium transition",
                  filter === c.v ? "border-primary bg-brand-soft text-primary" : "bg-card text-foreground hover:border-border-strong",
                )}
              >
                {c.label}
                <span className={cn("text-[13px] tabular", filter === c.v ? "text-primary" : "text-muted-foreground")}>{counts[c.v]}</span>
              </button>
            ))}
          </div>
        </div>
        {rows.length ? (
          <DealsList rows={rows} />
        ) : (
          <EmptyState
            icon={<Search className="size-6" />}
            title="No deals match"
            body="Try another status or partner."
            action={<Button variant="outline" onClick={() => { setFilter("all"); setText(""); setPid("all"); setBy("all") }}><X /> Clear filters</Button>}
          />
        )}
      </Panel>
    </div>
  )
}

function Summary({ icon, k, v, sub, tone, onClick }: { icon: React.ReactNode; k: string; v: string; sub: string; tone?: "amber"; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex items-start gap-3 rounded-[14px] border bg-card p-4 text-left shadow-[0_1px_2px_#172b4508] transition hover:border-primary/60 sm:p-5", tone === "amber" && "border-amber/60")}>
      <span className="hidden size-10 shrink-0 place-items-center rounded-[10px] bg-brand-soft text-primary sm:grid [&_svg]:size-5">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[14.5px] text-muted-foreground">{k}</span>
        <span className={cn("block text-[26px] leading-tight font-bold text-foreground tabular", tone === "amber" && "text-amber-ink")}>{v}</span>
        <span className="block text-[13.5px] text-muted-foreground">{sub}</span>
      </span>
    </button>
  )
}

/* ---------- Leads ---------- */

function Leads() {
  const { state } = useStore()
  const [sending, setSending] = useState<Lead | null>(null)
  const mine = (l: Lead) => !l.partnerId || state.partners.find((p) => p.id === l.partnerId)?.assigned
  const needs = state.leads.filter((l) => mine(l) && (l.status === "new" || l.status === "declined" || l.status === "expired"))
  const waiting = state.leads.filter((l) => mine(l) && l.status === "offered")
  const taken = state.leads.filter((l) => mine(l) && (l.status === "accepted" || l.status === "converted"))

  return (
    <div className="space-y-6">
      <LeadGroup title="Needs a partner" sub="New leads, and ones a partner declined or let expire" count={needs.length} tone="amber">
        {needs.length ? needs.map((l) => <LeadRow key={l.id} lead={l} onSend={() => setSending(l)} />) : <p className="px-6 py-5 text-muted-foreground">Every lead has a partner.</p>}
      </LeadGroup>
      <LeadGroup title="Waiting for the partner to accept" sub="Partners have 48 hours, then the lead comes back here" count={waiting.length}>
        {waiting.length ? waiting.map((l) => <LeadRow key={l.id} lead={l} onSend={() => setSending(l)} />) : <p className="px-6 py-5 text-muted-foreground">Nothing waiting.</p>}
      </LeadGroup>
      <LeadGroup title="Accepted" sub="Partners working these leads" count={taken.length}>
        {taken.map((l) => <LeadRow key={l.id} lead={l} onSend={() => setSending(l)} />)}
      </LeadGroup>
      {sending && <SendLeadDialog lead={sending} onClose={() => setSending(null)} />}
    </div>
  )
}

function LeadGroup({ title, sub, count, tone, children }: { title: string; sub: string; count: number; tone?: "amber"; children: React.ReactNode }) {
  return (
    <Panel
      title={<span className="flex items-center gap-2">{title} <span className={cn("grid min-w-6 place-items-center rounded-full px-1.5 text-[13px] leading-6 font-bold", tone === "amber" && count ? "bg-amber text-[#2a1a00]" : "bg-muted text-muted-foreground")}>{count}</span></span>}
      sub={sub}
      bodyClass="px-0 sm:px-0 pb-1"
    >
      <ul>{children}</ul>
    </Panel>
  )
}

function LeadRow({ lead: l, onSend }: { lead: Lead; onSend: () => void }) {
  const { dispatch, partner } = useStore()
  const p = l.partnerId ? partner(l.partnerId) : undefined
  const s = l.suggestion ? partner(l.suggestion.partnerId) : undefined
  const left = l.acceptBy ? (new Date(l.acceptBy).getTime() - NOW.getTime()) / 3_600_000 : 0

  let status: React.ReactNode = null
  if (l.status === "declined") status = <span className="text-bad">{p?.name} declined: {l.declineReason}</span>
  if (l.status === "expired") status = <span className="text-bad">{p?.name} didn't accept in 48 hours</span>
  if (l.status === "offered") status = <span className={left < 12 ? "text-amber-ink" : "text-foreground"}>Sent to {p?.name} · {hoursLeft(left).replace("left", "to accept")}</span>
  if (l.status === "accepted") status = <span className="text-foreground">{p?.name}: {l.update}</span>
  if (l.status === "converted") status = <span className="text-ok">{p?.name} registered it as a deal</span>

  return (
    <li className="border-t first:border-t-0">
      <div className="grid gap-4 px-5 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <p className="text-[16px] font-semibold text-foreground">{l.company} <span className="font-normal text-muted-foreground">· ~{money(l.estValue)}</span></p>
          <p className="text-[14px] text-muted-foreground">{l.contact}, {l.title} · {l.product} · {ago(l.receivedAt)}</p>
          <SourceTag source={l.source} className="mt-1.5" />
        </div>
        <div className="min-w-0 text-[14.5px]">
          {status && <p className="font-medium">{status}</p>}
          {(l.status === "new" || l.status === "declined" || l.status === "expired") && s && (
            <p className="mt-0.5 flex gap-1.5 text-muted-foreground">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
              <span><b className="text-foreground">Suggested: {s.name}.</b> {l.suggestion!.why}</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {(l.status === "new" || l.status === "declined" || l.status === "expired") && s && (
            <Button
              onClick={() => {
                dispatch({ type: "sendLead", id: l.id, partnerId: s.id })
                toast.success(`Sent to ${s.name}`, { description: "They have 48 hours to accept." })
              }}
            >
              <Send /> Send to {s.name.split(" ")[0]}
            </Button>
          )}
          {(l.status === "new" || l.status === "declined" || l.status === "expired") && (
            <Button variant="outline" onClick={onSend}>{s ? "Choose another" : "Choose partner"}</Button>
          )}
          {l.status === "offered" && (
            <>
              <Button variant="outline" onClick={() => toast.success(`Reminder sent to ${p?.contact.name}`)}><Bell /> Remind</Button>
              <Button variant="ghost" onClick={onSend}>Reassign</Button>
            </>
          )}
          {l.status === "converted" && l.registrationId && (
            <Button variant="outline" onClick={() => go(`/registration/${l.registrationId}`)}>Open deal <ArrowRight /></Button>
          )}
          {l.status === "accepted" && p && <Badge variant="secondary">Accepted {l.sentAt ? date(l.sentAt, { month: "short", day: "numeric" }) : ""}</Badge>}
        </div>
      </div>
    </li>
  )
}

function SendLeadDialog({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { state, dispatch, partner } = useStore()
  const options = state.partners.filter((p) => p.assigned && p.status === "active" && p.id !== lead.partnerId)
  const [pid, setPid] = useState(lead.suggestion && lead.suggestion.partnerId !== lead.partnerId ? lead.suggestion.partnerId : options[0]?.id ?? "")
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send {lead.company} to a partner</DialogTitle>
          <DialogDescription>~{money(lead.estValue)} · {lead.product} · {lead.contact}, {lead.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="text-[15px]">Partner</Label>
          <Select value={pid} onValueChange={setPid}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {options.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}{lead.suggestion?.partnerId === p.id ? " · suggested" : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {lead.suggestion?.partnerId === pid && <p className="flex gap-1.5 text-[14px] text-muted-foreground"><Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />{lead.suggestion.why}</p>}
        </div>
        <p className="rounded-[10px] bg-muted px-3 py-2.5 text-[14.5px]">{partner(pid)?.name} gets the lead by email and in their copilot, and has 48 hours to accept.</p>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!pid}
            onClick={() => {
              dispatch({ type: "sendLead", id: lead.id, partnerId: pid })
              toast.success(`Sent to ${partner(pid)?.name}`, { description: "They have 48 hours to accept." })
              onClose()
            }}
          >
            <Send /> Send lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
