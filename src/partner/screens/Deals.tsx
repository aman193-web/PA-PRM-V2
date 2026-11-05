import { useState } from "react"
import { Bot, Briefcase, CircleHelp, Clock3, Plus, ShieldCheck, Trophy, Archive, Search, UserCheck } from "lucide-react"
import { EmptyState, PageHeader, PageTabs, Panel } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Registration } from "@/data/model"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { company } from "@/partner/data"
import { usePartner, usePartnerData } from "@/partner/usePartner"
import { DealRows } from "@/partner/bits"

type Tab = "needs" | "review" | "protected" | "won" | "closed" | "all"
const tabs: Tab[] = ["needs", "review", "protected", "won", "closed", "all"]

export function PartnerDeals({ tab }: { tab?: string }) {
  const { isExec } = usePartner()
  const d = usePartnerData()
  const { state } = useStore()
  // Open on every deal, newest first, so a deal you just registered is easy to find; "Needs you" keeps its count on its tab.
  const t: Tab = tabs.includes(tab as Tab) ? (tab as Tab) : "all"
  const [q, setQ] = useState("")
  const [rep, setRep] = useState("all")
  const [by, setBy] = useState<"all" | "rules" | "you">("all")

  const pick: Record<Tab, (r: Registration) => boolean> = {
    needs: (r) => d.needsReply.includes(r) || d.expiring.includes(r),
    review: (r) => r.state === "under_review",
    protected: (r) => r.state === "approved",
    won: (r) => r.state === "won",
    closed: (r) => ["lost", "rejected", "expired"].includes(r.state),
    all: () => true,
  }
  const count = (k: Tab) => d.deals.filter(pick[k]).length
  const rows = d.deals
    .filter(pick[t])
    .filter((r) => rep === "all" || r.rep === rep)
    .filter((r) => by === "all" || r.decision?.by === by)
    .filter((r) => !q.trim() || `${r.customer} ${r.product}`.toLowerCase().includes(q.trim().toLowerCase()))
  const reps = [...new Set(d.deals.map((r) => r.rep))]
  const teamReps = state.team.filter((m) => m.role === "Partner sales rep").length

  return (
    <div>
      <PageHeader
        title={isExec ? "Deals" : "My deals"}
        sub={isExec ? `Every ${company.name} deal across ${teamReps} reps, with the real stage from Brightline's CRM.` : "Only your registrations. The stage comes straight from Brightline's CRM."}
        actions={<Button size="lg" onClick={() => go("/p/register")}><Plus /> Register a deal</Button>}
      />
      <PageTabs
        label="Deal views"
        value={t}
        onChange={(v) => go(`/p/deals/${v}`)}
        items={[
          { value: "needs", label: "Needs you", icon: <CircleHelp />, count: count("needs"), tone: "action", hint: "Questions from Jordan and protection that ends within 21 days." },
          { value: "review", label: "In review", icon: <Clock3 />, count: count("review"), hint: "With Jordan Lee. Each one shows the decision deadline." },
          { value: "protected", label: "Protected", icon: <ShieldCheck />, count: count("protected"), hint: "Approved and protected for 90 days. Ask for more time in one tap." },
          { value: "won", label: "Won", icon: <Trophy />, count: count("won") },
          { value: "closed", label: "Closed", icon: <Archive />, count: count("closed"), hint: "Lost, not approved or protection ended." },
          { value: "all", label: "All", icon: <Briefcase />, count: d.deals.length },
        ]}
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1 basis-60">
          <span className="sr-only">Search deals</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by customer or product" className="h-11 w-full rounded-[12px] border bg-card pr-3 pl-11 text-[15.5px] text-foreground outline-none focus:border-primary" />
        </label>
        <div className="flex rounded-[12px] border bg-card p-1" role="radiogroup" aria-label="Decided by">
          {([["all", "All", null], ["rules", "By rules", <Bot key="b" className="size-4" />], ["you", "By Jordan", <UserCheck key="u" className="size-4" />]] as const).map(([k, label, icon]) => (
            <button key={k} role="radio" aria-checked={by === k} onClick={() => setBy(k)} className={cn("inline-flex h-9 items-center gap-1.5 rounded-[9px] px-3 text-[14.5px] font-medium", by === k ? "bg-brand-soft text-primary" : "text-muted-foreground hover:text-foreground")}>
              {icon}{label}
            </button>
          ))}
        </div>
        {isExec && (
          <Select value={rep} onValueChange={setRep}>
            <SelectTrigger className="h-11 w-44 bg-card text-[15px]" aria-label="Rep"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All reps</SelectItem>
              {reps.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>
      <Panel bodyClass="p-0 sm:p-0">
        <DealRows rows={rows} empty={<EmptyState title={t === "needs" ? "Nothing needs you" : "No deals here"} body={t === "needs" ? "Questions from Jordan and expiring protection show up here." : "Try another tab or clear the filters."} />} />
      </Panel>
      {!isExec && <p className="mt-3 text-[14px] text-muted-foreground">You see your own deals only. Paul Okafor, Ridgeway's admin, sees every Ridgeway deal.</p>}
    </div>
  )
}
