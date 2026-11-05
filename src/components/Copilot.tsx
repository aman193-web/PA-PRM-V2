import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { ArrowUp, Sparkles } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { pipelineOf, useQueue, useStore, slaPct, type State } from "@/store"
import { hoursLeft, money } from "@/lib/format"
import { go } from "@/lib/router"

interface Msg {
  from: "me" | "ai"
  text: string
  links?: { label: string; href: string }[]
}

const suggestions = [
  "What needs me today?",
  "Summarise the Acme conflict",
  "Who should I call today?",
  "How much pipeline do my partners have?",
]

function answer(q: string, s: State, queue: ReturnType<typeof useQueue>): Msg {
  const t = q.toLowerCase()
  const name = (id: string) => s.partners.find((p) => p.id === id)?.name ?? id
  if (t.includes("acme")) {
    const r = s.registrations.find((x) => x.id === "REG-2041")!
    if (r.state !== "under_review") return { from: "ai", text: `Acme Manufacturing is already decided: ${r.state.replace("_", " ")}.`, links: [{ label: "Open Acme", href: `/registration/${r.id}` }] }
    return {
      from: "ai",
      text: "Ridgeway IT registered Acme Manufacturing for $62,000. Sam Rivera already has an open Salesforce opportunity on the same account, contact and product, created on Oct 16. Ridgeway met the buyer on Oct 2, two weeks earlier, and Sam's opportunity has no partner yet. I'd approve and link Ridgeway to Sam's opportunity as Reseller (82% confident).",
      links: [{ label: "Open Acme to decide", href: `/registration/${r.id}` }],
    }
  }
  const asked = s.partners.find((p) => p.assigned && t.includes(p.name.toLowerCase()))
  if (asked) {
    const regs = s.registrations.filter((r) => r.partnerId === asked.id)
    const open = regs.filter((r) => ["approved", "under_review", "info_requested"].includes(r.state))
    const waiting = regs.filter((r) => r.state === "under_review").length
    const h = s.health.find((x) => x.partnerId === asked.id)
    return {
      from: "ai",
      text: `${asked.name} is a ${asked.tier} ${asked.program.toLowerCase()} partner with ${open.length} open deals (${money(open.reduce((n, r) => n + r.value, 0))}) and ${money(asked.wonThisYear)} won this year.${waiting ? ` ${waiting} registration${waiting > 1 ? "s are" : " is"} waiting for you.` : ""}${h ? ` Trend: ${h.metric.toLowerCase()}.` : ""}`,
      links: [{ label: `Open ${asked.name}`, href: `/partner/${asked.id}` }],
    }
  }
  if (t.includes("call")) {
    return {
      from: "ai",
      text: "Three calls are worth making today:\n• Marcus Bell (Ridgeway IT): Solace Retail has waited a day for his answer.\n• Owen Park (Keystone Data): onboarding idle 6 days, insurance certificate missing.\n• Tara Quinn (Summit Resale): Orchid Foods protection ends in 4 days.",
      links: [{ label: "See today's call list", href: "/home" }],
    }
  }
  if (t.includes("pipeline") || t.includes("revenue")) {
    const mine = s.partners.filter((p) => p.assigned && p.status === "active")
    const pipe = (id: string) => pipelineOf(s, id)
    const total = mine.reduce((n, p) => n + pipe(p.id), 0)
    const top = [...mine].sort((a, b) => pipe(b.id) - pipe(a.id)).slice(0, 3)
    return {
      from: "ai",
      text: `Your ${mine.length} active partners have ${money(total)} in open pipeline. The biggest: ${top.map((p) => `${p.name} (${money(pipe(p.id))})`).join(", ")}.`,
      links: [{ label: "Open partners", href: "/partners/all" }],
    }
  }
  if (t.includes("today") || t.includes("need") || t.includes("sla") || t.includes("queue")) {
    const first = queue.toDecide[0]
    const lines = queue.toDecide.slice(0, 4).map((r) => `• ${r.customer}, ${money(r.value)} from ${name(r.partnerId)}: ${hoursLeft(r.slaHours - r.usedHours)} (${slaPct(r)}% of SLA)`)
    return {
      from: "ai",
      text: queue.toDecide.length
        ? `${queue.toDecide.length} registrations are waiting for you, most urgent first:\n${lines.join("\n")}\nThere are also ${queue.extensions.length} extension requests and ${queue.apps.length} new applications.`
        : "Your review queue is clear. Nice work.",
      links: first ? [{ label: `Start with ${first.customer}`, href: `/registration/${first.id}` }, { label: "Open review queue", href: "/queue" }] : [],
    }
  }
  return {
    from: "ai",
    text: "I can answer questions about your registrations, partners, onboarding and credit splits. Try one of the suggestions below.",
  }
}

const Ctx = createContext<{ ask: (q?: string) => void } | null>(null)

export function useCopilot() {
  return useContext(Ctx)!
}

export function CopilotProvider({ children }: { children: ReactNode }) {
  const { state } = useStore()
  const queue = useQueue()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "ai", text: "Hi Jordan. Ask me about your queue, a deal, or a partner. I only see the partners assigned to you." },
  ])
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }) }, [msgs])

  const send = (q: string) => {
    if (!q.trim()) return
    setMsgs((m) => [...m, { from: "me", text: q }])
    setInput("")
    setTimeout(() => setMsgs((m) => [...m, answer(q, state, queue)]), 450)
  }
  const ask = (q?: string) => {
    setOpen(true)
    if (q) send(q)
  }

  return (
    <Ctx.Provider value={{ ask }}>
      {children}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[460px]">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-night text-white">
                <Sparkles className="size-4" />
              </span>
              PartnerAssistant
            </SheetTitle>
            <SheetDescription>Answers come from your queue, partners and Salesforce.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {msgs.map((m, i) => (
              <div key={i} className={m.from === "me" ? "flex justify-end" : ""}>
                <div
                  className={
                    m.from === "me"
                      ? "max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground"
                      : "max-w-[92%] rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-foreground"
                  }
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  {m.links && m.links.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.links.map((l) => (
                        <Button
                          key={l.href}
                          size="sm"
                          variant="outline"
                          className="bg-card"
                          onClick={() => {
                            setOpen(false)
                            go(l.href)
                          }}
                        >
                          {l.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={end} />
          </div>
          <div className="border-t px-6 py-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border bg-card px-3 py-1.5 text-[14px] text-foreground hover:border-primary hover:text-primary">
                  {s}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                send(input)
              }}
            >
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about a deal or partner…" className="h-11" aria-label="Ask PartnerAssistant" />
              <Button type="submit" size="icon" className="size-11" aria-label="Send">
                <ArrowUp className="size-5" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </Ctx.Provider>
  )
}
