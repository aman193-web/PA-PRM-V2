import { useState } from "react"
import { ArrowRight, Building2, CalendarDays, Check, ChevronRight, Clock3, Handshake, MessageSquarePlus, Plus, UserRound } from "lucide-react"
import { toast } from "sonner"
import { EmptyState, PageHeader, Panel, PartnerAvatar, SalesforceMark, SlaMeter } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ago, date, money, shortDate } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import type { Registration } from "@/data/model"
import { StageTag } from "@/partner/bits"
import type { CoSellRequest } from "@/vendor/data"
import { TODAY, partnerNameOf, useSeller, useVendor, type AccountView } from "@/vendor/useVendor"

/** One line saying where partner involvement on an account stands. */
export function AccountStatus({ v }: { v: AccountView }) {
  const review = v.regs.find((r) => r.state === "under_review" || r.state === "info_requested")
  if (review) return <Badge className="border-0 bg-amber-soft text-amber-ink">Partner deal in review</Badge>
  if (v.active?.status === "sent") return <Badge className="border-0 bg-brand-soft text-primary"><Clock3 /> Co-sell sent</Badge>
  if (v.partners.length) return <Badge className="border-0 bg-ok-soft text-ok">{v.partners.length} partner{v.partners.length > 1 ? "s" : ""}</Badge>
  if (v.a.need) return <Badge variant="outline" className="border-dashed">No partner yet</Badge>
  return <Badge variant="secondary">Direct</Badge>
}

