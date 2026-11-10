// Partner-side demo data: the four partner personas, their companies, Ridgeway's team, program terms and resources.
// Access lists mirror the PRM Knowledge Hub's permission matrix for each role.

export type PartnerRoleId = "pexec" | "rep" | "mkt" | "tech"

export interface PartnerCompany {
  id: string
  name: string
  short: string
  tier: string
  program: string
  vendor: string
  region: string
  /** The company's own admin, who invites its people. */
  admin: string
}

export interface PartnerPerson {
  role: PartnerRoleId
  companyId: string
  name: string
  first: string
  initials: string
  title: string
  email: string
  roleLabel: string
}

// Three personas work at Ridgeway IT (a Gold reseller). The technical lead works at Northpeak Consulting,
// a Platinum services partner, as in the persona document: services partners deliver the implementations.
export const companies: Record<string, PartnerCompany> = {
  ridgeway: { id: "ridgeway", name: "Ridgeway IT", short: "Ridgeway", tier: "Gold", program: "Reseller", vendor: "Brightline", region: "North America · Central", admin: "Paul Okafor" },
  northpeak: { id: "northpeak", name: "Northpeak Consulting", short: "Northpeak", tier: "Platinum", program: "Services", vendor: "Brightline", region: "North America · East", admin: "Hannah Cho" },
}

/** Ridgeway IT: the company the executive, sales rep and marketer work for. */
export const company = companies.ridgeway

export const people: Record<PartnerRoleId, PartnerPerson> = {
  pexec: { role: "pexec", companyId: "ridgeway", name: "Paul Okafor", first: "Paul", initials: "PO", title: "CEO", email: "paul@ridgewayit.com", roleLabel: "Partner executive" },
  rep: { role: "rep", companyId: "ridgeway", name: "Marcus Bell", first: "Marcus", initials: "MB", title: "Partner sales lead", email: "marcus@ridgewayit.com", roleLabel: "Partner sales rep" },
  mkt: { role: "mkt", companyId: "ridgeway", name: "Priya Raman", first: "Priya", initials: "PR", title: "Marketing manager", email: "priya@ridgewayit.com", roleLabel: "Partner marketer" },
  tech: { role: "tech", companyId: "northpeak", name: "Raj Mehta", first: "Raj", initials: "RM", title: "Solutions architect", email: "raj.mehta@northpeak.co", roleLabel: "Partner technical lead" },
}

export const partnerManager = { name: "Jordan Lee", title: "Your partner manager at Brightline", email: "jordan.lee@brightline.io", phone: "+1 312 555 0199", initials: "JL" }

/* ---------- Team (managed by the partner's admin, P1) ---------- */

export type TeamRole = "Partner executive" | "Partner sales rep" | "Partner marketer" | "Partner technical lead"
export interface TeamMember {
  id: string
  name: string
  title: string
  email: string
  role: TeamRole
  canRegister: boolean
  status: "active" | "invited" | "deactivated"
  lastActive?: string
  certified?: string
}

export const teamSeed: TeamMember[] = [
  { id: "u1", name: "Paul Okafor", title: "Partner executive", email: "paul@ridgewayit.com", role: "Partner executive", canRegister: true, status: "active", lastActive: "2026-10-28T08:00:00" },
  { id: "u2", name: "Marcus Bell", title: "Partner sales rep", email: "marcus@ridgewayit.com", role: "Partner sales rep", canRegister: true, status: "active", lastActive: "2026-10-28T11:40:00", certified: "Analytics sales" },
  { id: "u3", name: "Jenna Ruiz", title: "Partner sales rep", email: "jenna@ridgewayit.com", role: "Partner sales rep", canRegister: true, status: "active", lastActive: "2026-10-27T17:10:00" },
  { id: "u4", name: "Priya Raman", title: "Partner marketer", email: "priya@ridgewayit.com", role: "Partner marketer", canRegister: false, status: "active", lastActive: "2026-10-24T10:00:00" },
  { id: "u5", name: "Theo Grant", title: "Partner technical lead", email: "theo@ridgewayit.com", role: "Partner technical lead", canRegister: false, status: "invited" },
]

// Ridgeway's portal roles use the persona names. The partner executive is Ridgeway's admin.
export const teamRoleHelp: Record<TeamRole, string> = {
  "Partner executive": "Ridgeway's admin: sees every Ridgeway deal and credit, manages users, program and agreements",
  "Partner sales rep": "Registers deals and sees only their own deals and credit",
  "Partner marketer": "Resources and campaigns; no deals",
  "Partner technical lead": "Resources and training; can be added to deals for delivery",
}

