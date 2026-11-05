import type { JourneysConfig } from "@/screens/Journeys"

// Journeys from the persona document and the hub's flows (J-01, J-02, J-04 and the partner side of the PAM flows).

export const repJourneys: JourneysConfig = {
  title: "Partner sales rep: three journeys",
  journeys: [
    {
      n: 1, title: "Register a deal", tag: "J-01 Deal registration", stage: "Stage 1A",
      steps: [
        { title: "Describes the deal or pastes the email", detail: "In the customer's lobby, on a phone. Voice and photo of a business card arrive in Stage 2.", href: "/p/register", ids: "R-REG-1" },
        { title: "Checks what AI filled in", detail: "Customer, contact, product, value and close date. Unsure fields are highlighted; one tap confirms each.", href: "/p/register", ids: "R-REG-2" },
        { title: "Submits: three taps in all", detail: "Checks run live: eligibility, product, territory, conflicts, deal size.", href: "/p/register", ids: "R-REG-3 · R-REG-4", main: true },
        { title: "Decided in 60 seconds, or told who and when", detail: "Clean deals are approved by rules. Others go to Jordan, with the reason and the deadline shown at once.", href: "/p/deal/REG-2039", ids: "R-REG-5 · R-REG-13" },
        { title: "Protected for 90 days", detail: "The real stage from Brightline's CRM, days of protection left and the timeline of what happened.", href: "/p/deals/protected", ids: "R-REG-9 · R-REG-10" },
      ],
    },
    {
      n: 2, title: "Keep deals moving", tag: "Partner side of the info-request and extension flows", stage: "Stage 1A",
      steps: [
        { title: "Gets Jordan's question", detail: "A notification and a \"Reply needed\" card on Home. The review is paused while it waits.", href: "/p/home", ids: "R-SLA-7" },
        { title: "Answers; the clock resumes", detail: "The checks re-run and the deal goes back to Jordan. The clock picks up where it paused; it doesn't reset.", href: "/p/deal/REG-2027", ids: "R-SLA-7", main: true },
        { title: "Asks for more time in one tap", detail: "From 21 days before protection ends: +30, +60 or +90 days with a reason. Jordan decides the first one.", href: "/p/deal/REG-1790", ids: "R-REG-11" },
      ],
    },
    {
      n: 3, title: "Work leads and see the credit", tag: "Lead sharing · J-02 Revenue proof", stage: "Stages 1A and 2",
      steps: [
        { title: "Accepts a lead sent by name", detail: "Company, region and rough value only. The contact unlocks on accepting. 48 hours to decide.", href: "/p/leads", ids: "DR-12 · R-LD-4 · Stage 2" },
        { title: "Turns it into a deal", detail: "Logs updates for Jordan, then registers it with the customer and contact already filled in.", href: "/p/leads/working", ids: "R-LD-1" },
        { title: "Sees his own credit and why", detail: "His share on every deal, verified when won. Other partners on a deal stay private. Disputes in Stage 2.", href: "/p/credit", ids: "R-CR-5 · R-CR-10", main: true },
      ],
    },
  ],
  handoffs: [
    ["To Jordan (partner manager)", "Registrations, answers to questions, extension requests, lead updates"],
    ["From Jordan", "Every decision with a reason, questions on deals, leads sent by name"],
    ["To and from Paul (Ridgeway's admin)", "Paul sees all of Marcus's deals and can give him Brightline leads"],
    ["From the agents", "Prefilled fields (Deal Desk agent), credit splits (Attribution agent)"],
  ],
  canTitle: "What a partner sales rep can and can't do",
  can: ["Register deals and answer questions on his own deals", "Ask for more protection time on his own deals", "See his own deals and credit", "Accept leads sent to him by name"],
  cannot: ["See colleagues' deals or credit", "See another partner's deals, credit or commercials", "Change credit splits"],
  note: "Co-sell requests (J-03) arrive in Stage 2 and aren't designed here.",
}

export const execJourneys: JourneysConfig = {
  title: "Partner executive: three journeys",
  journeys: [
    {
      n: 1, title: "Know what the program is worth", tag: "J-02 Revenue proof", stage: "Stage 1B",
      steps: [
        { title: "Opens Home once a week", detail: "Verified revenue with Brightline this year, open pipeline and progress to the next tier, on a phone.", href: "/p/home", ids: "ME-01" },
        { title: "Sees Ridgeway's credit, reconciled", detail: "Every won deal matched to Salesforce closed-won. Verified only by default; open deals on a toggle.", href: "/p/credit", ids: "R-CR-9 · R-CR-10", main: true },
        { title: "Exports it for leadership", detail: "A CSV of Ridgeway's credit, with won revenue by rep alongside.", href: "/p/credit", ids: "Export · 1B" },
      ],
    },
    {
      n: 2, title: "Hand Brightline's leads to the right rep", tag: "Lead sharing", stage: "Stage 2",
      steps: [
        { title: "A lead arrives with 48 hours to accept", detail: "Industry, region, product and value only, plus why Brightline picked Ridgeway.", href: "/p/leads", ids: "DR-12 · R-LD-2" },
        { title: "Accepts and assigns a rep, or declines", detail: "Picks who owns it. A decline goes back to Jordan straight away with the reason.", href: "/p/leads", ids: "R-LD-4", main: true },
        { title: "Sees which rep fits best, and why", detail: "AI suggests a rep from past wins in the industry, the product, the region and workload. Paul can pick anyone.", href: "/p/leads", ids: "Not in the documents", extra: true },
        { title: "The rep works it and registers it", detail: "Updates are shared with Jordan; the deal shows up with every other Ridgeway deal.", href: "/p/leads/working", ids: "R-LD-1" },
      ],
    },
    {
      n: 3, title: "Grow the partnership", tag: "J-04 Partner growth · onboarding", stage: "Stages 1B and 2",
      steps: [
        { title: "Checks what unlocks the next tier", detail: "Gold → Platinum: verified revenue, certified reps, customer satisfaction, and what Platinum unlocks.", href: "/p/program", ids: "ME-02 · ME-03 · R-GR-1", main: true },
        { title: "Keeps agreements current", detail: "An expiring insurance certificate becomes a task; upload it to stay eligible to register deals.", href: "/p/program", ids: "R-ONB-1" },
        { title: "Builds the team", detail: "Invites people, decides who can register deals, deactivates leavers. Their deals stay with Ridgeway.", href: "/p/team", ids: "P1 · delegated admin" },
      ],
    },
  ],
  handoffs: [
    ["To Jordan (partner manager)", "Lead decisions, answers on any Ridgeway deal, extension requests, renewed documents"],
    ["From Jordan", "Leads for Ridgeway, decisions on every Ridgeway deal"],
    ["To Ridgeway's reps", "Leads he assigns, invitations and access"],
    ["From Brightline", "Tier progress, benefits and program terms"],
  ],
  canTitle: "What a partner executive can and can't do",
  can: ["See every Ridgeway deal and Ridgeway's credit", "Accept leads and assign them to a rep", "Manage Ridgeway's users, agreements and program", "Export Ridgeway's revenue"],
  cannot: ["See another partner's deals, credit or commercials", "Change credit splits", "Decide registrations"],
  note: "MDF requests and credit disputes are Stage 2 previews.",
}
