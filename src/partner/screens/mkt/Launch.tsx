import { useState } from "react"
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Coins, Lock, Rocket, ShieldAlert, Stamp } from "lucide-react"
import { toast } from "sonner"
import { AiTag, PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { addDays, date, NOW } from "@/lib/format"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { contentKits, disclosure, type Campaign } from "@/partner/marketing"
import { usePartner } from "@/partner/usePartner"
import { StageTag } from "@/partner/bits"
import { LockedClaims, TrackedLink } from "@/partner/screens/mkt/bits"
import { TODAY } from "@/partner/useDelivery"

const channelOptions = ["Email", "LinkedIn", "Landing page", "Webinar", "Events"]

/** Claims a partner can't make on Brightline's behalf. The Program agent checks the personal intro before publishing. */
const claimPattern = /(\d+\s?%|\d+\s?x\b|guarantee\w*|best[- ]in|#1|number one|fastest|cheapest|save \$?\d[\d,]*|roi of)/i

function Steps({ step }: { step: number }) {
  return (
    <ol className="mb-6 grid grid-cols-3 gap-2" aria-label="Steps">
      {["Pick a kit", "Make it yours", "Publish"].map((s, i) => (
        <li key={s} className={cn("flex items-center gap-2.5 rounded-[12px] border px-3 py-2.5 text-[14.5px] font-medium", i === step ? "border-primary bg-brand-soft/50 text-foreground" : i < step ? "text-foreground" : "text-muted-foreground")}>
          <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-[13px] font-bold", i < step ? "bg-ok text-white" : i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{i < step ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}</span>
          <span className="truncate">{s}</span>
        </li>
      ))}
    </ol>
  )
}

export function Launch({ kitId }: { kitId?: string }) {
  const { state, dispatch } = useStore()
  const { me, company } = usePartner()
  const [kit, setKit] = useState(contentKits.find((k) => k.id === kitId) ?? null)
  const [step, setStep] = useState(kit ? 1 : 0)
  const [name, setName] = useState(kit ? `${kit.title}: November` : "")
  const [channels, setChannels] = useState<string[]>(["Email", "LinkedIn"])
  const [intro, setIntro] = useState("")
  const [start, setStart] = useState(TODAY)
  const [made, setMade] = useState<Campaign | null>(null)
  const flagged = intro.match(claimPattern)?.[0]

  const pick = (id: string) => {
    const k = contentKits.find((x) => x.id === id)!
    setKit(k)
    setName(`${k.title}: November`)
    setStep(1)
  }
  const publish = () => {
    if (!kit) return
    const slug = kit.title.toLowerCase().replace(/[^a-z]+/g, "").slice(0, 8)
    const c: Campaign = {
      id: `CMP-${12 + state.campaigns.length}`, companyId: company.id, owner: me.name, name: name.trim() || kit.title, kitId: kit.id, channels,
      status: start > TODAY ? "scheduled" : "live", start, end: addDays(start, 45), link: `go.brightline.io/r/${company.short.toLowerCase()}-${me.first.toLowerCase()}-${slug}`,
      clicks: 0, earlierLeads: 0, createdAt: NOW.toISOString(),
    }
    dispatch({ type: "launchCampaign", campaign: c })
    setMade(c)
    setStep(2)
    toast.success(c.status === "live" ? "Your campaign is live" : "Your campaign is scheduled", { description: "Leads from your tracked link land in Leads." })
  }

  return (
    <div>
      <PageHeader back={{ label: "Campaigns", href: "/p/campaigns" }} title={<span className="flex flex-wrap items-center gap-3">Launch a campaign <StageTag /></span>} sub="Brightline-approved content, your logo in the approved area, and your own tracked link." />
      <Steps step={step} />

      {step === 0 && (
        <ul className="grid gap-4 md:grid-cols-2">
          {contentKits.map((k) => (
            <li key={k.id}>
              <button type="button" onClick={() => pick(k.id)} className="flex h-full w-full flex-col rounded-[14px] border bg-card p-5 text-left shadow-[0_1px_2px_#172b4508] transition hover:border-primary/60">
                <span className="flex flex-wrap items-center gap-2"><b className="text-[17px] text-foreground">{k.title}</b>{k.isNew && <Badge className="border-0 bg-amber text-[#2a1a00]">New</Badge>}</span>
                <span className="mt-1 text-[14.5px] text-muted-foreground">{k.summary}</span>
                <span className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary">{k.product}</Badge>
                  <Badge variant="secondary">{k.industry === "Any" ? "Any industry" : k.industry}</Badge>
                  <Badge variant="secondary">{k.pieces.length} pieces</Badge>
                </span>
                <span className="mt-auto pt-4 text-[13.5px] text-muted-foreground">Approved by Brightline until {date(k.approvedUntil)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {step === 1 && kit && (
        <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <Panel title={kit.title} sub="The only words you write are your intro. Everything else is Brightline's approved copy.">
            <div className="grid gap-5">
              <div className="grid gap-1.5">
                <Label htmlFor="cname" className="text-[15px]">Campaign name</Label>
                <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} className="h-11 text-[15.5px]" />
              </div>
              <fieldset className="grid gap-2">
                <legend className="mb-1 text-[15px] font-medium">Where you'll share it</legend>
                <div className="flex flex-wrap gap-2">
                  {channelOptions.map((ch) => {
                    const on = channels.includes(ch)
                    return (
                      <button key={ch} type="button" aria-pressed={on} onClick={() => setChannels(on ? channels.filter((x) => x !== ch) : [...channels, ch])} className={cn("h-10 rounded-full border px-4 text-[14.5px] font-medium", on ? "border-primary bg-brand-soft text-primary" : "text-foreground hover:border-primary/60")}>
                        {on && <Check className="mr-1 inline size-4" />}{ch}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
              <div className="grid gap-1.5">
                <Label htmlFor="intro" className="text-[15px]">Your intro <span className="font-normal text-muted-foreground">(optional, shown above Brightline's copy)</span></Label>
                <Textarea id="intro" value={intro} onChange={(e) => setIntro(e.target.value.slice(0, 280))} rows={3} className="text-[15.5px]" placeholder="e.g. We've helped hotels across the Midwest get one view of their properties. Here's how." />
                <div className="flex items-center justify-between gap-3 text-[13.5px]">
                  {flagged ? (
                    <span className="flex gap-2 text-bad"><ShieldAlert className="mt-0.5 size-4 shrink-0" /> "{flagged}" reads as a claim Brightline hasn't approved. Remove it, or rely on the approved claims.</span>
                  ) : intro.trim() ? <span className="flex items-center gap-2 text-ok"><Check className="size-4" /> No unapproved claims found</span> : <span className="text-muted-foreground">Checked for unapproved claims before you publish</span>}
                  <span className="shrink-0 text-muted-foreground tabular">{intro.length}/280</span>
                </div>
              </div>
              <div className="grid gap-1.5 sm:max-w-[260px]">
                <Label htmlFor="start" className="text-[15px]">Start</Label>
                <Input id="start" type="date" min={TODAY} value={start} onChange={(e) => setStart(e.target.value || TODAY)} className="h-11 text-[15.5px]" />
              </div>
            </div>
          </Panel>
          <div className="space-y-6">
            <Panel title="Co-branding" sub="Your logo goes in the area Brightline set aside. Brightline's logo stays as it is.">
              <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-[12px] border p-4">
                <span className="leading-tight"><b className="block text-foreground">Ridgeway IT logo</b><span className="text-[14px] text-muted-foreground">From your company profile</span></span>
                <Badge className="border-0 bg-amber-soft text-amber-ink"><Stamp className="size-3.5" /> In the approved area</Badge>
              </div>
            </Panel>
            <Panel title="Brightline's copy">
              <ul className="mb-4 space-y-1.5">{kit.pieces.map((p) => <li key={p.title} className="flex gap-2 text-[15px]"><span className="w-[118px] shrink-0 text-muted-foreground">{p.kind}</span><span className="text-foreground">{p.title}</span></li>)}</ul>
              <LockedClaims claims={kit.claims} disclosure={disclosure} />
              <button type="button" onClick={() => toast("Claim changes go to Brightline marketing for approval", { description: "You can't edit a claim yourself. Not part of this demo." })} className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary hover:underline">
                <Lock className="size-3.5" /> Need a different claim? Ask Brightline
              </button>
            </Panel>
            <div className="rounded-[12px] border bg-card p-4">
              <AiTag>Program agent check</AiTag>
              <p className="mt-2 text-[15px] text-foreground">{flagged ? "One problem: your intro makes a claim that isn't approved." : "Approved kit, approved claims, partnership disclosed. Ready to publish."}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="lg" onClick={() => setStep(0)}><ArrowLeft /> Other kits</Button>
              <Button size="lg" className="flex-1" disabled={!!flagged || !channels.length} onClick={publish}><Rocket /> {start > TODAY ? `Schedule for ${date(start)}` : "Publish now"}</Button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && made && (
        <Panel className="mx-auto max-w-[640px]">
          <div className="text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-ok-soft text-ok"><CheckCircle2 className="size-7" /></span>
            <h2 className="mt-3 text-[24px] font-bold">{made.status === "live" ? "Live with your tracked link" : `Scheduled for ${date(made.start)}`}</h2>
            <p className="mt-1 text-[15.5px] text-muted-foreground">{made.name} · {made.channels.join(", ")}</p>
          </div>
          <TrackedLink link={made.link} className="mt-5" />
          <ul className="mt-5 space-y-2 text-[15px]">
            <li className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-ok" /> Leads from the link land in your Leads, for you to hand to a rep.</li>
            <li className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-ok" /> Deals the rep registers count as pipeline from this campaign.</li>
            <li className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-ok" /> Brightline sees the totals, never who you sent it to.</li>
          </ul>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button size="lg" onClick={() => go(`/p/campaign/${made.id}`)}>See the campaign <ArrowRight /></Button>
            <Button size="lg" variant="outline" onClick={() => go(`/p/funds/request/${made.id}`)}><Coins /> Request funds for it</Button>
          </div>
        </Panel>
      )}
    </div>
  )
}
