import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from "react"
import * as seed from "@/data/model"
import type {
  ActivityItem, Application, CreditLine, CrmIssue, CrmWrite, Lead, ExtensionRequest, HealthSignal, Notice, Onboarding,
  Opportunity, Partner, PartnerRole, Registration, Tier,
} from "@/data/model"
import { roleWeights } from "@/data/model"
import { NOW, addDays } from "@/lib/format"

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

const stamp = () => NOW.toISOString()
const log = (s: State, text: string, href?: string): ActivityItem[] => [
  { id: `a${Date.now()}${Math.random()}`, at: stamp(), text, href },
  ...s.activity,
]
const partnerName = (s: State, id: string) => s.partners.find((p) => p.id === id)?.name ?? id

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
    const toDecide = state.registrations
      .filter((r) => r.state === "under_review")
      .sort((a, b) => slaPct(b) - slaPct(a))
    const waiting = state.registrations.filter((r) => r.state === "info_requested")
    const extensions = state.extensions.filter((e) => e.status === "pending")
    const decided = state.registrations
      .filter((r) => r.decision && r.state !== "info_requested" && r.state !== "under_review")
      .sort((a, b) => (b.decision!.at > a.decision!.at ? 1 : -1))
    const atRisk = toDecide.filter((r) => slaPct(r) >= 80)
    const apps = state.applications.filter((a) => a.status === "new")
    return { toDecide, waiting, extensions, decided, atRisk, apps }
  }, [state])
}
