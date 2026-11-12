// Demo data for three more Brightline (vendor) roles: RevOps (Ana Costa), the field seller (Sam Rivera)
// and the CFO (Morgan Hale). Personas, permissions and rule IDs come from the PRM Knowledge Hub.
import { roleWeights, type PartnerRole } from "@/data/model"

export type VendorRoleId = "revops" | "ae" | "ceo"

export interface VendorPerson {
  role: VendorRoleId
  name: string
  first: string
  initials: string
  /** Job title at Brightline. */
  title: string
  /** Short role name used in the portal. */
  roleLabel: string
  email: string
}

export const people: Record<VendorRoleId, VendorPerson> = {
  revops: { role: "revops", name: "Ana Costa", first: "Ana", initials: "AC", title: "Partner operations lead", roleLabel: "RevOps", email: "ana.costa@brightline.io" },
  ae: { role: "ae", name: "Sam Rivera", first: "Sam", initials: "SR", title: "Account executive, enterprise", roleLabel: "Field seller", email: "sam.rivera@brightline.io" },
  ceo: { role: "ceo", name: "Morgan Hale", first: "Morgan", initials: "MH", title: "Chief financial officer", roleLabel: "CFO", email: "morgan.hale@brightline.io" },
}

/* ================================================================== */
/* RevOps: exceptions, the revenue ledger                              */
/* ================================================================== */

/** What kind of data problem an agent flagged. */
export type ExceptionKind = "write" | "mismatch" | "match" | "stale"

export const exceptionKindLabel: Record<ExceptionKind, string> = {
  write: "Salesforce write",
  mismatch: "Revenue mismatch",
  match: "Uncertain match",
  stale: "Stale data",
}

export interface ExceptionOption {
  id: string
  label: string
  sub: string
  tone: "ok" | "primary" | "amber" | "bad"
  suggested?: boolean
}

export interface DataException {
  id: string
  kind: ExceptionKind
  title: string
  detail: string
  found: string
  /** The agent that flagged it. */
  source: string
  /** Partner manager's report of the same problem (Jordan's "Tell RevOps"). */
  issueId?: string
  oppId?: string
  regId?: string
  partnerId?: string
  /** Side-by-side values: what we hold against what the other system says. */
  compare?: { label: string; ours: string; theirs: string; match?: boolean }[]
  ai: { headline: string; confidence: number; evidence: string[] }
  options: ExceptionOption[]
  /** For a revenue mismatch: the Salesforce closed-won amount. */
  sfAmount?: number
  /** What can't be done from here, and who does it instead. */
  limit?: string
  status: "open" | "waiting" | "resolved"
  resolution?: { by: string; at: string; text: string; ledgerId?: string; choice?: string }
}

