import type { ReactNode } from "react"
import { Check, KeyRound, X } from "lucide-react"
import { PageHeader, Panel } from "@/components/common"
import { useRoute } from "@/lib/router"
import { access, chief } from "@/chief/data"
import { ChiefShell } from "@/chief/ChiefShell"
import { ChiefHome } from "@/chief/screens/Home"
import { ApprovalDetail, Approvals } from "@/chief/screens/Approvals"
import { ChiefPartners } from "@/chief/screens/Partners"
import { ChiefTeam } from "@/chief/screens/Team"
import { ChiefProgram } from "@/chief/screens/Program"
import { JourneysView } from "@/screens/Journeys"
import { chiefJourneys } from "@/chief/journeys"

/** What the channel chief can and can't do, from the BRD permission matrix (via the PRM Knowledge Hub). */
function ChiefAccess() {
  return (
    <div className="space-y-6">
      <PageHeader title="Your access" sub={`${chief.name} · ${chief.title} at ${chief.vendor}. Enforced for people, APIs and AI agents alike.`} />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="You can">
          <ul className="space-y-3">
            {access.can.map((l) => (
              <li key={l.text} className="flex gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ok-soft text-ok"><Check className="size-3.5" strokeWidth={3} /></span>
                <span className="min-w-0 flex-1 text-[15.5px] text-foreground">{l.text}</span>
                <span className="shrink-0 rounded-full border px-2 py-0.5 font-mono text-[12px] text-muted-foreground">{l.stage}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <div className="space-y-6">
          <Panel title="You can't">
            <ul className="space-y-3">
              {access.cannot.map((l) => (
                <li key={l.text} className="flex gap-3"><span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-bad-soft text-bad"><X className="size-3.5" strokeWidth={3} /></span><span className="text-[15.5px] text-foreground">{l.text}</span></li>
              ))}
            </ul>
          </Panel>
          <Panel title="How you sign in">
            <p className="flex gap-3 text-[15.5px] text-foreground"><KeyRound className="mt-0.5 size-5 shrink-0 text-primary" /> Brightline SSO. Most approvals can also be done straight from the Slack, Teams or email notification.</p>
          </Panel>
        </div>
      </div>
      <p className="text-[14px] text-muted-foreground">Source: BRD permission matrix and personas, as compiled in the PRM Knowledge Hub.</p>
    </div>
  )
}

/** The channel chief's portal. Routes live under #/c/. */
export function ChiefApp({ onSignOut }: { onSignOut: () => void }) {
  const { parts } = useRoute()
  const [, page = "home", id] = parts
  let section = page
  let screen: ReactNode
  switch (page) {
    case "approvals": screen = <Approvals tab={id} />; break
    case "approval": section = "approvals"; screen = <ApprovalDetail id={id} />; break
    case "partners": screen = <ChiefPartners id={id} />; break
    case "team": screen = <ChiefTeam />; break
    case "program": screen = <ChiefProgram id={id} />; break
    case "access": screen = <ChiefAccess />; break
    case "journeys": screen = <JourneysView c={chiefJourneys} />; break
    default: section = "home"; screen = <ChiefHome />
  }
  return (
    <ChiefShell section={section} onSignOut={onSignOut}>
      <div key={page === "partners" ? "partners" : parts.join("/")}>{screen}</div>
    </ChiefShell>
  )
}
