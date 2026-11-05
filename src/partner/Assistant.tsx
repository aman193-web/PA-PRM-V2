import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { ArrowUp, Sparkles } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { money } from "@/lib/format"
import { go } from "@/lib/router"
import { useStore } from "@/store"
import { company, nextTier } from "@/partner/data"
import { daysUntil, partnerNext, partnerStatus, usePartner, usePartnerData } from "@/partner/usePartner"

interface Msg { from: "me" | "ai"; text: string; links?: { label: string; href: string }[] }

const suggestions = {
  rep: ["What needs me today?", "Where is my Acme deal?", "What have I earned this year?", "Register a deal"],
  pexec: ["What is the program worth to us?", "How do we reach Platinum?", "Which leads need a rep?", "How is each rep doing?"],
}

type Data = ReturnType<typeof usePartnerData>

function answer(q: string, d: Data, isExec: boolean, team: { name: string; status: string; role: string }[]): Msg {
  const t = q.toLowerCase()
  const deal = d.deals.find((r) => t.includes(r.customer.toLowerCase().split(" ")[0]))
  if (deal) {
    const n = partnerNext(deal, d.pendingExt(deal))
    return {
      from: "ai",
      text: `${deal.customer} (${money(deal.value)}, ${deal.product}) is ${partnerStatus(deal).label.toLowerCase()}. Next: ${n.text}.${deal.state === "info_requested" && deal.infoRequest ? ` Jordan asked: "${deal.infoRequest.asked}"` : ""}`,
      links: [{ label: `Open ${deal.customer}`, href: `/p/deal/${deal.id}` }],
    }
  }
  if (t.includes("register") || t.includes("new deal"))
    return { from: "ai", text: "Describe the deal or paste the customer's email and I'll fill in the registration. You check it and submit: three taps. Clean deals under $50,000 are approved in about a minute.", links: [{ label: "Register a deal", href: "/p/register" }] }
  if (t.includes("need") || t.includes("today")) {
    const lines = [
      ...d.needsReply.map((r) => `• Answer Jordan's question on ${r.customer}. The review is paused until you do.`),
      ...d.offers.map((l) => `• Accept or decline the ${l.company} lead from Brightline.`),
      ...d.expiring.map((r) => `• ${r.customer} protection ends in ${daysUntil(r.protectedUntil!)} days. Ask for more time if the deal is still active.`),
    ]
    return { from: "ai", text: lines.length ? `${lines.length} thing${lines.length > 1 ? "s" : ""} need you:\n${lines.join("\n")}` : "Nothing needs you right now. Your deals in review are with Jordan.", links: [{ label: "Go to Home", href: "/p/home" }] }
  }
  if (t.includes("earn") || t.includes("credit") || t.includes("worth") || t.includes("revenue"))
    return {
      from: "ai",
      text: isExec
        ? `${company.name} has ${money(d.verifiedTotal)} of verified revenue with Brightline this year, every dollar matched to Salesforce closed-won. Another ${money(d.pipelineTotal)} of credit is on open deals. You're ${Math.round((nextTier.requirements[0].have / nextTier.requirements[0].need) * 100)}% of the way to the Platinum revenue requirement.`
        : `You've earned ${money(d.verifiedTotal)} of verified credit this year on won deals, and ${money(d.pipelineTotal)} is on your open deals. This week you created ${money(d.weekValue)} of new protected pipeline.`,
      links: [{ label: isExec ? "Open Revenue" : "Open My credit", href: "/p/credit" }],
    }
  if (isExec && (t.includes("platinum") || t.includes("tier")))
    return {
      from: "ai",
      text: `To reach Platinum you need: ${nextTier.requirements.filter((r) => r.have < r.need).map((r) => `${r.label.toLowerCase()} (${r.money ? `${money(r.have)} of ${money(r.need)}` : `${r.have} of ${r.need}`})`).join("; ")}. Getting two more reps through the Platform sales certification is the quickest win.`,
      links: [{ label: "Open Program", href: "/p/program" }],
    }
  if (t.includes("lead"))
    return {
      from: "ai",
      text: d.offers.length ? `${d.offers.length} lead${d.offers.length > 1 ? "s are" : " is"} waiting: ${d.offers.map((l) => l.company).join(", ")}. ${isExec ? "Accept and pick a rep, or decline with a reason so Jordan can send it elsewhere." : "Accept to see the contact details."}` : "No leads are waiting for you.",
      links: [{ label: "Open Leads", href: "/p/leads" }],
    }
  if (isExec && (t.includes("rep") || t.includes("team")))
    return {
      from: "ai",
      text: team.filter((m) => m.role === "Partner sales rep" && m.status === "active").map((m) => {
        const mine = d.deals.filter((r) => r.rep === m.name)
        const open = mine.filter((r) => ["approved", "under_review", "info_requested"].includes(r.state))
        const won = mine.filter((r) => r.state === "won").reduce((n, r) => n + r.value, 0)
        return `• ${m.name}: ${open.length} open deals (${money(open.reduce((n, r) => n + r.value, 0))}), ${money(won)} won this year.`
      }).join("\n"),
      links: [{ label: "Open Deals", href: "/p/deals" }, { label: "Open Team", href: "/p/team" }],
    }
  return { from: "ai", text: `I can help with your ${isExec ? "deals, leads, revenue, program and team" : "deals, leads and credit"}. I only see what you can see in this portal.` }
}

