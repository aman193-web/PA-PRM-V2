import type { ReactNode } from "react"
import { useRoute } from "@/lib/router"
import { SuperShell } from "@/superadmin/SuperShell"
import { SaOverview } from "@/superadmin/screens/Overview"
import { SaOrg, SaOrgs } from "@/superadmin/screens/Orgs"
import { SaRoles, SaTeam, SaUsers } from "@/superadmin/screens/People"
import { SaAi, SaBilling, SaFlags, SaIntegrations } from "@/superadmin/screens/Product"
import { SaAudit, SaData, SaSecurity } from "@/superadmin/screens/Trust"
import { SaAnalytics, SaAnnounce, SaHealth } from "@/superadmin/screens/Ops"
import { SaAccess } from "@/superadmin/screens/Access"
import { superJourneys } from "@/superadmin/journeys"
import { JourneysView } from "@/screens/Journeys"

/** The PRM platform team's super admin panel, above every customer's portals. Routes live under #/s/. */
export function SuperApp({ onSignOut }: { onSignOut: () => void }) {
  const { parts } = useRoute()
  const [, page = "home", id] = parts
  let section = page
  let screen: ReactNode
  switch (page) {
    case "orgs": screen = <SaOrgs />; break
    case "org": section = "orgs"; screen = <SaOrg id={id} />; break
    case "users": screen = <SaUsers />; break
    case "roles": screen = <SaRoles />; break
    case "billing": screen = <SaBilling />; break
    case "flags": screen = <SaFlags />; break
    case "ai": screen = <SaAi />; break
    case "integrations": screen = <SaIntegrations />; break
    case "security": screen = <SaSecurity />; break
    case "audit": screen = <SaAudit />; break
    case "data": screen = <SaData />; break
    case "health": screen = <SaHealth />; break
    case "announce": screen = <SaAnnounce />; break
    case "analytics": screen = <SaAnalytics />; break
    case "team": screen = <SaTeam />; break
    case "journeys": screen = <JourneysView c={superJourneys} />; break
    case "access": screen = <SaAccess />; break
    default: section = "home"; screen = <SaOverview />
  }
  return (
    <SuperShell section={section} onSignOut={onSignOut}>
      <div key={parts.join("/")}>{screen}</div>
    </SuperShell>
  )
}
