import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from "react"
import * as seed from "@/data/model"
import type {
  ActivityItem, Application, CreditLine, CrmIssue, CrmWrite, Lead, ExtensionRequest, HealthSignal, Notice, Onboarding,
  Opportunity, Partner, PartnerRole, Registration, Tier,
} from "@/data/model"
import { roleWeights } from "@/data/model"
import { NOW, addDays, money } from "@/lib/format"
import { agreementsSeed, teamSeed, type Agreement as PartnerAgreement, type TeamMember } from "@/partner/data"
import { agents as agentSeed, requestsSeed, rulesSeed, type ChangeRequest, type ProgramId, type ProgramInfo, type RuleSet } from "@/chief/data"
import { campaignLeadsSeed, campaignsSeed, mdfSeed, type Campaign, type CampaignLead, type MdfRequest } from "@/partner/marketing"
import { engagementsSeed, skillsSeed, type Engagement, type Skill } from "@/partner/delivery"
import {
  candidatesSeed, cosellSeed, defaultPlan, exceptionsSeed, execApprovalsSeed, ledgerSeed, sellerAccounts,
  type CoSellRequest, type DataException, type ExecApproval, type LedgerEntry, type PlanStep,
} from "@/vendor/data"
import { croFeedSeed, type Nudge } from "@/vendor/sales"
import {
  auditSeed, connectionsSeed, groupsSeed, itFeedSeed, mappingsSeed, staffSeed,
  type AuditEntry, type Connection, type FieldMapping, type GroupMap, type StaffUser,
} from "@/vendor/admin"
import * as sa from "@/superadmin/data"
import type { Announcement, DataRequest, Org, PlatformAudit, SupportAccess, TeamMember as PlatformMember } from "@/superadmin/data"
import {
  actionKey, agentLogSeed, agentRoster, aisupFeedSeed, initialActionLevels, initialAgentLevels, initialAgentModels, modelName, type AgentLogEntry,
} from "@/vendor/agents"

/** Something that happened on the partner side. `rep` limits it to that person (and their company's admin). Ridgeway unless `companyId` says otherwise. */
export interface PartnerFeedItem { id: string; at: string; text: string; href?: string; rep?: string; companyId?: string }
export interface Dispute { id: string; regId: string; by: string; reason: string; at: string }
/** A partner moved between partner managers by the channel chief. Standard practice, not in the documents. */
export interface Assignment { id: string; partnerId: string; partner: string; from: string; to: string; reason: string; at: string }

export interface State {
  partners: Partner[]
  registrations: Registration[]
  extensions: ExtensionRequest[]
  applications: Application[]
  onboarding: Onboarding[]
  opportunities: Opportunity[]
  health: HealthSignal[]
  notices: Notice[]
  activity: ActivityItem[]
  reminders: Record<string, string>
  crmWrites: CrmWrite[]
  crmIssues: CrmIssue[]
  leads: Lead[]
  notes: Record<string, { at: string; text: string }[]>
  team: TeamMember[]
  agreements: PartnerAgreement[]
  disputes: Dispute[]
  partnerFeed: PartnerFeedItem[]
  requests: ChangeRequest[]
  agentLevels: Record<string, string>
  chiefFeed: ActivityItem[]
  assignments: Assignment[]
  programRules: Record<ProgramId, RuleSet>
  pausedAgents: string[]
  /* Partner marketer (Stage 2) */
  campaigns: Campaign[]
  campaignLeads: CampaignLead[]
  mdf: MdfRequest[]
  /* Partner technical lead (Stage 2) */
  engagements: Engagement[]
  skills: Skill[]
  /* RevOps */
  exceptions: DataException[]
  ledger: LedgerEntry[]
  opsFeed: ActivityItem[]
  /** Programs launched from a template since the demo started (the Marketplace program). */
  launched: ProgramId[]
  /** Programs RevOps created from a template. Not launched until the channel chief approves their rules. */
  customPrograms: ProgramInfo[]
  /* Field seller */
  cosell: CoSellRequest[]
  /** Context a Brightline seller added to a registration on their account, for the partner manager. */
  sellerNotes: Record<string, { by: string; at: string; text: string }[]>
  sellerFeed: ActivityItem[]
  /* CEO / CFO */
  execApprovals: ExecApproval[]
  execFeed: ActivityItem[]
  /* CRO */
  croNudges: Nudge[]
  croFeed: ActivityItem[]
  /* IT / CRM admin */
  connections: Connection[]
  mappings: FieldMapping[]
  groups: GroupMap[]
  staff: StaffUser[]
  /** Leavers IT has told the channel chief about (their partners need a new partner manager). */
  toldChief: string[]
  /** Duplicate-account exceptions the CRM admin has merged inside Salesforce. */
  merged: string[]
  itFeed: ActivityItem[]
  /** Append-only log of every person, system and agent action (R-SEC-6). */
  audit: AuditEntry[]
  /* AI supervisor */
  /** Autonomy per agent action, keyed "agent.action" (R-AG-1). `agentLevels` mirrors each agent's headline action. */
  actionLevels: Record<string, string>
  pausedActions: string[]
  /** The kill switch for every agent at once (R-AG-3). */
  agentLayerPaused: boolean
  agentLog: AgentLogEntry[]
  aisupFeed: ActivityItem[]
  /** Which approved AI model each agent runs on, and the default for anything new. */
  agentModels: Record<string, string>
  defaultModel: string
  /* Super admin: the PRM company's platform team, above every tenant */
  platform: PlatformState
}

export interface PlatformState {
  orgs: Org[]
  invoices: sa.Invoice[]
  flags: sa.Flag[]
  releases: sa.Release[]
  providers: sa.Provider[]
  policies: sa.Policy[]
  events: sa.SecurityEvent[]
  support: SupportAccess[]
  incidents: sa.Incident[]
  announcements: Announcement[]
  dataRequests: DataRequest[]
  team: PlatformMember[]
  audit: PlatformAudit[]
  /** Per-user platform actions, keyed by email. */
  userFlags: Record<string, { locked?: boolean; mfaReset?: string; signedOut?: string }>
  /** Changes to the default role templates, keyed "permission.role". */
  permOverrides: Record<string, string>
  /** Stops every agent for every tenant. */
  aiPaused: boolean
  /** Read-only mode for every tenant during maintenance. */
  maintenance: boolean
}

const initial: State = {
  partners: seed.partners,
  registrations: [...seed.registrations, ...seed.pipelineRegistrations],
  extensions: seed.extensions,
  applications: seed.applications,
  onboarding: seed.onboarding,
  opportunities: seed.opportunities,
  health: seed.healthSignals,
  notices: seed.notices,
  activity: seed.activity,
  reminders: {},
  crmWrites: seed.crmWrites,
  crmIssues: seed.crmIssues,
  leads: seed.leads,
  notes: {
    ridgeway: [{ at: "2026-10-21T16:00:00", text: "Marcus wants co-marketing for the hospitality push in Q1." }],
  },
  team: teamSeed,
  agreements: agreementsSeed,
  disputes: [],
  partnerFeed: [
    { id: "pf1", at: "2026-10-28T09:00:00", text: "Jordan Lee sent Ridgeway a lead: Pioneer Hotels Group", href: "/p/leads" },
    { id: "pf2", at: "2026-10-28T08:40:54", text: "Rules approved Coastal Credit Union in 44 seconds", href: "/p/deal/REG-2039", rep: "Marcus Bell" },
    { id: "pf3", at: "2026-10-28T08:10:30", text: "Acme Manufacturing is with Jordan Lee for review", href: "/p/deal/REG-2041", rep: "Marcus Bell" },
    { id: "pf4", at: "2026-10-27T17:30:00", text: "Jordan Lee sent Marcus a lead: Lakeside Logistics", href: "/p/leads", rep: "Marcus Bell" },
    { id: "pf5", at: "2026-10-27T09:30:00", text: "Jordan Lee asked a question about Solace Retail", href: "/p/deal/REG-2027", rep: "Marcus Bell" },
    { id: "pf6", at: "2026-10-10T09:00:36", text: "Rules approved Copperline Mining in 36 seconds", href: "/p/deal/REG-1960", rep: "Jenna Ruiz" },
    { id: "pf7", at: "2026-10-28T08:45:00", text: "Cobalt Resorts came in from your Q4 hospitality emails", href: "/p/leads", rep: "Priya Raman" },
    { id: "pf8", at: "2026-10-27T15:10:00", text: "Your $4,000 funds request for the manufacturing launch is with Brightline", href: "/p/funds", rep: "Priya Raman" },
    { id: "pf9", at: "2026-10-20T14:00:00", text: "You handed Lakeview Suites to Jenna Ruiz", href: "/p/leads", rep: "Priya Raman" },
    { id: "pf10", at: "2026-10-27T10:21:00", text: "Kestrel Energy is with Jordan Lee for review. You're named for the solution design", href: "/p/work/ENG-4", rep: "Raj Mehta", companyId: "northpeak" },
    { id: "pf11", at: "2026-10-24T16:30:00", text: "Your statement of work on Harborview Logistics was recorded as a touch", href: "/p/work/ENG-1", rep: "Raj Mehta", companyId: "northpeak" },
    { id: "pf12", at: "2026-10-22T17:00:00", text: "You finished the Grid analytics course. The exam is next", href: "/p/skills", rep: "Raj Mehta", companyId: "northpeak" },
    { id: "pf13", at: "2026-10-27T16:00:00", text: "Marcus Bell asked you to run the platform workshop for Copperline Mining", href: "/p/work/ENG-7", rep: "Theo Grant" },
    { id: "pf14", at: "2026-10-20T12:00:00", text: "You finished the Platform course. Pass the exam and Ridgeway has its certified technical lead", href: "/p/skills", rep: "Theo Grant" },
    { id: "pf15", at: "2026-10-14T11:30:00", text: "Your Northgate Retail demo was recorded as a touch", href: "/p/work/ENG-6", rep: "Theo Grant" },
  ],
  requests: requestsSeed,
  assignments: [],
  programRules: rulesSeed,
  pausedAgents: [],
  campaigns: campaignsSeed,
  campaignLeads: campaignLeadsSeed,
  mdf: mdfSeed,
  engagements: engagementsSeed,
  skills: skillsSeed,
  exceptions: exceptionsSeed,
  ledger: ledgerSeed,
  launched: [],
  customPrograms: [],
  opsFeed: [
    { id: "o1", at: "2026-10-28T09:40:00", text: "The Data Steward agent flagged two Salesforce accounts that look like one company", href: "/v/exception/EX-43" },
    { id: "o2", at: "2026-10-28T06:30:00", text: "Orchid Foods has had no Salesforce activity for 52 days", href: "/v/exception/EX-44" },
    { id: "o3", at: "2026-10-27T16:00:00", text: "You asked Dana Ortiz to raise the Reseller auto-approve limit for top partners", href: "/v/programs" },
    { id: "o4", at: "2026-10-27T15:12:30", text: "Salesforce timed out writing Atlas's role on Orion Labs; retrying", href: "/v/exception/EX-41" },
    { id: "o5", at: "2026-10-03T07:00:00", text: "Credit on Cedar Valley Schools is on hold: the amounts differ", href: "/v/exception/EX-42" },
  ],
  cosell: cosellSeed,
  sellerNotes: {},
  sellerFeed: [
    { id: "s1", at: "2026-10-28T08:10:00", text: "Ridgeway IT registered a deal on Acme Manufacturing, your account. Jordan Lee is reviewing it", href: "/v/account/acme" },
    { id: "s2", at: "2026-10-27T10:20:00", text: "Northpeak Consulting registered Kestrel Energy. Raj Mehta is named for the solution design", href: "/v/account/kestrel" },
    { id: "s3", at: "2026-10-15T16:00:00", text: "Atlas finished the solution design on Brookside Bank", href: "/v/account/brookside" },
  ],
  execApprovals: execApprovalsSeed,
  execFeed: [
    { id: "e1", at: "2026-10-27T11:00:00", text: "Dana Ortiz sent you Northpeak's $21,600 rebate to approve", href: "/v/approval/RW-14" },
    { id: "e2", at: "2026-10-26T15:00:00", text: "Dana Ortiz proposed attribution model version 3", href: "/v/approval/AM-3" },
    { id: "e3", at: "2026-10-09T18:00:00", text: "Pinnacle Health Network closed won: $96,000, verified", href: "/v/revenue" },
  ],
  croNudges: [],
  croFeed: croFeedSeed,
  connections: connectionsSeed,
  mappings: mappingsSeed,
  groups: groupsSeed,
  staff: staffSeed,
  toldChief: [],
  merged: [],
  itFeed: itFeedSeed,
  audit: auditSeed,
  actionLevels: initialActionLevels,
  pausedActions: [],
  agentLayerPaused: false,
  agentLog: agentLogSeed,
  aisupFeed: aisupFeedSeed,
  agentModels: initialAgentModels,
  defaultModel: "sonnet",
  platform: {
    orgs: sa.orgsSeed, invoices: sa.invoicesSeed, flags: sa.flagsSeed, releases: sa.releasesSeed, providers: sa.providersSeed,
    policies: sa.policiesSeed, events: sa.securityEventsSeed, support: sa.supportSeed, incidents: sa.incidentsSeed,
    announcements: sa.announcementsSeed, dataRequests: sa.dataRequestsSeed, team: sa.teamSeed, audit: sa.platformAuditSeed,
    userFlags: {}, permOverrides: {}, aiPaused: false, maintenance: false,
  },
  agentLevels: { ...Object.fromEntries(agentSeed.map((a) => [a.id, a.level])), ...initialAgentLevels },
  chiefFeed: [
    { id: "cf1", at: "2026-10-28T10:20:00", text: "Kestrel Energy passed 80% of its review deadline with Jordan Lee", href: "/c/approval/reg-REG-2038" },
    { id: "cf2", at: "2026-10-27T17:05:00", text: "Jordan Lee proposed a new credit split on Brookside Bank", href: "/c/approval/split-006Q8000020BrkS" },
    { id: "cf3", at: "2026-10-27T16:00:00", text: "Ana Costa (RevOps) asked to raise the auto-approve limit for top partners", href: "/c/approval/req-CR-21" },
    { id: "cf6", at: "2026-10-27T11:00:00", text: "Northpeak's $21,600 rebate is with Morgan Hale (CFO): rewards over $20,000 need the CFO" },
    { id: "cf7", at: "2026-10-26T15:00:00", text: "Attribution model version 3 is with Morgan Hale (CFO) for approval" },
    { id: "cf4", at: "2026-10-26T11:30:00", text: "Lee Park asked for more autonomy for the Deal Desk agent", href: "/c/approval/req-CR-22" },
    { id: "cf5", at: "2026-10-24T15:00:00", text: "Jordan Lee escalated the Tidewater Systems application", href: "/c/approval/app-APP-113" },
  ],
}

