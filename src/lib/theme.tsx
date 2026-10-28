import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type Theme = "light" | "dark"
const KEY = "prm-pam-theme"

const Ctx = createContext<{ resolvedTheme: Theme; setTheme: (t: Theme) => void }>({ resolvedTheme: "light", setTheme: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem(KEY) === "dark" ? "dark" : "light"
    } catch {
      return "light"
    }
  })
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    document.documentElement.style.colorScheme = theme
    try { localStorage.setItem(KEY, theme) } catch { /* storage blocked */ }
  }, [theme])
  return <Ctx.Provider value={{ resolvedTheme: theme, setTheme }}>{children}</Ctx.Provider>
}

export function useTheme() {
  return useContext(Ctx)
}
