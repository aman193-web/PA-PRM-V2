import { useState } from "react"
import { gaps, statusMeta, type Status } from "@hub/content"
import { PageHead, StatusChip } from "@hub/components/bits"
import { useNav } from "@hub/lib/nav"
import { cn } from "@hub/lib/utils"

const filters: (Status | "all")[] = ["all", "open", "default", "proposed", "confirmed", "assumption", "specified"]

export function Gaps() {
  const { open } = useNav()
  const [f, setF] = useState<Status | "all">("all")
  const list = gaps.filter((g) => f === "all" || g.status === f)
  const count = (s: Status) => gaps.filter((g) => g.status === s).length
  return (
    <div>
      <PageHead
        eyebrow="Contradictions, open questions, assumptions"
        title="Gaps & decisions"
        sub="Where the documents disagree or are silent. Each entry shows what every source says, the practical default we use until it's decided, and who owns the decision."
      />
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["open", "default", "proposed", "confirmed"] as Status[]).map((s) => (
          <button key={s} onClick={() => setF(s)} className={cn("flex min-w-0 flex-col items-start justify-start rounded-[14px] border bg-card p-4 text-left hover:border-primary/60", f === s && "border-primary")}>
            <StatusChip status={s} className="h-auto min-h-6 max-w-full py-0.5 whitespace-normal" />
            <span className="mt-2 block text-[28px] leading-none font-bold text-foreground tabular">{count(s)}</span>
            <span className="text-[13px] text-muted-foreground">{statusMeta[s].hint}</span>
          </button>
        ))}
      </div>
      <div className="mb-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {filters.map((s) => (
          <button key={s} onClick={() => setF(s)} aria-pressed={f === s} className={cn("h-9 shrink-0 rounded-full border px-3.5 text-[14px] font-medium", f === s ? "border-primary bg-brand-soft text-primary" : "bg-card text-foreground")}>
            {s === "all" ? `All · ${gaps.length}` : `${statusMeta[s].label} · ${count(s)}`}
          </button>
        ))}
      </div>
      <ul className="grid gap-3">
        {list.map((g) => (
          <li key={g.id}>
            <button onClick={() => open(g.id)} className="w-full rounded-[14px] border bg-card p-4 text-left transition hover:border-primary/60 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[12.5px] text-muted-foreground">{g.id}</span>
                <b className="min-w-0 flex-1 text-[16px] text-foreground">{g.title}</b>
                <StatusChip status={g.status} />
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-[1.3fr_1fr]">
                <ul className="space-y-1.5 text-[14px]">
                  {g.says.map((s, i) => <li key={i} className="flex gap-2"><span className="w-[74px] shrink-0 font-mono text-[12px] font-semibold text-foreground">{s.doc}</span><span>{s.text}</span></li>)}
                </ul>
                <div className="rounded-[10px] bg-amber-soft/60 px-3 py-2.5 text-[14px]">
                  <span className="eyebrow block text-amber-ink">{g.status === "confirmed" ? "Decided" : "Practical default"}</span>
                  <span className="text-foreground">{g.resolution}</span>
                  <span className="mt-1 block text-[12.5px] text-muted-foreground">Owner: {g.owner}</span>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
