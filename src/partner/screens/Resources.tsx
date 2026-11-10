import { useState } from "react"
import { ArrowRight, BookOpen, FileText, GraduationCap, Image, Images, PlayCircle, Search, Sheet, Stamp } from "lucide-react"
import { toast } from "sonner"
import { PageHeader, PageTabs, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { shortDate } from "@/lib/format"
import { go } from "@/lib/router"
import { useStore } from "@/store"
import { assets, courses, type Asset } from "@/partner/data"
import { usePartner } from "@/partner/usePartner"
import { StageTag } from "@/partner/bits"

const kindIcon: Record<Asset["kind"], typeof FileText> = { PDF: FileText, Deck: Image, Video: PlayCircle, Sheet: Sheet, Images: Images }

const header = {
  pexec: { sub: "Program material for your leadership, plus everything your reps use.", assets: "Sales and program assets" },
  rep: { sub: "Sales material, pricing and training, chosen for sales reps.", assets: "Sales and program assets" },
  mkt: { sub: "Campaign assets, brand rules and the funds guide. Pricing is for sales roles only.", assets: "Marketing assets" },
  tech: { sub: "Implementation guides, reference architectures and API docs for delivery.", assets: "Technical resources" },
}

export function Resources({ tab }: { tab?: string }) {
  const { me, company, isExec, isTech } = usePartner()
  const { state } = useStore()
  const t = tab === "training" ? "training" : "assets"
  const [q, setQ] = useState("")
  // Content is segmented by role, as in Impartner's asset library: pricing for sales roles, program material for the admin.
  const mine = assets.filter((a) => a.audience.includes(me.role)).filter((a) => !q.trim() || `${a.title} ${a.category}`.toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <div>
      <PageHeader title="Resources" sub={header[me.role].sub} />
      <PageTabs
        label="Resource views"
        value={t}
        onChange={(v) => go(`/p/resources/${v}`)}
        items={[
          { value: "assets", label: header[me.role].assets, icon: <BookOpen />, count: assets.filter((a) => a.audience.includes(me.role)).length },
          { value: "training", label: "Training", icon: <GraduationCap /> },
        ]}
      />
      {t === "assets" ? (
        <>
          <label className="relative mb-4 block max-w-[520px]">
            <span className="sr-only">Search resources</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search resources" className="h-11 w-full rounded-[12px] border bg-card pr-3 pl-11 text-[15.5px] text-foreground outline-none focus:border-primary" />
          </label>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {mine.map((a) => {
              const Icon = kindIcon[a.kind]
              return (
                <li key={a.id} className="flex flex-col rounded-[14px] border bg-card p-4 shadow-[0_1px_2px_#172b4508]">
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-[10px] bg-brand-soft text-primary"><Icon className="size-5" /></span>
                    <span className="min-w-0">
                      <b className="block text-[16px] leading-snug text-foreground">{a.title}</b>
                      <span className="text-[14px] text-muted-foreground">{a.kind} · {a.category} · updated {shortDate(a.updated)}</span>
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {a.cobrand && <Badge className="border-0 bg-amber-soft text-amber-ink"><Stamp className="size-3.5" /> Co-brandable</Badge>}
                    {a.note && <Badge variant="secondary">{a.note}</Badge>}
                  </div>
                  <div className="mt-auto flex gap-2 pt-4">
                    <Button variant="outline" className="flex-1" onClick={() => toast(`Opening ${a.title}`, { description: "Brightline sees which assets partners use, never who you send them to." })}>Open</Button>
                    {a.cobrand && <Button variant="outline" className="flex-1" onClick={() => toast.success("Co-branded copy ready", { description: `${company.short}'s logo is in the approved area. Brightline's logo stays as is.` })}><Stamp /> Add our logo</Button>}
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      ) : isTech ? (
        <Panel title="Your certifications live in Skills" sub="The skills ladder shows your courses, exams and what moves you to Sell-Ready and Proven.">
          <Button onClick={() => go("/p/skills")}>Open Skills <ArrowRight /></Button>
        </Panel>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <Panel title={<span className="flex flex-wrap items-center gap-3">{isExec ? "Courses for your team" : "Your courses"} <StageTag>Certifications · Stage 2</StageTag></span>} sub="Learned → Certified → Sell-ready → Proven. Proven is automatic when you close a deal in that product.">
            <ul className="space-y-4">
              {courses.filter((c) => (c.audience ?? ["rep", "pexec"]).includes(me.role)).map((c) => (
                <li key={c.id} className="rounded-[12px] border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="min-w-0"><b className="block text-[16px] text-foreground">{c.title}</b><span className="text-[14px] text-muted-foreground">{c.detail}</span></span>
                    {c.progress === 100 ? <Badge className="border-0 bg-ok-soft text-ok">{c.certifies ? "Certified" : "Done"}</Badge> : <Button size="sm" variant="outline" onClick={() => toast(`Opening ${c.title}`)}>{c.progress ? "Continue" : "Start"}</Button>}
                  </div>
                  {!isExec && <div className="mt-3 flex items-center gap-3"><Progress value={c.progress} className="h-2 flex-1" /><span className="text-[14px] text-muted-foreground tabular">{c.progress}%</span></div>}
                </li>
              ))}
            </ul>
          </Panel>
          {isExec && (
            <Panel title="Team certifications" sub="Counts toward Platinum">
              <ul className="divide-y">
                {state.team.filter((m) => m.status !== "deactivated").map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <span><b className="block text-foreground">{m.name}</b><span className="text-[14px] text-muted-foreground">{m.role}</span></span>
                    {m.certified ? <Badge className="border-0 bg-ok-soft text-ok">{m.certified}</Badge> : <span className="text-[14px] text-muted-foreground">Not certified yet</span>}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      )}
    </div>
  )
}