export const exceptionsSeed: DataException[] = [
  {
    id: "EX-42", kind: "mismatch", title: "Cedar Valley Schools: closed-won amount differs",
    detail: "Salesforce closed the deal at $42,000. Partner credit was calculated on the $45,000 Summit Resale registered, so both partners' credit is on hold until the amounts agree.",
    found: "2026-10-03T07:00:00", source: "Reconciliation agent", issueId: "i2", oppId: "006Q8000016CdrV", regId: "REG-1688", partnerId: "summit", sfAmount: 42_000,
    compare: [
      { label: "Amount", ours: "$45,000 (registered)", theirs: "$42,000 (closed-won)" },
      { label: "Close date", ours: "Oct 2, 2026", theirs: "Oct 2, 2026", match: true },
      { label: "Account", ours: "Cedar Valley Schools", theirs: "Cedar Valley Schools", match: true },
      { label: "Partners", ours: "Summit Resale 55% · Clearpath Digital 45%", theirs: "Summit Resale (Reseller) · Clearpath Digital (Referral)", match: true },
    ],
    ai: {
      headline: "Match Salesforce with a ledger entry of −$3,000", confidence: 0.91,
      evidence: [
        "Salesforce is the record for amounts (D5). The signed order form is $42,000.",
        "The $3,000 difference is a multi-year discount added at signing (order form version 2, Oct 1).",
        "Shares don't change: 55% and 45% of $42,000. Only the amount does.",
      ],
    },
    options: [
      { id: "ledger", label: "Match Salesforce: ledger entry of −$3,000", sub: "Adds a correcting entry; the original stays in the history. Credit is released", tone: "ok", suggested: true },
      { id: "owner", label: "Ask the opportunity owner to fix Salesforce", sub: "Alex Morgan checks the amount; credit stays on hold meanwhile", tone: "primary" },
    ],
    limit: "You can correct an amount with a ledger entry. Changing who gets credit, or the shares, needs the channel chief (R-CR-2).",
    status: "open",
  },
  {
    id: "EX-41", kind: "write", title: "Orion Labs: Atlas's partner role isn't in Salesforce yet",
    detail: "Jordan Lee approved Orion Labs for Atlas Integrators. Salesforce timed out when the platform added Atlas as Implementation partner on the opportunity. The write is queued and retried automatically, so nothing is lost.",
    found: "2026-10-27T15:12:30", source: "Sync agent", issueId: "i1", regId: "REG-2035", partnerId: "atlas",
    compare: [
      { label: "Opportunity", ours: "006Q8000022OrnL", theirs: "006Q8000022OrnL", match: true },
      { label: "Partner role", ours: "Atlas Integrators · Implementation", theirs: "None yet" },
      { label: "Attempts", ours: "2 of 5", theirs: "Timed out after 30 s" },
    ],
    ai: {
      headline: "Retry now: Salesforce is answering normally again", confidence: 0.88,
      evidence: ["The last 40 writes since 15:20 yesterday succeeded.", "The opportunity isn't locked or being edited.", "Atlas already sees the deal as approved; only the Salesforce record is behind."],
    },
    options: [
      { id: "retry", label: "Retry the write now", sub: "Writes Atlas's role to Salesforce straight away", tone: "ok", suggested: true },
      { id: "wait", label: "Leave it to the automatic retries", sub: "Next try in 3 minutes; you're told if all 5 fail", tone: "primary" },
    ],
    status: "open",
  },
  {
    id: "EX-43", kind: "match", title: "Two Salesforce accounts look like the same company",
    detail: "\"Acme Manufacturing\" and \"ACME Mfg. Inc.\" share a web domain and a billing address. Conflict checks only look at the first one, so a partner could register a deal someone is already working under the other name.",
    found: "2026-10-28T06:30:00", source: "Sync agent",
    compare: [
      { label: "Name", ours: "Acme Manufacturing", theirs: "ACME Mfg. Inc." },
      { label: "Domain", ours: "acme-mfg.com", theirs: "acme-mfg.com", match: true },
      { label: "Billing address", ours: "2200 W Fulton St, Chicago", theirs: "2200 West Fulton Street, Chicago", match: true },
      { label: "Owner", ours: "Sam Rivera", theirs: "Nobody · created by a web form on Sep 30" },
      { label: "Open opportunities", ours: "1 (Analytics expansion)", theirs: "None" },
    ],
    ai: {
      headline: "Same company (89% match)", confidence: 0.89,
      evidence: ["Same domain and the same street address, written two ways.", "The second record came from a web form and has never been worked.", "Ridgeway IT has a registration under review on Acme Manufacturing."],
    },
    options: [
      { id: "same", label: "Treat them as the same company", sub: "Conflict checks cover both now; Kai Brennan merges them in Salesforce", tone: "ok", suggested: true },
      { id: "different", label: "They're different companies", sub: "Keeps them apart; the agent stops flagging this pair", tone: "primary" },
    ],
    limit: "Merging records inside Salesforce is done by the CRM admin, Kai Brennan.",
    status: "open",
  },
  {
    id: "EX-44", kind: "stale", title: "Orchid Foods has gone quiet in Salesforce",
    detail: "Summit Resale's approved deal has had no Salesforce activity for 52 days, it's still in Qualification, and its protection ends on Nov 1.",
    found: "2026-10-28T06:30:00", source: "Sync agent", regId: "REG-1840", partnerId: "summit",
    compare: [
      { label: "Last activity", ours: "Sep 6, 2026", theirs: "52 days ago" },
      { label: "Stage", ours: "Qualification", theirs: "Unchanged since Jun 2" },
      { label: "Protection ends", ours: "Nov 1, 2026", theirs: "In 4 days" },
    ],
    ai: {
      headline: "Ask the partner manager to check with Summit", confidence: 0.76,
      evidence: ["Summit hasn't asked for an extension.", "Summit Resale's other deals are active, so this one may have stalled or been lost."],
    },
    options: [
      { id: "jordan", label: "Ask Jordan Lee to check with Summit", sub: "Jordan gets a note with the facts; you're told the outcome", tone: "ok", suggested: true },
      { id: "reviewed", label: "Mark as reviewed", sub: "Nothing changes; protection ends on Nov 1 as planned", tone: "primary" },
    ],
    status: "open",
  },
  {
    id: "EX-37", kind: "mismatch", title: "Pinecrest Utilities: close date differed by one day",
    detail: "Northpeak marked the deal won on Sep 22, at go-live; Salesforce closed it on Sep 25.",
    found: "2026-09-25T07:00:00", source: "Reconciliation agent", oppId: "006Q8000015PncU", partnerId: "northpeak",
    ai: { headline: "Use the Salesforce date", confidence: 0.97, evidence: ["Dates within 2 days are settled automatically under the reconciliation rule."] },
    options: [],
    status: "resolved",
    resolution: { by: "Ana Costa", at: "2026-09-25T09:10:00", text: "Kept the Salesforce close date (Sep 25). No credit changed.", ledgerId: "LE-204" },
  },
]

