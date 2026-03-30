"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import {
  type AppearancePrefs,
  type Theme,
  type FontSize,
  APPEARANCE_DEFAULTS,
  loadAppearancePrefs,
  saveAppearancePrefs,
  resolveTheme,
} from "@/lib/appearance"
import { getApariencia, saveApariencia } from "@/lib/usuario-apariencia"

type AppearanceContextValue = AppearancePrefs & {
  setTheme: (v: Theme) => void
  setCompactMode: (v: boolean) => void
  setAnimations: (v: boolean) => void
  setFontSize: (v: FontSize) => void
  setSidebarCollapsed: (v: boolean) => void
}

const AppearanceContext = createContext<AppearanceContextValue>({
  ...APPEARANCE_DEFAULTS,
  setTheme: () => {},
  setCompactMode: () => {},
  setAnimations: () => {},
  setFontSize: () => {},
  setSidebarCollapsed: () => {},
})

function applyPrefs(prefs: AppearancePrefs) {
  const html = document.documentElement
  const resolved = resolveTheme(prefs.theme)
  html.classList.toggle("dark", resolved === "dark")
  html.classList.toggle("ui-compact", prefs.compactMode)
  html.classList.toggle("ui-no-animations", !prefs.animations)
  html.classList.remove("ui-text-small", "ui-text-large")
  if (prefs.fontSize === "small") html.classList.add("ui-text-small")
  if (prefs.fontSize === "large") html.classList.add("ui-text-large")
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<AppearancePrefs>(APPEARANCE_DEFAULTS)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // 1. Aplica localStorage inmediatamente (sin esperar red)
    const local = loadAppearancePrefs()
    setPrefs(local)
    applyPrefs(local)

    // 2. Carga desde API (con caché de sesión) y sincroniza
    getApariencia()
      .then((remote) => {
        setPrefs(remote)
        applyPrefs(remote)
        saveAppearancePrefs(remote) // sincroniza localStorage para el anti-flash
      })
      .catch(() => {
        // Sin sesión activa (ej: página de login) — queda con localStorage
      })
  }, [])

  // Debounce para no spamear la API en cambios rápidos (1s)
  const debouncedSaveToApi = useCallback((next: AppearancePrefs) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveApariencia(next).catch(() => {}) // fallo silencioso, ya está en localStorage
    }, 1000)
  }, [])

  const update = useCallback((patch: Partial<AppearancePrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch }
      applyPrefs(next)           // DOM instantáneo
      saveAppearancePrefs(next)  // localStorage instantáneo (anti-flash próxima carga)
      debouncedSaveToApi(next)   // API con debounce
      return next
    })
  }, [debouncedSaveToApi])

  return (
    <AppearanceContext.Provider value={{
      ...prefs,
      setTheme: (v) => update({ theme: v }),
      setCompactMode: (v) => update({ compactMode: v }),
      setAnimations: (v) => update({ animations: v }),
      setFontSize: (v) => update({ fontSize: v }),
      setSidebarCollapsed: (v) => update({ sidebarCollapsed: v }),
    }}>
      {children}
    </AppearanceContext.Provider>
  )
}

export function useAppearance() {
  return useContext(AppearanceContext)
}
