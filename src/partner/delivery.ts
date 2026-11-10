// Partner technical lead demo data (Raj Mehta, Northpeak Consulting). Stage 2 in the plan.
// Sources: persona doc (climb the capability ladder, log delivery milestones as touches, see influenced revenue on deals
// worked, pick up joint-plan tasks), R-GR-1 and R-GR-3 (J-04), the hand-off flow (h8: the tech lead logs a delivery touch),
// the co-sell flow (c6: joint plan with owners and dates) and Impartner's training slide (certifications expire in 1–3 years).

export type SkillLevel = "Learned" | "Certified" | "Sell-Ready" | "Proven"
export const ladder: SkillLevel[] = ["Learned", "Certified", "Sell-Ready", "Proven"]
export const ladderHelp: Record<SkillLevel, string> = {
  Learned: "Finished the course",
  Certified: "Passed the exam; renews every 2 years",
  "Sell-Ready": "Delivered a workshop, design or pilot on a real deal",
  Proven: "A deal you worked in this product closed won (automatic)",
}

export interface Skill {
  id: string
  person: string
  product: string
  level: SkillLevel
  /** Course progress while the level is Learned and the exam isn't passed. */
  course?: number
  expires?: string
  evidence: { level: SkillLevel; text: string; at: string }[]
  next: string
  /** Why it matters right now, e.g. a deal that needs it. */
  needFor?: string
}

export const skillsSeed: Skill[] = [
  {
    id: "SK-1", person: "Raj Mehta", product: "Platform", level: "Proven", expires: "2028-02-12",
    evidence: [
      { level: "Learned", text: "Platform implementation course", at: "2026-01-20" },
      { level: "Certified", text: "Platform technical certification exam (92%)", at: "2026-02-12" },
      { level: "Sell-Ready", text: "Led the Pinecrest Utilities design sign-off", at: "2026-08-04" },
      { level: "Proven", text: "Pinecrest Utilities closed won in Salesforce", at: "2026-09-25" },
    ],
    next: "Top of the ladder. Keep it current by renewing the certification before Feb 2028.",
  },
  {
    id: "SK-2", person: "Raj Mehta", product: "Analytics", level: "Sell-Ready", expires: "2028-06-03",
    evidence: [
      { level: "Learned", text: "Analytics implementation course", at: "2026-05-15" },
      { level: "Certified", text: "Analytics technical certification exam (88%)", at: "2026-06-03" },
      { level: "Sell-Ready", text: "Ran the Harborview Logistics discovery workshop", at: "2026-08-19" },
    ],
    next: "Proven happens automatically when Harborview Logistics, or another Analytics deal you work on, closes won.",
  },
  {
    id: "SK-3", person: "Raj Mehta", product: "Grid analytics", level: "Learned", course: 100,
    evidence: [{ level: "Learned", text: "Grid analytics implementation course", at: "2026-10-22" }],
    next: "Take the certification exam: 20 questions, 30 minutes, pass mark 80%.",
    needFor: "Kestrel Energy (Platform · Grid analytics) needs a certified lead for its three-plant rollout.",
  },
  {
    id: "SK-4", person: "Raj Mehta", product: "Integration API", level: "Learned", course: 30,
    evidence: [],
    next: "Finish the course (4 of 12 lessons done), then take the exam.",
  },
]

export type MilestoneKind = "Kickoff" | "Workshop" | "Design sign-off" | "Pilot / POC" | "Go-live" | "Adoption review" | "Other"
export const milestoneKinds: MilestoneKind[] = ["Kickoff", "Workshop", "Design sign-off", "Pilot / POC", "Go-live", "Adoption review", "Other"]

/** One task on a deal's joint plan, with an owner and a date (J-03). */
export interface JointTask {
  id: string
  title: string
  owner: string
  side: "Northpeak" | "Brightline" | "Customer"
  due: string
  status: "open" | "done"
  doneAt?: string
  milestone?: MilestoneKind
}

/** A Northpeak deal the technical lead is on the delivery team for. */
export interface Engagement {
  id: string
  companyId: string
  person: string
  regId?: string
  oppId?: string
  account: string
  product: string
  value: number
  myRole: string
  phase: "Pre-sales" | "Delivery" | "Live"
  brightlineAe: string
  tasks: JointTask[]
}

