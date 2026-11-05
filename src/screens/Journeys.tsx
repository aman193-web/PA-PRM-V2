import { ArrowDown, ArrowRight, Ban, Check, CornerDownRight } from "lucide-react"
import { AddedTag, PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface JourneyStep {
  title: string
  detail: string
  href: string
  ids: string
  main?: boolean
  /** Standard practice we added where the documents are silent. */
  extra?: boolean
}

export interface Journey { n: number; title: string; tag: string; stage: string; steps: JourneyStep[] }

export interface JourneysConfig {
  title: string
  sub?: string
  journeys: Journey[]
  handoffs: [string, string, boolean?][]
  canTitle: string
  can: string[]
  cannot: string[]
  note?: string
}

const cols: Record<number, string> = { 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5" }

const journeys: Journey[] = [
  {
    n: 1, title: "Work the review queue", tag: "J-01 Deal registration", stage: "Stage 1A",
    steps: [
      { title: "Nudged at 50% of SLA", detail: "In the notification bell (and Slack or email): \"Acme, $62K, conflict found\". Opens straight to the deal.", href: "/home", ids: "DR-06 · DR-07" },
      { title: "Sees the conflict and AI advice", detail: "Deal and conflicting Salesforce opportunity side by side, with the recommendation and its evidence.", href: "/registration/REG-2041", ids: "DR-03 · DR-04 · DR-05" },
      { title: "Approves, rejects or asks for info", detail: "Three taps from home. Rejecting needs a reason code; asking for info pauses the SLA.", href: "/registration/REG-2041", ids: "DR-08", main: true },
      { title: "Partner told in one second", detail: "Reason sent; Salesforce opportunity and partner role linked, with sync status shown separately.", href: "/queue/decided", ids: "DR-09 · SL-02" },
      { title: "Grants or denies extensions", detail: "Protection end date, the partner's reason and CRM activity in one panel.", href: "/queue/extensions", ids: "DR-10" },
    ],
  },
  {
    n: 2, title: "Onboard partners", tag: "Recruitment & onboarding modules", stage: "Stage 1A",
    steps: [
      { title: "Reviews the application", detail: "Company profile, agreement status and automatic checks.", href: "/application/APP-118", ids: "BRD §11 Recruitment" },
      { title: "Accepts or rejects", detail: "Accept with program and starting tier, decline with a reason, or escalate to the channel chief.", href: "/application/APP-118", ids: "Apply and accept", main: true },
      { title: "Partner starts onboarding", detail: "Agreements, documents and tasks tracked; eligible to register once done, complete at the first deal.", href: "/partners/onboarding", ids: "BRD §11 Onboarding · DR-03" },
    ],
  },
  {
    n: 3, title: "Manage credit and growth", tag: "J-02 Revenue proof · J-04 Growth", stage: "Stages 1B and 2",
    steps: [
      { title: "Adds partners and roles", detail: "Any number of partners per opportunity; the program model recalculates the split.", href: "/opportunity/006Q8000021NgtR", ids: "MP-01 · MP-05" },
      { title: "Proposes a split change", detail: "Before and after, evidence from partner touches, sent to the channel chief to approve.", href: "/opportunity/006Q8000024HrvL", ids: "MP-02 · MP-04", main: true },
      { title: "Acts on at-risk partners", detail: "Rising, stalling and at-risk partners with the coach's suggestion; you edit and send.", href: "/health", ids: "ME-11 · ME-07 · Stage 2" },
    ],
  },
]

/** One role's journeys from the persona document: each row left to right, each step opens its screen. */
export function JourneysView({ c }: { c: JourneysConfig }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={c.title}
        sub={c.sub ?? "Each row is one journey from the persona document, left to right. Select a step to open that screen. Highlighted steps are the main action."}
      />
      {c.journeys.some((j) => j.steps.some((s) => s.extra)) && (
        <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-dashed border-amber-ink/50 bg-amber-soft/40 px-5 py-3.5 text-[15px] text-foreground">
          <AddedTag />
          Steps with this tag aren't in the persona documents. They're standard practice we filled in, to confirm with the product owner.
        </div>
      )}
      {c.journeys.map((j) => (
        <Panel
          key={j.n}
          title={<span className="flex flex-wrap items-center gap-2">Journey {j.n} · {j.title} <Badge variant="secondary">{j.stage}</Badge></span>}
          sub={j.tag}
        >
          <ol className={cn("grid gap-3", cols[j.steps.length] ?? "lg:grid-cols-3")}>
            {j.steps.map((s, i) => (
              <li key={s.title} className="relative">
                <a
                  href={`#${s.href}`}
                  className={cn(
                    "flex h-full flex-col rounded-[12px] border p-4 transition hover:border-primary hover:shadow-[0_6px_18px_#172b4512]",
                    s.main && "border-2 border-primary bg-brand-soft/70",
                    s.extra && "border-2 border-dashed border-amber-ink/60 bg-amber-soft/30",
                  )}
                >
                  <span className={cn("grid size-7 place-items-center rounded-full text-[14px] font-bold", s.main ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>{i + 1}</span>
                  {s.extra && <AddedTag short className="mt-3 w-fit" />}
                  <b className="mt-3 text-[16px] leading-snug text-foreground">{s.title}</b>
                  <span className="mt-1 text-[14.5px]">{s.detail}</span>
                  <span className="mt-auto flex items-center justify-between gap-2 pt-3 text-[13px] text-muted-foreground">
                    {s.ids}
                    <ArrowRight className="size-4 text-primary" />
                  </span>
                </a>
                {i < j.steps.length - 1 && (
                  <ArrowDown className="mx-auto my-1 size-4 text-muted-foreground lg:hidden" />
                )}
              </li>
            ))}
          </ol>
        </Panel>
      ))}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Hand-offs">
          <ul className="space-y-3 text-[15px]">
            {c.handoffs.map(([k, v, extra]) => (
              <li key={k} className="flex gap-3"><CornerDownRight className="mt-1 size-4 shrink-0 text-primary" /><span><b className="text-foreground">{k}:</b> {v}{extra && <span className="ml-2 inline-block align-middle"><AddedTag short /></span>}</span></li>
            ))}
          </ul>
        </Panel>
        <Panel title={c.canTitle}>
          <ul className="space-y-2.5 text-[15px]">
            {c.can.map((t) => (
              <li key={t} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-ok" />{t}</li>
            ))}
            {c.cannot.map((t) => (
              <li key={t} className="flex gap-3"><Ban className="mt-0.5 size-4 shrink-0 text-bad" />{t}</li>
            ))}
          </ul>
          {c.note && <p className="mt-4 text-[14px] text-muted-foreground">{c.note}</p>}
        </Panel>
      </div>
    </div>
  )
}

export function Journeys() {
  return (
    <JourneysView
      c={{
        title: "Partner manager: three journeys",
        journeys,
        handoffs: [
          ["To the channel chief", "Registrations past 80% of SLA, credit split proposals, applications you escalate"],
          ["To partner reps", "Every decision, with a reason code and plain-language explanation"],
          ["From partner reps", "Registrations, extension requests, replies to your questions"],
          ["From the agents", "SLA nudges (SLA agent), recommendations (Deal Desk agent), split calculations (Attribution agent)"],
          ["From the channel chief", "Partners assigned or moved to you", true],
        ],
        canTitle: "What a partner manager can and can't do",
        can: ["Decide registrations for assigned partners", "Accept or decline partner applications", "Add partners to opportunities and propose splits"],
        cannot: ["Approve their own split proposals or any monetary reward", "See partners not assigned to them in detail"],
        note: "Co-sell requests (J-03) arrive in Stage 2 and aren't designed here.",
      }}
    />
  )
}
