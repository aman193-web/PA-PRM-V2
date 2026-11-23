import { useState } from "react"
import { Megaphone, Wrench, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStore } from "@/store"

/**
 * What the PRM platform team publishes from the super admin panel, shown at the top of every Brightline portal
 * (staff and partners alike): live announcements for Brightline, and maintenance mode when it's on.
 */
export function PlatformBanner() {
  const { state } = useStore()
  const p = state.platform
  const [hidden, setHidden] = useState<string[]>([])
  const me = p.orgs.find((o) => o.id === "brightline")
  const forUs = (aud: string) => aud === "All tenants" || aud === me?.name || (aud === "Enterprise customers" && me?.plan === "enterprise") || (aud === "Growth customers" && me?.plan === "growth")
  const live = p.announcements.filter((a) => a.status === "live" && forUs(a.audience) && !hidden.includes(a.id))
  if (!p.maintenance && live.length === 0) return null
  return (
    <div className="mb-5 space-y-2">
      {p.maintenance && (
        <div role="status" className="flex items-start gap-3 rounded-[12px] border border-amber/60 bg-amber-soft px-4 py-3 text-[14.5px] text-foreground">
          <Wrench className="mt-0.5 size-4 shrink-0 text-amber-ink" />
          <span><b>Read-only for planned maintenance.</b> You can look around, but changes are paused until the PRM platform team finishes. Nothing you've done is lost.</span>
        </div>
      )}
      {live.map((a) => (
        <div key={a.id} role="status" className={cn("flex items-start gap-3 rounded-[12px] px-4 py-3 text-[14.5px] text-foreground", a.kind === "maintenance" ? "bg-amber-soft" : "bg-brand-soft")}>
          {a.kind === "maintenance" ? <Wrench className="mt-0.5 size-4 shrink-0 text-amber-ink" /> : <Megaphone className="mt-0.5 size-4 shrink-0 text-primary" />}
          <span className="min-w-0 flex-1"><b>{a.title}</b>{a.body ? ` · ${a.body}` : ""}{a.window ? ` · ${a.window}` : ""} <span className="text-muted-foreground">· PRM platform team</span></span>
          <button type="button" onClick={() => setHidden([...hidden, a.id])} aria-label="Hide this announcement" className="grid size-6 shrink-0 place-items-center rounded-[6px] text-muted-foreground hover:bg-black/5 hover:text-foreground"><X className="size-4" /></button>
        </div>
      ))}
    </div>
  )
}
