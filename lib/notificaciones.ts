import { apiFetchAuth, type ApiFetchOptions } from "@/lib/api"

async function notifFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const raw = (await apiFetchAuth<unknown>(path, options)) as any

  if (typeof raw.estado === "boolean") {
    if (!raw.estado || raw.datos == null) {
      throw new Error(raw.error_mensaje ?? "Error en la operación")
    }
    return raw.datos as T
  }

  if (!raw.success || raw.data == null) {
    throw new Error(raw.message ?? "Error en la operación")
  }

  return raw.data as T
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificacionDto = {
  notificacionUsuarioId: string
  notificacionId: string
  usuarioId: number
  leida: boolean
  leidaEn: string | null
  visibleDesde: string | null
  asignadaEn: string | null
  titulo: string
  mensajeCorto: string
  mensajeLargo: string | null
  prioridad: "baja" | "media" | "alta" | "critica"
  icono: string | null
  imagenUrl: string | null
  rutaDestino: string | null
  entidadTipo: string | null
  entidadId: string | null
  metadata: string | null
  origenTipo: string | null
  creadoPorUsuarioId: number | null
  fechaEfectiva: string | null
  expiraEn: string | null
  notificacionCreadaEn: string | null
  categoriaId: number | null
  categoriaCodigo: string | null
  categoriaNombre: string | null
}

export type NotificacionesPageResponse<T> = {
  contenido: T[]
  page: number
  size: number
  totalElementos: number
  totalPaginas: number
}

export type ContadorDto = {
  noLeidas: number
}

export type PreferenciaDto = {
  categoriaId: number
  categoriaSlug: string
  categoriaNombre: string
  canalId: number
  canalSlug: string
  canalNombre: string
  habilitado: boolean
  guardada: boolean
}

// ─── Request types ────────────────────────────────────────────────────────────

export type BandejaReq = {
  leida?: boolean | null
  fechaDesde?: string | null
  fechaHasta?: string | null
  categoriaId?: number | null
  prioridad?: string | null
  q?: string | null
  incluirExpiradas?: boolean
  page: number
  size: number
}

export type MarcarLeidasReq = {
  ids?: string[] | null
  categoriaId?: number | null
  prioridad?: string | null
  fechaDesde?: string | null
  fechaHasta?: string | null
  q?: string | null
  incluirExpiradas?: boolean
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function getBandeja(
  body: BandejaReq
): Promise<NotificacionesPageResponse<NotificacionDto>> {
  return notifFetch("/api/v1/notificaciones/bandeja", { method: "POST", body })
}

export async function marcarComoLeida(id: string): Promise<void> {
  const r = await apiFetchAuth(`/api/v1/notificaciones/${id}/leida`, { method: "PATCH" })
  if (!r.estado) {
    throw new Error(r.error_mensaje ?? "Error al marcar como leída")
  }
}

export async function marcarLeidas(body: MarcarLeidasReq = {}): Promise<void> {
  const r = await apiFetchAuth("/api/v1/notificaciones/marcar-leidas", { method: "PATCH", body })
  if (!r.estado) {
    throw new Error(r.error_mensaje ?? "Error al marcar como leídas")
  }
}

export async function eliminarNotificacion(id: string): Promise<void> {
  const r = await apiFetchAuth(`/api/v1/notificaciones/${id}`, { method: "DELETE" })
  if (!r.estado) {
    throw new Error(r.error_mensaje ?? "Error al eliminar notificación")
  }
}

export async function getContador(): Promise<ContadorDto> {
  return notifFetch("/api/v1/notificaciones/contador")
}

// ─── Cache de preferencias ────────────────────────────────────────────────────
// Se conserva durante la sesión del browser (se pierde al recargar la página).
// TTL de 5 minutos: equilibrio entre no consultar siempre y tener datos frescos.

const PREFS_TTL_MS = 5 * 60 * 1000

let prefsCache: { data: PreferenciaDto[]; expiresAt: number } | null = null

function invalidatePrefsCache() {
  prefsCache = null
}

export async function getPreferencias(): Promise<PreferenciaDto[]> {
  const now = Date.now()
  if (prefsCache && prefsCache.expiresAt > now) {
    return prefsCache.data
  }
  const data = await notifFetch<PreferenciaDto[]>("/api/v1/notificaciones/preferencias")
  prefsCache = { data, expiresAt: now + PREFS_TTL_MS }
  return data
}

export async function actualizarPreferencia(
  categoriaId: number,
  canalId: number,
  habilitado: boolean
): Promise<PreferenciaDto> {
  const result = await notifFetch<PreferenciaDto>(
    `/api/v1/notificaciones/preferencias/${categoriaId}/${canalId}`,
    { method: "PUT", body: { habilitado } }
  )
  invalidatePrefsCache()
  return result
}
