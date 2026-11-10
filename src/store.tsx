import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from "react"
import * as seed from "@/data/model"
import type {
  ActivityItem, Application, CreditLine, CrmIssue, CrmWrite, Lead, ExtensionRequest, HealthSignal, Notice, Onboarding,
  Opportunity, Partner, PartnerRole, Registration, Tier,
} from "@/data/model"
import { roleWeights } from "@/data/model"
import { NOW, addDays, money } from "@/lib/format"
import { agreementsSeed, teamSeed, type Agreement as PartnerAgreement, type TeamMember } from "@/partner/data"
import { agents as agentSeed, requestsSeed, rulesSeed, type ChangeRequest, type ProgramId, type RuleSet } from "@/chief/data"
import { campaignLeadsSeed, campaignsSeed, mdfSeed, type Campaign, type CampaignLead, type MdfRequest } from "@/partner/marketing"
import { engagementsSeed, skillsSeed, type Engagement, type Skill } from "@/partner/delivery"

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
  agentLevels: Object.fromEntries(agentSeed.map((a) => [a.id, a.level])),
  chiefFeed: [
    { id: "cf1", at: "2026-10-28T10:20:00", text: "Kestrel Energy passed 80% of its review deadline with Jordan Lee", href: "/c/approval/reg-REG-2038" },
    { id: "cf2", at: "2026-10-27T17:05:00", text: "Jordan Lee proposed a new credit split on Brookside Bank", href: "/c/approval/split-006Q8000020BrkS" },
    { id: "cf3", at: "2026-10-27T16:00:00", text: "Ana Costa (RevOps) asked to raise the auto-approve limit for top partners", href: "/c/approval/req-CR-21" },
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
  | { type: "toggleAgent"; id: string }
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
const chiefLog = (s: State, text: string, href?: string): ActivityItem[] => [{ id: `c${Date.now()}${Math.random()}`, at: stamp(), text, href }, ...s.chiefFeed]
const daysTo = (iso: string) => Math.ceil((new Date(`${iso}T12:00:00`).getTime() - NOW.getTime()) / 86_400_000)

/** Role-based split (the launch default suggested in D8): role weights, normalised to 100. */
export function modelSplit(lines: { partnerId: string; role: PartnerRole }[]): CreditLine[] {
  const total = lines.reduce((sum, l) => sum + roleWeights[l.role], 0)
  const raw = lines.map((l) => ({ ...l, share: Math.round((roleWeights[l.role] / total) * 100) }))
  const drift = 100 - raw.reduce((sum, l) => sum + l.share, 0)
  if (raw.length) raw[0].share += drift
  return raw
}

function reducer(s: State, a: Action): State {
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
          programRules[p] = { ...cur, version: cur.version + 1, autoApproveTop: 75_000, history: [{ version: cur.version + 1, at: stamp(), by: `${CHIEF} approved ${r.from}'s change`, note: r.proposed }, ...cur.history] }
        }
      const scope = r.programs === "all" ? "every program" : r.programs.map((p) => `the ${p} program`).join(", ")
      return {
        ...s,
        requests: s.requests.map((x) => (x.id === a.id ? { ...x, status: a.approve ? "approved" : "declined", note: a.note } : x)),
        programRules,
        agentLevels: a.approve && r.kind === "autonomy" ? { ...s.agentLevels, "deal-desk": "A4" } : s.agentLevels,
        notices: a.approve && r.kind === "rule" ? notice(s, "Program rules changed", `${r.title}. Applies to ${scope}, whoever looks after the partner.`, "/home") : s.notices,
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
      const handed = { id: `pf${Date.now()}h`, at: stamp(), text: `${a.by} handed you a lead from her campaign: ${l.company}`, href: "/p/leads", rep: a.rep }
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
      return {
        ...s,
        skills: s.skills.map((x) => (x.id === a.skillId ? {
          ...x, level: "Certified", course: undefined, expires: addDays(NOW.toISOString().slice(0, 10), 730),
          evidence: [...x.evidence, { level: "Certified", text: `${x.product} technical certification exam (86%)`, at: NOW.toISOString().slice(0, 10) }],
          next: `Sell-Ready when you deliver a workshop, design or pilot on a ${x.product} deal${x.needFor ? " such as Kestrel Energy" : ""}.`, needFor: undefined,
        } : x)),
        partnerFeed: feed(s, `You're certified in ${k.product}. Northpeak's capability score went up`, "/p/skills", k.person, "northpeak"),
      }
    }

    case "toggleAgent":
      return {
        ...s,
        pausedAgents: s.pausedAgents.includes(a.id) ? s.pausedAgents.filter((x) => x !== a.id) : [...s.pausedAgents, a.id],
        chiefFeed: chiefLog(s, `You ${s.pausedAgents.includes(a.id) ? "resumed" : "paused"} the ${agentSeed.find((x) => x.id === a.id)?.name ?? a.id}`, "/c/program"),
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
