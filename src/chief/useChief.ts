import { useMemo } from "react"
import { hoursLeft, money } from "@/lib/format"
import { pipelineOf, slaPct, useQueue, useStore } from "@/store"
import { otherManagers, otherPartners, type Manager } from "@/chief/data"

export type ApprovalKind = "deal" | "split" | "extension" | "application" | "rule" | "autonomy" | "funds"

export interface Approval {
  id: string
  kind: ApprovalKind
  title: string
  sub: string
  from: string
  at: string
  tone: "bad" | "amber" | "primary"
  tag: string
  value?: number
}

export const kindLabel: Record<ApprovalKind, string> = {
  deal: "Escalated deal", split: "Credit split", extension: "Second extension", application: "Application", rule: "Program rule", autonomy: "AI autonomy", funds: "Marketing funds",
}

/** Everything waiting on the channel chief, built from live data so decisions made elsewhere clear it. */
export function useApprovals() {
  const { state } = useStore()
  return useMemo(() => {
    const name = (id: string) => state.partners.find((p) => p.id === id)?.name ?? id
    const out: Approval[] = []
    for (const r of state.registrations.filter((x) => x.state === "under_review" && slaPct(x) >= 80))
      out.push({ id: `reg-${r.id}`, kind: "deal", title: `${r.customer} · ${name(r.partnerId)}`, sub: `${slaPct(r)}% of its review deadline used with Jordan Lee · ${hoursLeft(r.slaHours - r.usedHours)}`, from: "SLA agent", at: r.submittedAt, tone: "bad", tag: `${slaPct(r)}% of SLA`, value: r.value })
    for (const o of state.opportunities.filter((x) => x.proposal))
      out.push({ id: `split-${o.id}`, kind: "split", title: `${o.account} · new credit split`, sub: o.proposal!.lines.map((l) => `${name(l.partnerId)} ${l.share}%`).join(" · "), from: "Jordan Lee", at: o.proposal!.at, tone: "amber", tag: "Override", value: o.value })
    for (const e of state.extensions.filter((x) => x.status === "pending" && x.previousExtensions >= 1))
      out.push({ id: `ext-${e.id}`, kind: "extension", title: `${e.customer} · ${name(e.partnerId)}`, sub: `Asks for ${e.requestedDays} more days · protection ends in ${e.daysLeft} days · already extended once`, from: name(e.partnerId), at: e.protectionEnds, tone: e.daysLeft <= 5 ? "bad" : "amber", tag: `${e.daysLeft} days left`, value: e.value })
    for (const a of state.applications.filter((x) => x.status === "escalated"))
      out.push({ id: `app-${a.id}`, kind: "application", title: `${a.company} wants to join`, sub: `${a.program} · ${a.region} · ${a.employees} people`, from: "Jordan Lee", at: a.appliedAt, tone: "primary", tag: "Escalated" })
    // Marketing funds: requests and claims. Money always needs a human (R-APR-4).
    for (const m of state.mdf.filter((x) => x.status === "submitted" || x.status === "claimed")) {
      const claim = m.status === "claimed"
      out.push({ id: `mdf-${m.id}`, kind: "funds", title: `${m.campaign} · ${name(m.companyId)}`, sub: claim ? `Claim with proof · ${m.claim!.results}` : `${m.activity} · expects ${m.expected}`, from: `${m.requestedBy} (${name(m.companyId)})`, at: claim ? m.claim!.at : m.submittedAt, tone: "primary", tag: claim ? "Claim" : "Funds request", value: claim ? m.claim!.amount : m.amount })
    }
    for (const r of state.requests.filter((x) => x.status === "pending"))
      out.push({ id: `req-${r.id}`, kind: r.kind, title: r.title, sub: `${r.programs === "all" ? "All programs" : r.programs.map((p) => `${p} program`).join(", ")} · ${r.current} → ${r.proposed}`, from: `${r.from} (${r.fromRole})`, at: r.at, tone: "primary", tag: r.kind === "rule" ? "Rule change" : "Autonomy" })
    const order = { bad: 0, amber: 1, primary: 2 }
    return out.sort((a, b) => order[a.tone] - order[b.tone])
  }, [state])
}

export interface PartnerRevenue { id: string; name: string; tier: string; program: string; manager: string; region: string; won: number; pipeline: number; trend?: "rising" | "stalling" | "at_risk"; live: boolean }

/** Revenue by partner across every partner manager: Jordan's partners live, the others as totals. */
/** Who looks after a live partner: Jordan when assigned to him, otherwise whoever Dana moved it to. */
export const ownerOf = (p: { assigned: boolean; manager?: string }) => p.manager ?? (p.assigned ? "Jordan Lee" : "Not assigned")

export function useRevenue() {
  const { state } = useStore()
  const q = useQueue()
  return useMemo(() => {
    const live: PartnerRevenue[] = state.partners.filter((p) => p.status === "active").map((p) => ({
      id: p.id, name: p.name, tier: p.tier, program: p.program, manager: ownerOf(p), region: p.region, won: p.wonThisYear, pipeline: pipelineOf(state, p.id),
      trend: state.health.find((h) => h.partnerId === p.id)?.trend, live: true,
    }))
    const all = [...live, ...otherPartners.map((p) => ({ ...p, live: false }))].sort((a, b) => b.won - a.won)
    const won = all.reduce((n, p) => n + p.won, 0)
    const pipeline = all.reduce((n, p) => n + p.pipeline, 0)
    const jordan: Manager = {
      id: "jordan", name: "Jordan Lee", initials: "JL", region: "North America", partners: state.partners.filter((p) => p.assigned).length,
      wonThisYear: live.filter((p) => p.manager === "Jordan Lee").reduce((n, p) => n + p.won, 0), pipeline: live.filter((p) => p.manager === "Jordan Lee").reduce((n, p) => n + p.pipeline, 0),
      slaMet: 96, medianHours: 2.8, queue: q.toDecide.length + q.extensions.length, atRisk: q.atRisk.length, live: true,
    }
    // Partners Dana moved to Rui or Mei add to their totals.
    const others = otherManagers.map((m) => {
      const moved = live.filter((p) => p.manager === m.name)
      return { ...m, partners: m.partners + moved.length, wonThisYear: m.wonThisYear + moved.reduce((n, p) => n + p.won, 0), pipeline: m.pipeline + moved.reduce((n, p) => n + p.pipeline, 0) }
    })
    return { all, won, pipeline, managers: [jordan, ...others], top: all.slice(0, 5), fmt: money }
  }, [state, q])
}
