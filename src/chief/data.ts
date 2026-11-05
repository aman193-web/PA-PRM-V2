// Channel chief (Dana Ortiz) demo data: the other partner managers, program budget, and rule and
// autonomy changes waiting for approval. Access lists mirror the PRM Knowledge Hub's permission matrix.

export const chief = { name: "Dana Ortiz", first: "Dana", initials: "DO", title: "Channel chief", email: "dana.ortiz@brightline.io", vendor: "Brightline" }

/** Partner managers who report to Dana. Jordan's numbers are computed live from the store. */
export interface Manager {
  id: string
  name: string
  initials: string
  region: string
  partners: number
  wonThisYear: number
  pipeline: number
  slaMet: number
  medianHours: number
  queue: number
  atRisk: number
  live?: boolean
}

export const otherManagers: Manager[] = [
  { id: "rui", name: "Rui Costa", initials: "RC", region: "EMEA", partners: 12, wonThisYear: 1_640_000, pipeline: 2_100_000, slaMet: 91, medianHours: 3.4, queue: 4, atRisk: 1 },
  { id: "mei", name: "Mei Tan", initials: "MT", region: "APAC", partners: 7, wonThisYear: 980_000, pipeline: 1_150_000, slaMet: 97, medianHours: 2.1, queue: 1, atRisk: 0 },
]

/** Partners managed by Rui and Mei, shown by name and totals only for the revenue view. */
export const otherPartners = [
  { id: "x-helix", name: "Helix Data GmbH", tier: "Platinum", program: "Services", manager: "Rui Costa", region: "EMEA · DACH", won: 720_000, pipeline: 910_000, trend: "rising" as const },
  { id: "x-nordlys", name: "Nordlys Consulting", tier: "Gold", program: "Reseller", manager: "Rui Costa", region: "EMEA · Nordics", won: 510_000, pipeline: 640_000, trend: "stalling" as const },
  { id: "x-caravel", name: "Caravel Partners", tier: "Silver", program: "Referral", manager: "Rui Costa", region: "EMEA · UK", won: 410_000, pipeline: 550_000, trend: "rising" as const },
  { id: "x-sakura", name: "Sakura Systems", tier: "Gold", program: "Reseller", manager: "Mei Tan", region: "APAC · Japan", won: 560_000, pipeline: 690_000, trend: "rising" as const },
  { id: "x-austral", name: "Austral Cloud", tier: "Silver", program: "Technology", manager: "Mei Tan", region: "APAC · ANZ", won: 420_000, pipeline: 460_000, trend: "at_risk" as const },
]

/** Example figures for "defend the budget": what the program costs against what partners bring in. */
export const budget = {
  year: 2026,
  annual: 1_200_000,
  spent: 840_000,
  lines: [
    { label: "Partner discounts and margin", amount: 470_000 },
    { label: "Marketing development funds", amount: 160_000 },
    { label: "Partner team and tools", amount: 150_000 },
    { label: "Rewards and spiffs", amount: 60_000 },
  ],
  revenueTarget: 5_000_000,
}

/* ---------- Programs: partner tracks, each with its own rules (BRD glossary; RevOps creates, the chief approves) ---------- */

export type ProgramId = "Reseller" | "Services" | "Referral" | "Technology" | "Marketplace"

export interface ProgramInfo { id: ProgramId; what: string; live: boolean; budget: number; spent: number }

/** Budget figures are examples; they add up to the overall budget above. */
export const programs: ProgramInfo[] = [
  { id: "Reseller", what: "Partners buy Brightline products and resell them to their own customers", live: true, budget: 520_000, spent: 380_000 },
  { id: "Services", what: "Partners implement and support Brightline for customers", live: true, budget: 380_000, spent: 250_000 },
  { id: "Referral", what: "Partners introduce customers; Brightline sells to them directly", live: true, budget: 190_000, spent: 130_000 },
  { id: "Technology", what: "Partners whose products connect to Brightline", live: true, budget: 110_000, spent: 80_000 },
  { id: "Marketplace", what: "Customers buy Brightline through a cloud marketplace", live: false, budget: 0, spent: 0 },
]

