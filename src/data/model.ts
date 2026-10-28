// Domain types and demo data for the Partner Manager (PAM / CAM) workspace.
// Everything here is fictional. States follow the planning deck's D5 proposal:
// the business state is separate from the CRM sync status.

export type CheckStatus = "pass" | "fail" | "warn"
export interface Check {
  label: string
  status: CheckStatus
  detail: string
}

export type Program = "Reseller" | "Services" | "Referral" | "Technology"
export type Tier = "Registered" | "Silver" | "Gold" | "Platinum"

export interface Contact {
  name: string
  title: string
  email: string
  phone: string
}

export interface Partner {
  id: string
  name: string
  program: Program
  tier: Tier
  region: string
  assigned: boolean
  status: "active" | "onboarding"
  quality: number
  contact: Contact
  pipeline: number
  wonThisYear: number
  lastActivity: string
  since?: string
  people?: Person[]
}

export interface Person extends Contact {
  canRegister?: boolean
}

export type RegState =
  | "under_review"
  | "info_requested"
  | "approved"
  | "rejected"
  | "won"
  | "lost"
  | "expired"

export type SyncStatus = "not_needed" | "pending" | "synced"

export type ReviewReason =
  | "conflict"
  | "over_limit"
  | "duplicate"
  | "low_quality"
  | "low_confidence"
  | "territory"

export const reviewReasonLabel: Record<ReviewReason, string> = {
  conflict: "Conflict with an open Salesforce opportunity",
  over_limit: "Over the $50,000 auto-approve limit",
  duplicate: "Possible duplicate registration",
  low_quality: "Partner quality below 0.70",
  low_confidence: "AI unsure about some fields",
  territory: "Outside the partner's territory",
}

export const reviewReasonShort: Record<ReviewReason, string> = {
  conflict: "Conflict found",
  over_limit: "Over $50K",
  duplicate: "Possible duplicate",
  low_quality: "Low partner quality",
  low_confidence: "Unsure fields",
  territory: "Outside territory",
}

export type RejectCode =
  | "duplicate"
  | "existing_opportunity"
  | "territory"
  | "not_eligible"
  | "not_qualified"
  | "other"

export const rejectReasons: { code: RejectCode; label: string; explain: string }[] = [
  {
    code: "duplicate",
    label: "Duplicate registration",
    explain: "Another partner registered this customer and product first, and that registration is still protected.",
  },
  {
    code: "existing_opportunity",
    label: "Existing Brightline opportunity",
    explain: "Brightline is already working this deal directly, so it can't be registered as partner-sourced.",
  },
  {
    code: "territory",
    label: "Outside territory",
    explain: "This customer sits outside the territory your company is authorised to sell in.",
  },
  {
    code: "not_eligible",
    label: "Partner or product not eligible",
    explain: "Your company isn't authorised for this product yet, or onboarding isn't complete.",
  },
  {
    code: "not_qualified",
    label: "Customer not qualified",
    explain: "We couldn't confirm a real buying need or budget for this deal.",
  },
  { code: "other", label: "Other reason", explain: "" },
]

export interface ConflictRow {
  label: string
  ours: string
  theirs: string
  match?: boolean
}

export interface Conflict {
  kind: "crm_opportunity" | "registration"
  title: string
  ref: string
  owner: string
  stage: string
  restricted?: boolean
  rows: ConflictRow[]
}

export interface AiAdvice {
  action: "approve" | "reject" | "request_info"
  headline: string
  confidence: number
  evidence: string[]
  rejectCode?: RejectCode
  linkOpportunity?: string
  infoNeeded?: string[]
}

export interface PrefillField {
  label: string
  value: string
  confidence: number
  source: string
}

export interface Decision {
  by: "you" | "rules"
  action: "approved" | "rejected" | "info_requested"
  at: string
  reason?: string
  message?: string
  seconds?: number
}

export interface Registration {
  id: string
  partnerId: string
  rep: string
  customer: string
  product: string
  value: number
  closeDate: string
  submittedAt: string
  program: Program
  state: RegState
  slaHours: number
  usedHours: number
  reasons: ReviewReason[]
  checks: Check[]
  conflict?: Conflict
  ai?: AiAdvice
  prefill: PrefillField[]
  note: string
  decision?: Decision
  infoRequest?: { asked: string; at: string }
  crm?: { opportunityId: string; role: string; sync: SyncStatus; linked: "new" | "existing" }
  protectedUntil?: string
  /** Live Salesforce stage once a registration becomes an opportunity. */
  crmStage?: string
  lostReason?: string
}

export interface ExtensionRequest {
  id: string
  registrationId: string
  partnerId: string
  customer: string
  value: number
  protectionEnds: string
  daysLeft: number
  requestedDays: number
  reason: string
  crmStage: string
  lastActivity: string
  previousExtensions: number
  ai: { action: "grant" | "deny"; headline: string; confidence: number; evidence: string[]; days?: number }
  status: "pending" | "granted" | "denied"
  decidedDays?: number
  denyReason?: string
}

export interface Agreement {
  name: string
  status: "signed" | "accepted" | "missing" | "after_accept"
  detail: string
}

export interface Application {
  id: string
  company: string
  website: string
  hq: string
  region: string
  employees: number
  founded: number
  program: Program
  products: string[]
  applicant: Contact
  appliedAt: string
  message: string
  agreements: Agreement[]
  checks: Check[]
  status: "new" | "accepted" | "rejected" | "escalated"
  outcomeNote?: string
}

export interface OnboardingStep {
  label: string
  done: number
  total: number
  missing?: string
}

export interface Onboarding {
  partnerId: string
  acceptedAt: string
  steps: OnboardingStep[]
  eligible: boolean
  firstDeal: boolean
  idleDays: number
  lastReminder?: string
}

export type PartnerRole = "Sourced" | "Reseller" | "Referral" | "Implementation" | "Technology" | "Influenced"
export const roleWeights: Record<PartnerRole, number> = {
  Sourced: 50,
  Reseller: 30,
  Referral: 25,
  Implementation: 20,
  Technology: 20,
  Influenced: 10,
}
export const partnerRoles = Object.keys(roleWeights) as PartnerRole[]

export interface CreditLine {
  partnerId: string
  role: PartnerRole
  share: number
}

export interface Touch {
  id: string
  at: string
  partnerId: string
  kind: string
  text: string
}

export interface SplitVersion {
  version: number
  at: string
  by: string
  note: string
  lines: CreditLine[]
}

export interface SplitProposal {
  lines: CreditLine[]
  reason: string
  evidence: string[]
  at: string
  approver: string
}

export interface Opportunity {
  id: string
  name: string
  account: string
  value: number
  stage: string
  closeDate: string
  owner: string
  lines: CreditLine[]
  splitSource: "model" | "override"
  proposal?: SplitProposal
  versions: SplitVersion[]
  touches: Touch[]
  reconciliation?: "matched" | "pending" | "mismatch"
  reconciliationNote?: string
}

export type HealthTrend = "rising" | "stalling" | "at_risk"
export interface HealthSignal {
  id: string
  partnerId: string
  trend: HealthTrend
  metric: string
  series: number[]
  why: string
  suggestion: { title: string; detail: string; value: string; kind: "email" | "meeting" }
  draft: { subject: string; body: string }
  status: "open" | "done" | "snoozed"
}

