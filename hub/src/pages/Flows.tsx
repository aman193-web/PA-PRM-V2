import { useEffect, useMemo, useRef, useState } from "react"
import { ReactFlow, ReactFlowProvider, Controls, Handle, Position, MarkerType, useReactFlow, useStore, type Edge, type Node, type NodeProps } from "@xyflow/react"
import { ChevronLeft, ChevronRight, Database, PenLine } from "lucide-react"
import { flows, type Flow } from "@hub/content"
import { roleShort } from "@hub/content/personas"
import { CommentButton, ItemLink, PageHead, Panel, Sources, StageBadge, StatusChip } from "@hub/components/bits"
import { Button } from "@hub/components/ui/button"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@hub/components/ui/select"
import { useNav } from "@hub/lib/nav"
import { cn } from "@hub/lib/utils"

const LABEL_W = 150
const COL_W = 220
const LANE_H = 132
const NODE_W = 188
const NODE_H = 86

const groups: { id: Flow["group"]; label: string }[] = [
  { id: "journey", label: "Journeys J-01 to J-05" },
  { id: "pam", label: "Partner manager flows" },
  { id: "handoff", label: "End to end" },
]

type StepData = { label: string; n: number; who: string; main?: boolean; active: boolean; dim: boolean }
type LaneData = { label: string; width: number; persona?: string; dim: boolean }

function StepNode({ data }: NodeProps<Node<StepData>>) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col justify-center rounded-[12px] border-2 bg-card px-3 py-2 text-left shadow-[0_2px_6px_#102f5712] transition",
        data.main ? "border-primary/70" : "border-border",
        data.active && "ring-4 ring-amber/70",
        data.dim && "opacity-35",
      )}
    >
      <Handle type="target" position={Position.Left} className="!size-1.5 !border-0 !bg-border-strong" />
      {/* The actor is repeated here because lane labels scroll out of view once the canvas follows a step. */}
      <span className={cn("truncate text-[11.5px] font-semibold", data.main ? "text-primary" : "text-muted-foreground")}><span className="font-mono">{data.n}</span> · {data.who}</span>
      <span className="text-[13.5px] leading-snug font-semibold text-foreground">{data.label}</span>
      <Handle type="source" position={Position.Right} className="!size-1.5 !border-0 !bg-border-strong" />
    </div>
  )
}

function LaneNode({ data }: NodeProps<Node<LaneData>>) {
  return (
    <div className={cn("flex h-full items-center rounded-[12px] border border-dashed bg-lane/70 transition", data.dim && "opacity-40")} style={{ width: data.width }}>
      <span className="w-[136px] pl-4 text-[13px] leading-tight font-semibold text-foreground">
        {data.label}
        {data.persona && <span className="block text-[11.5px] font-normal text-muted-foreground">persona</span>}
      </span>
    </div>
  )
}

const nodeTypes = { step: StepNode, lane: LaneNode }

