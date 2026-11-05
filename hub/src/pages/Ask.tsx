import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowRight, BookOpen, CircleAlert, LayoutGrid, Network, Scale, Search, Sparkles, Trophy, Users, Workflow, X } from "lucide-react"
import { allItems, byId, entities, faqs, gaps, kindLabel, statusMeta, type Entity, type Item, type Status } from "@hub/content"
import { personas, roleShort } from "@hub/content/personas"
import { CellMark, ItemLink, KindTag, Sources, StatusChip } from "@hub/components/bits"
import { Button } from "@hub/components/ui/button"
import { useNav, type Page } from "@hub/lib/nav"
import { answerQuestion, search, type CanAnswer } from "@hub/lib/search"
import { cn } from "@hub/lib/utils"

const order: Item["kind"][] = ["faq", "permission", "persona", "rule", "entity", "flow", "gap", "agent", "value", "competitor", "integration", "stage", "requirement", "term"]

export function Ask() {
  const { open, go, askAssistant } = useNav()
  const [q, setQ] = useState("")
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const typing = e.target instanceof Element && e.target.closest("input, textarea, [contenteditable]")
      if ((e.key === "/" && !typing) || (e.key === "k" && (e.metaKey || e.ctrlKey))) { e.preventDefault(); input.current?.focus() }
    }
    window.addEventListener("keydown", on)
    return () => window.removeEventListener("keydown", on)
  }, [])

  const hits = useMemo(() => search(q, 30), [q])
  const answer = useMemo(() => answerQuestion(q), [q])
  const groups = order.map((k) => ({ k, items: hits.filter((h) => h.item.kind === k) })).filter((g) => g.items.length)

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[18px] bg-night px-5 py-8 text-night-ink sm:px-9 sm:py-10">
        <div aria-hidden className="map-grid pointer-events-none absolute inset-0 opacity-80" />
        <div className="relative max-w-3xl">
          <p className="eyebrow text-amber">Partner Revenue Management</p>
          <h1 className="mt-2 text-[30px] leading-[1.1] font-bold text-white sm:text-[38px]">Ask anything about the product.</h1>
          <p className="mt-2 max-w-[60ch] text-[16px] text-night-muted">
            Roles, permissions, SLA rules, flows and where every record comes from, each with its source and whether it's decided.
          </p>
          <form className="mt-6" onSubmit={(e) => { e.preventDefault(); if (q.trim() && !hits.length && !answer) askAssistant(q) }}>
            <label htmlFor="hub-search" className="sr-only">Search the hub</label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate" />
              <input
                id="hub-search"
                ref={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="e.g. Can a partner sales rep change credit?"
                className="h-14 w-full rounded-[14px] border-0 bg-white pr-12 pl-12 text-[16.5px] text-[#18181b] shadow-[0_10px_30px_#00000040] outline-none placeholder:text-[#6b7686] focus:ring-4 focus:ring-amber/50"
                autoComplete="off"
              />
              {q && (
                <button type="button" onClick={() => { setQ(""); input.current?.focus() }} className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-md text-slate hover:bg-slate-soft" aria-label="Clear search">
                  <X className="size-4" />
                </button>
              )}
            </div>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {faqs.slice(0, 6).map((f) => (
              <button key={f.id} onClick={() => setQ(f.title)} className="rounded-[18px] border border-white/20 bg-white/5 px-3 py-1.5 text-left text-[14px] text-night-ink hover:border-amber/70 hover:text-white">
                {f.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {q.trim() ? (
        <div className="space-y-6">
          {answer?.kind === "can" && <CanCard a={answer} />}
          {answer?.kind === "origin" && <OriginCard ids={answer.entityIds} />}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border bg-card px-5 py-4">
            <p className="text-[15px]"><b className="text-foreground">{hits.length ? `${hits.length} matches` : "No direct match"}</b> in the hub{hits.length ? "" : ". Ask the assistant to look across everything."}</p>
            <Button onClick={() => askAssistant(q)}><Sparkles /> Ask the assistant</Button>
          </div>

          {groups.map((g) => (
            <section key={g.k}>
              <h2 className="eyebrow mb-2.5 text-muted-foreground">{kindLabel[g.k]} · {g.items.length}</h2>
              <ul className="grid gap-2.5 md:grid-cols-2">
                {g.items.slice(0, 8).map(({ item }) => (
                  <li key={item.id}>
                    <button onClick={() => open(item.id)} className="flex h-full w-full flex-col gap-1.5 rounded-[12px] border bg-card p-4 text-left transition hover:border-primary/60">
                      <span className="flex w-full items-start justify-between gap-3">
                        <b className="text-[15.5px] leading-snug text-foreground">{item.title}</b>
                        <StatusChip status={item.status} />
                      </span>
                      <span className="line-clamp-2 text-[14.5px]">{item.summary}</span>
                      {/^(R-|UX-|G\d)/.test(item.id) && <span className="font-mono text-[12px] text-muted-foreground">{item.id}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <Overview go={go} />
      )}
    </div>
  )
}

function CanCard({ a }: { a: CanAnswer }) {
  const { open } = useNav()
  const verdict = a.cell === "yes" ? "Yes" : a.cell === "no" ? "No" : a.cell === "open" ? "Not decided yet" : a.cell === "approval" ? "Only with approval" : a.cell === "own" ? "Only their own" : a.cell === "assigned" ? "Only for assigned partners" : "Not applicable"
  const tone = a.cell === "yes" ? "border-ok/50" : a.cell === "no" ? "border-bad/40" : "border-amber/60"
  return (
    <section className={cn("rounded-[16px] border-2 bg-card p-5 sm:p-6", tone)}>
      <KindTag kind="permission" />
      <div className="mt-2 flex flex-wrap items-center gap-4">
        <CellMark cell={a.cell} large />
        <div className="min-w-0 flex-1">
          <p className="text-[24px] leading-tight font-bold text-foreground">{verdict}</p>
          <p className="text-[15.5px]"><b className="text-foreground">{roleShort[a.role]}</b> · {a.action.title}{a.note ? ` · ${a.note}` : ""}</p>
        </div>
        <StatusChip status={a.action.status} />
      </div>
      <p className="mt-4 text-[15.5px] text-foreground">{a.action.summary}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Sources sources={a.action.sources} />
        <Button variant="outline" onClick={() => open(a.action.id)}>See every role <ArrowRight /></Button>
      </div>
      <p className="mt-3 text-[13.5px] text-muted-foreground">Matched the question to the permission "{a.action.title}". If that's not what you meant, check the results below or ask the assistant.</p>
    </section>
  )
}

function OriginCard({ ids }: { ids: string[] }) {
  const { go } = useNav()
  const list = ids.map((i) => entities.find((e) => e.id === i)).filter(Boolean) as Entity[]
  return (
    <section className="rounded-[16px] border-2 border-primary/40 bg-card p-5 sm:p-6">
      <KindTag kind="entity" />
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {list.map((e) => (
          <div key={e.id} className="rounded-[12px] bg-surface-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <b className="text-[17px] text-foreground">{e.title}</b>
              <StatusChip status={e.status} />
            </div>
            <p className="mt-1 text-[14.5px]">{e.summary}</p>
            <p className="eyebrow mt-3 mb-1 text-muted-foreground">Comes from</p>
            <ul className="space-y-1 text-[15px] text-foreground">{e.origins.map((o) => <li key={o} className="flex gap-2"><ArrowRight className="mt-1 size-4 shrink-0 text-primary" />{o}</li>)}</ul>
            <p className="mt-3 text-[14px]"><b className="text-foreground">Lives in</b> {e.livesIn} · <b className="text-foreground">Changed by</b> {e.changedBy}</p>
            <Button variant="outline" className="mt-4" onClick={() => go("map", e.id)}><Network /> Show on the data map</Button>
          </div>
        ))}
      </div>
    </section>
  )
}

function Overview({ go }: { go: (p: Page, id?: string) => void }) {
  const tiles: { page: Page; title: string; text: string; icon: typeof Users; stat: string }[] = [
    { page: "personas", title: "Personas", text: "Who each role is, what they can and can't do.", icon: Users, stat: `${personas.length} roles` },
    { page: "matrix", title: "Permissions", text: "Every action against every role, one grid.", icon: LayoutGrid, stat: `${allItems.filter((i) => i.kind === "permission").length} actions` },
    { page: "rules", title: "Rules & SLA", text: "Registration, SLA, credit, approvals, agents.", icon: Scale, stat: `${allItems.filter((i) => i.kind === "rule").length} rules` },
    { page: "flows", title: "Flows", text: "Step-by-step journeys, by actor and system.", icon: Workflow, stat: `${allItems.filter((i) => i.kind === "flow").length} flows` },
    { page: "map", title: "Data map", text: "Where leads, deals and credit come from.", icon: Network, stat: `${entities.length} records` },
    { page: "why", title: "Why us", text: "Problems we solve, objections, competitors.", icon: Trophy, stat: "5 competitors" },
    { page: "gaps", title: "Gaps & decisions", text: "Contradictions, open questions, defaults.", icon: CircleAlert, stat: `${gaps.length} entries` },
    { page: "reference", title: "Reference", text: "Stages, requirement families, glossary, sources.", icon: BookOpen, stat: "83 requirement IDs" },
  ]
  const tally = (["confirmed", "specified", "proposed", "default", "open", "assumption"] as Status[]).map((s) => ({ s, n: allItems.filter((i) => i.status === s).length }))
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-[18px] font-semibold">Browse the hub</h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {tiles.map((t) => (
            <li key={t.page}>
              <button onClick={() => go(t.page)} className="group flex h-full w-full flex-col rounded-[14px] border bg-card p-5 text-left transition hover:border-primary/60">
                <span className="grid size-10 place-items-center rounded-[10px] bg-brand-soft text-primary"><t.icon className="size-5" /></span>
                <b className="mt-3 text-[16.5px] text-foreground">{t.title}</b>
                <span className="mt-0.5 text-[14.5px]">{t.text}</span>
                <span className="mt-auto flex items-center justify-between pt-3 text-[13.5px] font-medium text-muted-foreground">{t.stat}<ArrowRight className="size-4 text-primary opacity-0 transition group-hover:opacity-100" /></span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="rounded-[14px] border bg-card p-5">
          <h2 className="text-[17px] font-semibold">Quick answers</h2>
          <p className="mt-0.5 text-[14px] text-muted-foreground">The questions clients ask most.</p>
          <ul className="mt-3 grid gap-2">
            {faqs.slice(0, 10).map((f) => <li key={f.id}><ItemLink id={f.id} /></li>)}
          </ul>
        </div>
        <div className="rounded-[14px] border bg-card p-5">
          <h2 className="text-[17px] font-semibold">How sure is each answer?</h2>
          <p className="mt-0.5 text-[14px] text-muted-foreground">Every item carries one of these. Only Confirmed and Specified are settled.</p>
          <ul className="mt-4 space-y-3">
            {tally.map(({ s, n }) => (
              <li key={s} className="flex items-start gap-3">
                <StatusChip status={s} className="w-[178px] justify-start" />
                <span className="min-w-0 flex-1 text-[14px]">{statusMeta[s].hint}</span>
                <span className="font-mono text-[13px] text-muted-foreground tabular">{n}</span>
              </li>
            ))}
          </ul>
          <Button variant="outline" className="mt-5 w-full" onClick={() => go("gaps")}>See what's still open <ArrowRight /></Button>
        </div>
      </section>
      <p className="text-[13.5px] text-muted-foreground">Tip: press <kbd className="rounded border bg-card px-1.5 font-mono text-[12px]">/</kbd> to search from anywhere on this page. {byId.size} items in total.</p>
    </div>
  )
}
