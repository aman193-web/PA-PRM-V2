import { useState } from "react"
import { Search } from "lucide-react"
import { integrations } from "@hub/content"
import { families, glossary, portals, sourceDocs, stages } from "@hub/content/reference"
import { PageHead, Panel, StatusChip } from "@hub/components/bits"
import { useNav } from "@hub/lib/nav"

export function Reference() {
  const { open } = useNav()
  const [term, setTerm] = useState("")
  const terms = glossary.filter((g) => `${g.title} ${g.summary}`.toLowerCase().includes(term.trim().toLowerCase()))
  return (
    <div className="space-y-6">
      <PageHead eyebrow="Background" title="Reference" sub="Stages and their exit gates, requirement families, integrations, the glossary and where every fact comes from." />

      <Panel title="Stages" sub="Each with a written exit gate" action={<StatusChip status="proposed" />}>
        <ol className="grid gap-3 md:grid-cols-5">
          {stages.map((s, i) => (
            <li key={s.id}>
              <button onClick={() => open(s.id)} className="flex h-full w-full flex-col rounded-[12px] border p-4 text-left hover:border-primary/60">
                <span className="font-mono text-[12.5px] text-primary">{["0", "1A", "1B", "2", "3"][i]}</span>
                <b className="mt-1 text-[15px] leading-snug text-foreground">{s.title.split("· ")[1]}</b>
                <span className="mt-1.5 text-[13.5px]">{s.summary}</span>
                <span className="mt-auto pt-3 text-[13px] text-foreground"><b>Exit:</b> {s.points?.[0]?.replace("Exit gate: ", "")}</span>
              </button>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel title="Prototype portals" sub="What's designed so far. A demo welcome page signs you in as each person; actions in one portal show up in the others.">
        <ul className="grid gap-4 md:grid-cols-2">
          {portals.map((p) => (
            <li key={p.persona} className="rounded-[12px] border p-4">
              <button onClick={() => open(p.persona)} className="text-left">
                <b className="block text-[16px] text-foreground hover:text-primary">{p.role}</b>
                <span className="text-[14px] text-muted-foreground">{p.person} · {p.org} · Stage {p.stage}</span>
              </button>
              <ul className="mt-3 space-y-1 text-[14px]">{p.screens.map((x) => <li key={x} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{x}</li>)}</ul>
              {p.added.length > 0 && (
                <div className="mt-3 rounded-[10px] border border-dashed border-amber-ink/50 bg-amber-soft/40 px-3 py-2 text-[13.5px]">
                  <b className="text-amber-ink">Added beyond the documents:</b> {p.added.join("; ")}
                </div>
              )}
            </li>
          ))}
        </ul>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Panel title="Requirement families · 83 IDs" sub="65 from BRD §7, 12 motivation (ME), 6 creator (IN)" bodyClass="p-0">
          <table className="w-full text-left text-[14px]">
            <thead><tr className="border-b bg-surface-2 text-[13px] text-muted-foreground"><th className="px-5 py-2.5 font-semibold">Family</th><th className="px-3 py-2.5 text-right font-semibold">By stage (1A · 1B · 2 · 3)</th></tr></thead>
            <tbody>{families.map((f) => <tr key={f.id} className="border-b last:border-0"><td className="px-5 py-2.5 text-foreground">{f.title}</td><td className="px-3 py-2.5 text-right font-mono text-[13px] tabular">{f.summary.match(/: (.*)\./)?.[1]}</td></tr>)}</tbody>
          </table>
        </Panel>
        <Panel title="Integrations by stage">
          <ul className="space-y-3">
            {integrations.map((i) => (
              <li key={i.id}>
                <button onClick={() => open(i.id)} className="w-full rounded-[10px] border p-3 text-left hover:border-primary/60">
                  <span className="flex items-center justify-between gap-2"><b className="text-[14.5px] text-foreground">{i.title}</b><StatusChip status={i.status} /></span>
                  <span className="mt-1 block text-[13.5px]">{i.summary}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Glossary" action={
        <label className="relative w-48 sm:w-64">
          <span className="sr-only">Filter the glossary</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Filter terms" className="h-9 w-full rounded-[10px] border bg-card pr-2 pl-9 text-[14.5px] text-foreground outline-none focus:border-primary" />
        </label>
      }>
        <dl className="grid gap-x-8 gap-y-3 md:grid-cols-2">
          {terms.map((t) => <div key={t.id}><dt className="font-semibold text-foreground">{t.title}</dt><dd className="text-[14.5px]">{t.summary}</dd></div>)}
        </dl>
      </Panel>

      <Panel title="Sources, ranked by authority" sub="When sources disagree, the higher rank wins and the difference goes in Gaps." bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[14px]">
            <thead><tr className="border-b bg-surface-2 text-[13px] text-muted-foreground"><th className="px-5 py-2.5 font-semibold">Rank</th><th className="px-3 py-2.5 font-semibold">Source</th><th className="px-3 py-2.5 font-semibold">What it is</th><th className="px-3 py-2.5 font-semibold">How the hub uses it</th></tr></thead>
            <tbody>{sourceDocs.map((d) => <tr key={d.id} className="border-b last:border-0"><td className="px-5 py-2.5 font-mono tabular">{d.rank}</td><td className="px-3 py-2.5"><b className="block text-foreground">{d.title}</b><span className="text-[12.5px] text-muted-foreground">{d.id} · {d.date}</span></td><td className="px-3 py-2.5">{d.what}</td><td className="px-3 py-2.5 text-foreground">{d.use}</td></tr>)}</tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
