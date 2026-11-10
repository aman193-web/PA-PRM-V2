import { Copy, Lock } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Campaign, MdfRequest } from "@/partner/marketing"
import { campaignLabel, mdfLabel } from "@/partner/useMarketing"

export function CampaignBadge({ c }: { c: Campaign }) {
  const s = campaignLabel[c.status]
  return <Badge className={cn("border-0", s.cls)}>{s.label}</Badge>
}

export function MdfBadge({ m }: { m: MdfRequest }) {
  const s = mdfLabel[m.status]
  return <Badge className={cn("border-0", s.cls)}>{s.label}</Badge>
}

/** The marketer's personal tracked link (IN-01): every click, lead and deal from it is counted for her. */
export function TrackedLink({ link, className }: { link: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 rounded-[12px] border bg-muted/40 py-1.5 pr-1.5 pl-3", className)}>
      <span className="min-w-0 flex-1 truncate font-mono text-[13.5px] text-foreground">{link}</span>
      <Button
        size="sm"
        variant="outline"
        className="bg-card"
        onClick={() => {
          try { void navigator.clipboard?.writeText(`https://${link}`) } catch { /* clipboard blocked */ }
          toast.success("Tracked link copied", { description: "Clicks, leads and deals from it are counted for you." })
        }}
      >
        <Copy /> Copy
      </Button>
    </div>
  )
}

/** Brightline's approved claims, shown locked: partners can't edit them (publish-content). */
export function LockedClaims({ claims, disclosure }: { claims: string[]; disclosure: string }) {
  return (
    <div className="rounded-[12px] border border-dashed bg-muted/30 p-4">
      <p className="flex items-center gap-2 text-[14px] font-semibold text-muted-foreground"><Lock className="size-4" /> Approved claims · locked</p>
      <ul className="mt-2 space-y-1.5">
        {claims.map((c) => <li key={c} className="flex gap-2.5 text-[15px] text-foreground"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />{c}</li>)}
      </ul>
      <p className="mt-3 text-[13.5px] text-muted-foreground">Added to every piece: "{disclosure}"</p>
    </div>
  )
}

export const stat = (n: number) => n.toLocaleString("en-US")
