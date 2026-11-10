// Partner marketer demo data (Priya Raman, Ridgeway IT). Stage 2 in the plan.
// Sources: persona doc (pick a vendor content kit, publish approved content with a personal tracked link, see own campaign
// results, request MDF and file claims), the hub's permission matrix (publish-content, request-mdf, approve-money) and
// Impartner's asset-library slide (co-branding in a fixed area, engagement reporting).

export interface KitPiece { kind: "Email" | "LinkedIn post" | "Landing page" | "One-pager" | "Webinar slides" | "Customer story"; title: string }

/** A Brightline-approved campaign kit. Claims are locked: partners can add their logo and a personal intro, never edit claims. */
export interface ContentKit {
  id: string
  title: string
  product: "Analytics" | "Platform"
  industry: string
  summary: string
  pieces: KitPiece[]
  claims: string[]
  approvedUntil: string
  isNew?: boolean
}

export const contentKits: ContentKit[] = [
  {
    id: "KIT-1", title: "Analytics for hospitality", product: "Analytics", industry: "Hospitality",
    summary: "Three emails, two LinkedIn posts, a landing page and the Lakeshore Hotels story.",
    pieces: [
      { kind: "Email", title: "Know tonight's occupancy before the morning meeting" },
      { kind: "Email", title: "How Lakeshore Hotels cut reporting time" },
      { kind: "Email", title: "Book a 20-minute data review" },
      { kind: "LinkedIn post", title: "One view of every property" },
      { kind: "Landing page", title: "Hospitality analytics with Ridgeway IT" },
      { kind: "Customer story", title: "Lakeshore Hotels" },
    ],
    claims: ["One dashboard across every property and booking channel", "Lakeshore Hotels moved weekly reporting from two days to two hours", "Runs on the data you already have"],
    approvedUntil: "2027-03-31",
  },
  {
    id: "KIT-2", title: "Webinar in a box: healthcare data", product: "Analytics", industry: "Healthcare",
    summary: "Invitation emails, webinar slides and a follow-up sequence for clinic groups.",
    pieces: [
      { kind: "Email", title: "Invitation: from data to decisions in clinic operations" },
      { kind: "Webinar slides", title: "Clinic operations analytics (30 minutes)" },
      { kind: "Email", title: "Follow-up: the recording and a data review" },
    ],
    claims: ["Patient-flow and staffing views out of the box", "Built for HIPAA-regulated environments"],
    approvedUntil: "2027-01-31",
  },
  {
    id: "KIT-3", title: "Platform launch: manufacturing", product: "Platform", industry: "Manufacturing",
    summary: "Launch emails, a landing page and a one-pager for the new plant-floor connectors.",
    pieces: [
      { kind: "Email", title: "Plant data, finally in one place" },
      { kind: "Landing page", title: "Platform for manufacturers with Ridgeway IT" },
      { kind: "One-pager", title: "Plant-floor connectors" },
    ],
    claims: ["Connects to 40+ plant-floor systems", "Live line performance in one view"],
    approvedUntil: "2027-06-30", isNew: true,
  },
  {
    id: "KIT-4", title: "Year-end analytics review", product: "Analytics", industry: "Any",
    summary: "A short email and LinkedIn series offering a free year-end data review.",
    pieces: [
      { kind: "Email", title: "Your year in data, in 20 minutes" },
      { kind: "LinkedIn post", title: "Three questions for your year-end review" },
    ],
    claims: ["A free 20-minute review with a certified partner"],
    approvedUntil: "2026-12-31",
  },
]

export const disclosure = "Ridgeway IT is an authorized Brightline partner."

export type CampaignStatus = "draft" | "scheduled" | "live" | "ended"

export interface Campaign {
  id: string
  companyId: string
  owner: string
  name: string
  kitId: string
  channels: string[]
  status: CampaignStatus
  start: string
  end: string
  /** The marketer's personal tracked link (IN-01). */
  link: string
  clicks: number
  /** Leads it produced before the ones still listed (already handed off and closed out). */
  earlierLeads: number
  mdfId?: string
  createdAt: string
  /** Why a draft is waiting. */
  note?: string
}

export const campaignsSeed: Campaign[] = [
  { id: "CMP-14", companyId: "ridgeway", owner: "Priya Raman", name: "Hospitality analytics: Q4 email series", kitId: "KIT-1", channels: ["Email", "LinkedIn"], status: "live", start: "2026-10-06", end: "2026-11-30", link: "go.brightline.io/r/ridgeway-priya-q4hosp", clicks: 1240, earlierLeads: 0, mdfId: "MDF-2", createdAt: "2026-10-02T10:00:00" },
  { id: "CMP-15", companyId: "ridgeway", owner: "Priya Raman", name: "Healthcare data webinar, Nov 18", kitId: "KIT-2", channels: ["Webinar", "Email"], status: "scheduled", start: "2026-11-18", end: "2026-12-05", link: "go.brightline.io/r/ridgeway-priya-hcweb", clicks: 412, earlierLeads: 0, createdAt: "2026-10-14T09:00:00" },
  { id: "CMP-16", companyId: "ridgeway", owner: "Priya Raman", name: "Platform launch: Midwest manufacturers", kitId: "KIT-3", channels: ["Email", "Landing page"], status: "draft", start: "2026-11-16", end: "2027-01-15", link: "go.brightline.io/r/ridgeway-priya-mfg", clicks: 0, earlierLeads: 0, mdfId: "MDF-3", createdAt: "2026-10-27T15:00:00", note: "Waiting for the funds decision" },
  { id: "CMP-13", companyId: "ridgeway", owner: "Priya Raman", name: "Food and beverage analytics webinar", kitId: "KIT-4", channels: ["Webinar", "Email"], status: "ended", start: "2026-07-08", end: "2026-07-22", link: "go.brightline.io/r/ridgeway-priya-fnb", clicks: 860, earlierLeads: 11, createdAt: "2026-06-25T09:00:00" },
  { id: "CMP-12", companyId: "ridgeway", owner: "Priya Raman", name: "Spring analytics roadshow", kitId: "KIT-1", channels: ["Events", "Email"], status: "ended", start: "2026-04-06", end: "2026-05-15", link: "go.brightline.io/r/ridgeway-priya-spring", clicks: 2140, earlierLeads: 14, mdfId: "MDF-1", createdAt: "2026-03-20T09:00:00" },
]

