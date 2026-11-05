import type { Entity, Item } from "./types"

const e = (x: Omit<Entity, "kind">): Entity => ({ kind: "entity", ...x })

// x/y place each record on the system map (columns: source → PRM → Salesforce → reporting).
export const entities: Entity[] = [
  e({
    id: "ent-lead-vendor", title: "Lead (from Brightline)", status: "specified", stage: "2",
    summary: "An interested customer captured by the vendor's own marketing, then shared with a partner by the PAM (DR-12).",
    origins: ["Brightline website forms", "Webinars and events", "Marketing campaigns"],
    livesIn: "Salesforce / marketing", createdBy: "Marketing systems", changedBy: "PAM assigns a partner; the partner accepts or declines", readBy: "PAM; the receiving partner",
    states: ["New", "Offered (48 h)", "Accepted", "Declined / Expired → back to the PAM", "Converted to a registration"],
    crud: { pam: "Assign", pexec: "Accept", rep: "Accept · work", mkt: "—" },
    sources: [{ doc: "BRD", ref: "DR-12" }, { doc: "Proto" }], related: ["R-LD-2", "flow-pam-lead", "faq-lead"], tags: ["where does a lead come from", "lead origin", "lead source"], x: 0, y: 0,
  }),
  e({
    id: "ent-lead-partner", title: "Lead (partner-sourced)", status: "specified", stage: "2",
    summary: "A lead the partner found itself or through its own tracked links. The partner keeps it (SL-05).",
    origins: ["The partner's own selling", "Partner tracked links and landing pages (IN-01)"],
    livesIn: "PRM or Salesforce", createdBy: "Partner rep or marketer", changedBy: "That partner only", readBy: "That partner; the PAM",
    crud: { rep: "Create · update", mkt: "Create", pexec: "Read", pam: "Read" },
    sources: [{ doc: "BRD", ref: "SL-05, IN-01" }], related: ["R-LD-1"], x: 0, y: 150,
  }),
  e({
    id: "ent-registration", title: "Deal registration", status: "specified", stage: "1A",
    summary: "A partner telling the vendor \"I found this deal\", so it's checked, decided and protected.",
    origins: ["Partner rep by chat, forwarded email, API or MCP (voice and photo in Stage 2)", "AI extraction fills the fields", "An accepted lead, once the rep registers it"],
    livesIn: "PRM", createdBy: "Partner rep (or partner executive)", changedBy: "Rules or the PAM decide; the rep edits drafts and answers questions", readBy: "Rep (own), partner exec (company), PAM (assigned), channel chief, CRO",
    states: ["Draft", "Submitted", "Under review", "Info requested", "Approved", "Rejected", "Won", "Lost", "Expired"],
    crud: { rep: "Create · own", pexec: "Create · company", pam: "Decide (assigned)", chief: "Decide (escalated)", cro: "Read", ceo: "Read", ae: "Read on own accounts (open)" },
    sources: [{ doc: "BRD", ref: "DR-01–10" }, { doc: "Arch", ref: "§5" }], related: ["flow-j01", "R-STATE-1", "faq-deal"], tags: ["where does a deal come from", "deal origin"], x: 300, y: 70,
  }),
  e({
    id: "ent-opportunity", title: "Opportunity", status: "specified", stage: "1A",
    summary: "Salesforce's record of the deal. Salesforce owns stage, amount and close date; the PRM creates or links it on approval.",
    origins: ["Already in Salesforce (the vendor's sales team)", "Created or linked when a registration is approved (DR-09)"],
    livesIn: "Salesforce", createdBy: "AE / sales team, or the PRM on approval", changedBy: "Salesforce users (stage, amount)", readBy: "Per Salesforce sharing; partners see permitted fields only (PD-03)",
    crud: { ae: "Owns", pam: "Read", rep: "Read permitted fields", ceo: "Read", cro: "Read" },
    sources: [{ doc: "BRD", ref: "DR-09, PD-03" }, { doc: "Arch", ref: "§3" }], related: ["R-SEC-8", "R-REG-8"], tags: ["who owns the opportunity"], x: 600, y: 70,
  }),
  e({
    id: "ent-role", title: "Partner role on an opportunity", status: "specified", stage: "1B",
    summary: "How a partner helped on a deal: sourced, reseller, referral, implementation, technology or influenced.",
    origins: ["Set on approval", "Added by the PAM"],
    livesIn: "PRM → Salesforce", createdBy: "System on approval, or the PAM", changedBy: "PAM adds; channel chief approves overrides", readBy: "Vendor leaders; each partner sees its own",
    crud: { pam: "Add", chief: "Approve change", pexec: "Read own", rep: "Read own" },
    sources: [{ doc: "BRD", ref: "MP-01" }], related: ["R-CR-1"], x: 600, y: 220,
  }),
  e({
    id: "ent-touch", title: "Partner touch", status: "specified", stage: "1B",
    summary: "A logged partner action on a deal (meeting, demo, delivery milestone). The evidence behind credit.",
    origins: ["Partner or vendor logs it", "Deal-team membership", "Delivery milestone", "Salesforce activity"],
    livesIn: "PRM", createdBy: "Partner, vendor, or sync", changedBy: "Nobody: touches are immutable evidence", readBy: "Vendor; each partner its own",
    crud: { rep: "Create", tech: "Create", pam: "Read", revops: "Read" },
    sources: [{ doc: "Arch", ref: "§5" }, { doc: "Swim", ref: "J-02 step 1" }], x: 300, y: 300,
  }),
  e({
    id: "ent-credit", title: "Credit ledger", status: "specified", stage: "1B",
    summary: "Each partner's share of a deal's value, calculated by the Attribution agent. Append-only.",
    origins: ["Attribution agent applying the program model"],
    livesIn: "PRM", createdBy: "Attribution agent", changedBy: "Only through an approved override (new version)", readBy: "Leaders; PAM (assigned); each partner its own",
    crud: { chief: "Approve override", pam: "Propose", ceo: "Read", revops: "Read", pexec: "Read own" },
    sources: [{ doc: "BRD", ref: "MP-02–05" }, { doc: "Arch", ref: "§5" }], related: ["R-CR-8", "flow-pam-credit"], x: 900, y: 150,
  }),
  e({
    id: "ent-recon", title: "Reconciliation status", status: "specified", stage: "1B",
    summary: "Whether credited revenue matches Salesforce closed-won: matched, pending or mismatch.",
    origins: ["Closed-won amount from Salesforce"],
    livesIn: "PRM", createdBy: "System", changedBy: "RevOps resolves mismatches", readBy: "Leaders, RevOps, PAM",
    states: ["Matched", "Pending", "Mismatch"],
    crud: { revops: "Resolve", ceo: "Read", pam: "Read" },
    sources: [{ doc: "BRD", ref: "RT-03" }], related: ["R-CR-9"], x: 900, y: 300,
  }),
  e({
    id: "ent-application", title: "Partner and application", status: "specified", stage: "1A",
    summary: "A company asking to join a program, and the partner record once accepted.",
    origins: ["The partner executive applies"],
    livesIn: "PRM", createdBy: "Partner executive", changedBy: "PAM or channel chief decide", readBy: "PAM (assigned), channel chief",
    states: ["Applied", "Accepted", "Ready to register", "Activated", "Declined / Escalated"],
    crud: { pexec: "Create", pam: "Decide", chief: "Decide (escalated)" },
    sources: [{ doc: "Personas" }, { doc: "BRD", ref: "§11" }], related: ["flow-pam-onboard"], x: 0, y: 300,
  }),
  e({
    id: "ent-program", title: "Program, tiers, rules and SLAs", status: "specified", stage: "1A",
    summary: "The configuration everything else runs on, versioned and never edited in place.",
    origins: ["RevOps setup from templates"],
    livesIn: "PRM", createdBy: "RevOps", changedBy: "RevOps, with channel chief approval", readBy: "Vendor staff",
    crud: { revops: "Create · update", chief: "Approve" },
    sources: [{ doc: "Personas" }], related: ["R-APR-2"], x: 300, y: -90,
  }),
  e({
    id: "ent-value", title: "Value event", status: "specified", stage: "1B",
    summary: "\"Your action produced $X\", created only from verified outcomes.",
    origins: ["A verified outcome matched to a partner action"],
    livesIn: "PRM", createdBy: "Value engine", changedBy: "—", readBy: "The partner it belongs to; the PAM",
    crud: { rep: "Read own", pexec: "Read company", pam: "Read" },
    sources: [{ doc: "BRD", ref: "ME-01–02" }], related: ["R-GR-1"], x: 1200, y: 150,
  }),
  e({
    id: "ent-audit", title: "Agent action and audit entry", status: "specified", stage: "0",
    summary: "Every human, system and agent action, append-only.",
    origins: ["Every action in the platform"],
    livesIn: "PRM", createdBy: "System", changedBy: "Nobody", readBy: "AI supervisor (agent audit), IT",
    crud: { it: "Read · export", aisup: "Read agent audit" },
    sources: [{ doc: "Deck", ref: "Stage 0" }, { doc: "Arch", ref: "§5" }], related: ["R-SEC-6", "R-AG-5"], x: 1200, y: 300,
  }),
]

