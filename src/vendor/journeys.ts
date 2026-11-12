import type { JourneysConfig } from "@/screens/Journeys"

// Journeys for the three Brightline roles, from the persona pages and flows in the PRM Knowledge Hub.

export const opsJourneys: JourneysConfig = {
  title: "RevOps: three journeys",
  journeys: [
    {
      n: 1, title: "Clear what the agents couldn't settle", tag: "Data health · exceptions queue", stage: "Stage 1A",
      steps: [
        { title: "Sees the open exceptions", detail: "Failed Salesforce writes, uncertain matches, revenue mismatches and stale deals, flagged by the sync and reconciliation agents.", href: "/v/exceptions", ids: "Persona" },
        { title: "Reads the evidence side by side", detail: "PRM against Salesforce, with the agent's advice and confidence.", href: "/v/exception/EX-43", ids: "Agent advice" },
        { title: "Fixes it, or hands it on", detail: "Retry a write, link two records, or ask the partner manager to check with the partner. Logged with Ana's name.", href: "/v/exception/EX-41", ids: "Persona", main: true },
        { title: "The partner manager sees it fixed", detail: "Jordan's Salesforce page loses the warning, and the deal shows as written.", href: "/v/exceptions/resolved", ids: "D5" },
      ],
    },
    {
      n: 2, title: "Make partner revenue add up", tag: "J-02 Revenue proof · reconciliation", stage: "Stage 1B",
      steps: [
        { title: "Checks closed-won against credit", detail: "Every closed-won partner deal, matched or held, with the amount on each side.", href: "/v/revenue", ids: "R-CR-9", main: true },
        { title: "Settles a mismatch with a ledger entry", detail: "Cedar Valley Schools: Salesforce says $42,000, credit used $45,000. A −$3,000 entry releases the credit.", href: "/v/exception/EX-42", ids: "R-CR-9 · D5" },
        { title: "Leaves the shares to the channel chief", detail: "Amounts and dates can be corrected; who gets credit, and how much, needs Dana Ortiz.", href: "/v/revenue", ids: "R-CR-2" },
      ],
    },
    {
      n: 3, title: "Set programs up and change their rules", tag: "Program set-up · rule changes", stage: "Stage 1A",
      steps: [
        { title: "Sees each program's rules", detail: "Auto-approve limit, review deadline, protection window and lead acceptance, by version.", href: "/v/programs", ids: "R-REG-6 · R-SLA-1" },
        { title: "Proposes a change with the data", detail: "New value and why. RevOps can't approve its own changes.", href: "/v/programs", ids: "R-APR-2", main: true },
        { title: "Launches a program from a template", detail: "The Marketplace program goes live when Dana approves its rules.", href: "/v/programs", ids: "Persona" },
        { title: "Dana approves; a new version starts", detail: "Partner managers are told. Nothing is edited in place.", href: "/v/programs", ids: "R-APR-2" },
      ],
    },
  ],
  handoffs: [
    ["From the sync and reconciliation agents", "Exceptions they couldn't settle"],
    ["From partner managers", "Salesforce problems flagged with Tell RevOps"],
    ["From the CRM admin", "Connected systems and field mappings"],
    ["To the channel chief", "Rule changes and new programs to approve"],
    ["To partner managers", "Deals to check with a partner"],
    ["To the CFO", "Reconciled revenue for the board view"],
  ],
  canTitle: "What RevOps can and can't do",
  can: ["Clear the exceptions queue", "Resolve revenue mismatches with ledger entries", "Create programs from templates", "Propose rules, tiers and deadlines", "See all pipeline and revenue"],
  cannot: ["Approve their own rule changes", "Change partner credit without approval", "Merge records inside Salesforce"],
}

