# Partner portals: Partner Executive and Partner Sales Rep

**Prototype:** `prm-partner-manager`, branch `feature/partner-portals`
**Written:** 30 Oct 2026

**Built on:**
- BRD personas and permission matrix (via the PRM Knowledge Hub)
- 28 Oct planning deck
- Partner Manager (PAM) portal
- Impartner demo (27 Oct) and slides (28 Oct)

**Example company:** Ridgeway IT, a Gold reseller in Brightline's program. Names are illustrative.

- **Paul Okafor, CEO:** the partner executive.
- **Marcus Bell, partner sales lead:** the sales rep.
- **Jordan Lee:** their partner manager at Brightline.

---

## 1. What each role is for

| | Partner Executive (Paul) | Partner Sales Rep (Marcus) |
|---|---|---|
| Main job | Know what the program is worth to us | Register deals and get credit |
| Main number | Verified revenue earned with Brightline | Value created this week |
| Main action | Review benefits and what unlocks the next tier | Register a deal |
| How often, where | Weekly, mostly on a phone | Daily, often in a customer's lobby |
| Stage | 1B (revenue proof, tier progress) | 1A (deal registration) |
| Signs in with | Work-email link or Ridgeway's own SSO. Invited by Brightline when Ridgeway was accepted | Work-email link or Ridgeway's SSO. Invited by Ridgeway's admin (Paul) |

**Demo only:** the welcome page (`#/welcome`) lets the team pick a role and sign in. It is not part of the product.

---

## 2. Access: what each role can and can't do

The hub's permission engine (R-SEC-4) enforces this at the API, not just on screen. In the table, Paul means the Partner Executive and Marcus means the Partner Sales Rep.

| Action | Paul | Marcus | Stage | Source |
|---|---|---|---|---|
| Register a deal | Yes, for himself or any Ridgeway rep | Yes | 1A | R-REG-1 |
| See deals | Every Ridgeway deal | **Own deals only** | 1A | R-SEC-2 |
| Answer a partner manager's question | Any Ridgeway deal | Own deals | 1A | R-SLA-7 |
| Request a protection extension | Any Ridgeway deal | Own deals | 1A | R-REG-9, R-REG-11 |
| See the deal's real Brightline stage | Yes | Own deals | 1A | R-SEC-8 |
| See credit | Ridgeway's credit on every deal | Own deals only | 1A / 1B | R-CR-5 |
| See another partner's role, share or commercials | **No**: shows "2 other partners · details private" | **No** | — | R-CR-5, R-SEC-2 |
| Change credit | **No**: dispute with evidence instead | **No**: dispute on own deals | Stage 2 | R-CR-2, R-CR-11 |
| Accept or decline a lead | Leads offered to Ridgeway | Leads offered to him by name | Stage 2 preview | R-LD-4 |
| Assign a lead to a rep | Yes | No | Stage 2 preview | R-LD-4 |
| Export revenue | Ridgeway only | No | 1B | Default |
| Manage company users | Yes (delegated admin) | No | P1 | BRD persona |
| Program, tier and benefits | Yes | No (sees own training only) | 1B | J-04 |
| Agreements and compliance documents | Yes | No | 1A | R-ONB-1 |
| Request MDF | Yes | No | Stage 2 preview | BRD persona |
| Resources and training | Exec and shared assets | Sales assets, including pricing | 1B | Impartner slides 6–7 |
| Decide registrations, see Brightline's own opportunities, see other partners | **Never** | **Never** | — | R-SEC-2, R-SEC-3 |

**Partners never see:**
- Who owns a conflicting Brightline opportunity, or which other partner registered first. They see "a possible conflict is being checked" (R-SEC-2).
- The AI recommendation shown to the partner manager.
- Brightline's partner quality score.
- Another partner's share, even on a deal they share.

---

## 3. Deal statuses, as partners see them

These follow R-STATE-1: one business status, plus a separate Salesforce write status that partners never see as a blocker.

| Status in the system | Partner sees | What it means for them |
|---|---|---|
| `under_review` | **In review** · with Jordan Lee · decision by *time* | The 60-second acknowledgement already named the reviewer and the deadline (R-REG-13) |
| `info_requested` | **Reply needed** | Jordan asked a question. The clock is paused and resumes when they reply; it doesn't reset (R-SLA-7) |
| `approved` | **Approved**, or **Approved by rules in 44 s** | Protected until *date* (90 days, R-REG-10). Extensions are one tap |
| `rejected` | **Not approved** + plain-language reason | The reason code and explanation arrive within 1 s (R-REG-7) |
| `won` / `lost` / `expired` | **Won** / **Lost** / **Protection ended** | Revival is possible within 14 days of expiry (R-REG-12) |

---

## 4. Flows

**F1. Register a deal (Marcus or Paul, three taps; J-01).** The tap counter starts once the description or email is in.

1. **Describe it.** Type, or paste the customer's email. Voice and photo arrive in Stage 2.
2. **Check what AI filled in.** Account, contact, product, value and close date, each with a confidence level. Anything under 80% is highlighted. Tap to confirm, or edit.
   - The checks run live: eligible, onboarding complete, product authorised, territory, conflict.
3. **Submit.** Within 60 seconds:
   - **Clean deal:** approved by rules. Protected for 90 days, and the Salesforce opportunity is created with Ridgeway as Reseller.
   - **Needs a person:** the screen shows the reason in plain words, *"Jordan Lee reviews it"*, and the deadline.
   - The registration appears in Jordan's review queue in the PAM portal.

