# Channel Chief portal (Dana Ortiz)

Prototype `prm-partner-manager`, branch `feature/partner-portals`, routes under `#/c/`. Dated 31 Oct 2026.

Sources: the BRD persona and permission matrix (from the PRM Knowledge Hub), the 28 Oct planning deck, and the Partner Manager portal's hand-offs. Names are illustrative.

## 1. The role

| | |
|---|---|
| Who | Owns Brightline's partner program and budget. Sets the rules others work within. The escalation point and approver for anything sensitive. |
| Main job | Grow the partner book and defend the budget |
| Main number | Revenue by partner (verified, reconciled to Salesforce closed-won) |
| Main action | Approve an escalation or a credit override |
| Device, frequency | Laptop, daily. Most approvals start from a Slack, Teams or email alert. |
| Stage | 1A, with revenue views in 1B |
| Sign-in | Brightline company SSO |
| Receives from | Partner managers (escalations, split proposals), RevOps (rule changes), the AI supervisor (autonomy changes) |
| Hands off to | CEO / CFO (board view), RevOps, partner managers |

## 2. Access

| Action | Channel chief | Stage | Source |
|---|---|---|---|
| See every partner's deals and credit | Yes, across all partner managers | 1A / 1B | Permission matrix |
| Decide a registration | Only when it's escalated at 80% of the review deadline | 1A | R-SLA-3 |
| Grant or deny an extension | Only the second extension | 1A | R-REG-11 |
| Approve a credit split override | Yes. A partner manager can't approve their own proposal. | 1B | R-CR-2 |
| Accept or decline an application | Only applications a partner manager escalated | 1A | R-ONB-2 |
| Program rules, tiers and review deadlines | Approves changes | 1A | Permission matrix |
| AI agent autonomy | Approves changes; can pause any agent | 0 | R-AG-1 |
| Export revenue (board view) | Yes | 1B | Permission matrix |
| MDF, rewards and tier changes | Approves | Stage 2 | Permission matrix |
| **Register deals** | **No** | — | BRD persona |
| **Publish an attribution model without CFO approval** | **No** | — | Proposed rule |
| **Let agents move money** | **Never**, at any autonomy level | — | R-AG-2 |

## 3. Journeys

Every approval follows the same pattern as the partner manager's decisions:

1. See why it's on your desk.
2. Read the evidence and the AI recommendation.
3. Choose an option. Each option card says what happens next.
4. Confirm. The decision is logged with Dana's name and everyone affected is told why.

| # | Journey | What Dana sees | What happens elsewhere |
|---|---|---|---|
| C1 | **Escalated deal** (Kestrel Energy, 82% of its review deadline used) | Deadline meter, why it was held back, checks, AI recommendation. Approve, reject with a reason code, or leave it with Jordan and nudge him. | The deal is approved or rejected as "By Dana Ortiz" in Jordan's queue. Ridgeway sees "Approved by Dana Ortiz" on its own deals. |
| C2 | **Credit split override** (Brookside Bank) | The current and proposed splits as bars, the change per partner in points and dollars, Jordan's reason and evidence, each partner's work on the deal | On approval the split becomes a new version and Jordan sees "Dana Ortiz approved your split". On decline Jordan sees the reason. |
| C3 | **Second extension** (Orchid Foods) | The partner's reason, Salesforce stage, last customer activity, earlier extensions, AI recommendation (deny) | The extension shows as granted or declined in Jordan's queue |
| C4 | **Escalated application** (Tidewater Systems wants Platinum and an exclusive territory) | Jordan's note, the applicant's message, checks. Accept at a chosen starting tier (with a warning on Platinum) or decline. | The partner record is created and onboarding starts with Jordan |
| C5 | **Rule change** (raise the auto-approve limit to $75,000 for Gold and Platinum, from RevOps) | Now versus proposed, the evidence, what changes | "Rules in force" updates |
| C6 | **AI autonomy** (Deal Desk agent from A3 to A4 under $25,000, from the AI supervisor) | Now versus proposed, the agent's accuracy, the guardrail that money is never autonomous | The agent's autonomy level updates. Any agent can be paused. |
| C7 | **Defend the budget** | Verified partner revenue against the target and against program cost (return multiple), budget lines, revenue by partner, board-view CSV export | — |
| C8 | **Partner managers** | Each partner manager's revenue, pipeline, on-time rate, median decision time and deals near deadline. Nudge any of them. | — |

## 4. Screens

All screens use the same design system as the Partner Manager portal:

- **Home:**
  - The verified revenue hero card, against target.
  - Approvals waiting.
  - Return on budget.
  - "Decide next".
  - Top partners.
  - Partners to watch.
  - Recent activity.
- **Approvals:** tabs for All waiting, Escalated deals, Credit splits, Extensions, Applications, Rules and AI, and Decided. Each item opens a decision page.
- **Revenue by partner:** a table across all partner managers with a filter by partner manager, a side panel for each partner, and the board-view export.
- **Partner managers:** one performance card per partner manager, plus how escalation works (50% / 80% / 100%).
- **Program and rules:** budget and return, changes waiting, rules in force, and AI agent autonomy levels A0 to A4 with a pause button.
- **Your access:** what Dana can and can't do.
- **PartnerAssistant:** answers from the whole program as Dana sees it.

