import { useMemo } from "react"
import { ArrowRight, Check, ExternalLink, Loader2, RefreshCw, Send, ShieldCheck, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { PageHeader, Panel, SalesforceMark } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CrmWrite } from "@/data/model"
import { crmObjects, salesforce } from "@/data/model"
import { ago, NOW } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"

/** Live writes from this session's approvals, followed by the earlier ones. */
export function useSalesforce() {
  const { state, partner } = useStore()
  return useMemo(() => {
    const live: CrmWrite[] = state.registrations
      .filter((r) => r.crm && r.decision?.by === "you" && r.decision.at === NOW.toISOString())
      .map((r) => ({
        id: `live-${r.id}`,
        at: r.decision!.at,
        text: `${r.crm!.linked === "existing" ? "Linked" : "Created"} opportunity ${r.crm!.opportunityId} with ${partner(r.partnerId)?.name} as ${r.crm!.role}`,
        source: `You approved ${r.customer}`,
        href: `/registration/${r.id}`,
        status: r.crm!.sync === "synced" ? "synced" : "pending",
      }))
    const writes = [...live, ...state.crmWrites]
    const pending = writes.filter((w) => w.status === "pending").length
    const retrying = writes.filter((w) => w.status === "retrying").length
    const today = writes.filter((w) => w.at.startsWith("2026-10-28")).length
    return { writes, pending, retrying, today, issues: state.crmIssues }
  }, [state, partner])
}

export function Salesforce() {
  const { dispatch } = useStore()
  const sf = useSalesforce()
  const healthy = sf.retrying === 0

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="flex items-center gap-3"><SalesforceMark className="h-7 w-10" /> Salesforce</span>}
        sub="Your decisions write to Salesforce automatically. Check here that they landed."
        actions={
          <Button variant="outline" size="lg" onClick={() => toast("Opens Salesforce in a new tab", { description: "Not connected in this demo." })}>
            <ExternalLink /> Open Salesforce
          </Button>
        }
      />

      <section className="flex flex-wrap items-center gap-5 rounded-[14px] bg-night p-5 text-white sm:p-6">
        <span className="grid size-14 shrink-0 place-items-center rounded-[12px] bg-white">
          <SalesforceMark className="h-8 w-11" />
        </span>
        <div className="min-w-0 flex-1 basis-64">
          <p className="flex flex-wrap items-center gap-2 text-[18px] font-semibold">
            Connected
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-semibold", healthy ? "bg-ok/25 text-[#8ff0b9]" : "bg-amber/25 text-amber")}>
              <span className={cn("size-2 rounded-full", healthy ? "bg-[#4fd18b]" : "bg-amber")} />
              {healthy ? "Healthy" : `${sf.retrying} write retrying`}
            </span>
          </p>
          <p className="text-[15px] text-[#b9cbe4]">{salesforce.org} · {salesforce.environment} · managed by {salesforce.admin}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-1 text-[15px]">
          <dt className="text-[#b9cbe4]">Last sync</dt><dd className="font-semibold">{ago(salesforce.lastSync)}</dd>
          <dt className="text-[#b9cbe4]">Sync delay</dt><dd className="font-semibold">1 min 40 s <span className="font-normal text-[#b9cbe4]">· target under 5 min</span></dd>
        </dl>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat k="Written today" v={sf.today} sub="Opportunities and partner roles" />
        <Stat k="Writing now" v={sf.pending} sub="Usually done in seconds" />
        <Stat k="Retrying" v={sf.retrying} sub="Queued, nothing lost" tone={sf.retrying ? "amber" : undefined} />
        <Stat k="With RevOps" v={sf.issues.filter((i) => i.reported).length} sub="Data they're fixing" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Recent writes from your work" sub="Every approval creates or links an opportunity and adds the partner role" bodyClass="px-0 sm:px-0 pb-2">
          <ul>
            {sf.writes.map((w) => (
              <li key={w.id} className="border-t first:border-t-0">
                <a href={w.href ? `#${w.href}` : undefined} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/50 sm:px-6">
                  <span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-full", w.status === "synced" ? "bg-ok-soft text-ok" : w.status === "pending" ? "bg-brand-soft text-primary" : "bg-amber-soft text-amber-ink")}>
                    {w.status === "synced" ? <Check className="size-4" /> : w.status === "pending" ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-foreground">{w.text}</span>
                    <span className="text-[14px] text-muted-foreground">{w.source} · {ago(w.at)}{w.attempt ? ` · ${w.attempt}` : ""}</span>
                  </span>
                  <Badge className={cn("shrink-0 border-0", w.status === "synced" ? "bg-ok-soft text-ok" : w.status === "pending" ? "bg-brand-soft text-primary" : "bg-amber-soft text-amber-ink")}>
                    {w.status === "synced" ? "In Salesforce" : w.status === "pending" ? "Writing" : "Retrying"}
                  </Badge>
                </a>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-6">
          <Panel title="Needs attention" sub="You can't break anything here; these are for your awareness">
            <ul className="space-y-3">
              {sf.issues.map((i) => (
                <li key={i.id} className={cn("rounded-[12px] border p-4", i.tone === "bad" ? "border-bad/30" : "border-amber/50")}>
                  <p className="flex items-start gap-2 font-semibold text-foreground">
                    <TriangleAlert className={cn("mt-0.5 size-4 shrink-0", i.tone === "bad" ? "text-bad" : "text-amber-ink")} />
                    {i.title}
                  </p>
                  <p className="mt-1 text-[14.5px]">{i.detail}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{i.reported ? "RevOps is on it" : i.owner}</Badge>
                    {i.href && <Button size="sm" variant="ghost" asChild><a href={`#${i.href}`}>Open <ArrowRight /></a></Button>}
                    {!i.reported && (
                      <Button size="sm" variant="outline" className="ml-auto" onClick={() => { dispatch({ type: "reportIssue", id: i.id }); toast.success("Sent to RevOps", { description: i.title }) }}>
                        <Send /> Tell RevOps
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="What PRM reads and writes">
            <ul className="divide-y">
              {crmObjects.map((o) => (
                <li key={o.name} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <span>
                    <b className="block text-foreground">{o.name}</b>
                    <span className="text-[14px] text-muted-foreground">{o.use}</span>
                  </span>
                  <Badge variant="outline" className="shrink-0">{o.direction}</Badge>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex gap-2 text-[14px] text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" /> Salesforce stays the system of record. Field mappings are set by your CRM admin.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function Stat({ k, v, sub, tone }: { k: string; v: number; sub: string; tone?: "amber" }) {
  return (
    <div className={cn("rounded-[14px] border bg-card p-4 shadow-[0_1px_2px_#172b4508] sm:p-5", tone === "amber" && "border-amber/60")}>
      <p className="text-[15px] text-muted-foreground">{k}</p>
      <p className={cn("text-[30px] leading-tight font-bold text-foreground tabular", tone === "amber" && "text-amber-ink")}>{v}</p>
      <p className="text-[14px] text-muted-foreground">{sub}</p>
    </div>
  )
}
