// Super admin: the PRM company's own platform team, above every customer (tenant). Brightline is one tenant.
// Everything here is illustrative: other tenants, plans, prices, usage and incidents are example figures.

export const admin = { name: "Rowan Ellis", first: "Rowan", initials: "RE", title: "Platform administrator", team: "PRM platform team", email: "rowan.ellis@prm-platform.io" }

/* ---------------- Organizations (tenants) ---------------- */

export type OrgStatus = "active" | "trial" | "onboarding" | "suspended"
export type PlanId = "starter" | "growth" | "enterprise"

export interface Org {
  id: string
  name: string
  domain: string
  industry: string
  plan: PlanId
  region: "US" | "EU"
  status: OrgStatus
  stage: string
  createdAt: string
  admin: string
  adminEmail: string
  sso: string
  crm: string
  staff: number
  partnerUsers: number
  partners: number
  /** Monthly recurring revenue for the PRM company, in dollars. */
  mrr: number
  agentActions: number
  aiCost: number
  /** Monthly cap on AI spend; agents pause for this tenant above it. */
  aiCap: number
  syncLagSec: number
  health: "good" | "watch" | "bad"
  note?: string
  trialEnds?: string
  /** Live means its data comes from the running demo (Brightline). */
  live?: boolean
}

export const orgsSeed: Org[] = [
  { id: "brightline", name: "Brightline", domain: "brightline.io", industry: "Analytics software", plan: "enterprise", region: "US", status: "active", stage: "1B · Stage 2 previews", createdAt: "2026-06-02", admin: "Kai Brennan", adminEmail: "kai.brennan@brightline.io", sso: "Okta (SAML)", crm: "Salesforce", staff: 37, partnerUsers: 18, partners: 15, mrr: 9_800, agentActions: 7_634, aiCost: 1_151, aiCap: 1_500, syncLagSec: 100, health: "good", live: true },
  { id: "halden", name: "Halden Software", domain: "halden.com", industry: "HR software", plan: "growth", region: "EU", status: "active", stage: "1B", createdAt: "2026-07-14", admin: "Mira Kovač", adminEmail: "mira.kovac@halden.com", sso: "Microsoft Entra ID", crm: "Salesforce", staff: 22, partnerUsers: 41, partners: 28, mrr: 4_500, agentActions: 5_120, aiCost: 690, aiCap: 1_000, syncLagSec: 140, health: "watch", note: "Sync lag rising this week; their Salesforce API limit is close." },
  { id: "corvane", name: "Corvane Systems", domain: "corvane.io", industry: "Cybersecurity", plan: "enterprise", region: "US", status: "onboarding", stage: "0 · sandbox", createdAt: "2026-10-21", admin: "Jonah Pierce", adminEmail: "jonah.pierce@corvane.io", sso: "Okta (SAML)", crm: "Salesforce", staff: 6, partnerUsers: 0, partners: 0, mrr: 9_800, agentActions: 210, aiCost: 18, aiCap: 1_500, syncLagSec: 0, health: "good", note: "Stage 0 exit gate: sandbox sync end to end, due Nov 5." },
  { id: "quillmark", name: "Quillmark", domain: "quillmark.co", industry: "Design tools", plan: "starter", region: "US", status: "trial", stage: "1A", createdAt: "2026-10-14", admin: "Ada Okoye", adminEmail: "ada@quillmark.co", sso: "Google Workspace", crm: "HubSpot (Stage 2)", staff: 4, partnerUsers: 9, partners: 6, mrr: 0, agentActions: 340, aiCost: 21, aiCap: 150, syncLagSec: 0, health: "good", trialEnds: "2026-11-13" },
  { id: "ostrava", name: "Ostrava Networks", domain: "ostravanet.eu", industry: "Telecoms equipment", plan: "growth", region: "EU", status: "suspended", stage: "1A", createdAt: "2026-05-20", admin: "Pavel Dvořák", adminEmail: "pavel.dvorak@ostravanet.eu", sso: "Microsoft Entra ID", crm: "Salesforce", staff: 15, partnerUsers: 33, partners: 19, mrr: 4_500, agentActions: 0, aiCost: 0, aiCap: 1_000, syncLagSec: 0, health: "bad", note: "Suspended on Oct 20: invoice INV-2209 was 50 days overdue. Data kept; nobody can sign in." },
]

