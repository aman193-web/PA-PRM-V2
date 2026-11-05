import { useEffect, useState } from "react"
import { ArrowLeft, ArrowRight, Check, KeyRound, Loader2, Mail, Route } from "lucide-react"
import { Logo } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { me } from "@/data/model"
import { cn } from "@/lib/utils"

function Google() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9Z" />
    </svg>
  )
}

function Microsoft() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#F25022" d="M1 1h10.5v10.5H1z" />
      <path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z" />
      <path fill="#00A4EF" d="M1 12.5h10.5V23H1z" />
      <path fill="#FFB900" d="M12.5 12.5H23V23H12.5z" />
    </svg>
  )
}

function CardStack() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % 3), 2400)
    return () => clearInterval(t)
  }, [])
  const state = (i: number) => (i === step ? "on" : i < step ? "done" : "")
  return (
    <div className="scene w-full">
      <div className="stage">
        <div className={cn("pane", state(0))} style={{ ["--y" as string]: "-18px" }}>
          <span className="pk inline-flex items-center gap-2 text-[12.5px] font-bold">
            <i className="size-2 rounded-full" /> Partner registers
          </span>
          <b className="mt-3 block truncate text-[16.5px] text-white">Ridgeway IT</b>
          <small className="mt-1 block truncate text-[13.5px] text-[#a9bfdc]">Acme Manufacturing</small>
          <span className="mt-auto block pt-4 text-[23px] leading-none font-bold text-white tabular">$62,000</span>
        </div>
        <div className={cn("pane", state(1))} style={{ ["--y" as string]: "34px", ["--z" as string]: "30px" }}>
          <span className="pk inline-flex items-center gap-2 text-[12.5px] font-bold">
            <i className="size-2 rounded-full" /> Needs you
          </span>
          <b className="mt-3 block truncate text-[16.5px] text-white">Conflict found</b>
          <small className="mt-1 block truncate text-[13.5px] text-[#a9bfdc]">Open Salesforce opp</small>
          <span className="mt-auto self-start inline-block max-w-full truncate rounded-full bg-amber/20 px-2.5 py-0.5 text-[12.5px] font-semibold text-[#ffcf8f]">AI: approve &amp; link</span>
        </div>
        <div className={cn("pane", state(2))} style={{ ["--y" as string]: "88px", ["--z" as string]: "60px" }}>
          <span className="pk inline-flex items-center gap-2 text-[12.5px] font-bold">
            <i className="size-2 rounded-full" /> Decided
          </span>
          <b className="mt-3 block truncate text-[16.5px] text-white">Approved</b>
          <small className="mt-1 block truncate text-[13.5px] text-[#a9bfdc]">Partner told in 1 s</small>
          <span className="mt-auto self-start inline-block max-w-full truncate rounded-full bg-sf px-2.5 py-0.5 text-[12.5px] font-semibold text-white">Role: Reseller</span>
        </div>
      </div>
    </div>
  )
}

/** The channel chief signs in through the same vendor login, with her own copy. */
const chiefCopy = {
  title: "Approve what matters. Prove what partners are worth.",
  sub: "Escalations, credit overrides and program rules in one inbox, with verified partner revenue ready for the board.",
  stats: [["1 inbox", "for every escalation and override"], ["Verified", "revenue, matched to closed-won"], ["From Slack", "approve straight from the alert"]],
  badge: "Channel chief workspace",
  line: "Sign in to approve escalations and see partner revenue.",
  points: ["Every partner and partner manager, in full", "Every approval logged and explained"],
}

function ChiefPreview() {
  return (
    <div className="w-full max-w-[420px] rounded-[18px] border border-white/15 bg-white/[0.06] p-5 backdrop-blur-sm">
      <span className="text-[13px] font-bold text-[#ffb359]">Waiting for your approval</span>
      {[["Kestrel Energy", "Escalated at 82% of its deadline"], ["Brookside Bank", "Credit split change from Jordan"], ["Tidewater Systems", "Application · wants Platinum"]].map(([t, d]) => (
        <div key={t} className="mt-3 rounded-[12px] bg-white/[0.06] px-3.5 py-2.5"><b className="block text-[15.5px] text-white">{t}</b><span className="text-[13.5px] text-[#a9bfdc]">{d}</span></div>
      ))}
    </div>
  )
}

