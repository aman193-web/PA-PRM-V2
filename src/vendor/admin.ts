// IT / CRM admin (Kai Brennan): connected systems, field mappings, users and roles, and the audit log.
// Persona and permissions come from the PRM Knowledge Hub (Stage 0). Names and dates are illustrative.
import type { ActivityItem } from "@/data/model"

export type ConnectionKind = "crm" | "identity" | "messaging" | "partner" | "data"

export interface Connection {
  id: string
  name: string
  kind: ConnectionKind
  status: "connected" | "requested" | "declined" | "stage2"
  detail: string
  facts?: [string, string][]
  /** A connector someone asked for, waiting for IT. */
  request?: { by: string; byRole: string; at: string; why: string; scopes: string[]; notScopes: string[] }
  decided?: { by: string; at: string; note?: string }
}

export const connectionKindLabel: Record<ConnectionKind, string> = {
  crm: "CRM", identity: "Sign-in and users", messaging: "Notifications and approvals", partner: "Partner sign-in", data: "Data (Stage 2)",
}

export const connectionsSeed: Connection[] = [
  {
    id: "salesforce", name: "Salesforce", kind: "crm", status: "connected", detail: "brightline.my.salesforce.com · Production",
    facts: [["Package", "Brightline PRM 1.8, installed Sep 2"], ["Integration user", "prm-integration@brightline.io"], ["Permission set", "PRM Integration, least privilege"], ["Sandbox test", "Passed end to end on Sep 18 (Stage 0 exit gate)"]],
  },
  {
    id: "okta-sso", name: "Okta single sign-on", kind: "identity", status: "connected", detail: "SAML 2.0 for every Brightline user, with MFA",
    facts: [["Protocol", "SAML 2.0"], ["MFA", "Required for Brightline staff"], ["Admin sessions", "Re-check MFA every 12 hours"]],
  },
  {
    id: "scim", name: "Okta provisioning (SCIM)", kind: "identity", status: "connected", detail: "Creates, updates and deactivates Brightline users from Okta groups",
    facts: [["Last push", "Today at 06:00"], ["Leavers", "Signed out everywhere within a minute of deactivation"]],
  },
  {
    id: "slack", name: "Slack", kind: "messaging", status: "connected", detail: "Nudges and one-click approvals for Brightline staff",
    facts: [["Workspace", "brightline.slack.com"], ["Can", "Send messages to named people"]],
  },
  {
    id: "teams", name: "Microsoft Teams", kind: "messaging", status: "requested", detail: "Approval cards in Teams, like the Slack ones",
    request: {
      by: "Dana Ortiz", byRole: "Channel chief", at: "2026-10-27T09:15:00",
      why: "Most of the regional directors who approve escalations with me live in Teams, not Slack. I'd like approvals to reach them there.",
      scopes: ["Send approval cards to named people", "Read each person's name and work email, to match their Brightline account"],
      notScopes: ["Read chats or channel messages", "Post in channels", "See files"],
    },
  },
  {
    id: "email", name: "Email", kind: "messaging", status: "connected", detail: "Sends from partners.brightline.io",
    facts: [["Domain checks", "SPF, DKIM and DMARC pass"]],
  },
  {
    id: "partner-sign-in", name: "Partner sign-in", kind: "partner", status: "connected", detail: "Work-email sign-in links by default; a partner can bring its own SSO",
    facts: [["Ridgeway IT", "Ridgeway's own SSO"], ["Northpeak Consulting", "Northpeak's own SSO"], ["Other partners", "Work-email sign-in link"]],
  },
  { id: "hubspot", name: "HubSpot", kind: "data", status: "stage2", detail: "Marketing contacts and campaign results" },
  { id: "snowflake", name: "Snowflake", kind: "data", status: "stage2", detail: "Partner revenue for the data warehouse" },
  { id: "databricks", name: "Databricks", kind: "data", status: "stage2", detail: "Partner data for analytics" },
]

