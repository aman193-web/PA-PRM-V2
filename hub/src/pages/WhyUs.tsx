import { ArrowRight, MessageSquareQuote } from "lucide-react"
import { asks, competitorCaps, gapsVsImpartner, impartnerNotes, objections, problems, shifts } from "@hub/content/value"
import { personas } from "@hub/content/personas"
import { ItemLink, PageHead, Panel, StatusChip } from "@hub/components/bits"
import { useNav } from "@hub/lib/nav"
import { cn } from "@hub/lib/utils"

const capTone = (v: string) => (v.startsWith("Yes") ? "text-ok font-semibold" : v === "Partial" ? "text-amber-ink" : v.startsWith("Stage") || v.startsWith("Feed") ? "text-primary" : "text-muted-foreground")

export function WhyUs() {
  const { go } = useNav()
  return (
    <div className="space-y-6">
      <PageHead eyebrow="Value and differentiators" title="Why us" sub="The problems we solve, how we're built differently, and how to answer the objections clients raise." />

      <Panel title="Problems we solve" sub="From the BRD's problem table" action={<StatusChip status="specified" />} bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[14.5px]">
            <thead><tr className="border-b bg-surface-2 text-[13px] text-muted-foreground"><th className="px-5 py-2.5 font-semibold">Problem</th><th className="px-5 py-2.5 font-semibold">Root cause</th><th className="px-5 py-2.5 font-semibold">How we solve it</th></tr></thead>
            <tbody>{problems.map((p) => <tr key={p.problem} className="border-b last:border-0"><td className="px-5 py-3 font-medium text-foreground">{p.problem}</td><td className="px-5 py-3">{p.cause}</td><td className="px-5 py-3 text-foreground">{p.answer}</td></tr>)}</tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Panel title="How we're built differently" sub="Incumbents were built before AI; we build around it" action={<StatusChip status="proposed" />}>
          <ul className="space-y-3">
            {shifts.map((s) => (
              <li key={s.before} className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <span className="rounded-[10px] bg-muted px-3 py-2 text-[14px] text-muted-foreground line-through decoration-border-strong">{s.before}</span>
                <ArrowRight className="hidden size-4 text-primary sm:block" />
                <span className="rounded-[10px] bg-brand-soft/70 px-3 py-2 text-[14px] font-medium text-foreground">{s.after}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="What executives ask for" action={<StatusChip status="specified" />}>
          <ul className="divide-y">
            {asks.map((a) => <li key={a.role} className="py-2.5 first:pt-0 last:pb-0"><b className="text-foreground">{a.role}</b> · {a.ask}<span className="block text-[13.5px] text-muted-foreground">Measured by: {a.measure}</span></li>)}
          </ul>
          <div className="mt-4"><ItemLink id="value-promise" /></div>
        </Panel>
      </div>

      <section>
        <h2 className="mb-3 text-[18px] font-semibold">Objections and how to answer them</h2>
        <p className="mb-3 text-[14px] text-muted-foreground">Likely objections from the BRD, not research findings.</p>
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {objections.map((o) => (
            <li key={o.says} className="flex flex-col rounded-[14px] border bg-card p-4">
              <MessageSquareQuote className="size-5 text-amber" />
              <p className="mt-2 text-[15.5px] font-semibold text-foreground">"{o.says}"</p>
              <p className="text-[13px] text-muted-foreground">{o.who}</p>
              <p className="mt-2 text-[14.5px]">{o.answer}</p>
            </li>
          ))}
        </ul>
      </section>

      <Panel title="Competitors" sub="Public material, October 2026. Not evident means no public evidence, not proof it's missing." action={<StatusChip status="proposed" />} bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[14px]">
            <thead><tr className="border-b bg-surface-2 text-[13px] text-muted-foreground"><th className="px-5 py-2.5 font-semibold">Capability</th>{["Impartner", "ZINFI", "Mindmatrix", "Salesforce", "PartnerStack"].map((c) => <th key={c} className="px-3 py-2.5 font-semibold">{c}</th>)}<th className="px-3 py-2.5 font-semibold text-foreground">Us</th></tr></thead>
            <tbody>
              {competitorCaps.map((c) => (
                <tr key={c.cap} className="border-b last:border-0">
                  <td className="px-5 py-3 font-medium text-foreground">{c.cap}</td>
                  {[c.impartner, c.zinfi, c.mindmatrix, c.salesforce, c.partnerstack].map((v, i) => <td key={i} className={cn("px-3 py-3", capTone(v))}>{v}</td>)}
                  <td className={cn("bg-brand-soft/40 px-3 py-3", capTone(c.us))}>{c.us}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="What we saw in the Impartner demo" sub="27 Oct 2026">
          <ul className="space-y-2 text-[14.5px]">{impartnerNotes.map((n) => <li key={n} className="flex gap-2.5"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />{n}</li>)}</ul>
        </Panel>
        <Panel title="Gaps we found against them">
          <ul className="divide-y">{gapsVsImpartner.map((g) => <li key={g.item} className="flex items-center justify-between gap-3 py-2.5 text-[14.5px] first:pt-0 last:pb-0"><span className="text-foreground">{g.item}</span><span className={cn("rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold", g.state.startsWith("Built") ? "bg-ok-soft text-ok" : g.state === "Stage 2" ? "bg-muted text-muted-foreground" : "bg-amber-soft text-amber-ink")}>{g.state}</span></li>)}</ul>
        </Panel>
      </div>

      <Panel title="Pain points by persona" sub="Derived from the BRD; no user research yet (G29)">
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {personas.map((p) => (
            <li key={p.id}>
              <button onClick={() => go("personas", p.id)} className="h-full w-full rounded-[12px] border p-3 text-left hover:border-primary/60">
                <b className="text-[14.5px] text-foreground">{p.short}</b>
                <ul className="mt-1 space-y-1 text-[13.5px]">{p.pains.map((x) => <li key={x}>· {x}</li>)}</ul>
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
