import type { Cell, PermAction, RoleId, Src, Status } from "./types"

const per = (
  id: string, title: string, area: string, stage: string,
  cells: Partial<Record<RoleId, Cell>>,
  opts: { summary: string; status?: Status; sources?: Src[]; notes?: Partial<Record<RoleId, string>>; related?: string[]; tags?: string[] },
): PermAction => ({
  id, kind: "permission", title, area, stage, cells,
  summary: opts.summary,
  status: opts.status ?? "specified",
  sources: opts.sources ?? [{ doc: "Personas" }, { doc: "BRD", ref: "§5" }],
  notes: opts.notes, related: opts.related, tags: opts.tags,
})

// Cells not listed are "no". "na" = the action doesn't apply to that side.
export const permissions: PermAction[] = [
  per("register-deal", "Register a deal", "Deals", "1A", { pexec: "yes", rep: "yes" }, {
    summary: "Only partner-side people register deals. The partner manager decides exceptions but never registers.",
    tags: ["create deal", "submit registration", "deal registration"], related: ["R-REG-1", "flow-j01"],
  }),
  per("decide-registration", "Decide a registration (exception)", "Deals", "1A", { pam: "assigned", chief: "yes" }, {
    summary: "Clean deals are decided by the rules. Exceptions go to the named reviewer (the PAM for their assigned partners); the channel chief decides once the SLA hits 80%.",
    notes: { pam: "Assigned partners only", chief: "Escalated at 80% of SLA" },
    tags: ["approve registration", "reject registration", "approve deal", "reject deal"], related: ["R-REG-5", "R-SLA-3"],
  }),
  per("ask-info", "Ask a partner for more information", "Deals", "1A", { pam: "assigned", chief: "yes" }, {
    summary: "Pauses the SLA until the partner replies.", related: ["R-SLA-7", "flow-pam-info"],
  }),
  per("reply-info", "Reply to a question on a deal", "Deals", "1A", { rep: "own", pexec: "yes" }, {
    summary: "The rep's reply resumes the SLA and re-runs the checks.", status: "default", related: ["R-SLA-7"],
  }),
  per("request-extension", "Request a protection extension", "Deals", "1A", { rep: "own", pexec: "yes" }, {
    summary: "One tap before protection expires (DR-10).", related: ["R-REG-9"],
  }),
  per("grant-extension", "Grant or deny an extension", "Deals", "1A", { pam: "assigned", chief: "yes" }, {
    summary: "The PAM grants the first extension; a second needs the channel chief (recommended default).",
    status: "default", sources: [{ doc: "Personas" }, { doc: "Proto" }],
    notes: { chief: "Second extension" }, related: ["R-REG-11", "flow-pam-ext"],
  }),
  per("see-deals-all", "See every partner's deals", "Visibility", "1A", { ceo: "yes", cro: "yes", chief: "yes", revops: "yes", pam: "assigned" }, {
    summary: "Vendor leaders see all pipeline. The PAM sees their assigned partners in full, others by name only.",
    notes: { pam: "Assigned partners in full; others by name only" }, related: ["R-SEC-3"],
  }),
  per("see-registration-before-approval", "AE sees a registration before approval", "Visibility", "1A", { ae: "open" }, {
    summary: "Open question in the persona doc. Recommended default: the AE sees the partner name and status on their account, no commercial terms.",
    status: "open", related: ["G23"],
  }),
  per("see-own-company-deals", "See own company's deals and credit", "Visibility", "1A", { pexec: "yes", rep: "own", mkt: "own", tech: "own" }, {
    summary: "The partner executive sees the whole company; reps, marketers and technical leads see what they worked on.",
    notes: { rep: "Own deals only", mkt: "Own campaigns", tech: "Deals they worked" },
  }),
  per("see-other-partner-credit", "See another partner's credit", "Credit", "1B", {}, {
    summary: "No partner ever sees another partner's credit or commercial terms (MP-03, partner data walls).",
    sources: [{ doc: "BRD", ref: "MP-03" }, { doc: "Arch", ref: "§8" }], related: ["R-CR-5", "R-SEC-2"],
    tags: ["other partners credit", "competitor partner"],
  }),
  per("see-all-credit", "See every partner's credit", "Credit", "1B", { ceo: "yes", cro: "yes", chief: "yes", revops: "yes", pam: "assigned" }, {
    summary: "Vendor leaders and RevOps see all credit; the PAM sees credit for their assigned partners.",
  }),
  per("change-credit", "Change credit directly", "Credit", "1B", {}, {
    summary: "Nobody edits credit directly. Credit changes only through an approved, versioned override (MP-04); the ledger is append-only.",
    sources: [{ doc: "BRD", ref: "MP-02, MP-04" }, { doc: "Arch", ref: "§5" }], related: ["R-CR-6", "R-CR-8"],
    tags: ["edit credit", "modify split"],
  }),
  per("add-partner-to-opp", "Add partners and roles to an opportunity", "Credit", "1B", { pam: "assigned" }, {
    summary: "The PAM adds partners and roles to multi-partner opportunities; the program model recalculates the split.",
    related: ["R-CR-1", "flow-pam-credit"],
  }),
  per("propose-split", "Propose a credit split change", "Credit", "1B", { pam: "approval" }, {
    summary: "The PAM proposes with evidence; the channel chief approves.", related: ["R-APR-1", "flow-pam-credit"],
    notes: { pam: "Needs the channel chief's approval" }, tags: ["split proposal", "override"],
  }),
  per("approve-split", "Approve a credit split override", "Credit", "1B", { chief: "yes" }, {
    summary: "Only the channel chief approves overrides. The PAM can't approve their own proposal.",
    notes: { pam: "Never their own proposal" }, related: ["R-APR-1"], tags: ["approve credit", "approve split"],
  }),
  per("dispute-credit", "Dispute credit", "Credit", "Stage 2", { pexec: "yes", rep: "own" }, {
    summary: "Evidence-based dispute with an SLA and a named decision owner (MP-07, P1).",
    sources: [{ doc: "BRD", ref: "MP-07" }], related: ["R-CR-11"],
  }),
  per("resolve-mismatch", "Resolve a revenue mismatch", "Credit", "1B", { revops: "yes" }, {
    summary: "Adjustments are new ledger entries, never edits to history.", related: ["R-CR-9"],
  }),
  per("approve-model", "Approve an attribution model version", "Credit", "1B", { ceo: "yes", chief: "approval" }, {
    summary: "The channel chief proposes; the CFO approves before it's published (proposed rule).",
    status: "proposed", notes: { ceo: "CFO approves", chief: "Proposes" }, related: ["R-APR-3"],
  }),
  per("accept-application", "Accept or decline a partner application", "Partners", "1A", { pam: "yes", chief: "yes" }, {
    summary: "The PAM decides; applications they escalate go to the channel chief.", notes: { chief: "Escalated applications" },
    related: ["flow-pam-onboard", "R-ONB-1"], tags: ["onboard partner", "new partner"],
  }),
  per("apply-program", "Apply to a program", "Partners", "1A", { pexec: "yes" }, {
    summary: "The partner company's owner applies; the PAM can't invite a company directly (recruitment features come in Stage 2).",
    related: ["R-ONB-1"],
  }),
  per("manage-partner-users", "Manage the partner company's users", "Partners", "P1", { pexec: "own", it: "yes" }, {
    summary: "Delegated admin for the partner executive is P1. IT manages vendor users and roles.",
    notes: { pexec: "Own company (P1)" },
  }),
  per("configure-programs", "Configure programs, tiers, SLAs and rules", "Programs", "1A", { revops: "approval", chief: "yes" }, {
    summary: "RevOps writes; the channel chief approves. Rules are versioned, never edited in place.",
    notes: { chief: "Approves" }, related: ["R-APR-2"],
  }),
  per("approve-money", "Approve money (MDF, rewards, spiffs)", "Money", "Stage 2", { chief: "yes", ceo: "yes" }, {
    summary: "Money always needs a human approval and is never automated.", notes: { ceo: "Large rewards" },
    related: ["R-APR-4", "R-AG-2"], tags: ["mdf approval", "rewards", "payout"],
  }),
  per("request-mdf", "Request MDF", "Money", "Stage 2", { pexec: "yes", mkt: "yes" }, {
    summary: "Partners request funds; the claim is tied to the pipeline the campaign produced.",
  }),
  per("send-lead", "Send a vendor lead to a partner", "Leads", "Stage 2", { pam: "assigned" }, {
    summary: "Vendor-to-partner lead sharing (DR-12, P1). The PAM picks the partner, helped by an AI suggestion (prototype).",
    status: "default", sources: [{ doc: "BRD", ref: "DR-12" }, { doc: "Proto" }], related: ["R-LD-2", "R-LD-3", "flow-pam-lead"],
  }),
  per("accept-lead", "Accept a lead", "Leads", "Stage 2", { pexec: "yes", rep: "yes" }, {
    summary: "The lead goes to the partner company; the admin assigns a rep or it goes to a named rep (recommended default).",
    status: "default", related: ["R-LD-4", "G26"],
  }),
  per("send-cosell", "Send a co-sell request", "Co-sell", "Stage 2", { ae: "yes", pam: "yes" }, {
    summary: "The seller always sends; the AI drafts but never sends on its own.", related: ["R-CS-3"],
  }),
  per("accept-cosell", "Accept a co-sell request", "Co-sell", "Stage 2", { pexec: "yes", rep: "yes" }, {
    summary: "The partner sees no account detail until they accept.", related: ["R-CS-4"],
  }),
  per("export", "Export revenue views", "Data", "1B", { ceo: "yes", cro: "yes", chief: "yes", revops: "yes", pam: "assigned", pexec: "own" }, {
    summary: "Recommended default: people can export the views they're allowed to see; bulk or raw data export needs approval; agents never export.",
    status: "default", sources: [{ doc: "BRD", ref: "RT-04, §10" }], related: ["G16", "R-APR-5"],
  }),
  per("manage-integrations", "Manage integrations and field mappings", "Admin", "0", { it: "yes" }, {
    summary: "IT installs the Salesforce package, scopes the integration user and approves AI-suggested mappings.",
  }),
  per("manage-users", "Manage vendor users and roles", "Admin", "0", { it: "yes" }, {
    summary: "Users come from the company identity provider through SCIM.",
  }),
  per("audit", "Read or export the audit log", "Admin", "0", { it: "yes", aisup: "own" }, {
    summary: "IT reads and exports the full audit log; the AI supervisor reads the agent audit.", notes: { aisup: "Agent audit" },
  }),
  per("assign-partners", "Assign partners to partner managers", "Partners", "1A", { chief: "yes" }, {
    summary: "Move a partner to another partner manager or assign one nobody looks after. Added beyond the documents as standard practice; RevOps updates the records.",
    status: "default", sources: [{ doc: "Proto" }], notes: { chief: "Added: standard practice" }, related: ["G32", "R-ONB-3"], tags: ["reassign", "move partner", "territory"],
  }),
  per("set-autonomy", "Set agent autonomy", "AI", "0", { aisup: "yes", chief: "approval" }, {
    summary: "Within limits; raising autonomy needs the channel chief, and high-risk actions can never be raised.",
    notes: { chief: "Approves changes" }, related: ["R-AG-1", "R-AG-2"],
  }),
  per("pause-agent", "Pause an agent (kill switch)", "AI", "0", { aisup: "yes" }, {
    summary: "Per agent, action type or the whole agent layer; takes effect within seconds.", related: ["R-AG-3"],
  }),
  per("publish-content", "Publish partner marketing content", "Marketing", "Stage 2", { mkt: "own" }, {
    summary: "Only vendor-approved claims, with the partner relationship disclosed.", notes: { mkt: "Approved content only" },
  }),
  per("log-delivery", "Log delivery or certification", "Growth", "Stage 2", { tech: "yes" }, {
    summary: "Recorded as a touch that can earn influence credit.",
  }),
]

export const cellLabel: Record<Cell, string> = {
  yes: "Yes", no: "No", own: "Own only", assigned: "Assigned partners", approval: "Needs approval", open: "Open question", na: "Not applicable",
}