export type CampaignLeadStatus = "new" | "with_rep" | "returned" | "converted"

/** A lead from the partner's own tracked link. Ridgeway keeps it: Brightline doesn't see it until it's registered (SL-05). */
export interface CampaignLead {
  id: string
  companyId: string
  campaignId: string
  company: string
  contact: string
  title: string
  industry: string
  region: string
  product: string
  estValue: number
  receivedAt: string
  activity: string
  status: CampaignLeadStatus
  assignee?: string
  handedAt?: string
  returnReason?: string
  registrationId?: string
}

export const campaignLeadsSeed: CampaignLead[] = [
  { id: "CL-401", companyId: "ridgeway", campaignId: "CMP-14", company: "Harbor Inn Group", contact: "Olivia Grant", title: "Director of operations", industry: "Hospitality", region: "Chicago, IL", product: "Analytics", estValue: 36000, receivedAt: "2026-10-27T15:20:00", activity: "Opened all three emails and booked a data review", status: "new" },
  { id: "CL-402", companyId: "ridgeway", campaignId: "CMP-14", company: "Cobalt Resorts", contact: "Ethan Moore", title: "VP finance", industry: "Hospitality", region: "Grand Rapids, MI", product: "Analytics", estValue: 52000, receivedAt: "2026-10-28T08:45:00", activity: "Downloaded the Lakeshore Hotels story twice", status: "new" },
  { id: "CL-403", companyId: "ridgeway", campaignId: "CMP-14", company: "Lakeview Suites", contact: "Grace Kim", title: "General manager", industry: "Hospitality", region: "Milwaukee, WI", product: "Analytics", estValue: 24000, receivedAt: "2026-10-20T11:10:00", activity: "Filled in the landing-page form", status: "with_rep", assignee: "Jenna Ruiz", handedAt: "2026-10-20T14:00:00" },
]

export type MdfStatus = "submitted" | "approved" | "rejected" | "claimed" | "paid" | "claim_rejected"

/** Market development funds. Money always needs a human approval, never an agent (R-APR-4). */
export interface MdfRequest {
  id: string
  companyId: string
  campaignId?: string
  campaign: string
  activity: string
  amount: number
  expected: string
  requestedBy: string
  submittedAt: string
  status: MdfStatus
  decidedBy?: string
  decidedAt?: string
  reason?: string
  claimDue?: string
  claim?: { amount: number; at: string; proof: string[]; results: string }
  paidAt?: string
}

/** Yearly MDF allowance by tier (example program terms). */
export const mdfAllowance: Record<string, number> = { Registered: 0, Silver: 5000, Gold: 10000, Platinum: 25000 }

export const mdfSeed: MdfRequest[] = [
  { id: "MDF-3", companyId: "ridgeway", campaignId: "CMP-16", campaign: "Platform launch: Midwest manufacturers", activity: "Paid LinkedIn and an email list rental for 400 plant managers", amount: 4000, expected: "25 leads and $150,000 of pipeline", requestedBy: "Priya Raman", submittedAt: "2026-10-27T15:10:00", status: "submitted" },
  { id: "MDF-2", companyId: "ridgeway", campaignId: "CMP-14", campaign: "Hospitality analytics: Q4 email series", activity: "Email design, list cleansing and LinkedIn promotion", amount: 2500, expected: "12 leads and $100,000 of pipeline", requestedBy: "Priya Raman", submittedAt: "2026-09-25T10:00:00", status: "approved", decidedBy: "Dana Ortiz", decidedAt: "2026-09-30T09:20:00", claimDue: "2026-12-31" },
  { id: "MDF-1", companyId: "ridgeway", campaignId: "CMP-12", campaign: "Spring analytics roadshow", activity: "Three breakfast events in Chicago, Columbus and Detroit", amount: 2500, expected: "15 leads", requestedBy: "Priya Raman", submittedAt: "2026-03-18T10:00:00", status: "paid", decidedBy: "Dana Ortiz", decidedAt: "2026-03-20T11:00:00",
    claim: { amount: 2500, at: "2026-06-02T10:00:00", proof: ["Venue invoices (3)", "Attendee lists"], results: "14 leads · Lakeshore Hotels registered ($124,000)" }, paidAt: "2026-06-20T10:00:00" },
]
