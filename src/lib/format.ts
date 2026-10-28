// The demo runs on a fixed clock so SLA timers and "2 hours ago" labels stay stable.
export const NOW = new Date("2026-10-28T12:10:00")

const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

export function money(n: number) {
  return usd0.format(n)
}

export function moneyShort(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (n >= 1000) return `$${Math.round(n / 1000)}K`
  return `$${n}`
}

export function date(iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) {
  return new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("en-US", opts)
}

export function shortDate(iso: string) {
  return date(iso, { month: "short", day: "numeric" })
}

export function time(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

export function ago(iso: string) {
  const mins = Math.round((NOW.getTime() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  if (days === 1) return "yesterday"
  return `${days} days ago`
}

export function hoursLeft(h: number) {
  if (h <= 0) return "SLA passed"
  const whole = Math.floor(h)
  const mins = Math.round((h - whole) * 60)
  if (whole === 0) return `${mins} min left`
  return mins ? `${whole} h ${mins} min left` : `${whole} h left`
}

export function addDays(iso: string, days: number) {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function initials(name: string) {
  return name
    .replace(/&/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")
}

export function pct(n: number) {
  return `${Math.round(n)}%`
}