export const orgStatusLabel: Record<OrgStatus, string> = { active: "Active", trial: "Trial", onboarding: "Onboarding", suspended: "Suspended" }

/* ---------------- Plans and billing ---------------- */

export interface Plan { id: PlanId; name: string; price: string; monthly: number; staff: string; partners: string; aiActions: string; features: string[] }
export const plans: Plan[] = [
  { id: "starter", name: "Starter", price: "$1,200 / month", monthly: 1_200, staff: "Up to 25 staff", partners: "Up to 50 partners", aiActions: "2,000 agent actions", features: ["Deal registration and the review queue", "Partner portal", "Salesforce or HubSpot sync", "Email sign-in links"] },
  { id: "growth", name: "Growth", price: "$4,500 / month", monthly: 4_500, staff: "Up to 100 staff", partners: "Up to 250 partners", aiActions: "10,000 agent actions", features: ["Everything in Starter", "Multi-partner credit and reconciliation", "SSO and SCIM", "Board view and exports", "AI agents up to Ask first"] },
  { id: "enterprise", name: "Enterprise", price: "From $9,800 / month", monthly: 9_800, staff: "Unlimited staff", partners: "Unlimited partners", aiActions: "Agent actions by contract", features: ["Everything in Growth", "Automatic agent actions", "Stage 2 previews (co-sell, MDF, skills)", "EU or US data residency", "Customer-managed keys", "Named support engineer"] },
]
export const planName = (id: string) => plans.find((p) => p.id === id)?.name ?? id

export interface Invoice { id: string; orgId: string; period: string; amount: number; status: "paid" | "open" | "overdue"; due: string }
export const invoicesSeed: Invoice[] = [
  { id: "INV-2261", orgId: "brightline", period: "Oct 2026", amount: 9_800, status: "open", due: "2026-11-01" },
  { id: "INV-2230", orgId: "brightline", period: "Sep 2026", amount: 9_800, status: "paid", due: "2026-10-01" },
  { id: "INV-2258", orgId: "halden", period: "Oct 2026", amount: 4_500, status: "open", due: "2026-11-01" },
  { id: "INV-2244", orgId: "corvane", period: "Oct 2026", amount: 9_800, status: "paid", due: "2026-10-25" },
  { id: "INV-2262", orgId: "quillmark", period: "Trial", amount: 0, status: "paid", due: "2026-11-13" },
  { id: "INV-2209", orgId: "ostrava", period: "Aug 2026", amount: 4_500, status: "overdue", due: "2026-09-01" },
  { id: "INV-2236", orgId: "ostrava", period: "Sep 2026", amount: 4_500, status: "overdue", due: "2026-10-01" },
]

/* ---------------- Feature flags and releases ---------------- */

