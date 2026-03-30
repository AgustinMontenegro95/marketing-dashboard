export type Theme = "light" | "dark" | "system"
export type FontSize = "small" | "default" | "large"

export type AppearancePrefs = {
  theme: Theme
  compactMode: boolean
  animations: boolean
  fontSize: FontSize
  sidebarCollapsed: boolean
}

export const APPEARANCE_DEFAULTS: AppearancePrefs = {
  theme: "system",
  compactMode: false,
  animations: true,
  fontSize: "default",
  sidebarCollapsed: false,
}

const STORAGE_KEY = "chemi-appearance"

export function loadAppearancePrefs(): AppearancePrefs {
  if (typeof window === "undefined") return APPEARANCE_DEFAULTS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return APPEARANCE_DEFAULTS
    return { ...APPEARANCE_DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return APPEARANCE_DEFAULTS
  }
}

export function saveAppearancePrefs(prefs: AppearancePrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") return "light"
  return theme
}