export interface Notice {
  id: string
  at: string
  channel: "Slack" | "Email" | "In-app"
  title: string
  body: string
  href: string
  read: boolean
  tone: "info" | "warn" | "bad"
}

export interface ActivityItem {
  id: string
  at: string
  text: string
  href?: string
}

/* ------------------------------------------------------------------ */
/* Demo data                                                           */
/* ------------------------------------------------------------------ */

export const me = {
  name: "Jordan Lee",
  initials: "JL",
  title: "Partner manager",
  email: "jordan.lee@brightline.io",
  vendor: "Brightline",
  chief: "Dana Ortiz",
}

export const partners: Partner[] = [
  {
    id: "ridgeway", name: "Ridgeway IT", program: "Reseller", tier: "Gold", region: "North America · Central",
    assigned: true, status: "active", quality: 0.86, pipeline: 412000, wonThisYear: 318000, lastActivity: "2026-10-28T08:10:00",
    since: "2021-03-15", people: [{ name: "Marcus Bell", title: "Partner sales lead", email: "marcus@ridgewayit.com", phone: "+1 312 555 0142", canRegister: true }, { name: "Jenna Ruiz", title: "Account executive", email: "jenna@ridgewayit.com", phone: "+1 312 555 0167", canRegister: true }, { name: "Paul Okafor", title: "CEO", email: "paul@ridgewayit.com", phone: "+1 312 555 0100" }],
    contact: { name: "Marcus Bell", title: "Partner sales lead", email: "marcus@ridgewayit.com", phone: "+1 312 555 0142" },
  },
  {
    id: "northpeak", name: "Northpeak Consulting", program: "Services", tier: "Platinum", region: "North America · East",
    assigned: true, status: "active", quality: 0.91, pipeline: 610000, wonThisYear: 540000, lastActivity: "2026-10-27T16:40:00",
    since: "2019-09-02", people: [{ name: "Hannah Cho", title: "Alliance director", email: "hannah.cho@northpeak.co", phone: "+1 617 555 0186", canRegister: true }, { name: "Raj Mehta", title: "Solutions architect", email: "raj.mehta@northpeak.co", phone: "+1 617 555 0121" }],
    contact: { name: "Hannah Cho", title: "Alliance director", email: "hannah.cho@northpeak.co", phone: "+1 617 555 0186" },
  },
  {
    id: "clearpath", name: "Clearpath Digital", program: "Referral", tier: "Silver", region: "North America · West",
    assigned: true, status: "active", quality: 0.78, pipeline: 156000, wonThisYear: 88000, lastActivity: "2026-10-28T07:55:00",
    since: "2023-01-20", contact: { name: "Luis Ortega", title: "Founder", email: "luis@clearpath.digital", phone: "+1 415 555 0119" },
  },
  {
    id: "summit", name: "Summit Resale", program: "Reseller", tier: "Registered", region: "North America · Central",
    assigned: true, status: "active", quality: 0.66, pipeline: 74000, wonThisYear: 31000, lastActivity: "2026-10-26T11:20:00",
    since: "2024-06-11", contact: { name: "Tara Quinn", title: "Account executive", email: "tara@summitresale.com", phone: "+1 214 555 0177" },
  },
  {
    id: "atlas", name: "Atlas Integrators", program: "Services", tier: "Silver", region: "North America · West",
    assigned: true, status: "active", quality: 0.81, pipeline: 198000, wonThisYear: 126000, lastActivity: "2026-10-27T09:05:00",
    since: "2022-04-04", contact: { name: "Ben Adler", title: "Practice lead", email: "ben.adler@atlasintegrators.com", phone: "+1 206 555 0131" },
  },
  {
    id: "orbitwise", name: "Orbitwise Solutions", program: "Reseller", tier: "Silver", region: "North America · East",
    assigned: true, status: "active", quality: 0.74, pipeline: 62000, wonThisYear: 97000, lastActivity: "2026-09-20T14:00:00",
    since: "2022-11-18", contact: { name: "Nadia Brooks", title: "Sales director", email: "nadia@orbitwise.io", phone: "+1 646 555 0150" },
  },
  {
    id: "keystone", name: "Keystone Data", program: "Services", tier: "Registered", region: "North America · East",
    assigned: true, status: "onboarding", quality: 0.7, pipeline: 0, wonThisYear: 0, lastActivity: "2026-10-22T10:00:00",
    contact: { name: "Owen Park", title: "Managing partner", email: "owen@keystonedata.com", phone: "+1 202 555 0164" },
  },
  {
    id: "mosaic", name: "Mosaic IT", program: "Reseller", tier: "Registered", region: "North America · Central",
    assigned: true, status: "onboarding", quality: 0.7, pipeline: 0, wonThisYear: 0, lastActivity: "2026-10-22T15:30:00",
    contact: { name: "Rhea Kapoor", title: "Owner", email: "rhea@mosaic-it.com", phone: "+1 773 555 0108" },
  },
  {
    id: "harper", name: "Harper & Vance", program: "Referral", tier: "Registered", region: "North America · West",
    assigned: true, status: "onboarding", quality: 0.7, pipeline: 0, wonThisYear: 0, lastActivity: "2026-10-24T13:10:00",
    contact: { name: "Grace Harper", title: "Partner", email: "grace@harpervance.com", phone: "+1 503 555 0127" },
  },
  {
    id: "bluefin", name: "Bluefin Cloud", program: "Technology", tier: "Gold", region: "Global",
    assigned: false, status: "active", quality: 0.88, pipeline: 0, wonThisYear: 0, lastActivity: "2026-10-23T12:00:00",
    contact: { name: "Restricted", title: "", email: "", phone: "" },
  },
]

const passAll = (program: string, tier: string, territory: string, product: string): Check[] => [
  { label: "Partner eligible", status: "pass", detail: `${tier} partner in the ${program} program` },
  { label: "Onboarding complete", status: "pass", detail: "All agreements and tasks done" },
  { label: "Required fields", status: "pass", detail: "Account, contact, product, value and close date filled" },
  { label: "Product authorised", status: "pass", detail: product },
  { label: "Territory", status: "pass", detail: territory },
]

