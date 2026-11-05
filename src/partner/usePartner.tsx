import { createContext, useContext, useMemo, type ReactNode } from "react"
import type { Lead, PartnerRole, Registration } from "@/data/model"
import { hoursLeft, NOW, shortDate } from "@/lib/format"
import { useStore, type State } from "@/store"
import { company, people, repProfiles, type PartnerPerson, type PartnerRoleId } from "@/partner/data"

const Ctx = createContext<PartnerPerson | null>(null)

export function PartnerProvider({ role, children }: { role: PartnerRoleId; children: ReactNode }) {
  return <Ctx.Provider value={people[role]}>{children}</Ctx.Provider>
}

export function usePartner() {
  const me = useContext(Ctx)
  if (!me) throw new Error("usePartner outside PartnerProvider")
  return { me, isExec: me.role === "pexec" }
}

export const daysUntil = (iso: string) => Math.ceil((new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).getTime() - NOW.getTime()) / 86_400_000)

/** One line of the partner's own credit. Other partners on the deal are counted, never named (R-CR-5). */
export interface CreditItem {
  key: string
  regId?: string
  account: string
  product: string
  value: number
  stage: string
  role: PartnerRole | string
  share: number
  credited: number
  others: number
  kind: "verified" | "pipeline"
  recon?: "matched" | "pending" | "mismatch"
  rep?: string
  closeDate: string
  why: string
  versions: { at: string; note: string }[]
  touches: { at: string; kind: string; text: string }[]
}

/**
 * Everything the signed-in partner person may see, already filtered by role:
 * the executive sees all of Ridgeway's data, the rep only their own deals and leads (R-SEC-2).
 */
export function usePartnerData() {
  const { state } = useStore()
  const { me, isExec } = usePartner()
  return useMemo(() => {
    const all = state.registrations.filter((r) => r.partnerId === company.id)
    const deals = (isExec ? all : all.filter((r) => r.rep === me.name)).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    const leads = state.leads.filter((l) => l.partnerId === company.id && (isExec || l.assignee === me.name))
    const pendingExt = (r: Registration) => state.extensions.some((e) => e.registrationId === r.id && e.status === "pending")

    const needsReply = deals.filter((r) => r.state === "info_requested")
    const inReview = deals.filter((r) => r.state === "under_review")
    const expiring = deals.filter((r) => r.state === "approved" && r.protectedUntil && daysUntil(r.protectedUntil) <= 21 && !pendingExt(r))
    // Leads offered to the company go to the admin; leads offered to a named rep go to that rep (R-LD-4).
    const offers = leads.filter((l) => l.status === "offered" && (isExec ? !l.assignee : l.assignee === me.name))

    const credit: CreditItem[] = []
    for (const r of deals) {
      if (!r.crm || !["approved", "won"].includes(r.state)) continue
      const opp = state.opportunities.find((o) => o.id === r.crm!.opportunityId)
      const line = opp?.lines.find((l) => l.partnerId === company.id) ?? { role: r.crm.role, share: 100 }
      credit.push({
        key: r.id, regId: r.id, account: r.customer, product: r.product, value: r.value, stage: r.crmStage ?? (r.state === "won" ? "Closed won" : "Open"),
        role: line.role, share: line.share, credited: Math.round((r.value * line.share) / 100), others: opp ? opp.lines.length - 1 : 0,
        kind: r.state === "won" ? "verified" : "pipeline", recon: r.state === "won" ? opp?.reconciliation ?? "matched" : undefined,
        rep: r.rep, closeDate: r.closeDate,
        why: line.share === 100 ? `Only partner on the deal, so Ridgeway gets 100% as ${line.role}.` : `Role-based split: ${line.role} weight, shared with ${opp!.lines.length - 1} other partner${opp!.lines.length > 2 ? "s" : ""}.`,
        versions: opp?.versions.map((v) => ({ at: v.at, note: v.note })) ?? [{ at: r.decision?.at ?? r.submittedAt, note: "Credit set when the registration was approved" }],
        touches: opp?.touches.filter((t) => t.partnerId === company.id).map((t) => ({ at: t.at, kind: t.kind, text: t.text })) ?? [{ at: r.submittedAt, kind: "Registration", text: `Registered the deal (${r.id})` }],
      })
    }
    // Deals Brightline added Ridgeway to without a Ridgeway registration (multi-partner credit). Admin only.
    if (isExec) {
      for (const o of state.opportunities) {
        const line = o.lines.find((l) => l.partnerId === company.id)
        if (!line || credit.some((c) => all.find((r) => r.id === c.regId)?.crm?.opportunityId === o.id)) continue
        credit.push({
          key: o.id, account: o.account, product: o.name.split("– ")[1] ?? o.name, value: o.value, stage: o.stage, role: line.role, share: line.share,
          credited: Math.round((o.value * line.share) / 100), others: o.lines.length - 1, kind: o.stage === "Closed won" ? "verified" : "pipeline",
          recon: o.reconciliation, closeDate: o.closeDate,
          why: `Role-based split: ${line.role} weight, shared with ${o.lines.length - 1} other partners. Their shares are private.`,
          versions: o.versions.map((v) => ({ at: v.at, note: v.note })),
          touches: o.touches.filter((t) => t.partnerId === company.id).map((t) => ({ at: t.at, kind: t.kind, text: t.text })),
        })
      }
    }
    credit.sort((a, b) => (b.closeDate > a.closeDate ? 1 : -1))
    const verified = credit.filter((c) => c.kind === "verified" && c.closeDate.startsWith("2026"))
    const verifiedTotal = verified.reduce((n, c) => n + c.credited, 0)
    const pipelineTotal = credit.filter((c) => c.kind === "pipeline").reduce((n, c) => n + c.credited, 0)
    const weekStart = "2026-10-26"
    const thisWeek = credit.filter((c) => {
      const r = all.find((x) => x.id === c.regId)
      return r?.decision?.action === "approved" && r.decision.at >= weekStart && deals.includes(r)
    })
    const weekValue = thisWeek.reduce((n, c) => n + c.credited, 0)

    return { all, deals, leads, needsReply, inReview, expiring, offers, credit, verifiedTotal, pipelineTotal, weekValue, thisWeek, pendingExt }
  }, [state, me, isExec])
}

