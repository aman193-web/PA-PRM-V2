import type { ReactNode } from "react"
import { useRoute } from "@/lib/router"
import type { PartnerRoleId } from "@/partner/data"
import { PartnerProvider } from "@/partner/usePartner"
import { PartnerAssistantProvider } from "@/partner/Assistant"
import { PartnerShell } from "@/partner/PartnerShell"
import { PartnerHome } from "@/partner/screens/Home"
import { PartnerDeals } from "@/partner/screens/Deals"
import { PartnerDeal } from "@/partner/screens/Deal"
import { Register } from "@/partner/screens/Register"
import { PartnerLeads } from "@/partner/screens/Leads"
import { Credit } from "@/partner/screens/Credit"
import { Program } from "@/partner/screens/Program"
import { Team } from "@/partner/screens/Team"
import { Resources } from "@/partner/screens/Resources"
import { Access, NotForRole } from "@/partner/screens/Access"
import { JourneysView } from "@/screens/Journeys"
import { execJourneys, repJourneys } from "@/partner/journeys"

/** The partner portal for Ridgeway IT. One app, two roles: what renders depends on who signed in. */
export function PartnerApp({ role, onSignOut }: { role: PartnerRoleId; onSignOut: () => void }) {
  const { parts } = useRoute()
  const [, page = "home", id] = parts
  const exec = role === "pexec"
  let section = page
  let screen: ReactNode
  switch (page) {
    case "deals": screen = <PartnerDeals tab={id} />; break
    case "deal": section = "deals"; screen = <PartnerDeal id={id} />; break
    case "register": screen = <Register leadId={id} />; break
    case "leads": screen = <PartnerLeads tab={id} />; break
    case "credit": screen = <Credit />; break
    case "program": screen = exec ? <Program /> : <NotForRole what="Program and agreements" />; break
    case "team": screen = exec ? <Team /> : <NotForRole what="Team" />; break
    case "resources": screen = <Resources tab={id} />; break
    case "access": screen = <Access />; break
    case "journeys": screen = <JourneysView c={exec ? execJourneys : repJourneys} />; break
    default: section = "home"; screen = <PartnerHome />
  }
  return (
    <PartnerProvider role={role}>
      <PartnerAssistantProvider>
        <PartnerShell section={section} onSignOut={onSignOut}>
          <div key={parts.join("/")}>{screen}</div>
        </PartnerShell>
      </PartnerAssistantProvider>
    </PartnerProvider>
  )
}