export const registrations: Registration[] = [
  {
    id: "REG-2041", partnerId: "ridgeway", rep: "Marcus Bell", customer: "Acme Manufacturing",
    product: "Analytics · Enterprise", value: 62000, closeDate: "2026-12-15", submittedAt: "2026-10-28T08:10:00",
    program: "Reseller", state: "under_review", slaHours: 8, usedHours: 4, reasons: ["conflict", "over_limit"],
    checks: [
      ...passAll("Reseller", "Gold", "North America · Central", "Analytics Enterprise"),
      { label: "Conflict check", status: "fail", detail: "Open Salesforce opportunity on the same account" },
      { label: "Deal size", status: "warn", detail: "$62,000 is over the $50,000 auto-approve limit" },
    ],
    conflict: {
      kind: "crm_opportunity", title: "Acme Manufacturing – Analytics expansion", ref: "006Q8000019AcmQ",
      owner: "Sam Rivera (Brightline AE)", stage: "Discovery",
      rows: [
        { label: "Account", ours: "Acme Manufacturing", theirs: "Acme Manufacturing", match: true },
        { label: "Buying contact", ours: "Elena Ruiz, VP Operations", theirs: "Elena Ruiz, VP Operations", match: true },
        { label: "Product", ours: "Analytics · Enterprise", theirs: "Analytics · Enterprise", match: true },
        { label: "Value", ours: "$62,000", theirs: "$55,000" },
        { label: "Close date", ours: "Dec 15, 2026", theirs: "Jan 10, 2027" },
        { label: "First activity", ours: "Oct 2 · partner meeting", theirs: "Oct 16 · opportunity created" },
        { label: "Partner on record", ours: "Ridgeway IT", theirs: "None yet" },
      ],
    },
    ai: {
      action: "approve", headline: "Approve and link to Sam's existing opportunity", confidence: 0.82,
      linkOpportunity: "006Q8000019AcmQ",
      evidence: [
        "Ridgeway met Elena Ruiz on Oct 2, two weeks before Sam's opportunity was created (meeting notes attached).",
        "Same contact and product; the deal values are within 15% of each other.",
        "Sam's opportunity has no partner on it yet, so no other partner loses credit.",
        "Ridgeway has 11 approved registrations this year and none rejected for conflicts.",
      ],
    },
    prefill: [
      { label: "Account", value: "Acme Manufacturing", confidence: 0.98, source: "Customer email" },
      { label: "Contact", value: "Elena Ruiz, VP Operations", confidence: 0.95, source: "Email signature" },
      { label: "Product", value: "Analytics · Enterprise", confidence: 0.9, source: "Chat with copilot" },
      { label: "Value", value: "$62,000", confidence: 0.88, source: "Quote attached" },
      { label: "Close date", value: "Dec 15, 2026", confidence: 0.84, source: "Chat with copilot" },
    ],
    note: "Elena wants to replace their spreadsheet reporting before year-end budget closes. We ran a discovery meeting on Oct 2 and a pricing call last week.",
  },
  {
    id: "REG-2038", partnerId: "northpeak", rep: "Hannah Cho", customer: "Kestrel Energy",
    product: "Platform · Grid analytics", value: 140000, closeDate: "2027-01-30", submittedAt: "2026-10-27T10:20:00",
    program: "Services", state: "under_review", slaHours: 16, usedHours: 13.1, reasons: ["over_limit"],
    checks: [
      ...passAll("Services", "Platinum", "North America · East", "Platform with Grid analytics"),
      { label: "Conflict check", status: "pass", detail: "No open opportunities or registrations on this account" },
      { label: "Deal size", status: "warn", detail: "$140,000 is over the $50,000 auto-approve limit" },
    ],
    ai: {
      action: "approve", headline: "Approve: clean deal, only held back by size", confidence: 0.94,
      evidence: [
        "No conflicts in Salesforce or in other partners' registrations.",
        "Northpeak sourced 3 energy deals with Brightline this year and won 2.",
        "Every field was filled with high confidence (0.96 average).",
      ],
    },
    prefill: [
      { label: "Account", value: "Kestrel Energy", confidence: 0.99, source: "API" },
      { label: "Contact", value: "Mark Jensen, CIO", confidence: 0.97, source: "API" },
      { label: "Product", value: "Platform · Grid analytics", confidence: 0.96, source: "API" },
      { label: "Value", value: "$140,000", confidence: 0.95, source: "API" },
      { label: "Close date", value: "Jan 30, 2027", confidence: 0.93, source: "API" },
    ],
    note: "Multi-site rollout across three plants. Northpeak will lead implementation; customer has budget approved for Q1.",
  },
  {
    id: "REG-2036", partnerId: "clearpath", rep: "Luis Ortega", customer: "Harbor Health",
    product: "Analytics · Standard", value: 38000, closeDate: "2026-12-01", submittedAt: "2026-10-28T09:10:00",
    program: "Referral", state: "under_review", slaHours: 8, usedHours: 3, reasons: ["duplicate"],
    checks: [
      ...passAll("Referral", "Silver", "North America · West", "Analytics Standard"),
      { label: "Conflict check", status: "fail", detail: "Matches a registration approved on Oct 23" },
    ],
    conflict: {
      kind: "registration", title: "Registration REG-1987", ref: "REG-1987", owner: "Bluefin Cloud", stage: "Approved · protected to Jan 21, 2027",
      restricted: true,
      rows: [
        { label: "Account", ours: "Harbor Health", theirs: "Harbor Health", match: true },
        { label: "Product", ours: "Analytics · Standard", theirs: "Analytics · Standard", match: true },
        { label: "Registered", ours: "Oct 28, 2026", theirs: "Oct 23, 2026" },
        { label: "Status", ours: "Waiting for you", theirs: "Approved, protected" },
        { label: "Commercial terms", ours: "$38,000", theirs: "Hidden · partner not assigned to you" },
      ],
    },
    ai: {
      action: "reject", headline: "Reject as a duplicate registration", confidence: 0.91, rejectCode: "duplicate",
      evidence: [
        "Another partner registered Harbor Health for Analytics on Oct 23, and it was approved.",
        "Same account and product; that protection runs to Jan 21, 2027.",
        "If Clearpath helps on the deal later, add them to the opportunity as an influencing partner.",
      ],
    },
    prefill: [
      { label: "Account", value: "Harbor Health", confidence: 0.97, source: "Forwarded email" },
      { label: "Contact", value: "Dr. Amy Lin, Director of IT", confidence: 0.92, source: "Forwarded email" },
      { label: "Product", value: "Analytics · Standard", confidence: 0.86, source: "Forwarded email" },
      { label: "Value", value: "$38,000", confidence: 0.81, source: "Forwarded email" },
      { label: "Close date", value: "Dec 1, 2026", confidence: 0.8, source: "Forwarded email" },
    ],
    note: "Referred by a board member at Harbor. They asked for a demo next week.",
  },
  {
    id: "REG-2033", partnerId: "summit", rep: "Tara Quinn", customer: "Pinecrest Bank",
    product: "Platform (edition unclear)", value: 24500, closeDate: "2026-12-31", submittedAt: "2026-10-28T10:05:00",
    program: "Reseller", state: "under_review", slaHours: 8, usedHours: 2, reasons: ["low_quality", "low_confidence"],
    checks: [
      { label: "Partner eligible", status: "warn", detail: "Partner quality 0.66 is below the 0.70 auto-approve bar" },
      { label: "Onboarding complete", status: "pass", detail: "All agreements and tasks done" },
      { label: "Required fields", status: "warn", detail: "Product edition and close date need confirming" },
      { label: "Product authorised", status: "pass", detail: "Platform (all editions)" },
      { label: "Territory", status: "pass", detail: "North America · Central" },
      { label: "Conflict check", status: "pass", detail: "No conflicts found" },
    ],
    ai: {
      action: "request_info", headline: "Ask Summit to confirm the edition and close date", confidence: 0.76,
      infoNeeded: ["Product edition", "Expected close date"],
      evidence: [
        "The email only says \"the platform\", so the edition was guessed (confidence 0.58).",
        "\"Before year end\" was read as Dec 31 (confidence 0.62).",
        "Everything else checks out; once confirmed, this can be approved.",
      ],
    },
    prefill: [
      { label: "Account", value: "Pinecrest Bank", confidence: 0.96, source: "Forwarded email" },
      { label: "Contact", value: "Ray Dorsey, COO", confidence: 0.9, source: "Forwarded email" },
      { label: "Product", value: "Platform (edition unclear)", confidence: 0.58, source: "Forwarded email" },
      { label: "Value", value: "$24,500", confidence: 0.83, source: "Forwarded email" },
      { label: "Close date", value: "Dec 31, 2026", confidence: 0.62, source: "Forwarded email" },
    ],
    note: "Forwarded from Ray's email: \"We'd like to get the platform in before year end.\"",
  },
  {
    id: "REG-2030", partnerId: "atlas", rep: "Ben Adler", customer: "Meridian Freight",
    product: "Platform · Enterprise", value: 75000, closeDate: "2027-02-15", submittedAt: "2026-10-28T07:00:00",
    program: "Services", state: "under_review", slaHours: 16, usedHours: 5, reasons: ["territory", "over_limit"],
    checks: [
      { label: "Partner eligible", status: "pass", detail: "Silver partner in the Services program" },
      { label: "Onboarding complete", status: "pass", detail: "All agreements and tasks done" },
      { label: "Required fields", status: "pass", detail: "All filled" },
      { label: "Product authorised", status: "pass", detail: "Platform Enterprise" },
      { label: "Territory", status: "fail", detail: "Customer HQ is in Rotterdam (EMEA); Atlas covers North America · West" },
      { label: "Conflict check", status: "pass", detail: "No conflicts found" },
      { label: "Deal size", status: "warn", detail: "$75,000 is over the $50,000 auto-approve limit" },
    ],
    ai: {
      action: "reject", headline: "Reject: outside Atlas's territory", confidence: 0.88, rejectCode: "territory",
      evidence: [
        "Meridian Freight B.V. is owned by the EMEA team in Salesforce.",
        "Atlas is authorised for North America · West only.",
        "Point Ben to Rui Costa, the EMEA partner manager, if Atlas has a real relationship.",
      ],
    },
    prefill: [
      { label: "Account", value: "Meridian Freight B.V.", confidence: 0.95, source: "Chat with copilot" },
      { label: "Contact", value: "Sanne de Vries, Head of Logistics IT", confidence: 0.9, source: "Chat with copilot" },
      { label: "Product", value: "Platform · Enterprise", confidence: 0.9, source: "Chat with copilot" },
      { label: "Value", value: "$75,000", confidence: 0.86, source: "Chat with copilot" },
      { label: "Close date", value: "Feb 15, 2027", confidence: 0.82, source: "Chat with copilot" },
    ],
    note: "We met Sanne at a logistics conference in Seattle. They want a US-based implementation team.",
  },
  {
    id: "REG-2027", partnerId: "ridgeway", rep: "Marcus Bell", customer: "Solace Retail",
    product: "Analytics · Standard", value: 41000, closeDate: "2027-01-15", submittedAt: "2026-10-26T14:00:00",
    program: "Reseller", state: "info_requested", slaHours: 8, usedHours: 2.8, reasons: ["low_confidence"],
    checks: [...passAll("Reseller", "Gold", "North America · Central", "Analytics Standard"),
      { label: "Conflict check", status: "pass", detail: "No conflicts found" }],
    prefill: [
      { label: "Account", value: "Solace Retail", confidence: 0.94, source: "Chat with copilot" },
      { label: "Close date", value: "Jan 15, 2027", confidence: 0.6, source: "Chat with copilot" },
    ],
    note: "Retail chain with 40 stores; replacing a legacy BI tool.",
    infoRequest: { asked: "Please confirm the customer's procurement timeline and the main contact's role.", at: "2026-10-27T09:30:00" },
    decision: { by: "you", action: "info_requested", at: "2026-10-27T09:30:00" },
  },
  {
    id: "REG-2040", partnerId: "clearpath", rep: "Luis Ortega", customer: "Juniper Foods",
    product: "Analytics · Standard", value: 18000, closeDate: "2026-11-30", submittedAt: "2026-10-28T09:01:22",
    program: "Referral", state: "approved", slaHours: 8, usedHours: 0, reasons: [], checks: [], prefill: [], note: "",
    decision: { by: "rules", action: "approved", at: "2026-10-28T09:02:00", seconds: 38 },
    crm: { opportunityId: "006Q8000023JunF", role: "Referral", sync: "synced", linked: "new" }, protectedUntil: "2027-01-26",
  },
  {
    id: "REG-2039", partnerId: "ridgeway", rep: "Marcus Bell", customer: "Coastal Credit Union",
    product: "Platform · Standard", value: 32500, closeDate: "2026-12-20", submittedAt: "2026-10-28T08:40:10",
    program: "Reseller", state: "approved", slaHours: 8, usedHours: 0, reasons: [], checks: [], prefill: [], note: "",
    decision: { by: "rules", action: "approved", at: "2026-10-28T08:40:54", seconds: 44 },
    crm: { opportunityId: "006Q8000023CstC", role: "Reseller", sync: "synced", linked: "new" }, protectedUntil: "2027-01-26",
  },
  {
    id: "REG-2035", partnerId: "atlas", rep: "Ben Adler", customer: "Orion Labs",
    product: "Analytics · Enterprise", value: 27000, closeDate: "2026-12-10", submittedAt: "2026-10-27T11:00:00",
    program: "Services", state: "approved", slaHours: 8, usedHours: 0, reasons: [], checks: [], prefill: [], note: "",
    decision: { by: "you", action: "approved", at: "2026-10-27T15:12:00" },
    crm: { opportunityId: "006Q8000022OrnL", role: "Implementation", sync: "synced", linked: "existing" }, protectedUntil: "2027-01-25",
  },
  {
    id: "REG-2031", partnerId: "summit", rep: "Tara Quinn", customer: "Vista Schools",
    product: "Platform · Standard", value: 12000, closeDate: "2026-11-20", submittedAt: "2026-10-26T13:00:00",
    program: "Reseller", state: "rejected", slaHours: 8, usedHours: 0, reasons: [], checks: [], prefill: [], note: "",
    decision: { by: "you", action: "rejected", at: "2026-10-26T16:20:00", reason: "Existing Brightline opportunity" },
  },
]