/** What the Salesforce integration user can and can't touch. Least privilege; IT scopes it at install. */
export const integrationScope = {
  can: [
    ["Accounts", "Read", "Conflict and duplicate checks"],
    ["Opportunities", "Read and write", "Created or linked when a registration is approved"],
    ["Partner roles", "Write", "Added for every partner on a deal"],
    ["Activities", "Read", "Become partner touches on the deal"],
    ["Closed-won amounts", "Read", "Reconcile partner credit"],
  ] as [string, string, string][],
  cannot: ["Delete any record", "Change an opportunity's stage, amount or close date", "Read cases, contracts or quotes", "Merge records"],
}

/** A field mapping between PRM and Salesforce. AI-suggested mappings wait for IT to approve them. */
export interface FieldMapping {
  id: string
  /** PRM field. */
  prm: string
  prmObject: string
  /** Salesforce field. */
  target: string
  direction: "Write" | "Read"
  /** Who suggested it: the Data Steward agent, or IT at install. */
  by: string
  confidence?: number
  why: string
  samples?: [string, string][]
  caution?: string
  /** A safer target the agent offers when the first one is risky. */
  alt?: { target: string; note: string }
  status: "pending" | "approved" | "rejected"
  decidedBy?: string
  decidedAt?: string
  /** The Salesforce field it was approved with, when IT picked the alternative. */
  used?: string
  note?: string
}

export const mappingsSeed: FieldMapping[] = [
  {
    id: "FM-12", prm: "Protection end date", prmObject: "Registration", target: "Opportunity.Partner_Protection_End__c (new date field)", direction: "Write",
    by: "Data Steward agent", confidence: 0.94, status: "pending",
    why: "Sellers asked to see a partner's protection inside Salesforce. Today they have to open the PRM to check it.",
    samples: [["Brookside Bank", "Dec 1, 2026"], ["Granite Labs", "Nov 3, 2026"], ["Harborview Logistics", "Nov 30, 2026"]],
  },
  {
    id: "FM-13", prm: "Campaign", prmObject: "Registration", target: "Opportunity.LeadSource", direction: "Write",
    by: "Data Steward agent", confidence: 0.68, status: "pending",
    why: "Deals that came from a partner's campaign would show the campaign in Salesforce reports.",
    samples: [["Cobalt Resorts", "Ridgeway · Q4 hospitality emails"], ["Lakeview Suites", "Ridgeway · Q4 hospitality emails"]],
    caution: "Brightline Marketing already uses LeadSource, with 14 picklist values. Writing partner campaigns there would overwrite their values.",
    alt: { target: "Opportunity.Partner_Campaign__c (new text field)", note: "Keeps Marketing's LeadSource as it is" },
  },
  {
    id: "FM-14", prm: "Partner tier", prmObject: "Partner", target: "Account.Partner_Tier__c (existing picklist)", direction: "Write",
    by: "Data Steward agent", confidence: 0.97, status: "pending",
    why: "Partner accounts in Salesforce still show the tier from the old spreadsheet. The values match exactly: Registered, Silver, Gold, Platinum.",
    samples: [["Ridgeway IT", "Gold"], ["Northpeak Consulting", "Platinum"], ["Summit Resale", "Registered"]],
  },
  { id: "FM-1", prm: "Partner role", prmObject: "Registration", target: "OpportunityPartner.Role", direction: "Write", by: "Set up at install", why: "Every partner on a deal, with its role.", status: "approved", decidedBy: "Kai Brennan", decidedAt: "2026-09-02T10:00:00" },
  { id: "FM-2", prm: "Registration ID", prmObject: "Registration", target: "Opportunity.PRM_Registration_Id__c", direction: "Write", by: "Set up at install", why: "Links each opportunity back to its registration.", status: "approved", decidedBy: "Kai Brennan", decidedAt: "2026-09-02T10:00:00" },
  { id: "FM-3", prm: "Closed-won amount", prmObject: "Opportunity", target: "Opportunity.Amount", direction: "Read", by: "Set up at install", why: "Reconciles partner credit to what Salesforce closed.", status: "approved", decidedBy: "Kai Brennan", decidedAt: "2026-09-02T10:00:00" },
  { id: "FM-4", prm: "Stage and close date", prmObject: "Opportunity", target: "Opportunity.StageName, CloseDate", direction: "Read", by: "Set up at install", why: "Partners and partner managers see the real Salesforce stage.", status: "approved", decidedBy: "Kai Brennan", decidedAt: "2026-09-02T10:00:00" },
  { id: "FM-9", prm: "Account match", prmObject: "Registration", target: "Account.Website, BillingAddress", direction: "Read", by: "Data Steward agent", confidence: 0.92, why: "Better duplicate checks when names are written differently.", status: "approved", decidedBy: "Kai Brennan", decidedAt: "2026-10-06T14:00:00" },
]

