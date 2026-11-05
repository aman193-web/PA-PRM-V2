import { useRef, type ReactNode } from "react"
import { Check, CircleHelp, FileText, MessageSquarePlus, Minus, TriangleAlert, X } from "lucide-react"
import { byId, kindLabel, statusMeta, type Cell, type Item, type Src, type Status } from "@hub/content"
import { sourceDocs } from "@hub/content/reference"
import { Tooltip, TooltipContent, TooltipTrigger } from "@hub/components/ui/tooltip"
import { useCapability, type CommentsNs } from "@hub/lib/claude"
import { useNav } from "@hub/lib/nav"
import { cn } from "@hub/lib/utils"

const statusStyle: Record<Status, string> = {
  confirmed: "bg-ok-soft text-ok",
  specified: "bg-brand-soft text-primary",
  proposed: "bg-violet-soft text-violet",
  default: "bg-amber-soft text-amber-ink",
  open: "bg-bad-soft text-bad",
  assumption: "border border-dashed border-border-strong bg-transparent text-slate",
  conflict: "bg-bad text-white",
}

export function StatusChip({ status, className }: { status: Status; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-semibold whitespace-nowrap", statusStyle[status], className)}>
          <span className="size-1.5 rounded-full bg-current" aria-hidden />
          {statusMeta[status].label}
        </span>
      </TooltipTrigger>
      <TooltipContent>{statusMeta[status].hint}</TooltipContent>
    </Tooltip>
  )
}

export function KindTag({ kind }: { kind: Item["kind"] }) {
  return <span className="eyebrow text-muted-foreground">{kindLabel[kind]}</span>
}

export function Code({ children, className }: { children: ReactNode; className?: string }) {
  return <code className={cn("rounded-md bg-muted px-1.5 py-0.5 font-mono text-[12.5px] text-foreground", className)}>{children}</code>
}

export function StageBadge({ stage }: { stage?: string }) {
  if (!stage) return null
  return <span className="inline-flex h-6 shrink-0 items-center rounded-md border px-2 font-mono text-[12px] whitespace-nowrap text-muted-foreground">Stage {stage}</span>
}

export function Sources({ sources }: { sources: Src[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {sources.map((s, i) => {
        const d = sourceDocs.find((x) => x.id === s.doc)
        return (
          <li key={i}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex h-7 items-center gap-1.5 rounded-md bg-muted px-2 text-[13px] text-foreground">
                  <FileText className="size-3.5 text-muted-foreground" />
                  <b className="font-semibold">{s.doc}</b>
                  {s.ref && <span className="text-muted-foreground">{s.ref}</span>}
                </span>
              </TooltipTrigger>
              {d && <TooltipContent>{d.title} · {d.date}</TooltipContent>}
            </Tooltip>
          </li>
        )
      })}
    </ul>
  )
}

/** A clickable reference to any item, by id. */
export function ItemLink({ id, compact }: { id: string; compact?: boolean }) {
  const { open } = useNav()
  const item = byId.get(id)
  if (!item) return <Code>{id}</Code>
  return (
    <button
      onClick={() => open(id)}
      className={cn("group inline-flex max-w-full items-center gap-2 rounded-lg border bg-card text-left transition hover:border-primary/60 hover:bg-brand-soft/40", compact ? "min-h-8 px-2.5 py-1" : "px-3 py-2")}
    >
      <span className="shrink-0 font-mono text-[12px] text-muted-foreground">{/^(R-|UX-|G\d)/.test(item.id) ? item.id : kindLabel[item.kind]}</span>
      <span className="line-clamp-2 text-[14px] leading-snug font-medium text-foreground group-hover:text-primary">{item.title}</span>
    </button>
  )
}

export function PageHead({ eyebrow, title, sub, actions }: { eyebrow?: string; title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 flex-1 basis-80">
        {eyebrow && <p className="eyebrow mb-1.5 text-primary">{eyebrow}</p>}
        <h1 className="text-[27px] leading-tight font-bold sm:text-[30px]">{title}</h1>
        {sub && <p className="mt-1.5 max-w-[68ch] text-[16px] text-muted-foreground">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

export function Panel({ title, sub, action, children, className, bodyClass }: { title?: ReactNode; sub?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={cn("min-w-0 rounded-[14px] border bg-card", className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            {title && <h2 className="text-[17px] font-semibold">{title}</h2>}
            {sub && <p className="mt-0.5 text-[14px] text-muted-foreground">{sub}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn("p-5", title && "pt-3.5", bodyClass)}>{children}</div>
    </section>
  )
}

const cellStyle: Record<Cell, { cls: string; mark: ReactNode; label: string }> = {
  yes: { cls: "bg-ok-soft text-ok", mark: <Check className="size-4" strokeWidth={3} />, label: "Yes" },
  no: { cls: "text-border-strong", mark: <Minus className="size-4" />, label: "No" },
  own: { cls: "bg-brand-soft text-primary", mark: <span className="text-[12px] font-bold">OWN</span>, label: "Own only" },
  assigned: { cls: "bg-brand-soft text-primary", mark: <span className="text-[12px] font-bold">ASN</span>, label: "Assigned partners" },
  approval: { cls: "bg-amber-soft text-amber-ink", mark: <span className="text-[12px] font-bold">APR</span>, label: "Needs approval" },
  open: { cls: "bg-bad-soft text-bad", mark: <CircleHelp className="size-4" />, label: "Open question" },
  na: { cls: "text-muted-foreground", mark: <span>·</span>, label: "Not applicable" },
}

export function CellMark({ cell, large }: { cell: Cell; large?: boolean }) {
  const c = cellStyle[cell]
  // The faint dash keeps the grid quiet; on a single answer "No" needs to read clearly.
  const loudNo = large && cell === "no"
  return (
    <span className={cn("inline-grid place-items-center rounded-md font-mono", large ? "h-9 min-w-9 px-2" : "h-7 min-w-7 px-1", loudNo ? "bg-muted text-foreground" : c.cls)} aria-label={c.label}>
      {loudNo ? <X className="size-4" strokeWidth={3} /> : c.mark}
    </span>
  )
}

export const cellText = (cell: Cell) => cellStyle[cell].label

/** Opens the viewer's comment composer on an element, so a reader can raise a question exactly here. */
export function CommentButton({ target, label = "Comment" }: { target: React.RefObject<HTMLElement | null>; label?: string }) {
  const comments = useCapability<CommentsNs>("comments")
  const busy = useRef(false)
  if (!comments) return null
  return (
    <button
      onClick={async () => {
        if (busy.current || !target.current) return
        busy.current = true
        try { await comments.openComposer({ element: target.current }) } catch { /* comments unavailable here */ }
        busy.current = false
      }}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-card px-3 text-[14px] font-medium text-foreground hover:border-primary/60"
    >
      <MessageSquarePlus className="size-4 text-primary" /> {label}
    </button>
  )
}

export function Callout({ tone = "info", children }: { tone?: "info" | "warn"; children: ReactNode }) {
  return (
    <div className={cn("flex gap-3 rounded-[12px] px-4 py-3 text-[14.5px]", tone === "warn" ? "bg-amber-soft text-foreground" : "bg-brand-soft/70 text-foreground")}>
      {tone === "warn" ? <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-ink" /> : <CircleHelp className="mt-0.5 size-4 shrink-0 text-primary" />}
      <div className="min-w-0">{children}</div>
    </div>
  )
}