const past = (over: Partial<Registration> & Pick<Registration, "id" | "partnerId" | "rep" | "customer" | "product" | "value" | "closeDate" | "submittedAt" | "program" | "state">): Registration => ({
  slaHours: 8, usedHours: 0, reasons: [], checks: [], prefill: [], note: "", ...over,
})

export const pipelineRegistrations: Registration[] = [
  past({ id: "REG-1755", partnerId: "northpeak", rep: "Hannah Cho", customer: "Harborview Logistics", product: "Analytics · Enterprise", value: 210000, closeDate: "2026-11-20", submittedAt: "2026-08-04T09:00:00", program: "Services", state: "approved", crmStage: "Negotiation", protectedUntil: "2026-11-30",
    decision: { by: "you", action: "approved", at: "2026-08-04T13:10:00" }, crm: { opportunityId: "006Q8000024HrvL", role: "Sourced", sync: "synced", linked: "new" } }),
  past({ id: "REG-1925", partnerId: "clearpath", rep: "Luis Ortega", customer: "Brookside Bank", product: "Analytics · Enterprise", value: 120000, closeDate: "2026-12-30", submittedAt: "2026-09-02T10:00:00", program: "Referral", state: "approved", crmStage: "Proposal", protectedUntil: "2026-12-01",
    decision: { by: "you", action: "approved", at: "2026-09-02T15:00:00" }, crm: { opportunityId: "006Q8000020BrkS", role: "Referral", sync: "synced", linked: "new" } }),
  past({ id: "REG-1912", partnerId: "northpeak", rep: "Hannah Cho", customer: "Granite Labs", product: "Platform · Enterprise", value: 88000, closeDate: "2026-12-15", submittedAt: "2026-08-05T11:00:00", program: "Services", state: "approved", crmStage: "Proposal", protectedUntil: "2026-11-03",
    decision: { by: "rules", action: "approved", at: "2026-08-05T11:00:41", seconds: 41 }, crm: { opportunityId: "006Q8000019GrnL", role: "Sourced", sync: "synced", linked: "new" } }),
  past({ id: "REG-1880", partnerId: "ridgeway", rep: "Marcus Bell", customer: "Northgate Retail", product: "Analytics · Renewal", value: 64000, closeDate: "2026-12-12", submittedAt: "2026-09-12T10:00:00", program: "Reseller", state: "approved", crmStage: "Proposal", protectedUntil: "2026-12-11",
    decision: { by: "you", action: "approved", at: "2026-09-12T14:30:00" }, crm: { opportunityId: "006Q8000021NgtR", role: "Sourced", sync: "synced", linked: "new" } }),
  past({ id: "REG-1960", partnerId: "ridgeway", rep: "Jenna Ruiz", customer: "Copperline Mining", product: "Platform · Standard", value: 47000, closeDate: "2027-01-20", submittedAt: "2026-10-10T09:00:00", program: "Reseller", state: "approved", crmStage: "Discovery", protectedUntil: "2027-01-08",
    decision: { by: "rules", action: "approved", at: "2026-10-10T09:00:36", seconds: 36 }, crm: { opportunityId: "006Q8000022CprM", role: "Reseller", sync: "synced", linked: "new" } }),
  past({ id: "REG-1977", partnerId: "orbitwise", rep: "Nadia Brooks", customer: "Meadow Health", product: "Analytics · Standard", value: 38000, closeDate: "2026-11-28", submittedAt: "2026-08-20T09:00:00", program: "Reseller", state: "approved", crmStage: "Proposal", protectedUntil: "2026-11-18",
    decision: { by: "rules", action: "approved", at: "2026-08-20T09:00:44", seconds: 44 }, crm: { opportunityId: "006Q8000020MdwH", role: "Reseller", sync: "synced", linked: "new" } }),
  past({ id: "REG-1840", partnerId: "summit", rep: "Tara Quinn", customer: "Orchid Foods", product: "Platform · Standard", value: 19000, closeDate: "2026-12-20", submittedAt: "2026-05-28T09:00:00", program: "Reseller", state: "approved", crmStage: "Qualification", protectedUntil: "2026-11-01",
    decision: { by: "rules", action: "approved", at: "2026-05-28T09:00:39", seconds: 39 }, crm: { opportunityId: "006Q8000016OrcF", role: "Reseller", sync: "synced", linked: "new" } }),
  past({ id: "REG-1702", partnerId: "clearpath", rep: "Luis Ortega", customer: "Pinnacle Health Network", product: "Platform · Enterprise", value: 96000, closeDate: "2026-10-09", submittedAt: "2026-07-20T09:00:00", program: "Referral", state: "won", crmStage: "Closed won",
    decision: { by: "you", action: "approved", at: "2026-07-20T12:00:00" }, crm: { opportunityId: "006Q8000017PnhN", role: "Referral", sync: "synced", linked: "new" } }),
  past({ id: "REG-1688", partnerId: "summit", rep: "Tara Quinn", customer: "Cedar Valley Schools", product: "Platform · Standard", value: 45000, closeDate: "2026-10-02", submittedAt: "2026-08-02T09:00:00", program: "Reseller", state: "won", crmStage: "Closed won",
    decision: { by: "rules", action: "approved", at: "2026-08-02T09:00:40", seconds: 40 }, crm: { opportunityId: "006Q8000016CdrV", role: "Reseller", sync: "synced", linked: "new" } }),
  past({ id: "REG-1820", partnerId: "clearpath", rep: "Luis Ortega", customer: "Lakeside Dental", product: "Analytics · Standard", value: 22000, closeDate: "2026-10-15", submittedAt: "2026-07-02T09:00:00", program: "Referral", state: "lost", crmStage: "Closed lost", lostReason: "Chose a competitor",
    decision: { by: "rules", action: "approved", at: "2026-07-02T09:00:38", seconds: 38 }, crm: { opportunityId: "006Q8000015LksD", role: "Referral", sync: "synced", linked: "new" } }),
  past({ id: "REG-1650", partnerId: "atlas", rep: "Ben Adler", customer: "Redwood Utilities", product: "Platform · Enterprise", value: 54000, closeDate: "2026-09-30", submittedAt: "2026-05-01T09:00:00", program: "Services", state: "expired", protectedUntil: "2026-09-30",
    decision: { by: "you", action: "approved", at: "2026-05-01T15:00:00" }, crm: { opportunityId: "006Q8000014RdwU", role: "Implementation", sync: "synced", linked: "new" } }),
]