function Canvas({ flow, active, setActive, persona }: { flow: Flow; active: number; setActive: (i: number) => void; persona: string | null }) {
  const rf = useReactFlow()
  const laneIndex = useMemo(() => Object.fromEntries(flow.lanes.map((l, i) => [l.id, i])), [flow])
  const width = LABEL_W + flow.steps.length * COL_W + 20
  const dimLane = (id: string) => !!persona && flow.lanes.find((l) => l.id === id)?.persona !== persona

  const nodes: Node[] = useMemo(() => [
    ...flow.lanes.map((l, i) => ({
      id: `lane-${l.id}`, type: "lane", position: { x: 0, y: i * LANE_H }, draggable: false, selectable: false, zIndex: -1,
      data: { label: l.label, width, persona: l.persona, dim: dimLane(l.id) }, style: { width, height: LANE_H - 12 },
    })),
    ...flow.steps.map((s, i) => ({
      id: s.id, type: "step", draggable: false,
      position: { x: LABEL_W + i * COL_W, y: laneIndex[s.lane] * LANE_H + (LANE_H - 12 - NODE_H) / 2 },
      style: { width: NODE_W, height: NODE_H },
      data: { label: s.label, n: i + 1, who: flow.lanes[laneIndex[s.lane]]?.label ?? "", main: s.main, active: i === active, dim: dimLane(s.lane) },
    })),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [flow, active, persona])

  const edges: Edge[] = useMemo(() => flow.steps.flatMap((s) => (s.next ?? []).map((n) => ({
    id: `${s.id}-${n.to}`, source: s.id, target: n.to, type: "smoothstep", label: n.label,
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "var(--border-strong)" },
    style: { strokeWidth: 1.75 },
  }))), [flow])

  // Fitting a long flow into the box makes it unreadable, so hold a readable zoom and follow the active step.
  const paneW = useStore((st) => st.width)
  const paneH = useStore((st) => st.height)
  const first = useRef(true)
  useEffect(() => { first.current = true }, [flow])
  useEffect(() => {
    if (!paneW || !paneH) return
    const pad = 16
    const contentH = flow.lanes.length * LANE_H
    const zoom = Math.min(1, Math.max(0.7, (paneH - pad * 2) / contentH))
    const step = flow.steps[active]
    const cx = LABEL_W + active * COL_W + NODE_W / 2
    const cy = (laneIndex[step.lane] ?? 0) * LANE_H + LANE_H / 2
    const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
    const x = clamp(paneW / 2 - cx * zoom, Math.min(pad, paneW - width * zoom - pad), pad)
    const y = contentH * zoom <= paneH - pad * 2
      ? (paneH - contentH * zoom) / 2
      : clamp(paneH / 2 - cy * zoom, paneH - contentH * zoom - pad, pad)
    rf.setViewport({ x, y, zoom }, { duration: first.current ? 0 : 300 })
    first.current = false
  }, [flow, active, paneW, paneH, rf, laneIndex, width])

  return (
    <ReactFlow
      nodes={nodes} edges={edges} nodeTypes={nodeTypes}
      nodesDraggable={false} nodesConnectable={false} edgesFocusable={false}
      zoomOnScroll={false} panOnScroll={false} preventScrolling={false} minZoom={0.3} maxZoom={1.6}
      onNodeClick={(_, n) => { const i = flow.steps.findIndex((s) => s.id === n.id); if (i >= 0) setActive(i) }}
      proOptions={{ hideAttribution: true }}
    >
      <Controls showInteractive={false} position="bottom-right" fitViewOptions={{ padding: 0.08 }} />
    </ReactFlow>
  )
}

