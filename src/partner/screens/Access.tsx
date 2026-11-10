import { Check, KeyRound, Lock, X } from "lucide-react"
import { EmptyState, PageHeader, Panel } from "@/components/common"
import { Button } from "@/components/ui/button"
import { go } from "@/lib/router"
import { access } from "@/partner/data"
import { usePartner } from "@/partner/usePartner"

/** What this role can and can't do, straight from the BRD permission matrix (via the PRM Knowledge Hub). */
export function Access() {
  const { me, company, isExec } = usePartner()
  const a = access[me.role]
  return (
    <div className="space-y-6">
      <PageHeader title="Your access" sub={`${me.name} · ${me.roleLabel} at ${company.name}. The platform enforces this for people, APIs and AI agents alike, not just on screen.`} />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="You can">
          <ul className="space-y-3">
            {a.can.map((l) => (
              <li key={l.text} className="flex gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ok-soft text-ok"><Check className="size-3.5" strokeWidth={3} /></span>
                <span className="min-w-0 flex-1 text-[15.5px] text-foreground">{l.text}</span>
                {l.stage && <span className="shrink-0 rounded-full border px-2 py-0.5 font-mono text-[12px] text-muted-foreground">{l.stage}</span>}
              </li>
            ))}
          </ul>
        </Panel>
        <div className="space-y-6">
          <Panel title="You can't">
            <ul className="space-y-3">
              {a.cannot.map((l) => (
                <li key={l.text} className="flex gap-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-bad-soft text-bad"><X className="size-3.5" strokeWidth={3} /></span>
                  <span className="text-[15.5px] text-foreground">{l.text}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="How you sign in">
            <p className="flex gap-3 text-[15.5px] text-foreground"><KeyRound className="mt-0.5 size-5 shrink-0 text-primary" /> {company.short}'s own SSO, or a sign-in link sent to your work email. {isExec ? `Brightline invited you when ${company.short} joined the program.` : `${company.admin}, ${company.short}'s admin, invited you.`}</p>
          </Panel>
        </div>
      </div>
      <p className="text-[14px] text-muted-foreground">Source: BRD permission matrix and personas, as compiled in the PRM Knowledge Hub. Stage tags show when each part ships.</p>
    </div>
  )
}

/** A page this role can't open. By default it's an admin page (program, team, agreements). */
export function NotForRole({ what, why, back }: { what: string; why?: string; back?: { label: string; href: string } }) {
  const { company } = usePartner()
  return (
    <div>
      <PageHeader title={what} />
      <Panel>
        <EmptyState
          icon={<Lock className="size-6" />}
          title={why ? "Not part of your role" : `Only ${company.short}'s admin can open this`}
          body={why ?? `${company.admin} manages the program, team and agreements. Ask them if you need a change.`}
          action={<div className="flex flex-wrap justify-center gap-2">{back && <Button onClick={() => go(back.href)}>{back.label}</Button>}<Button variant="outline" onClick={() => go("/p/access")}>See what you can do</Button></div>}
        />
      </Panel>
    </div>
  )
}
