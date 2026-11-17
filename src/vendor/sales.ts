// CRO / VP Sales (Priya Shah): partner pipeline by stage, deals at risk and channel conflicts.
// Persona, permissions and requirement IDs come from the PRM Knowledge Hub. Figures marked "example" are illustrative.
import type { ActivityItem } from "@/data/model"

/** Open partner deals by Salesforce stage. "In review" is a registration still waiting for a decision. */
export const stages = ["In review", "Discovery", "Qualification", "Proposal", "Negotiation"] as const
export type Stage = (typeof stages)[number]

/** The Brightline seller who owns the Salesforce opportunity on each partner deal. Example names. */
export const dealOwners: Record<string, string> = {
  "REG-2041": "Sam Rivera", "REG-2038": "Sam Rivera", "REG-1925": "Sam Rivera",
  "REG-2036": "Priya Nair", "REG-2033": "Alex Morgan", "REG-2030": "Priya Nair", "REG-2027": "Alex Morgan",
  "REG-2040": "Priya Nair", "REG-2039": "Alex Morgan", "REG-2035": "Alex Morgan", "REG-1755": "Priya Nair",
  "REG-1912": "Alex Morgan", "REG-1880": "Alex Morgan", "REG-1960": "Priya Nair", "REG-1977": "Alex Morgan",
  "REG-1840": "Priya Nair", "REG-1790": "Alex Morgan",
}

/** Sellers with a portal in this demo. The others get a CRO's question by Slack and email. */
export const sellersWithPortal = ["Sam Rivera"]

/** Rui Costa's (EMEA) and Mei Tan's (APAC) partners, by Salesforce stage. Example mix applied to their pipeline. */
export const regionStageMix: Record<Stage, number> = { "In review": 0.08, Discovery: 0.22, Qualification: 0.25, Proposal: 0.3, Negotiation: 0.15 }

/** Q4 forecast, partner-involved against direct, with a confidence band. Stage 2 preview (PD-05, PD-06); example figures. */
export const forecast = {
  quarter: "Q4 2026",
  target: 4_600_000,
  rows: [
    { key: "direct", label: "Direct", commit: 3_100_000, low: 2_850_000, high: 3_300_000 },
    { key: "partner", label: "Partner-involved", commit: 1_240_000, low: 1_050_000, high: 1_420_000 },
  ],
  why: [
    "Partner deals at Proposal or later close 1.4 times as often as direct deals at the same stage (last four quarters).",
    "The band is wider for partner deals: three of the largest close in the last two weeks of December.",
  ],
}

/** Channel conflicts decided this quarter, for context. Example figures. */
export const conflictHistory = { decided: 9, medianDays: 1.6, toPartner: 5, toDirect: 3, shared: 1 }

/** A question Priya sent about a deal at risk. The CRO can't decide; the person asked can. */
export interface Nudge {
  id: string
  /** The risk it was about. */
  key: string
  account: string
  to: "pam" | "seller" | "chief"
  toName: string
  text: string
  at: string
}

export const croFeedSeed: ActivityItem[] = [
  { id: "cr1", at: "2026-10-28T10:20:00", text: "Kestrel Energy ($140,000) passed 80% of its review deadline. Dana Ortiz was alerted", href: "/v/risk" },
  { id: "cr2", at: "2026-10-28T08:10:30", text: "Ridgeway IT registered Acme Manufacturing, which overlaps Sam Rivera's opportunity", href: "/v/conflicts" },
  { id: "cr3", at: "2026-10-27T18:00:00", text: "Weekly pipeline review: partner pipeline up 6% on last week", href: "/v/pipeline" },
  { id: "cr4", at: "2026-10-24T16:00:00", text: "Harborview Logistics ($210,000) moved to Negotiation with three partners", href: "/v/pipeline" },
]
