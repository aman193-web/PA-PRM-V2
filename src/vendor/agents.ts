// AI supervisor (Lee Park): the nine agents in the BRD, what each may do per action, their activity and cost.
// Autonomy levels A0–A4 and the always-a-person limits come from R-AG-1 to R-AG-5 in the PRM Knowledge Hub.
// The Deal Desk, SLA, Attribution and Growth Coach agents use the same ids as the channel chief's portal.
import type { ActivityItem } from "@/data/model"

export type Level = "A0" | "A1" | "A2" | "A3" | "A4"
export const levels: Level[] = ["A0", "A1", "A2", "A3", "A4"]
export const levelIndex = (l: string) => levels.indexOf(l as Level)

export interface AgentAction {
  id: string
  label: string
  level: Level
  /** The highest level this action may ever reach. */
  cap: Level
  /** Why the cap is where it is. */
  capWhy?: string
  /** Agents never do this, at any level. */
  never?: boolean
}

export interface AgentInfo {
  id: string
  name: string
  stage: string
  job: string
  /** The action whose level the channel chief sees as the agent's level. */
  headline: string
  actions: AgentAction[]
  /** Last 30 days. `rate` is the share people accepted, labelled by `rateLabel`. */
  month: { actions: number; rate?: number; rateLabel?: string; overrides: number; overrideLabel?: string; cost: number }
  model: string
  prompt: string
}

const ALWAYS = "Always a person (R-AG-2)"

export const agentRoster: AgentInfo[] = [
  {
    id: "deal-desk", name: "Deal Desk agent", stage: "1A", job: "Prefills and checks registrations, and recommends a decision", headline: "decide",
    actions: [
      { id: "prefill", label: "Prefill the deal form from the partner's words", level: "A4", cap: "A4" },
      { id: "checks", label: "Run eligibility, duplicate and conflict checks", level: "A4", cap: "A4" },
      { id: "decide", label: "Approve clean deals under $25,000", level: "A3", cap: "A4" },
      { id: "recommend", label: "Recommend on exceptions", level: "A1", cap: "A1", capWhy: "Exceptions always go to a person; the agent only recommends (BRD §10)" },
    ],
    month: { actions: 1284, rate: 0.978, rateLabel: "agreed with by partner managers", overrides: 9, cost: 412 },
    model: "Large model", prompt: "deal-desk v14",
  },
  {
    id: "sla", name: "SLA agent", stage: "1A", job: "Watches review deadlines, nudges at 50% and escalates at 80%", headline: "remind",
    actions: [
      { id: "remind", label: "Remind the reviewer at 50% of the deadline", level: "A4", cap: "A4" },
      { id: "alert", label: "Alert the channel chief at 80%", level: "A4", cap: "A4" },
      { id: "reassign", label: "Hand the deal to a backup reviewer at 100%", level: "A4", cap: "A4" },
    ],
    month: { actions: 2960, overrides: 0, cost: 38 },
    model: "Rules and a small model", prompt: "sla v6",
  },
  {
    id: "attribution", name: "Attribution agent", stage: "1B", job: "Links touches to deals and calculates credit with the program model", headline: "split",
    actions: [
      { id: "link", label: "Link partner touches to opportunities", level: "A4", cap: "A4" },
      { id: "split", label: "Calculate credit splits with the program model", level: "A2", cap: "A3", capWhy: `Credit is money. ${ALWAYS}` },
    ],
    month: { actions: 342, rate: 0.962, rateLabel: "kept without an override", overrides: 4, cost: 96 },
    model: "Large model", prompt: "attribution v9",
  },
  {
    id: "insights", name: "Insights agent", stage: "1B", job: "Answers ask-bar questions over the data the asker may see", headline: "answer",
    actions: [
      { id: "answer", label: "Answer questions over data the asker may see", level: "A4", cap: "A4" },
      { id: "export", label: "Export data", level: "A0", cap: "A0", never: true, capWhy: "Agents never export data. People export the views they may see (R-AG-2)" },
    ],
    month: { actions: 1870, rate: 0.91, rateLabel: "rated helpful", overrides: 0, cost: 388 },
    model: "Large model", prompt: "insights v11",
  },
  {
    id: "data-steward", name: "Data Steward agent", stage: "1B", job: "Flags duplicate accounts, failed writes and mismatches, and suggests fixes", headline: "suggest",
    actions: [
      { id: "flag", label: "Flag duplicates, mismatches and failed writes", level: "A4", cap: "A4" },
      { id: "suggest", label: "Suggest fixes and field mappings", level: "A1", cap: "A2", capWhy: "RevOps approves every data fix and IT every field mapping" },
      { id: "merge", label: "Merge Salesforce records", level: "A0", cap: "A0", never: true, capWhy: "The CRM admin merges records inside Salesforce" },
    ],
    month: { actions: 214, rate: 0.88, rateLabel: "suggestions accepted", overrides: 6, overrideLabel: "turned down", cost: 74 },
    model: "Small model", prompt: "data-steward v5",
  },
  {
    id: "growth", name: "Growth Coach", stage: "2", job: "Suggests each partner's next actions, ranked by expected value", headline: "suggest",
    actions: [
      { id: "suggest", label: "Suggest next actions for the partner manager", level: "A1", cap: "A4" },
      { id: "demote", label: "Suggest a tier demotion", level: "A1", cap: "A3", capWhy: `Tier demotion. ${ALWAYS}` },
    ],
    month: { actions: 520, rate: 0.34, rateLabel: "acted on", overrides: 3, overrideLabel: "dismissed with a reason", cost: 61 },
    model: "Large model", prompt: "growth v3",
  },
  {
    id: "cosell", name: "Co-sell agent", stage: "2", job: "Ranks partners for a seller's account and drafts the intro", headline: "draft",
    actions: [
      { id: "rank", label: "Rank partners for an account, with reasons", level: "A4", cap: "A4" },
      { id: "draft", label: "Draft the intro to the partner", level: "A2", cap: "A2", capWhy: "The seller always sends (R-CS-3)" },
    ],
    month: { actions: 46, rate: 0.37, rateLabel: "sent as drafted", overrides: 29, overrideLabel: "edited before sending", cost: 22 },
    model: "Large model", prompt: "cosell v4",
  },
  {
    id: "onboarding", name: "Onboarding agent", stage: "2", job: "Plans onboarding, checks documents and sends reminders", headline: "documents",
    actions: [
      { id: "remind", label: "Send onboarding reminders", level: "A4", cap: "A4" },
      { id: "documents", label: "Check uploaded documents", level: "A3", cap: "A4" },
      { id: "activate", label: "Activate partner users", level: "A2", cap: "A3", capWhy: `Access. ${ALWAYS}` },
    ],
    month: { actions: 310, rate: 0.99, rateLabel: "accepted", overrides: 2, cost: 29 },
    model: "Small model", prompt: "onboarding v7",
  },
  {
    id: "program", name: "Program agent", stage: "2", job: "Checks campaigns and funds claims, and spots anomalies", headline: "claims",
    actions: [
      { id: "claims", label: "Flag unapproved claims in partner content", level: "A3", cap: "A4" },
      { id: "mdf", label: "Check funds claims against results", level: "A1", cap: "A3", capWhy: `Money. ${ALWAYS}` },
    ],
    month: { actions: 88, rate: 0.92, rateLabel: "accepted", overrides: 3, cost: 31 },
    model: "Large model", prompt: "program v2",
  },
]

