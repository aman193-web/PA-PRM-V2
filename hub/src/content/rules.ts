import type { Item, Rule, RuleArea, Src, Status } from "./types"

const r = (
  id: string, area: RuleArea, title: string, summary: string, status: Status, sources: Src[],
  extra: Partial<Pick<Rule, "numbers" | "requirementIds" | "related" | "tags" | "points" | "stage">> = {},
): Rule => ({ id, kind: "rule", area, title, summary, status, sources, ...extra })

export const ruleAreas: { id: RuleArea; label: string }[] = [
  { id: "registration", label: "Deal registration" },
  { id: "sla", label: "SLA" },
  { id: "states", label: "Statuses" },
  { id: "credit", label: "Credit & attribution" },
  { id: "approvals", label: "Approvals" },
  { id: "agents", label: "AI agents" },
  { id: "security", label: "Data walls & security" },
  { id: "leads", label: "Leads" },
  { id: "cosell", label: "Co-sell" },
  { id: "growth", label: "Growth & rewards" },
  { id: "onboarding", label: "Onboarding" },
  { id: "ux", label: "UX rules" },
]

export const rules: Rule[] = [
  // ---- Registration (J-01)
  r("R-REG-1", "registration", "Register in three taps, from anywhere", "Partners register by chat, forwarded email, API or MCP in three taps or fewer. Voice and photo arrive with the mobile app in Stage 2.", "specified", [{ doc: "BRD", ref: "DR-01" }, { doc: "Deck", ref: "D4" }], { requirementIds: ["DR-01"], stage: "1A", tags: ["how to register", "capture deal"] }),
  r("R-REG-2", "registration", "AI prefills, the partner confirms", "AI fills account, contact, product, value and close date from the source. Fields it's unsure about are highlighted; the partner only confirms.", "specified", [{ doc: "BRD", ref: "DR-02" }], { requirementIds: ["DR-02"], stage: "1A" }),
  r("R-REG-3", "registration", "Automatic eligibility checks", "Every registration is checked for partner eligibility, onboarding complete, required fields, product authorisation and territory.", "specified", [{ doc: "BRD", ref: "DR-03" }], { requirementIds: ["DR-03"], stage: "1A", related: ["R-ONB-1"] }),
  r("R-REG-4", "registration", "Conflict and duplicate check", "Checked against Salesforce accounts, open opportunities and other partners' registrations, using the local Salesforce mirror.", "specified", [{ doc: "BRD", ref: "DR-04" }, { doc: "Arch", ref: "§3" }], { requirementIds: ["DR-04"], stage: "1A", tags: ["conflict", "duplicate"] }),
  r("R-REG-5", "registration", "When a deal is auto-approved", "The rules approve a deal on their own only when every check passes, there are no conflicts, the value is at or under the threshold, partner quality is at least 0.70 and AI prefill confidence is at least 0.80. Anything else goes to a named reviewer with an AI recommendation.", "specified", [{ doc: "BRD", ref: "DR-05" }, { doc: "TechDesign", ref: "§5 (cited, not seen)" }, { doc: "Deck", ref: "D7" }], { numbers: ["Partner quality ≥ 0.70", "AI confidence ≥ 0.80", "Value ≤ threshold (R-REG-6)"], requirementIds: ["DR-05"], stage: "1A", tags: ["auto approve", "auto-approved", "automatically approved", "clean deal"], related: ["R-REG-6", "R-REG-13", "faq-auto"] }),
  r("R-REG-6", "registration", "Auto-approve threshold: $50,000", "Deals up to $50,000 can be auto-approved. This is the Technical Design example, proposed as the default in D8.", "proposed", [{ doc: "Deck", ref: "D8" }, { doc: "TechDesign", ref: "cited, not seen" }], { numbers: ["$50,000"], stage: "1A", related: ["G8"] }),
  r("R-REG-7", "registration", "Reason code within one second", "Every decision returns a reason code and a plain-language explanation within 1 second.", "specified", [{ doc: "BRD", ref: "DR-08" }], { numbers: ["≤ 1 s"], requirementIds: ["DR-08"], stage: "1A" }),
  r("R-REG-8", "registration", "Approval links Salesforce", "Approval creates or links the Salesforce opportunity and adds the partner role automatically.", "specified", [{ doc: "BRD", ref: "DR-09" }], { requirementIds: ["DR-09"], stage: "1A", related: ["R-STATE-2", "ent-opportunity"] }),
  r("R-REG-9", "registration", "Protection window", "An approved deal is protected for a window, with expiry reminders and a one-tap extension request.", "specified", [{ doc: "BRD", ref: "DR-10" }], { requirementIds: ["DR-10"], stage: "1A", tags: ["protection", "expiry"] }),
  r("R-REG-10", "registration", "Protection length: 90 days", "Proposed default protection window.", "proposed", [{ doc: "Deck", ref: "D8" }], { numbers: ["90 days"], stage: "1A" }),
  r("R-REG-11", "registration", "Extensions", "One extension (30, 60 or 90 days) decided by the PAM; a second extension needs the channel chief.", "default", [{ doc: "Proto" }], { numbers: ["30 / 60 / 90 days"], stage: "1A", related: ["flow-pam-ext"] }),
  r("R-REG-12", "registration", "Expired registrations", "A partner can ask to revive an expired registration within 14 days and the PAM decides; after that the partner registers again.", "default", [{ doc: "Deck", ref: "D5 (open: who may extend)" }], { numbers: ["14 days"], related: ["G24"] }),
  r("R-REG-13", "registration", "The 60-second promise", "Rule-eligible registrations are decided in 60 seconds or less at p95. Every other registration is acknowledged within 60 seconds with the next step, the reviewer's name and the deadline.", "specified", [{ doc: "BRD", ref: "SL-01, SL-02" }], { numbers: ["≤ 60 s (p95)"], requirementIds: ["SL-01", "SL-02"], stage: "1A", tags: ["60 seconds", "60/60"] }),
  r("R-REG-14", "registration", "Acknowledge every submission", "The 60-second acknowledgement applies to all submissions, not only exceptions.", "default", [{ doc: "Arch", ref: "§2 \"exceptions\"" }, { doc: "Swim", ref: "J-01 \"all\"" }], { related: ["G11"] }),
  r("R-REG-15", "registration", "Conflict resolution workflow", "Side-by-side evidence and a suggested resolution (split, co-sell or first-in) arrive in Stage 2. In Stage 1A conflicts go to the reviewer.", "specified", [{ doc: "BRD", ref: "DR-11 (P1)" }], { requirementIds: ["DR-11"], stage: "2" }),

  // ---- SLA
  r("R-SLA-1", "sla", "SLA is configurable", "Each SLA can vary by program, tier, region and deal size, with a visible countdown for both partner and reviewer.", "specified", [{ doc: "BRD", ref: "DR-06" }], { requirementIds: ["DR-06"], stage: "1A" }),
  r("R-SLA-2", "sla", "At 50%: nudge the reviewer", "The SLA agent reminds the PAM by push, Slack or email (for example \"Acme, $62K, conflict found\").", "specified", [{ doc: "BRD", ref: "DR-07" }, { doc: "Personas" }], { numbers: ["50%"], requirementIds: ["DR-07"], stage: "1A", tags: ["50 percent", "reminder", "nudge"] }),
  r("R-SLA-3", "sla", "At 80%: escalate to the channel chief", "The deal is escalated to the reviewer's manager, the channel chief, who can decide it in one tap from the notification.", "specified", [{ doc: "BRD", ref: "DR-07" }, { doc: "Personas" }], { numbers: ["80%"], requirementIds: ["DR-07"], stage: "1A", tags: ["80 percent", "escalation"] }),
  r("R-SLA-4", "sla", "At 100%: alert and reassign, never auto-approve", "When the SLA runs out, alert the channel chief and hand the deal to a backup reviewer. Never auto-approve on a timer. DR-07 says \"auto-decision or executive alert\"; the deck suggests the alert.", "default", [{ doc: "BRD", ref: "DR-07" }, { doc: "Deck", ref: "D8" }], { numbers: ["100%"], stage: "1A", tags: ["100 percent", "sla expired", "deadline passed"], related: ["G10"] }),
  r("R-SLA-5", "sla", "Business-hours clock", "The SLA counts the reviewer region's business hours. D8 leaves business vs calendar time open.", "default", [{ doc: "Deck", ref: "D8" }], { related: ["G9"] }),
  r("R-SLA-6", "sla", "Default SLA length", "8 business hours for deals up to $100K and 16 above.", "assumption", [{ doc: "Proto" }], { numbers: ["8 business hours", "16 business hours"] }),
  r("R-SLA-7", "sla", "\"Info requested\" pauses the clock", "When the reviewer asks for more information the SLA pauses. When the partner replies it resumes from where it stopped (it doesn't reset), the checks run again, and the deal returns to Under review.", "specified", [{ doc: "TechDesign", ref: "states (cited, not seen)" }, { doc: "Deck", ref: "D5" }], { tags: ["pause sla", "restart sla", "resume", "info requested"], related: ["flow-pam-info"], points: ["Resume-from-where-it-stopped is a recommended default."] }),
  r("R-SLA-8", "sla", "Live time-to-decision counter", "A live counter per program, visible to partners and leaders.", "specified", [{ doc: "BRD", ref: "SL-03" }], { requirementIds: ["SL-03"], stage: "1A" }),
  r("R-SLA-9", "sla", "Lead acceptance window: 48 hours", "A partner has 48 hours to accept a vendor lead before it's reassigned automatically. DR-12 requires an acceptance SLA; the 48 hours is our default.", "default", [{ doc: "BRD", ref: "DR-12" }, { doc: "Proto" }], { numbers: ["48 h"], stage: "2", related: ["R-LD-2"] }),

  // ---- States
  r("R-STATE-1", "states", "One business status", "Draft → Submitted → Under review ⇄ Info requested → Approved or Rejected → Won, Lost or Expired. \"Auto-approved\" is an Approved decision made by the rules, not a separate status.", "default", [{ doc: "Deck", ref: "D5" }, { doc: "TechDesign", ref: "§5 (cited)" }], { related: ["G5", "R-STATE-2"], tags: ["statuses", "states", "lifecycle"] }),
  r("R-STATE-2", "states", "A separate Salesforce sync status", "Pending, Synced, Failed (retrying) or Exception (with RevOps). A Salesforce outage never changes a partner's approval; the write shows as pending and is never claimed as done.", "proposed", [{ doc: "Deck", ref: "D5" }, { doc: "Arch", ref: "§10" }], { tags: ["salesforce down", "outage", "sync failed"], related: ["faq-sfdown"] }),

  // ---- Credit
  r("R-CR-1", "credit", "Many partners per opportunity", "Any number of partners can be attached to one opportunity, each with a role: sourced, reseller, referral, implementation, technology, influenced.", "specified", [{ doc: "BRD", ref: "MP-01" }], { requirementIds: ["MP-01"], stage: "1B" }),
  r("R-CR-2", "credit", "Split by the program's model", "Credit is split using the program's attribution model and can be overridden only with approval.", "specified", [{ doc: "BRD", ref: "MP-02" }], { requirementIds: ["MP-02"], stage: "1B" }),
  r("R-CR-3", "credit", "Default model: role-based split", "Suggested for launch because it's the easiest to explain.", "proposed", [{ doc: "Deck", ref: "D8" }], { related: ["G14"] }),
  r("R-CR-4", "credit", "Example role weights", "Sourced 50, Reseller 30, Referral 25, Implementation 20, Technology 20, Influenced 10, scaled to 100% across the partners on a deal.", "assumption", [{ doc: "Proto" }], { numbers: ["50 / 30 / 25 / 20 / 20 / 10"] }),
  r("R-CR-5", "credit", "Each partner sees only its own credit", "A partner sees its own role, credit and permitted fields, never another partner's commercials.", "specified", [{ doc: "BRD", ref: "MP-03" }], { requirementIds: ["MP-03"], stage: "1B" }),
  r("R-CR-6", "credit", "Changes are versioned and explained", "Split changes are versioned, approved and logged; partners are told about the change and why.", "specified", [{ doc: "BRD", ref: "MP-04" }], { requirementIds: ["MP-04"], stage: "1B" }),
  r("R-CR-7", "credit", "Value counts once", "Rollups count total deal value once and partner credit per partner, so totals never double count.", "specified", [{ doc: "BRD", ref: "MP-05" }], { requirementIds: ["MP-05"], stage: "1B" }),
  r("R-CR-8", "credit", "Append-only ledger", "Total credit can't exceed the booked amount. Sourced and influenced are never summed silently. Adjustments are new entries, never edits.", "proposed", [{ doc: "Arch", ref: "§5" }]),
  r("R-CR-9", "credit", "Reconcile to closed-won", "Every revenue figure reconciles to Salesforce closed-won with a visible status: matched, pending or mismatch. RevOps resolves mismatches.", "specified", [{ doc: "BRD", ref: "RT-03" }], { requirementIds: ["RT-03"], stage: "1B", tags: ["reconciliation", "mismatch"] }),
  r("R-CR-10", "credit", "Confidence labels", "Credit is labelled Verified, Partner-reported or Inferred. Executive views show Verified only by default.", "specified", [{ doc: "BRD", ref: "§9" }]),
  r("R-CR-11", "credit", "Credit disputes", "An evidence-based dispute with an SLA and a named decision owner.", "specified", [{ doc: "BRD", ref: "MP-07 (P1)" }], { requirementIds: ["MP-07"], stage: "2" }),
  r("R-CR-12", "credit", "Currency and FX", "Currency and FX policy need Finance sign-off.", "open", [{ doc: "Arch", ref: "§13" }]),

  // ---- Approvals
  r("R-APR-1", "approvals", "Splits: PAM proposes, chief approves", "Nobody approves their own proposal.", "specified", [{ doc: "Personas" }, { doc: "Swim", ref: "J-02 step 4" }], { tags: ["who approves split"] }),
  r("R-APR-2", "approvals", "Rules: RevOps writes, chief approves", "Rules are versioned and never edited in place.", "specified", [{ doc: "Personas" }]),
  r("R-APR-3", "approvals", "Attribution model: chief proposes, CFO approves", "Past periods keep the model that was in force at the time.", "proposed", [{ doc: "Personas" }]),
  r("R-APR-4", "approvals", "Money always needs a human", "MDF, rewards, spiffs, rebates and tier changes are never automated.", "specified", [{ doc: "BRD", ref: "§10" }, { doc: "Personas" }], { tags: ["mdf", "rewards", "money"] }),
  r("R-APR-6", "approvals", "Rule changes name their programs", "Each rule change says which program(s) it covers. Approval creates a new rules version for each program and applies to every partner in it, whoever looks after them. Partner managers are told; they can't change rules.", "default", [{ doc: "Personas" }, { doc: "Proto" }], { related: ["G35", "configure-programs"] }),
  r("R-APR-5", "approvals", "Bulk export needs approval", "People can export views they're allowed to see; bulk or raw data export needs approval; agents never export.", "default", [{ doc: "BRD", ref: "RT-04, §10" }], { related: ["G16"] }),

  // ---- Security
  r("R-SEC-1", "security", "Tenant isolation", "No customer ever sees another customer's data.", "specified", [{ doc: "BRD", ref: "§14" }], { stage: "0" }),
  r("R-SEC-2", "security", "Partner data walls", "No partner sees another partner's deals, credit or commercials. Denied cross-partner access is audited.", "specified", [{ doc: "BRD", ref: "§14" }, { doc: "Swim", ref: "J-02 step 7" }], { stage: "0" }),
  r("R-SEC-3", "security", "PAM sees assigned partners in full", "Other partners show by name only.", "specified", [{ doc: "Personas" }]),
  r("R-SEC-4", "security", "One permission engine", "People, APIs and agents share one engine, checked at tenant, partner, program, deal and field level. Hiding in the UI isn't enough: the API and database enforce it.", "specified", [{ doc: "BRD", ref: "§14" }, { doc: "Arch", ref: "§4" }, { doc: "Brief", ref: "§3" }], { stage: "0" }),
  r("R-SEC-5", "security", "Sign-in", "SSO (SAML or OIDC) with SCIM provisioning and MFA for vendor staff.", "confirmed", [{ doc: "Deck", ref: "Stage 0" }], { stage: "0", tags: ["login", "sso", "sign in"] }),
  r("R-SEC-6", "security", "Append-only audit log", "Every human, system and agent action is logged.", "specified", [{ doc: "Deck", ref: "Stage 0" }], { stage: "0" }),
  r("R-SEC-7", "security", "Availability and sync", "99.9% availability; Salesforce changes reflected within 5 minutes.", "specified", [{ doc: "Deck", ref: "§14" }], { numbers: ["99.9%", "≤ 5 min"] }),
  r("R-SEC-8", "security", "Salesforce is the system of record", "Salesforce owns accounts, contacts, opportunities, stage, amount and close date. The PRM owns registrations, partner roles, attribution, motivation and program setup. The PRM's copy of Salesforce data is a cache, not a second master.", "specified", [{ doc: "Arch", ref: "§3" }, { doc: "Brief", ref: "CRM-02" }], { tags: ["system of record", "who owns"] }),

  // ---- Leads
  r("R-LD-1", "leads", "A partner's own leads stay with that partner", "The sourcing partner owns the lead.", "specified", [{ doc: "BRD", ref: "SL-05" }], { requirementIds: ["SL-05"] }),
  r("R-LD-2", "leads", "Vendor-to-partner lead sharing", "Brightline shares its own marketing leads with partners, with an acceptance SLA and automatic reassignment. P1, Stage 2.", "specified", [{ doc: "BRD", ref: "DR-12" }], { requirementIds: ["DR-12"], stage: "2", related: ["G15"] }),
  r("R-LD-3", "leads", "AI suggests the partner", "The PAM picks the partner; the AI suggests one with a reason (region, industry wins, response time).", "assumption", [{ doc: "Proto" }], { stage: "2" }),
  r("R-LD-4", "leads", "Who inside the partner accepts", "The lead goes to the partner company. The owner or admin assigns a rep, or it goes straight to a named rep when one is known.", "default", [{ doc: "Proto" }], { related: ["G26"] }),
  r("R-LD-5", "leads", "Consent before any AI contact", "AI first contact within 60 seconds only with consent, do-not-call checks, calling hours, jurisdiction rules and legal sign-off. No phone consent means email only; the AI identifies itself; opt-out stops all contact.", "specified", [{ doc: "BRD", ref: "SL-04, §7.8" }, { doc: "Arch", ref: "§8" }], { requirementIds: ["SL-04"], stage: "2", tags: ["consent", "ai calling", "do not call"] }),
  r("R-LD-7", "leads", "AI suggests the rep inside the partner", "When a lead reaches a partner, AI suggests which rep should own it and why: past wins in that industry, the product, the region they cover and their workload. The partner executive decides. Added beyond the documents.", "default", [{ doc: "Proto" }], { stage: "2", related: ["G33", "R-LD-4"] }),
  r("R-LD-6", "leads", "First contact even if the partner is slow", "If nobody accepts in time, the agent still makes first contact where lawful.", "specified", [{ doc: "BRD", ref: "SL-05" }], { stage: "2" }),

  // ---- Co-sell
  r("R-CS-1", "cosell", "Account-mapping sharing levels", "Overlap counts only, names, or full detail.", "specified", [{ doc: "BRD", ref: "CS-01" }], { requirementIds: ["CS-01"], stage: "2" }),
  r("R-CS-2", "cosell", "Partners ranked with reasons", "By product fit, certifications, past wins, account relationship and capacity.", "specified", [{ doc: "BRD", ref: "CS-03" }], { requirementIds: ["CS-03"], stage: "2" }),
  r("R-CS-3", "cosell", "The seller always sends", "The AI drafts the intro but never sends on its own.", "specified", [{ doc: "Deck", ref: "J-03" }, { doc: "Arch", ref: "§8" }], { stage: "2" }),
  r("R-CS-4", "cosell", "No account detail before acceptance", "The partner sees nothing about the account until they accept.", "specified", [{ doc: "Deck", ref: "J-03" }], { stage: "2" }),

  // ---- Growth
  r("R-GR-1", "growth", "Only verified outcomes create value", "Logins, downloads and courses earn nothing on their own. Value appears only when an action is matched to a verified outcome.", "specified", [{ doc: "Deck", ref: "J-04" }, { doc: "BRD", ref: "§8" }], { related: ["G18"] }),
  r("R-GR-2", "growth", "What arrives when", "Value feed, value engine and benefit progress (ME-01–03) in Stage 1B. Leaderboards, streaks, push, coach, badges and rewards in Stage 2.", "proposed", [{ doc: "Deck", ref: "D6" }], { requirementIds: ["ME-01", "ME-02", "ME-03"] }),
  r("R-GR-3", "growth", "Capability ladder", "Learned → Certified → Sell-Ready → Proven. Proven is automatic when a deal closes in that product.", "specified", [{ doc: "BRD", ref: "SC-01" }], { requirementIds: ["SC-01"], stage: "2" }),

  // ---- Onboarding
  r("R-ONB-1", "onboarding", "Two onboarding milestones", "Apply → Accept → agreements, documents and tasks. \"Ready to register\" once those are done (needed by DR-03), and \"Activated\" at the first registered deal.", "default", [{ doc: "Personas" }, { doc: "BRD", ref: "§11" }], { related: ["G22"], tags: ["onboarding complete", "eligible to register"] }),
  r("R-ONB-2", "onboarding", "Companies apply; the PAM accepts", "The PAM accepts, declines or escalates. Recruitment scoring and inviting new partners come in Stage 2.", "specified", [{ doc: "Personas" }, { doc: "Deck", ref: "D2" }]),
  r("R-ONB-3", "onboarding", "Every partner has one partner manager", "A new partner goes to the partner manager who accepts it, routed by region. The channel chief moves partners or assigns unowned ones; open deals, extension requests and leads move with the partner and both partner managers are told. Added beyond the documents.", "default", [{ doc: "Proto" }], { stage: "1A", related: ["G32", "assign-partners"] }),

  // ---- UX
  ...([
    ["UX-01", "Main number on first load", "The persona's main number shows with no clicks. (The \"one tap\" wording elsewhere is overridden by this stricter rule.)"],
    ["UX-02", "Three taps for any main action", "Any primary action takes three taps or fewer."],
    ["UX-03", "Plain language", "Reading grade 6 or below, no unexplained acronyms."],
    ["UX-04", "Ask bar everywhere", "A plain-English question box on every screen."],
    ["UX-05", "Phone first", "Designed for the phone first; the laptop is the expanded view."],
    ["UX-06", "Readable and reachable", "Body text 16 px or more, 44 px tap targets, WCAG 2.2 AA, dynamic type."],
    ["UX-07", "Show the value before asking", "For example \"registering protects $48K for 90 days\"."],
    ["UX-08", "Prefill everything", "The user confirms rather than types."],
    ["UX-09", "Respond in under a second", "Visible response in under 1 second."],
    ["UX-10", "No dead ends", "Every screen ends with a next best action."],
  ] as const).map(([id, title, summary]) =>
    r(id, "ux", title, summary, "specified", [{ doc: "BRD", ref: "§6" }], { tags: ["ux rule", "acceptance criteria"] }),
  ),
]

