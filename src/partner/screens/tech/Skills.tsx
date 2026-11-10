import { useState } from "react"
import { Award, BookOpen, Check, GraduationCap, Info, Timer } from "lucide-react"
import { toast } from "sonner"
import { PageHeader, Panel } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { date } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"
import { ladder, ladderHelp, type Skill } from "@/partner/delivery"
import { usePartner } from "@/partner/usePartner"
import { useDelivery } from "@/partner/useDelivery"
import { StageTag } from "@/partner/bits"

function Ladder({ k }: { k: Skill }) {
  const rank = ladder.indexOf(k.level)
  return (
    <ol className="grid grid-cols-4 gap-1.5">
      {ladder.map((l, i) => {
        const ev = k.evidence.find((e) => e.level === l)
        return (
          <li key={l} className={cn("rounded-[10px] border px-2.5 py-2", i <= rank ? (rank === 3 ? "border-ok/40 bg-ok-soft/60" : "border-primary/30 bg-brand-soft/50") : "border-dashed")}>
            <span className={cn("flex items-center gap-1 text-[13.5px] font-semibold", i <= rank ? "text-foreground" : "text-muted-foreground")}>{i <= rank && <Check className="size-3.5 text-ok" strokeWidth={3} />}{l}</span>
            <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">{ev ? date(ev.at) : ladderHelp[l]}</span>
          </li>
        )
      })}
    </ol>
  )
}

function Exam({ k, onClose }: { k: Skill; onClose: () => void }) {
  const { dispatch } = useStore()
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{k.product} certification exam</DialogTitle>
          <DialogDescription>20 questions · 30 minutes · pass mark 80%. Taken in Brightline's academy; the result comes back here.</DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-[15px]">
          <li className="flex gap-2.5"><Timer className="mt-0.5 size-4 shrink-0 text-primary" /> One attempt a day. The certificate renews every 2 years.</li>
          <li className="flex gap-2.5"><Info className="mt-0.5 size-4 shrink-0 text-primary" /> Passing makes you Certified. It doesn't earn credit on its own (R-GR-1).</li>
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Not now</Button>
          <Button onClick={() => { dispatch({ type: "passExam", skillId: k.id }); toast.success(`Certified in ${k.product}`, { description: "Northpeak's capability score went up. Brightline uses it to match Northpeak to deals." }); onClose() }}>
            <GraduationCap /> Pass the exam (demo)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function Skills() {
  const { company } = usePartner()
  const t = useDelivery()
  const [exam, setExam] = useState<Skill | null>(null)
  return (
    <div>
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">Your skills ladder <StageTag /></span>}
        sub="Learned, Certified, Sell-Ready, Proven (R-GR-3). Courses and certificates earn nothing on their own: value appears when your work is matched to a verified outcome (R-GR-1)."
      />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <ul className="space-y-4">
          {t.skills.map((k) => (
            <li key={k.id}>
              <Panel>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <span><b className="block text-[18px] text-foreground">{k.product}</b><span className="text-[14px] text-muted-foreground">{k.expires ? `Certificate renews by ${date(k.expires)}` : "Not certified yet"}</span></span>
                  <Badge className={cn("border-0", k.level === "Proven" ? "bg-ok text-white" : k.level === "Learned" ? "bg-secondary text-foreground" : "bg-brand-soft text-primary")}>{k.level === "Proven" && <Award className="size-3.5" />} {k.level}</Badge>
                </div>
                <div className="mt-4"><Ladder k={k} /></div>
                {k.course !== undefined && k.course < 100 && <div className="mt-4 flex items-center gap-3"><Progress value={k.course} className="h-2 flex-1" /><span className="text-[14px] text-muted-foreground tabular">Course {k.course}%</span></div>}
                {k.needFor && <p className="mt-4 flex gap-2 rounded-[12px] bg-amber-soft/60 px-3.5 py-2.5 text-[14.5px] text-foreground"><Info className="mt-0.5 size-4 shrink-0 text-amber-ink" />{k.needFor}</p>}
                <p className="mt-3 text-[15px] text-foreground"><b>Next:</b> {k.next}</p>
                {k.evidence.length > 0 && (
                  <details className="mt-3 text-[14.5px]">
                    <summary className="cursor-pointer font-semibold text-primary">Evidence ({k.evidence.length})</summary>
                    <ul className="mt-2 space-y-1">{k.evidence.map((e) => <li key={e.level} className="flex gap-2 text-muted-foreground"><span className="w-[84px] shrink-0 font-medium text-foreground">{e.level}</span>{e.text} · {date(e.at)}</li>)}</ul>
                  </details>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {k.level === "Learned" && k.course === 100 && <Button onClick={() => setExam(k)}><GraduationCap /> Take the exam</Button>}
                  {k.level === "Learned" && (k.course ?? 0) < 100 && <Button variant="outline" onClick={() => toast(`Opening the ${k.product} course`, { description: "Courses run in Brightline's academy. Progress syncs back here." })}><BookOpen /> Continue the course</Button>}
                </div>
              </Panel>
            </li>
          ))}
        </ul>
        <div className="space-y-6">
          <Panel title={`${company.short}'s capability`} sub="Rolled up from everyone's ladder. Brightline uses it to rank partners for deals and co-sell (R-CS-2).">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-5 gap-y-2.5 text-[15px]">
              <span className="text-[13.5px] font-medium text-muted-foreground">Product</span><span className="text-right text-[13.5px] font-medium text-muted-foreground">Certified</span><span className="text-right text-[13.5px] font-medium text-muted-foreground">Proven</span>
              {t.capability.map((c) => [
                <span key={`${c.product}-p`} className="text-foreground">{c.product}</span>,
                <b key={`${c.product}-c`} className={cn("text-right tabular", c.certified ? "text-foreground" : "text-bad")}>{c.certified}</b>,
                <b key={`${c.product}-v`} className="text-right text-foreground tabular">{c.proven}</b>,
              ])}
            </div>
          </Panel>
          <Panel title="What each step means">
            <ul className="space-y-2.5">{ladder.map((l) => <li key={l} className="text-[15px]"><b className="text-foreground">{l}</b><span className="block text-[14px] text-muted-foreground">{ladderHelp[l]}</span></li>)}</ul>
          </Panel>
        </div>
      </div>
      {exam && <Exam k={exam} onClose={() => setExam(null)} />}
    </div>
  )
}
