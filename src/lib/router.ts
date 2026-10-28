import { useEffect, useState } from "react"

// Tiny hash router: "#/registration/REG-2041" -> ["registration", "REG-2041"].
function read() {
  const raw = window.location.hash.replace(/^#/, "") || "/"
  return raw.startsWith("/") ? raw : `/${raw}`
}

export function useRoute() {
  const [path, setPath] = useState(read)
  useEffect(() => {
    const on = () => {
      setPath(read())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener("hashchange", on)
    return () => window.removeEventListener("hashchange", on)
  }, [])
  return { path, parts: path.split("/").filter(Boolean) }
}

export function go(path: string) {
  window.location.hash = path
}

export function back(fallback: string) {
  if (window.history.length > 1) window.history.back()
  else go(fallback)
}
