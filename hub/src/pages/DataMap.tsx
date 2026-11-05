import { useEffect, useMemo, useRef, useState } from "react"
import { ReactFlow, ReactFlowProvider, Controls, Handle, Position, MarkerType, useReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react"
import { ArrowRight, Route } from "lucide-react"
import { entities, type Entity, type RoleId } from "@hub/content"
import { entityLinks } from "@hub/content/entities"
import { roleOrder, roleShort } from "@hub/content/personas"
import { CommentButton, ItemLink, PageHead, Panel, Sources, StageBadge, StatusChip } from "@hub/components/bits"
import { Button } from "@hub/components/ui/button"
import { useNav } from "@hub/lib/nav"
import { cn } from "@hub/lib/utils"

const PATH = ["ent-lead-vendor", "ent-registration", "ent-opportunity", "ent-credit", "ent-recon", "ent-value"]
const home: Record<Entity["livesIn"], string> = {
  Salesforce: "bg-[#e8f6fb] text-[#06779e] dark:bg-[#10303d] dark:text-[#7fd3f0]",
  PRM: "bg-brand-soft text-primary",
  "PRM → Salesforce": "bg-brand-soft text-primary",
  "Salesforce / marketing": "bg-amber-soft text-amber-ink",
  "PRM or Salesforce": "bg-muted text-foreground",
}

type RecData = { e: Entity; active: boolean; dim: boolean; onPath: boolean }

function RecordNode({ data }: NodeProps<Node<RecData>>) {
  return (
    <div className={cn("w-[220px] rounded-[12px] border-2 bg-card px-3.5 py-3 shadow-[0_2px_6px_#102f5712] transition", data.active ? "border-primary ring-4 ring-amber/60" : data.onPath ? "border-amber" : "border-border", data.dim && "opacity-35")}>
      <Handle type="target" position={Position.Left} className="!size-1.5 !border-0 !bg-border-strong" />
      <span className={cn("inline-block rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold", home[data.e.livesIn])}>{data.e.livesIn}</span>
      <span className="mt-1 block text-[14.5px] leading-snug font-semibold text-foreground">{data.e.title}</span>
      <span className="text-[12px] text-muted-foreground">Stage {data.e.stage}</span>
      <Handle type="source" position={Position.Right} className="!size-1.5 !border-0 !bg-border-strong" />
    </div>
  )
}
const nodeTypes = { rec: RecordNode }

function MapCanvas({ active, onPick, path }: { active: string; onPick: (id: string) => void; path: boolean }) {
  const rf = useReactFlow()
  const nodes: Node[] = useMemo(() => entities.map((e) => ({
    id: e.id, type: "rec", position: { x: e.x, y: e.y }, draggable: false,
    data: { e, active: e.id === active, onPath: path && PATH.includes(e.id), dim: path && !PATH.includes(e.id) },
  })), [active, path])
  const edges: Edge[] = useMemo(() => entityLinks.map(([a, b, label]) => {
    const on = path && PATH.includes(a) && PATH.includes(b) && PATH.indexOf(b) === PATH.indexOf(a) + 1
    return {
      id: `${a}-${b}`, source: a, target: b, label, type: "smoothstep", animated: on,
      style: { strokeWidth: on ? 2.5 : 1.5, stroke: on ? "var(--amber)" : undefined, opacity: path && !on ? 0.3 : 1 },
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: on ? "var(--amber)" : "var(--border-strong)" },
    }
  }), [path])
  useEffect(() => { const t = setTimeout(() => rf.fitView({ padding: 0.1 }), 30); return () => clearTimeout(t) }, [rf])
  return (
    <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} nodesDraggable={false} nodesConnectable={false} zoomOnScroll={false} panOnScroll={false} preventScrolling={false} minZoom={0.3} fitView onNodeClick={(_, n) => onPick(n.id)} proOptions={{ hideAttribution: true }}>
      <Controls showInteractive={false} position="bottom-right" />
    </ReactFlow>
  )
}