type Action =
  | { type: "approve"; id: string; link: "existing" | "new"; role: string; days: number; message: string }
  | { type: "reject"; id: string; reason: string; message: string }
  | { type: "requestInfo"; id: string; asked: string }
  | { type: "synced"; id: string }
  | { type: "extension"; id: string; grant: boolean; days?: number; reason?: string }
  | { type: "acceptApp"; id: string; tier: Tier }
  | { type: "rejectApp"; id: string; reason: string }
  | { type: "escalateApp"; id: string; note: string }
  | { type: "remind"; partnerId: string }
  | { type: "addPartner"; oppId: string; partnerId: string; role: PartnerRole; note: string }
  | { type: "propose"; oppId: string; lines: CreditLine[]; reason: string; evidence: string[] }
  | { type: "withdraw"; oppId: string }
  | { type: "signal"; id: string; status: HealthSignal["status"] }
  | { type: "readNotices" }
  | { type: "reportIssue"; id: string }
  | { type: "sendLead"; id: string; partnerId: string }
  | { type: "addNote"; partnerId: string; text: string }
  // Partner-side actions (Partner executive and sales rep portals)
  | { type: "partnerRegister"; reg: Registration; leadId?: string; by: string }
  | { type: "partnerReply"; id: string; text: string; by: string }
  | { type: "requestExtension"; regId: string; days: number; reason: string; by: string }
  | { type: "leadAccept"; id: string; assignee: string; by: string }
  | { type: "leadDecline"; id: string; reason: string; by: string }
  | { type: "leadUpdate"; id: string; text: string }
  | { type: "invite"; member: TeamMember }
  | { type: "setCanRegister"; id: string; value: boolean }
  | { type: "setMemberStatus"; id: string; status: TeamMember["status"] }
  | { type: "uploadAgreement"; id: string }
  | { type: "dispute"; regId: string; reason: string; by: string }
  // Channel chief actions
  | { type: "chiefSplit"; oppId: string; approve: boolean; reason?: string }
  | { type: "chiefExtension"; id: string; grant: boolean; days?: number; reason?: string }
  | { type: "chiefApp"; id: string; accept: boolean; tier?: Tier; reason?: string }
  | { type: "chiefDeal"; id: string; action: "approve" | "reject" | "nudge"; reason?: string; message?: string }
  | { type: "chiefRequest"; id: string; approve: boolean; note?: string }
  | { type: "chiefAssign"; partnerId: string; to: string; reason: string }
  /** Pause or resume one agent. The channel chief by default; the AI supervisor passes `by`. */
  | { type: "toggleAgent"; id: string; by?: string }
  // partner marketer
  | { type: "launchCampaign"; campaign: Campaign }
  | { type: "handOffLead"; id: string; rep: string; by: string }
  | { type: "returnLead"; id: string; reason: string; by: string }
  | { type: "requestMdf"; req: MdfRequest }
  | { type: "claimMdf"; id: string; amount: number; proof: string[]; results: string }
  // channel chief decides funds (money always needs a human, R-APR-4)
  | { type: "chiefMdf"; id: string; approve: boolean; reason?: string }
  // partner technical lead
  | { type: "logMilestone"; engagementId: string; kind: string; text: string; taskId?: string; by: string }
  | { type: "passExam"; skillId: string }
  // RevOps
  | { type: "resolveException"; id: string; choice: string; note?: string }
  | { type: "proposeRule"; req: ChangeRequest }
  // field seller (co-sell is Stage 2)
  | { type: "sendCoSell"; req: CoSellRequest }
  | { type: "cosellRespond"; id: string; accept: boolean; by: string; owner?: string; reason?: string }
  | { type: "planToggle"; id: string; stepId: string }
  | { type: "planAdd"; id: string; step: PlanStep }
  | { type: "sellerNote"; regId: string; text: string; by: string }
  // CEO / CFO
  | { type: "execDecide"; id: string; approve: boolean; note?: string }
  | { type: "shareBoard" }
  // CRO: asks the person who can act; never decides
  | { type: "croNudge"; nudge: Nudge }
  | { type: "croExport"; rows: number }
  // IT / CRM admin
  | { type: "itConnector"; id: string; approve: boolean; note?: string }
  | { type: "itMapping"; id: string; decision: "approve" | "alt" | "reject"; note?: string }
  | { type: "itGroup"; id: string; role: string }
  | { type: "itTellChief"; userId: string }
  | { type: "itMerge"; exceptionId: string }
  | { type: "itRetry"; writeId: string }
  | { type: "itExport"; rows: number }
  | { type: "itAddUser"; user: StaffUser }
  | { type: "itSetRole"; userId: string; role: string }
  | { type: "itSetStatus"; userId: string; status: "active" | "deactivated"; firstSignIn?: boolean }
  | { type: "itResendInvite"; userId: string }
  // AI supervisor: lowering is immediate, raising goes to the channel chief (R-AG-1)
  | { type: "aiSetLevel"; agent: string; action: string; level: string }
  | { type: "aiRequest"; req: ChangeRequest }
  | { type: "aiPauseAction"; key: string }
  | { type: "aiPauseAll" }
  | { type: "aiReview"; id: string }
  | { type: "aiSetModel"; agent: string; model: string }
  | { type: "aiSetDefaultModel"; model: string }
  // Super admin (platform team)
  | { type: "saCreateOrg"; org: Org }
  | { type: "saOrgStatus"; id: string; status: Org["status"]; reason: string }
  | { type: "saPlan"; id: string; plan: Org["plan"] }
  | { type: "saAiCap"; id: string; cap: number }
  | { type: "saFlag"; flag: string; orgId: string; on: boolean }
  | { type: "saRollout"; version: string; pct: number }
  | { type: "saAiPause" }
  | { type: "saProvider"; id: string; status: sa.Provider["status"] }
  | { type: "saPolicy"; id: string; value: string | boolean }
  | { type: "saEvent"; id: string }
  | { type: "saSupportRequest"; req: SupportAccess }
  | { type: "saSupportEnd"; id: string }
  | { type: "itSupportDecide"; id: string; approve: boolean }
  | { type: "saAnnounce"; a: Announcement }
  | { type: "saAnnounceEnd"; id: string }
  | { type: "saMaintenance" }
  | { type: "saIncident"; id: string; status: sa.Incident["status"] }
  | { type: "saDataRequest"; id: string; status: DataRequest["status"] }
  | { type: "saUser"; email: string; name: string; action: "lock" | "unlock" | "resetMfa" | "signOut" }
  | { type: "saPerm"; key: string; cell: string }
  | { type: "saInvite"; member: PlatformMember }
  | { type: "saInvoice"; id: string; action: "paid" | "remind" }

const stamp = () => NOW.toISOString()
const log = (s: State, text: string, href?: string): ActivityItem[] => [
  { id: `a${Date.now()}${Math.random()}`, at: stamp(), text, href },
  ...s.activity,
]
const partnerName = (s: State, id: string) => s.partners.find((p) => p.id === id)?.name ?? id
const feed = (s: State, text: string, href?: string, rep?: string, companyId?: string): PartnerFeedItem[] => [
  { id: `pf${Date.now()}${Math.random()}`, at: stamp(), text, href, rep, companyId },
  ...s.partnerFeed,
]
const notice = (s: State, title: string, body: string, href: string, tone: Notice["tone"] = "info"): Notice[] => [
  { id: `n${Date.now()}${Math.random()}`, at: stamp(), channel: "In-app", title, body, href, read: false, tone },
  ...s.notices,
]
const CHIEF = "Dana Ortiz"
const OPS = "Ana Costa"
const SELLER = "Sam Rivera"
const CFO = "Morgan Hale"
const CRO = "Priya Shah"
const IT = "Kai Brennan"
const AISUP = "Lee Park"
const agentName = (id: string) => agentRoster.find((x) => x.id === id)?.name ?? agentSeed.find((x) => x.id === id)?.name ?? id
const chiefLog = (s: State, text: string, href?: string): ActivityItem[] => [{ id: `c${Date.now()}${Math.random()}`, at: stamp(), text, href }, ...s.chiefFeed]
const item = (list: ActivityItem[], text: string, href?: string): ActivityItem[] => [{ id: `v${Date.now()}${Math.random()}`, at: stamp(), text, href }, ...list]
/** The partner company a technical lead works for, from the deals they're on (Raj at Northpeak, Theo at Ridgeway). */
const companyOfLead = (s: State, person: string) => s.engagements.find((e) => e.person === person)?.companyId ?? "northpeak"
const daysTo = (iso: string) => Math.ceil((new Date(`${iso}T12:00:00`).getTime() - NOW.getTime()) / 86_400_000)

/** Applies a platform change and writes it to the platform audit log (and Brightline's, when it touches Brightline). */
function plat(s: State, patch: Partial<PlatformState>, text: string, orgId?: string): State {
  const at = stamp()
  const entry: PlatformAudit = { id: `PA-${411 + s.platform.audit.length}`, at, actor: "Rowan Ellis", text, orgId }
  return {
    ...s,
    platform: { ...s.platform, ...patch, audit: [entry, ...s.platform.audit] },
    audit: orgId === "brightline" ? [{ id: `AU-${5121 + s.audit.length - auditSeed.length}`, at, actor: "Rowan Ellis (PRM platform team)", kind: "person", area: "Access", text }, ...s.audit] : s.audit,
  }
}

/** Role-based split (the launch default suggested in D8): role weights, normalised to 100. */
export function modelSplit(lines: { partnerId: string; role: PartnerRole }[]): CreditLine[] {
  const total = lines.reduce((sum, l) => sum + roleWeights[l.role], 0)
  const raw = lines.map((l) => ({ ...l, share: Math.round((roleWeights[l.role] / total) * 100) }))
  const drift = 100 - raw.reduce((sum, l) => sum + l.share, 0)
  if (raw.length) raw[0].share += drift
  return raw
}

