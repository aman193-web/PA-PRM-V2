import { useEffect, useRef, useState, type ReactNode } from "react"
import { ArrowUp, Bot, Search, Sparkles, Square } from "lucide-react"
import { allItems, byId, type Item } from "@hub/content"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@hub/components/ui/sheet"
import { Button } from "@hub/components/ui/button"
import { ItemLink } from "@hub/components/bits"
import { useCapability, type SampleFn, type SampleTool } from "@hub/lib/claude"
import { useNav } from "@hub/lib/nav"
import { search, searchForAssistant } from "@hub/lib/search"

interface Turn { role: "user" | "assistant"; content: string; failed?: boolean }

const counts = allItems.reduce<Record<string, number>>((m, i) => ((m[i.kind] = (m[i.kind] ?? 0) + 1), m), {})

const RULES = `You are the assistant inside the PRM Knowledge Hub, the single source of truth for a Partner Revenue Management (PRM) product: who each user role is, what they can and can't do, business and SLA rules, flows, where records come from, value and differentiators, and open gaps.

The hub holds ${allItems.length} items: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(", ")}. You can read them ONLY with two tools: search_hub (keyword search; returns ids, titles, summaries, statuses) and get_item (full detail by id).

How to answer:
1. Always search the hub before answering, and open the most relevant items with get_item when you need detail (permissions by role, rule numbers, flow steps, what each source says).
2. Answer only from what the tools return. Never use outside knowledge about this product or invent rules, numbers or decisions.
3. Cite every item you relied on by its id in square brackets, for example [R-SLA-4] or [faq-lead] or [pam]. Use ids exactly as returned.
4. Every item has a status: confirmed, specified (written in the requirements), proposed (our proposal, not signed off), default (a recommended default, not decided), open (decision needed), assumption (prototype only). When an answer rests on proposed, default, open or assumption items, say so plainly in the answer.
5. If the hub doesn't cover the question, say "The hub doesn't cover this yet" and suggest raising it as a gap. Don't guess.
6. Write for a busy manager: plain language, 2–6 short sentences or a few bullet points starting with "- ". No headings, no tables.`

function Answer({ text }: { text: string }) {
  const lines = text.split(/\n+/).filter((l) => l.trim())
  const renderInline = (line: string) => {
    const out: ReactNode[] = []
    const re = /\[([A-Za-z0-9._~-]+)\]/g
    let last = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(line))) {
      if (m.index > last) out.push(line.slice(last, m.index))
      out.push(byId.has(m[1]) ? <span key={m.index} className="mx-0.5 inline-flex align-middle"><ItemLink id={m[1]} compact /></span> : <code key={m.index} className="font-mono text-[12.5px]">[{m[1]}]</code>)
      last = m.index + m[0].length
    }
    if (last < line.length) out.push(line.slice(last))
    return out.map((p, i) => (typeof p === "string" ? <span key={`t${i}`}>{p.replace(/\*\*/g, "")}</span> : p))
  }
  return (
    <div className="space-y-2.5 text-[15px] leading-relaxed text-foreground">
      {lines.map((l, i) =>
        /^\s*[-•*]\s+/.test(l) ? (
          <p key={i} className="flex gap-2.5"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" /><span className="min-w-0">{renderInline(l.replace(/^\s*[-•*]\s+/, ""))}</span></p>
        ) : (
          <p key={i}>{renderInline(l)}</p>
        ),
      )}
    </div>
  )
}

const starters = [
  "Where do leads come from, and who can send them to partners?",
  "Can a partner sales rep see or change another partner's credit?",
  "What happens to a deal at 50%, 80% and 100% of the SLA?",
  "Which decisions are still open, and who owns them?",
]

const errorCopy: Record<string, string> = {
  rate_limited: "Too many questions right now. Try again in a minute.",
  session_expired: "Your session expired. Sign in again and retry.",
  refused: "Claude couldn't answer that. Try rephrasing.",
  empty_completion: "No answer came back. Try a simpler question.",
  prompt_too_large: "That conversation got too long. Start a new one.",
}