export interface Flag { id: string; name: string; what: string; stage: string; plans: PlanId[]; on: Record<string, boolean> }
export const flagsSeed: Flag[] = [
  { id: "cosell", name: "Co-sell (J-03)", what: "Sellers send co-sell requests; partners accept on their Leads page", stage: "2", plans: ["enterprise"], on: { brightline: true, halden: false, corvane: false, quillmark: false, ostrava: false } },
  { id: "mdf", name: "Partner marketing and funds", what: "Campaigns, tracked links, MDF requests and claims", stage: "2", plans: ["enterprise"], on: { brightline: true, halden: false, corvane: false, quillmark: false, ostrava: false } },
  { id: "skills", name: "Technical lead skills and milestones", what: "Skills ladder, delivery milestones as touches, influenced revenue", stage: "2", plans: ["enterprise"], on: { brightline: true, halden: false, corvane: false, quillmark: false, ostrava: false } },
  { id: "risk", name: "AI risk flags for the CRO", what: "Flags deals with no partner, stalled stages and no activity", stage: "2", plans: ["enterprise"], on: { brightline: true, halden: false, corvane: false, quillmark: false, ostrava: false } },
  { id: "recon", name: "Reconciliation and revenue ledger", what: "Closed-won matching and append-only ledger entries", stage: "1B", plans: ["growth", "enterprise"], on: { brightline: true, halden: true, corvane: true, quillmark: false, ostrava: true } },
  { id: "board", name: "Board view export", what: "One-slide verified revenue, shared read-only", stage: "1B", plans: ["growth", "enterprise"], on: { brightline: true, halden: true, corvane: true, quillmark: false, ostrava: true } },
  { id: "autoagents", name: "Automatic agent actions", what: "Lets a tenant's AI supervisor move actions up to Automatic (A4)", stage: "0", plans: ["enterprise"], on: { brightline: true, halden: false, corvane: true, quillmark: false, ostrava: false } },
  { id: "newprogram", name: "New programs from templates", what: "RevOps creates programs beyond the five templates", stage: "1A", plans: ["starter", "growth", "enterprise"], on: { brightline: true, halden: true, corvane: true, quillmark: true, ostrava: true } },
]

export interface Release { version: string; date: string; status: "live" | "rolling" | "scheduled"; rollout: number; notes: string[] }
export const releasesSeed: Release[] = [
  { version: "1.9", date: "2026-10-26", status: "rolling", rollout: 25, notes: ["Deal Desk agent v15: fewer false conflict matches on renewals", "AI models page for tenants' AI supervisors", "Plain-language autonomy levels"] },
  { version: "1.8", date: "2026-10-06", status: "live", rollout: 100, notes: ["New programs from templates", "IT: add and manage users", "Ridgeway-style reseller technical leads"] },
  { version: "2.0", date: "2026-12-15", status: "scheduled", rollout: 0, notes: ["Stage 2 general availability: co-sell, MDF, skills", "HubSpot connector"] },
]

/* ---------------- AI platform ---------------- */

export interface Provider { id: string; name: string; status: "approved" | "review" | "blocked"; models: string; regions: string; note: string }
export const providersSeed: Provider[] = [
  { id: "anthropic", name: "Anthropic", status: "approved", models: "Claude Haiku 5.5, Sonnet 5.5, Opus 5.5", regions: "US, EU", note: "Zero data retention; no training on customer data. In every tenant's security package." },
  { id: "azure-openai", name: "Azure OpenAI", status: "review", models: "GPT models via Azure", regions: "EU", note: "Requested by Halden Software for EU-only processing. Security review in progress." },
]

export const agentReleases = [
  { agent: "Deal Desk agent", version: "v15", rolledTo: "25% of tenants", previous: "v14" },
  { agent: "Insights agent", version: "v11", rolledTo: "All tenants", previous: "v10" },
  { agent: "Data Steward agent", version: "v5", rolledTo: "All tenants", previous: "v4" },
  { agent: "Co-sell agent", version: "v4", rolledTo: "Enterprise only", previous: "v3" },
]

/* ---------------- Integrations ---------------- */