export const actionKey = (agent: string, action: string) => `${agent}.${action}`

/** AI models IT has approved for Brightline (the provider is a data processor in the security package). Costs are example figures. */
export interface ModelOption { id: string; name: string; tier: string; costPerAction: number; goodFor: string }
export const modelCatalog: ModelOption[] = [
  { id: "haiku", name: "Claude Haiku 5.5", tier: "Fast", costPerAction: 0.02, goodFor: "Simple, high-volume work: reminders, checks, flags" },
  { id: "sonnet", name: "Claude Sonnet 5.5", tier: "Balanced", costPerAction: 0.2, goodFor: "Judgement: deal advice, credit splits, answering questions" },
  { id: "opus", name: "Claude Opus 5.5", tier: "Most capable", costPerAction: 0.6, goodFor: "The hardest reasoning, at the highest cost" },
]
export const modelProvider = { name: "Anthropic", approvedBy: "Kai Brennan (IT)", approvedAt: "2026-09-04", dataUse: "Brightline data isn't used to train models. Prompts and answers are logged (R-AG-5)." }
export const modelName = (id: string) => modelCatalog.find((m) => m.id === id)?.name ?? id
/** The model each agent shipped with. "Large" agents use the balanced model, "small" ones the fast model. */
export const initialAgentModels: Record<string, string> = Object.fromEntries(agentRoster.map((a) => [a.id, a.model.startsWith("Large") ? "sonnet" : "haiku"]))
/** Rough monthly cost if an agent ran on another model: its actual cost scaled by the price difference. */
export const estimateCost = (agentId: string, modelId: string) => {
  const a = agentRoster.find((x) => x.id === agentId)!
  const base = modelCatalog.find((m) => m.id === initialAgentModels[agentId])!.costPerAction
  const next = modelCatalog.find((m) => m.id === modelId)!.costPerAction
  return Math.round(a.month.cost * (next / base))
}
export const initialActionLevels: Record<string, Level> = Object.fromEntries(agentRoster.flatMap((a) => a.actions.map((x) => [actionKey(a.id, x.id), x.level])))
export const initialAgentLevels: Record<string, Level> = Object.fromEntries(agentRoster.map((a) => [a.id, a.actions.find((x) => x.id === a.headline)!.level]))

