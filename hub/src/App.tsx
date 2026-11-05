import { Assistant } from "@hub/components/Assistant"
import { Inspector } from "@hub/components/Inspector"
import { Shell } from "@hub/components/Shell"
import { TooltipProvider } from "@hub/components/ui/tooltip"
import { NavProvider, useNav } from "@hub/lib/nav"
import { Ask } from "@hub/pages/Ask"
import { DataMap } from "@hub/pages/DataMap"
import { Flows } from "@hub/pages/Flows"
import { Gaps } from "@hub/pages/Gaps"
import { Matrix } from "@hub/pages/Matrix"
import { Personas } from "@hub/pages/Personas"
import { Reference } from "@hub/pages/Reference"
import { Rules } from "@hub/pages/Rules"
import { WhyUs } from "@hub/pages/WhyUs"

function Current() {
  const { view } = useNav()
  switch (view.page) {
    case "personas": return <Personas key={view.id ?? "grid"} id={view.id} />
    case "matrix": return <Matrix />
    case "rules": return <Rules />
    case "flows": return <Flows id={view.id} />
    case "map": return <DataMap id={view.id} />
    case "why": return <WhyUs />
    case "gaps": return <Gaps />
    case "reference": return <Reference />
    default: return <Ask />
  }
}

export default function App() {
  return (
    <TooltipProvider delayDuration={250}>
      <NavProvider>
        <Shell>
          <Current />
        </Shell>
        <Inspector />
        <Assistant />
      </NavProvider>
    </TooltipProvider>
  )
}