/* ---------- Program terms (example: not yet decided) ---------- */

export const tierLadder = ["Registered", "Silver", "Gold", "Platinum"] as const

export const nextTier = {
  name: "Platinum",
  requirements: [
    { label: "Verified revenue, last 12 months", have: 318000, need: 500000, money: true },
    { label: "Certified sales reps", have: 1, need: 3 },
    { label: "Certified technical lead", have: 0, need: 1 },
    { label: "Customer satisfaction", have: 4.6, need: 4.5, unit: "/ 5" },
  ],
  unlocks: [
    "Resale discount rises from 25% to 30%",
    "Marketing development funds up to $25,000 a year",
    "First pick of Brightline's inbound leads",
    "Co-sell with Brightline account executives",
  ],
}

export const benefitsNow = [
  { name: "25% resale discount", detail: "On every Brightline product you resell", inUse: true },
  { name: "90-day deal protection", detail: "Approved registrations are yours for 90 days", inUse: true },
  { name: "Named partner manager", detail: "Jordan Lee, plus a 1-business-day reply target", inUse: true },
  { name: "Leads from Brightline", detail: "Inbound leads in your region (Stage 2)", inUse: true },
  { name: "Co-branded assets", detail: "Add your logo to approved one-pagers", inUse: false },
  { name: "MDF up to $10,000 a year", detail: "Request funds for campaigns (Stage 2)", inUse: false },
]

export interface Agreement {
  id: string
  name: string
  status: "signed" | "on_file" | "expiring"
  detail: string
}

export const agreementsSeed: Agreement[] = [
  { id: "ag1", name: "Reseller agreement", status: "signed", detail: "Signed Mar 15, 2021 · renews Mar 15, 2027" },
  { id: "ag2", name: "Mutual NDA", status: "signed", detail: "Signed Mar 2, 2021" },
  { id: "ag3", name: "Data processing addendum", status: "signed", detail: "Accepted Jan 10, 2026" },
  { id: "ag4", name: "Tax form (W-9)", status: "on_file", detail: "On file since Mar 2021" },
  { id: "ag5", name: "Certificate of insurance", status: "expiring", detail: "Expires Nov 30, 2026 · upload the renewed certificate" },
]

/* ---------- Resources and training (segmented by role, as in Impartner's asset library) ---------- */

export interface Asset {
  id: string
  title: string
  kind: "PDF" | "Deck" | "Video" | "Sheet" | "Images"
  category: string
  audience: PartnerRoleId[]
  cobrand?: boolean
  updated: string
  note?: string
}

// Segmented by role, as in Impartner's asset library: pricing for sales roles only, campaign material for the
// marketer, technical material for the technical lead.
export const assets: Asset[] = [
  { id: "as1", title: "Analytics battlecard", kind: "PDF", category: "Selling", audience: ["rep", "pexec"], updated: "2026-10-20" },
  { id: "as2", title: "2026 price list and discount guide", kind: "Sheet", category: "Pricing", audience: ["rep", "pexec"], updated: "2026-10-01", note: "Sales roles only" },
  { id: "as3", title: "Analytics one-pager", kind: "PDF", category: "Marketing", audience: ["rep", "pexec", "mkt"], cobrand: true, updated: "2026-09-12" },
  { id: "as4", title: "Hospitality customer story: Lakeshore Hotels", kind: "PDF", category: "Customer stories", audience: ["rep", "pexec", "mkt"], cobrand: true, updated: "2026-10-22" },
  { id: "as5", title: "Platform demo script (15 minutes)", kind: "Video", category: "Selling", audience: ["rep", "tech"], updated: "2026-08-30" },
  { id: "as6", title: "Partner program guide 2026", kind: "PDF", category: "Program", audience: ["pexec"], updated: "2026-01-15" },
  { id: "as7", title: "Joint business plan template", kind: "Deck", category: "Program", audience: ["pexec"], updated: "2026-02-04" },
  { id: "as8", title: "Quarterly business review deck", kind: "Deck", category: "Program", audience: ["pexec"], updated: "2026-10-03" },
  { id: "as9", title: "Brightline brand and co-branding guide", kind: "PDF", category: "Brand", audience: ["mkt", "pexec"], updated: "2026-07-01", note: "Where your logo may go" },
  { id: "as10", title: "Hospitality campaign images (12)", kind: "Images", category: "Campaigns", audience: ["mkt"], cobrand: true, updated: "2026-10-02" },
  { id: "as11", title: "Healthcare data webinar slides", kind: "Deck", category: "Campaigns", audience: ["mkt"], cobrand: true, updated: "2026-10-14" },
  { id: "as12", title: "MDF guide: what qualifies and how to claim", kind: "PDF", category: "Funds", audience: ["mkt", "pexec"], updated: "2026-01-15" },
  { id: "as13", title: "Platform implementation guide", kind: "PDF", category: "Implementation", audience: ["tech"], updated: "2026-09-20" },
  { id: "as14", title: "Reference architecture: Grid analytics", kind: "PDF", category: "Architecture", audience: ["tech"], updated: "2026-10-12" },
  { id: "as15", title: "Integration API and data connectors", kind: "PDF", category: "Implementation", audience: ["tech"], updated: "2026-10-05" },
  { id: "as16", title: "Analytics go-live checklist", kind: "Sheet", category: "Delivery", audience: ["tech"], updated: "2026-08-18" },
  { id: "as17", title: "Grid analytics deep dive (45 minutes)", kind: "Video", category: "Training", audience: ["tech"], updated: "2026-10-09" },
]

