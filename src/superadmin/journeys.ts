import type { JourneysConfig } from "@/screens/Journeys"

/** The super admin's journeys. The BRD has no platform layer (hub G52), so every flow here is our proposal. */
export const superJourneys: JourneysConfig = {
  title: "Super admin: five journeys",
  sub: "How the PRM platform team runs the platform above every customer. Each row is one flow, left to right; select a step to open that screen. Highlighted steps are the main action. The BRD doesn't describe this layer, so all of it is our proposal (hub G52 and G53).",
  journeys: [
    {
      n: 1, title: "Bring on a new customer", tag: "Organizations, plans and features", stage: "Platform",
      steps: [
        { title: "Creates the organization", detail: "Name, domain, plan, data region and the first admin, who must be on the customer's domain. Optional 14-day trial.", href: "/s/orgs", ids: "G52", main: true },
        { title: "Plan switches features on", detail: "Each feature the plan includes is on for the new tenant; others can be switched on as an exception.", href: "/s/flags", ids: "Plans" },
        { title: "First admin connects SSO and CRM", detail: "The customer's IT admin sets up Okta or Entra and Salesforce in their own portal. Onboarding shows on the organization page.", href: "/s/org/corvane", ids: "R-SEC-5 · R-SEC-8" },
        { title: "Watches health and usage", detail: "Sync lag, sign-ins and agent actions per customer. A trial ending shows in Needs attention.", href: "/s/health", ids: "Health" },
      ],
    },
    {
      n: 2, title: "Handle a security event", tag: "Security, support access and audit", stage: "Platform",
      steps: [
        { title: "Alert raised", detail: "Impossible travel for a Halden admin, flagged high in the bell and on the Overview.", href: "/s/security", ids: "Security events" },
        { title: "Asks the customer for support access", detail: "Read-only, 2 hours, with a ticket. Nothing opens until the customer's IT admin approves.", href: "/s/org/halden", ids: "G53", main: true },
        { title: "Customer's IT admin decides", detail: "Kai (or Mira at Halden) approves or declines on their Users page. Access closes by itself.", href: "/s/security", ids: "G53 · R-SEC-4" },
        { title: "Resolves and leaves a record", detail: "The event is resolved; every step is in the platform audit log and the customer's own.", href: "/s/audit", ids: "R-SEC-6" },
      ],
    },
    {
      n: 3, title: "Ship a release safely", tag: "Features, releases and announcements", stage: "Platform",
      steps: [
        { title: "Rolls out to 25% first", detail: "Brightline is in the first wave; the rest follow in steps of 25% once error rates hold.", href: "/s/flags", ids: "Releases", main: true },
        { title: "Tells customers", detail: "An announcement banner in every portal of the chosen customers, staff and partners alike.", href: "/s/announce", ids: "Announcements" },
        { title: "Maintenance window if needed", detail: "Maintenance mode makes every tenant read-only, with a banner, until it's ended.", href: "/s/health", ids: "Maintenance" },
        { title: "Switches a feature off if it misbehaves", detail: "Per customer or for everyone, without a new release. Customers keep their data.", href: "/s/flags", ids: "Feature flags" },
      ],
    },
    {
      n: 4, title: "Keep AI safe and affordable", tag: "AI providers, spend and the kill switch", stage: "Platform",
      steps: [
        { title: "Approves an AI provider", detail: "A provider is a data processor: security review first, then each customer's AI supervisor can pick it.", href: "/s/ai", ids: "G51", main: true },
        { title: "Sets each customer's AI cap", detail: "Agents pause for that customer if the monthly cap is reached.", href: "/s/org/brightline", ids: "G49" },
        { title: "Pauses every agent in an emergency", detail: "The kill switch stops every agent for every tenant within seconds. People do the work by hand.", href: "/s/ai", ids: "R-AG-3" },
      ],
    },
    {
      n: 5, title: "Billing and customer data", tag: "Invoices, suspension and data requests", stage: "Platform",
      steps: [
        { title: "Chases an overdue invoice", detail: "Remind the customer's admin, or mark it paid when the money arrives.", href: "/s/billing", ids: "Billing" },
        { title: "Suspends a customer, with a reason", detail: "Nobody can sign in and agents and syncs stop. Data is kept 90 days; reactivating restores everything.", href: "/s/org/ostrava", ids: "Retention", main: true },
        { title: "Completes an export or erasure request", detail: "Within 30 days. Erasure covers search too; backups age out in 35 days.", href: "/s/data", ids: "Data requests" },
      ],
    },
  ],
  handoffs: [
    ["To every customer", "Announcements, maintenance mode and the AI kill switch"],
    ["To the customer's IT admin", "Support access requests to approve or decline"],
    ["To the customer's AI supervisor", "Approved AI providers and agent versions to choose from"],
    ["From the customer's IT admin", "Approval or refusal of support access, logged on both sides"],
    ["From the product team", "New releases, agents and features to roll out"],
  ],
  canTitle: "What the super admin can and can't do",
  can: ["Create, suspend and reactivate customers", "Change plans, AI caps and features per customer", "Roll out releases and announce them", "Approve or block AI providers; pause every agent", "Lock accounts and reset MFA for any user", "Set platform policies and invite the platform team"],
  cannot: ["See a customer's data without that customer's approval", "Change a customer's deals, credit or partner decisions", "Switch off MFA for staff or the support-approval rule", "Let an agent move money, change access or export data (R-AG-2)", "Edit or delete the audit log"],
  note: "Pricing, the platform roles and break-glass access need Product, Finance and Security to confirm (G52, G53).",
}
