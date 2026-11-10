import { useMemo } from "react"
import type { Registration } from "@/data/model"
import { useStore, type State } from "@/store"
import { contentKits, mdfAllowance, type Campaign, type CampaignLead, type MdfRequest } from "@/partner/marketing"
import { companies } from "@/partner/data"
import { usePartner } from "@/partner/usePartner"

const sum = (xs: number[]) => xs.reduce((n, x) => n + x, 0)
const isOpen = (r: Registration) => ["approved", "under_review", "info_requested"].includes(r.state)

export interface CampaignStats {
  regs: Registration[]
  open: Registration[]
  won: Registration[]
  pipeline: number
  wonValue: number
  leads: CampaignLead[]
  leadCount: number
}

/** What a campaign produced: leads from its tracked link and the deals registered from them. */
export function campaignStats(state: State, c: Campaign): CampaignStats {
  const regs = state.registrations.filter((r) => r.campaignId === c.id)
  const open = regs.filter(isOpen)
  const won = regs.filter((r) => r.state === "won")
  const leads = state.campaignLeads.filter((l) => l.campaignId === c.id)
  return { regs, open, won, pipeline: sum(open.map((r) => r.value)), wonValue: sum(won.map((r) => r.value)), leads, leadCount: c.earlierLeads + leads.length }
}

/** A company's MDF position for the year. Approved money is committed until it's claimed and paid. */
export function mdfSummary(state: State, companyId: string) {
  const tier = companies[companyId]?.tier ?? "Gold"
  const all = state.mdf.filter((m) => m.companyId === companyId)
  const allowance = mdfAllowance[tier] ?? 0
  const paid = sum(all.filter((m) => m.status === "paid").map((m) => m.claim?.amount ?? m.amount))
  const committed = sum(all.filter((m) => m.status === "approved" || m.status === "claimed").map((m) => m.amount))
  const waiting = sum(all.filter((m) => m.status === "submitted").map((m) => m.amount))
  return { all, allowance, paid, committed, waiting, available: Math.max(0, allowance - paid - committed - waiting) }
}

export const mdfLabel: Record<MdfRequest["status"], { label: string; cls: string }> = {
  submitted: { label: "With Brightline", cls: "bg-brand-soft text-primary" },
  approved: { label: "Approved · claim after the campaign", cls: "bg-ok-soft text-ok" },
  rejected: { label: "Declined", cls: "bg-bad-soft text-bad" },
  claimed: { label: "Claim with Brightline", cls: "bg-brand-soft text-primary" },
  paid: { label: "Paid", cls: "bg-ok text-white" },
  claim_rejected: { label: "Claim declined", cls: "bg-bad-soft text-bad" },
}

export const campaignLabel: Record<Campaign["status"], { label: string; cls: string }> = {
  live: { label: "Live", cls: "bg-ok-soft text-ok" },
  scheduled: { label: "Scheduled", cls: "bg-brand-soft text-primary" },
  draft: { label: "Draft", cls: "bg-secondary text-muted-foreground" },
  ended: { label: "Ended", cls: "bg-secondary text-muted-foreground" },
}

/** Everything the signed-in marketer may see: her own campaigns, their leads and results, and her company's funds. */
export function useMarketing() {
  const { state } = useStore()
  const { me, company } = usePartner()
  return useMemo(() => {
    const campaigns = state.campaigns.filter((c) => c.companyId === company.id && c.owner === me.name)
    const stats = Object.fromEntries(campaigns.map((c) => [c.id, campaignStats(state, c)])) as Record<string, CampaignStats>
    const pipeline = sum(campaigns.map((c) => stats[c.id].pipeline))
    const won = sum(campaigns.map((c) => stats[c.id].wonValue))
    const openDeals = campaigns.flatMap((c) => stats[c.id].open)
    const leads = state.campaignLeads.filter((l) => campaigns.some((c) => c.id === l.campaignId)).sort((a, b) => (b.receivedAt > a.receivedAt ? 1 : -1))
    const toHandOff = leads.filter((l) => l.status === "new" || l.status === "returned")
    const withReps = leads.filter((l) => l.status === "with_rep")
    const converted = leads.filter((l) => l.status === "converted")
    const funds = mdfSummary(state, company.id)
    const claimable = funds.all.filter((m) => m.status === "approved")
    const live = campaigns.filter((c) => c.status === "live" || c.status === "scheduled")
    const newKits = contentKits.filter((k) => k.isNew)
    return { campaigns, stats, pipeline, won, openDeals, leads, toHandOff, withReps, converted, funds, claimable, live, newKits }
  }, [state, me, company])
}

/** Campaign leads a Ridgeway rep has been handed (or, for the executive, every one in flight). */
export function useTeamCampaignLeads() {
  const { state } = useStore()
  const { me, company, isExec } = usePartner()
  return state.campaignLeads.filter((l) => l.companyId === company.id && (isExec ? l.status !== "new" : l.assignee === me.name))
}
