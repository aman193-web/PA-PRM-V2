import { useRef } from "react"
import { ArrowLeft, ArrowRight, Ban, Check, Smartphone, Workflow } from "lucide-react"
import { byId, permissions, type Persona, type RoleId } from "@hub/content"
import { earlierRoles, personas, roleShort } from "@hub/content/personas"
import { CellMark, cellText, CommentButton, PageHead, Panel, Sources, StageBadge, StatusChip } from "@hub/components/bits"
import { Button } from "@hub/components/ui/button"
import { useNav } from "@hub/lib/nav"
import { portals } from "@hub/content/reference"

const hasPortal = (id: string) => portals.some((x) => x.persona === id)

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2)
}

export function Personas({ id }: { id?: string }) {
  const p = id ? personas.find((x) => x.id === id) : undefined
  return p ? <PersonaDetail p={p} /> : <PersonaGrid />
}

function PersonaGrid() {
  const { go } = useNav()
  const side = (s: Persona["side"]) => personas.filter((p) => p.side === s)
  return (
    <div>
      <PageHead eyebrow="12 roles from the BRD" title="Personas" sub="Who each user is, what they do, and what they can and can't do. Names are illustrative; the documents describe roles only." />
      {(["vendor", "partner"] as const).map((s) => (
        <section key={s} className="mb-8">
          <h2 className="mb-3 flex items-baseline gap-2 text-[18px] font-semibold">
            {s === "vendor" ? "Vendor side" : "Partner side"}
            <span className="text-[14px] font-normal text-muted-foreground">{s === "vendor" ? "The company running the program (Brightline)" : "The companies in your programs"}</span>
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {side(s).map((p) => (
              <li key={p.id}>
                <button onClick={() => go("personas", p.id)} className="group flex h-full w-full flex-col rounded-[14px] border bg-card p-5 text-left transition hover:border-primary/60">
                  <span className="flex items-center gap-3">
                    <span className={`grid size-11 shrink-0 place-items-center rounded-full text-[15px] font-bold ${s === "vendor" ? "bg-night text-night-ink" : "bg-amber-soft text-amber-ink"}`}>{initials(p.sampleName)}</span>
                    <span className="min-w-0">
                      <b className="block text-[16px] leading-tight text-foreground">{p.short}</b>
                      <span className="text-[13.5px] text-muted-foreground">{p.sampleName}{p.org ? ` · ${p.org}` : ""}</span>
                      {hasPortal(p.id) && <span className="mt-1 block w-fit rounded-full bg-ok-soft px-2 py-0.5 text-[12px] font-semibold text-ok">Portal in prototype</span>}
                    </span>
                  </span>
                  <span className="mt-3 text-[14.5px]">{p.mainJob}</span>
                  <span className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4 text-[13px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><Smartphone className="size-3.5" />{p.device}</span>
                    <StageBadge stage={p.stage} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <Panel title="Earlier role names you may hear" sub="The September PRD and the October brief used different roles. Here's how they map to the BRD personas.">
        <ul className="divide-y">
          {earlierRoles.map((r) => (
            <li key={r.name} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-[14.5px]">
              <span className="w-16 font-mono text-[12.5px] text-muted-foreground">{r.from}</span>
              <span className="min-w-0 flex-1 text-foreground">{r.name}</span>
              <span className="inline-flex items-center gap-1.5 text-primary"><ArrowRight className="size-4" />{roleShort[r.maps as RoleId]}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}

function PersonaDetail({ p }: { p: Persona }) {
  const { go, open } = useNav()
  const ref = useRef<HTMLDivElement>(null)
  const perms = permissions.map((a) => ({ a, cell: a.cells[p.id as RoleId] ?? "no" })).filter((x) => x.cell !== "no")
  const denied = permissions.filter((a) => (a.cells[p.id as RoleId] ?? "no") === "no")
  return (
    <div ref={ref}>
      <button onClick={() => go("personas")} className="mb-4 inline-flex items-center gap-1.5 text-[15px] font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> All personas</button>

      <section className="relative overflow-hidden rounded-[18px] bg-night p-6 text-night-ink sm:p-8">
        <div aria-hidden className="map-grid pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative flex flex-wrap items-start gap-5">
          <span className={`grid size-16 shrink-0 place-items-center rounded-full text-[22px] font-bold ${p.side === "vendor" ? "bg-white/10 text-white" : "bg-amber text-[#2a1a00]"}`}>{initials(p.sampleName)}</span>
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-amber">{p.side === "vendor" ? "Vendor side" : "Partner side"} · value from Stage {p.stage}</p>
            <h1 className="mt-1 text-[28px] leading-tight font-bold text-white sm:text-[32px]">{p.title}</h1>
            <p className="text-[15px] text-night-muted">Sample name: {p.sampleName}{p.org ? ` at ${p.org}` : ""} (illustrative)</p>
            <p className="mt-3 max-w-[70ch] text-[16px]">{p.summary}</p>
          </div>
          <div className="flex flex-wrap gap-2"><StatusChip status={p.status} /><CommentButton target={ref} label="Comment" /></div>
        </div>
        <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
          {[["Main job", p.mainJob], ["Main number on first load", p.mainNumber], ["Main action", p.mainAction]].map(([k, v]) => (
            <div key={k} className="rounded-[12px] border border-white/12 bg-white/5 p-4">
              <p className="eyebrow text-night-muted">{k}</p>
              <p className="mt-1 text-[16px] font-semibold text-white">{v}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Can">
          <ul className="space-y-2.5">{p.can.map((c) => <li key={c} className="flex gap-2.5 text-[15px]"><Check className="mt-0.5 size-4 shrink-0 text-ok" strokeWidth={3} />{c}</li>)}</ul>
        </Panel>
        <Panel title="Cannot">
          <ul className="space-y-2.5">{p.cannot.map((c) => <li key={c} className="flex gap-2.5 text-[15px]"><Ban className="mt-0.5 size-4 shrink-0 text-bad" />{c}</li>)}</ul>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Panel title="Permissions" sub="From the permission matrix. Select one for every role." bodyClass="px-0 pb-2">
          <ul>
            {perms.map(({ a, cell }) => (
              <li key={a.id} className="border-t first:border-t-0">
                <button onClick={() => open(a.id)} className="flex w-full items-center gap-3 px-5 py-2.5 text-left hover:bg-muted/50">
                  <CellMark cell={cell} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] text-foreground">{a.title}</span>
                    <span className="text-[13px] text-muted-foreground">{a.notes?.[p.id as RoleId] ?? cellText(cell)} · Stage {a.stage}</span>
                  </span>
                  <StatusChip status={a.status} />
                </button>
              </li>
            ))}
          </ul>
          {denied.length > 0 && <p className="px-5 pt-3 text-[13.5px] text-muted-foreground">Not allowed: {denied.map((d) => d.title).join(" · ")}.</p>}
        </Panel>
        <div className="space-y-6">
          <Panel title="Flows they appear in">
            {p.journeys.length ? (
              <div className="grid gap-2">{p.journeys.map((j) => (
                <button key={j} onClick={() => go("flows", j)} className="flex items-center gap-3 rounded-[10px] border px-3 py-2.5 text-left text-[15px] text-foreground hover:border-primary/60">
                  <Workflow className="size-4 text-primary" />{byId.get(j)?.title}
                </button>
              ))}</div>
            ) : <p className="text-muted-foreground">Supports every flow from behind the scenes.</p>}
          </Panel>
          <Panel title="Hand-offs">
            <div className="space-y-3 text-[15px]">
              <p><b className="text-foreground">Hands off to:</b> {p.handsOffTo.length ? p.handsOffTo.map((r) => <button key={r} onClick={() => go("personas", r)} className="mr-2 text-primary hover:underline">{roleShort[r as RoleId]}</button>) : "—"}</p>
              <p><b className="text-foreground">Receives from:</b> {p.receivesFrom.length ? p.receivesFrom.map((r) => <button key={r} onClick={() => go("personas", r)} className="mr-2 text-primary hover:underline">{roleShort[r as RoleId]}</button>) : "Agents and systems"}</p>
              <p><b className="text-foreground">How they sign in:</b> {p.signIn}</p>
            </div>
          </Panel>
          <Panel title="Pain points">
            <ul className="space-y-2 text-[15px]">{p.pains.map((x) => <li key={x} className="flex gap-2.5"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-amber" />{x}</li>)}</ul>
            <p className="mt-3 text-[13px] text-muted-foreground">From the BRD's problem and objection tables; no user research exists yet (G29).</p>
          </Panel>
        </div>
      </div>

      {p.points?.length ? <Panel className="mt-6" title="Also worth knowing"><ul className="space-y-2 text-[15px]">{p.points.map((x) => <li key={x}>{x}</li>)}</ul></Panel> : null}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Sources sources={p.sources} />
        <Button variant="outline" onClick={() => go("matrix")}>Open the full matrix <ArrowRight /></Button>
      </div>
    </div>
  )
}