**F2. Answer a question (Marcus on own deals, Paul on any).**
1. A notification and a "Reply needed" card appear on Home.
2. They open the deal, read Jordan's question and reply.
3. The SLA resumes from where it stopped, the checks re-run, and the deal returns to Jordan's queue.

**F3. Ask for more protection.**
1. Twenty-one days before protection ends, the deal shows *"Protection ends in N days"*.
2. They choose 30, 60 or 90 days and give a reason. Recent activity is attached automatically.
3. The request goes to Jordan's Extensions tab. A second extension needs the channel chief (R-REG-11).

**F4. Leads from Brightline (Stage 2 preview; R-LD-2, R-LD-4).**
1. Jordan sends a lead to Ridgeway, with 48 hours to accept.
2. Until it's accepted, the partner sees **company, industry, region, product and estimated value only**. The contact's name and email stay hidden. This is Impartner's pattern, kept.
3. Paul accepts and assigns a rep, or declines with a reason. A declined lead goes back to Jordan.
   - **Added beyond the documents:** AI suggests which rep should own the lead and why, based on past wins in that industry, the product they sell, the region they cover, and how many open deals they have. The suggested rep is pre-selected, and Paul can choose anyone. The documents only cover the AI suggesting which *partner* gets a lead (R-LD-3).
4. The rep works it, logs updates and registers it as a deal in one tap; the registration is prefilled from the lead.
5. If nobody accepts in time, the lead expires and Jordan reassigns it.

**F5. Revenue and credit (J-02).**
- **Paul:**
  - Sees verified revenue only by default (R-CR-10). A toggle adds partner-reported and inferred credit.
  - Every figure reconciles to Salesforce closed-won as matched, pending or mismatch (R-CR-9).
  - Can export Ridgeway's credit as a CSV file.
- **Marcus:** sees each of his own deals: role, share, credited value, the reason for the share, and the version history (R-CR-6).
- **Disputes:** either can dispute with evidence. The decision owner is Jordan Lee, with a 5-business-day target (R-CR-11, Stage 2).

**F6. Grow the partnership (Paul; J-04).**
- Shows the current tier and what unlocks the next one, with progress on each requirement. Only verified outcomes count (R-GR-1).
- Shows the benefits in use now, plus agreements and compliance: an expiring insurance certificate becomes a task.
- The MDF balance and requests are a Stage 2 preview.

**F7. Manage the team (Paul; P1).**
- Invite people with a role: Sales rep, Admin, Marketer or Technical.
- Choose who can register deals, and deactivate anyone. A deactivated person's deals stay with Ridgeway.
- People sign in with a work-email link or Ridgeway's SSO.

### What syncs with the partner manager portal

The prototype keeps one shared store, so each action shows up on the other side:

| Partner action | Where it shows in the PAM portal |
|---|---|
| Register a deal | Review queue (or auto-approved) |
| Reply to a question | Back in the queue, clock resumed |
| Request an extension | Extensions tab |
| Accept or decline a lead | Deals & leads → Leads |

To try it: sign out, pick the other role on the welcome page, and the change is there.

---

## 5. Screens and navigation

Both portals use the PAM portal's design system: the shadcn components, navy and blue with an amber accent, 15–16 px body text, a sidebar on desktop and a bottom bar on phones. Impartner has 15+ menu items; we keep 5–7.

| Partner Executive | Partner Sales Rep |
|---|---|
| **Home:** program value, tier progress, what needs you, partner manager contact | **Home:** register button, what needs you, value this week, recent decisions |
| **Deals:** every Ridgeway deal, filter by rep | **Deals:** own deals |
| **Leads:** offered to Ridgeway; accept and assign | **Register:** the 3-tap flow; centre button on phones |
| **Revenue:** verified credit, reconciliation, export | **Leads:** offered or assigned to him |
| **Program:** tier, benefits, agreements, MDF | **Credit:** own credit and why |
| **Team:** users and invitations | **Resources** (in the menu on phones) |
| **Resources** | |

Shared:
- **Deal page:** status, timeline, protection, Ridgeway's own credit, and reply / extend actions.
- **Your access:** what this role can and can't do.
- **Ask PartnerAssistant:** answers from the role's own data.

---

## 6. Compared with Impartner

| Impartner (demo and slides) | Our partner portals |
|---|---|
| A dashboard of tiles: tier, pipeline, business plan, MDF, commissions | Exec home leads with **verified** revenue and the next tier; each tile says what to do next |
| Long registration form with 12 fields | Three taps; AI fills the fields, the partner confirms. Decided in 60 s or acknowledged with a reviewer and deadline |
| Deals, Leads and Closed tabs with no next step | Tabs by what needs you, with the real Brightline stage and protection days left |
| Leads show minimal details until accepted | Kept, plus assign-to-rep and the reason a lead was sent |
| Asset library segmented by role, with co-branding | Kept, simplified to one Resources page with role-based content |
| Journeys / onboarding checklist | Agreements and compliance tasks on the Program page |
| Analytics dashboards (Account Overview) | Revenue page reconciled to Salesforce closed-won |
| 15+ menu items, desktop-first | 5–7 items, phone-first for the rep |

---

## 7. Defaults used (not yet decided)

These are tagged in the UI where they appear:

- Protection lasts 90 days.
- One extension of 30, 60 or 90 days.
- Leads must be accepted within 48 hours.
- Tier requirements and benefits are **example program terms**.
- MDF, lead sharing, disputes and certifications are Stage 2 previews.
- Rep roles inside a partner company: Sales rep, Admin, Marketer and Technical.