export interface Connector { id: string; name: string; kind: string; status: "ga" | "beta" | "planned"; tenants: number; errorRate: number; plans: string }
export const connectors: Connector[] = [
  { id: "salesforce", name: "Salesforce", kind: "CRM", status: "ga", tenants: 4, errorRate: 0.4, plans: "All plans" },
  { id: "hubspot", name: "HubSpot", kind: "CRM", status: "beta", tenants: 1, errorRate: 1.8, plans: "All plans (Stage 2)" },
  { id: "okta", name: "Okta", kind: "Sign-in (SAML, SCIM)", status: "ga", tenants: 2, errorRate: 0, plans: "Growth and Enterprise" },
  { id: "entra", name: "Microsoft Entra ID", kind: "Sign-in (SAML, SCIM)", status: "ga", tenants: 2, errorRate: 0.1, plans: "Growth and Enterprise" },
  { id: "google", name: "Google Workspace", kind: "Sign-in (OIDC)", status: "ga", tenants: 1, errorRate: 0, plans: "All plans" },
  { id: "slack", name: "Slack", kind: "Notifications and approvals", status: "ga", tenants: 3, errorRate: 0.2, plans: "All plans" },
  { id: "teams", name: "Microsoft Teams", kind: "Notifications and approvals", status: "ga", tenants: 2, errorRate: 0.3, plans: "All plans" },
  { id: "snowflake", name: "Snowflake", kind: "Data warehouse", status: "beta", tenants: 0, errorRate: 0, plans: "Enterprise" },
  { id: "databricks", name: "Databricks", kind: "Data platform", status: "planned", tenants: 0, errorRate: 0, plans: "Enterprise" },
]
export const apiStats = { keys: 14, calls24h: 182_400, errors24h: 0.3, webhooks: 22, mcpClients: 6 }

/* ---------------- Security ---------------- */

export interface Policy { id: string; label: string; help: string; kind: "toggle" | "choice"; value: string | boolean; options?: string[]; locked?: string }
export const policiesSeed: Policy[] = [
  { id: "staffMfa", label: "MFA for every tenant's staff", help: "Vendor staff sign in with SSO and MFA (R-SEC-5)", kind: "toggle", value: true, locked: "Required by R-SEC-5; can't be switched off" },
  { id: "adminMfa", label: "Hardware keys for the platform team", help: "Super admins sign in with a security key, not an app code", kind: "toggle", value: true },
  { id: "adminIp", label: "Platform team only from the office network or VPN", help: "Blocks super admin sign-in from any other network", kind: "toggle", value: true },
  { id: "session", label: "Session length for tenant users", help: "Users sign in again after this", kind: "choice", value: "12 hours", options: ["8 hours", "12 hours", "24 hours"] },
  { id: "partnerLinks", label: "Email sign-in links for partner users", help: "Partners without their own SSO sign in with a link to their work email", kind: "toggle", value: true },
  { id: "supportAccess", label: "Support access needs the tenant's approval", help: "Platform staff can open a tenant only after its IT admin approves, read-only, for a set time", kind: "toggle", value: true, locked: "Always on: customer data is the customer's" },
  { id: "cmk", label: "Customer-managed encryption keys", help: "Enterprise tenants can bring their own key", kind: "toggle", value: true },
]

export interface SecurityEvent { id: string; at: string; orgId: string; severity: "high" | "medium" | "low"; text: string; status: "open" | "resolved" }
export const securityEventsSeed: SecurityEvent[] = [
  { id: "SE-88", at: "2026-10-28T11:05:00", orgId: "halden", severity: "high", text: "Impossible travel: Halden admin signed in from Lisbon and Singapore 40 minutes apart", status: "open" },
  { id: "SE-87", at: "2026-10-28T08:12:00", orgId: "quillmark", severity: "medium", text: "54 failed sign-in links requested for one partner address in an hour", status: "open" },
  { id: "SE-86", at: "2026-10-27T19:40:00", orgId: "brightline", severity: "low", text: "API key last used 120 days ago; rotation recommended", status: "open" },
  { id: "SE-84", at: "2026-10-24T09:00:00", orgId: "corvane", severity: "low", text: "Sandbox data copied to a new region (EU) during set-up", status: "resolved" },
]

export interface SupportAccess { id: string; orgId: string; engineer: string; reason: string; ticket: string; hours: number; status: "requested" | "granted" | "declined" | "ended"; at: string; decidedBy?: string; until?: string }
export const supportSeed: SupportAccess[] = [
  { id: "SA-31", orgId: "halden", engineer: "Ines Duarte", reason: "Investigating rising Salesforce sync lag", ticket: "SUP-1184", hours: 2, status: "granted", at: "2026-10-28T09:00:00", decidedBy: "Mira Kovač", until: "2026-10-28T13:00:00" },
]

