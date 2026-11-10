import type { DocId, Item } from "./types"

export const sourceDocs: { id: DocId; rank: number; title: string; date: string; what: string; use: string }[] = [
  { id: "BRD", rank: 1, title: "Business Requirements (BRD)", date: "Jen · 30 Sep 2026", what: "Source of truth: vision, 12 personas, 10 UX rules, 65 requirements, agents, modules, release plan", use: "Wins when sources disagree" },
  { id: "Deck", rank: 2, title: "Planning session deck", date: "28 Oct 2026", what: "Our reading of the BRD plus decisions D1–D8 and the stage of all 83 IDs", use: "Status of each decision" },
  { id: "Personas", rank: 3, title: "User journeys by persona", date: "27 Oct 2026", what: "Our proposal: journeys, hand-offs, can / cannot per persona", use: "Permissions and journeys" },
  { id: "JPRD", rank: 4, title: "Journey PRD", date: "24 Oct 2026", what: "The BRD turned into journeys J-01 to J-05", use: "Requirement detail" },
  { id: "Swim", rank: 4, title: "Swimlane workflows", date: "24 Oct 2026", what: "Step-by-step lanes per journey; event names are design suggestions", use: "Flow steps" },
  { id: "Arch", rank: 5, title: "Architecture review", date: "24 Oct 2026 · proposed", what: "ADRs, state machines, APIs, failure handling", use: "Data ownership and failure rules" },
  { id: "PA-PRD", rank: 6, title: "PartnerAssistant headless PRD", date: "20 Sep 2026", what: "Earlier, different framing (9 roles, 7-stage lifecycle)", use: "Shown as the earlier view" },
  { id: "Brief", rank: 6, title: "Partner-side MVP brief", date: "14 Oct 2026", what: "Earlier scoping brief for a coding tool", use: "Shown as the earlier view" },
  { id: "Proto", rank: 7, title: "PRM prototype: six portals", date: "10 Nov 2026", what: "Our design: Partner manager, Channel chief, Partner executive, Partner sales rep, Partner marketer and Partner technical lead portals; values not in any document", use: "Assumptions and added standard practice" },
  { id: "Impartner", rank: 7, title: "Impartner demo and slides", date: "27–28 Oct 2026", what: "Competitor walkthrough and their partner-portal slides (application, home, journeys, leads, assets, training, analytics)", use: "Competitor reference for the partner portals" },
  { id: "TechDesign", rank: 1, title: "Technical Design", date: "Jen · 30 Sep 2026", what: "Cited by the deck and the Brief but not in any folder we have", use: "Marked \"cited, not seen\"" },
]

export const stages: Item[] = [
  ["stage-0", "Stage 0 · Foundation", "Security, SSO/SCIM, one permission engine, audit, Salesforce sync with a local mirror, one API contract generating REST, SDKs and MCP, agent guardrails.", "Design-partner data syncs end to end in the sandbox."],
  ["stage-1a", "Stage 1A · Deal desk (J-01)", "Capture, AI prefill, validation, conflict check, 60-second decisions, CRM link, protection, role-based views, onboarding and tier setup.", "Clean deals decided in 60 seconds (p95); every other registration acknowledged in 60 seconds."],
  ["stage-1b", "Stage 1B · Revenue proof (J-02)", "Multi-partner credit, reconciliation, revenue tracker, unified home, ask bar, value feed, Slack and Teams.", "First attributed revenue report (the day-10 report)."],
  ["stage-2", "Stage 2 · Growth and breadth", "Co-sell, Sell-Ready, motivation, creator model, AI lead-to-meeting, hybrid mobile app, HubSpot, MDF and other modules.", "Measured revenue lift for design partners."],
  ["stage-3", "Stage 3 · Strategic", "Partner-to-partner co-sell, licensed technographic data, experiments, EU residency.", "General availability at enterprise scale."],
].map(([id, title, summary, gate]) => ({
  id, kind: "stage" as const, title, summary, status: "proposed" as const,
  sources: [{ doc: "Deck" as const, ref: "slides 30–35" }], points: [`Exit gate: ${gate}`], tags: ["stage", "roadmap", "release plan", "when"],
}))

export const families: Item[] = [
  ["SP", "Single pane: home, drilldown, ask bar, role views", 6, "1 · 3 · 2 · 0"],
  ["DR", "Deal registration", 12, "10 · 0 · 2 · 0"],
  ["PD", "Pipeline dashboards", 6, "2 · 2 · 2 · 0"],
  ["RT", "Revenue tracker", 6, "0 · 4 · 2 · 0"],
  ["MP", "Multi-partner revenue", 7, "0 · 5 · 2 · 0"],
  ["TS", "Customer tech-stack map", 5, "0 · 0 · 4 · 1"],
  ["CS", "Co-selling", 7, "0 · 0 · 6 · 1"],
  ["SL", "The 60/60 promise", 8, "3 · 0 · 5 · 0"],
  ["SC", "Sell-Ready capability", 8, "0 · 0 · 7 · 1"],
  ["ME", "Motivation engine", 12, "0 · 3 · 8 · 1"],
  ["IN", "Creator model", 6, "0 · 0 · 6 · 0"],
].map(([code, title, total, split]) => ({
  id: `fam-${code}`, kind: "requirement" as const, title: `${code} · ${title}`,
  summary: `${total} requirements. By stage (1A · 1B · 2 · 3): ${split}.`,
  status: "proposed" as const, sources: [{ doc: "Deck" as const, ref: "slide 28" }], tags: [String(code)],
}))