export const engagementsSeed: Engagement[] = [
  {
    id: "ENG-1", companyId: "northpeak", person: "Raj Mehta", regId: "REG-1755", oppId: "006Q8000024HrvL", account: "Harborview Logistics", product: "Analytics · Enterprise", value: 210000,
    myRole: "Solution architect", phase: "Pre-sales", brightlineAe: "Priya Nair",
    tasks: [
      { id: "T1", title: "Discovery workshop with the CIO and fleet team", owner: "Raj Mehta", side: "Northpeak", due: "2026-08-19", status: "done", doneAt: "2026-08-19", milestone: "Workshop" },
      { id: "T2", title: "Implementation statement of work", owner: "Raj Mehta", side: "Northpeak", due: "2026-10-24", status: "done", doneAt: "2026-10-24", milestone: "Design sign-off" },
      { id: "T3", title: "Data-source inventory with the fleet team", owner: "Raj Mehta", side: "Northpeak", due: "2026-10-30", status: "open", milestone: "Workshop" },
      { id: "T4", title: "Security review answers", owner: "Priya Nair", side: "Brightline", due: "2026-11-04", status: "open" },
      { id: "T5", title: "Pilot environment ready for the customer", owner: "Raj Mehta", side: "Northpeak", due: "2026-11-06", status: "open", milestone: "Pilot / POC" },
    ],
  },
  {
    id: "ENG-2", companyId: "northpeak", person: "Raj Mehta", regId: "REG-1912", oppId: "006Q8000019GrnL", account: "Granite Labs", product: "Platform · Enterprise", value: 88000,
    myRole: "Proof-of-concept lead", phase: "Pre-sales", brightlineAe: "Alex Morgan",
    tasks: [
      { id: "T1", title: "Proof-of-concept environment", owner: "Raj Mehta", side: "Northpeak", due: "2026-10-09", status: "done", doneAt: "2026-10-09", milestone: "Pilot / POC" },
      { id: "T2", title: "Proof-of-concept success review", owner: "Raj Mehta", side: "Northpeak", due: "2026-10-31", status: "open", milestone: "Pilot / POC" },
      { id: "T3", title: "Procurement and legal review", owner: "Granite Labs", side: "Customer", due: "2026-11-14", status: "open" },
    ],
  },
  {
    id: "ENG-3", companyId: "northpeak", person: "Raj Mehta", oppId: "006Q8000015PncU", account: "Pinecrest Utilities", product: "Platform · Enterprise", value: 150000,
    myRole: "Implementation lead", phase: "Live", brightlineAe: "Priya Nair",
    tasks: [
      { id: "T1", title: "Project kickoff", owner: "Raj Mehta", side: "Northpeak", due: "2026-07-07", status: "done", doneAt: "2026-07-07", milestone: "Kickoff" },
      { id: "T2", title: "Solution design sign-off", owner: "Raj Mehta", side: "Northpeak", due: "2026-08-04", status: "done", doneAt: "2026-08-04", milestone: "Design sign-off" },
      { id: "T3", title: "Go-live at both sites", owner: "Raj Mehta", side: "Northpeak", due: "2026-09-22", status: "done", doneAt: "2026-09-22", milestone: "Go-live" },
      { id: "T4", title: "30-day adoption review", owner: "Raj Mehta", side: "Northpeak", due: "2026-10-27", status: "open", milestone: "Adoption review" },
    ],
  },
  {
    id: "ENG-4", companyId: "northpeak", person: "Raj Mehta", regId: "REG-2038", account: "Kestrel Energy", product: "Platform · Grid analytics", value: 140000,
    myRole: "Solution architect", phase: "Pre-sales", brightlineAe: "Sam Rivera",
    tasks: [
      { id: "T1", title: "Solution design for three plants", owner: "Raj Mehta", side: "Northpeak", due: "2026-11-10", status: "open", milestone: "Design sign-off" },
      { id: "T2", title: "Site visits and data access", owner: "Kestrel Energy", side: "Customer", due: "2026-11-17", status: "open" },
    ],
  },
]

/** Northpeak's other technical people, by product. Raj's own levels are added live to roll up the company score (J-04, g3). */
export const northpeakOthers = [
  { product: "Platform", certified: 4, proven: 2 },
  { product: "Analytics", certified: 2, proven: 2 },
  { product: "Grid analytics", certified: 0, proven: 0 },
  { product: "Integration API", certified: 2, proven: 1 },
]
