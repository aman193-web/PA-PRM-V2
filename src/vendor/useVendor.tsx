import { createContext, useContext, useMemo, type ReactNode } from "react"
import type { CreditLine, PartnerRole } from "@/data/model"
import { NOW, addDays } from "@/lib/format"
import { useStore, type State } from "@/store"
import { budget } from "@/chief/data"
import { useRevenue } from "@/chief/useChief"
import { ladder, northpeakOthers } from "@/partner/delivery"
import {
  candidatesSeed, companyRevenue, modelProposal, people, quarters, sellerAccounts, sourcedShare,
  type Candidate, type CoSellRequest, type SellerAccount, type VendorPerson, type VendorRoleId,
} from "@/vendor/data"

const Ctx = createContext<VendorPerson | null>(null)

export function VendorProvider({ role, children }: { role: VendorRoleId; children: ReactNode }) {
  return <Ctx.Provider value={people[role]}>{children}</Ctx.Provider>
}

export function useVendor() {
  const me = useContext(Ctx)
  if (!me) throw new Error("useVendor outside VendorProvider")
  return { me, isOps: me.role === "revops", isAe: me.role === "ae", isCeo: me.role === "ceo" }
}

export const TODAY = NOW.toISOString().slice(0, 10)
export const partnerNameOf = (state: State, id: string) => state.partners.find((p) => p.id === id)?.name ?? id

/* ---------------- RevOps ---------------- */

export interface ReconRow { key: string; account: string; value: number; closeDate: string; partners: string[]; status: "matched" | "pending" | "mismatch"; note: string; oppId?: string }

/** The exceptions queue, closed-won reconciliation and Salesforce write health. */
export function useOps() {
  const { state } = useStore()
  return useMemo(() => {
    const open = state.exceptions.filter((e) => e.status === "open")
    const waiting = state.exceptions.filter((e) => e.status === "waiting")
    const resolved = state.exceptions.filter((e) => e.status === "resolved")
    const opps = state.opportunities.filter((o) => o.stage === "Closed won")
    const rows: ReconRow[] = [
      ...opps.map((o) => ({
        key: o.id, oppId: o.id, account: o.account, value: o.value, closeDate: o.closeDate, partners: o.lines.map((l) => partnerNameOf(state, l.partnerId)),
        status: o.reconciliation ?? "pending", note: o.reconciliationNote ?? "Waiting for Salesforce closed-won",
      })),
      ...state.registrations.filter((r) => r.state === "won" && !opps.some((o) => o.account === r.customer)).map((r) => ({
        key: r.id, account: r.customer, value: r.value, closeDate: r.closeDate, partners: [partnerNameOf(state, r.partnerId)],
        status: "matched" as const, note: `Matches Salesforce closed-won: $${r.value.toLocaleString("en-US")}`,
      })),
    ].sort((a, b) => b.closeDate.localeCompare(a.closeDate))
    const matched = rows.filter((r) => r.status === "matched")
    const held = rows.filter((r) => r.status !== "matched")
    const sum = (l: ReconRow[]) => l.reduce((n, r) => n + r.value, 0)
    const writes = state.crmWrites
    const myRequests = state.requests.filter((r) => r.from === "Ana Costa")
    return {
      open, waiting, resolved, rows,
      matchedValue: sum(matched), heldValue: sum(held), matchedPct: rows.length ? Math.round((matched.length / rows.length) * 100) : 100, held,
      retrying: writes.filter((w) => w.status !== "synced"), writes,
      myRequests, myPending: myRequests.filter((r) => r.status === "pending"),
    }
  }, [state])
}

/* ---------------- Field seller ---------------- */

export interface AccountView {
  a: SellerAccount
  regs: State["registrations"]
  opp?: State["opportunities"][number]
  partners: { id: string; name: string; role: string }[]
  requests: CoSellRequest[]
  active?: CoSellRequest
  /** Has a partner, or a partner is working on getting one. */
  involved: boolean
}

/** Sam's accounts with the partner activity on each, and the co-sell requests sent from them. */
export function useSeller() {
  const { state } = useStore()
  return useMemo(() => {
    const views: AccountView[] = sellerAccounts.map((a) => {
      const regs = state.registrations.filter((r) => a.regIds.includes(r.id))
      const opp = a.oppId ? state.opportunities.find((o) => o.id === a.oppId) : undefined
      const fromLines = (opp?.lines ?? []).map((l) => ({ id: l.partnerId, name: partnerNameOf(state, l.partnerId), role: l.role as string }))
      const fromRegs = regs.filter((r) => !fromLines.some((l) => l.id === r.partnerId)).map((r) => ({ id: r.partnerId, name: partnerNameOf(state, r.partnerId), role: r.state === "approved" ? (r.crm?.role ?? "Registered") : "Registered, in review" }))
      const requests = state.cosell.filter((c) => c.accountId === a.id)
      const active = requests.find((c) => c.status === "accepted") ?? requests.find((c) => c.status === "sent")
      const partners = [...fromLines, ...fromRegs]
      return { a, regs, opp, partners, requests, active, involved: partners.length > 0 || requests.some((c) => c.status !== "declined") }
    })
    const involved = views.filter((v) => v.partners.length > 0)
    const needPartner = views.filter((v) => v.a.need && !v.requests.some((c) => c.status !== "declined"))
    const inReview = views.flatMap((v) => v.regs.filter((r) => r.state === "under_review" || r.state === "info_requested").map((r) => ({ v, r })))
    const sent = state.cosell.filter((c) => c.status === "sent")
    const steps = state.cosell.filter((c) => c.status === "accepted").flatMap((c) => c.plan.filter((p) => !p.done).map((p) => ({ c, p, v: views.find((v) => v.a.id === c.accountId)! })))
    const mySteps = steps.filter((x) => x.p.owner === "Sam Rivera").sort((a, b) => a.p.due.localeCompare(b.p.due))
    const dueSoon = mySteps.filter((x) => x.p.due <= addDays(TODAY, 10))
    return {
      views, involved, needPartner, inReview, sent, steps, mySteps, dueSoon,
      involvedValue: involved.reduce((n, v) => n + v.a.value, 0),
      totalValue: views.reduce((n, v) => n + v.a.value, 0),
    }
  }, [state])
}