function core(s: State, a: Action): State {
  switch (a.type) {
    case "approve": {
      const reg = s.registrations.find((r) => r.id === a.id)!
      const oppId = a.link === "existing" && reg.conflict?.kind === "crm_opportunity" ? reg.conflict.ref : `006Q80000${a.id.replace("REG-", "")}New`
      return {
        ...s,
        registrations: s.registrations.map((r) =>
          r.id === a.id
            ? {
                ...r, state: "approved",
                decision: { by: "you", action: "approved", at: stamp(), message: a.message },
                crm: { opportunityId: oppId, role: a.role, sync: "pending", linked: a.link },
                protectedUntil: addDays(NOW.toISOString().slice(0, 10), a.days),
              }
            : r,
        ),
        notices: s.notices.map((n) => (n.href.endsWith(a.id) ? { ...n, read: true } : n)),
        activity: log(s, `You approved ${reg.customer} for ${partnerName(s, reg.partnerId)}`, `/registration/${a.id}`),
      }
    }
    case "reject": {
      const reg = s.registrations.find((r) => r.id === a.id)!
      return {
        ...s,
        registrations: s.registrations.map((r) =>
          r.id === a.id
            ? { ...r, state: "rejected", decision: { by: "you", action: "rejected", at: stamp(), reason: a.reason, message: a.message } }
            : r,
        ),
        notices: s.notices.map((n) => (n.href.endsWith(a.id) ? { ...n, read: true } : n)),
        activity: log(s, `You rejected ${reg.customer} (${a.reason})`, `/registration/${a.id}`),
      }
    }
    case "requestInfo": {
      const reg = s.registrations.find((r) => r.id === a.id)!
      return {
        ...s,
        registrations: s.registrations.map((r) =>
          r.id === a.id
            ? { ...r, state: "info_requested", infoRequest: { asked: a.asked, at: stamp() }, decision: { by: "you", action: "info_requested", at: stamp() } }
            : r,
        ),
        activity: log(s, `You asked ${partnerName(s, reg.partnerId)} for more on ${reg.customer}; SLA paused`, `/registration/${a.id}`),
      }
    }
    case "synced":
      return {
        ...s,
        registrations: s.registrations.map((r) => (r.id === a.id && r.crm ? { ...r, crm: { ...r.crm, sync: "synced" } } : r)),
      }
    case "extension": {
      const ext = s.extensions.find((e) => e.id === a.id)!
      return {
        ...s,
        extensions: s.extensions.map((e) =>
          e.id === a.id ? { ...e, status: a.grant ? "granted" : "denied", decidedDays: a.days, denyReason: a.reason } : e,
        ),
        activity: log(
          s,
          a.grant ? `You extended ${ext.customer} protection by ${a.days} days` : `You declined the ${ext.customer} extension`,
        ),
      }
    }
    case "acceptApp": {
      const app = s.applications.find((x) => x.id === a.id)!
      const id = app.company.toLowerCase().replace(/[^a-z]/g, "")
      const partner: Partner = {
        id, name: app.company, program: app.program, tier: a.tier, region: app.region, assigned: true, status: "onboarding",
        quality: 0.7, pipeline: 0, wonThisYear: 0, lastActivity: stamp(), contact: app.applicant,
      }
      return {
        ...s,
        applications: s.applications.map((x) => (x.id === a.id ? { ...x, status: "accepted" } : x)),
        partners: [...s.partners, partner],
        onboarding: [
          { partnerId: id, acceptedAt: stamp(), eligible: false, firstDeal: false, idleDays: 0,
            steps: seed.onboardingSteps([0, 2], [0, 2], [0, 3], ["Partner agreement (sent just now)", "Tax form, Certificate of insurance", "Complete profile, Add users, Registration basics"]) },
          ...s.onboarding,
        ],
        activity: log(s, `You accepted ${app.company}; onboarding started`, `/partners/onboarding`),
      }
    }
    case "rejectApp": {
      const app = s.applications.find((x) => x.id === a.id)!
      return {
        ...s,
        applications: s.applications.map((x) => (x.id === a.id ? { ...x, status: "rejected", outcomeNote: a.reason } : x)),
        activity: log(s, `You declined ${app.company}'s application (${a.reason})`),
      }
    }
    case "escalateApp": {
      const app = s.applications.find((x) => x.id === a.id)!
      return {
        ...s,
        applications: s.applications.map((x) => (x.id === a.id ? { ...x, status: "escalated", outcomeNote: a.note } : x)),
        activity: log(s, `You sent ${app.company}'s application to ${seed.me.chief}`),
      }
    }
    case "remind":
      return {
        ...s,
        reminders: { ...s.reminders, [a.partnerId]: stamp() },
        activity: log(s, `You sent ${partnerName(s, a.partnerId)} an onboarding reminder`),
      }
    case "addPartner": {
      return {
        ...s,
        opportunities: s.opportunities.map((o) => {
          if (o.id !== a.oppId) return o
          const lines = modelSplit([...o.lines, { partnerId: a.partnerId, role: a.role }])
          return {
            ...o, lines, splitSource: "model",
            versions: [{ version: o.versions.length + 1, at: stamp(), by: "Attribution agent", note: `Split recalculated after you added ${partnerName(s, a.partnerId)} as ${a.role}`, lines }, ...o.versions],
            touches: a.note && !o.touches.some((t) => t.partnerId === a.partnerId && t.text === a.note)
              ? [...o.touches, { id: `t${Date.now()}`, at: stamp(), partnerId: a.partnerId, kind: "Added by you", text: a.note }]
              : o.touches,
          }
        }),
        activity: log(s, `You added ${partnerName(s, a.partnerId)} to an opportunity as ${a.role}`, `/opportunity/${a.oppId}`),
      }
    }
    case "propose":
      return {
        ...s,
        opportunities: s.opportunities.map((o) =>
          o.id === a.oppId ? { ...o, proposal: { lines: a.lines, reason: a.reason, evidence: a.evidence, at: stamp(), approver: seed.me.chief } } : o,
        ),
        activity: log(s, `You proposed a credit split change for ${seed.me.chief} to approve`, `/opportunity/${a.oppId}`),
      }
    case "withdraw":
      return {
        ...s,
        opportunities: s.opportunities.map((o) => (o.id === a.oppId ? { ...o, proposal: undefined } : o)),
      }
    case "signal":
      return { ...s, health: s.health.map((h) => (h.id === a.id ? { ...h, status: a.status } : h)) }
    case "readNotices":
      return { ...s, notices: s.notices.map((n) => ({ ...n, read: true })) }
    case "sendLead": {
      const lead = s.leads.find((l) => l.id === a.id)!
      const due = new Date(NOW.getTime() + 48 * 3600 * 1000).toISOString()
      return {
        ...s,
        leads: s.leads.map((l) => (l.id === a.id ? { ...l, status: "offered", partnerId: a.partnerId, sentAt: stamp(), acceptBy: due, declineReason: undefined } : l)),
        activity: log(s, `You sent the ${lead.company} lead to ${partnerName(s, a.partnerId)}`, "/deals/leads"),
      }
    }
    case "addNote":
      return { ...s, notes: { ...s.notes, [a.partnerId]: [{ at: stamp(), text: a.text }, ...(s.notes[a.partnerId] ?? [])] } }
    case "reportIssue":
      return { ...s, crmIssues: s.crmIssues.map((i) => (i.id === a.id ? { ...i, reported: true } : i)) }

    /* ---------- partner side ---------- */
    case "partnerRegister": {
      const r = a.reg
      const auto = r.decision?.by === "rules"
      return {
        ...s,
        registrations: [r, ...s.registrations],
        leads: a.leadId ? s.leads.map((l) => (l.id === a.leadId ? { ...l, status: "converted", registrationId: r.id } : l)) : s.leads,
        campaignLeads: a.leadId ? s.campaignLeads.map((l) => (l.id === a.leadId ? { ...l, status: "converted", registrationId: r.id } : l)) : s.campaignLeads,
        partnerFeed: [
          ...(r.campaignId ? feed(s, `${r.rep} registered ${r.customer} from your campaign: ${money(r.value)} of pipeline`, "/p/campaigns", s.campaigns.find((c) => c.id === r.campaignId)?.owner).slice(0, 1) : []),
          ...feed(s, auto ? `Rules approved ${r.customer} in ${r.decision!.seconds} seconds` : `${r.customer} is with Jordan Lee for review`, `/p/deal/${r.id}`, r.rep),
        ],
        notices: auto ? s.notices : notice(s, "New registration needs you", `${partnerName(s, r.partnerId)} · ${r.customer} · ${money(r.value)}`, `/registration/${r.id}`),
        activity: log(s, auto ? `Rules approved ${r.customer} for ${partnerName(s, r.partnerId)} in ${r.decision!.seconds} seconds` : `${a.by} registered ${r.customer}; it needs your review`, `/registration/${r.id}`),
      }
    }
    case "partnerReply": {
      const reg = s.registrations.find((r) => r.id === a.id)!
      return {
        ...s,
        registrations: s.registrations.map((r) =>
          r.id === a.id ? { ...r, state: "under_review", decision: undefined, infoReply: { text: a.text, at: stamp(), by: a.by } } : r,
        ),
        partnerFeed: feed(s, `${a.by} answered Jordan's question on ${reg.customer}; the review clock resumed`, `/p/deal/${a.id}`, reg.rep),
        notices: notice(s, `${a.by.split(" ")[0]} replied on ${reg.customer}`, "The SLA has resumed from where it paused", `/registration/${a.id}`),
        activity: log(s, `${a.by} answered your question on ${reg.customer}; SLA resumed`, `/registration/${a.id}`),
      }
    }
    case "requestExtension": {
      const reg = s.registrations.find((r) => r.id === a.regId)!
      const ext: ExtensionRequest = {
        id: `EXT-${320 + s.extensions.length}`, registrationId: reg.id, partnerId: reg.partnerId, customer: reg.customer, value: reg.value,
        protectionEnds: reg.protectedUntil!, daysLeft: daysTo(reg.protectedUntil!), requestedDays: a.days, reason: a.reason,
        crmStage: reg.crmStage ?? "Open", lastActivity: "Today · requested by the partner", previousExtensions: 0,
        ai: {
          action: "grant", headline: `Grant ${a.days} days`, confidence: 0.84, days: a.days,
          evidence: [`The deal is in ${reg.crmStage ?? "an open stage"} in Salesforce.`, "First extension request for this deal.", "The partner gave a dated reason."],
        },
        status: "pending",
      }
      return {
        ...s,
        extensions: [ext, ...s.extensions],
        partnerFeed: feed(s, `${a.by} asked Jordan for ${a.days} more days on ${reg.customer}`, `/p/deal/${reg.id}`, reg.rep),
        notices: notice(s, "Extension request", `${partnerName(s, reg.partnerId)} · ${reg.customer} · ${a.days} days`, "/queue/extensions", "warn"),
        activity: log(s, `${partnerName(s, reg.partnerId)} asked to extend ${reg.customer} by ${a.days} days`, "/queue/extensions"),
      }
    }
    case "leadAccept": {
      const lead = s.leads.find((l) => l.id === a.id)!
      const self = a.assignee === a.by
      return {
        ...s,
        leads: s.leads.map((l) => (l.id === a.id ? { ...l, status: "accepted", assignee: a.assignee, update: self ? `Accepted by ${a.by}` : `Accepted by ${a.by}; assigned to ${a.assignee}` } : l)),
        partnerFeed: feed(s, self ? `${a.by} accepted the ${lead.company} lead` : `${a.by} accepted ${lead.company} and assigned it to ${a.assignee}`, "/p/leads", a.assignee),
        notices: notice(s, `${partnerName(s, lead.partnerId!)} accepted a lead`, `${lead.company} · owner ${a.assignee}`, "/deals/leads"),
        activity: log(s, `${partnerName(s, lead.partnerId!)} accepted the ${lead.company} lead`, "/deals/leads"),
      }
    }
    case "leadDecline": {
      const lead = s.leads.find((l) => l.id === a.id)!
      return {
        ...s,
        leads: s.leads.map((l) => (l.id === a.id ? { ...l, status: "declined", declineReason: a.reason } : l)),
        partnerFeed: feed(s, `${a.by} declined the ${lead.company} lead (${a.reason})`, "/p/leads", lead.assignee),
        notices: notice(s, `${partnerName(s, lead.partnerId!)} declined a lead`, `${lead.company} · ${a.reason}`, "/deals/leads", "warn"),
        activity: log(s, `${partnerName(s, lead.partnerId!)} declined the ${lead.company} lead`, "/deals/leads"),
      }
    }
    case "leadUpdate":
      return { ...s, leads: s.leads.map((l) => (l.id === a.id ? { ...l, update: a.text } : l)) }
    case "invite":
      return { ...s, team: [...s.team, a.member], partnerFeed: feed(s, `Paul invited ${a.member.name} as ${a.member.role}`, "/p/team") }
    case "setCanRegister":
      return { ...s, team: s.team.map((m) => (m.id === a.id ? { ...m, canRegister: a.value } : m)) }
    case "setMemberStatus":
      return { ...s, team: s.team.map((m) => (m.id === a.id ? { ...m, status: a.status } : m)) }
    case "uploadAgreement":
      return {
        ...s,
        agreements: s.agreements.map((g) => (g.id === a.id ? { ...g, status: "on_file", detail: "Renewed certificate uploaded today · valid to Nov 30, 2027" } : g)),
        partnerFeed: feed(s, "Paul uploaded the renewed certificate of insurance", "/p/program"),
      }
    /* ---------- channel chief ---------- */
    case "chiefSplit": {
      const o = s.opportunities.find((x) => x.id === a.oppId)!
      const p = o.proposal!
      return {
        ...s,
        opportunities: s.opportunities.map((x) =>
          x.id !== a.oppId ? x : a.approve
            ? { ...x, lines: p.lines, splitSource: "override", proposal: undefined, proposalOutcome: { approved: true, by: CHIEF, at: stamp() },
                versions: [{ version: x.versions.length + 1, at: stamp(), by: `${CHIEF} approved Jordan Lee's proposal`, note: p.reason, lines: p.lines }, ...x.versions] }
            : { ...x, proposal: undefined, proposalOutcome: { approved: false, by: CHIEF, at: stamp(), reason: a.reason } },
        ),
        notices: notice(s, a.approve ? `Dana approved your split on ${o.account}` : `Dana declined your split on ${o.account}`, a.approve ? "The new split is live and partners were told why" : a.reason ?? "", `/opportunity/${o.id}`, a.approve ? "info" : "warn"),
        activity: log(s, a.approve ? `${CHIEF} approved your credit split on ${o.account}` : `${CHIEF} declined your credit split on ${o.account}`, `/opportunity/${o.id}`),
        chiefFeed: chiefLog(s, a.approve ? `You approved the new credit split on ${o.account}` : `You declined the split proposal on ${o.account}`, `/c/approvals/done`),
      }
    }
    case "chiefExtension": {
      const ext = s.extensions.find((e) => e.id === a.id)!
      return {
        ...s,
        extensions: s.extensions.map((e) => (e.id === a.id ? { ...e, status: a.grant ? "granted" : "denied", decidedDays: a.days, denyReason: a.reason } : e)),
        registrations: a.grant ? s.registrations.map((r) => (r.id === ext.registrationId && r.protectedUntil ? { ...r, protectedUntil: addDays(r.protectedUntil, a.days ?? 30) } : r)) : s.registrations,
        notices: notice(s, `Dana ${a.grant ? "granted" : "declined"} the ${ext.customer} extension`, a.grant ? `${a.days} more days` : a.reason ?? "", "/queue/extensions"),
        activity: log(s, a.grant ? `${CHIEF} granted a second extension on ${ext.customer} (${a.days} days)` : `${CHIEF} declined the second extension on ${ext.customer}`, "/queue/extensions"),
        chiefFeed: chiefLog(s, a.grant ? `You granted ${ext.customer} ${a.days} more days` : `You declined the ${ext.customer} extension`, "/c/approvals/done"),
      }
    }
    case "chiefApp": {
      const app = s.applications.find((x) => x.id === a.id)!
      const id = app.company.toLowerCase().replace(/[^a-z]/g, "")
      return {
        ...s,
        applications: s.applications.map((x) => (x.id === a.id ? { ...x, status: a.accept ? "accepted" : "rejected", outcomeNote: a.accept ? `Accepted by ${CHIEF} at ${a.tier}` : a.reason } : x)),
        partners: a.accept
          ? [...s.partners, { id, name: app.company, program: app.program, tier: a.tier!, region: app.region, assigned: true, status: "onboarding", quality: 0.7, pipeline: 0, wonThisYear: 0, lastActivity: stamp(), contact: app.applicant }]
          : s.partners,
        onboarding: a.accept
          ? [{ partnerId: id, acceptedAt: stamp(), eligible: false, firstDeal: false, idleDays: 0, steps: seed.onboardingSteps([0, 2], [0, 2], [0, 3], ["Partner agreement (sent just now)", "Tax form, Certificate of insurance", "Complete profile, Add users, Registration basics"]) }, ...s.onboarding]
          : s.onboarding,
        notices: notice(s, `Dana ${a.accept ? "accepted" : "declined"} ${app.company}`, a.accept ? `Starting tier: ${a.tier}. Onboarding started with you` : a.reason ?? "", "/partners/onboarding"),
        activity: log(s, a.accept ? `${CHIEF} accepted ${app.company} at ${a.tier}; onboarding started` : `${CHIEF} declined ${app.company}'s application`, "/partners/onboarding"),
        chiefFeed: chiefLog(s, a.accept ? `You accepted ${app.company} as a ${a.tier} partner` : `You declined ${app.company}`, "/c/approvals/done"),
      }
    }
    case "chiefDeal": {
      const reg = s.registrations.find((r) => r.id === a.id)!
      if (a.action === "nudge")
        return {
          ...s,
          notices: notice(s, `Dana asked you to decide ${reg.customer}`, a.message ?? "It's past 80% of its review deadline", `/registration/${reg.id}`, "bad"),
          chiefFeed: chiefLog(s, `You asked Jordan Lee to decide ${reg.customer} today`, `/c/approval/reg-${reg.id}`),
        }
      const approve = a.action === "approve"
      return {
        ...s,
        registrations: s.registrations.map((r) =>
          r.id !== a.id ? r : approve
            ? { ...r, state: "approved", decision: { by: "you", actor: CHIEF, action: "approved", at: stamp(), message: a.message }, crm: { opportunityId: `006Q80000${a.id.replace("REG-", "")}New`, role: r.program === "Services" ? "Sourced" : "Reseller", sync: "synced", linked: "new" }, protectedUntil: addDays(NOW.toISOString().slice(0, 10), 90), crmStage: "Discovery" }
            : { ...r, state: "rejected", decision: { by: "you", actor: CHIEF, action: "rejected", at: stamp(), reason: a.reason, message: a.message } },
        ),
        notices: notice(s, `Dana ${approve ? "approved" : "rejected"} ${reg.customer}`, "Escalated at 80% of its review deadline", `/registration/${reg.id}`),
        activity: log(s, `${CHIEF} ${approve ? "approved" : "rejected"} ${reg.customer} for ${partnerName(s, reg.partnerId)} (escalated)`, `/registration/${reg.id}`),
        partnerFeed: reg.partnerId === "ridgeway" ? feed(s, `Dana Ortiz ${approve ? "approved" : "didn't approve"} ${reg.customer}`, `/p/deal/${reg.id}`, reg.rep) : s.partnerFeed,
        chiefFeed: chiefLog(s, `You ${approve ? "approved" : "rejected"} ${reg.customer} for ${partnerName(s, reg.partnerId)}`, "/c/approvals/done"),
      }
    }
    case "chiefRequest": {
      const r = s.requests.find((x) => x.id === a.id)!
      // An approved rule change becomes a new version of each program's rules and takes effect straight away.
      const programRules = { ...s.programRules }
      if (a.approve && r.kind === "rule" && r.programs !== "all")
        for (const p of r.programs) {
          const cur = programRules[p]
          programRules[p] = { ...cur, ...(r.patch ?? { autoApproveTop: 75_000 }), version: cur.version + 1, history: [{ version: cur.version + 1, at: stamp(), by: `${CHIEF} approved ${r.from}'s ${r.launch ? "set-up" : "change"}`, note: r.proposed }, ...cur.history] }
        }
      const scope = r.programs === "all" ? "every program" : r.programs.map((p) => `the ${p} program`).join(", ")
      // An approved autonomy change sets that agent action's level; the chief sees the agent's headline action.
      const agentId = r.agent ?? "deal-desk"
      const actId = r.action ?? "decide"
      const lvl = r.level ?? "A4"
      const raised = a.approve && r.kind === "autonomy"
      const headline = agentRoster.find((x) => x.id === agentId)?.headline === actId
      return {
        ...s,
        requests: s.requests.map((x) => (x.id === a.id ? { ...x, status: a.approve ? "approved" : "declined", note: a.note } : x)),
        programRules,
        launched: a.approve && r.launch && r.programs !== "all" ? [...s.launched, ...r.programs] : s.launched,
        opsFeed: r.from === OPS ? item(s.opsFeed, `${CHIEF} ${a.approve ? "approved" : "declined"}: ${r.title}${a.note ? `. "${a.note}"` : ""}`, "/v/programs") : s.opsFeed,
        aisupFeed: r.from === AISUP ? item(s.aisupFeed, `${CHIEF} ${a.approve ? "approved" : "declined"}: ${r.title}${a.note ? `. "${a.note}"` : ""}`, `/v/agent/${agentId}`) : s.aisupFeed,
        agentLevels: raised && headline ? { ...s.agentLevels, [agentId]: lvl } : s.agentLevels,
        actionLevels: raised ? { ...s.actionLevels, [actionKey(agentId, actId)]: lvl } : s.actionLevels,
        notices: a.approve && r.kind === "rule"
          ? notice(s, "Program rules changed", `${r.title}. Applies to ${scope}, whoever looks after the partner.`, "/home")
          : raised && agentId === "deal-desk"
            ? notice(s, "The Deal Desk agent can do more on its own", `${r.title}. Approved by ${CHIEF}; every action is logged and can be reversed.`, "/queue")
            : s.notices,
        activity: a.approve && r.kind === "rule" ? log(s, `${CHIEF} approved a rule change for ${scope}: ${r.proposed}`) : s.activity,
        chiefFeed: chiefLog(s, `You ${a.approve ? "approved" : "declined"}: ${r.title}`, "/c/program"),
      }
    }
    /* ---------- partner marketer ---------- */
    case "launchCampaign": {
      const c = a.campaign
      return {
        ...s,
        campaigns: [c, ...s.campaigns.filter((x) => x.id !== c.id)],
        partnerFeed: feed(s, c.status === "live" ? `${c.name} is live with your tracked link` : `${c.name} is scheduled for ${c.start}`, `/p/campaign/${c.id}`, c.owner),
      }
    }
    case "handOffLead": {
      const l = s.campaignLeads.find((x) => x.id === a.id)!
      const handed = { id: `pf${Date.now()}h`, at: stamp(), text: `${a.by} handed you a campaign lead: ${l.company}`, href: "/p/leads", rep: a.rep }
      return {
        ...s,
        campaignLeads: s.campaignLeads.map((x) => (x.id === a.id ? { ...x, status: "with_rep", assignee: a.rep, handedAt: stamp(), returnReason: undefined } : x)),
        partnerFeed: [handed, ...feed(s, `You handed ${l.company} to ${a.rep}`, "/p/leads", a.by)],
      }
    }
    case "returnLead": {
      const l = s.campaignLeads.find((x) => x.id === a.id)!
      const owner = s.campaigns.find((c) => c.id === l.campaignId)?.owner
      return {
        ...s,
        campaignLeads: s.campaignLeads.map((x) => (x.id === a.id ? { ...x, status: "returned", returnReason: a.reason } : x)),
        partnerFeed: feed(s, `${a.by} handed ${l.company} back: ${a.reason}`, "/p/leads", owner),
      }
    }
    case "requestMdf": {
      const r = a.req
      return {
        ...s,
        mdf: [r, ...s.mdf],
        campaigns: r.campaignId ? s.campaigns.map((c) => (c.id === r.campaignId ? { ...c, mdfId: r.id } : c)) : s.campaigns,
        partnerFeed: feed(s, `Your ${money(r.amount)} funds request for ${r.campaign} is with Brightline`, "/p/funds", r.requestedBy),
        chiefFeed: chiefLog(s, `${r.requestedBy} (${partnerName(s, r.companyId)}) asked for ${money(r.amount)} of marketing funds`, `/c/approval/mdf-${r.id}`),
        notices: notice(s, `${partnerName(s, r.companyId)} asked for marketing funds`, `${money(r.amount)} for ${r.campaign} · Dana Ortiz decides`, `/partner/${r.companyId}`),
        activity: log(s, `${r.requestedBy} (${partnerName(s, r.companyId)}) asked Dana Ortiz for ${money(r.amount)} of marketing funds`, `/partner/${r.companyId}`),
      }
    }
    case "claimMdf": {
      const r = s.mdf.find((x) => x.id === a.id)!
      return {
        ...s,
        mdf: s.mdf.map((x) => (x.id === a.id ? { ...x, status: "claimed", claim: { amount: a.amount, at: stamp(), proof: a.proof, results: a.results } } : x)),
        partnerFeed: feed(s, `Your ${money(a.amount)} claim for ${r.campaign} is with Brightline`, "/p/funds", r.requestedBy),
        chiefFeed: chiefLog(s, `${r.requestedBy} (${partnerName(s, r.companyId)}) filed a ${money(a.amount)} funds claim`, `/c/approval/mdf-${r.id}`),
      }
    }
    case "chiefMdf": {
      const r = s.mdf.find((x) => x.id === a.id)!
      const claim = r.status === "claimed"
      const status: MdfRequest["status"] = claim ? (a.approve ? "paid" : "claim_rejected") : a.approve ? "approved" : "rejected"
      const amount = claim ? r.claim!.amount : r.amount
      return {
        ...s,
        mdf: s.mdf.map((x) => (x.id === a.id ? { ...x, status, decidedBy: CHIEF, decidedAt: stamp(), reason: a.reason, claimDue: !claim && a.approve ? "2027-01-31" : x.claimDue, paidAt: claim && a.approve ? stamp() : x.paidAt } : x)),
        campaigns: !claim && !a.approve ? s.campaigns : s.campaigns.map((c) => (c.id === r.campaignId && c.status === "draft" && a.approve ? { ...c, note: "Funds approved: ready to launch" } : c)),
        partnerFeed: feed(s, claim
          ? (a.approve ? `Dana Ortiz approved your ${money(amount)} claim for ${r.campaign}; payment is on its way` : `Dana Ortiz declined your claim for ${r.campaign}: ${a.reason}`)
          : (a.approve ? `Dana Ortiz approved ${money(amount)} for ${r.campaign}` : `Dana Ortiz declined your funds request for ${r.campaign}: ${a.reason}`), "/p/funds", r.requestedBy),
        chiefFeed: chiefLog(s, `You ${a.approve ? "approved" : "declined"} ${partnerName(s, r.companyId)}'s ${money(amount)} funds ${claim ? "claim" : "request"}`, "/c/approvals/done"),
      }
    }

    /* ---------- partner technical lead ---------- */
    case "logMilestone": {
      const e = s.engagements.find((x) => x.id === a.engagementId)!
      const reg = e.regId ? s.registrations.find((r) => r.id === e.regId) : undefined
      const oppId = e.oppId ?? reg?.crm?.opportunityId
      if (!oppId) return s
      const touch = { id: `t${Date.now()}`, at: stamp(), partnerId: e.companyId, kind: a.kind, text: a.text, by: a.by }
      // An approved registration has a Salesforce opportunity; create our copy of it the first time someone logs against it.
      const exists = s.opportunities.some((o) => o.id === oppId)
      const opportunities = exists
        ? s.opportunities.map((o) => (o.id === oppId ? { ...o, touches: [...o.touches, touch] } : o))
        : [{ id: oppId, name: `${e.account} – ${e.product}`, account: e.account, value: e.value, stage: reg?.crmStage ?? "Discovery", closeDate: reg?.closeDate ?? "2027-01-30", owner: e.brightlineAe,
            lines: [{ partnerId: e.companyId, role: (reg?.crm?.role as PartnerRole) ?? "Sourced", share: 100 }], splitSource: "model" as const, versions: [], touches: [touch] }, ...s.opportunities]
      // Sell-Ready is earned by delivering on a real deal in that product once certified (R-GR-3).
      const delivers = ["Workshop", "Design sign-off", "Pilot / POC"].includes(a.kind)
      const skills = s.skills.map((k) =>
        k.person === a.by && delivers && k.level === "Certified" && e.product.includes(k.product)
          ? { ...k, level: "Sell-Ready" as const, evidence: [...k.evidence, { level: "Sell-Ready" as const, text: `${a.kind} on ${e.account}`, at: stamp().slice(0, 10) }], next: `Proven happens automatically when ${e.account}, or another ${k.product} deal you work on, closes won.`, needFor: undefined }
          : k,
      )
      const upgraded = skills.find((k, i) => k.level !== s.skills[i].level)
      return {
        ...s,
        opportunities,
        skills,
        engagements: s.engagements.map((x) => (x.id === e.id ? { ...x, oppId, tasks: x.tasks.map((t) => (t.id === a.taskId ? { ...t, status: "done", doneAt: stamp().slice(0, 10) } : t)) } : x)),
        partnerFeed: [
          ...(upgraded ? feed(s, `You're now Sell-Ready in ${upgraded.product}`, "/p/skills", a.by, e.companyId).slice(0, 1) : []),
          ...feed(s, `${a.kind} on ${e.account} recorded as a touch. The attribution agent counts it as evidence`, `/p/work/${e.id}`, a.by, e.companyId),
        ],
        notices: notice(s, `${partnerName(s, e.companyId)} logged a delivery milestone`, `${e.account} · ${a.kind} · ${a.by}`, `/opportunity/${oppId}`),
        activity: log(s, `${a.by} (${partnerName(s, e.companyId)}) logged ${a.kind.toLowerCase()} on ${e.account}`, `/opportunity/${oppId}`),
      }
    }
    case "passExam": {
      const k = s.skills.find((x) => x.id === a.skillId)!
      const co = companyOfLead(s, k.person)
      const ridgeway = co === "ridgeway"
      return {
        ...s,
        skills: s.skills.map((x) => (x.id === a.skillId ? {
          ...x, level: "Certified", course: undefined, expires: addDays(NOW.toISOString().slice(0, 10), 730),
          evidence: [...x.evidence, { level: "Certified", text: `${x.product} technical certification exam (86%)`, at: NOW.toISOString().slice(0, 10) }],
          next: `Sell-Ready when you deliver a workshop, design or pilot on a ${x.product} deal${x.needFor ? (ridgeway ? " such as Copperline Mining" : " such as Kestrel Energy") : ""}.`, needFor: undefined,
        } : x)),
        partnerFeed: ridgeway
          ? [
              ...feed(s, `You're certified in ${k.product}. Ridgeway now has its certified technical lead for Platinum`, "/p/skills", k.person, co),
              ...feed(s, `${k.person} passed the ${k.product} exam: Ridgeway has a certified technical lead for Platinum`, "/p/program", "Paul Okafor", co).slice(0, 1),
            ]
          : feed(s, `You're certified in ${k.product}. ${partnerName(s, co).split(" ")[0]}'s capability score went up`, "/p/skills", k.person, co),
        notices: notice(s, `${k.person} (${partnerName(s, co)}) is certified in ${k.product}`, "Brightline's partner ranking counts it straight away", `/partner/${co}`),
      }
    }

    /* ---------- RevOps ---------- */
    case "resolveException": {
      const x = s.exceptions.find((e) => e.id === a.id)!
      let next: Partial<State> = {}
      let status: DataException["status"] = "resolved"
      let text = ""
      let ledgerId: string | undefined
      if (x.kind === "mismatch" && a.choice === "ledger") {
        const o = s.opportunities.find((y) => y.id === x.oppId)!
        const sf = x.sfAmount ?? o.value
        const diff = sf - o.value
        ledgerId = `LE-${204 + s.ledger.length}`
        const names = o.lines.map((l) => partnerName(s, l.partnerId)).join(" and ")
        text = `Ledger entry ${ledgerId}: ${diff < 0 ? "−" : "+"}${money(Math.abs(diff))} to match Salesforce. Credit released to ${names}.`
        next = {
          opportunities: s.opportunities.map((y) => (y.id === o.id ? { ...y, value: sf, reconciliation: "matched", reconciliationNote: `Matches Salesforce closed-won: ${money(sf)}, after ledger entry ${ledgerId} by ${OPS} (RevOps)` } : y)),
          ledger: [{ id: ledgerId, at: stamp(), account: o.account, oppId: o.id, text: `Correction to match Salesforce closed-won: ${money(o.value)} → ${money(sf)}. Shares unchanged; credit released`, amount: diff, by: OPS }, ...s.ledger],
          crmIssues: s.crmIssues.filter((i) => i.id !== x.issueId),
          notices: notice(s, `${o.account} is reconciled`, `${OPS} (RevOps) matched it to Salesforce: ${money(sf)}. Partner credit is released`, `/opportunity/${o.id}`),
          activity: log(s, `${OPS} (RevOps) reconciled ${o.account} to Salesforce closed-won (${money(sf)})`, `/opportunity/${o.id}`),
        }
      } else if (x.kind === "mismatch") {
        status = "waiting"
        text = "Asked Alex Morgan, the opportunity owner, to check the amount in Salesforce. Credit stays on hold meanwhile."
        next = { crmIssues: s.crmIssues.map((i) => (i.id === x.issueId ? { ...i, reported: true } : i)) }
      } else if (x.kind === "write" && a.choice === "retry") {
        text = "Retried and written: Atlas Integrators is the Implementation partner on the opportunity in Salesforce."
        next = {
          crmWrites: s.crmWrites.map((w) => (w.href === `/registration/${x.regId}` && w.status !== "synced" ? { ...w, status: "synced", attempt: undefined } : w)),
          crmIssues: s.crmIssues.filter((i) => i.id !== x.issueId),
          activity: log(s, `${OPS} (RevOps) retried the Salesforce write on Orion Labs; it's in Salesforce now`, `/registration/${x.regId}`),
        }
      } else if (x.kind === "write") {
        status = "waiting"
        text = "Left to the automatic retries. Next try in 3 minutes; you're told if all 5 fail."
      } else if (x.kind === "match") {
        text = a.choice === "same" ? "Treated as one company: conflict checks now cover both records. Kai Brennan (CRM admin) was asked to merge them in Salesforce." : "Kept apart as two companies. The agent won't flag this pair again."
      } else if (a.choice === "jordan") {
        status = "waiting"
        text = "Sent to Jordan Lee to check with Summit Resale."
        next = { notices: notice(s, `${OPS} (RevOps): Orchid Foods has gone quiet`, "No Salesforce activity for 52 days and protection ends Nov 1. Can you check with Summit Resale?", `/registration/${x.regId}`, "warn") }
      } else {
        text = "Reviewed. Nothing changed; protection ends on Nov 1 as planned."
      }
      if (a.note) text = `${text} Note: ${a.note}`
      return {
        ...s,
        ...next,
        exceptions: s.exceptions.map((e) => (e.id === a.id ? { ...e, status, resolution: { by: OPS, at: stamp(), text, ledgerId, choice: a.choice } } : e)),
        opsFeed: item(s.opsFeed, `You ${status === "waiting" ? "handed on" : "resolved"}: ${x.title}`, `/v/exception/${x.id}`),
      }
    }
    case "proposeRule": {
      // A new program is added straight away as "Not launched", with the template's rules as version 0.
      const np = a.req.newProgram
      const tpl = np?.template ? s.programRules[np.template] : undefined
      const programRules = np && tpl
        ? { ...s.programRules, [np.id]: { ...tpl, ...a.req.patch, autoApproveTop: undefined, version: 0, history: [{ version: 0, at: stamp(), by: `${OPS} set it up from the ${np.template} template`, note: "Not launched: waiting for the channel chief" }] } }
        : s.programRules
      return {
        ...s,
        programRules,
        customPrograms: np && !s.customPrograms.some((p) => p.id === np.id) ? [...s.customPrograms, np] : s.customPrograms,
        requests: [a.req, ...s.requests],
        chiefFeed: chiefLog(s, `${a.req.from} (${a.req.fromRole}) sent you a ${a.req.launch ? "new program" : "rule change"}: ${a.req.title}`, `/c/approval/req-${a.req.id}`),
        opsFeed: item(s.opsFeed, `You sent ${CHIEF} ${a.req.launch ? "a new program" : "a rule change"}: ${a.req.title}`, "/v/programs"),
      }
    }

    /* ---------- field seller ---------- */
    case "sendCoSell": {
      const r = a.req
      const acct = sellerAccounts.find((x) => x.id === r.accountId)!
      return {
        ...s,
        cosell: [r, ...s.cosell],
        sellerFeed: item(s.sellerFeed, `You asked ${partnerName(s, r.partnerId)} to co-sell ${acct.name}`, `/v/cosell`),
        partnerFeed: r.partnerId === "ridgeway" ? feed(s, `${SELLER} (Brightline) asked you to co-sell a ${acct.industry.toLowerCase()} deal. Accept within 48 hours to see the account`, "/p/leads/cosell", r.contact) : s.partnerFeed,
        activity: log(s, `${SELLER} (Brightline seller) sent ${partnerName(s, r.partnerId)} a co-sell request`),
      }
    }
    case "cosellRespond": {
      const r = s.cosell.find((x) => x.id === a.id)!
      const acct = sellerAccounts.find((x) => x.id === r.accountId)!
      const partner = partnerName(s, r.partnerId)
      if (!a.accept)
        return {
          ...s,
          cosell: s.cosell.map((x) => (x.id === a.id ? { ...x, status: "declined", decidedBy: a.by, decidedAt: stamp(), declineReason: a.reason } : x)),
          sellerFeed: item(s.sellerFeed, `${partner} declined your co-sell request on ${acct.name}: ${a.reason}`, `/v/account/${acct.id}`),
        }
      const owner = a.owner ?? a.by
      const today = stamp().slice(0, 10)
      const touch = { id: `t${Date.now()}`, at: stamp(), partnerId: r.partnerId, kind: "Co-sell", text: `Accepted ${SELLER}'s co-sell request as ${r.role} partner`, by: a.by }
      const oppId = acct.oppId!
      const exists = s.opportunities.some((o) => o.id === oppId)
      const opportunities = exists
        ? s.opportunities.map((o) => {
            if (o.id !== oppId) return o
            const lines = o.lines.some((l) => l.partnerId === r.partnerId) ? o.lines : modelSplit([...o.lines, { partnerId: r.partnerId, role: r.role }])
            return { ...o, lines, touches: [...o.touches, touch] }
          })
        : [{ id: oppId, name: acct.oppName ?? acct.name, account: acct.name, value: acct.value, stage: acct.stage, closeDate: acct.closeDate, owner: SELLER,
            lines: [{ partnerId: r.partnerId, role: r.role, share: 100 }], splitSource: "model" as const,
            versions: [{ version: 1, at: stamp(), by: "Attribution agent", note: `${partner} joined through ${SELLER}'s co-sell request`, lines: [] }], touches: [touch] }, ...s.opportunities]
      const partnerFeed = r.partnerId === "ridgeway"
        ? feed(s, `You're working ${acct.name} with ${SELLER} (Brightline). The joint plan is ready`, "/p/leads/cosell", owner)
        : r.partnerId === "northpeak"
          ? feed(s, `${a.by} accepted a Grid analytics co-sell with ${SELLER} on ${acct.name}. You're likely to lead the design`, "/p/work", "Raj Mehta", "northpeak")
          : s.partnerFeed
      return {
        ...s,
        cosell: s.cosell.map((x) => (x.id === a.id ? { ...x, status: "accepted", decidedBy: a.by, decidedAt: stamp(), owner, plan: x.plan.length ? x.plan : defaultPlan(owner, partner, r.role, today, addDays) } : x)),
        opportunities,
        partnerFeed,
        sellerFeed: item(s.sellerFeed, `${partner} accepted your co-sell request on ${acct.name}. ${owner} owns it`, `/v/account/${acct.id}`),
        notices: notice(s, `${partner} joined a deal through co-sell`, `${acct.name} · ${r.role} · with ${SELLER}`, `/opportunity/${oppId}`),
        activity: log(s, `${partner} accepted ${SELLER}'s co-sell request on ${acct.name} as ${r.role}`, `/opportunity/${oppId}`),
      }
    }
    case "planToggle":
      return { ...s, cosell: s.cosell.map((x) => (x.id === a.id ? { ...x, plan: x.plan.map((p) => (p.id === a.stepId ? { ...p, done: !p.done } : p)) } : x)) }
    case "planAdd":
      return { ...s, cosell: s.cosell.map((x) => (x.id === a.id ? { ...x, plan: [...x.plan, a.step] } : x)) }
    case "sellerNote": {
      const reg = s.registrations.find((r) => r.id === a.regId)!
      return {
        ...s,
        sellerNotes: { ...s.sellerNotes, [a.regId]: [...(s.sellerNotes[a.regId] ?? []), { by: a.by, at: stamp(), text: a.text }] },
        notices: notice(s, `${a.by} added context on ${reg.customer}`, `The Brightline seller on the account: "${a.text.length > 90 ? `${a.text.slice(0, 90)}…` : a.text}"`, `/registration/${reg.id}`),
        activity: log(s, `${a.by} (Brightline seller) added context on ${reg.customer}`, `/registration/${reg.id}`),
        sellerFeed: item(s.sellerFeed, `You told Jordan Lee what you know about ${reg.customer}`, `/v/accounts`),
      }
    }

    /* ---------- CEO / CFO ---------- */
    case "execDecide": {
      const x = s.execApprovals.find((e) => e.id === a.id)!
      const what = x.kind === "model" ? "attribution model version 3" : `${partnerName(s, x.partnerId ?? "")}'s ${money(x.amount ?? 0)} rebate`
      return {
        ...s,
        execApprovals: s.execApprovals.map((e) => (e.id === a.id ? { ...e, status: a.approve ? "approved" : "declined", note: a.note, decidedAt: stamp() } : e)),
        execFeed: item(s.execFeed, `You ${a.approve ? "approved" : "declined"} ${what}`, `/v/approval/${x.id}`),
        chiefFeed: chiefLog(s, `${CFO} (CFO) ${a.approve ? "approved" : "declined"} ${what}${a.note ? `: "${a.note}"` : ""}`),
      }
    }
    case "shareBoard":
      return { ...s, execFeed: item(s.execFeed, "You shared the board view: verified figures only", "/v/board") }

    /* ---------- CRO ---------- */
    case "croNudge": {
      const n = a.nudge
      const reg = s.registrations.find((r) => r.customer === n.account)
      const href = reg ? `/registration/${reg.id}` : "/queue"
      return {
        ...s,
        croNudges: [n, ...s.croNudges],
        croFeed: item(s.croFeed, `You asked ${n.toName} about ${n.account}`, "/v/risk"),
        notices: n.to === "pam" ? notice(s, `${CRO} (CRO) asked about ${n.account}`, n.text, href, "warn") : s.notices,
        sellerFeed: n.to === "seller" && n.toName === SELLER ? item(s.sellerFeed, `${CRO} (CRO) asked about ${n.account}: "${n.text}"`, "/v/home") : s.sellerFeed,
        chiefFeed: n.to === "chief" ? chiefLog(s, `${CRO} (CRO) flagged ${n.account}: "${n.text}"`, reg?.state === "under_review" ? `/c/approval/reg-${reg.id}` : undefined) : s.chiefFeed,
      }
    }
    case "croExport":
      return { ...s, croFeed: item(s.croFeed, `You exported the partner pipeline (${a.rows} rows)`, "/v/pipeline") }

    /* ---------- IT / CRM admin ---------- */
    case "itConnector": {
      const c = s.connections.find((x) => x.id === a.id)!
      return {
        ...s,
        connections: s.connections.map((x) => (x.id === a.id ? { ...x, status: a.approve ? "connected" : "declined", decided: { by: IT, at: stamp(), note: a.note } } : x)),
        itFeed: item(s.itFeed, `You ${a.approve ? "connected" : "turned down"} ${c.name}`, "/v/connections"),
        chiefFeed: c.request?.by === CHIEF
          ? chiefLog(s, a.approve ? `${IT} (IT) connected ${c.name}. Approvals can reach you and the directors there now` : `${IT} (IT) didn't connect ${c.name}${a.note ? `: "${a.note}"` : ""}`)
          : s.chiefFeed,
      }
    }
    case "itMapping": {
      const m = s.mappings.find((x) => x.id === a.id)!
      const used = a.decision === "alt" ? m.alt?.target : a.decision === "approve" ? m.target : undefined
      const field = used?.split(" (")[0]
      return {
        ...s,
        mappings: s.mappings.map((x) => (x.id === a.id ? { ...x, status: a.decision === "reject" ? "rejected" : "approved", decidedBy: IT, decidedAt: stamp(), used, note: a.note } : x)),
        itFeed: item(s.itFeed, used ? `You approved ${m.prm} → ${field}` : `You turned down ${m.prm} → ${m.target.split(" (")[0]}`, "/v/mappings"),
        opsFeed: used ? item(s.opsFeed, `${IT} (IT) mapped ${m.prm} to ${field} in Salesforce`, "/v/programs") : s.opsFeed,
        sellerFeed: used && m.id === "FM-12" ? item(s.sellerFeed, "Partner protection end dates now show on your Salesforce opportunities", "/v/accounts") : s.sellerFeed,
      }
    }
    case "itGroup": {
      const g = s.groups.find((x) => x.id === a.id)!
      return {
        ...s,
        groups: s.groups.map((x) => (x.id === a.id ? { ...x, role: a.role, status: "mapped" } : x)),
        itFeed: item(s.itFeed, `You gave ${g.group} (${g.people} people) the ${a.role} role`, "/v/users"),
      }
    }
    case "itTellChief": {
      const u = s.staff.find((x) => x.id === a.userId)!
      return {
        ...s,
        toldChief: [...s.toldChief, u.id],
        chiefFeed: chiefLog(s, `${IT} (IT): ${u.name} leaves Brightline on ${new Date(`${u.leavesOn}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}. ${u.partners} partners still need a new partner manager`, "/c/team"),
        itFeed: item(s.itFeed, `You told ${CHIEF} that ${u.name}'s ${u.partners} partners need a new partner manager`, "/v/users"),
      }
    }
    case "itMerge": {
      const x = s.exceptions.find((e) => e.id === a.exceptionId)!
      return {
        ...s,
        merged: [...s.merged, x.id],
        exceptions: s.exceptions.map((e) => (e.id === x.id && e.resolution ? { ...e, resolution: { ...e.resolution, text: `${e.resolution.text} ${IT} merged ACME Mfg. Inc. into Acme Manufacturing in Salesforce.` } } : e)),
        itFeed: item(s.itFeed, "You merged ACME Mfg. Inc. into Acme Manufacturing in Salesforce", "/v/connections"),
        opsFeed: item(s.opsFeed, `${IT} (IT) merged ACME Mfg. Inc. into Acme Manufacturing in Salesforce`, `/v/exception/${x.id}`),
        sellerFeed: item(s.sellerFeed, "A duplicate record, ACME Mfg. Inc., was merged into your Acme Manufacturing account", "/v/account/acme"),
      }
    }
    case "itRetry": {
      const w = s.crmWrites.find((x) => x.id === a.writeId)!
      const regId = w.href?.split("/").pop()
      const ex = s.exceptions.find((e) => e.kind === "write" && e.regId === regId && e.status !== "resolved")
      const issue = s.crmIssues.find((i) => i.href === w.href)
      return {
        ...s,
        crmWrites: s.crmWrites.map((x) => (x.id === w.id ? { ...x, status: "synced", attempt: undefined } : x)),
        crmIssues: issue ? s.crmIssues.filter((i) => i.id !== issue.id) : s.crmIssues,
        exceptions: ex ? s.exceptions.map((e) => (e.id === ex.id ? { ...e, status: "resolved", resolution: { by: IT, at: stamp(), text: `${IT} (IT) retried the write from the Salesforce connection; it's in Salesforce now.`, choice: "retry" } } : e)) : s.exceptions,
        opsFeed: ex ? item(s.opsFeed, `${IT} (IT) retried the Salesforce write: ${ex.title}`, `/v/exception/${ex.id}`) : s.opsFeed,
        itFeed: item(s.itFeed, `You retried a Salesforce write: ${w.text}`, "/v/connections"),
        activity: log(s, `${IT} (IT) retried the Salesforce write; it went through`, w.href),
      }
    }
    case "itExport":
      return { ...s, itFeed: item(s.itFeed, `You exported the audit log (${a.rows} entries)`, "/v/audit") }
    case "itAddUser":
      return {
        ...s,
        staff: [...s.staff, a.user],
        itFeed: item(s.itFeed, `You invited ${a.user.name} as ${a.user.role}`, "/v/users"),
        chiefFeed: a.user.role === "Partner manager" ? chiefLog(s, `${IT} (IT) added ${a.user.name} as a partner manager. Assign them partners when they're ready`, "/c/team") : s.chiefFeed,
      }
    case "itSetRole": {
      const u = s.staff.find((x) => x.id === a.userId)!
      return {
        ...s,
        staff: s.staff.map((x) => (x.id === a.userId ? { ...x, role: a.role, changed: { by: IT, at: stamp(), text: `Role changed from ${u.role} to ${a.role}` } } : x)),
        itFeed: item(s.itFeed, `You changed ${u.name}'s role from ${u.role} to ${a.role}`, "/v/users"),
      }
    }
    case "itSetStatus": {
      const u = s.staff.find((x) => x.id === a.userId)!
      const off = a.status === "deactivated"
      return {
        ...s,
        staff: s.staff.map((x) => (x.id === a.userId ? { ...x, status: a.status, lastSignIn: a.firstSignIn ? stamp() : x.lastSignIn, changed: { by: a.firstSignIn ? u.name : IT, at: stamp(), text: off ? "Deactivated and signed out everywhere" : a.firstSignIn ? "Signed in for the first time with Brightline SSO and MFA" : "Reactivated" } } : x)),
        itFeed: item(s.itFeed, a.firstSignIn ? `${u.name} signed in for the first time and is now active` : `You ${off ? "deactivated" : "reactivated"} ${u.name}`, "/v/users"),
        chiefFeed: off && u.partners ? chiefLog(s, `${IT} (IT) deactivated ${u.name}. ${u.partners} partners need a new partner manager`, "/c/team") : s.chiefFeed,
      }
    }
    case "itResendInvite": {
      const u = s.staff.find((x) => x.id === a.userId)!
      return { ...s, staff: s.staff.map((x) => (x.id === a.userId ? { ...x, changed: { by: IT, at: stamp(), text: "Invitation sent again" } } : x)), itFeed: item(s.itFeed, `You sent ${u.name}'s invitation again`, "/v/users") }
    }

    /* ---------- AI supervisor ---------- */
    case "aiSetLevel": {
      const ag = agentRoster.find((x) => x.id === a.agent)!
      const act = ag.actions.find((x) => x.id === a.action)!
      const from = s.actionLevels[actionKey(a.agent, a.action)]
      return {
        ...s,
        actionLevels: { ...s.actionLevels, [actionKey(a.agent, a.action)]: a.level },
        agentLevels: ag.headline === a.action ? { ...s.agentLevels, [a.agent]: a.level } : s.agentLevels,
        aisupFeed: item(s.aisupFeed, `You lowered the ${ag.name} from ${from} to ${a.level}: ${act.label.toLowerCase()}`, `/v/agent/${a.agent}`),
        chiefFeed: chiefLog(s, `${AISUP} (AI supervisor) lowered the ${ag.name} from ${from} to ${a.level}: ${act.label.toLowerCase()}`, "/c/program"),
        notices: a.agent === "deal-desk" ? notice(s, "The Deal Desk agent does less on its own now", `${AISUP} lowered "${act.label}" from ${from} to ${a.level}.`, "/queue") : s.notices,
      }
    }
    case "aiRequest":
      return {
        ...s,
        requests: [a.req, ...s.requests],
        aisupFeed: item(s.aisupFeed, `You asked ${CHIEF} to approve: ${a.req.title}`, `/v/agent/${a.req.agent}`),
        chiefFeed: chiefLog(s, `${AISUP} (AI supervisor) asked for more autonomy: ${a.req.title}`, `/c/approval/req-${a.req.id}`),
      }
    case "aiPauseAction": {
      const [agentId, actId] = a.key.split(".")
      const ag = agentRoster.find((x) => x.id === agentId)!
      const label = ag.actions.find((x) => x.id === actId)?.label.toLowerCase()
      const resume = s.pausedActions.includes(a.key)
      return {
        ...s,
        pausedActions: resume ? s.pausedActions.filter((x) => x !== a.key) : [...s.pausedActions, a.key],
        aisupFeed: item(s.aisupFeed, `You ${resume ? "resumed" : "paused"} one action of the ${ag.name}: ${label}`, `/v/agent/${agentId}`),
        chiefFeed: chiefLog(s, `${AISUP} (AI supervisor) ${resume ? "resumed" : "paused"} one action of the ${ag.name}: ${label}`, "/c/program"),
      }
    }
    case "aiPauseAll": {
      const pause = !s.agentLayerPaused
      return {
        ...s,
        agentLayerPaused: pause,
        aisupFeed: item(s.aisupFeed, pause ? "You paused every agent (kill switch)" : "You turned every agent back on", "/v/agents"),
        chiefFeed: chiefLog(s, pause ? `${AISUP} (AI supervisor) paused every AI agent` : `${AISUP} (AI supervisor) turned the AI agents back on`, "/c/program"),
        notices: notice(s, pause ? "All AI agents are paused" : "AI agents are back on", pause ? `${AISUP} used the kill switch. You decide everything by hand for now; the rules still approve clean deals.` : "Recommendations, reminders and checks are running again.", "/queue", pause ? "warn" : "info"),
      }
    }
    case "aiReview":
      return { ...s, agentLog: s.agentLog.map((x) => (x.id === a.id ? { ...x, reviewed: true } : x)) }
    case "aiSetModel": {
      const from = modelName(s.agentModels[a.agent])
      return {
        ...s,
        agentModels: { ...s.agentModels, [a.agent]: a.model },
        aisupFeed: item(s.aisupFeed, `You moved the ${agentName(a.agent)} from ${from} to ${modelName(a.model)}`, "/v/models"),
        chiefFeed: chiefLog(s, `${AISUP} (AI supervisor) moved the ${agentName(a.agent)} to ${modelName(a.model)}`, "/c/program"),
      }
    }
    /* ---------- super admin ---------- */
    case "saCreateOrg": return plat(s, { orgs: [...s.platform.orgs, a.org], flags: s.platform.flags.map((f) => ({ ...f, on: { ...f.on, [a.org.id]: f.plans.includes(a.org.plan) } })) }, `Created organization ${a.org.name} (${sa.planName(a.org.plan)}, ${a.org.region}) and invited ${a.org.admin} as its admin`, a.org.id)
    case "saOrgStatus": {
      const o = s.platform.orgs.find((x) => x.id === a.id)!
      const verb = a.status === "suspended" ? "Suspended" : "Reactivated"
      return plat(s, { orgs: s.platform.orgs.map((x) => (x.id === a.id ? { ...x, status: a.status, note: a.status === "suspended" ? `Suspended: ${a.reason}` : undefined, health: a.status === "suspended" ? "bad" : "good" } : x)) }, `${verb} ${o.name}${a.reason ? `: ${a.reason}` : ""}`, o.id)
    }
    case "saPlan": {
      const o = s.platform.orgs.find((x) => x.id === a.id)!
      const plan = sa.plans.find((p) => p.id === a.plan)!
      return plat(s, { orgs: s.platform.orgs.map((x) => (x.id === a.id ? { ...x, plan: a.plan, mrr: x.status === "trial" ? 0 : plan.monthly } : x)) }, `Moved ${o.name} from ${sa.planName(o.plan)} to ${plan.name}`, o.id)
    }
    case "saAiCap": {
      const o = s.platform.orgs.find((x) => x.id === a.id)!
      return plat(s, { orgs: s.platform.orgs.map((x) => (x.id === a.id ? { ...x, aiCap: a.cap } : x)) }, `Set ${o.name}'s monthly AI cap to $${a.cap.toLocaleString("en-US")}`, o.id)
    }
    case "saFlag": {
      const f = s.platform.flags.find((x) => x.id === a.flag)!
      const all = a.orgId === "all"
      const on = all ? Object.fromEntries(s.platform.orgs.map((o) => [o.id, a.on])) : { ...f.on, [a.orgId]: a.on }
      const who = all ? "every tenant" : s.platform.orgs.find((o) => o.id === a.orgId)!.name
      return plat(s, { flags: s.platform.flags.map((x) => (x.id === a.flag ? { ...x, on } : x)) }, `${a.on ? "Turned on" : "Turned off"} ${f.name} for ${who}`, all ? undefined : a.orgId)
    }
    case "saRollout":
      return plat(s, { releases: s.platform.releases.map((r) => (r.version === a.version ? { ...r, rollout: a.pct, status: a.pct >= 100 ? "live" : a.pct > 0 ? "rolling" : r.status } : r)) }, `Rolled release ${a.version} out to ${a.pct}% of tenants`)
    case "saAiPause": {
      const pause = !s.platform.aiPaused
      const next = plat(s, { aiPaused: pause }, pause ? "Paused every AI agent for every tenant (platform kill switch)" : "Turned AI agents back on for every tenant")
      return {
        ...next,
        agentLayerPaused: pause,
        aisupFeed: item(s.aisupFeed, pause ? "The PRM platform team paused every AI agent, for all customers" : "The PRM platform team turned AI agents back on", "/v/agents"),
        notices: notice(s, pause ? "AI agents are paused by the PRM platform team" : "AI agents are back on", pause ? "A platform-wide pause. You decide everything by hand for now; the rules still approve clean deals." : "Recommendations, reminders and checks are running again.", "/queue", pause ? "warn" : "info"),
      }
    }
    case "saProvider": {
      const p = s.platform.providers.find((x) => x.id === a.id)!
      return plat(s, { providers: s.platform.providers.map((x) => (x.id === a.id ? { ...x, status: a.status } : x)) }, `${a.status === "approved" ? "Approved" : a.status === "blocked" ? "Blocked" : "Sent back to review"} the AI provider ${p.name}`)
    }
    case "saPolicy": {
      const p = s.platform.policies.find((x) => x.id === a.id)!
      return plat(s, { policies: s.platform.policies.map((x) => (x.id === a.id ? { ...x, value: a.value } : x)) }, `Changed the policy "${p.label}" to ${typeof a.value === "boolean" ? (a.value ? "on" : "off") : a.value}`)
    }
    case "saEvent": {
      const e = s.platform.events.find((x) => x.id === a.id)!
      return plat(s, { events: s.platform.events.map((x) => (x.id === a.id ? { ...x, status: "resolved" } : x)) }, `Resolved security event ${e.id}`, e.orgId)
    }
    case "saSupportRequest": {
      const o = s.platform.orgs.find((x) => x.id === a.req.orgId)!
      const next = plat(s, { support: [a.req, ...s.platform.support] }, `Asked ${o.name} for ${a.req.hours}-hour read-only support access for ${a.req.engineer} (${a.req.ticket})`, o.id)
      return o.id === "brightline" ? { ...next, itFeed: item(s.itFeed, `The PRM platform team asks for read-only support access: ${a.req.reason}`, "/v/users") } : next
    }
    case "itSupportDecide": {
      const r = s.platform.support.find((x) => x.id === a.id)!
      const until = new Date(NOW.getTime() + r.hours * 3_600_000).toISOString()
      return {
        ...s,
        platform: { ...s.platform, support: s.platform.support.map((x) => (x.id === a.id ? { ...x, status: a.approve ? "granted" : "declined", decidedBy: IT, until: a.approve ? until : undefined } : x)), audit: [{ id: `PA-${411 + s.platform.audit.length}`, at: stamp(), actor: `${IT} (Brightline)`, text: `${a.approve ? "Approved" : "Declined"} support access for ${r.engineer}${a.approve ? `, ${r.hours} hours, read-only` : ""} (${r.ticket})`, orgId: "brightline" }, ...s.platform.audit] },
        itFeed: item(s.itFeed, `You ${a.approve ? "approved" : "declined"} read-only support access for ${r.engineer} (PRM platform team)`, "/v/users"),
      }
    }
    case "saSupportEnd": {
      const r = s.platform.support.find((x) => x.id === a.id)!
      return plat(s, { support: s.platform.support.map((x) => (x.id === a.id ? { ...x, status: "ended" } : x)) }, `Ended support access for ${r.engineer}`, r.orgId)
    }
    case "saAnnounce": return plat(s, { announcements: [a.a, ...s.platform.announcements] }, `Published ${a.a.kind === "maintenance" ? "a maintenance notice" : "an announcement"} to ${a.a.audience}: ${a.a.title}`)
    case "saAnnounceEnd": {
      const x = s.platform.announcements.find((n) => n.id === a.id)!
      return plat(s, { announcements: s.platform.announcements.map((n) => (n.id === a.id ? { ...n, status: "ended" } : n)) }, `Took down the announcement: ${x.title}`)
    }
    case "saMaintenance": return plat(s, { maintenance: !s.platform.maintenance }, s.platform.maintenance ? "Ended maintenance mode; every tenant can make changes again" : "Turned on maintenance mode: every tenant is read-only")
    case "saIncident": {
      const i = s.platform.incidents.find((x) => x.id === a.id)!
      return plat(s, { incidents: s.platform.incidents.map((x) => (x.id === a.id ? { ...x, status: a.status } : x)) }, `Marked incident ${i.id} as ${a.status}`)
    }
    case "saDataRequest": {
      const d = s.platform.dataRequests.find((x) => x.id === a.id)!
      return plat(s, { dataRequests: s.platform.dataRequests.map((x) => (x.id === a.id ? { ...x, status: a.status } : x)) }, `${a.status === "done" ? "Completed" : "Started"} data ${d.kind} request ${d.id}`, d.orgId)
    }
    case "saUser": {
      const f = { ...(s.platform.userFlags[a.email] ?? {}) }
      if (a.action === "lock") f.locked = true
      if (a.action === "unlock") f.locked = false
      if (a.action === "resetMfa") f.mfaReset = stamp()
      if (a.action === "signOut") f.signedOut = stamp()
      const what = { lock: "Locked", unlock: "Unlocked", resetMfa: "Reset MFA for", signOut: "Signed out everywhere:" }[a.action]
      return plat(s, { userFlags: { ...s.platform.userFlags, [a.email]: f } }, `${what} ${a.name} (${a.email})`)
    }
    case "saPerm": return plat(s, { permOverrides: { ...s.platform.permOverrides, [a.key]: a.cell } }, `Changed the default role template: ${a.key.replace(".", " for ")} is now "${a.cell}"`)
    case "saInvite": return plat(s, { team: [...s.platform.team, a.member] }, `Invited ${a.member.name} to the platform team as ${a.member.role}`)
    case "saInvoice": {
      const inv = s.platform.invoices.find((x) => x.id === a.id)!
      return plat(s, { invoices: a.action === "paid" ? s.platform.invoices.map((x) => (x.id === a.id ? { ...x, status: "paid" } : x)) : s.platform.invoices }, a.action === "paid" ? `Marked ${inv.id} as paid` : `Sent a payment reminder for ${inv.id}`, inv.orgId)
    }

    case "aiSetDefaultModel":
      return { ...s, defaultModel: a.model, aisupFeed: item(s.aisupFeed, `You made ${modelName(a.model)} the default model`, "/v/models") }

    case "toggleAgent": {
      const resume = s.pausedAgents.includes(a.id)
      const verb = resume ? "resumed" : "paused"
      const byLee = a.by === AISUP
      return {
        ...s,
        pausedAgents: resume ? s.pausedAgents.filter((x) => x !== a.id) : [...s.pausedAgents, a.id],
        chiefFeed: chiefLog(s, byLee ? `${AISUP} (AI supervisor) ${verb} the ${agentName(a.id)}` : `You ${verb} the ${agentName(a.id)}`, "/c/program"),
        aisupFeed: item(s.aisupFeed, byLee ? `You ${verb} the ${agentName(a.id)}` : `${CHIEF} ${verb} the ${agentName(a.id)}`, `/v/agent/${a.id}`),
        notices: a.id === "deal-desk"
          ? notice(s, `The Deal Desk agent is ${verb}`, resume ? "Its recommendations are back on your registrations." : `${byLee ? AISUP : CHIEF} paused it. You decide registrations without its recommendation; the rules still approve clean deals.`, "/queue", resume ? "info" : "warn")
          : s.notices,
      }
    }
    case "chiefAssign": {
      const p = s.partners.find((x) => x.id === a.partnerId)!
      const from = p.manager ?? (p.assigned ? "Jordan Lee" : "Not assigned")
      const toJordan = a.to === "Jordan Lee"
      const fromJordan = from === "Jordan Lee"
      return {
        ...s,
        partners: s.partners.map((x) => (x.id === a.partnerId ? { ...x, assigned: toJordan, manager: toJordan ? undefined : a.to } : x)),
        assignments: [{ id: `as${Date.now()}`, partnerId: p.id, partner: p.name, from, to: a.to, reason: a.reason, at: stamp() }, ...s.assignments],
        notices: toJordan || fromJordan
          ? notice(s, toJordan ? `Dana assigned ${p.name} to you` : `Dana moved ${p.name} to ${a.to}`, a.reason, toJordan ? `/partner/${p.id}` : "/partners", toJordan ? "info" : "warn")
          : s.notices,
        activity: toJordan || fromJordan ? log(s, toJordan ? `${CHIEF} assigned ${p.name} to you` : `${CHIEF} moved ${p.name} to ${a.to}`) : s.activity,
        chiefFeed: chiefLog(s, `You moved ${p.name} from ${from} to ${a.to}`, "/c/team"),
      }
    }
    case "dispute": {
      const reg = s.registrations.find((r) => r.id === a.regId)!
      return {
        ...s,
        disputes: [{ id: `D-${100 + s.disputes.length}`, regId: a.regId, by: a.by, reason: a.reason, at: stamp() }, ...s.disputes],
        partnerFeed: feed(s, `${a.by} disputed the credit on ${reg.customer}`, `/p/deal/${reg.id}`, reg.rep),
        notices: notice(s, "Credit dispute", `${partnerName(s, reg.partnerId)} · ${reg.customer}`, `/registration/${reg.id}`, "warn"),
      }
    }
  }
}