/** A Brightline user, provisioned from Okta by SCIM. */
export interface StaffUser {
  id: string
  name: string
  title: string
  role: string
  group: string
  status: "active" | "invited" | "leaving" | "deactivated"
  email?: string
  /** Okta users come from a group through SCIM; IT can also add a person directly (a contractor, or before Okta is set up). */
  source?: "okta" | "manual"
  /** Who changed this user last, and what, for the user panel. */
  changed?: { by: string; at: string; text: string }
  lastSignIn?: string
  /** For a leaver: when Okta deactivates them, and partners still assigned to them. */
  leavesOn?: string
  partners?: number
  note?: string
}

export const staffSeed: StaffUser[] = [
  { id: "u-dana", name: "Dana Ortiz", title: "VP Partnerships", role: "Channel chief", group: "PRM-Channel-Chief", status: "active", lastSignIn: "2026-10-28T08:55:00" },
  { id: "u-jordan", name: "Jordan Lee", title: "Partner manager, North America", role: "Partner manager", group: "PRM-Partner-Managers", status: "active", lastSignIn: "2026-10-28T11:40:00" },
  { id: "u-rui", name: "Rui Costa", title: "Partner manager, EMEA", role: "Partner manager", group: "PRM-Partner-Managers", status: "active", lastSignIn: "2026-10-28T09:10:00" },
  {
    id: "u-mei", name: "Mei Tan", title: "Partner manager, APAC", role: "Partner manager", group: "PRM-Partner-Managers", status: "leaving", lastSignIn: "2026-10-28T02:30:00",
    leavesOn: "2026-11-15", partners: 7, note: "Okta deactivates Mei on Nov 15. Seven partners are still assigned to Mei; only the channel chief can move them.",
  },
  { id: "u-ana", name: "Ana Costa", title: "Partner operations lead", role: "RevOps", group: "PRM-RevOps", status: "active", lastSignIn: "2026-10-28T09:45:00" },
  { id: "u-sam", name: "Sam Rivera", title: "Account executive, enterprise", role: "Field seller", group: "PRM-Field-Sellers-NA", status: "active", lastSignIn: "2026-10-28T08:20:00" },
  { id: "u-alex", name: "Alex Morgan", title: "Account executive", role: "Field seller", group: "PRM-Field-Sellers-NA", status: "active", lastSignIn: "2026-10-27T16:05:00" },
  { id: "u-nair", name: "Priya Nair", title: "Account executive", role: "Field seller", group: "PRM-Field-Sellers-NA", status: "active", lastSignIn: "2026-10-27T13:30:00" },
  { id: "u-morgan", name: "Morgan Hale", title: "Chief financial officer", role: "CEO / CFO", group: "PRM-Finance-Leadership", status: "active", lastSignIn: "2026-10-26T19:00:00" },
  { id: "u-priya", name: "Priya Shah", title: "Chief revenue officer", role: "CRO", group: "PRM-Sales-Leadership", status: "active", lastSignIn: "2026-10-28T07:45:00" },
  { id: "u-lee", name: "Lee Park", title: "AI operations lead", role: "AI supervisor", group: "PRM-AI-Supervisors", status: "active", lastSignIn: "2026-10-28T10:05:00" },
  { id: "u-kai", name: "Kai Brennan", title: "CRM and systems administrator", role: "IT / CRM admin", group: "PRM-Admins", status: "active", lastSignIn: "2026-10-28T12:02:00" },
  { id: "u-tom", name: "Tom Reyes", title: "Account executive", role: "Field seller", group: "PRM-Field-Sellers-NA", status: "deactivated", note: "Left Brightline on Oct 21. Okta deactivated the account and signed it out everywhere." },
]

