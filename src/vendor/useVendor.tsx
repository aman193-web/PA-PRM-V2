import { createContext, useContext, useMemo, type ReactNode } from "react"
import type { CreditLine, PartnerRole } from "@/data/model"
import { NOW, addDays, money } from "@/lib/format"
import { slaPct, useStore, type State } from "@/store"
import { budget, otherPartners, type ChangeRequest } from "@/chief/data"
import { useRevenue } from "@/chief/useChief"
import { ladder, northpeakOthers } from "@/partner/delivery"
import {
  candidatesSeed, companyRevenue, modelProposal, people, quarters, sellerAccounts, sourcedShare,
  type Candidate, type CoSellRequest, type SellerAccount, type VendorPerson, type VendorRoleId,
} from "@/vendor/data"
import { dealOwners, regionStageMix, stages, type Nudge, type Stage } from "@/vendor/sales"
import { actionKey, agentRoster, costByMonth, monthlyBudget, type AgentAction, type AgentInfo } from "@/vendor/agents"

const Ctx = createContext<VendorPerson | null>(null)

export function VendorProvider({ role, children }: { role: VendorRoleId; children: ReactNode }) {
  return <Ctx.Provider value={people[role]}>{children}</Ctx.Provider>
}

export function useVendor() {
  const me = useContext(Ctx)
  if (!me) throw new Error("useVendor outside VendorProvider")
  return { me, isOps: me.role === "revops", isAe: me.role === "ae", isCeo: me.role === "ceo", isCro: me.role === "cro", isIt: me.role === "it", isAisup: me.role === "aisup" }
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

/* ---------------- CRO ---------------- */

/** One open partner deal. Registered deals match the channel chief's pipeline; co-sell deals are ones Brightline's sellers brought a partner into. */
export interface PipeDeal {
  key: string
  account: string
  partners: string[]
  /** The partner that registered it, or joined through co-sell. */
  partnerId: string
  value: number
  stage: Stage
  closeDate: string
  owner?: string
  regId?: string
  oppId?: string
  protectedUntil?: string
  source: "registered" | "cosell"
}

export interface RiskFlag { kind: "deadline" | "protection" | "stale" | "partner"; label: string; detail: string; ai?: boolean }
export interface AskOption { to: Nudge["to"]; name: string; why: string; text: string }
export interface Risk {
  key: string
  account: string
  value: number
  stage: string
  closeDate: string
  partners: string[]
  owner?: string
  flags: RiskFlag[]
  ask: AskOption[]
  /** Someone is already on it (an extension request, RevOps asking the partner manager). */
  underway?: string
  nudges: Nudge[]
}

const inStages = (x?: string): x is Stage => !!x && (stages as readonly string[]).includes(x)
const daysUntil = (iso: string) => Math.round((new Date(`${iso}T12:00:00`).getTime() - NOW.getTime()) / 86_400_000)
const short = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })

