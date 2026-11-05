import { useState } from "react"
import { ArrowRight, Bell, Bot, CalendarClock, Check, CheckCheck, Inbox, MessageSquareMore, Pause, ShieldCheck, Sparkles, X } from "lucide-react"
import { toast } from "sonner"
import { AiTag, Confidence, DecisionOption, EmptyState, PageHeader, PageTabs, Panel, PartnerAvatar, RegStateBadge, SalesforceMark, SlaMeter } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import type { ExtensionRequest, Registration } from "@/data/model"
import { reviewReasonShort } from "@/data/model"
import { addDays, ago, date, money, shortDate } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { slaPct, useQueue, useStore } from "@/store"

const aiLabel = { approve: "Approve", reject: "Reject", request_info: "Ask for info" } as const
const aiTone = { approve: "text-ok", reject: "text-bad", request_info: "text-amber-ink" } as const

export function Queue({ tab = "decide" }: { tab?: string }) {
  const q = useQueue()
  const [ext, setExt] = useState<string | null>(null)
  return (
    <div>
      <PageHeader title="Review queue" sub="Everything waiting on you, in one place." />
      <PageTabs
        label="Review queue"
        value={tab}
        onChange={(v) => go(`/queue/${v}`)}
        items={[
          { value: "decide", label: "To decide", icon: <Inbox />, count: q.toDecide.length, tone: "action", hint: "Registrations the rules couldn't decide, most urgent first." },
          { value: "extensions", label: "Extensions", icon: <ShieldCheck />, count: q.extensions.length, tone: "action", hint: "Partners asking for more protection time before a registration expires." },
          { value: "waiting", label: "Waiting on partner", icon: <Pause />, count: q.waiting.length, tone: "neutral", hint: "You asked for more information. The SLA stays paused until they reply." },
          { value: "decided", label: "Decided", icon: <CheckCheck />, count: q.decided.length, tone: "neutral", hint: "Decisions by you and by the rules, with the Salesforce result." },
        ]}
      />
      <div>
        {tab === "decide" && <ToDecide list={q.toDecide} />}
        {tab === "extensions" && <Extensions list={q.extensions} onOpen={setExt} />}
        {tab === "waiting" && <Waiting list={q.waiting} />}
        {tab === "decided" && <Decided list={q.decided} />}
      </div>
      <ExtensionSheet id={ext} onClose={() => setExt(null)} />
    </div>
  )
}