export function SellerAccounts() {
  const s = useSeller()
  return (
    <div>
      <PageHeader title="My accounts" sub={`Partner activity on your accounts only. Partners are on ${s.involved.length} of ${s.views.length}, worth ${money(s.involvedValue)}.`} />
      <Panel bodyClass="p-0 sm:p-0">
        <div className="hidden gap-x-4 border-b bg-surface-2/60 px-6 py-3 text-[14px] font-medium text-muted-foreground md:grid md:grid-cols-[minmax(0,1.3fr)_150px_120px_minmax(0,1.2fr)_170px_20px]">
          <span>Account</span><span>Stage</span><span className="text-right">Value</span><span>Partners</span><span>Status</span><span />
        </div>
        <ul>
          {s.views.map((v) => (
            <li key={v.a.id} className="border-b last:border-0">
              <a href={`#/v/account/${v.a.id}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 px-5 py-4 hover:bg-muted/50 sm:px-6 md:grid-cols-[minmax(0,1.3fr)_150px_120px_minmax(0,1.2fr)_170px_20px]">
                <span className="flex min-w-0 items-center gap-3">
                  <PartnerAvatar name={v.a.name} size="sm" />
                  <span className="min-w-0"><b className="block truncate text-[16px] text-foreground">{v.a.name}</b><span className="block truncate text-[14px] text-muted-foreground">{v.a.industry} · {v.a.hq}</span></span>
                </span>
                <span className="hidden text-[15px] text-foreground md:block">{v.opp?.stage ?? v.a.stage}</span>
                <b className="text-right text-foreground tabular">{money(v.a.value)}</b>
                <span className="col-span-2 truncate text-[14.5px] text-muted-foreground md:col-span-1">{v.partners.length ? v.partners.map((p) => `${p.name} (${p.role})`).join(", ") : "—"}</span>
                <span className="col-span-2 md:col-span-1"><AccountStatus v={v} /></span>
                <ChevronRight className="hidden size-5 text-muted-foreground md:block" />
              </a>
            </li>
          ))}
        </ul>
      </Panel>
      <p className="mt-4 text-[14px] text-muted-foreground">You see which partners are on your deals and what they did. Credit shares and partners' commercial terms stay with partner managers and the channel chief.</p>
    </div>
  )
}

/** Where a partner registration stands, as the seller sees it: the partner manager decides it. */
function SellerRegBadge({ r }: { r: Registration }) {
  const [label, cls] = r.state === "under_review" ? ["With Jordan Lee", "bg-amber-soft text-amber-ink"]
    : r.state === "info_requested" ? ["Waiting on the partner", "bg-amber-soft text-amber-ink"]
      : r.state === "approved" ? ["Approved", "bg-ok-soft text-ok"]
        : r.state === "won" ? ["Won", "bg-ok-soft text-ok"]
          : r.state === "rejected" ? ["Not approved", "bg-secondary text-foreground"]
            : [r.state.replace("_", " "), "bg-secondary text-foreground"]
  return <Badge className={cn("border-0", cls)}>{label}</Badge>
}

/** A partner registration on the seller's account: where it is, and a way to tell the partner manager what the seller knows. */
function RegistrationCard({ r, account }: { r: Registration; account: string }) {
  const { state, dispatch } = useStore()
  const { me } = useVendor()
  const [text, setText] = useState("")
  const notes = state.sellerNotes[r.id] ?? []
  const open = r.state === "under_review" || r.state === "info_requested"
  const send = () => {
    dispatch({ type: "sellerNote", regId: r.id, text: text.trim(), by: me.name })
    toast.success("Sent to Jordan Lee", { description: `It shows on the ${r.customer} registration, next to the conflict check.` })
    setText("")
  }
  return (
    <Panel title={<span className="flex flex-wrap items-center gap-2">{partnerNameOf(state, r.partnerId)} registered a deal <SellerRegBadge r={r} /></span>} sub={`${r.id} · by ${r.rep} · ${r.product}${r.state === "approved" || r.state === "won" ? ` · ${money(r.value)}` : " · value shown once approved"}`}>
      {open && (
        <div className="space-y-3">
          <p className="text-[15.5px] text-foreground">Jordan Lee, the partner manager, decides it. {r.conflict?.kind === "crm_opportunity" ? `It overlaps your opportunity ${r.conflict.ref}, so it couldn't be approved by rules.` : "It was held back for a person to check."}</p>
          <SlaMeter reg={r} />
          {r.ai && <p className="rounded-[12px] bg-brand-soft/50 px-4 py-3 text-[15px] text-foreground"><b>Deal Desk agent:</b> {r.ai.headline}.</p>}
        </div>
      )}
      {r.state === "approved" && <p className="text-[15.5px] text-foreground">Approved{r.decision?.actor ? ` by ${r.decision.actor}` : r.decision?.by === "rules" ? " by rules" : " by Jordan Lee"}. {partnerNameOf(state, r.partnerId)} is on {r.crm?.linked === "existing" ? "your opportunity" : "the opportunity"} as {r.crm?.role ?? "partner"}{r.protectedUntil ? `, protected until ${date(r.protectedUntil)}` : ""}.</p>}
      {r.state === "rejected" && <p className="text-[15.5px] text-foreground">Not approved{r.decision?.reason ? `: ${r.decision.reason}` : ""}. The account stays yours with no partner.</p>}
      {notes.length > 0 && (
        <ul className="mt-4 space-y-2">
          {notes.map((n) => <li key={n.at} className="rounded-[12px] border px-4 py-3 text-[15px]"><span className="block text-foreground">"{n.text}"</span><span className="text-[13.5px] text-muted-foreground">You told Jordan Lee · {ago(n.at)}</span></li>)}
        </ul>
      )}
      {open && (
        <div className="mt-4 grid gap-2">
          <Label htmlFor={`note-${r.id}`} className="text-[15px]">What do you know about {account}?</Label>
          <Textarea id={`note-${r.id}`} value={text} onChange={(e) => setText(e.target.value)} rows={3} className="text-[15.5px]" placeholder="e.g. I met Elena on Oct 16; Ridgeway was already in the room. Happy to work it with them." />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13.5px] text-muted-foreground">Jordan sees it on the registration. You can't decide it.</span>
            <Button disabled={text.trim().length < 5} onClick={send}><MessageSquarePlus /> Send to Jordan</Button>
          </div>
        </div>
      )}
    </Panel>
  )
}

/** The joint plan with the partner: owners and dates, editable by both sides (Stage 2). */
export function JointPlan({ c, owner }: { c: CoSellRequest; owner: string }) {
  const { dispatch } = useStore()
  const { me } = useVendor()
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState("")
  const [who, setWho] = useState(me.name)
  const [due, setDue] = useState("2026-11-15")
  const done = c.plan.filter((p) => p.done).length
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[14.5px] text-muted-foreground">{done} of {c.plan.length} done</span>
        <Button size="sm" variant="ghost" onClick={() => setAdding((x) => !x)}><Plus /> Add a step</Button>
      </div>
      <ul className="space-y-2">
        {c.plan.map((p) => {
          const late = !p.done && p.due < TODAY
          return (
            <li key={p.id}>
              <button type="button" onClick={() => dispatch({ type: "planToggle", id: c.id, stepId: p.id })} className="flex w-full items-start gap-3 rounded-[12px] border px-3.5 py-3 text-left hover:bg-muted/40" aria-pressed={p.done}>
                <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-[6px] border-2", p.done ? "border-ok bg-ok text-white" : "border-border-strong")}>{p.done && <Check className="size-3.5" strokeWidth={3} />}</span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-[15.5px]", p.done ? "text-muted-foreground line-through" : "text-foreground")}>{p.text}</span>
                  <span className="flex flex-wrap gap-x-3 text-[13.5px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><UserRound className="size-3.5" /> {p.owner}</span>
                    <span className={cn("inline-flex items-center gap-1", late && "font-semibold text-bad")}><CalendarDays className="size-3.5" /> {late ? "Overdue · " : ""}{shortDate(p.due)}</span>
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {adding && (
        <form className="mt-3 grid gap-2 rounded-[12px] border p-3" onSubmit={(e) => {
          e.preventDefault()
          dispatch({ type: "planAdd", id: c.id, step: { id: `p${Date.now()}`, text: text.trim(), owner: who, due, done: false } })
          toast.success("Step added", { description: `${who === me.name ? "You own it" : `${owner} sees it in the plan`}.` })
          setText(""); setAdding(false)
        }}>
          <Input value={text} onChange={(e) => setText(e.target.value)} className="h-11 text-[15.5px]" placeholder="What needs doing" aria-label="Step" />
          <div className="grid grid-cols-2 gap-2">
            <Select value={who} onValueChange={setWho}>
              <SelectTrigger className="h-11 w-full text-[15px]" aria-label="Owner"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={me.name}>{me.name}</SelectItem><SelectItem value={owner}>{owner}</SelectItem></SelectContent>
            </Select>
            <Input type="date" value={due} min={TODAY} onChange={(e) => setDue(e.target.value)} className="h-11 text-[15px]" aria-label="Due date" />
          </div>
          <Button type="submit" disabled={text.trim().length < 3}>Add to the plan</Button>
        </form>
      )}
    </div>
  )
}

export function SellerAccount({ id = "" }: { id?: string }) {
  const { state } = useStore()
  const s = useSeller()
  const v = s.views.find((x) => x.a.id === id)
  if (!v) return <div><PageHeader title="Account" back={{ label: "My accounts", href: "/v/accounts" }} /><Panel><EmptyState title="Not one of your accounts" body="You see partner activity on your own accounts only." /></Panel></div>
  const { a, opp, regs } = v
  const accepted = v.requests.find((c) => c.status === "accepted")
  const sent = v.requests.find((c) => c.status === "sent")
  const declined = v.requests.filter((c) => c.status === "declined")
  return (
    <div>
      <PageHeader
        back={{ label: "My accounts", href: "/v/accounts" }}
        title={<span className="flex flex-wrap items-center gap-3">{a.name} <AccountStatus v={v} /></span>}
        sub={`${a.industry} · ${a.employees.toLocaleString("en-US")} people · ${a.hq} · ${a.region}`}
      />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title={<span className="flex items-center gap-2"><SalesforceMark className="h-4" /> Your opportunity</span>} sub={a.oppId ? `${a.oppName} · ${a.oppId}` : "Not in Salesforce yet"}>
            <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[["Stage", opp?.stage ?? a.stage], ["Value", money(opp?.value ?? a.value)], ["Close date", date(opp?.closeDate ?? a.closeDate)], ["Product", a.product]].map(([k, val]) => (
                <div key={k} className="rounded-[12px] bg-muted/60 px-4 py-3"><dt className="text-[13.5px] text-muted-foreground">{k}</dt><dd className="font-semibold text-foreground">{val}</dd></div>
              ))}
            </dl>
            <p className="mt-3 text-[15px] text-muted-foreground">{a.note}</p>
          </Panel>

          {regs.map((r) => <RegistrationCard key={r.id} r={r} account={a.name} />)}

          <Panel title="Partners on this deal" sub="Their roles and what they did. Credit shares stay with partner managers.">
            {v.partners.length === 0 ? <p className="text-muted-foreground">No partner on this deal yet.</p> : (
              <ul className="space-y-3">
                {v.partners.map((p) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <PartnerAvatar name={p.name} size="sm" />
                    <span className="min-w-0 flex-1"><b className="block text-foreground">{p.name}</b><span className="text-[14px] text-muted-foreground">{state.partners.find((x) => x.id === p.id)?.tier} {state.partners.find((x) => x.id === p.id)?.program.toLowerCase()} partner</span></span>
                    <Badge variant="secondary">{p.role}</Badge>
                  </li>
                ))}
              </ul>
            )}
            {opp && opp.touches.length > 0 && (
              <>
                <p className="mt-5 mb-2 text-[14px] font-semibold text-muted-foreground">What partners did</p>
                <ol className="space-y-2.5 border-l-2 pl-4">
                  {[...opp.touches].reverse().map((t) => (
                    <li key={t.id} className="text-[15px]">
                      <b className="text-foreground">{t.kind}</b> · {partnerNameOf(state, t.partnerId)}{t.by ? ` (${t.by})` : ""}
                      <span className="block text-muted-foreground">{t.text} · {date(t.at)}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </Panel>
        </div>

        <div className="space-y-6 xl:sticky xl:top-[92px] xl:self-start">
          <Panel title={<span className="flex flex-wrap items-center gap-2"><Handshake className="size-5 text-primary" /> Co-sell <StageTag /></span>} sub={a.need ? `This deal needs: ${a.need.charAt(0).toLowerCase()}${a.need.slice(1)}.` : undefined}>
            {accepted ? (
              <>
                <p className="mb-4 text-[15.5px] text-foreground"><b>{partnerNameOf(state, accepted.partnerId)}</b> accepted {accepted.decidedAt ? ago(accepted.decidedAt) : ""}. {accepted.owner} owns it on their side.</p>
                <p className="mb-2 text-[14px] font-semibold text-muted-foreground">Joint plan</p>
                <JointPlan c={accepted} owner={accepted.owner ?? accepted.contact} />
              </>
            ) : sent ? (
              <div className="space-y-3">
                <p className="text-[15.5px] text-foreground">Sent to <b>{sent.contact}</b> at {partnerNameOf(state, sent.partnerId)} {ago(sent.sentAt)}. They answer by {date(sent.respondBy, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.</p>
                <p className="rounded-[12px] bg-muted/60 px-4 py-3 text-[14.5px] text-muted-foreground">They see the industry, size, region, product and value. The account name and contacts unlock when they accept (R-CS-4).</p>
              </div>
            ) : !a.need ? (
              <p className="text-[15px] text-muted-foreground">{v.partners.length ? "Partners are already working this deal. Co-sell is for deals that need one." : "No partner needed on this deal right now."}</p>
            ) : (
              <div className="space-y-3">
                {declined.map((c) => <p key={c.id} className="text-[15px] text-muted-foreground">{partnerNameOf(state, c.partnerId)} declined: {c.declineReason}.</p>)}
                <Button size="lg" className="w-full" onClick={() => go(`/v/find/${a.id}`)}><Handshake /> {declined.length ? "Find another partner" : "Find a partner"} <ArrowRight /></Button>
                <p className="text-[14px] text-muted-foreground">The co-sell agent ranks partners with reasons. You choose and send; it never sends for you (R-CS-3).</p>
              </div>
            )}
          </Panel>
          <Panel title="Account">
            <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-[15px]">
              <dt className="text-muted-foreground">Industry</dt><dd className="text-foreground">{a.industry}</dd>
              <dt className="text-muted-foreground">Size</dt><dd className="text-foreground">{a.employees.toLocaleString("en-US")} people</dd>
              <dt className="text-muted-foreground">HQ</dt><dd className="text-foreground">{a.hq}</dd>
              <dt className="text-muted-foreground">Owner</dt><dd className="flex items-center gap-1.5 text-foreground"><Building2 className="size-4 text-muted-foreground" /> You</dd>
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  )
}

