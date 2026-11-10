import { useState } from "react"
import { ArrowLeft, ArrowRight, BadgeCheck, Check, KeyRound, Link2, Loader2, Mail, ShieldCheck, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { Logo } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { companies, people, type PartnerRoleId } from "@/partner/data"

const copy: Record<PartnerRoleId, { title: string; sub: string; stats: [string, string][]; signIn: string; invite: string; points: string[] }> = {
  rep: {
    title: "Register a deal in three taps. Know it's protected in a minute.",
    sub: "Describe the deal or forward the customer's email. AI fills in the form, you confirm, and the rules decide clean deals in 60 seconds.",
    stats: [["3 taps", "to register a deal"], ["60 seconds", "for clean deals to be approved"], ["90 days", "of protection once approved"]],
    signIn: "Sign in to register deals and see your credit.",
    invite: "Invited by Paul Okafor, Ridgeway's admin",
    points: ["Only your own deals and credit", "Every decision explained in plain words"],
  },
  pexec: {
    title: "See what the Brightline partnership is worth to Ridgeway.",
    sub: "Verified revenue reconciled to Salesforce, every Ridgeway deal in one place, and exactly what unlocks your next tier.",
    stats: [["Verified", "revenue, matched to closed-won"], ["Every deal", "across your whole team"], ["Next tier", "what unlocks it, and how close you are"]],
    signIn: "Sign in to see your program, revenue and team.",
    invite: "Invited by Brightline when Ridgeway joined the program",
    points: ["All of Ridgeway's deals and credit, never another partner's", "You manage who on your team has access"],
  },
  mkt: {
    title: "Run campaigns that show up as pipeline.",
    sub: "Pick a Brightline content kit, add Ridgeway's logo and share it with your own tracked link. Every lead and deal it produces is counted for you.",
    stats: [["Approved", "content kits, ready to share"], ["Tracked", "clicks, leads and pipeline"], ["Funds", "requested and claimed in one place"]],
    signIn: "Sign in to run campaigns and request funds.",
    invite: "Invited by Paul Okafor, Ridgeway's admin",
    points: ["Your campaigns and the pipeline they produced", "Only Brightline-approved claims are published"],
  },
  tech: {
    title: "Get certified, deliver, and get credit for it.",
    sub: "Log a delivery milestone in seconds. Each one is recorded as evidence on the deal, so the influence your work creates is credited to Northpeak.",
    stats: [["Skills ladder", "from Learned to Proven"], ["30 seconds", "to log a milestone"], ["Influence", "credited on deals you worked"]],
    signIn: "Sign in to see your deals, skills and influence.",
    invite: "Invited by Hannah Cho, Northpeak's admin",
    points: ["Only the Northpeak deals you work on", "Other partners' shares stay private"],
  },
}

function Preview({ role }: { role: PartnerRoleId }) {
  if (role === "mkt")
    return (
      <div className="w-full max-w-[420px] rounded-[18px] border border-white/15 bg-white/[0.06] p-5 backdrop-blur-sm">
        <span className="inline-flex items-center gap-2 text-[13px] font-bold text-[#4fd18b]"><Link2 className="size-4" /> Live · your tracked link</span>
        <b className="mt-3 block text-[19px] text-white">Hospitality analytics: Q4 emails</b>
        <div className="mt-4 grid grid-cols-3 gap-3 text-[13.5px]">
          {[["1,240", "clicks"], ["3", "leads"], ["1", "with a rep"]].map(([k, v]) => (
            <span key={v} className="rounded-[10px] bg-white/[0.06] px-3 py-2 text-[#cfe0f7]"><b className="block text-[17px] text-white">{k}</b>{v}</span>
          ))}
        </div>
      </div>
    )
  if (role === "tech")
    return (
      <div className="w-full max-w-[420px] rounded-[18px] border border-white/15 bg-white/[0.06] p-5 backdrop-blur-sm">
        <span className="text-[13px] font-bold text-[#ffb359]">Platform skills ladder</span>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {["Learned", "Certified", "Sell-Ready", "Proven"].map((l) => <span key={l} className="rounded-[8px] bg-[#ffb359] px-1 py-1.5 text-center text-[12px] font-bold text-[#2a1a00]">{l}</span>)}
        </div>
        <span className="mt-4 inline-flex items-center gap-2 text-[13.5px] text-[#cfe0f7]"><BadgeCheck className="size-4 text-[#4fd18b]" /> Go-live at Pinecrest Utilities recorded as a touch</span>
      </div>
    )
  if (role === "rep")
    return (
      <div className="w-full max-w-[420px] rounded-[18px] border border-white/15 bg-white/[0.06] p-5 backdrop-blur-sm">
        <span className="inline-flex items-center gap-2 text-[13px] font-bold text-[#4fd18b]"><BadgeCheck className="size-4" /> Approved by rules in 38 seconds</span>
        <b className="mt-3 block text-[19px] text-white">Birchwood Hospitality</b>
        <span className="text-[14.5px] text-[#a9bfdc]">Analytics · Enterprise · $38,000</span>
        <div className="mt-4 grid grid-cols-2 gap-3 text-[13.5px]">
          <span className="rounded-[10px] bg-white/[0.06] px-3 py-2 text-[#cfe0f7]"><ShieldCheck className="mb-1 size-4 text-[#ffb359]" />Protected to Jan 26</span>
          <span className="rounded-[10px] bg-white/[0.06] px-3 py-2 text-[#cfe0f7]"><TrendingUp className="mb-1 size-4 text-[#ffb359]" />Your credit: 100%</span>
        </div>
      </div>
    )
  return (
    <div className="w-full max-w-[420px] rounded-[18px] border border-white/15 bg-white/[0.06] p-5 backdrop-blur-sm">
      <span className="text-[13px] font-bold text-[#ffb359]">Verified revenue this year</span>
      <b className="mt-2 block text-[34px] leading-none text-white tabular">$318,000</b>
      <span className="mt-1 block text-[14px] text-[#a9bfdc]">Matched to Salesforce closed-won</span>
      <div className="mt-4">
        <div className="flex justify-between text-[13.5px] text-[#cfe0f7]"><span>Gold → Platinum</span><span>64%</span></div>
        <div className="mt-1.5 h-2 rounded-full bg-white/10"><div className="h-full w-[64%] rounded-full bg-[#ffb359]" /></div>
      </div>
    </div>
  )
}

/** Partner sign-in: the partner's own SSO or a work-email link (BRD persona sign-in). Same layout as the PAM sign-in. */
export function PartnerLogin({ role, onSignIn, onBack }: { role: PartnerRoleId; onSignIn: () => void; onBack: () => void }) {
  const me = people[role]
  const company = companies[me.companyId]
  const c = copy[role]
  const [email, setEmail] = useState(me.email)
  const [busy, setBusy] = useState<string | null>(null)
  const start = (m: string) => {
    setBusy(m)
    setTimeout(onSignIn, 650)
  }

  return (
    <div className="grid min-h-svh lg:h-svh lg:grid-cols-[minmax(460px,48%)_1fr] lg:overflow-hidden">
      <aside className="relative flex flex-col justify-between gap-8 overflow-hidden bg-night px-6 py-8 text-[#dbe7f7] sm:px-10 xl:px-12">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(600px 380px at 85% 70%, #1f6fe055, transparent 70%), radial-gradient(420px 300px at 10% 10%, #ffb35914, transparent 70%)" }} />
        <div aria-hidden className="dot-grid pointer-events-none absolute inset-0" />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <Logo light />
            <span className="rounded-full border border-white/20 px-3.5 py-1.5 text-[14px] font-semibold text-[#a9bfdc]">Brightline partner portal</span>
          </div>
          <h1 className="mt-7 max-w-[20ch] text-[32px] leading-[1.08] font-bold text-white sm:text-[40px] xl:text-[44px]">{c.title}</h1>
          <p className="mt-4 max-w-[46ch] text-[17px] text-[#b9cbe4]">{c.sub}</p>
        </div>
        <div className="relative hidden flex-1 items-center sm:flex"><Preview role={role} /></div>
        <div className="relative grid gap-3 sm:grid-cols-3">
          {c.stats.map(([k, v]) => (
            <div key={k} className="rounded-[14px] border border-white/15 bg-white/[0.04] px-4 py-3.5 backdrop-blur-sm xl:px-5">
              <b className="block text-[17px] text-white">{k}</b>
              <span className="text-[14.5px] text-[#a9bfdc]">{v}</span>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex items-center justify-center px-6 py-10 sm:px-10 lg:overflow-y-auto">
        <div className="w-full max-w-[460px]">
          <button type="button" onClick={onBack} className="mb-5 inline-flex items-center gap-1.5 text-[15px] font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> All roles
          </button>
          <span className="flex w-fit items-center gap-2 rounded-full bg-amber-soft px-3 py-1 text-[14px] font-semibold text-amber-ink">
            {company.name} · {me.roleLabel}
          </span>
          <h2 className="mt-3 text-[30px] font-bold">Welcome back</h2>
          <p className="mt-1 text-[16px] text-muted-foreground sm:whitespace-nowrap">{c.signIn}</p>

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
                <b className="block text-[16px] font-semibold">Continue with {company.name} SSO</b>
                <span className="text-[13px] opacity-85">Recommended · your own company login</span>
              </span>
              <ArrowRight className="size-5 transition group-hover:translate-x-0.5" />
            </button>
          </div>

          <div className="my-6 flex items-center gap-3 text-[14px] text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or get a sign-in link <span className="h-px flex-1 bg-border" />
          </div>

          <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); start("email") }}>
            <Label htmlFor="pemail" className="text-[15px]">Work email</Label>
            <div className="flex gap-2">
              <Input id="pemail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 flex-1 bg-card text-[16px]" />
              <Button type="submit" variant="outline" className="h-12 bg-card px-4 text-[15px]" disabled={!!busy}>
                {busy === "email" ? <Loader2 className="size-5 animate-spin" /> : <Mail className="size-5" />}
                Send link
              </Button>
            </div>
            <p className="text-[14px] text-muted-foreground">No password. The link signs you in on this device. {c.invite}.</p>
          </form>

          <ul className="mt-6 grid gap-2 text-[14.5px] text-muted-foreground">
            {c.points.map((p) => <li key={p} className="flex gap-2"><Check className="mt-0.5 size-4 text-ok" /> {p}</li>)}
          </ul>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="text-[14px] text-muted-foreground">Demo sign-in · nothing is sent.</p>
            {role === "pexec" && (
              <button type="button" onClick={() => toast("Applications start from Brightline's public partner page", { description: "Not part of this demo. Brightline's partner manager accepts or declines each one." })} className="text-[14.5px] font-semibold text-primary hover:underline">
                New partner? Apply to join
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