export function usePartnerFeed() {
  const { state } = useStore()
  const { me, isExec } = usePartner()
  return state.partnerFeed.filter((f) => isExec || f.rep === me.name)
}

/* ---------- partner-facing wording for deal status (R-STATE-1) ---------- */

export function partnerStatus(r: Registration): { label: string; cls: string } {
  switch (r.state) {
    case "under_review": return { label: "In review", cls: "bg-brand-soft text-primary" }
    case "info_requested": return { label: "Reply needed", cls: "bg-amber text-[#2a1a00]" }
    case "approved": return { label: r.decision?.by === "rules" ? "Approved by rules" : "Approved", cls: "bg-ok-soft text-ok" }
    case "rejected": return { label: "Not approved", cls: "bg-bad-soft text-bad" }
    case "won": return { label: "Won", cls: "bg-ok text-white" }
    case "lost": return { label: "Lost", cls: "bg-secondary text-muted-foreground" }
    case "expired": return { label: "Protection ended", cls: "bg-secondary text-muted-foreground" }
  }
}

export function partnerNext(r: Registration, extensionPending: boolean): { text: string; tone: "bad" | "amber" | "muted" | "ok" | "primary" } {
  if (r.state === "info_requested") return { text: "Answer Jordan's question", tone: "amber" }
  if (r.state === "under_review") return { text: `Jordan decides · ${hoursLeft(r.slaHours - r.usedHours)}`, tone: "primary" }
  if (r.state === "approved" && r.protectedUntil) {
    const d = daysUntil(r.protectedUntil)
    if (extensionPending) return { text: `Extension requested · ${d} days left`, tone: "muted" }
    if (d <= 21) return { text: `Protection ends in ${d} days`, tone: "amber" }
    return { text: `Protected to ${shortDate(r.protectedUntil)}`, tone: "muted" }
  }
  if (r.state === "won") return { text: `Won ${shortDate(r.closeDate)} · credit verified`, tone: "ok" }
  if (r.state === "lost") return { text: r.lostReason ?? "Lost", tone: "muted" }
  if (r.state === "rejected") return { text: r.decision?.reason ?? "Not approved", tone: "muted" }
  return { text: "Protection ended", tone: "muted" }
}

export const toneText = { bad: "text-bad", amber: "text-amber-ink", muted: "text-muted-foreground", ok: "text-ok", primary: "text-primary" }

export function leadLeft(l: Lead) {
  return l.acceptBy ? (new Date(l.acceptBy).getTime() - NOW.getTime()) / 3_600_000 : 0
}

export interface RepSuggestion { rep: string; reasons: string[]; caveat?: string }

/** Suggest which Ridgeway rep should own a lead: past wins in the industry, the product, the region, and workload. */
export function suggestRep(lead: Lead, state: State): RepSuggestion | null {
  const reps = state.team.filter((m) => m.role === "Partner sales rep" && m.canRegister && m.status === "active")
  const scored = reps.map((m) => {
    const p = repProfiles[m.name] ?? { wins: [], regions: [] }
    const reasons: string[] = []
    let score = 0
    const industryWin = p.wins.find((w) => w.industry === lead.industry)
    if (industryWin) { score += 3; reasons.push(`Won ${industryWin.customer} (${industryWin.industry.toLowerCase()}) this year`) }
    const productWin = p.wins.find((w) => w.product === lead.product && w !== industryWin)
    if (m.certified?.toLowerCase().startsWith(lead.product.toLowerCase())) { score += 2; reasons.push(`${m.certified} certified`) }
    else if (productWin) { score += 2; reasons.push(`Sells ${lead.product}: won ${productWin.customer}`) }
    const region = p.regions.find((r) => lead.region?.endsWith(r.code))
    if (region) { score += 2; reasons.push(`Covers ${region.name}`) }
    const open = state.registrations.filter((r) => r.partnerId === "ridgeway" && r.rep === m.name && ["approved", "under_review", "info_requested"].includes(r.state)).length
    score -= open * 0.3
    return { rep: m.name, score, reasons, open }
  }).sort((a, b) => b.score - a.score)
  const best = scored[0]
  if (!best || !best.reasons.length) return null
  const lighter = scored.find((s) => s.open < best.open)
  return { rep: best.rep, reasons: best.reasons, caveat: lighter ? `Has ${best.open} open deal${best.open === 1 ? "" : "s"}; ${lighter.rep} has ${lighter.open}` : `${best.open} open deal${best.open === 1 ? "" : "s"} right now` }
}