export function DataMap({ id }: { id?: string }) {
  const { go } = useNav()
  const e = entities.find((x) => x.id === id) ?? entities[0]
  const [path, setPath] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div>
      <PageHead
        eyebrow="Where data comes from"
        title="Data map"
        sub="Every record, where it originates, which system owns it, and who can create or change it. Salesforce stays the system of record."
        actions={<Button variant={path ? "default" : "outline"} onClick={() => setPath(!path)}><Route /> {path ? "Hide" : "Show"} lead-to-revenue path</Button>}
      />
      <div className="mb-3 flex flex-wrap gap-2 text-[13px]">
        {(["Salesforce / marketing", "PRM", "Salesforce"] as const).map((k) => <span key={k} className={cn("rounded-md px-2 py-1 font-semibold", home[k])}>{k}</span>)}
        <span className="text-muted-foreground">Select a record for its details.</span>
      </div>
      <div className="h-[420px] overflow-hidden rounded-[14px] border bg-card sm:h-[500px]">
        <ReactFlowProvider>
          <MapCanvas active={e.id} onPick={(i) => go("map", i)} path={path} />
        </ReactFlowProvider>
      </div>
      {path && (
        <ol className="mt-3 flex flex-wrap items-center gap-2 text-[14px]">
          {PATH.map((p, i) => <li key={p} className="inline-flex items-center gap-2"><button onClick={() => go("map", p)} className="rounded-full bg-amber-soft px-3 py-1 font-medium text-amber-ink">{entities.find((x) => x.id === p)!.title}</button>{i < PATH.length - 1 && <ArrowRight className="size-4 text-muted-foreground" />}</li>)}
        </ol>
      )}

      <div ref={ref} className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Panel title={e.title} sub={e.summary} action={<div className="flex gap-2"><StageBadge stage={e.stage} /><StatusChip status={e.status} /></div>}>
          <p className="eyebrow mb-1.5 text-muted-foreground">Comes from</p>
          <ul className="space-y-1.5 text-[15px] text-foreground">{e.origins.map((o) => <li key={o} className="flex gap-2"><ArrowRight className="mt-1 size-4 shrink-0 text-primary" />{o}</li>)}</ul>
          <dl className="mt-4 grid gap-3 text-[14.5px] sm:grid-cols-2">
            <div><dt className="eyebrow text-muted-foreground">Lives in</dt><dd className="text-foreground">{e.livesIn}</dd></div>
            <div><dt className="eyebrow text-muted-foreground">Created by</dt><dd className="text-foreground">{e.createdBy}</dd></div>
            <div><dt className="eyebrow text-muted-foreground">Changed by</dt><dd className="text-foreground">{e.changedBy}</dd></div>
            <div><dt className="eyebrow text-muted-foreground">Read by</dt><dd className="text-foreground">{e.readBy}</dd></div>
          </dl>
          {e.states?.length ? (
            <div className="mt-4">
              <p className="eyebrow mb-1.5 text-muted-foreground">Lifecycle</p>
              <p className="flex flex-wrap items-center gap-1.5 text-[14px]">{e.states.map((s, i) => <span key={s} className="inline-flex items-center gap-1.5"><span className="rounded-md bg-muted px-2 py-0.5 text-foreground">{s}</span>{i < e.states!.length - 1 && <ArrowRight className="size-3.5 text-muted-foreground" />}</span>)}</p>
            </div>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><Sources sources={e.sources} /><CommentButton target={ref} /></div>
        </Panel>
        <div className="space-y-6">
          <Panel title="Who can do what with it" bodyClass="px-0 pb-2">
            <ul>
              {roleOrder.filter((r) => e.crud[r as RoleId]).map((r) => (
                <li key={r} className="flex items-center justify-between gap-3 border-t px-5 py-2.5 text-[14.5px] first:border-t-0">
                  <button onClick={() => go("personas", r)} className="text-foreground hover:text-primary">{roleShort[r]}</button>
                  <span className="text-right font-medium text-foreground">{e.crud[r as RoleId]}</span>
                </li>
              ))}
            </ul>
            <p className="px-5 pt-2 text-[13px] text-muted-foreground">Roles not listed have no access to this record.</p>
          </Panel>
          {e.related?.length ? <Panel title="Related"><div className="flex flex-col gap-2">{e.related.map((r) => <ItemLink key={r} id={r} />)}</div></Panel> : null}
        </div>
      </div>
    </div>
  )
}
