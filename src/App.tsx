import { useEffect, useState, type ReactNode } from "react"
import { ThemeProvider } from "@/lib/theme"
import { AppShell } from "@/components/AppShell"
import { CopilotProvider } from "@/components/Copilot"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { go, useRoute } from "@/lib/router"
import { StoreProvider } from "@/store"
import { Login } from "@/screens/Login"
import { Home } from "@/screens/Home"
import { Queue } from "@/screens/Queue"
import { RegistrationScreen } from "@/screens/Registration"
import { Partners } from "@/screens/Partners"
import { ApplicationScreen } from "@/screens/Application"
import { Credit } from "@/screens/Credit"
import { OpportunityScreen } from "@/screens/Opportunity"
import { Health } from "@/screens/Health"
import { Journeys } from "@/screens/Journeys"
import { Salesforce } from "@/screens/Salesforce"
import { Deals } from "@/screens/Deals"
import { PartnerProfile } from "@/screens/PartnerProfile"
import { Welcome, type DemoRole } from "@/screens/Welcome"
import { PartnerLogin } from "@/partner/PartnerLogin"
import { PartnerApp } from "@/partner/PartnerApp"
import { ChiefApp } from "@/chief/ChiefApp"

function Routes({ onSignOut }: { onSignOut: () => void }) {
  const { parts } = useRoute()
  const [root, id, sub] = parts
  let section = root
  let page: ReactNode
  switch (root) {
    case "queue":
      page = <Queue tab={id} />
      break
    case "registration":
      section = "queue"
      page = <RegistrationScreen id={id} />
      break
    case "partners":
      page = <Partners tab={id} />
      break
    case "partner":
      section = "partners"
      page = <PartnerProfile id={id} tab={sub} />
      break
    case "deals":
      page = <Deals tab={id} />
      break
    case "salesforce":
      page = <Salesforce />
      break
    case "application":
      section = "partners"
      page = <ApplicationScreen id={id} />
      break
    case "credit":
      page = <Credit />
      break
    case "opportunity":
      section = "credit"
      page = <OpportunityScreen id={id} />
      break
    case "health":
      page = <Health />
      break
    case "journeys":
      page = <Journeys />
      break
    default:
      section = "home"
      page = <Home />
  }
  return (
    <AppShell section={section} onSignOut={onSignOut}>
      <div key={parts.join("/")}>{page}</div>
    </AppShell>
  )
}

const roleSlug: Record<DemoRole, string> = { pam: "partner-manager", chief: "channel-chief", pexec: "partner-executive", rep: "partner-sales-rep" }

export default function App() {
  // Demo data lives only in memory, and so does the sign-in: a page refresh is a clean start on the welcome page.
  const [role, setRole] = useState<DemoRole | null>(null)
  const { path, parts } = useRoute()

  // Signed out: the demo welcome page and sign-in pages. Signed in: each role stays inside its own portal.
  useEffect(() => {
    if (path === "/login") go("/signin/pam")
    else if (!role) { if (path !== "/welcome" && !path.startsWith("/signin/")) go("/welcome") }
    else if (role === "pam") { if (path === "/" || path === "/welcome" || path.startsWith("/signin/") || path.startsWith("/p/") || path.startsWith("/c/")) go("/home") }
    else if (role === "chief") { if (!path.startsWith("/c/")) go("/c/home") }
    else if (!path.startsWith("/p/")) go("/p/home")
  }, [role, path])

  // Show who is signed in as ?role=… in the address bar. It's a label only: a refresh still starts fresh.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (role) params.set("role", roleSlug[role])
    else params.delete("role")
    const q = params.toString()
    try { history.replaceState(null, "", `${window.location.pathname}${q ? `?${q}` : ""}${window.location.hash}`) } catch { /* not allowed here */ }
  }, [role])

  const signIn = (r: DemoRole, to?: string) => {
    setRole(r)
    go(to ?? (r === "pam" ? "/home" : r === "chief" ? "/c/home" : "/p/home"))
  }
  const signOut = () => {
    setRole(null)
    go("/welcome")
  }

  let screen: ReactNode
  if (!role) {
    const who = parts[0] === "signin" ? (parts[1] as DemoRole) : null
    if (who === "pam") screen = <Login onSignIn={(to) => signIn("pam", to)} onBack={() => go("/welcome")} />
    else if (who === "chief") screen = <Login variant="chief" onSignIn={() => signIn("chief")} onBack={() => go("/welcome")} />
    else if (who === "pexec" || who === "rep") screen = <PartnerLogin role={who} onSignIn={() => signIn(who)} onBack={() => go("/welcome")} />
    else screen = <Welcome onPick={(r) => signIn(r)} />
  } else if (role === "pam") {
    screen = <Routes onSignOut={signOut} />
  } else if (role === "chief") {
    screen = <ChiefApp onSignOut={signOut} />
  } else {
    screen = <PartnerApp role={role} onSignOut={signOut} />
  }

  return (
    <ThemeProvider>
      <TooltipProvider>
        <StoreProvider>
          <CopilotProvider>
            {screen}
            <Toaster
              position="bottom-right"
              richColors={false}
              offset={{ top: 76, right: 24, bottom: 24 }}
              mobileOffset={{ top: 72, right: 16, left: 16, bottom: 88 }}
              toastOptions={{ classNames: { title: "text-[15px]", description: "text-[14px]" } }}
            />
          </CopilotProvider>
        </StoreProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}
