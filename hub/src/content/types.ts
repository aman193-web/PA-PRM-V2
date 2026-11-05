// The hub's content model. Every item carries a status and its sources, so a
// recommended default can never be mistaken for a confirmed decision.

export type Status = "confirmed" | "specified" | "proposed" | "default" | "open" | "assumption" | "conflict"

export type DocId =
  | "BRD" | "Deck" | "Personas" | "JPRD" | "Swim" | "Arch"
  | "PA-PRD" | "Brief" | "Proto" | "Impartner" | "TechDesign"

export interface Src {
  doc: DocId
  ref?: string
}

export type Kind =
  | "persona" | "permission" | "rule" | "agent" | "flow" | "entity" | "integration"
  | "gap" | "faq" | "term" | "requirement" | "value" | "competitor" | "stage" | "source"

export interface Item {
  id: string
  kind: Kind
  title: string
  summary: string
  status: Status
  sources: Src[]
  related?: string[]
  tags?: string[]
  /** Extra plain-language bullets shown in the detail panel. */
  points?: string[]
  stage?: string
}

export type RoleId = "ceo" | "cro" | "chief" | "pam" | "ae" | "revops" | "it" | "aisup" | "pexec" | "rep" | "mkt" | "tech"

export interface Persona extends Item {
  kind: "persona"
  side: "vendor" | "partner"
  short: string
  sampleName: string
  org?: string
  device: string
  mainJob: string
  mainNumber: string
  mainAction: string
  can: string[]
  cannot: string[]
  handsOffTo: string[]
  receivesFrom: string[]
  pains: string[]
  journeys: string[]
  signIn: string
}

export type Cell = "yes" | "no" | "own" | "assigned" | "approval" | "open" | "na"

export interface PermAction extends Item {
  kind: "permission"
  area: string
  cells: Partial<Record<RoleId, Cell>>
  notes?: Partial<Record<RoleId, string>>
}

export type RuleArea =
  | "registration" | "sla" | "states" | "credit" | "approvals" | "agents"
  | "security" | "leads" | "cosell" | "growth" | "onboarding" | "ux"

export interface Rule extends Item {
  kind: "rule"
  area: RuleArea
  numbers?: string[]
  requirementIds?: string[]
}

export interface FlowStep {
  id: string
  lane: string
  label: string
  detail?: string
  reads?: string[]
  writes?: string[]
  rules?: string[]
  next?: { to: string; label?: string }[]
  main?: boolean
}

export interface Flow extends Item {
  kind: "flow"
  group: "journey" | "pam" | "handoff"
  lanes: { id: string; label: string; persona?: RoleId }[]
  steps: FlowStep[]
  promise?: string
}

export interface Entity extends Item {
  kind: "entity"
  origins: string[]
  livesIn: "Salesforce" | "PRM" | "PRM → Salesforce" | "Salesforce / marketing" | "PRM or Salesforce"
  createdBy: string
  changedBy: string
  readBy: string
  states?: string[]
  crud: Partial<Record<RoleId, string>>
  x: number
  y: number
}

export interface Gap extends Item {
  kind: "gap"
  says: { doc: DocId | string; text: string }[]
  resolution: string
  owner: string
}

export interface Faq extends Item {
  kind: "faq"
  answer: string
}