export function Flows({ id }: { id?: string }) {
  const { go } = useNav()
  const flow = flows.find((f) => f.id === id) ?? flows.find((f) => f.id === "flow-j01")!
  const [active, setActive] = useState(0)
  const [persona, setPersona] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { setActive(0); setPersona(null) }, [flow.id])
  const step = flow.steps[active]
  const lane = flow.lanes.find((l) => l.id === step.lane)
  const personaLanes = flow.lanes.filter((l) => l.persona)

  return (
    <div>
      <PageHead eyebrow="How it works, step by step" title="Flows" sub="Each row is an actor or system. Step through to see who acts, what data moves, and which rule applies." />
      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <nav aria-label="Flows" className="hidden xl:block">
          {groups.map((g) => (
            <div key={g.id} className="mb-5">
              <p className="eyebrow mb-2 text-muted-foreground">{g.label}</p>
              <ul className="grid gap-1">
                {flows.filter((f) => f.group === g.id).map((f) => (
                  <li key={f.id}>
                    <button onClick={() => go("flows", f.id)} aria-current={f.id === flow.id ? "page" : undefined} className={cn("w-full rounded-[10px] px-3 py-2 text-left text-[14.5px]", f.id === flow.id ? "bg-night font-semibold text-white" : "text-foreground hover:bg-muted")}>
                      {f.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="min-w-0 space-y-4" ref={ref}>
          <div className="xl:hidden">
            <label htmlFor="flow-pick" className="sr-only">Choose a flow</label>
            <Select value={flow.id} onValueChange={(v) => go("flows", v)}>
              <SelectTrigger id="flow-pick" className="h-11! w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectGroup key={g.id}>
                    <SelectLabel>{g.label}</SelectLabel>
                    {flows.filter((f) => f.group === g.id).map((f) => <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>)}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <section className="rounded-[14px] border bg-card p-5">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-[21px] font-bold">{flow.title}</h2>
                <p className="mt-1 text-[15px]">{flow.summary}</p>
              </div>
              <div className="flex flex-wrap gap-2"><StageBadge stage={flow.stage} /><StatusChip status={flow.status} /></div>
            </div>
            {flow.promise && <p className="mt-3 rounded-[10px] bg-brand-soft/70 px-3.5 py-2.5 text-[14.5px] text-foreground"><b>Promise:</b> {flow.promise}</p>}
            {personaLanes.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[14px]">
                <span className="text-muted-foreground">Highlight a persona:</span>
                <button onClick={() => setPersona(null)} aria-pressed={!persona} className={cn("h-8 rounded-full border px-3", !persona ? "border-foreground bg-foreground text-background" : "bg-card")}>Everyone</button>
                {personaLanes.map((l) => (
                  <button key={l.id} onClick={() => setPersona(l.persona!)} aria-pressed={persona === l.persona} className={cn("h-8 rounded-full border px-3", persona === l.persona ? "border-primary bg-brand-soft text-primary" : "bg-card")}>{roleShort[l.persona!]}</button>
                ))}
              </div>
            )}
          </section>

          <div className="h-[440px] overflow-hidden rounded-[14px] border bg-card sm:h-[540px]" aria-label={`${flow.title} diagram`}>
            <ReactFlowProvider key={flow.id}>
              <Canvas flow={flow} active={active} setActive={setActive} persona={persona} />
            </ReactFlowProvider>
          </div>

          <Panel>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="icon" onClick={() => setActive(Math.max(0, active - 1))} disabled={active === 0} aria-label="Previous step"><ChevronLeft /></Button>
              <span className="font-mono text-[13.5px] text-muted-foreground tabular">Step {active + 1} of {flow.steps.length}</span>
              <Button variant="outline" size="icon" onClick={() => setActive(Math.min(flow.steps.length - 1, active + 1))} disabled={active === flow.steps.length - 1} aria-label="Next step"><ChevronRight /></Button>
              <span className="flex-1" />
              <CommentButton target={ref} label="Comment on this flow" />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr]">
              <div>
                <p className="eyebrow text-muted-foreground">{lane?.label}</p>
                <p className="mt-1 text-[19px] leading-snug font-bold text-foreground">{step.label}</p>
                {step.detail && <p className="mt-1.5 text-[15px]">{step.detail}</p>}
                {step.main && <p className="mt-2 inline-block rounded-full bg-brand-soft px-2.5 py-0.5 text-[12.5px] font-semibold text-primary">Key step</p>}
              </div>
              <div className="space-y-3 text-[14.5px]">
                {step.reads?.length ? <p className="flex gap-2"><Database className="mt-0.5 size-4 shrink-0 text-primary" /><span><b className="text-foreground">Reads:</b> {step.reads.join(", ")}</span></p> : null}
                {step.writes?.length ? <p className="flex gap-2"><PenLine className="mt-0.5 size-4 shrink-0 text-ok" /><span><b className="text-foreground">Writes:</b> {step.writes.join(", ")}</span></p> : null}
                {step.rules?.length ? <div className="flex flex-col gap-2">{step.rules.map((r) => <ItemLink key={r} id={r} compact />)}</div> : <p className="text-muted-foreground">No specific rule on this step.</p>}
              </div>
            </div>
          </Panel>

          <Panel title="All steps" sub="The same flow as a list">
            <ol className="space-y-1">
              {flow.steps.map((s, i) => (
                <li key={s.id}>
                  <button onClick={() => setActive(i)} className={cn("flex w-full items-start gap-3 rounded-[10px] px-2 py-2 text-left", i === active ? "bg-amber-soft" : "hover:bg-muted/60")}>
                    <span className={cn("grid size-6 shrink-0 place-items-center rounded-full font-mono text-[12px] font-bold", s.main ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>{i + 1}</span>
                    <span className="min-w-0"><b className="text-[14.5px] text-foreground">{s.label}</b><span className="block text-[13px] text-muted-foreground">{flow.lanes.find((l) => l.id === s.lane)?.label}{s.next?.some((n) => n.label) ? ` · ${s.next.filter((n) => n.label).map((n) => `${n.label} → step ${flow.steps.findIndex((x) => x.id === n.to) + 1}`).join(", ")}` : ""}</span></span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="mt-4"><Sources sources={flow.sources} /></div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
