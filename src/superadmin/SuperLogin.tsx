import { useState } from "react"
import { ArrowLeft, ArrowRight, Check, Fingerprint, Loader2, ShieldAlert } from "lucide-react"
import { Logo } from "@/components/common"
import { admin } from "@/superadmin/data"

/** The platform team signs in differently from customers: company SSO plus a hardware security key, from the office network or VPN only. */
export function SuperLogin({ onSignIn, onBack }: { onSignIn: () => void; onBack: () => void }) {
  const [step, setStep] = useState<"start" | "key" | "done">("start")
  const go = () => {
    setStep("key")
    setTimeout(() => { setStep("done"); setTimeout(onSignIn, 350) }, 900)
  }
  return (
    <div className="grid min-h-svh lg:h-svh lg:grid-cols-[minmax(460px,48%)_1fr] lg:overflow-hidden">
      <aside className="relative flex flex-col justify-between gap-8 overflow-hidden bg-night px-6 py-8 text-[#dbe7f7] sm:px-10 xl:px-12">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(600px 380px at 85% 70%, #ffb35922, transparent 70%), radial-gradient(420px 300px at 10% 10%, #1f6fe033, transparent 70%)" }} />
        <div aria-hidden className="dot-grid pointer-events-none absolute inset-0" />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <Logo light />
            <span className="rounded-full border border-[#ffb359]/40 px-3.5 py-1.5 text-[14px] font-semibold text-[#ffb359]">Platform team only</span>
          </div>
          <h1 className="mt-7 max-w-[19ch] text-[32px] leading-[1.08] font-bold text-white sm:text-[40px] xl:text-[44px]">Run the platform for every customer.</h1>
          <p className="mt-4 max-w-[46ch] text-[17px] text-[#b9cbe4]">Organizations, plans, features, security, AI providers and the platform-wide switches, above every customer's portals.</p>
        </div>
        <div className="relative grid gap-3 sm:grid-cols-3">
          {[["Every tenant", "in one place"], ["Read-only", "customer data, only when they approve"], ["Every change", "in the platform audit log"]].map(([k, v]) => (
            <div key={k} className="rounded-[14px] border border-white/15 bg-white/[0.04] px-4 py-3.5 backdrop-blur-sm xl:px-5"><b className="block text-[17px] text-white">{k}</b><span className="text-[14.5px] text-[#a9bfdc]">{v}</span></div>
          ))}
        </div>
      </aside>
      <main className="flex items-center justify-center px-6 py-10 sm:px-10 lg:overflow-y-auto">
        <div className="w-full max-w-[460px]">
          <button type="button" onClick={onBack} className="mb-5 inline-flex items-center gap-1.5 text-[15px] font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> All roles</button>
          <span className="flex w-fit items-center gap-2 rounded-full bg-amber-soft px-3 py-1 text-[14px] font-semibold text-amber-ink">Super admin · PRM platform team</span>
          <h2 className="mt-3 text-[30px] font-bold">Welcome back</h2>
          <p className="mt-1 text-[16px] text-muted-foreground">Signed in on the office network as {admin.email}.</p>
          <button type="button" onClick={go} disabled={step !== "start"} className="group mt-6 flex h-14 w-full items-center gap-3 rounded-[12px] bg-primary px-2 pr-4 text-left text-primary-foreground shadow-[0_8px_20px_#0969da33] transition hover:bg-[#0758b8] disabled:opacity-80 dark:hover:bg-primary/90">
            <span className="grid size-10 place-items-center rounded-[9px] bg-white/15">{step === "start" ? <Fingerprint className="size-5" /> : step === "key" ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}</span>
            <span className="flex-1 leading-tight"><b className="block text-[16px] font-semibold">{step === "start" ? "Sign in with SSO and security key" : step === "key" ? "Touch your security key" : "Verified"}</b><span className="text-[13px] opacity-85">PRM platform SSO, then your hardware key</span></span>
            <ArrowRight className="size-5 transition group-hover:translate-x-0.5" />
          </button>
          <ul className="mt-6 grid gap-2 text-[14.5px] text-muted-foreground">
            {["No email links or app codes for the platform team", "Only from the office network or VPN", "Customer data stays closed until the customer approves support access"].map((p) => <li key={p} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-ok" /> {p}</li>)}
          </ul>
          <p className="mt-6 flex gap-2 rounded-[12px] bg-bad-soft/50 px-4 py-3 text-[14px] text-foreground"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-bad" /> This is production. Changes here reach every customer, and each one is logged with your name.</p>
          <p className="mt-6 border-t pt-4 text-[14px] text-muted-foreground">Demo sign-in · nothing is sent.</p>
        </div>
      </main>
    </div>
  )
}