/* ---------- Leads handed to partners (lead sharing, DR-12) ---------- */

export type LeadStatus = "new" | "offered" | "accepted" | "converted" | "declined" | "expired"

export interface Lead {
  id: string
  company: string
  contact: string
  title: string
  source: string
  product: string
  estValue: number
  receivedAt: string
  status: LeadStatus
  partnerId?: string
  sentAt?: string
  acceptBy?: string
  suggestion?: { partnerId: string; why: string }
  declineReason?: string
  registrationId?: string
  update?: string
}

export const leads: Lead[] = [
  { id: "L-301", company: "Bayview Hotels", contact: "Nina Shah", title: "IT Director", source: "Brightline website", product: "Analytics", estValue: 45000, receivedAt: "2026-10-28T10:40:00", status: "new",
    suggestion: { partnerId: "ridgeway", why: "Covers North America · Central and won 3 hospitality deals this year." } },
  { id: "L-302", company: "Elm Street Clinics", contact: "Dr. Omar Haddad", title: "Operations lead", source: "Healthcare webinar", product: "Analytics", estValue: 30000, receivedAt: "2026-10-28T09:15:00", status: "new",
    suggestion: { partnerId: "clearpath", why: "Healthcare referrals are up after the same webinar; strong West coverage." } },
  { id: "L-298", company: "Northwind Logistics", contact: "Greg Palmer", title: "VP Supply Chain", source: "Trade show", product: "Platform", estValue: 80000, receivedAt: "2026-10-27T14:00:00", status: "offered",
    partnerId: "atlas", sentAt: "2026-10-27T15:00:00", acceptBy: "2026-10-29T15:00:00" },
  { id: "L-295", company: "Sterling Foods", contact: "Amy Chen", title: "CFO", source: "Brightline website", product: "Platform", estValue: 26000, receivedAt: "2026-10-26T11:00:00", status: "expired",
    partnerId: "summit", sentAt: "2026-10-26T12:00:00", acceptBy: "2026-10-28T12:00:00",
    suggestion: { partnerId: "ridgeway", why: "Same region, faster response time (median 3 h)." } },
  { id: "L-280", company: "Fable Retail", contact: "Leo Martins", title: "Head of Data", source: "Partner marketing", product: "Analytics", estValue: 52000, receivedAt: "2026-10-22T10:00:00", status: "declined",
    partnerId: "orbitwise", sentAt: "2026-10-22T11:00:00", declineReason: "No capacity this quarter",
    suggestion: { partnerId: "northpeak", why: "Has retail experience and capacity this quarter." } },
  { id: "L-290", company: "Quartz Analytics", contact: "Mia Wong", title: "CTO", source: "Brightline website", product: "Platform", estValue: 60000, receivedAt: "2026-10-20T09:00:00", status: "accepted",
    partnerId: "northpeak", sentAt: "2026-10-20T10:00:00", update: "First call held Oct 26; demo booked for Nov 2." },
  { id: "L-284", company: "Granite Labs", contact: "Sara Iqbal", title: "CISO", source: "Security summit", product: "Platform", estValue: 88000, receivedAt: "2026-08-01T09:00:00", status: "converted",
    partnerId: "northpeak", sentAt: "2026-08-01T10:00:00", registrationId: "REG-1912" },
]

