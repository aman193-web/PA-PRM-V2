import { useState } from "react"
import { CalendarPlus, Check, Clock, Mail, Send, Sparkles, TrendingDown, TrendingUp, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { PageHeader, PartnerAvatar, Sparkline, Stage2Tag } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { HealthSignal, HealthTrend } from "@/data/model"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"

const groups: { trend: HealthTrend; title: string; sub: string; icon: React.ReactNode; tone: "ok" | "amber" | "bad"; cls: string }[] = [
  { trend: "at_risk", title: "At risk", sub: "Act this week", icon: <TriangleAlert />, tone: "bad", cls: "bg-bad-soft text-bad" },
  { trend: "stalling", title: "Stalling", sub: "Worth a nudge", icon: <TrendingDown />, tone: "amber", cls: "bg-amber-soft text-amber-ink" },
  { trend: "rising", title: "Rising", sub: "Build on the momentum", icon: <TrendingUp />, tone: "ok", cls: "bg-ok-soft text-ok" },
]

export function Health() {
  const { state } = useStore()
  const [draft, setDraft] = useState<HealthSignal | null>(null)
  return (
    <div>
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">Partner health <Stage2Tag /></span>}
        sub="Which of your partners are rising, stalling or at risk, and the growth coach's suggestion for each. You decide what to send."
      />
      <div className="grid gap-6 xl:grid-cols-3">
        {groups.map((g) => {
          const items = state.health.filter((h) => h.trend === g.trend)
          return (
            <section key={g.trend}>
              <header className="mb-3 flex items-center gap-3">
                <span className={cn("grid size-9 place-items-center rounded-[10px] [&_svg]:size-5", g.cls)}>{g.icon}</span>
                <div>
                  <h2 className="text-[18px] font-semibold">{g.title} <span className="font-normal text-muted-foreground">· {items.length}</span></h2>
                  <p className="text-[14px] text-muted-foreground">{g.sub}</p>
                </div>
              </header>
              <ul className="grid gap-3">
                {items.map((h) => <SignalCard key={h.id} h={h} tone={g.tone} onAct={() => setDraft(h)} />)}
              </ul>
            </section>
          )
        })}
      </div>
      {draft && <DraftDialog h={draft} onClose={() => setDraft(null)} />}
    </div>
  )
}

function SignalCard({ h, tone, onAct }: { h: HealthSignal; tone: "ok" | "amber" | "bad"; onAct: () => void }) {
  const { partner, dispatch } = useStore()
  const p = partner(h.partnerId)!
  const done = h.status !== "open"
  return (
    <li className={cn("rounded-[14px] border bg-card p-5 shadow-[0_1px_2px_#172b4508]", done && "opacity-70")}>
      <div className="flex items-center gap-3">
        <PartnerAvatar name={p.name} />
        <b className="min-w-0 flex-1 truncate text-[16px] text-foreground">{p.name}</b>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 rounded-[10px] border px-3 py-2">
        <p className="text-[14.5px] font-medium text-foreground">{h.metric}</p>
        <Sparkline data={h.series} tone={tone} className="shrink-0" />
      </div>
      <p className="mt-3 text-[15px]">{h.why}</p>
      <div className="mt-4 rounded-[12px] bg-muted/70 p-4">
        <p className="inline-flex items-center gap-1.5 text-[13px] font-semibold tracking-wide text-primary uppercase"><Sparkles className="size-4" /> Coach suggests</p>
        <p className="mt-1 font-semibold text-foreground">{h.suggestion.title}</p>
        <p className="text-[14.5px]">{h.suggestion.detail}</p>
        <p className="mt-1 text-[14px] text-muted-foreground">Expected: {h.suggestion.value}</p>
        {done ? (
          <p className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-semibold text-ok">
            {h.status === "done" ? <><Check className="size-4" /> Sent</> : <><Clock className="size-4" /> Snoozed for a week</>}
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={onAct}>{h.suggestion.kind === "meeting" ? <CalendarPlus /> : <Mail />} {h.suggestion.kind === "meeting" ? "Draft invite" : "Draft email"}</Button>
            <Button variant="ghost" onClick={() => { dispatch({ type: "signal", id: h.id, status: "snoozed" }); toast("Snoozed for a week") }}>Not now</Button>
          </div>
        )}
      </div>
    </li>
  )
}

function DraftDialog({ h, onClose }: { h: HealthSignal; onClose: () => void }) {
  const { partner, dispatch } = useStore()
  const p = partner(h.partnerId)!
  const [subject, setSubject] = useState(h.draft.subject)
  const [body, setBody] = useState(h.draft.body)
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{h.suggestion.kind === "meeting" ? "Meeting invite" : "Email"} to {p.contact.name}</DialogTitle>
          <DialogDescription>Drafted by the coach. Edit anything; nothing is sent until you press Send.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="text-[15px]">To</Label>
          <Input value={`${p.contact.name} <${p.contact.email}>`} readOnly tabIndex={-1} className="bg-muted" />
        </div>
        <div className="space-y-2">
          <Label className="text-[15px]">Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-[15px]">Message</Label>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-44" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              dispatch({ type: "signal", id: h.id, status: "done" })
              toast.success(`Sent to ${p.contact.name}`, { description: subject })
              onClose()
            }}
          >
            <Send /> Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
