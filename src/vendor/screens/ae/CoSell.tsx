import { useState } from "react"
import { ArrowRight, Check, ChevronRight, Clock3, EyeOff, Handshake, Lock, Send, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { AiTag, Confidence, EmptyState, PageHeader, Panel, PartnerAvatar } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { PartnerRole } from "@/data/model"
import { NOW, ago, date, money } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { StageTag } from "@/partner/bits"
import { sellerAccounts, type Candidate, type CoSellRequest } from "@/vendor/data"
import { partnerNameOf, useCandidates, useSeller, useVendor } from "@/vendor/useVendor"

const statusBadge = (c: CoSellRequest) =>
  c.status === "accepted" ? <Badge className="border-0 bg-ok-soft text-ok"><Check /> Accepted</Badge>
    : c.status === "declined" ? <Badge className="border-0 bg-bad-soft text-bad">Declined</Badge>
      : <Badge className="border-0 bg-brand-soft text-primary"><Clock3 /> Waiting</Badge>

/** Every co-sell request Sam has sent, and the accounts that still need a partner. */
export function CoSellList() {
  const { state } = useStore()
  const s = useSeller()
  const list = [...state.cosell].sort((a, b) => b.sentAt.localeCompare(a.sentAt))
  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">Co-sell <StageTag /></span>}
        sub="Bring the right partner onto a deal. The co-sell agent ranks partners with reasons and drafts the request; you always send it. Partners see no account detail until they accept."
        actions={<Button onClick={() => go("/v/find")}><Handshake /> Find a partner</Button>}
      />
      {s.needPartner.length > 0 && (
        <Panel title="Deals that need a partner">
          <ul className="grid gap-3 md:grid-cols-2">
            {s.needPartner.map((v) => (
              <li key={v.a.id} className="flex flex-col rounded-[12px] border p-4">
                <b className="text-[16px] text-foreground">{v.a.name}</b>
                <span className="text-[14px] text-muted-foreground">{v.a.product} · {money(v.a.value)} · {v.a.stage}</span>
                <span className="mt-2 text-[14.5px] text-foreground">{v.a.need}</span>
                <Button className="mt-3 self-start" onClick={() => go(`/v/find/${v.a.id}`)}>Find a partner <ArrowRight /></Button>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <Panel title="Requests you've sent" bodyClass="px-0 sm:px-0 pb-1">
        {list.length === 0 ? <EmptyState title="Nothing sent yet" /> : (
          <ul>
            {list.map((c) => {
              const a = sellerAccounts.find((x) => x.id === c.accountId)!
              return (
                <li key={c.id} className="border-t">
                  <a href={`#/v/account/${a.id}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-4 hover:bg-muted/50 sm:px-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_140px_130px_20px]">
                    <span className="min-w-0"><b className="block truncate text-foreground">{a.name}</b><span className="text-[14px] text-muted-foreground">{c.role} · sent {ago(c.sentAt)}</span></span>
                    <span className="hidden min-w-0 md:block"><span className="block truncate text-foreground">{partnerNameOf(state, c.partnerId)}</span><span className="text-[14px] text-muted-foreground">to {c.contact}</span></span>
                    <span className="hidden text-[14px] text-muted-foreground md:block">{c.status === "sent" ? `Answer by ${date(c.respondBy, { month: "short", day: "numeric" })}` : c.status === "accepted" ? `${c.plan.filter((p) => p.done).length} of ${c.plan.length} plan steps done` : c.declineReason}</span>
                    <span>{statusBadge(c)}</span>
                    <ChevronRight className="hidden size-5 text-muted-foreground md:block" />
                  </a>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
    </div>
  )
}

function CandidateCard({ c, rank, active, onPick }: { c: Candidate; rank: number; active: boolean; onPick: () => void }) {
  const { state } = useStore()
  const p = state.partners.find((x) => x.id === c.partnerId)!
  return (
    <li>
      <button type="button" onClick={onPick} aria-pressed={active} className={cn("w-full rounded-[14px] border-2 bg-card p-4 text-left transition sm:p-5", active ? "border-primary bg-brand-soft/30" : "border-border hover:border-border-strong")}>
        <div className="flex items-start gap-3">
          <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-[14px] font-bold", rank === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{rank}</span>
          <PartnerAvatar name={p.name} className="hidden sm:inline-grid" />
          <span className="min-w-0 flex-1">
            <b className="block text-[17px] text-foreground">{p.name}</b>
            <span className="text-[14px] text-muted-foreground">{p.tier} {p.program.toLowerCase()} partner · {p.region}</span>
            <span className="mt-1.5 block sm:hidden"><Confidence value={c.score} /></span>
          </span>
          <span className="hidden shrink-0 sm:block"><Confidence value={c.score} /></span>
        </div>
        <ul className="mt-3 space-y-1 sm:pl-10">
          {c.reasons.map((r) => <li key={r} className="flex gap-2 text-[15px] text-foreground"><Check className="mt-1 size-4 shrink-0 text-ok" />{r}</li>)}
          {c.caution && <li className="flex gap-2 text-[15px] text-amber-ink"><TriangleAlert className="mt-1 size-4 shrink-0" />{c.caution}</li>}
        </ul>
      </button>
    </li>
  )
}

function Compose({ accountId, c, onSent }: { accountId: string; c: Candidate; onSent: () => void }) {
  const { state, dispatch } = useStore()
  const { me } = useVendor()
  const a = sellerAccounts.find((x) => x.id === accountId)!
  const [role, setRole] = useState<PartnerRole>(a.role ?? "Reseller")
  const [msg, setMsg] = useState(c.draft)
  const partner = partnerNameOf(state, c.partnerId)
  const send = () => {
    const req: CoSellRequest = {
      id: `CS-${7 + state.cosell.length - 1}`, accountId, partnerId: c.partnerId, contact: c.contact, role, from: me.name,
      sentAt: NOW.toISOString(), respondBy: new Date(NOW.getTime() + 48 * 3600 * 1000).toISOString(), message: msg.trim(), status: "sent", plan: [],
    }
    dispatch({ type: "sendCoSell", req })
    toast.success(`Sent to ${c.contact} at ${partner}`, { description: c.partnerId === "ridgeway" ? "Ridgeway answers in its partner portal. Sign in as Marcus Bell or Paul Okafor to accept it." : "They have 48 hours to accept or decline." })
    onSent()
  }
  return (
    <Panel title="Your request" sub="Edit anything. Nothing is sent until you press Send (R-CS-3)." className="xl:sticky xl:top-[92px]">
      <div className="grid gap-4">
        <p className="text-[15px] text-foreground">To <b>{c.contact}</b> at {partner}</p>
        <div className="grid gap-1.5">
          <Label className="text-[15px]">Their role on the deal</Label>
          <Select value={role} onValueChange={(v) => setRole(v as PartnerRole)}>
            <SelectTrigger className="h-11 w-full text-[15.5px]"><SelectValue /></SelectTrigger>
            <SelectContent>{(["Reseller", "Implementation", "Referral", "Technology"] as PartnerRole[]).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"><Label htmlFor="msg" className="text-[15px]">Message</Label><AiTag>Drafted by the co-sell agent</AiTag></span>
          <Textarea id="msg" value={msg} onChange={(e) => setMsg(e.target.value)} rows={6} className="text-[15.5px]" />
        </div>
        <div className="rounded-[12px] border border-dashed p-4">
          <p className="flex items-center gap-2 text-[14px] font-semibold text-muted-foreground"><EyeOff className="size-4" /> What {partner} sees before accepting</p>
          <dl className="mt-2 grid grid-cols-[100px_1fr] gap-y-1 text-[14.5px]">
            <dt className="text-muted-foreground">Industry</dt><dd className="text-foreground">{a.industry}</dd>
            <dt className="text-muted-foreground">Size</dt><dd className="text-foreground">{a.sizeBand}</dd>
            <dt className="text-muted-foreground">Region</dt><dd className="text-foreground">{a.region}</dd>
            <dt className="text-muted-foreground">Deal</dt><dd className="text-foreground">{a.product} · about {money(a.value)}</dd>
            <dt className="text-muted-foreground">Account</dt><dd className="inline-flex items-center gap-1.5 text-muted-foreground"><Lock className="size-3.5" /> Unlocks when they accept</dd>
          </dl>
        </div>
        <Button size="lg" className="h-12 text-[16px]" disabled={msg.trim().length < 10} onClick={send}><Send /> Send request</Button>
      </div>
    </Panel>
  )
}

/** J-03 co-sell: pick an account, see partners ranked with reasons, send in three taps. */
export function FindPartner({ accountId }: { accountId?: string }) {
  const { state } = useStore()
  const s = useSeller()
  const a = sellerAccounts.find((x) => x.id === accountId)
  const candidates = useCandidates(accountId ?? "")
  const [pick, setPick] = useState<string | null>(null)
  if (!a || !a.need) {
    return (
      <div className="space-y-6">
        <PageHeader back={{ label: "Co-sell", href: "/v/cosell" }} title="Find a partner" sub="Which deal needs a partner? Only your accounts are listed." />
        {s.needPartner.length === 0 ? <Panel><EmptyState icon={<Handshake className="size-6" />} title="Every deal that needs a partner has one" body="Requests you've sent are on the Co-sell page." action={<Button variant="outline" onClick={() => go("/v/cosell")}>Open Co-sell</Button>} /></Panel> : (
          <ul className="grid gap-4 md:grid-cols-2">
            {s.needPartner.map((v) => (
              <li key={v.a.id}>
                <button type="button" onClick={() => go(`/v/find/${v.a.id}`)} className="flex w-full flex-col rounded-[14px] border bg-card p-5 text-left shadow-[0_1px_2px_#172b4508] transition hover:border-primary/60">
                  <span className="flex items-center gap-3"><PartnerAvatar name={v.a.name} /><span><b className="block text-[17px] text-foreground">{v.a.name}</b><span className="text-[14px] text-muted-foreground">{v.a.product} · {money(v.a.value)}</span></span></span>
                  <span className="mt-3 text-[15px] text-foreground">{v.a.need}</span>
                  <span className="mt-3 inline-flex items-center gap-1 text-[15px] font-semibold text-primary">See ranked partners <ArrowRight className="size-4" /></span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
  const existing = state.cosell.find((c) => c.accountId === a.id && c.status !== "declined")
  const declinedBy = state.cosell.filter((c) => c.accountId === a.id && c.status === "declined").map((c) => c.partnerId)
  const ranked = candidates.filter((c) => !declinedBy.includes(c.partnerId))
  const chosen = ranked.find((c) => c.partnerId === pick)
  // On narrow screens the request sits below the list, so bring it into view.
  const choose = (id: string) => {
    setPick(id)
    if (window.innerWidth < 1280) setTimeout(() => document.getElementById("cosell-compose")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60)
  }
  return (
    <div>
      <PageHeader back={{ label: a.name, href: `/v/account/${a.id}` }} title={`Find a partner for ${a.name}`} sub={`Needs ${a.need.charAt(0).toLowerCase()}${a.need.slice(1)}. ${a.product} · ${money(a.value)} · ${a.region}.`} />
      {existing ? (
        <Panel><EmptyState icon={<Handshake className="size-6" />} title={`Already ${existing.status === "sent" ? "sent" : "accepted"}: ${partnerNameOf(state, existing.partnerId)}`} body="One partner at a time for each role. You can find another if they decline." action={<Button onClick={() => go(`/v/account/${a.id}`)}>Open {a.name}</Button>} /></Panel>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2"><AiTag>Co-sell agent</AiTag><span className="text-[14.5px] text-muted-foreground">Ranked by product fit, certifications, past wins, relationship and capacity (R-CS-2)</span></div>
            <ul className="space-y-3">{ranked.map((c, i) => <CandidateCard key={c.partnerId} c={c} rank={i + 1} active={pick === c.partnerId} onPick={() => choose(c.partnerId)} />)}</ul>
            <p className="text-[14px] text-muted-foreground">Partners see only overlap details before they accept: industry, size, region and deal size (R-CS-1, R-CS-4).</p>
          </div>
          {chosen ? <div id="cosell-compose" className="scroll-mt-24"><Compose key={chosen.partnerId} accountId={a.id} c={chosen} onSent={() => go(`/v/account/${a.id}`)} /></div> : (
            <Panel className="xl:sticky xl:top-[92px]"><EmptyState icon={<Handshake className="size-6" />} title="Pick a partner" body="Choose one on the left. The agent drafts the request; you check it and send." /></Panel>
          )}
        </div>
      )}
    </div>
  )
}