/** One entry in the revenue ledger. Append-only: corrections are new entries, never edits. */
export interface LedgerEntry {
  id: string
  at: string
  account: string
  oppId?: string
  text: string
  amount: number
  by: string
}

export const ledgerSeed: LedgerEntry[] = [
  { id: "LE-207", at: "2026-10-09T18:00:00", account: "Pinnacle Health Network", oppId: "006Q8000017PnhN", text: "Closed-won matched to Salesforce: $96,000 · credit version 2 (override approved by Dana Ortiz)", amount: 96_000, by: "Reconciliation agent" },
  { id: "LE-205", at: "2026-10-02T18:00:00", account: "Cedar Valley Schools", oppId: "006Q8000016CdrV", text: "Closed-won recorded at the registered $45,000 · held: Salesforce says $42,000", amount: 45_000, by: "Reconciliation agent" },
  { id: "LE-204", at: "2026-09-25T09:10:00", account: "Pinecrest Utilities", oppId: "006Q8000015PncU", text: "Closed-won matched to Salesforce: $150,000 · close date set to Sep 25", amount: 150_000, by: "Ana Costa" },
  { id: "LE-203", at: "2026-09-18T18:00:00", account: "Lakeshore Hotels", text: "Closed-won matched to Salesforce: $124,000", amount: 124_000, by: "Reconciliation agent" },
]

/** Rule fields RevOps can propose changes to. The channel chief approves (R-APR-2); nothing is edited in place. */
export const ruleFields = [
  { key: "autoApprove", label: "Auto-approve limit", unit: "$", ref: "R-REG-6", help: "Clean deals up to this value are decided by rules in 60 seconds." },
  { key: "reviewHours", label: "Review deadline", unit: "business hours", ref: "R-SLA-1", help: "How long the partner manager has to decide a deal up to $100,000." },
  { key: "protectionDays", label: "Protection window", unit: "days", ref: "R-REG-10", help: "How long an approved deal is protected for the partner." },
  { key: "leadHours", label: "Lead acceptance window", unit: "hours", ref: "R-SLA-9", help: "How long a partner has to accept a lead before it's reassigned." },
] as const
export type RuleField = (typeof ruleFields)[number]["key"]

/** Starting rules of the Marketplace template, which RevOps can launch for the chief to approve. */
export const marketplaceTemplate = { autoApprove: 25_000, reviewHours: 8, protectionDays: 60, leadHours: 48 }

/* ================================================================== */
/* Field seller: accounts, co-sell (J-03, Stage 2)                     */
/* ================================================================== */

export interface SellerAccount {
  id: string
  name: string
  industry: string
  employees: number
  sizeBand: string
  region: string
  hq: string
  /** The Salesforce opportunity Sam owns, when there is one. */
  oppId?: string
  oppName?: string
  product: string
  value: number
  stage: string
  closeDate: string
  /** Partner registrations on this account. */
  regIds: string[]
  /** Partner help the deal needs, for co-sell. */
  need?: string
  role?: PartnerRole
  note: string
}