/** AI cost for Brightline, by month (example figures). October is to date. */
export const costByMonth = [
  { month: "Jul", cost: 640 },
  { month: "Aug", cost: 780 },
  { month: "Sep", cost: 950 },
  { month: "Oct", cost: agentRoster.reduce((n, a) => n + a.month.cost, 0), toDate: true },
]
export const monthlyBudget = 1500

/** One agent action in the agent audit (R-AG-5). `ref` ties it to the registration or exception it was about. */
export interface AgentLogEntry {
  id: string
  at: string
  agent: string
  action: string
  text: string
  target: string
  ref?: string
  /** alone: acted within its autonomy · waiting: a person hasn't decided · agreed / overridden / edited: what the person did. */
  outcome: "alone" | "waiting" | "agreed" | "overridden" | "edited"
  who?: string
  detail?: string
  confidence: number
  cost: number
  evidence: string[]
  reviewed?: boolean
}

export const agentLogSeed: AgentLogEntry[] = [
  { id: "AL-901", at: "2026-10-28T10:20:00", agent: "sla", action: "alert", text: "Alerted Dana Ortiz at 80% of the review deadline", target: "Kestrel Energy", ref: "REG-2038-sla", outcome: "alone", confidence: 1, cost: 0.01, evidence: ["13.1 of 16 business hours used", "The Services program gives reviewers 16 hours"] },
  { id: "AL-900", at: "2026-10-28T09:40:00", agent: "data-steward", action: "flag", text: "Flagged two Salesforce accounts as one company", target: "Acme Manufacturing", ref: "EX-43", outcome: "waiting", who: "Ana Costa", confidence: 0.89, cost: 0.04, evidence: ["Same web domain: acme-mfg.com", "Same street address, written two ways", "The second record came from a web form and was never worked"] },
  { id: "AL-899", at: "2026-10-28T08:40:54", agent: "deal-desk", action: "checks", text: "Prefilled 9 fields and passed every check; the rules approved it in 44 seconds", target: "Coastal Credit Union", outcome: "alone", confidence: 0.96, cost: 0.21, evidence: ["No conflicts in Salesforce or other registrations", "$32,500 is under the $50,000 limit", "Ridgeway's partner quality is 0.91"] },
  { id: "AL-898", at: "2026-10-28T08:10:30", agent: "deal-desk", action: "recommend", text: "Recommended approving and linking to Sam Rivera's opportunity", target: "Acme Manufacturing", ref: "REG-2041", outcome: "waiting", who: "Jordan Lee", confidence: 0.82, cost: 0.34, evidence: ["Ridgeway met Elena Ruiz on Oct 2, two weeks before Sam's opportunity was created", "Sam's opportunity has no partner on it yet, so no other partner loses credit"] },
  { id: "AL-897", at: "2026-10-28T07:55:00", agent: "deal-desk", action: "recommend", text: "Recommended rejecting as a duplicate: Bluefin Cloud registered it first", target: "Harbor Health", ref: "REG-2036", outcome: "waiting", who: "Jordan Lee", confidence: 0.91, cost: 0.29, evidence: ["Bluefin Cloud's approved registration covers the same account and product", "Its protection runs to Jan 21, 2027"] },
  { id: "AL-888", at: "2026-10-27T10:21:00", agent: "deal-desk", action: "recommend", text: "Recommended approving: clean, only held back by size", target: "Kestrel Energy", ref: "REG-2038", outcome: "waiting", who: "Jordan Lee", confidence: 0.94, cost: 0.31, evidence: ["No conflicts in Salesforce or other registrations", "Every field filled with high confidence (0.96 average)"] },
  { id: "AL-887", at: "2026-10-26T15:30:00", agent: "deal-desk", action: "recommend", text: "Recommended asking Summit to confirm the edition and close date", target: "Pinecrest Bank", ref: "REG-2033", outcome: "waiting", who: "Jordan Lee", confidence: 0.76, cost: 0.26, evidence: ["The edition was guessed from \"the platform\" (confidence 0.58)"] },
  { id: "AL-886", at: "2026-10-26T11:05:00", agent: "deal-desk", action: "recommend", text: "Recommended rejecting: outside Atlas's territory", target: "Meridian Freight", ref: "REG-2030", outcome: "waiting", who: "Jordan Lee", confidence: 0.88, cost: 0.28, evidence: ["Meridian Freight B.V. is owned by the EMEA team in Salesforce", "Atlas is authorised for North America · West only"] },
  { id: "AL-896", at: "2026-10-27T17:05:00", agent: "attribution", action: "split", text: "Calculated a 56 / 44 split under the program model", target: "Brookside Bank", outcome: "overridden", who: "Jordan Lee", detail: "Jordan proposed a different split: Atlas did the solution design. It's with Dana Ortiz for approval.", confidence: 0.82, cost: 0.12, evidence: ["Clearpath: Referral (weight 25)", "Atlas: Implementation (weight 20)"] },
  { id: "AL-895", at: "2026-10-05T15:38:00", agent: "deal-desk", action: "recommend", text: "Recommended approving", target: "Metro Transit Authority", ref: "REG-1955", outcome: "overridden", who: "Jordan Lee", detail: "Rejected: Brightline's public-sector team has worked Metro Transit directly since the summer.", confidence: 0.71, cost: 0.31, evidence: ["No partner registration conflicts found", "$35,000 is within Ridgeway's usual deal size"] },
  { id: "AL-894", at: "2026-10-27T09:30:00", agent: "deal-desk", action: "recommend", text: "Recommended asking for the decision maker's name", target: "Solace Retail", ref: "REG-2027", outcome: "agreed", who: "Jordan Lee", confidence: 0.8, cost: 0.27, evidence: ["The registration names no buyer", "The close date is 11 weeks away"] },
  { id: "AL-893", at: "2026-10-26T16:00:00", agent: "growth", action: "suggest", text: "Suggested a check-in call: no activity for five weeks", target: "Orbitwise Solutions", outcome: "overridden", who: "Jordan Lee", detail: "Dismissed: Orbitwise's partner lead is on leave until November.", confidence: 0.74, cost: 0.09, evidence: ["Last registration on Sep 20", "Two open deals with protection ending in November"], reviewed: true },
  { id: "AL-892", at: "2026-10-26T12:00:00", agent: "insights", action: "answer", text: "Answered \"Is the channel worth the investment?\" for Morgan Hale", target: "Partner revenue", outcome: "alone", confidence: 0.93, cost: 0.06, evidence: ["Used verified revenue only", "Morgan may see all revenue"] },
  { id: "AL-891", at: "2026-10-25T15:00:00", agent: "program", action: "claims", text: "Flagged \"guaranteed 30% savings\" as an unapproved claim", target: "Ridgeway IT · Q4 hospitality emails", outcome: "agreed", who: "Priya Raman", confidence: 0.95, cost: 0.05, evidence: ["Not in Brightline's approved claims list"] },
  { id: "AL-890", at: "2026-10-03T07:00:00", agent: "data-steward", action: "suggest", text: "Suggested a −$3,000 ledger entry to match Salesforce", target: "Cedar Valley Schools", ref: "EX-42", outcome: "waiting", who: "Ana Costa", confidence: 0.91, cost: 0.05, evidence: ["The signed order form is $42,000", "A multi-year discount was added at signing"] },
  { id: "AL-889", at: "2026-09-20T10:00:00", agent: "cosell", action: "draft", text: "Ranked Atlas first and drafted the intro", target: "Brookside Bank", outcome: "edited", who: "Sam Rivera", confidence: 0.79, cost: 0.08, evidence: ["Atlas implemented two Platform deals this year"] },
]

export const aisupFeedSeed: ActivityItem[] = [
  { id: "ai1", at: "2026-10-28T08:10:30", text: "The Deal Desk agent recommended approving Acme Manufacturing; Jordan Lee is deciding", href: "/v/activity" },
  { id: "ai2", at: "2026-10-27T17:05:00", text: "Jordan Lee overrode the Attribution agent's split on Brookside Bank", href: "/v/activity/overrides" },
  { id: "ai3", at: "2026-10-26T11:30:00", text: "You asked Dana Ortiz to let the Deal Desk agent approve clean deals under $25,000", href: "/v/agent/deal-desk" },
  { id: "ai4", at: "2026-10-24T09:00:00", text: "The Insights agent's cost is up 41% on September: partner reps use the ask bar more", href: "/v/cost" },
]
