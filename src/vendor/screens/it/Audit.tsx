import { useState } from "react"
import { Bot, Cog, Download, ScrollText, Search, User } from "lucide-react"
import { toast } from "sonner"
import { EmptyState, PageHeader, PageTabs, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ago, time } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import type { AuditEntry } from "@/vendor/admin"

const kindIcon = { person: <User />, agent: <Bot />, system: <Cog /> }
const kindTile = { person: "bg-brand-soft text-primary", agent: "bg-[#f9e8f7] text-[#a02a94] dark:bg-[#3a1537] dark:text-[#f0a6e6]", system: "bg-secondary text-foreground" }

function exportAudit(rows: AuditEntry[]) {
  const head = "ID,Time,Actor,Type,Area,Action"
  const lines = rows.map((r) => [r.id, r.at, r.actor, r.kind, r.area, r.text].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","))
  const a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob([[head, ...lines].join("\n")], { type: "text/csv" }))
  a.download = "prm-audit-log.csv"
  a.click()
}

/** The append-only audit log (R-SEC-6): every person, system and agent action, from every portal. */
export function ItAudit({ tab }: { tab?: string }) {
  const { state, dispatch } = useStore()
  const [q, setQ] = useState("")
  const t = tab === "person" || tab === "agent" || tab === "system" ? tab : "all"
  const t2 = q.trim().toLowerCase()
  const rows = state.audit.filter((r) => (t === "all" || r.kind === t) && (!t2 || `${r.actor} ${r.text} ${r.area}`.toLowerCase().includes(t2)))
  const count = (k: AuditEntry["kind"]) => state.audit.filter((r) => r.kind === k).length
  return (
    <div>
      <PageHeader
        title="Audit log"
        sub="Append-only. Every person, system and agent action from every portal, with who and when. Nobody can edit or delete a line, including you."
        actions={<Button size="lg" variant="outline" onClick={() => { exportAudit(rows); dispatch({ type: "itExport", rows: rows.length }); toast.success("Audit log exported", { description: `${rows.length} entries. The export itself is logged.` }) }}><Download /> Export</Button>}
      />
      <PageTabs
        label="Who acted"
        value={t}
        onChange={(v) => go(v === "all" ? "/v/audit" : `/v/audit/${v}`)}
        items={[
          { value: "all", label: "Everything", icon: <ScrollText />, count: state.audit.length },
          { value: "person", label: "People", icon: <User />, count: count("person") },
          { value: "agent", label: "Agents", icon: <Bot />, count: count("agent"), hint: "The AI supervisor sees these too, with evidence, confidence and cost." },
          { value: "system", label: "Systems", icon: <Cog />, count: count("system") },
        ]}
      />
      <div className="relative mb-4 max-w-[420px]">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by person, account or action" aria-label="Filter the audit log" className="h-11 w-full rounded-[12px] border bg-card pr-3 pl-11 text-[15.5px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary" />
      </div>
      <Panel bodyClass="p-0 sm:p-0">
        {rows.length === 0 ? <EmptyState icon={<ScrollText className="size-6" />} title="Nothing matches" /> : (
          <ul>
            {rows.map((r) => (
              <li key={r.id} className="grid grid-cols-[36px_minmax(0,1fr)] gap-x-3 border-b px-5 py-3 last:border-0 sm:grid-cols-[36px_minmax(0,1fr)_120px] sm:px-6">
                <span className={cn("grid size-9 place-items-center rounded-[9px] [&_svg]:size-[18px]", kindTile[r.kind])}>{kindIcon[r.kind]}</span>
                <span className="min-w-0">
                  <span className="block text-[15px] text-foreground"><b>{r.actor}</b> · {r.text}</span>
                  <span className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground"><span className="font-mono">{r.id}</span><Badge variant="outline" className="h-5 px-1.5 text-[12px]">{r.area}</Badge><span className="sm:hidden">{ago(r.at)}</span></span>
                </span>
                <span className="hidden text-right text-[13.5px] text-muted-foreground sm:block">{ago(r.at)}<span className="block">{time(r.at)}</span></span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <p className="mt-4 text-[14px] text-muted-foreground">IT reads and exports the whole log; the AI supervisor reads the agent lines. Agents never export (R-AG-2).</p>
    </div>
  )
}