export const glossary: Item[] = [
  ["Vendor", "The company running the partner program (\"Brightline\" in the prototype)."],
  ["Partner", "A company that resells, refers, implements or integrates the vendor's product."],
  ["Program", "A partner track with its own rules: Reseller, Referral, Services, Technology, Marketplace."],
  ["Tier", "The partner's level in a program."],
  ["Lead", "An interested customer not yet being worked as a deal."],
  ["Deal registration", "A partner telling the vendor \"I found this deal\", so it's recorded and protected."],
  ["Protection", "A period (for example 90 days) during which no other partner can claim the registered deal."],
  ["Auto-approved", "Approved by the rules with no human, because every check passed."],
  ["Conflict", "Someone already has this deal: an open Salesforce opportunity or another partner's registration."],
  ["SLA", "The deadline for a human to decide; reminder at 50%, escalation at 80%."],
  ["Opportunity", "The Salesforce record of a deal; Salesforce owns stage and amount."],
  ["Partner role", "How a partner helped: sourced, reseller, referral, implementation, technology, influenced."],
  ["Credit / split", "Each partner's share of a deal's value."],
  ["Sourced vs influenced", "Found the deal vs helped win it; never added together silently."],
  ["Reconciliation", "Checking credited revenue against Salesforce closed-won: matched, pending, mismatch."],
  ["Touch", "A logged partner action on a deal; the evidence for credit."],
  ["Value event", "\"Your action produced $X\", created only from verified outcomes."],
  ["MDF", "Market development funds: vendor money for partner marketing, always human-approved."],
  ["Co-sell", "A vendor seller and a partner working an account together."],
  ["Autonomy level", "A0–A4: how much an agent may do alone."],
  ["MCP", "A standard way for any AI assistant to use the PRM's features."],
  ["SSO / SCIM", "Company login, and automatic creation and removal of user accounts."],
  ["Ask bar", "A plain-English question box on every screen."],
  ["Rules version", "Each program's rules are versioned: an approved change creates the next version and the old one stays on record."],
  ["Lead source", "Where a lead came from: Brightline's website, a webinar, an event or trade show, or partner marketing."],
  ["Escalation", "Something sent up to the channel chief: a deal past 80% of its deadline, a credit override, a second extension, an unusual application, or a rule or autonomy change."],
  ["Day-10 report", "The proof-of-value attribution report on a customer's own data (Stage 1B exit)."],
].map(([term, meaning]) => ({
  id: `term-${String(term).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, kind: "term" as const, title: term, summary: meaning,
  status: "specified" as const, sources: [{ doc: "BRD" as const }, { doc: "Deck" as const }], tags: ["what is", "meaning", "define"],
}))

/** The six portals built in the prototype, kept here so the hub tracks what's been designed. */
export const portals: { persona: string; role: string; person: string; org: string; stage: string; screens: string[]; added: string[] }[] = [
  { persona: "pam", role: "Partner manager", person: "Jordan Lee", org: "Brightline", stage: "1A",
    screens: ["Home", "Review queue (decide, extensions, waiting on partner)", "Deals & leads", "Partners, applications and onboarding", "Credit splits", "Salesforce sync", "Partner health (Stage 2)", "Three journeys"],
    added: ["Second extensions shown read-only, waiting for the channel chief", "Deals past 80% tagged \"Escalated to Dana\""] },
  { persona: "chief", role: "Channel chief", person: "Dana Ortiz", org: "Brightline", stage: "1A–1B",
    screens: ["Home", "Approvals (escalated deals, credit splits, second extensions, applications, rules and AI)", "Revenue by partner", "Partner managers", "Programs and rules (per program, versioned)", "Three journeys", "Your access"],
    added: ["Move partners between partner managers (G32)", "Rule changes scoped per program (G35)"] },
  { persona: "pexec", role: "Partner executive", person: "Paul Okafor", org: "Ridgeway IT", stage: "1B",
    screens: ["Home (verified revenue, tier progress)", "Deals (every Ridgeway deal)", "Leads (accept and assign)", "Revenue and credit", "Program, benefits and agreements", "Team", "Resources", "Three journeys", "Your access"],
    added: ["AI suggests which rep should own a lead (G33)"] },
  { persona: "rep", role: "Partner sales rep", person: "Marcus Bell", org: "Ridgeway IT", stage: "1A",
    screens: ["Home", "Register a deal (three taps)", "My deals", "Leads sent to him, and leads from Ridgeway's own campaigns", "My credit", "Resources", "Three journeys", "Your access"],
    added: [] },
  { persona: "mkt", role: "Partner marketer", person: "Priya Raman", org: "Ridgeway IT", stage: "2",
    screens: ["Home (pipeline from her campaigns)", "Campaigns and campaign results", "Launch a campaign (kit, co-brand, tracked link)", "Campaign leads (hand to a rep)", "Funds (MDF requests and claims)", "Resources", "Three journeys", "Your access"],
    added: ["AI suggests which rep gets each campaign lead (G39)", "The Program agent checks her intro for unapproved claims"] },
  { persona: "tech", role: "Partner technical lead", person: "Raj Mehta", org: "Northpeak Consulting", stage: "2",
    screens: ["Home (influenced revenue)", "Deals he works on, with joint plans", "Log a milestone", "Skills ladder and company capability", "Influence and credit", "Resources", "Three journeys", "Your access"],
    added: ["Milestones logged only once a deal has an opportunity (G40)"] },
]
