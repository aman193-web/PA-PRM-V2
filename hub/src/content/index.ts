import { entities, integrations } from "./entities"
import { faqs } from "./faq"
import { flows } from "./flows"
import { gaps } from "./gaps"
import { permissions } from "./permissions"
import { personas } from "./personas"
import { families, glossary, stages } from "./reference"
import { agents, rules } from "./rules"
import type { Item, Kind, Status } from "./types"
import { valueItems } from "./value"

export * from "./types"

export const allItems: Item[] = [
  ...faqs, ...personas, ...permissions, ...rules, ...agents, ...flows, ...entities, ...integrations,
  ...gaps, ...valueItems, ...stages, ...families, ...glossary,
]

export const byId = new Map(allItems.map((i) => [i.id, i]))

export const kindLabel: Record<Kind, string> = {
  faq: "Quick answer", persona: "Persona", permission: "Permission", rule: "Rule", agent: "AI agent", flow: "Flow",
  entity: "Data record", integration: "Integration", gap: "Gap", value: "Value", competitor: "Competitors",
  stage: "Stage", requirement: "Requirements", term: "Glossary", source: "Source",
}

export const statusMeta: Record<Status, { label: string; hint: string }> = {
  confirmed: { label: "Confirmed", hint: "An agreed decision" },
  specified: { label: "Specified", hint: "Written in the BRD or Technical Design" },
  proposed: { label: "Proposed", hint: "Our proposal, not yet signed off" },
  default: { label: "Recommended default", hint: "Common practice where documents are silent or disagree. Confirm with the product owner." },
  open: { label: "Open", hint: "A decision is still needed" },
  assumption: { label: "Assumption", hint: "Prototype only, not in any document" },
  conflict: { label: "Conflict", hint: "Sources disagree" },
}

/** Every content problem we can detect: missing sources, dangling links, empty personas, broken flow steps. */
export function validateContent(): string[] {
  const problems: string[] = []
  const ids = new Set<string>()
  for (const i of allItems) {
    if (ids.has(i.id)) problems.push(`Duplicate id: ${i.id}`)
    ids.add(i.id)
    if (!i.status) problems.push(`${i.id}: missing status`)
    if (!i.sources?.length) problems.push(`${i.id}: missing sources`)
    if (!i.title || !i.summary) problems.push(`${i.id}: missing title or summary`)
  }
  for (const i of allItems) {
    for (const r of i.related ?? []) if (!ids.has(r)) problems.push(`${i.id}: related id "${r}" doesn't exist`)
  }
  for (const p of personas) {
    if (!p.can.length || !p.cannot.length) problems.push(`${p.id}: persona needs can and cannot`)
    for (const j of p.journeys) if (!ids.has(j)) problems.push(`${p.id}: journey "${j}" doesn't exist`)
  }
  for (const fl of flows) {
    const stepIds = new Set(fl.steps.map((s) => s.id))
    const lanes = new Set(fl.lanes.map((l) => l.id))
    for (const s of fl.steps) {
      if (!lanes.has(s.lane)) problems.push(`${fl.id}/${s.id}: lane "${s.lane}" doesn't exist`)
      for (const n of s.next ?? []) if (!stepIds.has(n.to)) problems.push(`${fl.id}/${s.id}: next "${n.to}" points nowhere`)
      for (const r of s.rules ?? []) if (!ids.has(r)) problems.push(`${fl.id}/${s.id}: rule "${r}" doesn't exist`)
    }
  }
  return problems
}

export { agents, entities, faqs, flows, gaps, integrations, permissions, personas, rules }
