import { Check, KeyRound, X } from "lucide-react"
import { AddedTag, PageHeader, Panel } from "@/components/common"
import { cn } from "@/lib/utils"
import { admin, platformRoles } from "@/superadmin/data"

const can = [
  { text: "See every customer, its plan, usage, health and invoices", area: "Customers" },
  { text: "Create, suspend (with a reason) and reactivate a customer", area: "Customers" },
  { text: "Lock or unlock any account, reset MFA and sign someone out everywhere", area: "Users" },
  { text: "Change the default role templates for new customers", area: "Roles" },
  { text: "Change a customer's plan and AI spend cap; mark invoices paid", area: "Billing" },
  { text: "Switch features on or off per customer, and roll out releases", area: "Product" },
  { text: "Approve or block AI providers, and pause every agent for every customer", area: "AI" },
  { text: "Set platform policies that aren't locked", area: "Security" },
  { text: "Ask a customer for read-only support access, for a set time", area: "Security" },
  { text: "Handle data export and erasure requests", area: "Data" },
  { text: "Publish announcements and turn on maintenance mode", area: "Operations" },
  { text: "Invite people to the platform team and set their platform role", area: "Settings" },
]

const cannot = [
  "Open a customer's data without that customer's IT admin approving it",
  "Change a customer's deals, credit, rules or partner decisions",
  "Switch off MFA for customer staff, or the support-approval rule",
  "Let any agent move money, change access, export data, or demote or terminate a partner (R-AG-2)",
  "Edit or delete anything in an audit log (R-SEC-6)",
]

/** What the super admin can and can't do. Not in the BRD: proposed in hub G52 and G53. */
export function SaAccess() {
  return (
    <div className="space-y-6">
      <PageHeader title="Your access" sub={`${admin.name} · ${admin.title}, ${admin.team}. Every change you make is logged with your name and reaches customers at once.`} />
      <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-dashed border-amber-ink/50 bg-amber-soft/40 px-5 py-3.5 text-[15px] text-foreground">
        <AddedTag /> The BRD has no platform layer. This access is our proposal, to confirm with Product and Security (G52, G53).
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <Panel title="You can">
          <ul className="space-y-3">
            {can.map((l) => (
              <li key={l.text} className="flex gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ok-soft text-ok"><Check className="size-3.5" strokeWidth={3} /></span>
                <span className="min-w-0 flex-1 text-[15.5px] text-foreground">{l.text}</span>
                <span className="hidden shrink-0 rounded-full border px-2 py-0.5 text-[12px] text-muted-foreground sm:inline">{l.area}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <div className="space-y-6">
          <Panel title="You can't">
            <ul className="space-y-3">{cannot.map((t) => <li key={t} className="flex gap-3"><span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-bad-soft text-bad"><X className="size-3.5" strokeWidth={3} /></span><span className="text-[15.5px] text-foreground">{t}</span></li>)}</ul>
          </Panel>
          <Panel title="How you sign in">
            <p className="flex gap-3 text-[15.5px] text-foreground"><KeyRound className="mt-0.5 size-5 shrink-0 text-primary" /> PRM platform SSO plus a hardware security key, from the office network or VPN only. No email links or app codes.</p>
          </Panel>
          <Panel title="Platform roles" sub="You're a Super admin. Others on the team have less." bodyClass="px-0 sm:px-0 pb-1">
            <ul>{platformRoles.map((r) => <li key={r.role} className={cn("border-t px-5 py-3 first:border-0 sm:px-6", r.role === "Super admin" && "bg-brand-soft/50")}><b className="block text-foreground">{r.role}</b><span className="text-[14px] text-muted-foreground">{r.can}</span></li>)}</ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}
