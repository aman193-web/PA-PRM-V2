import { useState } from "react"
import { ArrowRight, Award, Check, CheckCircle2, ClipboardCheck, Lock, Paperclip } from "lucide-react"
import { toast } from "sonner"
import { PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { date } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { milestoneKinds, type MilestoneKind } from "@/partner/delivery"
import { usePartner } from "@/partner/usePartner"
import { TODAY, useDelivery } from "@/partner/useDelivery"
import { StageTag } from "@/partner/bits"

const delivering = ["Workshop", "Design sign-off", "Pilot / POC"]

/** Log a delivery milestone in about 30 seconds. It becomes a touch on the Salesforce opportunity: evidence for credit. */
export function LogMilestone({ engId, taskId }: { engId?: string; taskId?: string }) {
  const { state, dispatch } = useStore()
  const { me } = usePartner()
  const t = useDelivery()
  const loggable = t.views.filter((v) => v.canLog)
  const first = loggable.find((v) => v.e.id === engId) ?? loggable[0]
  const [eid, setEid] = useState(first?.e.id ?? "")
  const v = t.views.find((x) => x.e.id === eid)
  const task = v?.e.tasks.find((x) => x.id === taskId && eid === engId)
  const [kind, setKind] = useState<MilestoneKind>(task?.milestone ?? "Workshop")
  const [text, setText] = useState(task ? task.title : "")
  const [file, setFile] = useState(false)
  const [done, setDone] = useState<{ account: string; kind: string; upgraded?: string } | null>(null)

  const choose = (id: string) => { setEid(id); setText(""); setKind("Workshop") }
  const submit = () => {
    if (!v) return
    const willUpgrade = delivering.includes(kind) ? state.skills.find((k) => k.person === me.name && k.level === "Certified" && v.e.product.includes(k.product)) : undefined
    dispatch({ type: "logMilestone", engagementId: v.e.id, kind, text: text.trim() + (file ? " (evidence attached)" : ""), taskId: task?.id, by: me.name })
    setDone({ account: v.e.account, kind, upgraded: willUpgrade?.product })
    toast.success(`${kind} recorded on ${v.e.account}`, { description: "It's a touch on the Salesforce opportunity now." })
  }

  if (done)
    return (
      <div>
        <PageHeader back={{ label: "Deals you work on", href: "/p/work" }} title="Milestone recorded" />
        <Panel className="mx-auto max-w-[620px]">
          <div className="text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-ok-soft text-ok"><CheckCircle2 className="size-7" /></span>
            <h2 className="mt-3 text-[24px] font-bold">{done.kind} on {done.account}</h2>
            <p className="mt-1 text-[15.5px] text-muted-foreground">Recorded {date(TODAY)} as a touch on the Salesforce opportunity</p>
          </div>
          {done.upgraded && <p className="mt-5 flex items-center gap-2.5 rounded-[12px] bg-ok-soft/70 px-4 py-3 text-[15.5px] font-medium text-foreground"><Award className="size-5 text-ok" /> You're now Sell-Ready in {done.upgraded}.</p>}
          <ul className="mt-5 space-y-2 text-[15px]">
            <li className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-ok" /> The attribution agent uses it as evidence for Northpeak's credit.</li>
            <li className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-ok" /> Jordan Lee, Northpeak's partner manager, sees it on the opportunity.</li>
            <li className="flex gap-2.5"><Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> Touches can't be edited or deleted. Add a new one to correct it.</li>
          </ul>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button size="lg" onClick={() => go(`/p/work/${eid}`)}>Back to the deal <ArrowRight /></Button>
            <Button size="lg" variant="outline" onClick={() => { setDone(null); setText(""); setFile(false); go("/p/log") }}>Log another</Button>
          </div>
        </Panel>
      </div>
    )

  return (
    <div>
      <PageHeader back={{ label: "Deals you work on", href: "/p/work" }} title={<span className="flex flex-wrap items-center gap-3">Log a milestone <StageTag /></span>} sub="Tell Brightline what you delivered. It's recorded as a touch on the deal, the evidence behind Northpeak's credit." />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Panel>
          <div className="grid gap-5">
            <div className="grid gap-1.5">
              <Label className="text-[15px]">Deal</Label>
              <Select value={eid} onValueChange={choose}>
                <SelectTrigger className="h-12 w-full text-[15.5px]"><SelectValue placeholder="Pick a deal" /></SelectTrigger>
                <SelectContent>
                  {t.views.map((x) => <SelectItem key={x.e.id} value={x.e.id} disabled={!x.canLog}>{x.e.account} · {x.e.product}{x.canLog ? "" : " · waiting for approval"}</SelectItem>)}
                </SelectContent>
              </Select>
              {task && <span className="text-[14px] text-primary">From the joint plan: {task.title}</span>}
            </div>
            <fieldset className="grid gap-2">
              <legend className="mb-1 text-[15px] font-medium">Milestone</legend>
              <div className="flex flex-wrap gap-2">
                {milestoneKinds.map((k) => (
                  <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={cn("h-10 rounded-full border px-4 text-[14.5px] font-medium", kind === k ? "border-primary bg-brand-soft text-primary" : "text-foreground hover:border-primary/60")}>
                    {kind === k && <Check className="mr-1 inline size-4" />}{k}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-1.5">
              <Label htmlFor="what" className="text-[15px]">What happened</Label>
              <Textarea id="what" value={text} onChange={(e) => setText(e.target.value.slice(0, 240))} rows={3} className="text-[15.5px]" placeholder="e.g. Ran the data-source inventory with the fleet team; 14 sources mapped" />
            </div>
            <button type="button" onClick={() => setFile(!file)} className={cn("flex items-center gap-3 rounded-[12px] border p-3 text-left", file && "border-primary bg-brand-soft/40")}>
              <Paperclip className="size-5 text-muted-foreground" />
              <span className="flex-1"><b className="block text-[15px] text-foreground">{file ? "sign-off.pdf attached" : "Attach evidence (optional)"}</b><span className="text-[13.5px] text-muted-foreground">A sign-off, agenda or screenshot (demo: nothing is uploaded)</span></span>
              {file && <Badge className="border-0 bg-ok-soft text-ok">Attached</Badge>}
            </button>
            <Button size="lg" className="h-12 text-[16px]" disabled={!v?.canLog || text.trim().length < 4} onClick={submit}><ClipboardCheck /> Record it on the deal</Button>
          </div>
        </Panel>
        <div className="space-y-6">
          <Panel title="Where it goes">
            <ul className="space-y-2.5 text-[15px]">
              <li className="flex gap-2.5"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />A touch on the Salesforce opportunity, with your name and today's date</li>
              <li className="flex gap-2.5"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />The attribution agent counts it as evidence for Northpeak's credit</li>
              <li className="flex gap-2.5"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />A workshop, design or pilot can move you to Sell-Ready in that product</li>
            </ul>
          </Panel>
          {t.views.some((x) => !x.canLog) && (
            <Panel title="Not open for logging yet">
              <ul className="space-y-2">{t.views.filter((x) => !x.canLog).map((x) => <li key={x.e.id} className="text-[15px]"><b className="text-foreground">{x.e.account}</b><span className="block text-[14px] text-muted-foreground">{x.blockedWhy}</span></li>)}</ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}