export function Login({ onSignIn, onBack, variant = "pam" }: { onSignIn: (to?: string) => void; onBack?: () => void; variant?: "pam" | "chief" }) {
  const c = variant === "chief" ? chiefCopy : null
  const [email, setEmail] = useState(c ? "dana.ortiz@brightline.io" : me.email)
  const [busy, setBusy] = useState<string | null>(null)

  const start = (method: string, to?: string) => {
    setBusy(method)
    setTimeout(() => onSignIn(to), 650)
  }

  return (
    <div className="grid min-h-svh lg:h-svh lg:grid-cols-[minmax(460px,48%)_1fr] lg:overflow-hidden">
      {/* Brand side — same layout as before, new content */}
      <aside className="relative flex flex-col justify-between gap-8 overflow-hidden bg-night px-6 py-8 text-[#dbe7f7] sm:px-10 xl:px-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(600px 380px at 85% 70%, #1f6fe055, transparent 70%), radial-gradient(420px 300px at 10% 10%, #ffb35914, transparent 70%)",
          }}
        />
        <div aria-hidden className="dot-grid pointer-events-none absolute inset-0" />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <Logo light />
            <span className="rounded-full border border-white/20 px-3.5 py-1.5 text-[14px] font-semibold text-[#a9bfdc]">
              Partner Revenue Platform
            </span>
          </div>
          <h1 className="mt-7 max-w-[19ch] text-[32px] leading-[1.08] font-bold text-white sm:text-[40px] xl:text-[44px]">
            {c ? c.title : "Decide the partner deals rules can't, in three taps."}
          </h1>
          <p className="mt-4 max-w-[46ch] text-[17px] text-[#b9cbe4]">
            {c ? c.sub : "Your review queue, partner onboarding and multi-partner credit in one workspace, with Salesforce kept in sync."}
          </p>
        </div>
        <div className="relative hidden flex-1 items-center pt-2 pb-16 sm:flex sm:pr-8 xl:pr-12">
          {c ? <ChiefPreview /> : <CardStack />}
        </div>
        <div className="relative grid gap-3 sm:grid-cols-3">
          {(c ? c.stats : [
            ["60 seconds", "for rules to decide clean deals"],
            ["3 taps", "for you to decide the rest"],
            ["1 second", "until the partner hears why"],
          ]).map(([k, v]) => (
            <div key={k} className="rounded-[14px] border border-white/15 bg-white/[0.04] px-4 py-3.5 backdrop-blur-sm xl:px-5">
              <b className="block text-[17px] text-white">{k}</b>
              <span className="text-[14.5px] text-[#a9bfdc]">{v}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Sign-in side */}
      <main className="flex items-center justify-center px-6 py-10 sm:px-10 lg:overflow-y-auto">
        <div className="w-full max-w-[460px]">
          {onBack && (
            <button type="button" onClick={onBack} className="mb-5 inline-flex items-center gap-1.5 text-[15px] font-medium text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" /> All roles
            </button>
          )}
          <span className="flex w-fit items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-[14px] font-semibold text-primary">
            {c ? c.badge : "Partner manager workspace"}
          </span>
          <h2 className="mt-3 text-[30px] font-bold">Welcome back</h2>
          <p className="mt-1 text-[16px] text-muted-foreground sm:whitespace-nowrap">{c ? c.line : "Sign in to review deals and manage your partners."}</p>

          <div className="mt-6 grid gap-3">
            <button
              type="button"
              onClick={() => start("sso")}
              disabled={!!busy}
              className="group flex h-14 w-full items-center gap-3 rounded-[12px] bg-primary px-2 pr-4 text-left text-primary-foreground shadow-[0_8px_20px_#0969da33] transition hover:bg-[#0758b8] disabled:opacity-70 dark:hover:bg-primary/90"
            >
              <span className="grid size-10 place-items-center rounded-[9px] bg-white/15">
                {busy === "sso" ? <Loader2 className="size-5 animate-spin" /> : <KeyRound className="size-5" />}
              </span>
              <span className="flex-1 leading-tight">
                <b className="block text-[16px] font-semibold">Continue with company SSO</b>
                <span className="text-[13px] opacity-85">Recommended · uses your {me.vendor} login</span>
              </span>
              <ArrowRight className="size-5 transition group-hover:translate-x-0.5" />
            </button>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "google", label: "Google", icon: <Google /> },
                { id: "ms", label: "Microsoft", icon: <Microsoft /> },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => start(b.id)}
                  disabled={!!busy}
                  className="flex h-12 items-center justify-center gap-2.5 rounded-[12px] border border-border-strong/70 bg-card text-[15.5px] font-medium text-foreground shadow-[0_1px_2px_#172b450d] transition hover:border-primary hover:bg-brand-soft/40 disabled:opacity-70"
                >
                  {busy === b.id ? <Loader2 className="size-5 animate-spin" /> : b.icon} {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="my-6 flex items-center gap-3 text-[14px] text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or use your work email <span className="h-px flex-1 bg-border" />
          </div>

          <form
            className="grid gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              start("email")
            }}
          >
            <Label htmlFor="email" className="text-[15px]">Work email</Label>
            <div className="flex gap-2">
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 flex-1 bg-card text-[16px]" />
              <Button type="submit" variant="outline" className="h-12 bg-card px-4 text-[15px]" disabled={!!busy}>
                {busy === "email" ? <Loader2 className="size-5 animate-spin" /> : <Mail className="size-5" />}
                Send link
              </Button>
            </div>
          </form>

          <ul className="mt-6 grid gap-2 text-[14.5px] text-muted-foreground">
            {(c ? c.points : ["Only the partners assigned to you, in full detail", "Every decision is logged and explained to the partner"]).map((p) => (
              <li key={p} className="flex gap-2"><Check className="mt-0.5 size-4 text-ok" /> {p}</li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="text-[14px] text-muted-foreground">Demo sign-in · nothing is sent.</p>
            {!c && (
              <button type="button" onClick={() => start("journeys", "/journeys")} className="inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-primary hover:underline">
                <Route className="size-4" /> See the three journeys <ArrowRight className="size-4" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