/** One program's rules. Versioned: a change makes a new version, never an edit in place (R-APR-2). */
export interface RuleSet {
  version: number
  autoApprove: number
  /** A higher limit for Gold and Platinum partners, once approved. */
  autoApproveTop?: number
  /** Review deadline for deals up to `bigDealOver`, and above it (R-SLA-6: 8 up to $100K, 16 above). */
  reviewHours: number
  bigDealHours: number
  bigDealOver: number
  protectionDays: number
  leadHours: number
  history: { version: number; at: string; by: string; note: string }[]
}

const base = (version: number, reviewHours: number, bigDealHours: number, first: string): RuleSet => ({
  version, autoApprove: 50_000, reviewHours, bigDealHours, bigDealOver: 100_000, protectionDays: 90, leadHours: 48,
  history: [{ version, at: "2026-06-01T09:00:00", by: "Dana Ortiz approved Ana Costa's set-up", note: first }],
})

export const rulesSeed: Record<ProgramId, RuleSet> = {
  Reseller: base(3, 8, 16, "Protection window set to 90 days"),
  // Services deals need scoping, so the program gives reviewers 16 hours whatever the size (R-SLA-1 allows per-program SLAs).
  Services: base(2, 16, 16, "Review deadline set to 16 business hours for every services deal"),
  Referral: base(2, 8, 16, "Lead acceptance window set to 48 hours"),
  Technology: base(1, 8, 16, "Program launched from the Technology template"),
  Marketplace: base(0, 8, 16, "Template only; not launched"),
}

/** Business hours a reviewer has to decide a deal of this size in this program. */
export const reviewHoursFor = (r: RuleSet, value: number) => (value > r.bigDealOver ? r.bigDealHours : r.reviewHours)

export const ruleLimit = (r: RuleSet, tier: string) => (r.autoApproveTop && (tier === "Gold" || tier === "Platinum") ? r.autoApproveTop : r.autoApprove)

export type RequestKind = "rule" | "autonomy"
export interface ChangeRequest {
  id: string
  kind: RequestKind
  title: string
  /** Which programs the change applies to. Agent autonomy applies to every program. */
  programs: ProgramId[] | "all"
  from: string
  fromRole: string
  at: string
  current: string
  proposed: string
  why: string
  impact: string[]
  guardrail?: string
  status: "pending" | "approved" | "declined"
  note?: string
}

export const requestsSeed: ChangeRequest[] = [
  {
    id: "CR-21", kind: "rule", title: "Reseller program: raise the auto-approve limit for Gold and Platinum partners", programs: ["Reseller"],
    from: "Ana Costa", fromRole: "RevOps", at: "2026-10-27T16:00:00",
    current: "$50,000 for every Reseller partner", proposed: "$75,000 for Gold and Platinum Reseller partners; $50,000 for the rest",
    why: "31% of Reseller deals waiting for a person this quarter came from Gold or Platinum partners, were between $50,000 and $75,000, and had no conflicts. All 46 were approved.",
    impact: ["About 12 fewer manual reviews a month for partner managers", "Clean deals from top Reseller partners decided in 60 seconds instead of hours", "Conflicts, duplicates and low-confidence deals still go to a person", "Other programs keep their own limits"],
    status: "pending",
  },
  {
    id: "CR-22", kind: "autonomy", title: "Let the Deal Desk agent approve clean deals under $25,000", programs: "all",
    from: "Lee Park", fromRole: "AI supervisor", at: "2026-10-26T11:30:00",
    current: "A3 · Acts with approval", proposed: "A4 · Acts alone within limits (under $25,000, no conflicts, partner quality ≥ 0.80)",
    why: "Over 90 days the agent's recommendation matched the partner manager's decision on 412 of 418 clean deals under $25,000 (98.6%).",
    impact: ["Partner managers stop confirming low-value clean deals", "Every agent action stays logged and reversible", "Pause the agent in one click from this page"],
    guardrail: "Money is never autonomous: MDF, rewards and credit changes always need a person (R-AG-2).",
    status: "pending",
  },
]

