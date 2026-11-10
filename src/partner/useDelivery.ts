import { useMemo } from "react"
import type { CreditLine, Opportunity, Registration, Touch } from "@/data/model"
import { NOW } from "@/lib/format"
import { useStore } from "@/store"
import { ladder, northpeakOthers, type Engagement, type JointTask } from "@/partner/delivery"
import { usePartner } from "@/partner/usePartner"

const sum = (xs: number[]) => xs.reduce((n, x) => n + x, 0)
export const TODAY = NOW.toISOString().slice(0, 10)

export interface EngagementView {
  e: Engagement
  reg?: Registration
  opp?: Opportunity
  /** The company's own credit line; other partners are counted, never named (R-CR-5). */
  line?: CreditLine
  others: number
  stage: string
  won: boolean
  credited: number
  myTouches: Touch[]
  teamTouches: Touch[]
  myOpenTasks: JointTask[]
  canLog: boolean
  blockedWhy?: string
}

/** Everything the signed-in technical lead may see: the deals they work on, their tasks, skills and influence. */
export function useDelivery() {
  const { state } = useStore()
  const { me, company } = usePartner()
  return useMemo(() => {
    const views: EngagementView[] = state.engagements
      .filter((e) => e.companyId === company.id && e.person === me.name)
      .map((e) => {
        const reg = e.regId ? state.registrations.find((r) => r.id === e.regId) : undefined
        const oppId = e.oppId ?? reg?.crm?.opportunityId
        const opp = oppId ? state.opportunities.find((o) => o.id === oppId) : undefined
        const line = opp?.lines.find((l) => l.partnerId === company.id) ?? (reg?.crm ? { partnerId: company.id, role: reg.crm.role as CreditLine["role"], share: 100 } : undefined)
        const stage = opp?.stage ?? (reg?.state === "under_review" ? "In review at Brightline" : reg?.state === "info_requested" ? "Question from Brightline" : reg?.crmStage ?? "Approved")
        const won = stage === "Closed won"
        const teamTouches = (opp?.touches ?? []).filter((t) => t.partnerId === company.id)
        const blockedWhy = !oppId
          ? reg?.state === "rejected" ? "Brightline didn't approve the registration, so there's no opportunity to log against." : "Brightline is still reviewing the registration. You can log milestones once it's approved and in Salesforce."
          : undefined
        return {
          e, reg, opp, line, others: opp ? opp.lines.length - 1 : 0, stage, won,
          credited: line ? Math.round((e.value * line.share) / 100) : 0,
          myTouches: teamTouches.filter((t) => t.by === me.name), teamTouches,
          myOpenTasks: e.tasks.filter((t) => t.owner === me.name && t.status === "open").sort((a, b) => (a.due > b.due ? 1 : -1)),
          canLog: !!oppId, blockedWhy,
        }
      })
    const wonViews = views.filter((v) => v.won && v.myTouches.length)
    const openViews = views.filter((v) => !v.won && v.opp)
    const influenced = sum(wonViews.map((v) => v.e.value))
    const creditWon = sum(wonViews.map((v) => v.credited))
    const pipeline = sum(openViews.map((v) => v.e.value))
    const creditPipeline = sum(openViews.map((v) => v.credited))
    const tasks = views.flatMap((v) => v.myOpenTasks.map((t) => ({ t, v }))).sort((a, b) => (a.t.due > b.t.due ? 1 : -1))
    const overdue = tasks.filter((x) => x.t.due < TODAY)
    const thisWeek = tasks.filter((x) => x.t.due >= TODAY && x.t.due <= "2026-11-03")
    const skills = state.skills.filter((k) => k.person === me.name)
    const capability = northpeakOthers.map((p) => {
      const mine = skills.find((k) => k.product === p.product)
      const rank = mine ? ladder.indexOf(mine.level) : -1
      return { ...p, certified: p.certified + (rank >= 1 ? 1 : 0), proven: p.proven + (rank === 3 ? 1 : 0) }
    })
    const examReady = skills.filter((k) => k.level === "Learned" && k.course === 100)
    return { views, influenced, creditWon, pipeline, creditPipeline, tasks, overdue, thisWeek, skills, capability, examReady, wonViews, openViews }
  }, [state, me, company])
}