export const extensions: ExtensionRequest[] = [
  {
    id: "EXT-311", registrationId: "REG-1912", partnerId: "northpeak", customer: "Granite Labs", value: 88000,
    protectionEnds: "2026-11-03", daysLeft: 6, requestedDays: 30,
    reason: "The customer moved its security review to mid-November. The proof of concept is running and our champion confirmed the new timeline.",
    crmStage: "Proposal", lastActivity: "2 days ago · meeting with the CISO", previousExtensions: 0,
    ai: {
      action: "grant", headline: "Grant 30 days", confidence: 0.9, days: 30,
      evidence: ["Active deal: a meeting was logged 2 days ago.", "Stage moved to Proposal last week.", "First extension request for this deal."],
    },
    status: "pending",
  },
  {
    id: "EXT-309", registrationId: "REG-1840", partnerId: "summit", customer: "Orchid Foods", value: 19000,
    protectionEnds: "2026-11-01", daysLeft: 4, requestedDays: 60, reason: "Budget is frozen until Q1.",
    crmStage: "Qualification", lastActivity: "41 days ago", previousExtensions: 1,
    ai: {
      action: "deny", headline: "Deny: no customer activity in 41 days", confidence: 0.74,
      evidence: ["No activity logged in Salesforce for 41 days.", "Already extended once (30 days, on Aug 28).", "Still in Qualification after 5 months."],
    },
    status: "pending",
  },
]

export const applications: Application[] = [
  {
    id: "APP-118", company: "Lattice Networks", website: "latticenet.io", hq: "Denver, CO", region: "North America · Central",
    employees: 120, founded: 2011, program: "Reseller", products: ["Analytics", "Platform"],
    applicant: { name: "Priya Raman", title: "VP Alliances", email: "priya@latticenet.io", phone: "+1 720 555 0193" },
    appliedAt: "2026-10-26T15:20:00",
    message: "We resell data infrastructure to mid-market manufacturers across the Mountain region and want to add Brightline Analytics to our portfolio. Our team includes four certified data engineers.",
    agreements: [
      { name: "Program terms", status: "accepted", detail: "Accepted on the application" },
      { name: "Mutual NDA", status: "signed", detail: "Signed Oct 20, 2026" },
      { name: "Partner agreement", status: "after_accept", detail: "Sent automatically when you accept" },
    ],
    checks: [
      { label: "Not already a partner", status: "pass", detail: "No partner record with this name or domain" },
      { label: "Company verified", status: "pass", detail: "Domain and business registration match" },
      { label: "Region", status: "pass", detail: "North America · Central is your region" },
    ],
    status: "new",
  },
  {
    id: "APP-117", company: "Fjordline Analytics", website: "fjordline.no", hq: "Oslo, Norway", region: "EMEA · Nordics",
    employees: 35, founded: 2018, program: "Referral", products: ["Analytics"],
    applicant: { name: "Erik Solberg", title: "CEO", email: "erik@fjordline.no", phone: "+47 22 55 01 40" },
    appliedAt: "2026-10-25T08:45:00",
    message: "We advise Nordic retailers on analytics and often get asked which platform to buy. We'd like to refer customers to Brightline.",
    agreements: [
      { name: "Program terms", status: "accepted", detail: "Accepted on the application" },
      { name: "Mutual NDA", status: "missing", detail: "Not on file" },
      { name: "Partner agreement", status: "after_accept", detail: "Sent automatically when you accept" },
    ],
    checks: [
      { label: "Not already a partner", status: "pass", detail: "No partner record with this name or domain" },
      { label: "Company verified", status: "pass", detail: "Domain and business registration match" },
      { label: "Region", status: "warn", detail: "EMEA is covered by Rui Costa; consider escalating" },
    ],
    status: "new",
  },
  {
    id: "APP-115", company: "Quarry Labs", website: "quarrylabs.com", hq: "Austin, TX", region: "North America · Central",
    employees: 60, founded: 2016, program: "Services", products: ["Platform"],
    applicant: { name: "Dev Malhotra", title: "Head of Partnerships", email: "dev@quarrylabs.com", phone: "+1 512 555 0172" },
    appliedAt: "2026-10-23T12:10:00",
    message: "Implementation partner for analytics platforms. We've delivered 30+ projects for logistics and retail companies.",
    agreements: [
      { name: "Program terms", status: "accepted", detail: "Accepted on the application" },
      { name: "Mutual NDA", status: "signed", detail: "Signed Oct 18, 2026" },
      { name: "Partner agreement", status: "after_accept", detail: "Sent automatically when you accept" },
    ],
    checks: [
      { label: "Not already a partner", status: "warn", detail: "Similar record: Quarry Labs Consulting (inactive since 2023)" },
      { label: "Company verified", status: "pass", detail: "Domain and business registration match" },
      { label: "Region", status: "pass", detail: "North America · Central is your region" },
    ],
    status: "new",
  },
]

export const onboardingSteps = (agreements: [number, number], docs: [number, number], tasks: [number, number], missing: (string | undefined)[]): OnboardingStep[] => [
  { label: "Agreements signed", done: agreements[0], total: agreements[1], missing: missing[0] },
  { label: "Documents uploaded", done: docs[0], total: docs[1], missing: missing[1] },
  { label: "Required tasks", done: tasks[0], total: tasks[1], missing: missing[2] },
]

export const onboarding: Onboarding[] = [
  {
    partnerId: "keystone", acceptedAt: "2026-10-14T10:00:00", eligible: false, firstDeal: false, idleDays: 6,
    steps: onboardingSteps([2, 2], [1, 2], [2, 3], [undefined, "Certificate of insurance", "Add a deal registration contact"]),
  },
  {
    partnerId: "mosaic", acceptedAt: "2026-10-22T15:30:00", eligible: false, firstDeal: false, idleDays: 6,
    steps: onboardingSteps([1, 2], [0, 2], [0, 3], ["Partner agreement (sent Oct 22)", "Tax form, Certificate of insurance", "Complete profile, Add users, Registration basics"]),
  },
  {
    partnerId: "harper", acceptedAt: "2026-10-05T09:00:00", eligible: true, firstDeal: false, idleDays: 4,
    steps: onboardingSteps([2, 2], [2, 2], [3, 3], [undefined, undefined, undefined]),
  },
]

