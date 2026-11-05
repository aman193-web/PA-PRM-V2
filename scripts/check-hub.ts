// Fails the build when any hub item lacks a source or status, or links to something that doesn't exist.
import { allItems, validateContent } from "../hub/src/content/index"

const problems = validateContent()
const counts: Record<string, number> = {}
for (const i of allItems) counts[i.kind] = (counts[i.kind] ?? 0) + 1
console.log(`Content: ${allItems.length} items`, counts)
if (problems.length) {
  console.error(`\n${problems.length} content problem(s):\n- ${problems.join("\n- ")}`)
  process.exit(1)
}
console.log("Content check passed.")
