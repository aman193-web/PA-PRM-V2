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

export default function App() {
  const [authed, setAuthed] = useState(() => {
    try {
      return sessionStorage.getItem("prm-pam-auth") === "1"
    } catch {
      return false
    }
  })
  const { path } = useRoute()

  useEffect(() => {
    if (!authed && path !== "/login") go("/login")
    if (authed && (path === "/login" || path === "/")) go("/home")
  }, [authed, path])

  const signIn = (to = "/home") => {
    try { sessionStorage.setItem("prm-pam-auth", "1") } catch { /* private mode */ }
    setAuthed(true)
    go(to)
  }
  const signOut = () => {
    try { sessionStorage.removeItem("prm-pam-auth") } catch { /* private mode */ }
    setAuthed(false)
    go("/login")
  }

  return (
    <ThemeProvider>
      <TooltipProvider>
        <StoreProvider>
          <CopilotProvider>
            {authed ? <Routes onSignOut={signOut} /> : <Login onSignIn={signIn} />}
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
