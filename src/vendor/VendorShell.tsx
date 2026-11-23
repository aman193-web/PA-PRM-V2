import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { PlatformBanner } from "@/components/PlatformBanner"
import {
  ArrowUp, Bell, Bot, Building2, Coins, Cpu, Handshake, Home, Inbox, KeyRound, Layers, LogOut, Moon, Presentation, Route, Scale,
  ScrollText, Search, ShieldCheck, Shuffle, Sparkles, Sun, TrendingUp, TriangleAlert, Users, Workflow, Wrench, type LucideIcon,
} from "lucide-react"
import { Logo } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { date, money } from "@/lib/format"
import { go } from "@/lib/router"
import { useTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { budget } from "@/chief/data"
import { exceptionKindLabel, sellerAccounts, type VendorRoleId } from "@/vendor/data"
import { agentRoster } from "@/vendor/agents"
import { partnerNameOf, useAdmin, useAgents, useExec, useOps, useSales, useSeller, useVendor } from "@/vendor/useVendor"

/* ---------- navigation ---------- */

interface NavItem { key: string; label: string; short?: string; href: string; icon: LucideIcon; count?: number; mobile?: boolean }

function useNav(): NavItem[] {
  const { me } = useVendor()
  const o = useOps()
  const s = useSeller()
  const e = useExec()
  const c = useSales()
  const ad = useAdmin()
  const g = useAgents()
  const { state } = useStore()
  const cosellOn = !!state.platform.flags.find((f) => f.id === "cosell")?.on.brightline
  if (me.role === "cro")
    return [
      { key: "home", label: "Home", href: "/v/home", icon: Home, mobile: true },
      { key: "pipeline", label: "Pipeline", href: "/v/pipeline", icon: Layers, mobile: true },
      { key: "risk", label: "Deals at risk", short: "At risk", href: "/v/risk", icon: TriangleAlert, count: c.risks.filter((r) => !r.underway && !r.nudges.length).length, mobile: true },
      { key: "conflicts", label: "Channel conflicts", short: "Conflicts", href: "/v/conflicts", icon: Scale, count: c.openConflicts.length, mobile: true },
    ]
  if (me.role === "it")
    return [
      { key: "home", label: "Home", href: "/v/home", icon: Home, mobile: true },
      { key: "connections", label: "Connections", href: "/v/connections", icon: Workflow, count: ad.requested.length + (ad.merge ? 1 : 0), mobile: true },
      { key: "mappings", label: "Field mappings", short: "Mappings", href: "/v/mappings", icon: Shuffle, count: ad.pendingMappings.length },
      { key: "users", label: "Users and roles", short: "Users", href: "/v/users", icon: Users, count: ad.support.length + ad.newGroups.length + ad.leavers.length, mobile: true },
      { key: "audit", label: "Audit log", short: "Audit", href: "/v/audit", icon: ScrollText, mobile: true },
    ]
  if (me.role === "aisup")
    return [
      { key: "home", label: "Home", href: "/v/home", icon: Home, mobile: true },
      { key: "agents", label: "Agents", href: "/v/agents", icon: Cpu, mobile: true },
      { key: "activity", label: "Agent activity", short: "Activity", href: "/v/activity", icon: Bot, count: g.overrides.length, mobile: true },
      { key: "cost", label: "AI cost", short: "Cost", href: "/v/cost", icon: Coins, mobile: true },
      { key: "models", label: "AI models", short: "Models", href: "/v/models", icon: Sparkles },
    ]
  if (me.role === "revops")
    return [
      { key: "home", label: "Home", href: "/v/home", icon: Home, mobile: true },
      { key: "exceptions", label: "Exceptions", href: "/v/exceptions", icon: Inbox, count: o.open.length, mobile: true },
      { key: "revenue", label: "Reconciliation", short: "Revenue", href: "/v/revenue", icon: Scale, count: o.held.length, mobile: true },
      { key: "programs", label: "Programs and rules", short: "Programs", href: "/v/programs", icon: Layers, mobile: true },
    ]
  if (me.role === "ae")
    return [
      { key: "home", label: "Home", href: "/v/home", icon: Home, mobile: true },
      { key: "accounts", label: "My accounts", short: "Accounts", href: "/v/accounts", icon: Building2, count: s.inReview.length, mobile: true },
      ...(cosellOn ? [{ key: "cosell", label: "Co-sell", href: "/v/cosell", icon: Handshake, count: s.dueSoon.length, mobile: true }] : []),
    ]
  return [
    { key: "home", label: "Home", href: "/v/home", icon: Home, mobile: true },
    { key: "revenue", label: "Partner revenue", short: "Revenue", href: "/v/revenue", icon: TrendingUp, mobile: true },
    { key: "approvals", label: "Approvals", href: "/v/approvals", icon: Inbox, count: e.pending.length, mobile: true },
    { key: "board", label: "Board view", short: "Board", href: "/v/board", icon: Presentation, mobile: true },
  ]
}

/** Each role's main action: a button at the top of the sidebar and the centre of the phone bar. */
function useMainAction(role: VendorRoleId) {
  const o = useOps()
  const ad = useAdmin()
  if (role === "cro") return { key: "risk", label: "Open deals at risk", short: "At risk", href: "/v/risk", icon: TriangleAlert }
  if (role === "it") {
    const connector = !ad.pendingMappings.length && ad.requested.length > 0
    return { key: "approve", label: connector ? "Approve a connector" : "Approve a mapping", short: "Approve", href: connector ? "/v/connections" : "/v/mappings", icon: Shuffle }
  }
  if (role === "aisup") return { key: "agents", label: "Pause or tune an agent", short: "Agents", href: "/v/agents", icon: Cpu }
  if (role === "revops") return { key: "resolve", label: "Resolve next exception", short: "Resolve", href: o.open[0] ? `/v/exception/${o.open[0].id}` : "/v/exceptions", icon: Wrench }
  if (role === "ae") return { key: "find", label: "Find a partner", short: "Find", href: "/v/find", icon: Handshake }
  return { key: "board", label: "Share the board view", short: "Share", href: "/v/board", icon: Presentation }
}

const avatarTint: Record<VendorRoleId, string> = {
  revops: "bg-[#e8f6fb] text-[#06779e] dark:bg-[#10303d] dark:text-[#7fd3f0]",
  ae: "bg-[#fdecef] text-[#b4234a] dark:bg-[#3a1520] dark:text-[#f5a3b8]",
  ceo: "bg-[#eef2e3] text-[#4d6b1f] dark:bg-[#1f2a12] dark:text-[#b5d77a]",
  cro: "bg-[#fdeee4] text-[#b4441a] dark:bg-[#3a1d10] dark:text-[#f7b08a]",
  it: "bg-[#e9edf2] text-[#3d4f66] dark:bg-[#1d2733] dark:text-[#a9bacf]",
  aisup: "bg-[#f9e8f7] text-[#a02a94] dark:bg-[#3a1537] dark:text-[#f0a6e6]",
}
const assistantSub: Record<VendorRoleId, string> = {
  revops: "About exceptions and data", ae: "About your accounts and partners", ceo: "About revenue and return",
  cro: "About pipeline and deals at risk", it: "About systems, users and the log", aisup: "About agents and AI cost",
}
/** Roles whose main action is already a tab, so the phone bar has no raised button. */
const centerless = (r: VendorRoleId) => r === "ceo" || r === "cro" || r === "aisup"

/* ---------- assistant: answers from what the signed-in person can see ---------- */

interface Msg { from: "me" | "ai"; text: string; links?: { label: string; href: string }[] }
const AskCtx = createContext<{ ask: (q?: string) => void }>({ ask: () => {} })
export const useVendorAssistant = () => useContext(AskCtx)

const suggestions: Record<VendorRoleId, string[]> = {
  revops: ["What needs fixing today?", "Is partner revenue reconciled?", "Is Salesforce in sync?", "What's waiting for Dana?"],
  ae: ["What needs me today?", "Who should I bring in on Solstice Hotels?", "What are partners doing on my accounts?", "Find a partner"],
  ceo: ["Is the channel worth the investment?", "What needs my approval?", "Who are our top partners?", "What would model version 3 change?"],
  cro: ["Which partner deals close this quarter?", "What's at risk?", "Any channel conflicts?", "How big is partner pipeline?"],
  it: ["What needs me?", "Is Salesforce in sync?", "Who has access?", "What's in the audit log today?"],
  aisup: ["What did the agents do today?", "Which overrides need a look?", "What does AI cost this month?", "What's waiting for Dana?"],
}
const shortcuts: Record<string, string> = { "Find a partner": "/v/find" }

function VendorAssistant({ children }: { children: ReactNode }) {
  const { me } = useVendor()
  const { state } = useStore()
  const o = useOps()
  const s = useSeller()
  const e = useExec()
  const c = useSales()
  const ad = useAdmin()
  const g = useAgents()
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [draft, setDraft] = useState("")
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }) }, [msgs])

  const answerOps = (t: string): Msg => {
    if (t.includes("fix") || t.includes("today") || t.includes("need") || t.includes("exception"))
      return { from: "ai", text: o.open.length ? `${o.open.length} exceptions are open:\n${o.open.map((x) => `• ${exceptionKindLabel[x.kind]}: ${x.title}`).join("\n")}` : "No open exceptions. The agents will flag new ones here.", links: [{ label: "Open Exceptions", href: "/v/exceptions" }] }
    if (t.includes("reconcil") || t.includes("revenue") || t.includes("ledger"))
      return { from: "ai", text: `${o.matchedPct}% of closed-won partner deals match Salesforce (${money(o.matchedValue)}). ${o.held.length ? `${money(o.heldValue)} is on hold: ${o.held.map((r) => r.account).join(", ")}.` : "Nothing is on hold."}`, links: [{ label: "Open Reconciliation", href: "/v/revenue" }] }
    if (t.includes("sync") || t.includes("salesforce") || t.includes("write"))
      return { from: "ai", text: `${o.writes.length - o.retrying.length} of the last ${o.writes.length} Salesforce writes went through. ${o.retrying.length ? `${o.retrying.length} is retrying: ${o.retrying.map((w) => w.text).join("; ")}.` : "None are retrying."} Sync lag is under 2 minutes (target: 5).`, links: [{ label: "Open Exceptions", href: "/v/exceptions" }] }
    if (t.includes("dana") || t.includes("rule") || t.includes("waiting") || t.includes("program"))
      return { from: "ai", text: o.myPending.length ? `${o.myPending.length} of your changes are waiting for Dana Ortiz:\n${o.myPending.map((r) => `• ${r.title}`).join("\n")}` : "Nothing of yours is waiting for Dana.", links: [{ label: "Open Programs", href: "/v/programs" }] }
    return { from: "ai", text: "I can help with exceptions, reconciliation, Salesforce sync and your rule changes." }
  }
  const answerAe = (t: string): Msg => {
    const v = s.views.find((x) => t.includes(x.a.name.toLowerCase().split(" ")[0]))
    if (v && v.a.need && !v.requests.some((c) => c.status !== "declined"))
      return { from: "ai", text: `${v.a.name} needs ${v.a.need.charAt(0).toLowerCase()}${v.a.need.slice(1)}. I've ranked the partners who fit, with reasons. You choose and send; I never send for you.`, links: [{ label: "Find a partner", href: `/v/find/${v.a.id}` }] }
    if (v)
      return { from: "ai", text: `${v.a.name}: ${v.a.stage}${v.a.oppId ? `, ${money(v.a.value)}` : ""}. ${v.partners.length ? `Partners: ${v.partners.map((p) => `${p.name} (${p.role})`).join(", ")}.` : "No partner yet."}`, links: [{ label: `Open ${v.a.name}`, href: `/v/account/${v.a.id}` }] }
    if (t.includes("need") || t.includes("today"))
      return { from: "ai", text: [
        ...s.inReview.map(({ v: x, r }) => `• ${partnerNameOf(state, r.partnerId)} registered a deal on ${x.a.name}. Jordan Lee is reviewing it; you can add what you know.`),
        ...s.dueSoon.map(({ v: x, p }) => `• ${p.text} on ${x.a.name}, due ${date(p.due)}.`),
        ...s.needPartner.map((x) => `• ${x.a.name} has no partner yet.`),
      ].join("\n") || "Nothing needs you right now.", links: [{ label: "Go to Home", href: "/v/home" }] }
    if (t.includes("partner") || t.includes("doing") || t.includes("activity"))
      return { from: "ai", text: `Partners are on ${s.involved.length} of your ${s.views.length} accounts (${money(s.involvedValue)}).\n${s.involved.map((x) => `• ${x.a.name}: ${x.partners.map((p) => p.name).join(", ")}`).join("\n")}`, links: [{ label: "My accounts", href: "/v/accounts" }] }
    return { from: "ai", text: "I can help with your accounts, the partners on them and co-sell. I only see your accounts." }
  }
  const answerCeo = (t: string): Msg => {
    if (t.includes("worth") || t.includes("roi") || t.includes("return") || t.includes("invest") || t.includes("budget"))
      return { from: "ai", text: `Partners brought in ${money(e.rev.won)} of verified revenue this year, ${Math.round(e.share * 100)}% of Brightline's total, against ${money(budget.spent)} of program cost: a ${e.roi.toFixed(1)}x return. That's ${e.pct}% of the ${money(budget.revenueTarget)} target. Figures are verified: matched to Salesforce closed-won.`, links: [{ label: "Partner revenue", href: "/v/revenue" }, { label: "Board view", href: "/v/board" }] }
    if (t.includes("approv") || t.includes("need"))
      return { from: "ai", text: e.pending.length ? `${e.pending.length} waiting for you:\n${e.pending.map((x) => `• ${x.title}${x.amount ? ` (${money(x.amount)})` : ""}`).join("\n")}` : "Nothing is waiting for you.", links: [{ label: "Open Approvals", href: "/v/approvals" }] }
    if (t.includes("model") || t.includes("version"))
      return { from: "ai", text: `Version 3 raises Implementation from 20 to 30 and lowers Technology to 15 and Influenced to 5. Had it applied this year, it would change ${e.dealsChanged} deals split by the model. ${e.impact.slice(0, 3).map((i) => `${i.name} ${i.won + i.open >= 0 ? "+" : "−"}${money(Math.abs(i.won + i.open))}`).join(", ")}. Past periods keep version 2.`, links: [{ label: "Review version 3", href: "/v/approval/AM-3" }] }
    if (t.includes("partner") || t.includes("top"))
      return { from: "ai", text: `Top partners by verified revenue: ${e.rev.top.map((p) => `${p.name} (${money(p.won)})`).join(", ")}.`, links: [{ label: "Partner revenue", href: "/v/revenue" }] }
    return { from: "ai", text: "I can help with partner revenue, return on the program, and your approvals." }
  }
  const answerCro = (t: string): Msg => {
    if (t.includes("risk"))
      return { from: "ai", text: c.risks.length ? `${c.risks.length} partner deals are at risk (${money(c.riskValue)}):\n${c.risks.map((r) => `• ${r.account}, ${money(r.value)}: ${r.flags[0].label.charAt(0).toLowerCase()}${r.flags[0].label.slice(1)}`).join("\n")}` : "No partner deals are at risk.", links: [{ label: "Open deals at risk", href: "/v/risk" }] }
    if (t.includes("conflict"))
      return { from: "ai", text: c.openConflicts.length ? `${c.openConflicts.length} open:\n${c.openConflicts.map((x) => `• ${x.reg.customer}: ${x.partner} against ${x.reg.conflict!.owner}. Jordan Lee decides`).join("\n")}` : "No open channel conflicts.", links: [{ label: "Channel conflicts", href: "/v/conflicts" }] }
    if (t.includes("close") || t.includes("quarter"))
      return { from: "ai", text: `${money(c.closingValue)} of North America partner pipeline is due to close this quarter, in ${c.closingQ4.length} deals. Biggest: ${[...c.closingQ4].sort((a, b) => b.value - a.value).slice(0, 3).map((d) => `${d.account} (${money(d.value)}, ${d.stage})`).join(", ")}.`, links: [{ label: "Pipeline", href: "/v/pipeline" }] }
    if (t.includes("pipeline") || t.includes("big") || t.includes("stage"))
      return { from: "ai", text: `Partners are on ${money(c.total)} of open pipeline: ${c.regions.map((r) => `${r.region} ${money(r.value)}`).join(", ")}. By stage: ${c.byStage.map((b) => `${b.stage} ${money(b.total)}`).join(", ")}.`, links: [{ label: "Pipeline", href: "/v/pipeline" }] }
    return { from: "ai", text: "I can help with partner pipeline, deals at risk and channel conflicts. I see every partner deal; deciding stays with partner managers." }
  }
  const answerIt = (t: string): Msg => {
    if (t.includes("need") || t.includes("today") || t.includes("approve"))
      return { from: "ai", text: ad.tasks.length ? `${ad.tasks.length} things need you:\n${ad.tasks.map((x) => `• ${x.title}`).join("\n")}` : "Nothing needs you right now.", links: [{ label: "Go to Home", href: "/v/home" }] }
    if (t.includes("sync") || t.includes("salesforce"))
      return { from: "ai", text: `Sync lag is 1 min 40 s (target under 5 minutes). ${ad.writes.length - ad.retrying.length} of the last ${ad.writes.length} writes went through${ad.retrying.length ? `; ${ad.retrying.length} is retrying` : ""}.`, links: [{ label: "Connections", href: "/v/connections" }] }
    if (t.includes("access") || t.includes("user") || t.includes("who"))
      return { from: "ai", text: `${ad.provisioned} people have PRM access through ${state.groups.filter((x) => x.status === "mapped").length} Okta groups.${ad.newGroups.length ? ` ${ad.newGroups.map((x) => `${x.group} (${x.people} people) has no role yet`).join("; ")}.` : ""}${ad.leavers.length ? ` ${ad.leavers.map((u) => `${u.name} leaves on ${date(u.leavesOn!, { month: "short", day: "numeric" })}`).join("; ")}.` : ""}`, links: [{ label: "Users and roles", href: "/v/users" }] }
    if (t.includes("audit") || t.includes("log"))
      return { from: "ai", text: `The audit log has ${state.audit.length} lines. Latest:\n${state.audit.slice(0, 4).map((x) => `• ${x.actor}: ${x.text}`).join("\n")}`, links: [{ label: "Audit log", href: "/v/audit" }] }
    return { from: "ai", text: "I can help with connections, field mappings, users and the audit log." }
  }
  const answerAi = (t: string): Msg => {
    if (t.includes("override") || t.includes("look"))
      return { from: "ai", text: g.overrides.length ? `${g.overrides.length} to review:\n${g.overrides.map((x) => `• ${agentRoster.find((a) => a.id === x.agent)?.name} on ${x.target}: ${x.detail ?? ""}`).join("\n")}` : "No overrides to review.", links: [{ label: "Overrides", href: "/v/activity/overrides" }] }
    if (t.includes("cost") || t.includes("spend"))
      return { from: "ai", text: `${money(g.month)} so far this month, ${Math.round((g.month / g.budget) * 100)}% of the ${money(g.budget)} budget. The Insights agent costs most (${money(388)}), up 41% on September.`, links: [{ label: "AI cost", href: "/v/cost" }] }
    if (t.includes("dana") || t.includes("waiting") || t.includes("request"))
      return { from: "ai", text: g.pending.length ? `${g.pending.length} waiting for Dana Ortiz:\n${g.pending.map((r) => `• ${r.title}`).join("\n")}` : "Nothing of yours is waiting for Dana.", links: [{ label: "Agents", href: "/v/agents" }] }
    if (t.includes("today") || t.includes("did") || t.includes("agent"))
      return { from: "ai", text: `${g.running} of ${g.roster.length} agents are running. Latest:\n${g.log.slice(0, 4).map((x) => `• ${agentRoster.find((a) => a.id === x.agent)?.name}: ${x.text} (${x.target})`).join("\n")}`, links: [{ label: "Agent activity", href: "/v/activity" }] }
    return { from: "ai", text: "I can help with the agents' autonomy, their activity and overrides, and AI cost." }
  }
  const answer = (q: string): Msg => {
    const t = q.toLowerCase()
    const by = { revops: answerOps, ae: answerAe, ceo: answerCeo, cro: answerCro, it: answerIt, aisup: answerAi }
    return by[me.role](t)
  }
  const send = (q: string) => {
    if (!q.trim()) return
    if (shortcuts[q]) { setOpen(false); go(shortcuts[q]); return }
    setMsgs((m) => [...m, { from: "me", text: q }, answer(q)])
    setDraft("")
  }
  const ask = (q?: string) => { setOpen(true); if (q) setTimeout(() => send(q), 50) }

  return (
    <AskCtx.Provider value={{ ask }}>
      {children}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 data-[side=right]:sm:max-w-[440px]">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle className="flex items-center gap-2 text-[18px]"><Sparkles className="size-5 text-primary" /> PartnerAssistant</SheetTitle>
            <SheetDescription className="text-[14px]">Answers from what {me.first} can see.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {msgs.length === 0 && (
              <div className="space-y-2">
                <p className="text-[15px] text-muted-foreground">Try one of these:</p>
                {suggestions[me.role].map((q) => (
                  <button key={q} onClick={() => send(q)} className="block w-full rounded-[12px] border bg-card px-4 py-3 text-left text-[15px] text-foreground hover:border-primary/60">{q}</button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={m.from === "me" ? "ml-10 rounded-[14px] rounded-br-[4px] bg-primary px-4 py-2.5 text-[15px] text-primary-foreground" : "mr-6 rounded-[14px] rounded-bl-[4px] bg-muted px-4 py-3 text-[15px] whitespace-pre-line text-foreground"}>
                {m.text}
                {m.links && <div className="mt-2.5 flex flex-wrap gap-2">{m.links.map((l) => <Button key={l.href} size="sm" variant="outline" className="bg-card" onClick={() => { setOpen(false); go(l.href) }}>{l.label}</Button>)}</div>}
              </div>
            ))}
            <div ref={end} />
          </div>
          <form className="flex gap-2 border-t p-4" onSubmit={(ev) => { ev.preventDefault(); send(draft) }}>
            <Input value={draft} onChange={(ev) => setDraft(ev.target.value)} placeholder="Ask a question…" className="h-12 flex-1 text-[15.5px]" />
            <Button type="submit" size="icon" className="size-12" aria-label="Send"><ArrowUp /></Button>
          </form>
        </SheetContent>
      </Sheet>
    </AskCtx.Provider>
  )
}

/* ---------- notifications ---------- */

interface Alert { id: string; title: string; body: string; href: string; tone: "bad" | "warn" | "info" | "ok" }

function useAlerts(): Alert[] {
  const { state } = useStore()
  const { me } = useVendor()
  const o = useOps()
  const s = useSeller()
  const e = useExec()
  const c = useSales()
  const ad = useAdmin()
  const g = useAgents()
  return useMemo(() => {
    const out: Alert[] = []
    if (me.role === "cro") {
      for (const r of c.risks.filter((x) => !x.underway && !x.nudges.length)) out.push({ id: `risk-${r.key}`, title: `${r.account} is at risk`, body: `${money(r.value)} · ${r.flags[0].label}`, href: "/v/risk", tone: r.flags[0].kind === "deadline" ? "bad" : "warn" })
      for (const x of c.openConflicts) out.push({ id: `cf-${x.reg.id}`, title: `Channel conflict on ${x.reg.customer}`, body: `${x.partner} against ${x.reg.conflict!.owner} · Jordan Lee decides`, href: "/v/conflicts", tone: "info" })
      for (const n of c.settled) out.push({ id: `ok-${n.id}`, title: `${n.account} is no longer at risk`, body: `After you asked ${n.toName}`, href: "/v/risk", tone: "ok" })
    } else if (me.role === "it") {
      for (const t of ad.tasks) out.push({ id: `t-${t.id}`, title: t.title, body: t.sub, href: t.href, tone: t.kind === "leaver" ? "bad" : "warn" })
      for (const w of ad.retrying) out.push({ id: `w-${w.id}`, title: "A Salesforce write is retrying", body: w.text, href: "/v/connections", tone: "info" })
    } else if (me.role === "aisup") {
      for (const x of g.overrides) out.push({ id: `o-${x.id}`, title: `${x.who} overrode the ${agentRoster.find((a) => a.id === x.agent)?.name}`, body: `${x.target}: ${x.detail ?? x.text}`, href: "/v/activity/overrides", tone: "warn" })
      for (const r of g.myRequests.filter((x) => x.status !== "pending")) out.push({ id: `r-${r.id}-${r.status}`, title: `Dana ${r.status}: ${r.title}`, body: r.note ?? (r.status === "approved" ? "It's in effect now" : "Nothing changed"), href: `/v/agent/${r.agent ?? "deal-desk"}`, tone: r.status === "approved" ? "ok" : "info" })
      out.push({ id: "cost", title: "Insights agent cost is up 41%", body: `${money(g.month)} this month across all agents, of a ${money(g.budget)} budget`, href: "/v/cost", tone: "info" })
    } else if (me.role === "revops") {
      for (const x of o.open) out.push({ id: x.id, title: x.title, body: `${exceptionKindLabel[x.kind]} · flagged by the ${x.source}`, href: `/v/exception/${x.id}`, tone: x.kind === "mismatch" ? "bad" : "warn" })
      for (const r of o.myRequests.filter((x) => x.status !== "pending"))
        out.push({ id: `r-${r.id}-${r.status}`, title: `Dana ${r.status}: ${r.title}`, body: r.note ?? (r.status === "approved" ? "It's a new rules version now" : "Nothing changed"), href: "/v/programs", tone: r.status === "approved" ? "ok" : "info" })
      for (const x of state.crmIssues.filter((i) => i.reported && !o.open.some((ex) => ex.issueId === i.id)))
        out.push({ id: `i-${x.id}`, title: `Jordan Lee flagged: ${x.title}`, body: x.detail, href: "/v/exceptions", tone: "warn" })
    } else if (me.role === "ae") {
      for (const { v, r } of s.inReview) out.push({ id: `reg-${r.id}`, title: `${partnerNameOf(state, r.partnerId)} registered a deal on ${v.a.name}`, body: "Jordan Lee is reviewing it. Add what you know", href: `/v/account/${v.a.id}`, tone: "warn" })
      for (const c of state.cosell.filter((x) => x.decidedAt && x.decidedAt >= "2026-10-28"))
        out.push({ id: `cs-${c.id}-${c.status}`, title: `${partnerNameOf(state, c.partnerId)} ${c.status} your co-sell request`, body: c.status === "accepted" ? `${c.owner} owns it. The joint plan is ready` : c.declineReason ?? "", href: `/v/account/${c.accountId}`, tone: c.status === "accepted" ? "ok" : "info" })
      for (const { v, p } of s.dueSoon) out.push({ id: `p-${v.a.id}-${p.id}`, title: `${p.text}`, body: `${v.a.name} · due ${date(p.due)}`, href: `/v/account/${v.a.id}`, tone: "info" })
      for (const n of state.croNudges.filter((x) => x.to === "seller" && x.toName === "Sam Rivera")) {
        const acct = sellerAccounts.find((a) => a.name === n.account)
        out.push({ id: `cro-${n.id}`, title: `Priya Shah (CRO) asked about ${n.account}`, body: n.text, href: acct ? `/v/account/${acct.id}` : "/v/home", tone: "warn" })
      }
    } else {
      for (const x of e.pending) out.push({ id: x.id, title: x.title, body: `From ${x.from}${x.amount ? ` · ${money(x.amount)}` : ""}`, href: `/v/approval/${x.id}`, tone: "warn" })
      out.push({ id: "q4", title: "Weekly update: partner revenue", body: `${money(e.rev.won)} verified this year · ${e.roi.toFixed(1)}x return on the program`, href: "/v/home", tone: "info" })
    }
    return out
  }, [me.role, o, s, e, c, ad, g, state])
}

function Notifications() {
  const alerts = useAlerts()
  const [read, setRead] = useState<Set<string>>(new Set())
  const unread = alerts.filter((a) => !read.has(a.id)).length
  return (
    <Popover onOpenChange={(open) => !open && setRead(new Set(alerts.map((a) => a.id)))}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications, ${unread} unread`}>
          <Bell className="size-5" />
          {unread > 0 && <span className="absolute top-1 right-1 grid min-w-[18px] place-items-center rounded-full bg-amber px-1 text-[11.5px] leading-[18px] font-bold text-[#2a1a00]">{unread}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(400px,calc(100vw-24px))] p-0">
        <div className="flex items-baseline justify-between border-b px-5 py-4">
          <b className="text-[16px] text-foreground">Notifications</b>
          <span className="text-[13px] text-muted-foreground">Also sent to Slack and email</span>
        </div>
        <ul className="max-h-[420px] overflow-y-auto">
          {alerts.length === 0 && <li className="px-5 py-6 text-muted-foreground">You're all caught up.</li>}
          {alerts.map((n) => (
            <li key={n.id}>
              <button onClick={() => go(n.href)} className="flex w-full gap-3 border-b px-5 py-3.5 text-left last:border-0 hover:bg-muted/60">
                <span className={cn("mt-2 size-2 shrink-0 rounded-full", read.has(n.id) ? "bg-border-strong" : n.tone === "bad" ? "bg-bad" : n.tone === "warn" ? "bg-amber" : n.tone === "ok" ? "bg-ok" : "bg-primary")} />
                <span className="min-w-0">
                  <span className="block font-semibold text-foreground">{n.title}</span>
                  <span className="block text-[14px] text-muted-foreground">{n.body}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

/* ---------- search: only what this person may see ---------- */

function VendorSearch({ autoFocus, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const { state } = useStore()
  const { me } = useVendor()
  const s = useSeller()
  const e = useExec()
  const c = useSales()
  const g = useAgents()
  const [q, setQ] = useState("")
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const t = q.trim().toLowerCase()
  const hits = !t ? [] : me.role === "cro"
    ? c.deals.filter((d) => `${d.account} ${d.partners.join(" ")} ${d.owner ?? ""}`.toLowerCase().includes(t)).slice(0, 6).map((d) => ({ key: d.key, title: d.account, sub: `${d.stage} · ${money(d.value)} · ${d.partners.join(", ")}`, href: c.risks.some((r) => r.account === d.account) ? "/v/risk" : "/v/pipeline" }))
    : me.role === "it"
      ? [
          ...state.staff.filter((u) => `${u.name} ${u.role} ${u.group}`.toLowerCase().includes(t)).map((u) => ({ key: u.id, title: u.name, sub: `${u.role} · ${u.group}`, href: "/v/users" })),
          ...state.mappings.filter((m) => `${m.prm} ${m.target}`.toLowerCase().includes(t)).map((m) => ({ key: m.id, title: `${m.prm} → ${m.target.split(" (")[0]}`, sub: `Field mapping · ${m.status}`, href: "/v/mappings" })),
          ...state.audit.filter((x) => `${x.actor} ${x.text}`.toLowerCase().includes(t)).slice(0, 4).map((x) => ({ key: x.id, title: x.text, sub: `${x.actor} · ${x.id}`, href: "/v/audit" })),
        ].slice(0, 8)
      : me.role === "aisup"
        ? [
            ...g.roster.filter((a) => `${a.name} ${a.job}`.toLowerCase().includes(t)).map((a) => ({ key: a.id, title: a.name, sub: `${a.level} · ${a.job}`, href: `/v/agent/${a.id}` })),
            ...g.log.filter((x) => `${x.target} ${x.text}`.toLowerCase().includes(t)).slice(0, 4).map((x) => ({ key: x.id, title: x.target, sub: x.text, href: "/v/activity" })),
          ]
        : me.role === "revops"
    ? [
        ...state.exceptions.filter((x) => x.title.toLowerCase().includes(t)).map((x) => ({ key: x.id, title: x.title, sub: `${exceptionKindLabel[x.kind]} · ${x.status}`, href: `/v/exception/${x.id}` })),
        ...state.ledger.filter((l) => l.account.toLowerCase().includes(t)).slice(0, 4).map((l) => ({ key: l.id, title: l.account, sub: `Ledger ${l.id} · ${money(l.amount)}`, href: "/v/revenue" })),
      ]
    : me.role === "ae"
      ? s.views.filter((v) => `${v.a.name} ${v.a.industry}`.toLowerCase().includes(t)).map((v) => ({ key: v.a.id, title: v.a.name, sub: `${v.a.stage} · ${money(v.a.value)}`, href: `/v/account/${v.a.id}` }))
      : e.rev.all.filter((p) => p.name.toLowerCase().includes(t)).slice(0, 6).map((p) => ({ key: p.id, title: p.name, sub: `${p.tier} ${p.program.toLowerCase()} · ${money(p.won)} verified`, href: "/v/revenue" }))
  const placeholder = { revops: "Search exceptions and the ledger", ae: "Search your accounts", ceo: "Search partners", cro: "Search partner deals", it: "Search users, mappings and the log", aisup: "Search agents and their actions" }[me.role]
  const pick = (href: string) => { go(href); setQ(""); setOpen(false); onDone?.() }
  return (
    <div ref={box} className="relative w-full max-w-[520px]" onBlur={(ev) => !box.current?.contains(ev.relatedTarget as Node) && setOpen(false)}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        autoFocus={autoFocus}
        onChange={(ev) => { setQ(ev.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={(ev) => { if (ev.key === "Enter" && hits[0]) pick(hits[0].href); if (ev.key === "Escape") setOpen(false) }}
        placeholder={placeholder}
        aria-label="Search"
        className="h-11 w-full rounded-[12px] border bg-card pr-3 pl-11 text-[15.5px] text-foreground shadow-[0_1px_2px_#172b450a] outline-none placeholder:text-muted-foreground focus:border-primary"
      />
      {open && t && (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-[12px] border bg-popover shadow-lg">
          {hits.length === 0 ? <p className="px-4 py-3 text-[15px] text-muted-foreground">Nothing matches "{q}".</p> : (
            <ul>{hits.map((h) => (
              <li key={h.key}>
                <button onMouseDown={(ev) => ev.preventDefault()} onClick={() => pick(h.href)} className="block w-full border-b px-4 py-2.5 text-left last:border-0 hover:bg-muted/60">
                  <b className="block text-[15px] text-foreground">{h.title}</b>
                  <span className="text-[13.5px] text-muted-foreground">{h.sub}</span>
                </button>
              </li>
            ))}</ul>
          )}
        </div>
      )}
    </div>
  )
}

/* ---------- shell ---------- */

function ShellInner({ section, children, onSignOut }: { section: string; children: ReactNode; onSignOut: () => void }) {
  const { me } = useVendor()
  const nav = useNav()
  const action = useMainAction(me.role)
  const { ask } = useVendorAssistant()
  const { resolvedTheme, setTheme } = useTheme()
  const [searching, setSearching] = useState(false)
  const mobile = nav.filter((n) => n.mobile)
  // Where the main action is already a tab (CFO, CRO, AI supervisor), there's no raised button in the phone bar.
  const flat = centerless(me.role)
  const bar: NavItem[] = flat ? mobile : [...mobile.slice(0, Math.ceil(mobile.length / 2)), { key: action.key, label: action.short, href: action.href, icon: action.icon }, ...mobile.slice(Math.ceil(mobile.length / 2))]

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="sticky top-0 hidden h-svh flex-col border-r bg-sidebar lg:flex">
        <div className="px-6 pt-6 pb-5"><Logo /></div>
        <div className="mx-4 mb-4 flex items-center gap-3 rounded-[12px] border px-3 py-2.5">
          <span className="grid size-9 place-items-center rounded-[9px] bg-night text-[14px] font-bold text-white">B</span>
          <span className="min-w-0 leading-tight">
            <b className="block text-[15px] text-foreground">Brightline</b>
            <span className="block text-[13px] text-muted-foreground">{me.roleLabel}</span>
          </span>
        </div>
        <div className="px-4 pb-3">
          <Button size="lg" variant={flat ? "outline" : "default"} className="h-11 w-full justify-start gap-2.5 text-[15.5px]" onClick={() => go(action.href)}>
            <action.icon className="size-5" /> {action.label}
          </Button>
        </div>
        <nav className="grid gap-1 overflow-y-auto px-3" aria-label="Main">
          {nav.map((n) => {
            const active = section === n.key
            return (
              <a key={n.key} href={`#${n.href}`} aria-current={active ? "page" : undefined} className={cn("flex h-11 items-center gap-3 rounded-[10px] px-3 text-[15.5px] font-medium transition-colors", active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-muted")}>
                <n.icon className="size-5" />
                <span className="flex-1">{n.label}</span>
                {n.count ? <span className="grid min-w-6 place-items-center rounded-full bg-amber px-1.5 text-[13px] leading-6 font-bold text-[#2a1a00]">{n.count}</span> : null}
              </a>
            )
          })}
        </nav>
        <div className="mt-auto space-y-3 p-4">
          <button onClick={() => ask()} className="flex w-full items-center gap-3 rounded-[12px] bg-night px-4 py-3 text-left text-white transition hover:bg-night-2">
            <Sparkles className="size-5 text-amber" />
            <span className="leading-tight"><b className="block text-[15px]">Ask PartnerAssistant</b><span className="text-[13px] text-[#b9cbe4]">{assistantSub[me.role]}</span></span>
          </button>
          <a href="#/v/journeys" className={cn("flex items-center gap-2 rounded-[10px] px-3 py-2 text-[14.5px] text-muted-foreground hover:bg-muted hover:text-foreground", section === "journeys" && "bg-muted text-foreground")}>
            <Route className="size-4" /> The three journeys
          </a>
          <a href="#/v/access" className={cn("flex items-center gap-2 rounded-[10px] px-3 py-2 text-[14.5px] text-muted-foreground hover:bg-muted hover:text-foreground", section === "access" && "bg-muted text-foreground")}>
            <KeyRound className="size-4" /> Your access
          </a>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-[68px] items-center gap-1 border-b bg-background/85 px-3 backdrop-blur sm:gap-3 sm:px-6 lg:px-10">
          <a href="#/v/home" className="mr-1 shrink-0 lg:hidden"><Logo /></a>
          <div className="hidden min-w-0 flex-1 md:block"><VendorSearch /></div>
          <div className="flex-1 md:hidden" />
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSearching(true)} aria-label="Search"><Search className="size-5" /></Button>
          <Button variant="outline" className="hidden h-10 gap-2 sm:inline-flex lg:hidden" onClick={() => ask()}><Sparkles className="size-4 text-primary" /> Ask</Button>
          <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => ask()} aria-label="Ask PartnerAssistant"><Sparkles className="size-5 text-primary" /></Button>
          <Notifications />
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label={resolvedTheme === "dark" ? "Use light theme" : "Use dark theme"}>
            {resolvedTheme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn("grid size-10 shrink-0 place-items-center rounded-full text-[14px] font-semibold", avatarTint[me.role])} aria-label="Account">{me.initials}</button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="text-[15px] text-foreground">{me.name}<span className="block text-[13px] font-normal text-muted-foreground">{me.title} · Brightline</span></DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => go("/v/journeys")}><Route /> The three journeys</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => go("/v/access")}><ShieldCheck /> Your access</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{resolvedTheme === "dark" ? <Sun /> : <Moon />} {resolvedTheme === "dark" ? "Light" : "Dark"} theme</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onSignOut}><LogOut /> Sign out · switch role</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <Sheet open={searching} onOpenChange={setSearching}>
          <SheetContent side="top" className="px-4 pt-5 pb-6">
            <SheetTitle className="mb-3">Search</SheetTitle>
            <VendorSearch autoFocus onDone={() => setSearching(false)} />
          </SheetContent>
        </Sheet>
        <main className="mx-auto w-full max-w-[1240px] px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-8 lg:pb-16"><PlatformBanner />{children}</main>
      </div>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 grid border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden" style={{ gridTemplateColumns: `repeat(${bar.length}, minmax(0, 1fr))` }}>
        {bar.map((n) => {
          const active = section === n.key
          if (n.key === action.key && !flat)
            return (
              <a key={n.key} href={`#${n.href}`} aria-current={active ? "page" : undefined} className="flex flex-col items-center gap-1 pt-1.5 pb-2 text-[13px] font-semibold text-primary">
                <span className="-mt-5 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_16px_#0969da55]"><n.icon className="size-6" /></span>
                {n.label}
              </a>
            )
          return (
            <a key={n.key} href={`#${n.href}`} aria-current={active ? "page" : undefined} className={cn("relative flex flex-col items-center gap-1 py-2.5 text-[13px] font-medium", active ? "text-primary" : "text-muted-foreground")}>
              <n.icon className="size-[22px]" />
              {n.short ?? n.label}
              {n.count ? <span className="absolute top-1.5 left-[calc(50%+6px)] grid min-w-[18px] place-items-center rounded-full bg-amber px-1 text-[11.5px] leading-[18px] font-bold text-[#2a1a00]">{n.count}</span> : null}
            </a>
          )
        })}
      </nav>
    </div>
  )
}

export function VendorShell(props: { section: string; children: ReactNode; onSignOut: () => void }) {
  return <VendorAssistant><ShellInner {...props} /></VendorAssistant>
}