export const opportunities: Opportunity[] = [
  {
    id: "006Q8000024HrvL", name: "Harborview Logistics – Fleet analytics", account: "Harborview Logistics", value: 210000,
    stage: "Negotiation", closeDate: "2026-11-20", owner: "Priya Nair",
    lines: [
      { partnerId: "northpeak", role: "Sourced", share: 50 },
      { partnerId: "ridgeway", role: "Reseller", share: 30 },
      { partnerId: "bluefin", role: "Technology", share: 20 },
    ],
    splitSource: "model",
    versions: [{ version: 1, at: "2026-09-30T10:00:00", by: "Attribution agent", note: "Role-based split applied when Ridgeway joined", lines: [] }],
    touches: [
      { id: "t1", at: "2026-08-04T09:00:00", partnerId: "northpeak", kind: "Registration", text: "Registered the deal (REG-1755)" },
      { id: "t2", at: "2026-08-19T14:00:00", partnerId: "northpeak", kind: "Workshop", text: "Ran the discovery workshop with the CIO and fleet team" },
      { id: "t3", at: "2026-09-30T11:00:00", partnerId: "ridgeway", kind: "Commercial", text: "Handled pricing and procurement paperwork" },
      { id: "t4", at: "2026-10-08T15:00:00", partnerId: "bluefin", kind: "Demo", text: "Integration demo with the customer's cloud team" },
      { id: "t5", at: "2026-10-21T10:00:00", partnerId: "northpeak", kind: "Meeting", text: "Executive alignment meeting; built the rollout plan" },
      { id: "t6", at: "2026-10-24T16:00:00", partnerId: "northpeak", kind: "Proposal", text: "Wrote the implementation statement of work" },
    ],
  },
  {
    id: "006Q8000021NgtR", name: "Northgate Retail – Analytics renewal", account: "Northgate Retail", value: 64000,
    stage: "Proposal", closeDate: "2026-12-12", owner: "Alex Morgan",
    lines: [{ partnerId: "ridgeway", role: "Sourced", share: 100 }],
    splitSource: "model", versions: [],
    touches: [
      { id: "t1", at: "2026-09-12T10:00:00", partnerId: "ridgeway", kind: "Registration", text: "Registered the renewal (REG-1880)" },
      { id: "t2", at: "2026-10-02T13:00:00", partnerId: "atlas", kind: "Delivery", text: "Delivered the dashboard migration milestone" },
      { id: "t3", at: "2026-10-19T09:00:00", partnerId: "ridgeway", kind: "Meeting", text: "Renewal review with the customer's finance lead" },
    ],
  },
  {
    id: "006Q8000020BrkS", name: "Brookside Bank – Analytics", account: "Brookside Bank", value: 120000,
    stage: "Proposal", closeDate: "2026-12-30", owner: "Sam Rivera",
    lines: [
      { partnerId: "atlas", role: "Implementation", share: 44 },
      { partnerId: "clearpath", role: "Referral", share: 56 },
    ],
    splitSource: "model",
    proposal: {
      lines: [
        { partnerId: "atlas", role: "Implementation", share: 55 },
        { partnerId: "clearpath", role: "Referral", share: 45 },
      ],
      reason: "Atlas scoped and priced the whole implementation and ran both technical workshops; Clearpath made the introduction only.",
      evidence: ["Technical workshop · Oct 6", "Solution design · Oct 15"], at: "2026-10-27T17:05:00", approver: "Dana Ortiz",
    },
    versions: [],
    touches: [
      { id: "t1", at: "2026-09-02T10:00:00", partnerId: "clearpath", kind: "Referral", text: "Introduced the bank's CTO to Sam Rivera" },
      { id: "t2", at: "2026-10-06T10:00:00", partnerId: "atlas", kind: "Workshop", text: "Technical workshop" },
      { id: "t3", at: "2026-10-15T10:00:00", partnerId: "atlas", kind: "Design", text: "Solution design" },
    ],
  },
  {
    id: "006Q8000017PnhN", name: "Pinnacle Health Network – Platform rollout", account: "Pinnacle Health Network", value: 96000,
    stage: "Closed won", closeDate: "2026-10-09", owner: "Priya Nair",
    lines: [
      { partnerId: "atlas", role: "Implementation", share: 45 },
      { partnerId: "clearpath", role: "Referral", share: 55 },
    ],
    splitSource: "override",
    versions: [
      { version: 1, at: "2026-08-14T10:00:00", by: "Attribution agent", note: "Role-based split", lines: [] },
      { version: 2, at: "2026-09-03T12:00:00", by: "Dana Ortiz approved Jordan Lee's proposal", note: "Atlas ran the pilot; Implementation share raised", lines: [] },
    ],
    touches: [
      { id: "t1", at: "2026-07-20T10:00:00", partnerId: "clearpath", kind: "Referral", text: "Introduced the network's CIO" },
      { id: "t2", at: "2026-08-25T10:00:00", partnerId: "atlas", kind: "Pilot", text: "Ran the two-site pilot" },
    ],
    reconciliation: "matched", reconciliationNote: "Matches Salesforce closed-won: $96,000 on Oct 9, 2026",
  },
  {
    id: "006Q8000016CdrV", name: "Cedar Valley Schools – Platform", account: "Cedar Valley Schools", value: 45000,
    stage: "Closed won", closeDate: "2026-10-02", owner: "Alex Morgan",
    lines: [
      { partnerId: "summit", role: "Reseller", share: 55 },
      { partnerId: "clearpath", role: "Referral", share: 45 },
    ],
    splitSource: "model", versions: [],
    touches: [
      { id: "t1", at: "2026-08-02T10:00:00", partnerId: "clearpath", kind: "Referral", text: "Referred the district" },
      { id: "t2", at: "2026-09-10T10:00:00", partnerId: "summit", kind: "Commercial", text: "Ran procurement" },
    ],
    reconciliation: "mismatch", reconciliationNote: "Salesforce closed-won is $42,000; attributed value is $45,000. RevOps is resolving it.",
  },
]

