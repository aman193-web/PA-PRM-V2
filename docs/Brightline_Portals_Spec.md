# Brightline portals: RevOps, field seller and CEO / CFO

Prototype `prm-partner-manager`, branch `feature/revops-seller-cfo-portals`, routes under `#/v/`. Dated 12 Nov 2026.

Sources: the BRD personas and permission matrix (from the PRM Knowledge Hub), the 28 Oct planning deck (J-02, J-03), and the hand-offs already built into the partner manager and channel chief portals. Names are illustrative.

The three roles share one app, the way the four partner roles do. What renders depends on who signs in.

## 1. What each role is for

| | RevOps · Ana Costa | Field seller · Sam Rivera | CEO / CFO · Morgan Hale |
|---|---|---|---|
| Main job | Keep data clean and workflows running | Find the right partner for a deal | Know if the channel is worth the investment |
| Main number | Open exceptions | Partner-involved deals on my accounts | Verified partner revenue and return |
| Main action | Resolve an exception | Send a co-sell request | Share the board view |
| Device | Laptop | Phone, on site | Phone, weekly |
| Stage | 1A, reconciliation 1B | 1A, co-sell 2 | 1B |
| Receives from | Sync and reconciliation agents, partner managers ("Tell RevOps") | Partner registrations on their accounts | The channel chief (model versions, large rewards) |
| Hands off to | Channel chief (rules, programs), partner managers | Partners (co-sell), partner manager (context) | The board |

## 2. RevOps (Ana Costa)

**Can:** clear the exceptions queue; settle revenue mismatches with ledger entries; create programs from templates; propose rules, deadlines and limits; see all pipeline and revenue.
**Can't:** approve their own rule changes (R-APR-2); change credit or shares without approval (R-CR-2); merge Salesforce records (the CRM admin does).

| Screen | What it does |
|---|---|
| Home | Share of closed-won partner deals matched to Salesforce, open exceptions, sync lag, changes waiting for Dana |
| Exceptions | Four kinds: failed Salesforce write, uncertain match, revenue mismatch, stale deal. Each shows PRM against Salesforce, the agent's advice and the options. Jordan's "Tell RevOps" shows on the matching item. |
| Reconciliation | Every closed-won partner deal with its status, plus the append-only revenue ledger |
| Programs and rules | Each program's rules by version. Propose a change (program, rule, new value, why) or launch the Marketplace program from its template |

**Seeded exceptions:** Cedar Valley Schools ($45,000 credited, $42,000 in Salesforce), the Orion Labs write that timed out, two Acme records that look like one company, and Orchid Foods gone quiet.

## 3. Field seller (Sam Rivera)

**Can:** see partner activity and registrations on their own accounts; see partner roles and touches; add context to a registration for the partner manager; send co-sell requests; edit joint plans.
**Can't:** decide registrations; see partners' commercial terms, credit shares, or other sellers' accounts. Deal values on a partner's registration show only after approval (G23).

| Screen | What it does |
|---|---|
| Home | Partner-involved deals, what needs Sam (registrations in review, plan steps due, deals with no partner) |
| My accounts | Five accounts with stage, value, partners and status |
| Account | The Salesforce opportunity, partner registrations (with a box to tell Jordan what Sam knows), partners and touches, co-sell and the joint plan |
| Find a partner | Partners ranked with reasons (R-CS-2). The agent drafts; Sam edits and sends (R-CS-3). A preview shows what the partner sees before accepting (R-CS-4). |
| Co-sell | Requests sent and their status, deals that still need a partner |

**Co-sell flow:** Sam picks Solstice Hotels → Ridgeway ranks first (Lakeshore Hotels win, hospitality campaign) → Sam sends to Marcus → Marcus or Paul accepts on Ridgeway's **Leads → Co-sell** tab → the account unlocks, Ridgeway joins the opportunity as Reseller, and both sides share a joint plan (R-CS-5). Ironbridge Utilities ranks Northpeak first; its Grid analytics reason changes when Raj passes the exam. Partners without a portal in the demo accept automatically after a moment.

## 4. CEO / CFO (Morgan Hale)

**Can:** see all revenue and pipeline; export and share the board view; approve a new attribution model version; approve rewards over $20,000.
**Can't:** register deals, change credit splits, configure programs.

| Screen | What it does |
|---|---|
| Home | Verified revenue against target, share of Brightline's revenue, return on the program, approvals, quarters, top partners |
| Partner revenue | Verified by default. Partner-reported and AI-inferred credit are off until switched on (R-CR-10). Sourced and influenced, by program, top partners, the model in force. |
| Board view | One slide, verified figures only. Copy a read-only link or download the figures. |
| Approvals | Attribution model version 3 (weights before and after, and what would have moved this year) and Northpeak's $21,600 rebate |

**Model version 3:** Implementation 20 → 30, Technology 20 → 15, Influenced 10 → 5, from 1 Jan 2027. Past periods keep version 2 (R-APR-3). Approved overrides are left alone.

## 5. What syncs across portals

| Action | Shows up in |
|---|---|
| Ana settles Cedar Valley with a ledger entry | Jordan's Salesforce page (issue gone), the opportunity (matched), the reconciliation ledger |
| Ana retries the Orion Labs write | Jordan's Salesforce page: healthy, 0 retrying |
| Ana asks Jordan about Orchid Foods | Jordan's notifications |
| Ana proposes a rule change or the Marketplace program | Dana's Approvals; approving makes a new rules version or puts the program live, and Ana is told |
| Sam adds context on Acme Manufacturing | Jordan's registration page and notifications |
| Sam sends Ridgeway a co-sell request | Marcus's and Paul's Leads (Co-sell tab), Home and notifications |
| Ridgeway or Northpeak accepts | Sam's account and joint plan, the Salesforce opportunity, Jordan's notifications; Raj is told for Northpeak |
| Morgan approves or declines | Dana's Recent feed |

## 6. Added beyond the documents

- Sellers can add context to a partner's registration on their account (G43).
- Who inside a partner accepts a co-sell request: the named person, or the executive on their behalf (G44).
- Rewards over $20,000 need the CFO (R-APR-8, G42). The line is an assumption.
- Corrections are ledger entries; the original stays (R-CR-14).

## 7. Not designed yet

- Live transfers from the lead agent to a seller (Stage 2).
- Salesforce widgets for sellers (SP-06): the portal stands in for them.
- The IT / CRM admin and AI supervisor portals.
