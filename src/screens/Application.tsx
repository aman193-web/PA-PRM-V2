import { useState } from "react"
import { ArrowRight, Check, CircleArrowUp, Clock, Globe, Loader2, MapPin, Users, X } from "lucide-react"
import { CheckIcon, CheckList, DecisionOption, PageHeader, Panel, PartnerAvatar } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Application, Tier } from "@/data/model"
import { me } from "@/data/model"
import { ago } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"

const declineReasons = ["Not a fit for this program", "Outside the regions we cover", "Already a partner under another name", "Application incomplete"]

export function ApplicationScreen({ id }: { id: string }) {
  const { state } = useStore()
  const app = state.applications.find((a) => a.id === id)
  if (!app) return <PageHeader title="Application not found" back={{ label: "Applications", href: "/partners/applications" }} />
  return (
    <div>
      <PageHeader
        back={{ label: "Applications", href: "/partners/applications" }}
        title={<span className="flex items-center gap-3"><PartnerAvatar name={app.company} size="lg" />{app.company}</span>}
        sub={`Applied to the ${app.program} program ${ago(app.appliedAt)} · ${app.id}`}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <Panel title="The company">
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <Fact icon={<Globe />} k="Website" v={app.website} />
              <Fact icon={<MapPin />} k="Headquarters" v={`${app.hq} · ${app.region}`} />
              <Fact icon={<Users />} k="Size" v={`${app.employees} people · founded ${app.founded}`} />
              <Fact icon={<CircleArrowUp />} k="Wants to sell" v={app.products.join(", ")} />
            </div>
            <blockquote className="mt-5 rounded-[10px] bg-muted px-4 py-3 text-[15.5px] text-foreground">
              <span className="mb-1 block text-[13px] font-semibold text-muted-foreground">{app.applicant.name}, {app.applicant.title}</span>
              "{app.message}"
            </blockquote>
          </Panel>
          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Agreements" sub="What's signed now and what comes next">
              <ul className="divide-y">
                {app.agreements.map((g) => (
                  <li key={g.name} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    {g.status === "after_accept" ? (
                      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"><Clock className="size-3.5" strokeWidth={2.5} /></span>
                    ) : (
                      <CheckIcon status={g.status === "missing" ? "warn" : "pass"} className="mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">{g.name}</p>
                      <p className="text-[14px] text-muted-foreground">{g.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Checks">
              <CheckList checks={app.checks} />
            </Panel>
          </div>
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          {app.status === "new" ? <Decide app={app} /> : <Done app={app} />}
        </aside>
      </div>
    </div>
  )
}

function Fact({ icon, k, v }: { icon: React.ReactNode; k: string; v: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-[9px] bg-brand-soft text-primary [&_svg]:size-4">{icon}</span>
      <div>
        <p className="text-[14px] text-muted-foreground">{k}</p>
        <p className="font-medium text-foreground">{v}</p>
      </div>
    </div>
  )
}

function Decide({ app }: { app: Application }) {
  const { dispatch } = useStore()
  const regionWarn = app.checks.some((c) => c.label === "Region" && c.status === "warn")
  const [choice, setChoice] = useState<"accept" | "decline" | "escalate" | null>(null)
  const [tier, setTier] = useState<Tier>("Registered")
  const [reason, setReason] = useState(declineReasons[0])
  const [note, setNote] = useState(regionWarn ? "EMEA applicant. Rui Costa covers this region; please decide or reassign." : "")
  const [busy, setBusy] = useState(false)

  const submit = () => {
    setBusy(true)
    setTimeout(() => {
      if (choice === "accept") dispatch({ type: "acceptApp", id: app.id, tier })
      if (choice === "decline") dispatch({ type: "rejectApp", id: app.id, reason })
      if (choice === "escalate") dispatch({ type: "escalateApp", id: app.id, note })
      setBusy(false)
    }, 350)
  }

  return (
    <Panel title="Your decision" sub={`${app.applicant.name} hears back by email right away`}>
      <div role="radiogroup" aria-label="Decision" className="grid gap-2">
        <DecisionOption active={choice === "accept"} tone="ok" onClick={() => setChoice("accept")} icon={<Check />} label="Accept" sub="Sends the agreement and starts onboarding" suggested={!regionWarn} />
        <DecisionOption active={choice === "decline"} tone="bad" onClick={() => setChoice("decline")} icon={<X />} label="Decline" sub="They'll see the reason you pick" />
        <DecisionOption active={choice === "escalate"} tone="primary" onClick={() => setChoice("escalate")} icon={<CircleArrowUp />} label="Escalate" sub={`${me.chief}, the channel chief, decides`} suggested={regionWarn} />
      </div>

      {choice === "accept" && (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-[15px]">Program</Label>
              <div className="flex h-10 items-center rounded-lg border bg-muted px-3 text-[15px] text-foreground">{app.program}</div>
            </div>
            <div className="space-y-2">
              <Label className="text-[15px]">Starting tier</Label>
              <Select value={tier} onValueChange={(v) => setTier(v as Tier)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["Registered", "Silver"] as Tier[]).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="rounded-[10px] bg-ok-soft/70 p-3 text-[14.5px] text-foreground">
            <p className="font-semibold">What happens next</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5">
              <li>Partner agreement is sent for signature</li>
              <li>They upload 2 documents and finish 3 tasks</li>
              <li>They can register deals; onboarding ends at the first one</li>
            </ol>
          </div>
        </div>
      )}
      {choice === "decline" && (
        <div className="mt-5 space-y-3">
          <Label className="text-[15px]">Reason they'll see</Label>
          <RadioGroup value={reason} onValueChange={setReason} className="grid gap-2">
            {declineReasons.map((r) => (
              <Label key={r} className={cn("flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] border px-3 py-2 text-[15px] font-normal", reason === r && "border-primary bg-brand-soft")}>
                <RadioGroupItem value={r} /> {r}
              </Label>
            ))}
          </RadioGroup>
        </div>
      )}
      {choice === "escalate" && (
        <div className="mt-5 space-y-3">
          <p className="text-[15px]">Send to <b className="text-foreground">{me.chief}</b>, the channel chief, for a decision. You'll be told the outcome.</p>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why are you escalating?" />
        </div>
      )}
      {choice && (
        <Button size="lg" className={cn("mt-5 w-full", choice === "accept" && "bg-ok text-white hover:bg-ok/90", choice === "decline" && "bg-bad text-white hover:bg-bad/90")} disabled={busy || (choice === "escalate" && !note.trim())} onClick={submit}>
          {busy && <Loader2 className="animate-spin" />}
          {choice === "accept" ? `Accept ${app.company}` : choice === "decline" ? "Decline application" : `Send to ${me.chief.split(" ")[0]}`}
        </Button>
      )}
      {!choice && regionWarn && (
        <p className="mt-4 rounded-[10px] bg-amber-soft px-3 py-2 text-[14.5px] text-amber-ink">This company is outside your region. Escalating lets the channel chief decide or reassign it.</p>
      )}
    </Panel>
  )
}

function Done({ app }: { app: Application }) {
  const { state } = useStore()
  const next = state.applications.find((a) => a.status === "new")
  const map = {
    accepted: { title: "Accepted", body: `${app.company} got a welcome email and the partner agreement. Onboarding has started.`, cls: "bg-ok-soft text-ok", icon: <Check className="size-5" /> },
    rejected: { title: "Declined", body: `${app.applicant.name} was told: ${app.outcomeNote}.`, cls: "bg-bad-soft text-bad", icon: <X className="size-5" /> },
    escalated: { title: `Sent to ${me.chief}`, body: "The channel chief will accept or decline it. You'll get a notification.", cls: "bg-brand-soft text-primary", icon: <CircleArrowUp className="size-5" /> },
    new: { title: "", body: "", cls: "", icon: null },
  }[app.status]
  return (
    <Panel>
      <div className="flex items-start gap-3">
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-full", map.cls)}>{map.icon}</span>
        <div>
          <p className="text-[18px] font-bold text-foreground">{map.title}</p>
          <p className="mt-0.5 text-[15px]">{map.body}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-2">
        {app.status === "accepted" && <Button size="lg" onClick={() => go("/partners/onboarding")}>Track onboarding <ArrowRight /></Button>}
        {next ? (
          <Button size="lg" variant={app.status === "accepted" ? "outline" : "default"} onClick={() => go(`/application/${next.id}`)}>Next: {next.company} <ArrowRight /></Button>
        ) : (
          <Button size="lg" variant="outline" onClick={() => go("/partners/applications")}>All applications</Button>
        )}
      </div>
    </Panel>
  )
}
