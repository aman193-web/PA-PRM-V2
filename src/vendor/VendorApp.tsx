import type { ReactNode } from "react"
import { ArrowLeft, Check, KeyRound, Lock, X } from "lucide-react"
import { EmptyState, PageHeader, Panel } from "@/components/common"
import { Button } from "@/components/ui/button"
import { go, useRoute } from "@/lib/router"
import { JourneysView } from "@/screens/Journeys"
import { access, type VendorRoleId } from "@/vendor/data"
import { VendorProvider, useVendor } from "@/vendor/useVendor"
import { VendorShell } from "@/vendor/VendorShell"
import { aeJourneys, ceoJourneys, opsJourneys } from "@/vendor/journeys"
import { OpsHome } from "@/vendor/screens/ops/OpsHome"
import { ExceptionDetail, Exceptions } from "@/vendor/screens/ops/Exceptions"
import { Reconciliation } from "@/vendor/screens/ops/Reconciliation"
import { OpsPrograms } from "@/vendor/screens/ops/Programs"
import { AeHome } from "@/vendor/screens/ae/AeHome"
import { SellerAccount, SellerAccounts } from "@/vendor/screens/ae/Accounts"
import { CoSellList, FindPartner } from "@/vendor/screens/ae/CoSell"
import { CeoHome } from "@/vendor/screens/ceo/CeoHome"
import { BoardView, ExecRevenue } from "@/vendor/screens/ceo/Revenue"
import { ExecApprovalDetail, ExecApprovals } from "@/vendor/screens/ceo/Approvals"

const journeys = { revops: opsJourneys, ae: aeJourneys, ceo: ceoJourneys }

/** What this person can and can't do, from the PRM Knowledge Hub's persona pages and permission matrix. */
function VendorAccess() {
  const { me } = useVendor()
  const a = access[me.role]
  return (
    <div className="space-y-6">
      <PageHeader title="Your access" sub={`${me.name} · ${me.title} at Brightline. Enforced for people, APIs and AI agents alike.`} />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="You can">
          <ul className="space-y-3">
            {a.can.map((l) => (
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
            <ul className="space-y-3">{a.cannot.map((t) => <li key={t} className="flex gap-3"><span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-bad-soft text-bad"><X className="size-3.5" strokeWidth={3} /></span><span className="text-[15.5px] text-foreground">{t}</span></li>)}</ul>
          </Panel>
          <Panel title="How you sign in"><p className="flex gap-3 text-[15.5px] text-foreground"><KeyRound className="mt-0.5 size-5 shrink-0 text-primary" /> {a.signIn}</p></Panel>
        </div>
      </div>
      <p className="text-[14px] text-muted-foreground">Source: BRD permission matrix and personas, as compiled in the PRM Knowledge Hub. "Added" marks standard practice the documents don't cover.</p>
    </div>
  )
}

function NotForRole({ what, why }: { what: string; why: string }) {
  return (
    <div>
      <PageHeader title={what} />
      <Panel><EmptyState icon={<Lock className="size-6" />} title="Not part of your role" body={why} action={<Button variant="outline" onClick={() => go("/v/home")}><ArrowLeft /> Home</Button>} /></Panel>
    </div>
  )
}

function opsScreen(page: string, id?: string): [string, ReactNode] {
  switch (page) {
    case "exceptions": return ["exceptions", <Exceptions tab={id} />]
    case "exception": return ["exceptions", <ExceptionDetail id={id} />]
    case "revenue": return ["revenue", <Reconciliation />]
    case "programs": return ["programs", <OpsPrograms />]
    default: return ["home", <OpsHome />]
  }
}

function aeScreen(page: string, id?: string): [string, ReactNode] {
  switch (page) {
    case "accounts": return ["accounts", <SellerAccounts />]
    case "account": return ["accounts", <SellerAccount id={id} />]
    case "cosell": return ["cosell", <CoSellList />]
    case "find": return ["find", <FindPartner key={id ?? "pick"} accountId={id} />]
    case "approvals": case "approval": case "exceptions": case "programs": return ["home", <NotForRole what="Approvals and rules" why="Registrations are decided by the partner manager, and program rules by the channel chief. You see partner activity on your accounts." />]
    default: return ["home", <AeHome />]
  }
}

function ceoScreen(page: string, id?: string): [string, ReactNode] {
  switch (page) {
    case "revenue": return ["revenue", <ExecRevenue />]
    case "board": return ["board", <BoardView />]
    case "approvals": return ["approvals", <ExecApprovals />]
    case "approval": return ["approvals", <ExecApprovalDetail id={id} />]
    case "programs": case "exceptions": return ["home", <NotForRole what="Programs and data" why="Programs are configured by RevOps and approved by the channel chief. You see the results and approve the model and large rewards." />]
    default: return ["home", <CeoHome />]
  }
}

function useScreen(role: VendorRoleId) {
  const { parts } = useRoute()
  const [, page = "home", id] = parts
  if (page === "access") return { section: "access", screen: <VendorAccess /> }
  if (page === "journeys") return { section: "journeys", screen: <JourneysView c={journeys[role]} /> }
  const [section, screen] = role === "revops" ? opsScreen(page, id) : role === "ae" ? aeScreen(page, id) : ceoScreen(page, id)
  return { section, screen }
}

function Inner({ role, onSignOut }: { role: VendorRoleId; onSignOut: () => void }) {
  const { parts } = useRoute()
  const { section, screen } = useScreen(role)
  return (
    <VendorShell section={section} onSignOut={onSignOut}>
      <div key={parts.join("/")}>{screen}</div>
    </VendorShell>
  )
}

/** Three more Brightline portals in one app: RevOps, the field seller and the CFO. Routes live under #/v/. */
export function VendorApp({ role, onSignOut }: { role: VendorRoleId; onSignOut: () => void }) {
  return (
    <VendorProvider role={role}>
      <Inner role={role} onSignOut={onSignOut} />
    </VendorProvider>
  )
}