/** `does` explains the agent in plain words; `at` says what it actually does at each autonomy level. */
export const agents = [
  {
    id: "deal-desk", name: "Deal Desk agent", job: "Prefills and checks registrations, recommends a decision", level: "A3",
    does: "Reads a partner's description or email, fills in the deal form, runs the eligibility and conflict checks, and suggests approve, reject or ask for info.",
    at: { A0: "Only logs what it would have suggested.", A1: "Shows its suggestion; the partner manager decides.", A2: "Prepares the decision and the message to the partner; the partner manager sends it.", A3: "Approves or rejects once the partner manager confirms.", A4: "Approves clean deals under $25,000 on its own; everything else still goes to a person." },
  },
  {
    id: "sla", name: "SLA agent", job: "Watches review timers, nudges at 50%, alerts you at 80%", level: "A4",
    does: "Watches the clock on every deal waiting for a decision and makes sure nothing is forgotten.",
    at: { A0: "Only tracks the timers.", A1: "Flags late deals on screen.", A2: "Drafts reminders for someone to send.", A3: "Sends reminders once someone approves.", A4: "Sends reminders at 50%, alerts you at 80% and hands deals to a backup reviewer at 100%, on its own." },
  },
  {
    id: "attribution", name: "Attribution agent", job: "Calculates credit splits from the program model", level: "A2",
    does: "Works out how credit for a sale is shared when several partners helped, using the program's credit model.",
    at: { A0: "Only records who did what.", A1: "Suggests a split.", A2: "Drafts the split; it takes effect under the program model, and any override needs your approval.", A3: "Applies splits once confirmed.", A4: "Not allowed: credit is money, so a person always approves changes." },
  },
  {
    id: "growth", name: "Growth Coach", job: "Suggests the next action for each partner (Stage 2)", level: "A1",
    does: "Spots partners who are rising, stalling or at risk and suggests what the partner manager could do next.",
    at: { A0: "Only watches partner activity.", A1: "Suggests a next step; the partner manager decides whether to act.", A2: "Drafts the email or meeting invite for the partner manager to send.", A3: "Sends it once the partner manager approves.", A4: "Sends routine nudges to partners on its own." },
  },
]

export const autonomyLevels = [
  { id: "A0", label: "Observe", means: "Only watches and logs. Does nothing anyone can see." },
  { id: "A1", label: "Recommend", means: "Suggests what to do. A person decides and does it." },
  { id: "A2", label: "Draft", means: "Prepares the work. A person checks it and sends it." },
  { id: "A3", label: "Act with approval", means: "Does the work once a person says yes." },
  { id: "A4", label: "Act alone within limits", means: "Does the work on its own, but only inside limits you set. Money is never included." },
] as const

/** Rules that are the same in every program. */
export const sharedRules = [
  { label: "Nudge and escalation", value: "Nudge at 50% of the deadline, you're alerted at 80%, reassigned at 100%", ref: "R-SLA-2–4", status: "Specified" },
  { label: "Extensions", value: "One by the partner manager; a second needs you", ref: "R-REG-11", status: "Recommended default" },
  { label: "Credit model", value: "Role-based split; overrides need your approval", ref: "R-CR-2–3", status: "Proposed default" },
]

export const access = {
  can: [
    { text: "See every partner's deals and credit, across all partner managers", stage: "1A", ref: "R-SEC" },
    { text: "Decide registrations escalated at 80% of their review deadline", stage: "1A", ref: "R-SLA-3" },
    { text: "Approve or decline credit split overrides proposed by partner managers", stage: "1B", ref: "R-CR-2" },
    { text: "Decide second protection extensions", stage: "1A", ref: "R-REG-11" },
    { text: "Accept or decline partner applications escalated to you", stage: "1A", ref: "R-ONB-2" },
    { text: "Approve program rules, tiers and review deadlines", stage: "1A" },
    { text: "Approve AI agent autonomy changes", stage: "0", ref: "R-AG-1" },
    { text: "Export revenue by partner for the board", stage: "1B" },
    { text: "Approve MDF, rewards and tier changes", stage: "Stage 2" },
    { text: "Move partners between partner managers, or assign unowned ones (standard practice; not in the documents)", stage: "Added" },
  ],
  cannot: [
    { text: "Register deals; partners and their reps do that", ref: "BRD persona" },
    { text: "Publish a new attribution model without CFO approval", ref: "Proposed rule" },
    { text: "Let AI agents move money on their own", ref: "R-AG-2" },
  ],
}