export function Assistant() {
  const { assistantOpen, setAssistantOpen, assistantQ } = useNav()
  const sample = useCapability<SampleFn>("sample")
  const [off, setOff] = useState<string | null>(null)
  const [turns, setTurns] = useState<Turn[]>([])
  const [draft, setDraft] = useState("")
  const [live, setLive] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const ctl = useRef<AbortController | null>(null)
  const end = useRef<HTMLDivElement>(null)
  const lastQ = useRef(0)

  useEffect(() => { end.current?.scrollIntoView({ block: "end" }) }, [turns, live, status])

  const send = async (q: string) => {
    const question = q.trim()
    if (!question || ctl.current) return
    setDraft("")
    const history = [...turns.filter((t) => !t.failed), { role: "user" as const, content: question }]
    setTurns(history)
    if (!sample) return

    const pre = searchForAssistant(question, 6)
    const tools: SampleTool[] = [
      {
        name: "search_hub",
        description: "Keyword search across every hub item (personas, permissions, rules, flows, data records, gaps, quick answers, glossary). Returns up to 8 matches with id, type, title, summary and status.",
        inputSchema: { type: "object", properties: { query: { type: "string", description: "A few keywords, e.g. 'lead origin' or 'approve split'" } }, required: ["query"] },
        execute: (input) => {
          const query = String(input.query ?? "").slice(0, 200)
          setStatus(`Searching the hub for "${query}"`)
          return searchForAssistant(query, 8)
        },
      },
      {
        name: "get_item",
        description: "Full detail of one hub item by id: summary, status, sources, related ids, and type-specific fields such as permissions by role, rule numbers, flow steps or what each source says.",
        inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
        execute: (input) => {
          const id = String(input.id ?? "")
          const item = byId.get(id)
          if (!item) throw new Error(`No item with id "${id}". Use search_hub to find ids.`)
          setStatus(`Reading ${item.title}`)
          return slim(item)
        },
      },
    ]

    // Turns must alternate: merge neighbours with the same role (a failed answer leaves two questions in a row),
    // put the instructions ahead of the first question and the pre-search beside the latest one.
    const input = history.reduce<{ role: Turn["role"]; content: string }[]>((acc, t) => {
      const last = acc.at(-1)
      if (last?.role === t.role) last.content += `\n\n${t.content}`
      else acc.push({ role: t.role, content: t.content })
      return acc
    }, [])
    input[0].content = `${RULES}\n\nQuestion: ${input[0].content}`
    input[input.length - 1].content += `\n\n(Hub search results for this question; search for more if needed: ${JSON.stringify(pre)})`
    ctl.current = new AbortController()
    setLive("")
    setStatus("Thinking…")
    try {
      const { text, truncated } = await sample(input, {
        tools, signal: ctl.current.signal, modelTier: "default",
        onText: ({ text }) => { setStatus(null); setLive(text) },
      })
      setTurns([...history, { role: "assistant", content: text + (truncated ? "\n(Answer cut short. Ask a narrower question.)" : "") }])
    } catch (err) {
      const e = err as { code?: string; text?: string }
      if (e.code === "not_granted" || e.code === "sampling_disabled" || e.code === "not_declared" || e.code === "capability_disabled" || e.code === "tools_unavailable" || e.code === "capability_removed") {
        setOff("The assistant isn't available in this view. Search still works.")
      }
      const note = e.code === "cancelled" ? "(Stopped.)" : errorCopy[e.code ?? ""] ?? "Couldn't get an answer. Try again."
      setTurns([...history, { role: "assistant", content: `${e.text ? e.text + "\n" : ""}${note}`, failed: e.code !== "cancelled" }])
    } finally {
      ctl.current = null
      setLive(null)
      setStatus(null)
    }
  }

  // Questions handed over from elsewhere in the hub ("Ask about this", the home search).
  useEffect(() => {
    if (!assistantQ || assistantQ.n === lastQ.current) return
    lastQ.current = assistantQ.n
    send(assistantQ.q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistantQ])

  const fallback = !sample ? search(turns.at(-1)?.content ?? "", 5) : []

  return (
    <Sheet open={assistantOpen} onOpenChange={setAssistantOpen}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[520px]">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="flex items-center gap-2.5 text-[19px]">
            <span className="grid size-9 place-items-center rounded-[10px] bg-night text-night-ink"><Sparkles className="size-4.5" /></span>
            Ask the hub
          </SheetTitle>
          <SheetDescription>Answers come only from the hub's documented content, with the item IDs it used. Anything not decided is called out.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {!sample && (
            <div className="rounded-[12px] bg-muted p-4 text-[14.5px]">
              <p className="font-semibold text-foreground">AI answers aren't switched on in this copy yet.</p>
              <p className="mt-1">For now it lists the closest hub items.</p>
            </div>
          )}
          {off && <p className="rounded-[12px] bg-amber-soft p-3 text-[14.5px] text-foreground">{off}</p>}

          {turns.length === 0 && (
            <div className="space-y-2">
              <p className="eyebrow text-muted-foreground">Try asking</p>
              {starters.map((s) => (
                <button key={s} onClick={() => send(s)} className="block w-full rounded-[12px] border bg-card px-4 py-3 text-left text-[15px] text-foreground hover:border-primary/60">
                  {s}
                </button>
              ))}
            </div>
          )}

          {turns.map((t, i) =>
            t.role === "user" ? (
              <div key={i} className="flex justify-end"><p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[15px] text-primary-foreground">{t.content}</p></div>
            ) : (
              <div key={i} className="flex gap-3">
                <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-night text-night-ink"><Bot className="size-4" /></span>
                <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border bg-card px-4 py-3"><Answer text={t.content} /></div>
              </div>
            ),
          )}

          {!sample && turns.length > 0 && (
            <div className="space-y-2">
              <p className="eyebrow text-muted-foreground">Closest hub items</p>
              {fallback.length ? fallback.map(({ item }) => <ItemLink key={item.id} id={item.id} />) : <p className="text-muted-foreground">Nothing matched. Try other words.</p>}
            </div>
          )}

          {live !== null && (
            <div className="flex gap-3">
              <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-night text-night-ink"><Bot className="size-4" /></span>
              <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border bg-card px-4 py-3">
                {status && <p className="flex items-center gap-2 text-[14px] text-muted-foreground"><Search className="size-4 animate-pulse" /> {status}</p>}
                {live && <Answer text={live} />}
              </div>
            </div>
          )}
          <div ref={end} />
        </div>

        <form
          className="flex gap-2 border-t px-6 py-4"
          onSubmit={(e) => { e.preventDefault(); send(draft) }}
        >
          <label htmlFor="assistant-q" className="sr-only">Your question</label>
          <input
            id="assistant-q"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about a role, rule, flow or record…"
            maxLength={600}
            className="h-11 min-w-0 flex-1 rounded-[12px] border bg-card px-3.5 text-[15.5px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-primary/20"
          />
          {live !== null ? (
            <Button type="button" size="icon" variant="outline" className="size-11" onClick={() => ctl.current?.abort()} aria-label="Stop"><Square /></Button>
          ) : (
            <Button type="submit" size="icon" className="size-11" aria-label="Send" disabled={!draft.trim()}><ArrowUp className="size-5" /></Button>
          )}
        </form>
      </SheetContent>
    </Sheet>
  )
}

/** What the assistant may read about one item: everything that matters, nothing bulky. */
function slim(item: Item) {
  const out: Record<string, unknown> = { ...item }
  if (item.kind === "flow") {
    const f = item as Item & { steps: { label: string; lane: string; detail?: string; rules?: string[] }[]; lanes: { id: string; label: string }[] }
    out.steps = f.steps.map((s, i) => `${i + 1}. [${f.lanes.find((l) => l.id === s.lane)?.label}] ${s.label}${s.detail ? ` (${s.detail})` : ""}${s.rules?.length ? ` rules: ${s.rules.join(", ")}` : ""}`)
    delete out.lanes
  }
  if (item.kind === "entity") { delete out.x; delete out.y }
  return out
}