## 5. Programs

A program is a partner track with its own rules (BRD glossary). There are five:

- **Reseller:** partners buy Brightline products and resell them.
- **Services:** partners implement and support Brightline.
- **Referral:** partners introduce customers; Brightline sells to them.
- **Technology:** partners whose products connect to Brightline.
- **Marketplace:** customers buy through a cloud marketplace. **Not launched yet.**

RevOps creates programs from these templates and writes their rules. Dana approves them (permission "Configure programs, tiers, SLAs and rules").

**Programs and rules page:**

- **All programs:**
  - Budget against revenue.
  - Changes waiting.
  - One row per program: partners, verified revenue, budget used, return, and rules version.
  - AI agent autonomy, which applies to every program. Each agent can be paused and resumed.
- **One tab per program:**
  - Partners and revenue.
  - Budget and return.
  - The rules in force, with the version number.
  - Changes waiting for this program.
  - Rule history.

**Rules:**

- Each program has its own auto-approve limit, review deadline, protection window and lead acceptance window. Escalation, extensions and the credit model are shared by all programs.
- Rules belong to a **program**, not a partner manager. An approved change applies to every partner in that program, whichever partner manager looks after them. Partner managers are told; they can't change rules.
- **Review deadlines** follow the documents' default by deal size: 8 business hours up to $100,000, 16 above (R-SLA-6).
  - The Services program keeps its own setting: 16 hours for every deal. SLAs may vary by program and by deal size (R-SLA-1).
  - A new registration gets its deadline from its program and value. Marcus sees it before he submits, and again on the result screen.
- Every change request names its program(s). The decision page shows:
  - which programs it covers;
  - how many partners it affects;
  - which partner managers look after them;
  - the version change, e.g. Reseller v3 → v4.
- **Approved changes take effect immediately.** Approving CR-21 raises the Reseller program's limit for Gold and Platinum partners to $75,000, so a $70,000 deal Marcus registers for Ridgeway (a Gold reseller) is approved by the rules.
- Revenue by partner can be filtered by program.

Program budgets ($520K, $380K, $190K, $110K) are example figures that add up to the overall $1.2M.

## 6. Gaps closed on the partner manager side

- **Second extensions:** these no longer sit in Jordan's to-decide list. A "Waiting for Dana Ortiz" list shows them read-only, and the outcome shows as "Extended … by Dana".
- **80% escalation:** deals past 80% of their deadline carry an "Escalated to Dana" tag in Jordan's queue and a notice on the deal page.
- **Pipeline:** each partner's open pipeline now adds up from its real open deals, everywhere (Dana's revenue view, Jordan's partner list and the assistant). It matches the side panel and updates live.

## 7. Added beyond the documents (standard practice)

The documents don't say who decides which partners each partner manager looks after. We filled the gap with common practice, and the UI tags it **"Added · standard practice, not in the documents"** wherever it appears: on the Partner managers page, the journeys page, and Dana's access page.

| Situation | Who | What happens |
|---|---|---|
| A new partner joins | Automatic | The partner goes to the partner manager who accepted it, routed by region |
| Move a partner (territory change, workload, partner request, partner manager leaving) | **Channel chief** decides | **Partner managers → Who looks after which partner → Move.** Open deals, extension requests and leads move with the partner. Both partner managers are told. |
| A partner nobody looks after (e.g. Bluefin Cloud) | **Channel chief** | **Assign** on the same page |
| Keeping Salesforce and the PRM records in line | RevOps | Carries out the change after the channel chief decides |
| Creating or removing partner manager accounts | **IT**, not the channel chief | Through company SSO with automatic provisioning (SCIM). Matches the documents (R-SEC-5, permission "Manage vendor users"). |

**In the prototype:**

- **Moving a partner away from Jordan** removes it from his partner list, deal list, review queue, extension requests and search. He gets a notification.
- **Assigning a partner to Jordan** adds it to those lists.
- **Recent moves** are listed with the reason.

**Demo limit:** Rui's and Mei's own partners are sample totals, so only partners in the live data can be moved. The Ridgeway portals still name Jordan as their partner manager even if Ridgeway is moved.

## 8. Defaults and example figures (not yet decided)

- **Budget figures:**
  - Annual budget $1.2M.
  - $840K spent to date.
  - Annual revenue target $5M.
  - Breakdown by line: partner discounts and margin, MDF, partner team and tools, rewards and spiffs.
- **Other partner managers:** Rui Costa (EMEA) and Mei Tan (APAC). They and their partners are illustrative totals; only Jordan's numbers are live.
- **The two pending change requests** (CR-21 and CR-22) are examples.
- **Review deadlines, protection length and the $50,000 limit** follow the proposed defaults in the hub.
