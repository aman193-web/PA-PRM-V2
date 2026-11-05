import type { Item } from "./types"

const BRD = (ref: string) => ({ doc: "BRD" as const, ref })

export const problems = [
  { problem: "The CFO discounts partner revenue numbers", cause: "PRM and CRM are separate systems, so attribution isn't credible", answer: "Every figure reconciles to Salesforce closed-won (RT-03)" },
  { problem: "Partners wait days for decisions and stop registering", cause: "Registration is manual and slow", answer: "Rules decide clean deals in 60 seconds (SL-01)" },
  { problem: "Multi-partner deals are invisible", cause: "One partner per opportunity in the data model", answer: "Many partners per opportunity, each with a role and share (MP-01)" },
  { problem: "Partners don't come back", cause: "Portals reward compliance, not revenue", answer: "Value feed and benefit progress from verified outcomes (ME-01–03)" },
  { problem: "No usable mobile experience", cause: "Desktop portals shrunk to phone size", answer: "Phone-first UX rules now; hybrid app in Stage 2" },
  { problem: "Implementation takes 6–12 months", cause: "Heavy setup and trained admins (40 hours of training)", answer: "Templates, AI field mapping, 30-day go-live target" },
  { problem: "Data sits in silos", cause: "CRM, spreadsheets, LMS and finance disconnected", answer: "Sits on top of Salesforce as the system of record" },
]

export const shifts = [
  { before: "Built as portals before AI, so adoption stays low", after: "Work happens in chat, the CRM and any AI assistant through MCP; the portal is optional" },
  { before: "One partner per deal", after: "Many partners per opportunity, each with a role and a credit share" },
  { before: "Heavy setup and admin", after: "Templates, AI field mapping, chat-based admin, 30-day go-live target" },
  { before: "AI added as an assistant", after: "Agents do the work (decisions, SLAs, attribution); people approve money and exceptions" },
  { before: "A second system competing with the CRM", after: "Uses the CRM's partner objects; the CRM stays the system of record" },
]

export const asks = [
  { role: "CEO", ask: "A measurable channel", measure: "Sourced and influenced revenue on one board slide" },
  { role: "CRO", ask: "More pipeline, fewer conflicts", measure: "Win rate and cycle time, monthly" },
  { role: "COO", ask: "Fewer manual touches", measure: "Enforced SLAs" },
  { role: "CIO / IT", ask: "No new silo or tech debt", measure: "SOC 2; live in 30 days" },
  { role: "CFO", ask: "An auditable attribution ledger", measure: "Reconciliation to closed-won" },
]

export const objections = [
  { says: "Partners are a small share of revenue. Why invest?", who: "CEO", answer: "The day-10 attribution report shows real partner influence on the customer's own data." },
  { says: "PRMs never show ROI / Attribution is opinion", who: "CFO", answer: "Every figure reconciles to Salesforce closed-won with a visible status; the ledger is versioned and approved." },
  { says: "My reps won't use another tool", who: "CRO", answer: "Work happens in Salesforce, Slack/Teams, chat and MCP. The portal is optional." },
  { says: "Partners will fight over credit", who: "CRO", answer: "Role-based splits, versioned overrides, evidence-backed disputes; each partner sees only its own share." },
  { says: "This adds process", who: "COO", answer: "Clean deals are decided in 60 seconds with no human; only exceptions reach people." },
  { says: "Another silo / it'll take a year", who: "CIO", answer: "Sits on Salesforce as the system of record; 30-day go-live target with templates and AI mapping." },
  { says: "AI touching deal data is a risk", who: "CISO", answer: "Agents inherit user permissions and fail closed; money, access and export are always human; full audit; kill switch." },
  { says: "We already own a PRM / we'll use our CRM's partner suite", who: "Channel chief", answer: "They give one partner per deal and portal-first workflows; we add multi-partner credit, a 60-second deal desk and agents on top of Salesforce." },
  { says: "Another portal to log into", who: "Partners", answer: "Register by chat, email or API; nudges and the value feed come to them." },
]

