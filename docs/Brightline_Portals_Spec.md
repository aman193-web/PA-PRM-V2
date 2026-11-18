# Brightline portals: RevOps, field seller, CEO / CFO, CRO, IT / CRM admin and AI supervisor

This spec covers the prototype `prm-partner-manager`. The six portals here share one app: the routes live under `#/v/`, and what renders depends on who signs in, the way the four partner roles share theirs. Updated 17 Nov 2026.

**Sources:**
- The BRD personas and permission matrix, as compiled in the PRM Knowledge Hub.
- The 28 Oct planning deck (J-02, J-03).
- The hand-offs already built into the partner manager and channel chief portals.

Names are illustrative.

With these six, the prototype has a portal for each of the BRD's twelve personas.

## 1. What each role is for

| | RevOps · Ana Costa | Field seller · Sam Rivera | CEO / CFO · Morgan Hale |
|---|---|---|---|
| Main job | Keep data clean and workflows running | Find the right partner for a deal | Know if the channel is worth the investment |
| Main number | Open exceptions | Partner-involved deals on my accounts | Verified partner revenue and return |
| Main action | Resolve an exception | Send a co-sell request | Share the board view |
| Device | Laptop | Phone, on site | Phone, weekly |
| Stage | 1A; reconciliation in 1B | 1A; co-sell in 2 | 1B |
| Receives from | The Data Steward agent; partner managers ("Tell RevOps"); IT (field mappings, merges) | Partner registrations on their accounts; the CRO's questions | The channel chief (model versions, large rewards) |
| Hands off to | Channel chief (rules, programs), partner managers, IT (merges) | Partners (co-sell), partner manager (context) | The board |