export const healthSignals: HealthSignal[] = [
  {
    id: "h1", partnerId: "northpeak", trend: "rising", metric: "Sourced pipeline up 42% in 90 days",
    series: [310, 330, 360, 420, 470, 540, 610], why: "Three new energy-sector registrations since August, two already in Proposal.",
    suggestion: { title: "Plan Q1 energy accounts together", detail: "Book a 30-minute planning call while momentum is high.", value: "About $120K more pipeline", kind: "meeting" },
    draft: { subject: "Q1 planning for energy accounts", body: "Hi Hannah,\n\nYour energy deals are moving fast — three new registrations since August. Could we take 30 minutes next week to pick the Q1 accounts we go after together?\n\nThanks,\nJordan" },
    status: "open",
  },
  {
    id: "h2", partnerId: "clearpath", trend: "rising", metric: "3 registrations in the last 14 days",
    series: [40, 52, 60, 58, 90, 120, 156], why: "Referrals picked up after the healthcare webinar.",
    suggestion: { title: "Share their benefit progress", detail: "They're $12K of won revenue away from Gold.", value: "Keeps referrals coming", kind: "email" },
    draft: { subject: "You're close to Gold", body: "Hi Luis,\n\nThree new referrals in two weeks — thank you. You're $12K of won revenue away from Gold, which unlocks priority leads.\n\nBest,\nJordan" },
    status: "open",
  },
  {
    id: "h3", partnerId: "orbitwise", trend: "stalling", metric: "No new registrations in 38 days",
    series: [98, 96, 90, 84, 70, 64, 62], why: "Pipeline has been flat since September and their last deal stalled in Proposal.",
    suggestion: { title: "Book a pipeline review", detail: "A 20-minute call usually surfaces 1–2 deals they haven't registered.", value: "Recover about $60K", kind: "meeting" },
    draft: { subject: "Quick pipeline review?", body: "Hi Nadia,\n\nIt's been a few weeks since we last caught up. Could we do a 20-minute pipeline review this week? Happy to help move the Proposal-stage deal along.\n\nJordan" },
    status: "open",
  },
  {
    id: "h4", partnerId: "atlas", trend: "stalling", metric: "2 registrations outside territory this month",
    series: [150, 170, 185, 190, 196, 198, 198], why: "They're finding EMEA customers they can't register under their current territory.",
    suggestion: { title: "Send the territory guide and EMEA contact", detail: "Introduce Rui Costa so these deals aren't lost.", value: "Avoid lost registrations", kind: "email" },
    draft: { subject: "Territory guide and an EMEA contact", body: "Hi Ben,\n\nI've attached the territory guide. For EMEA customers like Meridian Freight, Rui Costa (EMEA partner manager) can help you register through the right program.\n\nJordan" },
    status: "open",
  },
  {
    id: "h5", partnerId: "summit", trend: "at_risk", metric: "Win rate fell to 18% (was 35%)",
    series: [120, 112, 101, 95, 88, 80, 74], why: "Two lost deals cited the wrong edition, and one protected deal is about to expire.",
    suggestion: { title: "Offer a Platform editions session", detail: "A short enablement call on choosing the right edition.", value: "Lift win rate", kind: "meeting" },
    draft: { subject: "Platform editions — 30-minute session", body: "Hi Tara,\n\nWould a 30-minute session on picking the right Platform edition help your team? I can run it Thursday or Friday.\n\nJordan" },
    status: "open",
  },
  {
    id: "h6", partnerId: "mosaic", trend: "at_risk", metric: "Onboarding idle for 6 days",
    series: [0, 0, 1, 1, 1, 1, 1], why: "The partner agreement sent on Oct 22 is still unsigned.",
    suggestion: { title: "Call Rhea to unblock the agreement", detail: "Owners often need a quick walkthrough of the terms.", value: "Unblocks deal registration", kind: "meeting" },
    draft: { subject: "Your partner agreement", body: "Hi Rhea,\n\nI noticed the partner agreement is still waiting for a signature. Do you have 15 minutes to go through any questions?\n\nJordan" },
    status: "open",
  },
]

export const notices: Notice[] = [
  {
    id: "n1", at: "2026-10-28T12:10:00", channel: "Slack", tone: "warn",
    title: "Acme Manufacturing, $62K, conflict found",
    body: "Half of the SLA is used. 4 business hours left to decide.", href: "/registration/REG-2041", read: false,
  },
  {
    id: "n2", at: "2026-10-28T11:30:00", channel: "Email", tone: "bad",
    title: "Kestrel Energy reached 80% of its SLA",
    body: "Dana Ortiz (channel chief) was alerted. 2.9 hours left.", href: "/registration/REG-2038", read: false,
  },
  {
    id: "n3", at: "2026-10-28T09:40:00", channel: "In-app", tone: "info",
    title: "Extension request: Granite Labs",
    body: "Northpeak asks for 30 more days of protection.", href: "/queue/extensions", read: false,
  },
  {
    id: "n4", at: "2026-10-26T15:20:00", channel: "Email", tone: "info",
    title: "New application: Lattice Networks",
    body: "Reseller program · Denver, CO", href: "/application/APP-118", read: true,
  },
]

export const activity: ActivityItem[] = [
  { id: "a1", at: "2026-10-28T10:05:00", text: "Summit Resale registered Pinecrest Bank ($24,500)", href: "/registration/REG-2033" },
  { id: "a2", at: "2026-10-28T09:10:00", text: "Clearpath Digital registered Harbor Health ($38,000)", href: "/registration/REG-2036" },
  { id: "a3", at: "2026-10-28T09:02:00", text: "Rules approved Juniper Foods for Clearpath in 38 seconds" },
  { id: "a4", at: "2026-10-28T08:40:00", text: "Rules approved Coastal Credit Union for Ridgeway in 44 seconds" },
  { id: "a5", at: "2026-10-27T17:05:00", text: "You proposed a new credit split on Brookside Bank", href: "/opportunity/006Q8000020BrkS" },
]

/* ---------- Salesforce (the only CRM at launch, decision D3) ---------- */

export const salesforce = {
  org: "brightline.my.salesforce.com",
  environment: "Production",
  admin: "Kai Brennan (CRM admin)",
  lastSync: "2026-10-28T12:08:00",
  lagSeconds: 100,
}

export interface CrmWrite {
  id: string
  at: string
  text: string
  source: string
  href?: string
  status: "synced" | "pending" | "retrying"
  attempt?: string
}

export const crmWrites: CrmWrite[] = [
  { id: "w1", at: "2026-10-28T09:02:05", text: "Created opportunity 006Q8000023JunF with Clearpath Digital as Referral", source: "Rules approved Juniper Foods", href: "/registration/REG-2040", status: "synced" },
  { id: "w2", at: "2026-10-28T08:40:58", text: "Created opportunity 006Q8000023CstC with Ridgeway IT as Reseller", source: "Rules approved Coastal Credit Union", href: "/registration/REG-2039", status: "synced" },
  { id: "w3", at: "2026-10-27T15:12:30", text: "Added Atlas Integrators as Implementation on 006Q8000022OrnL", source: "You approved Orion Labs", href: "/registration/REG-2035", status: "retrying", attempt: "Attempt 2 of 5 · next try in 3 min" },
  { id: "w4", at: "2026-10-27T10:00:00", text: "Updated partner credit on Pinnacle Health Network (version 2)", source: "Split approved by Dana Ortiz", href: "/opportunity/006Q8000017PnhN", status: "synced" },
]

export interface CrmIssue {
  id: string
  title: string
  detail: string
  owner: string
  href?: string
  tone: "warn" | "bad"
  reported?: boolean
}

export const crmIssues: CrmIssue[] = [
  {
    id: "i1", tone: "warn", title: "Orion Labs: partner role not written yet",
    detail: "Salesforce timed out. The write is queued and retried automatically, so nothing is lost. Atlas still sees the deal as approved.",
    owner: "Retrying automatically", href: "/registration/REG-2035",
  },
  {
    id: "i2", tone: "bad", title: "Cedar Valley Schools: closed-won amount differs",
    detail: "Salesforce says $42,000; attributed value is $45,000. Partner credit is on hold until it's resolved.",
    owner: "RevOps is resolving", href: "/opportunity/006Q8000016CdrV", reported: true,
  },
]

export const crmObjects = [
  { name: "Accounts", direction: "Read", use: "Conflict and duplicate checks" },
  { name: "Opportunities", direction: "Read and write", use: "Created or linked when a registration is approved" },
  { name: "Partner roles", direction: "Write", use: "Added for every partner on a deal" },
  { name: "Activities", direction: "Read", use: "Become partner touches on the deal timeline" },
  { name: "Closed-won amounts", direction: "Read", use: "Reconcile partner credit" },
]