export const aeJourneys: JourneysConfig = {
  title: "Field seller: three journeys",
  journeys: [
    {
      n: 1, title: "Bring the right partner onto a deal", tag: "J-03 Co-sell", stage: "Stage 2",
      steps: [
        { title: "Picks an account that needs a partner", detail: "Solstice Hotels needs a reseller who knows hotels.", href: "/v/find", ids: "CS · c1" },
        { title: "Sees partners ranked with reasons", detail: "Product fit, certifications, past wins, relationship and capacity.", href: "/v/find/solstice", ids: "R-CS-2", main: true },
        { title: "Checks the draft and sends", detail: "The agent drafts; the seller always sends. Three taps.", href: "/v/find/solstice", ids: "R-CS-3" },
        { title: "The partner accepts", detail: "Ridgeway sees no account detail until it accepts, then gets the joint plan.", href: "/v/cosell", ids: "R-CS-4" },
      ],
    },
    {
      n: 2, title: "Know what partners are doing on my accounts", tag: "Partner activity · conflicts", stage: "Stage 1A",
      steps: [
        { title: "Sees a registration on an account", detail: "Ridgeway registered Acme Manufacturing, which overlaps Sam's opportunity.", href: "/v/account/acme", ids: "Persona", main: true },
        { title: "Tells the partner manager what they know", detail: "Context goes on the registration next to the conflict check. The partner manager decides.", href: "/v/account/acme", ids: "Not in the documents", extra: true },
        { title: "Sees the partners on each deal", detail: "Roles and touches, without credit shares or commercial terms.", href: "/v/account/brookside", ids: "Persona" },
      ],
    },
    {
      n: 3, title: "Work the deal together", tag: "Joint account plans", stage: "Stage 2",
      steps: [
        { title: "Opens the joint plan", detail: "Owners and dates on both sides. Brookside Bank with Atlas.", href: "/v/account/brookside", ids: "Persona", main: true },
        { title: "Ticks off steps and adds new ones", detail: "Both sides see the same plan.", href: "/v/account/brookside", ids: "Persona" },
        { title: "Partner work becomes evidence", detail: "Accepting a co-sell adds the partner to the opportunity, and their touches count for attribution.", href: "/v/accounts", ids: "J-03 · c8" },
      ],
    },
  ],
  handoffs: [
    ["To partners", "Co-sell requests, sent by the seller"],
    ["To the partner manager", "Context on registrations on the seller's accounts", true],
    ["From the lead agent", "Live transfers (Stage 2, not designed yet)"],
    ["From Salesforce", "The seller's accounts and opportunities"],
  ],
  canTitle: "What a field seller can and can't do",
  can: ["See partner activity on their own accounts", "See partner roles and touches on their deals", "Send co-sell requests", "Edit joint account plans"],
  cannot: ["Decide registrations", "See partners' commercial terms", "See credit on other sellers' accounts"],
  note: "From Stage 2 this sits inside Salesforce as widgets (SP-06), so sellers don't need another tool.",
}

export const ceoJourneys: JourneysConfig = {
  title: "CEO and CFO: three journeys",
  journeys: [
    {
      n: 1, title: "Know whether the channel is worth it", tag: "J-02 Revenue proof", stage: "Stage 1B",
      steps: [
        { title: "Opens the weekly view", detail: "Verified partner revenue, against the target and the program's cost.", href: "/v/home", ids: "R-CR-10", main: true },
        { title: "Switches unverified credit on, if wanted", detail: "Partner-reported and AI-inferred credit are off by default.", href: "/v/revenue", ids: "Persona" },
        { title: "Checks past periods", detail: "Each quarter keeps the attribution model in force at the time.", href: "/v/revenue", ids: "Persona" },
      ],
    },
    {
      n: 2, title: "Share the board view", tag: "Board reporting", stage: "Stage 1B",
      steps: [
        { title: "Opens the board slide", detail: "Verified figures only: revenue, return, top partners, by quarter.", href: "/v/board", ids: "Persona", main: true },
        { title: "Copies a read-only link", detail: "Directors sign in with Brightline SSO.", href: "/v/board", ids: "Export · 1B" },
        { title: "Or downloads the figures", detail: "Revenue by partner, partner manager and program.", href: "/v/board", ids: "Export · 1B" },
      ],
    },
    {
      n: 3, title: "Approve what only the CFO can", tag: "Attribution model · large rewards", stage: "Stages 1B and 2",
      steps: [
        { title: "Reviews a new model version", detail: "Weights before and after, and what would have moved this year.", href: "/v/approval/AM-3", ids: "R-APR-3", main: true },
        { title: "Approves it from a period boundary", detail: "Version 3 starts on Jan 1, 2027. 2026 keeps version 2.", href: "/v/approval/AM-3", ids: "Persona" },
        { title: "Approves a large reward", detail: `Northpeak's $21,600 rebate. Over $20,000 needs the CFO.`, href: "/v/approval/RW-14", ids: "R-APR-4 · proposed" },
      ],
    },
  ],
  handoffs: [
    ["From the channel chief", "Model versions and large rewards to approve"],
    ["From RevOps", "Reconciled, verified revenue"],
    ["To the board", "The verified board view"],
  ],
  canTitle: "What the CEO and CFO can and can't do",
  can: ["See all revenue and pipeline", "Export and share the board view", "Approve a new attribution model version (CFO)", "Approve large rewards (CFO)"],
  cannot: ["Register deals", "Change credit splits directly", "Configure programs"],
}
