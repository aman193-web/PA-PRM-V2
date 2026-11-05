import { useEffect, useState } from "react"

// Minimal shapes for the two viewer capabilities the hub uses. Both are absent
// outside a claude.ai viewer (local dev, a saved copy), so everything degrades.
export interface SampleTool {
  name: string
  description: string
  inputSchema?: { type: "object"; properties?: Record<string, unknown>; required?: string[] }
  execute: (input: Record<string, unknown>, ctx: { signal: AbortSignal }) => unknown
}
export interface SampleFn {
  (input: string | { role: "user" | "assistant"; content: string }[], opts?: {
    onText?: (u: { text: string; delta: string }) => void
    signal?: AbortSignal
    tools?: SampleTool[]
    modelTier?: "default" | "quick" | "complex"
    cache?: boolean
  }): Promise<{ text: string; truncated: boolean }>
  limits?: () => Promise<{ tools?: { maxCount: number } }>
}
export interface CommentsNs {
  openComposer: (t: { element: Element }) => Promise<{ opened: boolean }>
}

type Use = (name: string) => Promise<unknown>
const viewer = typeof window !== "undefined" ? (window as unknown as { claude?: { use?: Use } }).claude : undefined

export function useCapability<T>(name: "sample" | "comments"): T | null {
  const [cap, setCap] = useState<T | null>(null)
  useEffect(() => {
    let live = true
    if (typeof viewer?.use !== "function") return
    // `sample` is itself a function, so wrap it: React would otherwise call it as a state updater.
    viewer.use(name).then((ns) => { if (live) setCap(() => (ns as T) ?? null) }).catch(() => {})
    return () => { live = false }
  }, [name])
  return cap
}
