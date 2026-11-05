# PRM · four-portal prototype

A clickable prototype of the PRM with four portals, each showing only what that person may see and do:

| Portal | Person | Routes | Spec |
|---|---|---|---|
| Partner manager | Jordan Lee (Brightline) | `#/home`, `#/queue` … | this README |
| Channel chief | Dana Ortiz (Brightline) | `#/c/…` | [docs/Channel_Chief_Spec.md](docs/Channel_Chief_Spec.md) |
| Partner executive | Paul Okafor (Ridgeway IT) | `#/p/…` | [docs/Partner_Portals_Spec.md](docs/Partner_Portals_Spec.md) |
| Partner sales rep | Marcus Bell (Ridgeway IT) | `#/p/…` | [docs/Partner_Portals_Spec.md](docs/Partner_Portals_Spec.md) |

The app opens on a demo-only **Choose a portal** page.

- Pick a role to sign in. The address bar shows who's signed in, e.g. `?role=channel-chief`.
- **Sign out · switch role** keeps your changes, so actions carry across portals. For example, register a deal as Marcus and it's waiting in Jordan's queue.
- A browser refresh resets everything.
- The **PRM Knowledge Hub** (personas, permissions, rules, flows and decisions) is part of this app at `/hub/`. It's linked from the Choose a portal header and from every portal's sidebar and account menu. It opens in a new tab, so the demo data isn't reset.

Names and companies are illustrative.

### Knowledge hub

The hub's source is in `hub/`: its own page (`hub/index.html`), styles and hash routes. It imports with `@hub/…`, while the portals keep `@/…`.

- Content lives in `hub/src/content/`. Update it there whenever a portal or a decision changes.
- `npm run check:hub` checks that every item has a source and status and that every link resolves. `npm run build` runs this check first.
- Without the claude.ai viewer, "Ask the hub" lists the closest hub items instead of giving AI answers.

## Partner manager (PAM / CAM)

A clickable prototype of the partner manager workspace, built from *PRM User Journeys by Persona* (27 Oct) and the 28 Oct planning deck. It's React + Vite + Tailwind v4 + shadcn/ui (Radix). It keeps the previous design's palette (navy `#102f57`, brand `#0969da`, amber `#ffb359`) and its sign-in layout.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static build in dist/
```

All data is fictional and in memory. A refresh resets the demo. The clock is fixed at 28 Oct 2026, 12:10, so the SLA timers stay stable.

## The three journeys

| Journey | Steps → screen | Requirement IDs |
|---|---|---|
| **1 · Work the review queue** (J-01, Stage 1A) | Slack-style nudge at 50% of SLA → **Registration** (deal vs. conflicting Salesforce opportunity side by side, AI advice with evidence, checks) → **Approve / Ask for info / Reject** (reason code; asking pauses the SLA) → outcome: partner told, opportunity and role linked, sync status shown separately → **Extensions** tab: grant or deny | DR-03 to DR-10, SL-01 to SL-03 |
| **2 · Onboard partners** (Stage 1A) | **Applications** → application detail (company, agreements, checks) → Accept with tier, Decline with a reason, or Escalate to the channel chief → **Onboarding** tracker (agreements, documents, tasks, then eligible to register, then complete at the first deal) | BRD §11 Recruitment and Onboarding |
| **3 · Manage credit and growth** (Stages 1B and 2) | **Credit splits** → opportunity → Add partner and role (model split recalculated) → Propose split change (must total 100%, evidence required, goes to the channel chief; you can't approve your own) → **Partner health** (rising, stalling, at risk; coach drafts it, you send) | MP-01 to MP-05, ME-11, ME-07 |

There's a map of these journeys inside the app at **The three journeys** (sidebar footer, or the link on the sign-in page). Each step opens its screen.

## Other screens

- **Deals & leads**: every deal from your partners, at every stage, with one search box, partner and sort filters, and status chips. Each row shows its single next step. The **Leads** tab shows leads waiting for a partner (with an AI-suggested partner and one-tap send), leads waiting for acceptance (48 hours), and accepted leads. Lead sharing is Stage 2 (DR-12).
- **Partner profile** (`#/partner/<id>`): a full page for each partner. It has quick stats, "Talk to them about" (built from the queue, leads, onboarding and health), open deals, credit on shared opportunities, people, agreements, and your private notes with an activity timeline. Partners not assigned to you show by name only.
- **Home**: the main number first (registrations waiting, SLA risk), then *Decide next*, *Who to call today* and the live time-to-decision counter.
- **Salesforce** (the only CRM at launch, per decision D3): connection health, writes from your decisions, items RevOps is fixing, and what PRM reads and writes. The header status chip opens it.
- **Header search** (⌘K or /): searches registrations, partners, opportunities and applications.
- **PartnerAssistant**: the copilot panel, with scripted answers for the demo.
- On phones, the sidebar becomes a bottom tab bar, and the registration decision becomes a sticky Approve / Ask / Reject bar that opens a bottom sheet.

## Scope rules the design follows

- A partner manager sees only the partners assigned to them in full. Other partners show by name only, and their commercial terms are hidden.
- Registrations past 80% of the SLA alert the channel chief. Split overrides and escalated applications go to the channel chief too.
- Co-sell (J-03) is Stage 2 and isn't designed here.