/* ---------- agent audit: what people did with each agent's work (R-AG-5) ---------- */

type Outcome = Pick<AgentLogEntry, "agent" | "action" | "text" | "target" | "outcome" | "who" | "detail" | "confidence" | "evidence"> & { ref: string }

const aiVerb = { approve: "approve", reject: "reject", request_info: "ask for info" } as const
const didVerb = { approve: "approved", reject: "rejected", requestInfo: "asked for info" } as const

/** Paused agents give no advice, so nobody can agree with or override them. */
const agentOff = (s: State, agent: string, action: string) => s.agentLayerPaused || s.pausedAgents.includes(agent) || s.pausedActions.includes(actionKey(agent, action))

/** When a person decides something an agent recommended, records whether they agreed or overrode it. */
function agentOutcome(s: State, a: Action): Outcome | null {
  if ((a.type === "approve" || a.type === "reject" || a.type === "requestInfo" || a.type === "chiefDeal") && agentOff(s, "deal-desk", "recommend")) return null
  if (a.type === "resolveException" && agentOff(s, "data-steward", "suggest")) return null
  if (a.type === "sendCoSell" && agentOff(s, "cosell", "draft")) return null
  if (a.type === "approve" || a.type === "reject" || a.type === "requestInfo" || (a.type === "chiefDeal" && a.action !== "nudge")) {
    const reg = s.registrations.find((r) => r.id === a.id)
    if (!reg?.ai) return null
    const did = a.type === "chiefDeal" ? (a.action === "approve" ? "approve" : "reject") : a.type === "requestInfo" ? "request_info" : a.type
    const who = a.type === "chiefDeal" ? CHIEF : "Jordan Lee"
    const agreed = did === reg.ai.action
    const verb = a.type === "chiefDeal" ? (did === "approve" ? "approved" : "rejected") : didVerb[a.type]
    return {
      ref: reg.id, agent: "deal-desk", action: "recommend", text: `Recommended: ${reg.ai.headline.charAt(0).toLowerCase()}${reg.ai.headline.slice(1)}`, target: reg.customer,
      outcome: agreed ? "agreed" : "overridden", who, confidence: reg.ai.confidence, evidence: reg.ai.evidence.slice(0, 2),
      detail: agreed ? undefined : `${who} ${verb} instead of choosing to ${aiVerb[reg.ai.action]}${a.type === "reject" ? `: ${a.reason}` : a.type === "chiefDeal" && a.reason ? `: ${a.reason}` : ""}.`,
    }
  }
  if (a.type === "resolveException") {
    const x = s.exceptions.find((e) => e.id === a.id)
    if (!x) return null
    const suggested = x.options.find((o) => o.suggested)
    const picked = x.options.find((o) => o.id === a.choice)
    const agreed = suggested?.id === a.choice
    return {
      ref: x.id, agent: "data-steward", action: "suggest", text: `Suggested: ${x.ai.headline.charAt(0).toLowerCase()}${x.ai.headline.slice(1)}`, target: x.title.split(":")[0],
      outcome: agreed ? "agreed" : "overridden", who: OPS, confidence: x.ai.confidence, evidence: x.ai.evidence.slice(0, 2),
      detail: agreed ? undefined : `${OPS} chose: ${picked?.label ?? a.choice}.`,
    }
  }
  if (a.type === "sendCoSell") {
    const list = candidatesSeed[a.req.accountId] ?? []
    const c = list.find((x) => x.partnerId === a.req.partnerId)
    const acct = sellerAccounts.find((x) => x.id === a.req.accountId)
    const asDrafted = !!c && a.req.message.trim() === c.draft.trim()
    return {
      ref: `cosell-${a.req.id}`, agent: "cosell", action: "draft", text: `Ranked ${partnerName(s, a.req.partnerId)} and drafted the intro`, target: acct?.name ?? a.req.accountId,
      outcome: asDrafted ? "agreed" : "edited", who: SELLER, confidence: c?.score ?? 0.6, evidence: c?.reasons.slice(0, 2) ?? [],
      detail: asDrafted ? `${SELLER} sent it as drafted.` : `${SELLER} edited the draft before sending.`,
    }
  }
  return null
}