| | CRO · Priya Shah | IT / CRM admin · Kai Brennan | AI supervisor · Lee Park |
|---|---|---|---|
| Main job | Hit the number with partner help | Connect systems safely | Keep agents safe and useful |
| Main number | Partner pipeline by stage | Integration health | Agent actions and approvals pending |
| Main action | Open deals at risk | Approve a connector or field mapping | Pause or tune an agent |
| Device | Phone and laptop, daily | Laptop | Laptop |
| Stage | 1B; AI risk flags and forecast in 2 | 0 | 0 |
| Receives from | Partner managers and the channel chief (decisions) | The channel chief (connectors), RevOps (merges), Okta (users) | Every agent (actions); partner managers and RevOps (agreements and overrides) |
| Hands off to | Partner managers, sellers, the channel chief (questions) | RevOps (mappings), the channel chief (leavers' partners) | The channel chief (raising autonomy) |

## 2. RevOps (Ana Costa)

**Can:**
- Clear the exceptions queue.
- Settle revenue mismatches with ledger entries.
- Create programs from templates.
- Propose rules, deadlines and limits.
- See all pipeline and revenue.

**Can't:**
- Approve their own rule changes (R-APR-2).
- Change credit or shares without approval (R-CR-2).
- Merge Salesforce records; the CRM admin does.

| Screen | What it does |
|---|---|
| Home | Share of closed-won partner deals matched to Salesforce, open exceptions, sync lag, changes waiting for Dana |
| Exceptions | Four kinds, all flagged by the Data Steward agent: failed Salesforce write, uncertain match, revenue mismatch, stale deal. Each shows PRM against Salesforce, the agent's advice and the options. Jordan's "Tell RevOps" shows on the matching item. |
| Reconciliation | Every closed-won partner deal with its status, plus the append-only revenue ledger |
| Programs and rules | Each program's rules by version. Propose a change (program, rule, new value, why), launch the Marketplace program from its template, or create a **New program**: pick a template, name it, adjust its four starting rules and say why. It shows as Not launched until Dana approves; then it's live at version 1. |

**Seeded exceptions:**
- Cedar Valley Schools: $45,000 credited against $42,000 in Salesforce.
- The Orion Labs write that timed out.
- Two Acme records that look like one company.
- Orchid Foods, which has gone quiet.

## 3. Field seller (Sam Rivera)

**Can:**
- See partner activity and registrations on their own accounts.
- See partner roles and touches.
- Add context to a registration for the partner manager.
- Send co-sell requests.
- Edit joint plans.

**Can't:**
- Decide registrations.
- See partners' commercial terms, credit shares, or other sellers' accounts.
- See deal values on a partner's registration before it's approved (G23).

| Screen | What it does |
|---|---|
| Home | Partner-involved deals, and what needs Sam: registrations in review, plan steps due, deals with no partner. Questions from the CRO show in Recent and notifications. |
| My accounts | Five accounts with stage, value, partners and status |
| Account | The Salesforce opportunity, partner registrations (with a box to tell Jordan what Sam knows), partners and touches, co-sell and the joint plan |
| Find a partner | Partners ranked with reasons (R-CS-2). The agent drafts; Sam edits and sends (R-CS-3). A preview shows what the partner sees before accepting (R-CS-4). |
| Co-sell | Requests sent and their status, deals that still need a partner |

**Co-sell flow:**
1. Sam picks Solstice Hotels. Ridgeway ranks first (the Lakeshore Hotels win and its hospitality campaign).
2. Sam sends the request to Marcus.
3. Marcus or Paul accepts on Ridgeway's **Leads → Co-sell** tab.
4. The account unlocks, Ridgeway joins the opportunity as Reseller, and both sides share a joint plan (R-CS-5).

For Ironbridge Utilities, Northpeak ranks first. Its Grid analytics reason changes when Raj passes the exam. Partners without a portal in the demo accept automatically after a moment.

## 4. CEO / CFO (Morgan Hale)

**Can:**
- See all revenue and pipeline.
- Export and share the board view.
- Approve a new attribution model version.
- Approve rewards over $20,000.

**Can't:** register deals, change credit splits, or configure programs.

| Screen | What it does |
|---|---|
| Home | Verified revenue against target, share of Brightline's revenue, return on the program, approvals, quarters, top partners |
| Partner revenue | Verified by default. Partner-reported and AI-inferred credit are off until switched on (R-CR-10). Sourced and influenced, by program, top partners, the model in force. |
| Board view | One slide, verified figures only. Copy a read-only link or download the figures. |
| Approvals | Attribution model version 3 (weights before and after, and what would have moved this year) and Northpeak's $21,600 rebate |

**Model version 3** changes three weights from 1 Jan 2027:

| Role | Version 2 | Version 3 |
|---|---|---|
| Implementation | 20 | 30 |
| Technology | 20 | 15 |
| Influenced | 10 | 5 |

Past periods keep version 2 (R-APR-3), and approved overrides are left alone.

## 5. CRO (Priya Shah)

**Can:**
- See all partner pipeline and revenue.
- Export the views they can see.
- Ask the person who can act on a deal at risk (added, G45).

**Can't:** decide registrations or conflicts, change credit, or configure programs.

| Screen | What it does |
|---|---|
| Home | Partner pipeline across every region with its stage mix, deals at risk, open conflicts, what closes next |
| Pipeline | By stage, by region (each partner manager) and by partner. North America deal by deal; EMEA and APAC from their Salesforce totals. Export as a spreadsheet. Q4 forecast, partner-involved against direct, with a confidence band (Stage 2 preview, PD-05 and PD-06). |
| Deals at risk | Each deal with its flags and who's already on it. "Ask Jordan Lee", "Ask the seller" or "Ask Dana Ortiz" sends an editable question. A risk moves to "Settled after you asked" when someone acts. |
| Channel conflicts | Partner against a Brightline seller (Acme Manufacturing) and partner against partner (Harbor Health). Both sides, the Deal Desk's advice, the seller's context, the deadline, then the outcome. |

The pipeline total ($4,338,000) matches the channel chief's partner pipeline. Co-sell deals are added once a partner accepts one.

**At risk in Stage 1B (G46)** means any of:
- The registration is past 80% of its review deadline.
- Protection ends within 14 days and before the expected close.
- There has been no Salesforce activity for 45 days or more.

A deal that needs a partner and has none is an AI flag (Stage 2 preview).

**Seeded risks:**
- Kestrel Energy (82% of its deadline used).
- Granite Labs (protection ends 3 Nov; extension requested).
- Prairie Foods.
- Orchid Foods (second extension with Dana; no activity for 52 days).
- Solstice Hotels and Ironbridge Utilities (no partner yet).

## 6. IT / CRM admin (Kai Brennan)

**Can:**
- Review the security package.
- Set up SSO and SCIM.
- Install the Salesforce package and scope the integration user.
- Approve AI-suggested field mappings and new connectors.
- Manage users and roles.
- Read and export the audit log.
- Add connectors (Stage 2).

**Can't:**
- See or change program rules, credit or partner decisions beyond support.
- Move partners between partner managers (G32).
- Change agent autonomy.

| Screen | What it does |
|---|---|
| Home | Salesforce sync lag against the 5-minute target (R-SEC-7), writes and retries, what needs an admin, the security package |
| Connections | Salesforce (package, integration user, least-privilege scope), the write history with "Retry now", record merges RevOps confirmed, connector requests with the scopes they'd get, sign-in (Okta SSO and SCIM), Slack, Teams, email, partner sign-in, and Stage 2 data connectors |
| Field mappings | Suggestions from the Data Steward agent with sample values and warnings. Approve, use the agent's safer field, or turn down. Mappings in use. |
| Users and roles | **Add user** for someone not in an Okta group yet (name, work email, PRM role). No password is ever sent: the invitation emails a link to Brightline's SSO (Okta), and the account turns from Invited to Active at the first sign-in with MFA. A non-Brightline address has no Okta login, so IT must create a contractor account in Okta first; an email sign-in link for staff isn't decided (G50). **Manage** any user: change their role, deactivate or reactivate them, or resend an invitation. An admin can't change or deactivate their own account. Also: new Okta groups to give a PRM role, leavers (their partners go to the channel chief), groups and roles, service accounts (agents have no access of their own, R-AG-4), partner companies' own admins. Every change is in the audit log. |
| Audit log | Every person, system and agent action from every portal, append-only (R-SEC-6). Filter by people, agents or systems; search; export. The export is logged too. |

**Seeded items:**
- Three field mappings: protection end date; campaign to LeadSource, where the safer option is a new field; partner tier.
- Dana's request to connect Microsoft Teams.
- PRM-Field-Sellers-EMEA: 12 people with no role.
- Mei Tan leaves on 15 Nov with 7 partners still assigned.

## 7. AI supervisor (Lee Park)

**Can:**
- Set each agent's autonomy per action, A0 to A4, within limits (R-AG-1).
- Lower autonomy at once.
- Ask the channel chief to raise it (R-AG-6, G47).
- Pause an action, an agent or every agent (R-AG-3).
- Review actions, overrides, evidence, confidence and cost (R-AG-5).
- Track AI cost.

**Can't:**
- Raise autonomy for money, contracts, access, export, demotion or termination (R-AG-2).
- Raise autonomy without the channel chief.
- Approve the business decisions agents raise.

| Screen | What it does |
|---|---|
| Home | Agent actions in the last 30 days and how often people agreed, overrides to review, AI cost, requests with Dana, the kill switch |
| Agents | The nine BRD agents, each with its main action's level, status and month, plus the kill switch |
| Agent detail | Every action with an A0–A4 picker. Levels above the cap are locked, with the reason. Pause an action or the agent. Recent actions and the 30-day record. |
| Agent activity | Everything the agents did and what people did with it (agreed, overrode, edited, waiting, acted alone). Each line opens its evidence, model, prompt version and cost. Overrides can be marked reviewed. |
| AI cost | By month against a monthly budget (an example, G49) and by agent |

**The nine agents and their main actions:**

| Agent | Main action | Level |
|---|---|---|
| Deal Desk | Approve clean deals under $25,000 | A3; A4 waiting for Dana |
| SLA | Remind at 50% | A4 |
| Attribution | Calculate splits | A2; capped at A3 because it's money |
| Insights | Answer questions | A4; never exports |
| Data Steward | Suggest fixes | A1; capped at A2 |
| Growth Coach | Suggest next actions | A1 |
| Co-sell | Draft the intro | A2; the seller always sends |
| Onboarding | Check documents | A3 |
| Program | Flag unapproved claims | A3 |

## 8. What syncs across portals

**RevOps (Ana)**

| Action | Shows up in |
|---|---|
| Ana settles Cedar Valley with a ledger entry | Jordan's Salesforce page (issue gone), the opportunity (matched), the reconciliation ledger |
| Ana retries the Orion Labs write | Jordan's Salesforce page: healthy, 0 retrying |
| Ana confirms the Acme records are one company | Kai's to-dos: merge them in Salesforce |
| Ana asks Jordan about Orchid Foods | Jordan's notifications; Priya sees it as already in hand |
| Ana proposes a rule change or the Marketplace program | Dana's Approvals; approving makes a new rules version or puts the program live, and Ana is told |

**Field seller (Sam)**

| Action | Shows up in |
|---|---|
| Sam adds context on Acme Manufacturing | Jordan's registration page and notifications, Priya's conflict card |
| Sam sends Ridgeway a co-sell request | Marcus's and Paul's Leads (Co-sell tab), Home and notifications; Priya's "no partner" risk clears |
| Ridgeway or Northpeak accepts | Sam's account and joint plan, the Salesforce opportunity, Jordan's notifications, Priya's pipeline; Raj is told for Northpeak |

**CFO (Morgan)**

| Action | Shows up in |
|---|---|
| Morgan approves or declines | Dana's Recent feed |

**CRO (Priya)**

| Action | Shows up in |
|---|---|
| Priya asks Jordan, Sam or Dana about a deal at risk | Jordan's notifications, Sam's notifications and Recent, or Dana's Recent |
| Jordan grants Granite Labs' extension | Priya's risk list: settled after she asked |

**IT (Kai)**

| Action | Shows up in |
|---|---|
| Kai merges the Acme records | Ana's exception and Recent, Sam's Recent |
| Kai retries a Salesforce write | Ana's exception resolved, Jordan's Salesforce page healthy |
| Kai approves a field mapping | Ana's Recent; Sam's too for protection dates |
| Kai connects Microsoft Teams | Dana's Recent |
| Kai tells Dana about a leaver | Dana's Recent, linking to Partner managers |

**AI supervisor (Lee)**

| Action | Shows up in |
|---|---|
| Lee pauses the Deal Desk agent, its advice, or every agent | Jordan's registrations (advice replaced by "Paused by the AI supervisor"), Jordan's notifications, Dana's agent panel |
| Lee lowers a level | Dana's Recent, Jordan's notifications for the Deal Desk |
| Lee asks to raise a level | Dana's Approvals; approving sets the level and tells Lee (and Jordan, for the Deal Desk) |
| Jordan, Dana or Ana decides something an agent advised | Lee's agent activity: agreed or overridden |
| Sam sends a co-sell request | Lee's agent activity: sent as drafted or edited |

**Every action from every portal** lands in Kai's audit log.

## 9. Added beyond the documents

- Sellers can add context to a partner's registration on their account (G43).
- Who inside a partner accepts a co-sell request: the named person, or the executive on their behalf (G44).
- Rewards over $20,000 need the CFO (R-APR-8, G42). The line is an assumption.
- Corrections are ledger entries; the original stays (R-CR-14).
- The CRO can ask the person who can act on a deal at risk; never decides it (G45).
- Stage 1B risk flags are rule-based (G46).
- Lowering autonomy is immediate; raising needs the channel chief (R-AG-6, G47).
- Connector requests from other roles go to IT with their scopes shown (G48).
- AI cost is shown against a monthly budget; the figure is an example (G49).
- The sync and reconciliation work is done by the Data Steward agent, the one the BRD defines.

## 10. Not designed yet

- Live transfers from the lead agent to a seller (Stage 2).
- Salesforce widgets for sellers (SP-06): the portal stands in for them.
- The CRO's AI risk flags beyond "no partner", and a real forecast model (Stage 2).
- HubSpot, Snowflake and Databricks connectors (Stage 2).