export const agents: Item[] = [
  ["deal-desk", "Deal Desk agent", "1A", "Prefills registrations, validates them, checks conflicts and decides clean deals within its autonomy level. Recommends on exceptions; never decides them."],
  ["sla-agent", "SLA agent", "1A", "Watches timers, nudges at 50% and escalates at 80%."],
  ["attribution-agent", "Attribution agent", "1B", "Links touches to opportunities and calculates sourced and influenced credit with the program model."],
  ["insights-agent", "Insights agent", "1B", "Answers ask-bar questions over the data the asker may see."],
  ["data-steward", "Data Steward agent", "1B", "Flags duplicate accounts, mapping fixes and CRM mismatches."],
  ["growth-coach", "Growth Coach agent", "2", "Ranks each partner's top three next actions by expected value."],
  ["cosell-agent", "Co-sell agent", "2", "Finds permitted account overlaps, ranks partners and drafts intros; the seller sends."],
  ["onboarding-agent", "Onboarding agent", "2", "Plans onboarding, reads documents, sends reminders."],
  ["program-agent", "Program agent", "2", "Campaigns, MDF checks and anomaly detection."],
].map(([id, title, stage, summary]) => ({
  id, kind: "agent" as const, title, summary, stage, status: "specified" as const,
  sources: [{ doc: "BRD" as const, ref: "§10" }, { doc: "Deck" as const }],
  related: ["R-AG-1", "R-AG-2"],
}))

