import { apiFetchAuth } from "@/lib/api"
import { type AppearancePrefs } from "@/lib/appearance"

type AparienciaDto = {
  tema: string
  modoCompacto: boolean
  animaciones: boolean
  tamanoFuente: string
  sidebarColapsada: boolean
}

// Cache de sesión — vive mientras el tab está abierto
let sessionCache: AppearancePrefs | null = null

function fromDto(dto: AparienciaDto): AppearancePrefs {
  return {
    theme: dto.tema as AppearancePrefs["theme"],
    compactMode: dto.modoCompacto,
    animations: dto.animaciones,
    fontSize: dto.tamanoFuente as AppearancePrefs["fontSize"],
    sidebarCollapsed: dto.sidebarColapsada,
  }
}

function toDto(prefs: AppearancePrefs): AparienciaDto {
  return {
    tema: prefs.theme,
    modoCompacto: prefs.compactMode,
    animaciones: prefs.animations,
    tamanoFuente: prefs.fontSize,
    sidebarColapsada: prefs.sidebarCollapsed,
  }
}

export async function getApariencia(): Promise<AppearancePrefs> {
  if (sessionCache) return sessionCache

  const r = await apiFetchAuth<AparienciaDto>("/api/v1/usuario/apariencia")
  if (!r.estado || !r.datos) {
    throw new Error(r.error_mensaje ?? "Error al cargar apariencia")
  }
  sessionCache = fromDto(r.datos)
  return sessionCache
}

export async function saveApariencia(prefs: AppearancePrefs): Promise<void> {
  const r = await apiFetchAuth("/api/v1/usuario/apariencia", {
    method: "PATCH",
    body: toDto(prefs),
  })
  if (!r.estado) {
    throw new Error(r.error_mensaje ?? "Error al guardar apariencia")
  }
  sessionCache = prefs
}