/** Edges for the system map: [from, to, label]. */
export const entityLinks: [string, string, string][] = [
  ["ent-lead-vendor", "ent-registration", "accepted → registered"],
  ["ent-lead-partner", "ent-registration", "registered"],
  ["ent-application", "ent-registration", "ready to register"],
  ["ent-program", "ent-registration", "rules & SLA"],
  ["ent-registration", "ent-opportunity", "approval creates / links"],
  ["ent-registration", "ent-role", "approval adds role"],
  ["ent-opportunity", "ent-credit", "amount"],
  ["ent-role", "ent-credit", "role weights"],
  ["ent-touch", "ent-credit", "evidence"],
  ["ent-opportunity", "ent-recon", "closed-won"],
  ["ent-credit", "ent-recon", "credited value"],
  ["ent-credit", "ent-value", "verified outcome"],
  ["ent-credit", "ent-audit", "every change logged"],
]

export const integrations: Item[] = [
  { id: "int-0", kind: "integration", stage: "0", title: "Stage 0 integrations", summary: "Salesforce (two-way), SSO (SAML/OIDC), SCIM provisioning, MCP server.", status: "confirmed", sources: [{ doc: "Deck", ref: "slide 49" }, { doc: "Deck", ref: "D3" }] },
  { id: "int-1a", kind: "integration", stage: "1A", title: "Stage 1A integrations", summary: "Email notifications.", status: "proposed", sources: [{ doc: "Deck", ref: "slide 49" }] },
  { id: "int-1b", kind: "integration", stage: "1B", title: "Stage 1B integrations", summary: "Slack and Microsoft Teams notifications with one-tap actions.", status: "proposed", sources: [{ doc: "Deck", ref: "slide 49" }] },
  { id: "int-2", kind: "integration", stage: "2", title: "Stage 2 integrations", summary: "HubSpot, Snowflake and Databricks sharing, tracked links / UTM, one cloud marketplace, payout and MDF export, Dynamics.", status: "proposed", sources: [{ doc: "Deck", ref: "slide 49" }] },
  {
    id: "int-signin", kind: "integration", title: "How each role signs in", status: "default", sources: [{ doc: "Deck", ref: "Stage 0" }, { doc: "Brief", ref: "§3" }],
    summary: "Vendor staff use company SSO, auto-provisioned by SCIM; most visits start from a Slack, Teams or email link. Partner staff are invited by their company admin and sign in with a work-email link or their own SSO. Everyone can work by chat or MCP from Stage 1A; the mobile app arrives in Stage 2.",
    tags: ["login", "sign in", "how partners log in", "how partner manager logs in", "sso"],
  },
]