rules.push(
  r("R-AG-1", "agents", "Autonomy levels A0–A4", "A0 observe, A1 recommend, A2 draft, A3 act with approval, A4 act alone within limits. Set per tenant, program and action. Example: the Deal Desk agent may auto-approve clean deals under the threshold (A4) but only recommend above it.", "specified", [{ doc: "BRD", ref: "§10" }, { doc: "PA-PRD", ref: "p.17" }], { stage: "0", tags: ["autonomy"] }),
  r("R-AG-2", "agents", "Always human, can't be raised", "Money, contracts, access, data export, tier demotion and partner termination always need a human. This limit can't be raised.", "specified", [{ doc: "BRD", ref: "§10" }, { doc: "Arch", ref: "§8" }], { stage: "0", tags: ["can ai move money", "agent export"] }),
  r("R-AG-3", "agents", "Kill switch", "Pause any agent, action type or the whole agent layer; takes effect within seconds.", "specified", [{ doc: "Personas" }], { stage: "0" }),
  r("R-AG-4", "agents", "Agents act as the user", "Agents get exactly the permissions of the user or service account they act for. Every tool call is re-authorised and fails closed.", "proposed", [{ doc: "Arch", ref: "§8" }], { stage: "0" }),
  r("R-AG-5", "agents", "Everything is audited", "Each agent action is logged with model, prompt version, evidence, confidence and cost. AI-drafted content is labelled until approved.", "specified", [{ doc: "BRD", ref: "§10" }], { stage: "0" }),
)