function ToDecide({ list }: { list: Registration[] }) {
  const { partner } = useStore()
  if (!list.length)
    return (
      <Panel>
        <EmptyState title="All registrations decided" body="New ones that need a person will appear here, with a nudge at 50% of their SLA." action={<Button variant="outline" onClick={() => go("/queue/decided")}>See decisions</Button>} />
      </Panel>
    )
  return (
    <ul className="grid gap-3">
      {list.map((r) => {
        const p = partner(r.partnerId)!
        return (
          <li key={r.id}>
            <a href={`#/registration/${r.id}`} className="group grid gap-4 rounded-[14px] border bg-card p-5 shadow-[0_1px_2px_#172b4508] transition hover:border-primary/60 sm:p-6 md:grid-cols-[1fr_220px_auto] md:items-center">
              <div className="flex min-w-0 items-start gap-4">
                <PartnerAvatar name={p.name} size="lg" />
                <div className="min-w-0">
                  <p className="text-[18px] font-semibold text-foreground">
                    {r.customer} <span className="font-normal text-muted-foreground">· {money(r.value)}</span>
                  </p>
                  <p className="text-[15px] text-muted-foreground">{p.name} · {r.rep} · {r.product}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {slaPct(r) >= 80 && <Badge className="border-0 bg-bad-soft text-bad">Escalated to Dana</Badge>}
                    {r.reasons.map((x) => (
                      <Badge key={x} className="border-0 bg-amber-soft text-amber-ink">{reviewReasonShort[x]}</Badge>
                    ))}
                    {r.ai && (
                      <span className={cn("inline-flex items-center gap-1.5 text-[14px] font-semibold", aiTone[r.ai.action])}>
                        <Sparkles className="size-4" /> AI suggests: {aiLabel[r.ai.action]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <SlaMeter reg={r} />
              <span aria-hidden className={buttonVariants()}>Review <ArrowRight /></span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}

function Extensions({ list, onOpen }: { list: ExtensionRequest[]; onOpen: (id: string) => void }) {
  const { partner, state } = useStore()
  const done = state.extensions.filter((e) => e.status !== "pending")
  const { withChief } = useQueue()
  return (
    <div className="space-y-6">
      {list.length === 0 ? (
        <Panel><EmptyState title="No extension requests" body="Partners can ask for more protection time before a registration expires." /></Panel>
      ) : (
        <ul className="grid gap-3">
          {list.map((e) => {
            const p = partner(e.partnerId)!
            return (
              <li key={e.id}>
                <button onClick={() => onOpen(e.id)} className="grid w-full gap-4 rounded-[14px] border bg-card p-5 text-left shadow-[0_1px_2px_#172b4508] transition hover:border-primary/60 sm:p-6 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <div className="flex min-w-0 items-start gap-4">
                    <PartnerAvatar name={p.name} size="lg" />
                    <div className="min-w-0">
                      <p className="text-[18px] font-semibold text-foreground">{e.customer} <span className="font-normal text-muted-foreground">· {money(e.value)}</span></p>
                      <p className="text-[15px] text-muted-foreground">{p.name} asks for <b className="text-foreground">{e.requestedDays} more days</b> of protection</p>
                      <p className={cn("mt-2 inline-flex items-center gap-1.5 text-[14px] font-semibold", e.ai.action === "grant" ? "text-ok" : "text-bad")}>
                        <Sparkles className="size-4" /> AI suggests: {e.ai.headline}
                      </p>
                    </div>
                  </div>
                  <div className="text-[15px] md:text-right">
                    <p className={cn("font-semibold", e.daysLeft <= 4 ? "text-bad" : "text-amber-ink")}>Ends in {e.daysLeft} days</p>
                    <p className="text-muted-foreground">{date(e.protectionEnds)}</p>
                  </div>
                  <span aria-hidden className={buttonVariants({ variant: "outline" })}>Decide</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {withChief.length > 0 && (
        <Panel title="Waiting for Dana Ortiz" sub="Second extension requests. Only the channel chief can decide these (R-REG-11); you'll be told the outcome.">
          <ul className="divide-y">
            {withChief.map((e) => (
              <li key={e.id}>
                <button onClick={() => onOpen(e.id)} className="flex w-full flex-wrap items-center justify-between gap-2 py-3 text-left first:pt-0 last:pb-0 hover:text-primary">
                  <span className="text-foreground">{e.customer} · {partner(e.partnerId)!.name} <span className="text-muted-foreground">· asks for {e.requestedDays} more days, ends in {e.daysLeft} days</span></span>
                  <Badge className="border-0 bg-brand-soft text-primary">Second request · with Dana</Badge>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      {done.length > 0 && (
        <Panel title="Decided extensions">
          <ul className="divide-y">
            {done.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <span className="text-foreground">{e.customer} · {partner(e.partnerId)!.name}</span>
                {e.status === "granted" ? (
                  <Badge className="border-0 bg-ok-soft text-ok">Extended {e.decidedDays} days{e.previousExtensions > 0 ? " by Dana" : ""}</Badge>
                ) : (
                  <Badge className="border-0 bg-bad-soft text-bad">Declined</Badge>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  )
}

function Waiting({ list }: { list: Registration[] }) {
  const { partner } = useStore()
  if (!list.length) return <Panel><EmptyState title="Nothing waiting on partners" body="When you ask a partner for more information, the SLA pauses and the request waits here." /></Panel>
  return (
    <ul className="grid gap-3">
      {list.map((r) => {
        const p = partner(r.partnerId)!
        return (
          <li key={r.id} className="rounded-[14px] border bg-card p-5 shadow-[0_1px_2px_#172b4508] sm:p-6">
            <div className="flex flex-wrap items-start gap-4">
              <PartnerAvatar name={p.name} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-[18px] font-semibold text-foreground">{r.customer} <span className="font-normal text-muted-foreground">· {money(r.value)}</span></p>
                <p className="text-[15px] text-muted-foreground">{p.name} · {r.rep}</p>
                <blockquote className="mt-3 rounded-[10px] bg-muted px-4 py-3 text-[15px] text-foreground">
                  <span className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground"><MessageSquareMore className="size-4" /> You asked {r.infoRequest ? ago(r.infoRequest.at) : ""}</span>
                  {r.infoRequest?.asked}
                </blockquote>
              </div>
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-col sm:items-end">
                <span className="inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-muted-foreground"><Pause className="size-4" /> SLA paused</span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => toast.success(`Reminder sent to ${r.rep}`, { description: "By email and in their copilot chat." })}><Bell /> Remind</Button>
                  <Button variant="ghost" onClick={() => go(`/registration/${r.id}`)}>Open</Button>
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function Decided({ list }: { list: Registration[] }) {
  const { partner } = useStore()
  return (
    <Panel bodyClass="p-0 sm:p-0">
      <div className="hidden grid-cols-[1.4fr_1fr_130px_1.2fr] gap-4 border-b px-6 py-3 text-[14px] font-medium text-muted-foreground md:grid">
        <span>Deal</span><span>Outcome</span><span className="text-right">Value</span><span>Salesforce</span>
      </div>
      <ul>
        {list.map((r) => (
          <li key={r.id} className="border-b last:border-0">
            <a href={`#/registration/${r.id}`} className="grid gap-2 px-5 py-4 hover:bg-muted/50 sm:px-6 md:grid-cols-[1.4fr_1fr_130px_1.2fr] md:items-center md:gap-4">
              <span className="min-w-0">
                <b className="block truncate text-foreground">{r.customer}</b>
                <span className="text-[14px] text-muted-foreground">{partner(r.partnerId)!.name} · {shortDate(r.decision!.at)}</span>
              </span>
              <span className="flex flex-wrap items-center gap-2">
                <RegStateBadge reg={r} />
                <span className="inline-flex items-center gap-1 text-[14px] text-muted-foreground">
                  {r.decision!.by === "rules" ? <><Bot className="size-4" /> Rules · {r.decision!.seconds} s</> : <><Check className="size-4" /> You</>}
                </span>
              </span>
              <span className="font-semibold text-foreground tabular md:text-right">{money(r.value)}</span>
              <span className="text-[14px] text-muted-foreground">
                {r.crm ? (
                  <span className="inline-flex items-center gap-1.5"><SalesforceMark /> {r.crm.opportunityId} · {r.crm.sync === "synced" ? "synced" : "syncing…"}</span>
                ) : r.decision?.reason ?? "—"}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

/* ---------- Extension decision ---------- */

const denyReasons = ["No recent customer activity", "Already extended", "Deal no longer qualified", "Other reason"]

function ExtensionSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { state, dispatch, partner } = useStore()
  const e = state.extensions.find((x) => x.id === id)
  const [choice, setChoice] = useState<"grant" | "deny" | null>(null)
  const [days, setDays] = useState("30")
  const [reason, setReason] = useState(denyReasons[0])
  const [note, setNote] = useState("")

  const reset = () => { setChoice(null); setNote("") }
  const p = e ? partner(e.partnerId)! : null

  const submit = () => {
    if (!e || !choice) return
    dispatch({ type: "extension", id: e.id, grant: choice === "grant", days: Number(days), reason })
    toast.success(choice === "grant" ? `${e.customer} protected until ${date(addDays(e.protectionEnds, Number(days)))}` : `Extension declined for ${e.customer}`, {
      description: `${p!.name} was told the decision and the reason.`,
    })
    reset()
    onClose()
  }

  return (
    <Sheet open={!!e} onOpenChange={(o) => { if (!o) { reset(); onClose() } }}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[520px]">
        {e && p && (
          <>
            <SheetHeader className="border-b px-6 py-5">
              <SheetTitle className="text-[20px]">{e.previousExtensions > 0 ? `Second extension for ${e.customer}` : `Extend protection for ${e.customer}?`}</SheetTitle>
              <SheetDescription>{p.name} · {money(e.value)} · {e.registrationId}</SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[12px] border p-4">
                  <p className="text-[14px] text-muted-foreground">Protection ends</p>
                  <p className={cn("text-[20px] font-bold", e.daysLeft <= 4 ? "text-bad" : "text-amber-ink")}>{shortDate(e.protectionEnds)}</p>
                  <p className="text-[14px] text-muted-foreground">in {e.daysLeft} days</p>
                </div>
                <div className="rounded-[12px] border p-4">
                  <p className="text-[14px] text-muted-foreground">Partner asks for</p>
                  <p className="text-[20px] font-bold text-foreground">+{e.requestedDays} days</p>
                  <p className="text-[14px] text-muted-foreground">until {shortDate(addDays(e.protectionEnds, e.requestedDays))}</p>
                </div>
              </div>
              <div>
                <p className="mb-2 font-semibold text-foreground">Why they're asking</p>
                <blockquote className="rounded-[10px] bg-muted px-4 py-3 text-foreground">"{e.reason}"</blockquote>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-2 font-semibold text-foreground"><SalesforceMark /> In Salesforce</p>
                <dl className="grid gap-2 text-[15px]">
                  <Fact k="Stage" v={e.crmStage} />
                  <Fact k="Last activity" v={e.lastActivity} />
                  <Fact k="Extensions so far" v={String(e.previousExtensions)} />
                </dl>
              </div>
              <div className="rounded-[12px] border border-primary/25 bg-brand-soft/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <AiTag />
                  <Confidence value={e.ai.confidence} />
                </div>
                <p className="mt-2 text-[17px] font-semibold text-foreground">{e.ai.headline}</p>
                <ul className="mt-2 space-y-1 text-[15px]">
                  {e.ai.evidence.map((x) => <li key={x} className="flex gap-2"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />{x}</li>)}
                </ul>
              </div>

              {e.previousExtensions > 0 ? (
                <div className="rounded-[12px] border border-primary/30 bg-brand-soft/40 p-4">
                  <p className="font-semibold text-foreground">This is a second extension, so Dana Ortiz decides it</p>
                  <p className="mt-1 text-[15px]">You gave the first one. A second needs the channel chief (R-REG-11). It's in her Approvals with the AI advice above; you'll get a notification when she decides.</p>
                </div>
              ) : (
              <div>
                <p className="mb-3 font-semibold text-foreground">Your decision</p>
                <div role="radiogroup" aria-label="Decision" className="grid gap-2">
                  <DecisionOption active={choice === "grant"} tone="ok" onClick={() => { setChoice("grant"); setDays(String(e.ai.days ?? e.requestedDays)) }} icon={<ShieldCheck />} label="Grant" sub="Extend protection and tell the partner" suggested={e.ai.action === "grant"} />
                  <DecisionOption active={choice === "deny"} tone="bad" onClick={() => setChoice("deny")} icon={<X />} label="Deny" sub={`Protection still ends ${shortDate(e.protectionEnds)}`} suggested={e.ai.action === "deny"} />
                </div>
                {choice === "grant" && (
                  <div className="mt-4 space-y-3">
                    <Label className="text-[15px]">How long? <span className="font-normal text-muted-foreground">{p.name.split(" ")[0]} asked for {e.requestedDays} days</span></Label>
                    <RadioGroup value={days} onValueChange={setDays} className="grid grid-cols-3 gap-2">
                      {["30", "60", "90"].map((d) => (
                        <Label key={d} className={cn("flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[10px] border text-[15px]", days === d && "border-primary bg-brand-soft text-primary")}>
                          <RadioGroupItem value={d} className="sr-only" /> {d} days
                        </Label>
                      ))}
                    </RadioGroup>
                    <p className="flex items-center gap-2 text-[15px] text-muted-foreground"><CalendarClock className="size-4" /> New end date: <b className="text-foreground">{date(addDays(e.protectionEnds, Number(days)))}</b></p>
                  </div>
                )}
                {choice === "deny" && (
                  <div className="mt-4 space-y-3">
                    <Label className="text-[15px]">Reason the partner will see</Label>
                    <RadioGroup value={reason} onValueChange={setReason} className="grid gap-2">
                      {denyReasons.map((r) => (
                        <Label key={r} className={cn("flex h-11 cursor-pointer items-center gap-3 rounded-[10px] border px-3 text-[15px] font-normal", reason === r && "border-primary bg-brand-soft")}>
                          <RadioGroupItem value={r} /> {r}
                        </Label>
                      ))}
                    </RadioGroup>
                    <Textarea value={note} onChange={(ev) => setNote(ev.target.value)} placeholder="Add a note for the partner (optional)" />
                  </div>
                )}
              </div>
              )}
            </div>
            {e.previousExtensions === 0 && (
              <SheetFooter className="border-t px-6 py-4">
                <Button size="lg" disabled={!choice} onClick={submit} className={cn("w-full", choice === "grant" && "bg-ok text-white hover:bg-ok/90", choice === "deny" && "bg-bad text-white hover:bg-bad/90")}>
                  {choice === "deny" ? "Deny and tell the partner" : choice === "grant" ? `Extend by ${days} days` : "Choose grant or deny"}
                </Button>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b pb-2 last:border-0">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium text-foreground">{v}</dd>
    </div>
  )
}