function applyOutcome(log: AgentLogEntry[], o: Outcome): AgentLogEntry[] {
  const i = log.findIndex((x) => x.ref === o.ref && x.outcome === "waiting")
  if (i >= 0) return log.map((x, j) => (j === i ? { ...x, outcome: o.outcome, who: o.who, detail: o.detail } : x))
  return [{ id: `AL-${902 + log.length - agentLogSeed.length}`, at: stamp(), cost: 0.3, ...o }, ...log]
}

/* ---------- the audit log: one line for every action, from every portal (R-SEC-6) ---------- */

type Audit = Pick<AuditEntry, "actor" | "kind" | "area" | "text">

function auditOf(s: State, a: Action): Audit | null {
  const reg = (id: string) => s.registrations.find((r) => r.id === id)
  const P = (actor: string, area: Audit["area"], text: string): Audit => ({ actor, kind: "person", area, text })
  const at = (by: string, companyId = "ridgeway") => `${by} (${partnerName(s, companyId)})`
  switch (a.type) {
    case "approve": return P("Jordan Lee", "Deals", `Approved ${reg(a.id)?.customer} for ${partnerName(s, reg(a.id)?.partnerId ?? "")}`)
    case "reject": return P("Jordan Lee", "Deals", `Rejected ${reg(a.id)?.customer}: ${a.reason}`)
    case "requestInfo": return P("Jordan Lee", "Deals", `Asked ${partnerName(s, reg(a.id)?.partnerId ?? "")} for more on ${reg(a.id)?.customer}`)
    case "synced": return { actor: "Salesforce sync", kind: "system", area: "Integrations", text: `Wrote ${reg(a.id)?.customer} to Salesforce` }
    case "extension": return P("Jordan Lee", "Deals", `${a.grant ? `Extended protection by ${a.days} days on` : "Declined an extension on"} ${s.extensions.find((e) => e.id === a.id)?.customer}`)
    case "acceptApp": return P("Jordan Lee", "Partners", `Accepted ${s.applications.find((x) => x.id === a.id)?.company} as ${a.tier}`)
    case "rejectApp": return P("Jordan Lee", "Partners", `Declined the application from ${s.applications.find((x) => x.id === a.id)?.company}`)
    case "escalateApp": return P("Jordan Lee", "Partners", `Escalated the application from ${s.applications.find((x) => x.id === a.id)?.company}`)
    case "addPartner": return P("Jordan Lee", "Credit", `Added ${partnerName(s, a.partnerId)} as ${a.role} on ${s.opportunities.find((o) => o.id === a.oppId)?.account}`)
    case "propose": return P("Jordan Lee", "Credit", `Proposed a credit split on ${s.opportunities.find((o) => o.id === a.oppId)?.account}`)
    case "sendLead": return P("Jordan Lee", "Partners", `Sent ${s.leads.find((l) => l.id === a.id)?.company} to ${partnerName(s, a.partnerId)} as a lead`)
    case "partnerRegister": return P(at(a.by, a.reg.partnerId), "Deals", `Registered ${a.reg.customer}, ${money(a.reg.value)}`)
    case "partnerReply": return P(at(a.by, reg(a.id)?.partnerId), "Deals", `Answered the question on ${reg(a.id)?.customer}`)
    case "requestExtension": return P(at(a.by, reg(a.regId)?.partnerId), "Deals", `Asked for ${a.days} more days on ${reg(a.regId)?.customer}`)
    case "leadAccept": return P(at(a.by), "Partners", `Accepted the lead ${s.leads.find((l) => l.id === a.id)?.company}`)
    case "leadDecline": return P(at(a.by), "Partners", `Declined the lead ${s.leads.find((l) => l.id === a.id)?.company}`)
    case "invite": return P(at("Paul Okafor"), "Access", `Invited ${a.member.name} to the partner portal`)
    case "setMemberStatus": return P(at("Paul Okafor"), "Access", `Set ${s.team.find((m) => m.id === a.id)?.name} to ${a.status}`)
    case "setCanRegister": return P(at("Paul Okafor"), "Access", `${a.value ? "Let" : "Stopped"} ${s.team.find((m) => m.id === a.id)?.name} register deals`)
    case "dispute": return P(at(a.by, reg(a.regId)?.partnerId), "Credit", `Disputed the credit on ${reg(a.regId)?.customer}`)
    case "chiefSplit": return P(CHIEF, "Credit", `${a.approve ? "Approved" : "Declined"} the credit split on ${s.opportunities.find((o) => o.id === a.oppId)?.account}`)
    case "chiefExtension": return P(CHIEF, "Deals", `${a.grant ? "Granted" : "Declined"} a second extension on ${s.extensions.find((e) => e.id === a.id)?.customer}`)
    case "chiefApp": return P(CHIEF, "Partners", `${a.accept ? "Accepted" : "Declined"} the application from ${s.applications.find((x) => x.id === a.id)?.company}`)
    case "chiefDeal": return a.action === "nudge" ? P(CHIEF, "Deals", `Nudged Jordan Lee about ${reg(a.id)?.customer}`) : P(CHIEF, "Deals", `${a.action === "approve" ? "Approved" : "Rejected"} ${reg(a.id)?.customer} (escalated)`)
    case "chiefRequest": return P(CHIEF, s.requests.find((r) => r.id === a.id)?.kind === "autonomy" ? "Agents" : "Programs", `${a.approve ? "Approved" : "Declined"}: ${s.requests.find((r) => r.id === a.id)?.title}`)
    case "chiefAssign": return P(CHIEF, "Partners", `Moved ${partnerName(s, a.partnerId)} to ${a.to}`)
    case "chiefMdf": return P(CHIEF, "Credit", `${a.approve ? "Approved" : "Declined"} a funds request (${s.mdf.find((m) => m.id === a.id)?.campaign})`)
    case "toggleAgent": return P(a.by ?? CHIEF, "Agents", `${s.pausedAgents.includes(a.id) ? "Resumed" : "Paused"} the ${agentName(a.id)}`)
    case "launchCampaign": return P(at(a.campaign.owner, a.campaign.companyId), "Partners", `Launched the campaign ${a.campaign.name}`)
    case "handOffLead": return P(at(a.by), "Partners", `Handed a campaign lead to ${a.rep}`)
    case "requestMdf": return P(at(a.req.requestedBy, a.req.companyId), "Credit", `Asked for ${money(a.req.amount)} of marketing funds`)
    case "claimMdf": return P(at("Priya Raman"), "Credit", `Claimed ${money(a.amount)} of marketing funds`)
    case "logMilestone": return P(at(a.by, s.engagements.find((e) => e.id === a.engagementId)?.companyId), "Credit", `Logged a delivery milestone: ${a.kind}`)
    case "passExam": {
      const k = s.skills.find((x) => x.id === a.skillId)
      return P(at(k?.person ?? "Raj Mehta", companyOfLead(s, k?.person ?? "")), "Partners", `Passed the ${k?.product} exam`)
    }
    case "resolveException": return P(OPS, "Data", `${s.exceptions.find((e) => e.id === a.id)?.title}: chose "${s.exceptions.find((e) => e.id === a.id)?.options.find((o) => o.id === a.choice)?.label}"`)
    case "proposeRule": return P(OPS, "Programs", `Asked for: ${a.req.title}`)
    case "sendCoSell": return P(SELLER, "Deals", `Sent ${partnerName(s, a.req.partnerId)} a co-sell request`)
    case "cosellRespond": {
      const r = s.cosell.find((x) => x.id === a.id)
      return P(r ? at(a.by, r.partnerId) : a.by, "Deals", `${a.accept ? "Accepted" : "Declined"} ${SELLER}'s co-sell request`)
    }
    case "sellerNote": return P(SELLER, "Deals", `Added context on ${reg(a.regId)?.customer} for the partner manager`)
    case "execDecide": return P(CFO, "Credit", `${a.approve ? "Approved" : "Declined"}: ${s.execApprovals.find((e) => e.id === a.id)?.title}`)
    case "shareBoard": return P(CFO, "Data", "Shared a read-only link to the board view")
    case "croNudge": return P(CRO, "Deals", `Asked ${a.nudge.toName} about ${a.nudge.account}`)
    case "croExport": return P(CRO, "Data", `Exported the partner pipeline (${a.rows} rows)`)
    case "itConnector": return P(IT, "Integrations", `${a.approve ? "Connected" : "Turned down"} ${s.connections.find((c) => c.id === a.id)?.name}`)
    case "itMapping": {
      const m = s.mappings.find((x) => x.id === a.id)
      return P(IT, "Integrations", a.decision === "reject" ? `Turned down a field mapping: ${m?.prm}` : `Approved a field mapping: ${m?.prm} → ${(a.decision === "alt" ? m?.alt?.target : m?.target)?.split(" (")[0]}`)
    }
    case "itGroup": return P(IT, "Access", `Gave the Okta group ${s.groups.find((g) => g.id === a.id)?.group} the ${a.role} role`)
    case "itTellChief": return P(IT, "Access", `Told ${CHIEF} that ${s.staff.find((u) => u.id === a.userId)?.name}'s partners need a new partner manager`)
    case "itMerge": return P(IT, "Data", "Merged ACME Mfg. Inc. into Acme Manufacturing in Salesforce")
    case "itRetry": return P(IT, "Integrations", `Retried a Salesforce write: ${s.crmWrites.find((w) => w.id === a.writeId)?.text}`)
    case "itExport": return P(IT, "Access", `Exported the audit log (${a.rows} entries)`)
    case "itAddUser": return P(IT, "Access", `Invited ${a.user.name} (${a.user.email}) as ${a.user.role}${a.user.signIn === "contractor" ? ", with a new Okta contractor account" : ""}`)
    case "itSetRole": return P(IT, "Access", `Changed ${s.staff.find((u) => u.id === a.userId)?.name}'s role to ${a.role}`)
    case "itSetStatus": {
      const u = s.staff.find((x) => x.id === a.userId)
      return a.firstSignIn
        ? { actor: "Okta SSO", kind: "system", area: "Access", text: `${u?.name} signed in for the first time (SSO and MFA); account is active` }
        : P(IT, "Access", `${a.status === "deactivated" ? "Deactivated" : "Reactivated"} ${u?.name}`)
    }
    case "itResendInvite": return P(IT, "Access", `Sent ${s.staff.find((u) => u.id === a.userId)?.name}'s invitation again`)
    case "aiSetLevel": return P(AISUP, "Agents", `Lowered the ${agentName(a.agent)} to ${a.level}: ${agentRoster.find((x) => x.id === a.agent)?.actions.find((x) => x.id === a.action)?.label.toLowerCase()}`)
    case "aiRequest": return P(AISUP, "Agents", `Asked for: ${a.req.title}`)
    case "aiPauseAction": return P(AISUP, "Agents", `${s.pausedActions.includes(a.key) ? "Resumed" : "Paused"} one action of the ${agentName(a.key.split(".")[0])}`)
    case "aiPauseAll": return P(AISUP, "Agents", s.agentLayerPaused ? "Turned every AI agent back on" : "Paused every AI agent (kill switch)")
    case "aiSetModel": return P(AISUP, "Agents", `Moved the ${agentName(a.agent)} from ${modelName(s.agentModels[a.agent])} to ${modelName(a.model)}`)
    case "aiSetDefaultModel": return P(AISUP, "Agents", `Made ${modelName(a.model)} the default AI model`)
    default: return null
  }
}