const Ctx = createContext<{ ask: (q?: string) => void }>({ ask: () => {} })
export const usePartnerAssistant = () => useContext(Ctx)

export function PartnerAssistantProvider({ children }: { children: ReactNode }) {
  const { me, isExec } = usePartner()
  const d = usePartnerData()
  const { state } = useStore()
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [draft, setDraft] = useState("")
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }) }, [msgs])

  const send = (q: string) => {
    if (!q.trim()) return
    setMsgs((m) => [...m, { from: "me", text: q }, answer(q, d, isExec, state.team)])
    setDraft("")
  }
  const ask = (q?: string) => {
    setOpen(true)
    if (q) setTimeout(() => send(q), 50)
  }

  return (
    <Ctx.Provider value={{ ask }}>
      {children}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 data-[side=right]:sm:max-w-[440px]">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle className="flex items-center gap-2 text-[18px]"><Sparkles className="size-5 text-primary" /> PartnerAssistant</SheetTitle>
            <SheetDescription className="text-[14px]">Answers from what {me.first} can see in this portal.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {msgs.length === 0 && (
              <div className="space-y-2">
                <p className="text-[15px] text-muted-foreground">Try one of these:</p>
                {suggestions[me.role].map((s) => (
                  <button key={s} onClick={() => (s === "Register a deal" ? (setOpen(false), go("/p/register")) : send(s))} className="block w-full rounded-[12px] border bg-card px-4 py-3 text-left text-[15px] text-foreground hover:border-primary/60">{s}</button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={m.from === "me" ? "ml-10 rounded-[14px] rounded-br-[4px] bg-primary px-4 py-2.5 text-[15px] text-primary-foreground" : "mr-6 rounded-[14px] rounded-bl-[4px] bg-muted px-4 py-3 text-[15px] whitespace-pre-line text-foreground"}>
                {m.text}
                {m.links && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {m.links.map((l) => <Button key={l.href} size="sm" variant="outline" className="bg-card" onClick={() => { setOpen(false); go(l.href) }}>{l.label}</Button>)}
                  </div>
                )}
              </div>
            ))}
            <div ref={end} />
          </div>
          <form className="flex gap-2 border-t p-4" onSubmit={(e) => { e.preventDefault(); send(draft) }}>
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about a deal, lead or your credit…" className="h-12 flex-1 text-[15.5px]" />
            <Button type="submit" size="icon" className="size-12" aria-label="Send"><ArrowUp /></Button>
          </form>
        </SheetContent>
      </Sheet>
    </Ctx.Provider>
  )
}