/* ---------------- Operations ---------------- */

export const servicesSeed = [
  { id: "web", name: "Web app and portals", status: "ok", uptime: 99.99, p95: "180 ms" },
  { id: "api", name: "Public API and MCP", status: "ok", uptime: 99.97, p95: "240 ms" },
  { id: "sync", name: "CRM sync workers", status: "degraded", uptime: 99.91, p95: "1 min 50 s lag" },
  { id: "agents", name: "Agent runtime", status: "ok", uptime: 99.95, p95: "2.1 s per action" },
  { id: "notify", name: "Notifications (email, Slack, Teams)", status: "ok", uptime: 99.98, p95: "4 s" },
  { id: "search", name: "Search and ask bar", status: "ok", uptime: 99.96, p95: "320 ms" },
]

export interface Incident { id: string; at: string; title: string; status: "investigating" | "monitoring" | "resolved"; impact: string }
export const incidentsSeed: Incident[] = [
  { id: "INC-41", at: "2026-10-28T07:30:00", title: "CRM sync slower in the EU region", status: "monitoring", impact: "Halden Software: changes reach Salesforce in about 3 minutes instead of under 2" },
  { id: "INC-39", at: "2026-10-15T14:00:00", title: "Slack approvals delayed", status: "resolved", impact: "All tenants: approvals from Slack took up to 6 minutes for 40 minutes" },
]

export interface Announcement { id: string; title: string; body: string; audience: string; kind: "info" | "maintenance"; status: "draft" | "live" | "ended"; at: string; window?: string }
export const announcementsSeed: Announcement[] = [
  { id: "AN-12", title: "Release 1.9 is rolling out", body: "Plain-language agent levels and an AI models page for AI supervisors.", audience: "All tenants", kind: "info", status: "ended", at: "2026-10-26T09:00:00" },
]

export interface DataRequest { id: string; orgId: string; kind: "export" | "delete"; subject: string; asked: string; due: string; status: "new" | "in_progress" | "done"; by: string }
export const dataRequestsSeed: DataRequest[] = [
  { id: "DR-19", orgId: "halden", kind: "export", subject: "All Halden partner data (contract renewal review)", asked: "2026-10-26", due: "2026-11-25", status: "new", by: "Mira Kovač" },
  { id: "DR-18", orgId: "brightline", kind: "delete", subject: "Former partner user at Summit Resale (GDPR erasure request)", asked: "2026-10-02", due: "2026-11-01", status: "in_progress", by: "Kai Brennan" },
  { id: "DR-15", orgId: "quillmark", kind: "export", subject: "Trial data before purchase decision", asked: "2026-10-10", due: "2026-11-09", status: "done", by: "Ada Okoye" },
]

export const retention = [
  { item: "Audit log", keep: "7 years", why: "Append-only (R-SEC-6); needed for finance and security reviews" },
  { item: "Agent prompts and answers", keep: "1 year", why: "Evidence for agent decisions (R-AG-5)" },
  { item: "Deleted records", keep: "30 days, then purged", why: "Lets a tenant undo a mistake" },
  { item: "Suspended tenant data", keep: "90 days after suspension", why: "Then exported to the customer and deleted" },
  { item: "Backups", keep: "35 days, encrypted", why: "Daily; a restore is tested every month" },
]

export const usageByMonth = [
  { month: "Jul", users: 210, decisions: 1_480, actions: 6_900 },
  { month: "Aug", users: 260, decisions: 1_910, actions: 8_800 },
  { month: "Sep", users: 300, decisions: 2_430, actions: 11_200 },
  { month: "Oct", users: 342, decisions: 2_960, actions: 13_304 },
]
export const moduleAdoption = [
  { module: "Deal registration", pct: 100 },
  { module: "Review queue", pct: 100 },
  { module: "Credit and reconciliation", pct: 60 },
  { module: "Board view", pct: 40 },
  { module: "Co-sell (Stage 2)", pct: 20 },
  { module: "Partner marketing (Stage 2)", pct: 20 },
]