export const sellerAccounts: SellerAccount[] = [
  {
    id: "solstice", name: "Solstice Hotels", industry: "Hospitality", employees: 2400, sizeBand: "1,000–5,000 people", region: "North America · Central", hq: "Denver, CO",
    oppId: "006Q8000025SolH", oppName: "Solstice Hotels – Guest analytics", product: "Analytics · Enterprise", value: 90_000, stage: "Discovery", closeDate: "2027-02-15", regIds: [],
    need: "A reseller who knows hotels, to run procurement and the rollout across 38 properties", role: "Reseller",
    note: "The VP of Guest Experience wants one view of bookings and reviews before the spring season.",
  },
  {
    id: "ironbridge", name: "Ironbridge Utilities", industry: "Utilities", employees: 4100, sizeBand: "1,000–5,000 people", region: "North America · East", hq: "Hartford, CT",
    oppId: "006Q8000026IrnU", oppName: "Ironbridge Utilities – Grid analytics", product: "Platform · Grid analytics", value: 160_000, stage: "Qualification", closeDate: "2027-03-31", regIds: [],
    need: "An implementation partner with Grid analytics skills for a six-month rollout", role: "Implementation",
    note: "Regulator deadline in Q2: they need outage reporting live across two control centres.",
  },
  {
    id: "acme", name: "Acme Manufacturing", industry: "Manufacturing", employees: 1800, sizeBand: "1,000–5,000 people", region: "North America · Central", hq: "Chicago, IL",
    oppId: "006Q8000019AcmQ", oppName: "Acme Manufacturing – Analytics expansion", product: "Analytics · Enterprise", value: 55_000, stage: "Discovery", closeDate: "2027-01-10", regIds: ["REG-2041"],
    note: "You opened this on Oct 16. Elena Ruiz (VP Operations) is the buyer.",
  },
  {
    id: "brookside", name: "Brookside Bank", industry: "Banking", employees: 3200, sizeBand: "1,000–5,000 people", region: "North America · West", hq: "Portland, OR",
    oppId: "006Q8000020BrkS", oppName: "Brookside Bank – Analytics", product: "Analytics · Enterprise", value: 120_000, stage: "Proposal", closeDate: "2026-12-30", regIds: ["REG-1925"],
    note: "Clearpath introduced the CTO; Atlas joined through your co-sell request for the implementation.",
  },
  {
    id: "kestrel", name: "Kestrel Energy", industry: "Energy", employees: 5400, sizeBand: "5,000+ people", region: "North America · East", hq: "Pittsburgh, PA",
    product: "Platform · Grid analytics", value: 140_000, stage: "No opportunity yet", closeDate: "2027-01-30", regIds: ["REG-2038"],
    note: "Northpeak brought this account in. When the registration is approved, Salesforce creates the opportunity with you as owner.",
  },
]

/** A partner the co-sell agent suggests for an account, with its reasons (R-CS-2). */
export interface Candidate {
  partnerId: string
  /** Who at the partner gets the request. */
  contact: string
  score: number
  reasons: string[]
  caution?: string
  draft: string
}

export const candidatesSeed: Record<string, Candidate[]> = {
  solstice: [
    {
      partnerId: "ridgeway", contact: "Marcus Bell", score: 0.91,
      reasons: ["Won Lakeshore Hotels ($124,000) in September", "Running a Q4 hospitality campaign right now", "Gold reseller in North America · Central", "11 approved registrations this year, none rejected"],
      draft: "Hi Marcus, I'm working a guest-analytics deal with a 38-hotel group in Colorado, about $90,000 on Analytics · Enterprise. Your work at Lakeshore Hotels is exactly what they need. Could Ridgeway take procurement and the rollout? The account details unlock when you accept. Sam",
    },
    {
      partnerId: "summit", contact: "Tara Quinn", score: 0.62,
      reasons: ["Reseller in North America · Central", "No hospitality wins yet"], caution: "Registered tier, still building its first deals",
      draft: "Hi Tara, I have a hospitality analytics deal in Colorado, about $90,000, and I'm looking for a reseller to run procurement and the rollout. Interested? The account details unlock when you accept. Sam",
    },
    {
      partnerId: "orbitwise", contact: "Nadia Brooks", score: 0.5,
      reasons: ["Silver reseller", "Based in North America · East"], caution: "No activity for five weeks",
      draft: "Hi Nadia, I have a hospitality analytics deal, about $90,000, and need a reseller for procurement and rollout. Interested? The account details unlock when you accept. Sam",
    },
  ],
  ironbridge: [
    {
      partnerId: "northpeak", contact: "Hannah Cho", score: 0.86,
      reasons: ["Took Pinecrest Utilities live in September ($150,000)", "Platinum services partner in North America · East", "4 people certified in the Platform"],
      draft: "Hi Hannah, I'm working a Grid analytics rollout with a New England utility, about $160,000, with a regulator deadline in Q2. Your Pinecrest Utilities project is the closest match I've seen. Could Northpeak lead the implementation? The account details unlock when you accept. Sam",
    },
    {
      partnerId: "atlas", contact: "Ben Adler", score: 0.58,
      reasons: ["Silver services partner", "Implemented two Platform deals this year"], caution: "Based in North America · West, and nobody certified in Grid analytics",
      draft: "Hi Ben, I have a Grid analytics rollout with a utility on the East Coast, about $160,000. Could Atlas lead the implementation? The account details unlock when you accept. Sam",
    },
  ],
}