export const competitorCaps = [
  { cap: "Multi-partner credit reconciled to CRM", impartner: "Partial", zinfi: "Not evident", mindmatrix: "Not evident", salesforce: "Partial", partnerstack: "Partial", us: "Yes · 1B" },
  { cap: "Deal registrations decided automatically", impartner: "Partial", zinfi: "Partial", mindmatrix: "Not evident", salesforce: "Partial", partnerstack: "Not evident", us: "Yes · 1A" },
  { cap: "Partner motivation (value feed, tiers, rewards)", impartner: "Partial", zinfi: "Partial", mindmatrix: "Not evident", salesforce: "Partial", partnerstack: "Partial", us: "Feed 1B · rest 2" },
  { cap: "Co-sell partner matching", impartner: "Partial", zinfi: "Yes", mindmatrix: "Partial", salesforce: "Partial", partnerstack: "Not evident", us: "Stage 2" },
  { cap: "Partner marketing and MDF", impartner: "Yes", zinfi: "Yes", mindmatrix: "Yes", salesforce: "Yes", partnerstack: "Partial", us: "Stage 2" },
  { cap: "Open APIs and MCP for any AI assistant", impartner: "Not evident", zinfi: "Not evident", mindmatrix: "Not evident", salesforce: "Not evident", partnerstack: "Not evident", us: "Yes · Stage 0" },
]

export const impartnerNotes = [
  "Orchestration Studio: flows and a connector catalogue (DocuSign, Docebo, AWS, Claude and more).",
  "Analytics dashboards: email engagement, partner adoption, pipeline, applicants, asset engagement.",
  "Admin areas for applicants, accounts, users and agreements; administrator roles where the \"CAM\" role is limited to one tab.",
  "Partner portal: journeys with phases and due dates, program compliance tiers (Member → Preferred → Premier → Elite), trainings with quizzes, rewards claims, asset library with co-branding, and the Aimi assistant.",
]

export const gapsVsImpartner = [
  { item: "Deals & leads pipeline", state: "Built in the PAM prototype" },
  { item: "Full partner profile", state: "Built in the PAM prototype" },
  { item: "Tier and program compliance", state: "Not yet designed" },
  { item: "Reports and analytics for the PAM's partners", state: "Not yet designed" },
  { item: "Agreements and documents", state: "Not yet designed" },
  { item: "MDF, rewards and claims approvals", state: "Stage 2" },
  { item: "Training and enablement tracking", state: "Stage 2" },
  { item: "Joint business planning", state: "Stage 2" },
]

/** Searchable value items (the tables above are shown on the Why us page). */
export const valueItems: Item[] = [
  { id: "value-problems", kind: "value", title: "Problems we solve", summary: problems.map((p) => p.problem).join(" · "), status: "specified", sources: [BRD("§2–3")], points: problems.map((p) => `${p.problem} → ${p.answer}`), tags: ["pain points", "why", "problem"] },
  { id: "value-shifts", kind: "value", title: "How we're built differently", summary: "Incumbents were built before AI; we build around it.", status: "proposed", sources: [{ doc: "Deck", ref: "slide 15" }], points: shifts.map((s) => `${s.before} → ${s.after}`), tags: ["differentiators", "better than", "competitive"] },
  { id: "value-asks", kind: "value", title: "What executives ask for", summary: asks.map((a) => `${a.role}: ${a.ask}`).join(" · "), status: "specified", sources: [BRD("§2")] },
  { id: "value-objections", kind: "value", title: "Objections and answers", summary: "Likely buyer objections (from the BRD) with our answers. These are expected objections, not research.", status: "specified", sources: [BRD("§16")], points: objections.map((o) => `"${o.says}" → ${o.answer}`), tags: ["objection", "client pushback", "why not"] },
  { id: "value-promise", kind: "value", title: "The 60/60 promise", summary: "Clean deals decided in 60 seconds; new leads contacted in 60 seconds (lead contact is P1, Stage 2).", status: "specified", sources: [BRD("SL-01, SL-04")], related: ["R-REG-13", "R-LD-5"], tags: ["60 seconds", "headline promise"] },
  { id: "value-competitors", kind: "competitor", title: "Competitor comparison", summary: "Impartner, ZINFI, Mindmatrix, Salesforce Partner Cloud and PartnerStack compared on six capabilities; none leads with proving partner revenue.", status: "proposed", sources: [{ doc: "Deck", ref: "slides 13–14" }, { doc: "Impartner", ref: "demo 27 Oct" }], tags: ["impartner", "zinfi", "salesforce prm", "partnerstack", "mindmatrix", "competitor"] },
  { id: "value-roi", kind: "value", title: "ROI figures are illustrative", summary: "The BRD's $20M baseline, 5% lift and 5.9x ROI are planning assumptions, not promises.", status: "assumption", sources: [BRD("§4")], tags: ["roi", "business case"] },
]