/* ---------------- Platform team ---------------- */

export interface TeamMember { id: string; name: string; role: "Super admin" | "Support" | "Billing" | "Security" | "Read-only"; email: string; status: "active" | "invited"; lastSignIn?: string }
export const platformRoles = [
  { role: "Super admin", can: "Everything below, plus the platform team, policies and kill switches" },
  { role: "Support", can: "Ask for read-only support access to a tenant; see health and incidents" },
  { role: "Billing", can: "Plans, invoices and payment status; no customer data" },
  { role: "Security", can: "Security events, policies (read), the platform audit log" },
  { role: "Read-only", can: "See every page; change nothing" },
]
export const teamSeed: TeamMember[] = [
  { id: "p1", name: "Rowan Ellis", role: "Super admin", email: "rowan.ellis@prm-platform.io", status: "active", lastSignIn: "2026-10-28T12:00:00" },
  { id: "p2", name: "Ines Duarte", role: "Support", email: "ines.duarte@prm-platform.io", status: "active", lastSignIn: "2026-10-28T09:05:00" },
  { id: "p3", name: "Kenji Mori", role: "Billing", email: "kenji.mori@prm-platform.io", status: "active", lastSignIn: "2026-10-27T16:20:00" },
  { id: "p4", name: "Sara Lind", role: "Security", email: "sara.lind@prm-platform.io", status: "active", lastSignIn: "2026-10-28T07:40:00" },
]

/** Admins at the other tenants, for the cross-tenant user directory. Brightline's people come live from the demo. */
export const otherUsers = [
  { name: "Mira Kovač", email: "mira.kovac@halden.com", orgId: "halden", role: "IT / CRM admin", kind: "staff" as const, mfa: true, lastSignIn: "2026-10-28T11:02:00" },
  { name: "Lukas Brandt", email: "lukas.brandt@halden.com", orgId: "halden", role: "Channel chief", kind: "staff" as const, mfa: true, lastSignIn: "2026-10-27T15:00:00" },
  { name: "Jonah Pierce", email: "jonah.pierce@corvane.io", orgId: "corvane", role: "IT / CRM admin", kind: "staff" as const, mfa: true, lastSignIn: "2026-10-28T10:30:00" },
  { name: "Ada Okoye", email: "ada@quillmark.co", orgId: "quillmark", role: "IT / CRM admin", kind: "staff" as const, mfa: false, lastSignIn: "2026-10-26T18:10:00" },
  { name: "Pavel Dvořák", email: "pavel.dvorak@ostravanet.eu", orgId: "ostrava", role: "IT / CRM admin", kind: "staff" as const, mfa: true, lastSignIn: "2026-10-19T09:00:00" },
]

export interface PlatformAudit { id: string; at: string; actor: string; text: string; orgId?: string }
export const platformAuditSeed: PlatformAudit[] = [
  { id: "PA-410", at: "2026-10-28T09:00:00", actor: "Mira Kovač (Halden)", text: "Approved support access for Ines Duarte, 2 hours (SUP-1184)", orgId: "halden" },
  { id: "PA-409", at: "2026-10-28T07:30:00", actor: "Ines Duarte", text: "Opened incident INC-41: CRM sync slower in the EU region" },
  { id: "PA-408", at: "2026-10-21T10:00:00", actor: "Rowan Ellis", text: "Created organization Corvane Systems (Enterprise, US)", orgId: "corvane" },
  { id: "PA-405", at: "2026-10-20T08:00:00", actor: "Kenji Mori", text: "Suspended Ostrava Networks: INV-2209 50 days overdue", orgId: "ostrava" },
]
