import type { JourneysConfig } from "@/screens/Journeys"

// Journeys from the persona document: the escalation side of J-01, credit overrides from J-02, and program ownership.

export const chiefJourneys: JourneysConfig = {
  title: "Channel chief: three journeys",
  journeys: [
    {
      n: 1, title: "Step in when a deal is taking too long", tag: "J-01 Deal registration · escalation", stage: "Stage 1A",
      steps: [
        { title: "Alerted at 80% of the deadline", detail: "Automatic: Jordan hasn't decided in time. Arrives in Approvals, the bell, Slack or email.", href: "/c/home", ids: "R-SLA-3" },
        { title: "Reads why and the AI advice", detail: "Deadline used, why it was held back, the automatic checks and the Deal Desk agent's recommendation.", href: "/c/approval/reg-REG-2038", ids: "DR-06 · DR-07" },
        { title: "Decides it, or nudges Jordan", detail: "Approve, reject with a reason code, or leave it with Jordan and ask him to decide today.", href: "/c/approval/reg-REG-2038", ids: "DR-08", main: true },
        { title: "Everyone is told", detail: "The partner and Jordan see \"By Dana Ortiz\" with the reason. At 100% a deal is reassigned, never auto-approved.", href: "/c/approvals/done", ids: "DR-09 · R-SLA-4" },
      ],
    },
    {
      n: 2, title: "Approve what's above the partner manager", tag: "J-02 Revenue proof · extensions · onboarding", stage: "Stages 1A and 1B",
      steps: [
        { title: "Credit split change from Jordan", detail: "Before and after shares, the dollars that move, Jordan's reason and each partner's work on the deal.", href: "/c/approval/split-006Q8000020BrkS", ids: "MP-02 · MP-04", main: true },
        { title: "Second extension from a partner", detail: "Jordan decides the first one. The second needs Dana: the partner's reason, CRM activity, AI advice.", href: "/c/approval/ext-EXT-309", ids: "DR-10 · R-REG-11" },
        { title: "Application Jordan escalated", detail: "Unusual tier or territory requests. Accept at a starting tier, or decline with a reason.", href: "/c/approval/app-APP-113", ids: "R-ONB-2" },
      ],
    },
    {
      n: 3, title: "Defend the budget and set the rules", tag: "J-02 Revenue proof · program and AI governance", stage: "Stages 0 and 1B",
      steps: [
        { title: "Sees revenue by partner", detail: "Verified revenue across every partner manager, against the target and the program's cost.", href: "/c/partners", ids: "R-CR-9 · R-CR-10", main: true },
        { title: "Exports the board view", detail: "Verified figures only, by partner, partner manager and trend.", href: "/c/partners", ids: "Export · 1B" },
        { title: "Approves rule changes per program", detail: "RevOps asks for a change to one program's rules; approving makes a new rules version for that program. AI autonomy covers every program.", href: "/c/approval/req-CR-21", ids: "R-APR-2 · R-AG-1" },
        { title: "Checks the partner managers", detail: "Queue, on-time rate and deals near deadline for each, with a nudge.", href: "/c/team", ids: "R-SLA" },
        { title: "Decides who looks after which partner", detail: "Moves a partner to another partner manager, or assigns one nobody looks after. Open deals and leads move with it.", href: "/c/team", ids: "Not in the documents", extra: true },
      ],
    },
  ],
  handoffs: [
    ["From partner managers", "Credit split proposals and escalated applications"],
    ["From the SLA agent", "Deals past 80% of their review deadline"],
    ["From partners", "Second extension requests"],
    ["From RevOps and the AI supervisor", "Program rule changes and agent autonomy changes"],
    ["To the CEO and CFO", "The verified board view of revenue by partner"],
    ["To partner managers", "Which partners each one looks after", true],
  ],
  canTitle: "What a channel chief can and can't do",
  can: ["See every partner's deals and credit", "Decide escalated deals, second extensions and escalated applications", "Approve credit split overrides, program rules and AI autonomy", "Move partners between partner managers (added, standard practice)"],
  cannot: ["Register deals", "Publish a new attribution model without CFO approval", "Let AI agents move money"],
}