export interface PlanStep { id: string; text: string; owner: string; due: string; done: boolean }

/** A co-sell request from a Brightline seller to a partner (J-03). The partner sees no account detail until it accepts (R-CS-4). */
export interface CoSellRequest {
  id: string
  accountId: string
  partnerId: string
  /** The person at the partner it was sent to. */
  contact: string
  role: PartnerRole
  from: string
  sentAt: string
  respondBy: string
  message: string
  status: "sent" | "accepted" | "declined"
  decidedBy?: string
  decidedAt?: string
  /** The partner's person who owns it once accepted. */
  owner?: string
  declineReason?: string
  plan: PlanStep[]
}

export const cosellSeed: CoSellRequest[] = [
  {
    id: "CS-6", accountId: "brookside", partnerId: "atlas", contact: "Ben Adler", role: "Implementation", from: "Sam Rivera",
    sentAt: "2026-09-20T10:00:00", respondBy: "2026-09-22T10:00:00", message: "Could Atlas scope and run the analytics implementation for a regional bank? Clearpath made the introduction.",
    status: "accepted", decidedBy: "Ben Adler", decidedAt: "2026-09-21T09:15:00", owner: "Ben Adler",
    plan: [
      { id: "p1", text: "Technical workshop with the bank's data team", owner: "Ben Adler (Atlas)", due: "2026-10-06", done: true },
      { id: "p2", text: "Solution design", owner: "Ben Adler (Atlas)", due: "2026-10-15", done: true },
      { id: "p3", text: "Pricing review with the bank's CFO", owner: "Sam Rivera", due: "2026-11-04", done: false },
      { id: "p4", text: "Security questionnaire", owner: "Ben Adler (Atlas)", due: "2026-11-12", done: false },
    ],
  },
]

/** Starting joint plan when a partner accepts: owners and dates, editable by both sides (Stage 2). */
export const defaultPlan = (owner: string, partner: string, role: PartnerRole, today: string, add: (iso: string, d: number) => string): PlanStep[] => [
  { id: "p1", text: "Intro call with the customer", owner: "Sam Rivera", due: add(today, 5), done: false },
  { id: "p2", text: role === "Implementation" ? "Discovery workshop and rollout plan" : "Pricing and procurement plan", owner: `${owner} (${partner})`, due: add(today, 12), done: false },
  { id: "p3", text: "Joint proposal to the customer", owner: "Sam Rivera", due: add(today, 21), done: false },
]

/* ================================================================== */
/* CEO / CFO: revenue proof (J-02), model approval, large rewards      */
/* ================================================================== */

/** Brightline's total 2026 revenue to date, so the board sees the channel's share. Example figure. */
export const companyRevenue = 14_200_000

/** Credit that isn't verified yet. Off by default; the CEO and CFO can switch it on (persona note). */
export const unverified = {
  partnerReported: { amount: 286_000, label: "Partner-reported", help: "Deals partners say they influenced that aren't matched to closed-won yet." },
  aiInferred: { amount: 174_000, label: "AI-inferred", help: "Partner touches the attribution agent links to closed-won deals with at least 70% confidence." },
}

/** Verified partner revenue by quarter. Q4 is to date and fills up live; past quarters keep their model (persona note). */
export const quarters = [
  { q: "Q1", won: 820_000, model: 2 },
  { q: "Q2", won: 1_010_000, model: 2 },
  { q: "Q3", won: 1_240_000, model: 2 },
]

/** Share of verified partner revenue partners sourced, against revenue they influenced. Example split. */
export const sourcedShare = 0.68

export interface ModelVersion {
  version: number
  name: string
  from: string
  to?: string
  note: string
  weights?: Record<PartnerRole, number>
  approvedBy?: string
}

export const modelVersions: ModelVersion[] = [
  { version: 1, name: "Equal split", from: "2025-01-01", to: "2025-12-31", note: "Every partner on a deal got the same share." },
  { version: 2, name: "Role-based weights", from: "2026-01-01", note: "Credit follows the role each partner played (decision D8).", weights: roleWeights, approvedBy: "Morgan Hale" },
]

