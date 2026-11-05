import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { permissions, type Cell, type RoleId } from "@hub/content"
import { personas, roleOrder, roleShort } from "@hub/content/personas"
import { CellMark, cellText, PageHead, StatusChip } from "@hub/components/bits"
import { Tooltip, TooltipContent, TooltipTrigger } from "@hub/components/ui/tooltip"
import { useNav } from "@hub/lib/nav"
import { cn } from "@hub/lib/utils"

const legend: Cell[] = ["yes", "own", "assigned", "approval", "open", "no"]

export function Matrix() {
  const { open, go } = useNav()
  const [side, setSide] = useState<"all" | "vendor" | "partner">("all")
  const [area, setArea] = useState("All")
  const [text, setText] = useState("")
  const areas = ["All", ...Array.from(new Set(permissions.map((p) => p.area)))]
  const roles = roleOrder.filter((r) => side === "all" || personas.find((p) => p.id === r)!.side === side)
  const rows = useMemo(() => {
    const t = text.trim().toLowerCase()
    return permissions.filter((p) => (area === "All" || p.area === area) && (!t || `${p.title} ${p.summary} ${(p.tags ?? []).join(" ")}`.toLowerCase().includes(t)))
  }, [area, text])

  return (
    <div>
      <PageHead eyebrow="Who can do what" title="Permission matrix" sub="Every action against every role. Select a cell for the rule, notes and sources." />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Filter actions</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground" />
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Filter actions, e.g. credit, approve, lead" className="h-11 w-full rounded-[12px] border bg-card pr-3 pl-11 text-[15.5px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-primary/20" />
        </label>
        <div role="radiogroup" aria-label="Side" className="flex gap-1 rounded-[12px] border bg-card p-1">
          {(["all", "vendor", "partner"] as const).map((s) => (
            <button key={s} role="radio" aria-checked={side === s} onClick={() => setSide(s)} className={cn("h-9 rounded-[9px] px-3.5 text-[14.5px] font-medium", side === s ? "bg-night text-white" : "text-foreground hover:bg-muted")}>
              {s === "all" ? "All roles" : s === "vendor" ? "Vendor" : "Partner"}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {areas.map((a) => (
          <button key={a} onClick={() => setArea(a)} aria-pressed={area === a} className={cn("h-9 shrink-0 rounded-full border px-3.5 text-[14px] font-medium", area === a ? "border-primary bg-brand-soft text-primary" : "bg-card text-foreground hover:border-border-strong")}>{a}</button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13.5px]">
        {legend.map((c) => <span key={c} className="inline-flex items-center gap-2"><CellMark cell={c} /> {cellText(c)}</span>)}
      </div>

      <div className="overflow-x-auto rounded-[14px] border bg-card">
        <table className="w-full min-w-[920px] border-collapse text-left">
          <thead>
            <tr className="border-b bg-surface-2">
              <th scope="col" className="sticky left-0 z-10 w-[280px] min-w-[280px] bg-surface-2 px-4 py-3 text-[13.5px] font-semibold text-muted-foreground">Action</th>
              {roles.map((r) => {
                const p = personas.find((x) => x.id === r)!
                return (
                  <th key={r} scope="col" className="px-1 py-3 text-center align-bottom">
                    <button onClick={() => go("personas", r)} className={cn("mx-auto block w-[74px] text-[12.5px] leading-tight font-semibold hover:text-primary", p.side === "vendor" ? "text-foreground" : "text-amber-ink")}>
                      {roleShort[r]}
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-b last:border-0 hover:bg-muted/40">
                <th scope="row" className="sticky left-0 z-10 bg-card px-4 py-2.5 font-normal">
                  <button onClick={() => open(a.id)} className="block text-left">
                    <span className="block text-[14.5px] font-medium text-foreground hover:text-primary">{a.title}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted-foreground"><span className="whitespace-nowrap">{a.area} · Stage {a.stage}</span>{a.status !== "specified" && <StatusChip status={a.status} className="h-5 px-2 text-[11.5px]" />}</span>
                  </button>
                </th>
                {roles.map((r) => {
                  const cell = a.cells[r as RoleId] ?? "no"
                  return (
                    <td key={r} className="px-1 py-2 text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => open(a.id)} className="rounded-md" aria-label={`${roleShort[r]}: ${a.title}: ${a.notes?.[r as RoleId] ?? cellText(cell)}`}>
                            <CellMark cell={cell} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>{roleShort[r]}: {a.notes?.[r as RoleId] ?? cellText(cell)}</TooltipContent>
                      </Tooltip>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[13.5px] text-muted-foreground">Every row applies the same guardrails: agents act with exactly the user's permissions, the API and database enforce them (not just the screen), and partners never see each other's data.</p>
    </div>
  )
}