/** Accounts that aren't people. Agents have no access of their own: they act with the permissions of whoever they work for (R-AG-4). */
export const serviceAccounts = [
  { name: "prm-integration@brightline.io", what: "Salesforce integration user", scope: "The PRM Integration permission set only" },
  { name: "Agent runtime", what: "Runs the nine AI agents", scope: "No standing access. Each call uses the permissions of the person or service it acts for, and is checked again" },
]

/** Okta groups pushed by SCIM, and the PRM role each one gets. */
export interface GroupMap { id: string; group: string; people: number; role?: string; status: "mapped" | "new"; pushedAt?: string }

export const groupsSeed: GroupMap[] = [
  { id: "g-new", group: "PRM-Field-Sellers-EMEA", people: 12, status: "new", pushedAt: "2026-10-28T06:00:00" },
  { id: "g1", group: "PRM-Channel-Chief", people: 1, role: "Channel chief", status: "mapped" },
  { id: "g2", group: "PRM-Partner-Managers", people: 3, role: "Partner manager", status: "mapped" },
  { id: "g3", group: "PRM-RevOps", people: 1, role: "RevOps", status: "mapped" },
  { id: "g4", group: "PRM-Field-Sellers-NA", people: 14, role: "Field seller", status: "mapped" },
  { id: "g5", group: "PRM-Finance-Leadership", people: 2, role: "CEO / CFO", status: "mapped" },
  { id: "g6", group: "PRM-Sales-Leadership", people: 1, role: "CRO", status: "mapped" },
  { id: "g7", group: "PRM-AI-Supervisors", people: 1, role: "AI supervisor", status: "mapped" },
  { id: "g8", group: "PRM-Admins", people: 2, role: "IT / CRM admin", status: "mapped" },
]

/** Every Brightline role in the PRM, with what each sees. IT gives these to people or Okta groups. */
export const staffRoles = [
  { role: "CEO / CFO", sees: "All revenue and pipeline; approves the model and large rewards" },
  { role: "CRO", sees: "All partner pipeline and revenue; decides nothing" },
  { role: "Channel chief", sees: "Every partner and partner manager; approves escalations and rules" },
  { role: "Partner manager", sees: "Their assigned partners in full; others by name only" },
  { role: "Field seller", sees: "Their own accounts and the partners on them" },
  { role: "RevOps", sees: "All pipeline and revenue; exceptions and program rules" },
  { role: "IT / CRM admin", sees: "Connections, users and the audit log; no program rules or credit" },
  { role: "AI supervisor", sees: "The agents, their activity and cost" },
]

/** PRM roles a group can map to, with what each sees. Partner users are managed by each partner's own admin. */
export const prmRoles = [
  { role: "Field seller", sees: "Their own accounts and the partners on them" },
  { role: "Partner manager", sees: "Their assigned partners in full; others by name only" },
  { role: "RevOps", sees: "All pipeline and revenue; exceptions and program rules" },
  { role: "CRO", sees: "All pipeline and revenue" },
]

/** Partner companies manage their own users (delegated admin). IT helps with support only. */
export const partnerAdmins = [
  { company: "Ridgeway IT", admin: "Paul Okafor", users: 5, signIn: "Own SSO" },
  { company: "Northpeak Consulting", admin: "Hannah Cho", users: 6, signIn: "Own SSO" },
  { company: "Clearpath Digital", admin: "Luis Ortega", users: 3, signIn: "Email link" },
  { company: "Atlas Integrators", admin: "Ben Adler", users: 4, signIn: "Email link" },
]

/** The security package IT reviews before go-live (Stage 0). Example dates. */
export const securityPackage = [
  { item: "SOC 2 Type II report", status: "Reviewed", note: "Sep 4 · no exceptions" },
  { item: "Penetration test summary", status: "Reviewed", note: "August 2026 · nothing critical or high open" },
  { item: "Data processing agreement", status: "Signed", note: "By Brightline Legal on Aug 29" },
  { item: "Sub-processors and data location", status: "Reviewed", note: "US data centres; AI model providers listed" },
  { item: "How AI uses Brightline data", status: "Reviewed", note: "Not used to train models; every prompt and answer is logged (R-AG-5)" },
]