/** Every action goes through here: the portal's own change, then the agent audit and the audit log. */
function reducer(s: State, a: Action): State {
  let next = core(s, a)
  const o = agentOutcome(s, a)
  if (o) next = { ...next, agentLog: applyOutcome(next.agentLog, o) }
  const au = auditOf(s, a)
  if (au) next = { ...next, audit: [{ id: `AU-${5121 + next.audit.length - auditSeed.length}`, at: stamp(), ...au }, ...next.audit] }
  return next
}

interface Store {
  state: State
  dispatch: (a: Action) => void
  partner: (id: string) => Partner | undefined
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, raw] = useReducer(reducer, initial)
  const dispatch = useCallback((a: Action) => {
    raw(a)
    // The CRM write happens after the decision; its status is tracked separately (D5).
    if (a.type === "approve") setTimeout(() => raw({ type: "synced", id: a.id }), 1400)
    if (a.type === "partnerRegister" && a.reg.crm) setTimeout(() => raw({ type: "synced", id: a.reg.id }), 1400)
    // Only Ridgeway has partner portals in this demo; other partners answer a co-sell request on their own a moment later.
    if (a.type === "sendCoSell" && a.req.partnerId !== "ridgeway") setTimeout(() => raw({ type: "cosellRespond", id: a.req.id, accept: true, by: a.req.contact }), 2600)
  }, [])
  const value = useMemo<Store>(
    () => ({ state, dispatch, partner: (id) => state.partners.find((p) => p.id === id) }),
    [state, dispatch],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error("useStore outside provider")
  return s
}