/** People at Northpeak certified in Grid analytics: the other consultants, plus Raj Mehta after passing the exam. */
export function useGridCertified() {
  const { state } = useStore()
  const raj = state.skills.find((k) => k.person === "Raj Mehta" && k.product === "Grid analytics")
  const base = northpeakOthers.find((p) => p.product === "Grid analytics")?.certified ?? 0
  return base + (raj && ladder.indexOf(raj.level) >= 1 ? 1 : 0)
}

/** Partners ranked for an account, with reasons (R-CS-2). Northpeak's Grid analytics certifications count live. */
export function useCandidates(accountId: string): Candidate[] {
  const grid = useGridCertified()
  return useMemo(() => {
    const list = (candidatesSeed[accountId] ?? []).map((c) => {
      if (c.partnerId !== "northpeak" || accountId !== "ironbridge") return c
      return grid > 0
        ? { ...c, score: 0.93, reasons: [...c.reasons, `${grid} ${grid === 1 ? "person" : "people"} certified in Grid analytics, including Raj Mehta`], caution: undefined }
        : { ...c, caution: "Nobody certified in Grid analytics yet. Raj Mehta has finished the course and the exam is next" }
    })
    return list.sort((a, b) => b.score - a.score)
  }, [accountId, grid])
}

/* ---------------- CEO / CFO ---------------- */

/** Splits a deal by role weights, normalised to 100 (the same maths as the model in force). */
export function splitBy(lines: { partnerId: string; role: PartnerRole }[], weights: Record<PartnerRole, number>): CreditLine[] {
  const total = lines.reduce((n, l) => n + weights[l.role], 0)
  const raw = lines.map((l) => ({ ...l, share: Math.round((weights[l.role] / total) * 100) }))
  if (raw.length) raw[0].share += 100 - raw.reduce((n, l) => n + l.share, 0)
  return raw
}

export interface ModelImpact { partnerId: string; name: string; won: number; open: number }

/** Revenue proof for the CEO and CFO: verified revenue, return on the program, and what model version 3 would move. */
export function useExec() {
  const { state } = useStore()
  const rev = useRevenue()
  return useMemo(() => {
    const roi = rev.won / budget.spent
    const q4 = Math.max(0, rev.won - quarters.reduce((n, q) => n + q.won, 0))
    const byQuarter = [...quarters, { q: "Q4", won: q4, model: 2, toDate: true }]
    const programs = ["Reseller", "Services", "Referral", "Technology"].map((p) => ({ program: p, won: rev.all.filter((x) => x.program === p).reduce((n, x) => n + x.won, 0) }))
    // What version 3 would move: only deals split by the model. Approved overrides stay as they are.
    const impact = new Map<string, ModelImpact>()
    let dealsChanged = 0
    for (const o of state.opportunities.filter((x) => x.splitSource === "model" && x.lines.length > 1)) {
      const next = splitBy(o.lines, modelProposal.weights)
      let changed = false
      for (const l of o.lines) {
        const d = ((next.find((n) => n.partnerId === l.partnerId)!.share - l.share) / 100) * o.value
        if (!d) continue
        changed = true
        const row = impact.get(l.partnerId) ?? { partnerId: l.partnerId, name: partnerNameOf(state, l.partnerId), won: 0, open: 0 }
        if (o.stage === "Closed won") row.won += d
        else row.open += d
        impact.set(l.partnerId, row)
      }
      if (changed) dealsChanged++
    }
    const pending = state.execApprovals.filter((e) => e.status === "pending")
    return {
      rev, roi, pct: Math.round((rev.won / budget.revenueTarget) * 100), byQuarter, programs,
      sourced: Math.round(rev.won * sourcedShare), influenced: rev.won - Math.round(rev.won * sourcedShare),
      share: rev.won / companyRevenue,
      impact: [...impact.values()].sort((a, b) => b.won + b.open - (a.won + a.open)), dealsChanged,
      pending, model3: state.execApprovals.find((e) => e.id === "AM-3"),
    }
  }, [state, rev])
}