/** Partner pipeline by stage, deals at risk and channel conflicts, live from every portal. */
export function useSales() {
  const { state } = useStore()
  const rev = useRevenue()
  return useMemo(() => {
    const open = state.registrations.filter((r) => r.state === "approved" || r.state === "under_review" || r.state === "info_requested")
    const registered: PipeDeal[] = open.map((r) => {
      const opp = state.opportunities.find((o) => o.account === r.customer && o.stage !== "Closed won")
      const stage: Stage = r.state !== "approved" ? "In review" : inStages(opp?.stage) ? opp.stage : inStages(r.crmStage) ? r.crmStage : "Qualification"
      return {
        key: r.id, account: r.customer, partnerId: r.partnerId, value: r.value, stage, closeDate: r.closeDate, regId: r.id, oppId: opp?.id ?? r.crm?.opportunityId,
        partners: opp ? opp.lines.map((l) => partnerNameOf(state, l.partnerId)) : [partnerNameOf(state, r.partnerId)],
        owner: dealOwners[r.id] ?? opp?.owner, protectedUntil: r.protectedUntil, source: "registered" as const,
      }
    })
    const cosellDeals: PipeDeal[] = state.cosell.filter((c) => c.status === "accepted").flatMap((c) => {
      const a = sellerAccounts.find((x) => x.id === c.accountId)
      if (!a?.oppId || open.some((r) => r.customer === a.name)) return []
      const opp = state.opportunities.find((o) => o.id === a.oppId)
      return [{
        key: `cs-${c.id}`, account: a.name, partnerId: c.partnerId, value: a.value, stage: inStages(a.stage) ? a.stage : "Discovery", closeDate: a.closeDate, owner: "Sam Rivera", oppId: a.oppId,
        partners: opp ? opp.lines.map((l) => partnerNameOf(state, l.partnerId)) : [partnerNameOf(state, c.partnerId)], source: "cosell" as const,
      }]
    })
    const deals = [...registered, ...cosellDeals].sort((a, b) => b.value - a.value)
    const sum = (l: { value: number }[]) => l.reduce((n, d) => n + d.value, 0)
    const regions = [
      { region: "North America", manager: "Jordan Lee", value: sum(deals), live: true },
      { region: "EMEA", manager: "Rui Costa", value: otherPartners.filter((p) => p.manager === "Rui Costa").reduce((n, p) => n + p.pipeline, 0), live: false },
      { region: "APAC", manager: "Mei Tan", value: otherPartners.filter((p) => p.manager === "Mei Tan").reduce((n, p) => n + p.pipeline, 0), live: false },
    ]
    const other = regions[1].value + regions[2].value
    const byStage = stages.map((st) => {
      const na = sum(deals.filter((d) => d.stage === st))
      const rest = Math.round(other * regionStageMix[st])
      return { stage: st, na, other: rest, total: na + rest, count: deals.filter((d) => d.stage === st).length }
    })
    const total = sum(deals) + other
    const closingQ4 = deals.filter((d) => d.closeDate <= "2026-12-31" && d.stage !== "In review")
    const byPartner = [
      ...rev.all.filter((p) => p.live).map((p) => {
        const mine = deals.filter((d) => d.partnerId === p.id)
        return { id: p.id, name: p.name, tier: p.tier, program: p.program, region: "North America", manager: p.manager, deals: mine.length, pipeline: sum(mine), won: p.won, live: true }
      }).filter((p) => p.pipeline > 0),
      ...otherPartners.map((p) => ({ id: p.id, name: p.name, tier: p.tier, program: p.program, region: p.region, manager: p.manager, deals: undefined as number | undefined, pipeline: p.pipeline, won: p.won, live: false })),
    ].sort((a, b) => b.pipeline - a.pipeline)

    /* Deals at risk: rule-based flags now (Stage 1B); AI flags such as a missing partner are a Stage 2 preview. */
    const risks: Risk[] = []
    const add = (r: Omit<Risk, "nudges">) => {
      const at = risks.find((x) => x.key === r.key)
      if (at) { at.flags.push(...r.flags); for (const o of r.ask) if (!at.ask.some((x) => x.name === o.name)) at.ask.push(o); at.underway ??= r.underway }
      else risks.push({ ...r, nudges: [] })
    }
    for (const r of open) {
      const d = registered.find((x) => x.key === r.id)!
      const base = { key: r.id, account: r.customer, value: r.value, stage: d.stage, closeDate: r.closeDate, partners: d.partners, owner: d.owner }
      const partner = partnerNameOf(state, r.partnerId)
      if (r.state === "under_review" && slaPct(r) >= 80)
        add({ ...base, flags: [{ kind: "deadline", label: `${slaPct(r)}% of the review deadline used`, detail: `${partner} is waiting for a decision. The SLA agent alerted the channel chief at 80% (R-SLA-3).` }],
          ask: [
            { to: "pam", name: "Jordan Lee", why: "Is reviewing it", text: `${r.customer} (${money(r.value)}) is past ${slaPct(r)}% of its review deadline. Can you decide it today?` },
            { to: "chief", name: "Dana Ortiz", why: "Was alerted at 80% and can decide it", text: `${r.customer} (${money(r.value)}) is about to breach its review deadline. It's a ${money(r.value)} deal for ${partner}.` },
          ] })
      if (r.state === "approved" && r.protectedUntil && daysUntil(r.protectedUntil) <= 14 && r.protectedUntil < r.closeDate) {
        const ext = state.extensions.filter((e) => e.registrationId === r.id).at(-1)
        if (ext?.status === "granted") continue
        const second = !!ext && ext.previousExtensions > 0
        add({ ...base,
          flags: [{ kind: "protection", label: `Protection ends ${short(r.protectedUntil)}, before the ${short(r.closeDate)} close`, detail: `${partner} could lose protection with the deal still open.${ext?.status === "denied" ? " The extension was declined." : ""}` }],
          underway: ext?.status === "pending" ? `${partner} asked for ${ext.requestedDays} more days. ${second ? "It's a second extension, so Dana Ortiz decides" : "Jordan Lee decides"}` : undefined,
          ask: [
            second
              ? { to: "chief", name: "Dana Ortiz", why: "Decides second extensions", text: `${r.customer} loses protection on ${short(r.protectedUntil)}. Can you decide ${partner}'s second extension?` }
              : { to: "pam", name: "Jordan Lee", why: ext?.status === "pending" ? "Decides the extension" : "Looks after the partner", text: `${r.customer} (${money(r.value)}) loses protection on ${short(r.protectedUntil)}, before its ${short(r.closeDate)} close. ${ext?.status === "pending" ? `Can you decide ${partner}'s extension?` : `Is ${partner} still on it?`}` },
            ...(d.owner ? [{ to: "seller" as const, name: d.owner, why: "Owns the Salesforce opportunity", text: `${r.customer}: is the ${short(r.closeDate)} close date still right? ${partner}'s protection ends ${short(r.protectedUntil)}.` }] : []),
          ] })
      }
    }
    for (const x of state.exceptions.filter((e) => e.kind === "stale" && e.status !== "resolved" && e.regId)) {
      const r = open.find((y) => y.id === x.regId)
      if (!r) continue
      const d = registered.find((y) => y.key === r.id)!
      add({ key: r.id, account: r.customer, value: r.value, stage: d.stage, closeDate: r.closeDate, partners: d.partners, owner: d.owner,
        flags: [{ kind: "stale", label: "No Salesforce activity for 52 days", detail: "Flagged by the Data Steward agent. Still in Qualification since June.", ai: true }],
        underway: x.status === "waiting" ? `${x.resolution?.by ?? "RevOps"} asked Jordan Lee to check with ${partnerNameOf(state, r.partnerId)}` : undefined,
        ask: [{ to: "pam", name: "Jordan Lee", why: "Looks after the partner", text: `${r.customer} has had no Salesforce activity for 52 days. Is ${partnerNameOf(state, r.partnerId)} still working it?` }] })
    }
    for (const a of sellerAccounts.filter((x) => x.need && !state.cosell.some((c) => c.accountId === x.id && c.status !== "declined")))
      add({ key: `acct-${a.id}`, account: a.name, value: a.value, stage: a.stage, closeDate: a.closeDate, partners: [], owner: "Sam Rivera",
        flags: [{ kind: "partner", label: `Needs ${/^[aeiou]/i.test(a.role ?? "") ? "an" : "a"} ${a.role?.toLowerCase()} partner and has none`, detail: a.need!, ai: true }],
        ask: [{ to: "seller", name: "Sam Rivera", why: "Owns the deal and sends co-sell requests", text: `${a.name} (${money(a.value)}) still has no ${a.role?.toLowerCase()} partner. Can you bring one in this week?` }] })
    for (const n of state.croNudges) risks.find((r) => r.key === n.key)?.nudges.push(n)
    risks.sort((a, b) => b.value - a.value)
    const settled = state.croNudges.filter((n) => !risks.some((r) => r.key === n.key))

    /* Channel conflicts: a partner registration that overlaps a direct opportunity or another partner's registration. */
    const conflicts = state.registrations.filter((r) => r.conflict && (r.state === "under_review" || r.state === "info_requested" || (r.decision && r.decision.at >= "2026-10-28"))).map((r) => ({
      reg: r, kind: r.conflict!.kind === "crm_opportunity" ? ("direct" as const) : ("partner" as const), partner: partnerNameOf(state, r.partnerId), notes: state.sellerNotes[r.id] ?? [],
    }))

    return {
      deals, registered: sum(registered), cosell: sum(cosellDeals), cosellDeals, other, total, regions, byStage, byPartner,
      closingQ4, closingValue: sum(closingQ4), inReview: deals.filter((d) => d.stage === "In review"),
      risks, riskValue: sum(risks), settled, conflicts, openConflicts: conflicts.filter((c) => c.reg.state === "under_review" || c.reg.state === "info_requested"),
      won: rev.won,
    }
  }, [state, rev])
}

/* ---------------- IT / CRM admin ---------------- */

export interface ItTask { id: string; title: string; sub: string; href: string; kind: "mapping" | "connector" | "group" | "leaver" | "merge" | "support" }

/** What needs the CRM admin: AI-suggested mappings, connector requests, new Okta groups, leavers and record merges. */
export function useAdmin() {
  const { state } = useStore()
  return useMemo(() => {
    const pendingMappings = state.mappings.filter((m) => m.status === "pending")
    const requested = state.connections.filter((c) => c.status === "requested")
    const newGroups = state.groups.filter((g) => g.status === "new")
    const leavers = state.staff.filter((u) => u.status === "leaving" && u.partners && !state.toldChief.includes(u.id))
    const merge = state.exceptions.find((e) => e.kind === "match" && e.status === "resolved" && e.resolution?.choice === "same" && !state.merged.includes(e.id))
    const retrying = state.crmWrites.filter((w) => w.status !== "synced")
    const support = state.platform.support.filter((x) => x.orgId === "brightline" && x.status === "requested")
    const tasks: ItTask[] = [
      ...support.map((x) => ({ id: x.id, title: `PRM platform team asks for support access`, sub: `${x.engineer}, read-only for ${x.hours} hours: ${x.reason} (${x.ticket})`, href: "/v/users", kind: "support" as const })),
      ...(merge ? [{ id: `merge-${merge.id}`, title: "Merge ACME Mfg. Inc. into Acme Manufacturing", sub: `${merge.resolution?.by} confirmed they're the same company. Only you can merge records in Salesforce`, href: "/v/connections", kind: "merge" as const }] : []),
      ...requested.map((c) => ({ id: c.id, title: `Connect ${c.name}?`, sub: `${c.request?.by} (${c.request?.byRole}) asked for it`, href: "/v/connections", kind: "connector" as const })),
      ...pendingMappings.map((m) => ({ id: m.id, title: `${m.prm} → ${m.target.split(" (")[0]}`, sub: `Suggested by the ${m.by}${m.confidence ? ` · ${Math.round(m.confidence * 100)}% confident` : ""}${m.caution ? " · check the warning" : ""}`, href: "/v/mappings", kind: "mapping" as const })),
      ...newGroups.map((g) => ({ id: g.id, title: `Give ${g.group} a PRM role`, sub: `${g.people} people pushed from Okta with no role, so they can't sign in yet`, href: "/v/users", kind: "group" as const })),
      ...leavers.map((u) => ({ id: u.id, title: `${u.name} leaves on ${short(u.leavesOn!)}`, sub: `${u.partners} partners still assigned. Only the channel chief can move them`, href: "/v/users", kind: "leaver" as const })),
    ]
    const people = state.staff.filter((u) => u.status !== "deactivated").length
    const provisioned = state.groups.filter((g) => g.status === "mapped").reduce((n, g) => n + g.people, 0)
    return { tasks, support, pendingMappings, requested, newGroups, leavers, merge, retrying, writes: state.crmWrites, people, provisioned }
  }, [state])
}

/* ---------------- AI supervisor ---------------- */

export interface LiveAction extends AgentAction { key: string; now: string; paused: boolean; pending?: ChangeRequest }
export interface LiveAgent extends Omit<AgentInfo, "actions"> { level: string; paused: boolean; pausedSelf: boolean; actions: LiveAction[]; pending: ChangeRequest[] }

/** The nine agents with their live autonomy, pauses and pending requests, plus the agent audit and cost. */
export function useAgents() {
  const { state } = useStore()
  return useMemo(() => {
    const autonomy = state.requests.filter((r) => r.kind === "autonomy")
    const roster: LiveAgent[] = agentRoster.map((a) => {
      const pausedSelf = state.pausedAgents.includes(a.id)
      const actions = a.actions.map((x) => {
        const key = actionKey(a.id, x.id)
        return { ...x, key, now: state.actionLevels[key] ?? x.level, paused: state.pausedActions.includes(key), pending: autonomy.find((r) => r.status === "pending" && (r.agent ?? "deal-desk") === a.id && (r.action ?? "decide") === x.id) }
      })
      return { ...a, level: state.agentLevels[a.id] ?? a.actions.find((x) => x.id === a.headline)!.level, paused: state.agentLayerPaused || pausedSelf, pausedSelf, actions, pending: actions.flatMap((x) => (x.pending ? [x.pending] : [])) }
    })
    const log = [...state.agentLog].sort((a, b) => b.at.localeCompare(a.at))
    const overrides = log.filter((x) => x.outcome === "overridden" && !x.reviewed)
    const waiting = log.filter((x) => x.outcome === "waiting")
    const myRequests = state.requests.filter((r) => r.from === "Lee Park")
    const pending = myRequests.filter((r) => r.status === "pending")
    const decided = log.filter((x) => x.outcome === "agreed" || x.outcome === "overridden" || x.outcome === "edited")
    const agreed = decided.filter((x) => x.outcome === "agreed").length
    const month = costByMonth.at(-1)!.cost
    const actions = agentRoster.reduce((n, a) => n + a.month.actions, 0)
    const rated = agentRoster.filter((a) => a.id === "deal-desk" || a.id === "attribution")
    const agreement = rated.reduce((n, a) => n + (a.month.rate ?? 0) * a.month.actions, 0) / rated.reduce((n, a) => n + a.month.actions, 0)
    return {
      roster, log, overrides, waiting, myRequests, pending, agreed, decided, actions, agreement,
      running: roster.filter((a) => !a.paused).length, paused: state.agentLayerPaused, pausedCount: roster.filter((a) => a.paused).length + state.pausedActions.length,
      month, budget: monthlyBudget, costByMonth,
    }
  }, [state])
}
