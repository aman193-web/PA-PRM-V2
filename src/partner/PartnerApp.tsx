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
import { MktHome } from "@/partner/screens/mkt/MktHome"
import { CampaignDetail, Campaigns } from "@/partner/screens/mkt/Campaigns"
import { Launch } from "@/partner/screens/mkt/Launch"
import { CampaignLeads } from "@/partner/screens/mkt/CampaignLeads"
import { Funds } from "@/partner/screens/mkt/Funds"
import { TechHome } from "@/partner/screens/tech/TechHome"
import { Engagement, Work } from "@/partner/screens/tech/Work"
import { LogMilestone } from "@/partner/screens/tech/LogMilestone"
import { Skills } from "@/partner/screens/tech/Skills"
import { Influence } from "@/partner/screens/tech/Influence"
import { JourneysView } from "@/screens/Journeys"
import { execJourneys, mktJourneys, repJourneys, techJourneys } from "@/partner/journeys"

const journeys = { pexec: execJourneys, rep: repJourneys, mkt: mktJourneys, tech: techJourneys }

/** Pages for the sales roles (executive and rep). */
function salesScreen(page: string, id: string | undefined, exec: boolean): [string, ReactNode] {
  switch (page) {
    case "deals": return ["deals", <PartnerDeals tab={id} />]
    case "deal": return ["deals", <PartnerDeal id={id} />]
    case "register": return ["register", <Register leadId={id} />]
    case "leads": return ["leads", <PartnerLeads tab={id} />]
    case "credit": return ["credit", <Credit />]
    case "program": return ["program", exec ? <Program /> : <NotForRole what="Program and agreements" />]
    case "team": return ["team", exec ? <Team /> : <NotForRole what="Team" />]
    default: return ["home", <PartnerHome />]
  }
}

/** Pages for the partner marketer: campaigns, campaign leads and funds. */
function mktScreen(page: string, id: string | undefined, sub: string | undefined): [string, ReactNode] {
  switch (page) {
    case "campaigns": return ["campaigns", <Campaigns tab={id} />]
    case "campaign": return ["campaigns", <CampaignDetail id={id} />]
    case "launch": return ["launch", <Launch kitId={id} />]
    case "leads": return ["leads", <CampaignLeads tab={id} />]
    case "funds": return ["funds", <Funds request={id === "request" ? sub ?? "" : undefined} />]
    case "deals": case "deal": case "register": case "credit": return ["home", <NotForRole what="Deals" why="Partner marketers see the pipeline their campaigns produced, not Ridgeway's deals or credit. Your campaigns show it." back={{ label: "Your campaigns", href: "/p/campaigns" }} />]
    case "program": case "team": return ["home", <NotForRole what={page === "team" ? "Team" : "Program and agreements"} />]
    default: return ["home", <MktHome />]
  }
}

/** Pages for the partner technical lead: deals worked, milestones, skills and influence. */
function techScreen(page: string, id: string | undefined, sub: string | undefined): [string, ReactNode] {
  switch (page) {
    case "work": return ["work", id ? <Engagement id={id} /> : <Work />]
    case "log": return ["log", <LogMilestone key={`${id}-${sub}`} engId={id} taskId={sub} />]
    case "skills": return ["skills", <Skills />]
    case "influence": return ["influence", <Influence />]
    case "deals": case "deal": case "register": case "credit": case "leads": return ["work", <NotForRole what="Deals" why="You see the Northpeak deals you work on. Registering deals and leads stays with Northpeak's sellers." back={{ label: "Deals you work on", href: "/p/work" }} />]
    case "program": case "team": return ["home", <NotForRole what={page === "team" ? "Team" : "Program and agreements"} />]
    default: return ["home", <TechHome />]
  }
}

/** The partner portal. One app, four roles: what renders depends on who signed in. */
export function PartnerApp({ role, onSignOut }: { role: PartnerRoleId; onSignOut: () => void }) {
  const { parts } = useRoute()
  const [, page = "home", id, sub] = parts
  let section: string
  let screen: ReactNode
  if (page === "resources") [section, screen] = ["resources", <Resources tab={id} />]
  else if (page === "access") [section, screen] = ["access", <Access />]
  else if (page === "journeys") [section, screen] = ["journeys", <JourneysView c={journeys[role]} />]
  else if (role === "mkt") [section, screen] = mktScreen(page, id, sub)
  else if (role === "tech") [section, screen] = techScreen(page, id, sub)
  else [section, screen] = salesScreen(page, id, role === "pexec")
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
