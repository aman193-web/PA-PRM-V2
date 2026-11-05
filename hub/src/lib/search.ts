import MiniSearch from "minisearch"
import { allItems, byId, entities, permissions, type Cell, type Item, type PermAction, type RoleId } from "@hub/content"
import { personas, roleSynonyms } from "@hub/content/personas"

const boost: Partial<Record<Item["kind"], number>> = { faq: 1.6, persona: 1.4, permission: 1.2, rule: 1.15, entity: 1.2, gap: 1, flow: 1.1 }

// Filler words would otherwise make question-shaped FAQs outrank the rule or term that answers the question.
const FILLER = new Set("a an the is are was be been do does did can could may might should would will what when where who whom whose which why how if then than of to in on at by for from with and or not it its this that these those there here i we you they he she them our your their has have had happen happens happened get gets about into".split(" "))

const index = new MiniSearch<Item & { text: string; tagText: string }>({
  fields: ["title", "tagText", "summary", "text"],
  storeFields: ["id"],
  processTerm: (term) => { const t = term.toLowerCase(); return FILLER.has(t) ? null : t },
  searchOptions: { boost: { title: 3, tagText: 2.2, summary: 1.2 }, prefix: true, fuzzy: 0.2, combineWith: "OR" },
})
index.addAll(allItems.map((i) => ({
  ...i,
  tagText: (i.tags ?? []).join(" "),
  text: [
    ...(i.points ?? []),
    "answer" in i ? String((i as { answer: string }).answer) : "",
    "can" in i ? (i as { can: string[] }).can.join(" ") : "",
    "cannot" in i ? (i as { cannot: string[] }).cannot.join(" ") : "",
    "origins" in i ? (i as { origins: string[] }).origins.join(" ") : "",
    "resolution" in i ? String((i as { resolution: string }).resolution) : "",
    "steps" in i ? (i as { steps: { label: string }[] }).steps.map((s) => s.label).join(" ") : "",
  ].join(" "),
})))

const permIndex = new MiniSearch<PermAction & { tagText: string }>({
  fields: ["title", "tagText", "summary"],
  storeFields: ["id"],
  searchOptions: { boost: { title: 3, tagText: 2 }, prefix: true, fuzzy: 0.2 },
})
permIndex.addAll(permissions.map((p) => ({ ...p, tagText: (p.tags ?? []).join(" ") })))

const STOP = new Set(["can", "could", "may", "a", "an", "the", "is", "are", "do", "does", "to", "be", "allowed", "able", "of", "in", "on", "for", "i", "we", "they", "he", "she", "their", "own", "?"])

export interface Hit { item: Item; score: number }

export function search(q: string, limit = 24): Hit[] {
  const t = q.trim()
  if (!t) return []
  return index.search(t)
    .map((r) => ({ item: byId.get(String(r.id))!, score: r.score * (boost[byId.get(String(r.id))!.kind] ?? 1) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

function findRole(text: string): { role: RoleId; match: string } | null {
  let best: { role: RoleId; match: string } | null = null
  for (const p of personas) {
    for (const syn of roleSynonyms[p.id as RoleId]) {
      const re = new RegExp(`(^|[^a-z])${syn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i")
      if (re.test(text) && (!best || syn.length > best.match.length)) best = { role: p.id as RoleId, match: syn }
    }
  }
  return best
}

export interface CanAnswer { kind: "can"; role: RoleId; action: PermAction; cell: Cell; note?: string }
export interface OriginAnswer { kind: "origin"; entityIds: string[] }

const entityWords: [RegExp, string[]][] = [
  [/\bleads?\b/i, ["ent-lead-vendor", "ent-lead-partner"]],
  [/\b(deals?|registrations?)\b/i, ["ent-registration"]],
  [/\bopportunit(y|ies)\b/i, ["ent-opportunity"]],
  [/\bcredit|split|ledger\b/i, ["ent-credit"]],
  [/\btouch(es)?\b/i, ["ent-touch"]],
  [/\b(application|applicant|new partner)s?\b/i, ["ent-application"]],
  [/\breconcil/i, ["ent-recon"]],
  [/\bpartner roles?\b/i, ["ent-role"]],
  [/\bvalue events?\b/i, ["ent-value"]],
  [/\baudit\b/i, ["ent-audit"]],
  [/\b(program|tier|rules?|sla)s?\b/i, ["ent-program"]],
]

/** Understands "Can <role> <action>?" and "Where does <record> come from?". */
export function answerQuestion(q: string): CanAnswer | OriginAnswer | null {
  const t = q.trim().toLowerCase()
  if (!t) return null
  if (/\b(where|origin|come[s]? from|comes from|source of|created by|who creates)\b/.test(t)) {
    for (const [re, ids] of entityWords) if (re.test(t)) return { kind: "origin", entityIds: ids.filter((i) => entities.some((e) => e.id === i)) }
  }
  if (/^(can|could|may|is|are|does|do)\b|\b(allowed to|able to|permission)\b/.test(t)) {
    const role = findRole(t)
    if (!role) return null
    const rest = t.replace(role.match, " ").split(/[^a-z0-9-]+/).filter((w) => w && !STOP.has(w)).join(" ")
    if (!rest) return null
    const hit = permIndex.search(rest)[0]
    if (!hit || hit.score < 1.5) return null
    const action = permissions.find((p) => p.id === hit.id)!
    return { kind: "can", role: role.role, action, cell: action.cells[role.role] ?? "no", note: action.notes?.[role.role] }
  }
  return null
}

/** Compact search results the assistant's tool hands to Claude. */
export function searchForAssistant(q: string, n = 8) {
  return search(q, n).map(({ item }) => ({ id: item.id, type: item.kind, title: item.title, summary: item.summary, status: item.status }))
}