export interface Course {
  id: string
  title: string
  detail: string
  progress: number
  certifies?: string
  /** Who the course is for; sales courses by default. */
  audience?: PartnerRoleId[]
}

export const courses: Course[] = [
  { id: "c1", title: "Analytics sales certification", detail: "Positioning, discovery and pricing", progress: 100, certifies: "Analytics sales" },
  { id: "c2", title: "Platform sales certification", detail: "Needed for Platinum: 2 more certified reps", progress: 42, certifies: "Platform sales" },
  { id: "c3", title: "Registering deals in 3 taps", detail: "5-minute course", progress: 100 },
  { id: "c4", title: "Technical lead certification", detail: "For sales engineers · needed for Platinum", progress: 0, certifies: "Technical lead" },
  { id: "c5", title: "Co-marketing with Brightline", detail: "Content kits, approved claims and co-branding · 20 minutes", progress: 100, audience: ["mkt"] },
  { id: "c6", title: "Tracked links, leads and MDF claims", detail: "How campaign results reach your claim · 15 minutes", progress: 40, audience: ["mkt"] },
]

/* ---------- Access: what each role can and can't do (from the hub's matrix) ---------- */

export interface AccessLine { text: string; stage?: string; ref?: string }

export const access: Record<PartnerRoleId, { can: AccessLine[]; cannot: AccessLine[] }> = {
  pexec: {
    can: [
      { text: "Register a deal for yourself or any Ridgeway rep", stage: "1A", ref: "R-REG-1" },
      { text: "See every Ridgeway deal, its status and the real Brightline stage", stage: "1A", ref: "R-SEC-8" },
      { text: "Answer your partner manager's questions and request protection extensions on any Ridgeway deal", stage: "1A", ref: "R-SLA-7" },
      { text: "See Ridgeway's credit on every deal, reconciled to Salesforce closed-won", stage: "1B", ref: "R-CR-9" },
      { text: "Export Ridgeway's revenue and credit", stage: "1B" },
      { text: "Accept or decline leads from Brightline and assign them to a rep", stage: "Stage 2", ref: "R-LD-4" },
      { text: "Track tier progress, benefits, agreements and compliance", stage: "1B" },
      { text: "Invite, change and deactivate Ridgeway users", stage: "P1" },
      { text: "Request marketing development funds", stage: "Stage 2" },
      { text: "Dispute credit with evidence", stage: "Stage 2", ref: "R-CR-11" },
    ],
    cannot: [
      { text: "See another partner's deals, credit or commercials, even on a shared deal", ref: "R-SEC-2" },
      { text: "Change credit splits; disputes go to your partner manager", ref: "R-CR-2" },
      { text: "Decide registrations or see Brightline's own opportunities", ref: "R-SEC-3" },
    ],
  },
  rep: {
    can: [
      { text: "Register a deal in three taps: describe it or paste an email, check what AI filled in, submit", stage: "1A", ref: "R-REG-1" },
      { text: "See your own deals, their status and the real Brightline stage", stage: "1A", ref: "R-SEC-8" },
      { text: "Answer your partner manager's questions on your deals (the clock resumes)", stage: "1A", ref: "R-SLA-7" },
      { text: "Request a protection extension in one tap", stage: "1A", ref: "R-REG-9" },
      { text: "See your own credit on each deal and why", stage: "1A", ref: "R-CR-5" },
      { text: "Accept leads offered to you by name, log updates and turn them into deals", stage: "Stage 2", ref: "R-LD-4" },
      { text: "Use sales resources, including pricing, and take certifications", stage: "1B" },
      { text: "Dispute credit on your own deals with evidence", stage: "Stage 2", ref: "R-CR-11" },
    ],
    cannot: [
      { text: "See colleagues' deals or credit; your admin (Paul) sees all Ridgeway deals", ref: "R-SEC-2" },
      { text: "See another partner's deals, credit or commercials", ref: "R-CR-5" },
      { text: "Change credit splits", ref: "R-CR-2" },
      { text: "Manage users, program terms, agreements or funds", ref: "BRD persona" },
    ],
  },
  mkt: {
    can: [
      { text: "Pick a Brightline content kit and launch a campaign with your own tracked link", stage: "Stage 2", ref: "Personas" },
      { text: "Add Ridgeway's logo in the approved area and publish Brightline-approved claims, with the partnership disclosed", stage: "Stage 2", ref: "Publish content" },
      { text: "See your own campaigns' results: clicks, leads and the pipeline they produced", stage: "Stage 2", ref: "Own campaigns" },
      { text: "Hand leads from your campaigns to a Ridgeway sales rep", stage: "Stage 2", ref: "Personas" },
      { text: "Request market development funds (MDF) and file claims with proof", stage: "Stage 2", ref: "R-APR-4" },
      { text: "Use marketing assets and marketing courses", stage: "1B" },
    ],
    cannot: [
      { text: "Edit Brightline's claims or publish content Brightline hasn't approved", ref: "Publish content" },
      { text: "Approve funds; Brightline's channel chief approves every request and claim", ref: "R-APR-4" },
      { text: "See Ridgeway's deals, credit or pricing; you see only the pipeline your campaigns produced", ref: "R-SEC-2" },
      { text: "Register deals; the rep you hand a lead to registers it", ref: "BRD persona" },
      { text: "See another partner's campaigns, deals or credit", ref: "R-CR-5" },
    ],
  },
  tech: {
    can: [
      { text: "See the Northpeak deals you work on, with their joint plans", stage: "Stage 2", ref: "Own deals" },
      { text: "Log delivery milestones; each one is recorded as a touch on the Salesforce opportunity", stage: "Stage 2", ref: "Log delivery" },
      { text: "Pick up joint-plan tasks and mark them done", stage: "Stage 2", ref: "J-03" },
      { text: "Climb the skills ladder: Learned, Certified, Sell-Ready, Proven", stage: "Stage 2", ref: "R-GR-3" },
      { text: "See influenced revenue and Northpeak's credit on deals you worked", stage: "1B", ref: "R-CR-5" },
      { text: "Use technical resources: implementation guides, reference architectures and API docs", stage: "1B" },
    ],
    cannot: [
      { text: "Edit or delete a logged milestone; touches are permanent evidence", ref: "Touch" },
      { text: "Register deals or answer review questions; Hannah Cho and Northpeak's sellers do", ref: "BRD persona" },
      { text: "Change credit splits; disputes go to your partner manager", ref: "R-CR-2" },
      { text: "See another partner's share or commercials, even on a shared deal", ref: "R-CR-5" },
      { text: "See Northpeak deals you don't work on, or manage users and agreements", ref: "R-SEC-2" },
    ],
  },
}

/* ---------- Which rep should own a lead (added beyond the documents: they only cover which partner) ---------- */

/** What each Ridgeway rep is known for. Wins name real won deals in the demo data. */
export const repProfiles: Record<string, { wins: { customer: string; industry: string; product: string }[]; regions: { code: string; name: string }[] }> = {
  "Marcus Bell": {
    wins: [
      { customer: "Lakeshore Hotels", industry: "Hospitality", product: "Analytics" },
      { customer: "Union Dental Group", industry: "Healthcare", product: "Analytics" },
      { customer: "Fairway Clinics", industry: "Healthcare", product: "Platform" },
    ],
    regions: [{ code: "IL", name: "Illinois" }, { code: "OH", name: "Ohio" }, { code: "MI", name: "Michigan" }],
  },
  "Jenna Ruiz": {
    wins: [{ customer: "Brennan Logistics", industry: "Logistics", product: "Platform" }],
    regions: [{ code: "WI", name: "Wisconsin" }, { code: "MN", name: "Minnesota" }],
  },
}