/** Dana's proposal for version 3: more weight on implementation, less on light-touch influence. */
export const modelProposal = {
  version: 3,
  name: "Role-based weights, delivery adjusted",
  from: "2027-01-01",
  weights: { ...roleWeights, Implementation: 30, Technology: 15, Influenced: 5 } as Record<PartnerRole, number>,
  why: "Implementation partners do most of the delivery work but get one of the smallest weights. Three of the four credit overrides approved this year raised an implementation partner's share; version 3 makes that the default instead of an exception.",
}

export interface ExecApproval {
  id: string
  kind: "model" | "reward"
  title: string
  sub: string
  from: string
  fromRole: string
  at: string
  amount?: number
  partnerId?: string
  status: "pending" | "approved" | "declined"
  note?: string
  decidedAt?: string
}

/** Rewards above this need the CFO as well as the channel chief. Proposed rule, not in the documents. */
export const rewardLimit = 20_000

export const execApprovalsSeed: ExecApproval[] = [
  {
    id: "AM-3", kind: "model", title: "Attribution model version 3", sub: "More weight on implementation partners, from Jan 1, 2027",
    from: "Dana Ortiz", fromRole: "Channel chief", at: "2026-10-26T15:00:00", status: "pending",
  },
  {
    id: "RW-14", kind: "reward", title: "Northpeak Consulting: 2026 Platinum performance rebate", sub: "4% of $540,000 verified revenue",
    from: "Dana Ortiz", fromRole: "Channel chief", at: "2026-10-27T11:00:00", amount: 21_600, partnerId: "northpeak", status: "pending",
  },
]

export const rewardDetail = {
  "RW-14": {
    basis: "Platinum performance rebate: 4% of the partner's verified revenue for the year, paid once the year's revenue is reconciled.",
    revenue: 540_000, rate: 0.04,
    evidence: ["$540,000 verified revenue in 2026, all matched to Salesforce closed-won", "Above the $500,000 Platinum threshold since Sep 25", "No open credit disputes or mismatches"],
    budgetLine: "Rewards and spiffs",
  },
} as Record<string, { basis: string; revenue: number; rate: number; evidence: string[]; budgetLine: string }>

/* ================================================================== */
/* Access: from the PRM Knowledge Hub's persona pages and permission matrix */
/* ================================================================== */

export const access: Record<VendorRoleId, { can: { text: string; stage: string }[]; cannot: string[]; signIn: string }> = {
  revops: {
    can: [
      { text: "Clear the exceptions queue: failed Salesforce writes, uncertain matches, stale data", stage: "1A" },
      { text: "Resolve revenue mismatches with new ledger entries", stage: "1B" },
      { text: "Create programs from templates (reseller, referral, services, technology, marketplace)", stage: "1A" },
      { text: "Propose tiers, review deadlines, protection windows and auto-approve limits", stage: "1A" },
      { text: "See all pipeline and revenue", stage: "1A" },
    ],
    cannot: ["Approve your own rule changes; the channel chief does (R-APR-2)", "Change partner credit or shares without approval (R-CR-2)", "Merge records inside Salesforce; the CRM admin does"],
    signIn: "Brightline SSO.",
  },
  ae: {
    can: [
      { text: "See partner activity and registrations on your own accounts", stage: "1A" },
      { text: "See which partners are on your deals, their roles and their touches", stage: "1A" },
      { text: "Add what you know to a registration on your account, for the partner manager", stage: "Added" },
      { text: "Send co-sell requests; the AI drafts, you always send (R-CS-3)", stage: "2" },
      { text: "Edit joint account plans with the partner", stage: "2" },
    ],
    cannot: ["Decide registrations; the partner manager does", "See partners' commercial terms, or their credit on other sellers' accounts", "See accounts that aren't yours"],
    signIn: "Brightline SSO. From Stage 2 this sits inside Salesforce as widgets (SP-06).",
  },
  ceo: {
    can: [
      { text: "See all revenue and pipeline", stage: "1B" },
      { text: "Export and share the board view", stage: "1B" },
      { text: "Approve a new attribution model version (CFO)", stage: "1B" },
      { text: `Approve rewards over $${(rewardLimit / 1000).toFixed(0)},000 (CFO)`, stage: "2" },
    ],
    cannot: ["Register deals", "Change credit splits directly", "Configure programs or rules"],
    signIn: "Brightline SSO; usually the phone home screen, once a week.",
  },
}