/** One line of the append-only audit log (R-SEC-6): every person, system and agent action. */
export interface AuditEntry {
  id: string
  at: string
  actor: string
  kind: "person" | "agent" | "system"
  area: "Deals" | "Credit" | "Programs" | "Access" | "Integrations" | "Agents" | "Partners" | "Data"
  text: string
}

export const auditSeed: AuditEntry[] = [
  { id: "AU-5120", at: "2026-10-28T10:20:00", actor: "SLA agent", kind: "agent", area: "Deals", text: "Alerted Dana Ortiz: Kestrel Energy passed 80% of its review deadline" },
  { id: "AU-5119", at: "2026-10-28T09:40:00", actor: "Data Steward agent", kind: "agent", area: "Data", text: "Flagged two Salesforce accounts as one company: Acme Manufacturing and ACME Mfg. Inc." },
  { id: "AU-5118", at: "2026-10-28T09:02:05", actor: "Salesforce sync", kind: "system", area: "Integrations", text: "Created opportunity 006Q8000023JunF for Juniper Foods, with Clearpath Digital as Referral" },
  { id: "AU-5117", at: "2026-10-28T08:40:54", actor: "Rules", kind: "system", area: "Deals", text: "Approved Coastal Credit Union for Ridgeway IT in 44 seconds" },
  { id: "AU-5116", at: "2026-10-28T08:10:30", actor: "Marcus Bell (Ridgeway IT)", kind: "person", area: "Deals", text: "Registered Acme Manufacturing, $62,000" },
  { id: "AU-5115", at: "2026-10-28T06:00:00", actor: "Okta SCIM", kind: "system", area: "Access", text: "Pushed a new group, PRM-Field-Sellers-EMEA (12 people). It has no PRM role yet" },
  { id: "AU-5114", at: "2026-10-27T17:05:00", actor: "Jordan Lee", kind: "person", area: "Credit", text: "Proposed a new credit split on Brookside Bank" },
  { id: "AU-5113", at: "2026-10-27T16:00:00", actor: "Ana Costa", kind: "person", area: "Programs", text: "Asked to raise the Reseller auto-approve limit for Gold and Platinum partners" },
  { id: "AU-5112", at: "2026-10-27T15:12:30", actor: "Salesforce sync", kind: "system", area: "Integrations", text: "Timed out adding Atlas Integrators to Orion Labs; queued for retry" },
  { id: "AU-5111", at: "2026-10-27T11:00:00", actor: "Dana Ortiz", kind: "person", area: "Credit", text: "Sent Northpeak's $21,600 rebate to the CFO" },
  { id: "AU-5110", at: "2026-10-27T09:15:00", actor: "Dana Ortiz", kind: "person", area: "Integrations", text: "Asked IT to connect Microsoft Teams" },
  { id: "AU-5109", at: "2026-10-26T11:30:00", actor: "Lee Park", kind: "person", area: "Agents", text: "Asked to let the Deal Desk agent approve clean deals under $25,000 (A3 to A4)" },
  { id: "AU-5108", at: "2026-10-21T18:00:00", actor: "Okta SCIM", kind: "system", area: "Access", text: "Deactivated Tom Reyes and signed the account out everywhere" },
  { id: "AU-5107", at: "2026-10-20T15:30:00", actor: "Kai Brennan", kind: "person", area: "Access", text: "Exported the audit log for the quarterly access review" },
]

export const itFeedSeed: ActivityItem[] = [
  { id: "it1", at: "2026-10-28T06:00:00", text: "Okta pushed a new group, PRM-Field-Sellers-EMEA, with 12 people and no PRM role", href: "/v/users" },
  { id: "it2", at: "2026-10-27T15:12:30", text: "Salesforce timed out writing Atlas's role on Orion Labs; retrying", href: "/v/connections" },
  { id: "it3", at: "2026-10-27T09:15:00", text: "Dana Ortiz asked you to connect Microsoft Teams", href: "/v/connections" },
  { id: "it4", at: "2026-10-26T08:00:00", text: "The Data Steward agent suggested three field mappings", href: "/v/mappings" },
]