/* ---------- selectors ---------- */

export const slaPct = (r: Registration) => Math.min(100, Math.round((r.usedHours / r.slaHours) * 100))

export function useQueue() {
  const { state } = useStore()
  return useMemo(() => {
    // The partner manager only works the partners assigned to them.
    const mine = (partnerId: string) => !!state.partners.find((p) => p.id === partnerId)?.assigned
    const toDecide = state.registrations
      .filter((r) => r.state === "under_review" && mine(r.partnerId))
      .sort((a, b) => slaPct(b) - slaPct(a))
    const waiting = state.registrations.filter((r) => r.state === "info_requested" && mine(r.partnerId))
    const extensions = state.extensions.filter((e) => e.status === "pending" && mine(e.partnerId) && e.previousExtensions === 0)
    const withChief = state.extensions.filter((e) => e.status === "pending" && mine(e.partnerId) && e.previousExtensions > 0)
    const decided = state.registrations
      .filter((r) => r.decision && r.state !== "info_requested" && r.state !== "under_review" && mine(r.partnerId))
      .sort((a, b) => new Date(b.decision!.at).getTime() - new Date(a.decision!.at).getTime())
    const atRisk = toDecide.filter((r) => slaPct(r) >= 80)
    const apps = state.applications.filter((a) => a.status === "new")
    return { toDecide, waiting, extensions, withChief, decided, atRisk, apps }
  }, [state])
}

/** A partner's open pipeline, added up from its open deals so it always matches what's listed and updates live. */
export function pipelineOf(state: State, partnerId: string) {
  return state.registrations
    .filter((r) => r.partnerId === partnerId && ["approved", "under_review", "info_requested"].includes(r.state))
    .reduce((n, r) => n + r.value, 0)
}
