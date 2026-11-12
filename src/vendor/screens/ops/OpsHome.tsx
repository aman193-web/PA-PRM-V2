import { ArrowRight, Inbox, Layers, RefreshCw, Scale, Sparkles } from "lucide-react"
import { Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ago, money } from "@/lib/format"
import { go } from "@/lib/router"
import { useStore } from "@/store"
import { salesforce } from "@/data/model"
import { Kpi } from "@/partner/bits"
import { useOps, useVendor } from "@/vendor/useVendor"
import { useVendorAssistant } from "@/vendor/VendorShell"
import { ExceptionRow } from "@/vendor/screens/ops/Exceptions"
import { RequestStatus } from "@/vendor/screens/ops/Programs"

/** Shared home pieces for the three Brightline roles. */
export function Greeting({ name, line }: { name: string; line: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-[28px] leading-tight font-bold sm:text-[32px]">Good afternoon, {name}.</h1>
      <p className="mt-1.5 text-[16.5px] text-muted-foreground">{line}</p>
    </div>
  )
}

export function AskBar({ placeholder, example }: { placeholder: string; example: string }) {
  const { ask } = useVendorAssistant()
  return (
    <button onClick={() => ask()} className="flex h-14 w-full items-center gap-3 rounded-[14px] border bg-card px-5 text-left text-[16px] text-muted-foreground shadow-[0_1px_2px_#172b4508] transition hover:border-primary/60">
      <Sparkles className="size-5 text-primary" />
      <span className="flex-1 truncate">{placeholder}</span>
      <span className="hidden text-[14px] sm:inline">e.g. "{example}"</span>
    </button>
  )
}

export function Recent({ items }: { items: { id: string; at: string; text: string; href?: string }[] }) {
  return (
    <Panel title="Recent">
      <ul className="space-y-3">
        {items.slice(0, 6).map((a) => (
          <li key={a.id} className="flex items-start gap-3">
            <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
            <div className="min-w-0 flex-1">
              {a.href ? <a href={`#${a.href}`} className="text-foreground hover:text-primary">{a.text}</a> : <span className="text-foreground">{a.text}</span>}
              <p className="text-[13.5px] text-muted-foreground">{ago(a.at)}</p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export function OpsHome() {
  const { state } = useStore()
  const { me } = useVendor()
  const o = useOps()
  const urgent = o.open.filter((x) => x.kind === "mismatch").length
  return (
    <div className="space-y-6">
      <Greeting name={me.first} line={o.open.length ? <>{o.open.length} exceptions are open{urgent ? <>, and <b className="text-bad">{urgent} {urgent === 1 ? "is" : "are"} holding partner credit</b></> : null}.</> : "No open exceptions. The data is clean."} />
      <AskBar placeholder="Ask about exceptions, reconciliation or Salesforce sync…" example="Is partner revenue reconciled?" />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <div className="relative col-span-2 overflow-hidden rounded-[14px] bg-night p-6 text-white">
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative flex h-full flex-col">
            <p className="text-[15px] font-medium text-[#b9cbe4]">Closed-won partner deals matched to Salesforce</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
              <span className="text-[48px] leading-none font-bold tabular">{o.matchedPct}%</span>
              <span className="text-[15.5px] text-[#cfe0f7]">{money(o.matchedValue)} verified</span>
            </div>
            <div className="mt-5 h-2.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-amber" style={{ width: `${o.matchedPct}%` }} /></div>
            <p className="mt-2 text-[14.5px] text-[#cfe0f7]">{o.held.length ? `${money(o.heldValue)} on hold: ${o.held.map((r) => r.account).join(", ")}` : "Nothing on hold"}</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <Button size="lg" className="bg-white text-night hover:bg-white/90" onClick={() => go("/v/revenue")}><Scale /> Reconciliation</Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => go("/v/exceptions")}><Inbox /> Exceptions</Button>
            </div>
          </div>
        </div>
        <Kpi icon={<Inbox />} label="Open exceptions" value={String(o.open.length)} sub={`${o.waiting.length} with someone else`} href="/v/exceptions" />
        <Kpi icon={<RefreshCw />} label="Salesforce sync" value={`${salesforce.lagSeconds} s`} sub={o.retrying.length ? `Target under 5 min · ${o.retrying.length} write retrying` : "Target under 5 min · all writes through"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <Panel title="Fix next" sub="Revenue mismatches first: they hold partner credit." action={<Button variant="ghost" onClick={() => go("/v/exceptions")}>All <ArrowRight /></Button>} bodyClass="px-0 sm:px-0 pb-1">
          {o.open.length === 0 ? <p className="px-6 pb-4 text-muted-foreground">You're all caught up.</p> : <ul>{[...o.open].sort((a, b) => (a.kind === "mismatch" ? -1 : b.kind === "mismatch" ? 1 : 0)).map((x) => <ExceptionRow key={x.id} x={x} compact />)}</ul>}
        </Panel>
        <div className="space-y-6">
          <Panel title="Your changes with Dana" sub="You propose; the channel chief approves (R-APR-2)" action={<Button variant="ghost" onClick={() => go("/v/programs")}><Layers /> Programs</Button>}>
            {o.myRequests.length === 0 ? <p className="text-muted-foreground">Nothing sent yet.</p> : (
              <ul className="space-y-3">
                {o.myRequests.slice(0, 4).map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-3">
                    <span className="min-w-0"><b className="block text-[15px] leading-snug text-foreground">{r.title}</b><span className="text-[13.5px] text-muted-foreground">{r.id} · {ago(r.at)}</span></span>
                    <RequestStatus status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Recent items={state.opsFeed} />
        </div>
      </div>
      <p className="text-[14px] text-muted-foreground"><Badge variant="outline" className="mr-2 border-dashed">Stage 1A</Badge>Every fix is logged with your name. Rules are versioned, never edited in place.</p>
    </div>
  )
}
