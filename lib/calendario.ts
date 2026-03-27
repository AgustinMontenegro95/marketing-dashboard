import { apiFetchAuth, type ApiFetchOptions } from "@/lib/api"

async function calFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
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

export type TipoActividadDto = {
  id: number
  nombre: string
  color: string
  activo: boolean
}

export type ParticipanteDto = {
  usuarioId: number
  nombreCompleto: string
  email: string
  rol: number
  asistencia: number
  notas: string | null
}

export type RecordatorioDto = {
  id: number
  minutosAntes: number
  canal: number
}

export type ActividadDto = {
  id: number
  titulo: string
  descripcion: string | null
  tipoActividadId: number | null
  tipoActividadNombre: string | null
  tipoActividadColor: string | null
  inicioEn: string
  finEn: string
  todoDia: boolean
  zonaHoraria: string
  clienteId: number | null
  proyectoId: number | null
  ubicacion: string | null
  urlReunion: string | null
  estado: number // 1=Programada, 2=Cancelada, 3=Completada
  visibilidad: number // 1=Pública, 2=Privada
  creadoEn: string
  actualizadoEn: string
  creadoPorId: number
  actualizadoPorId: number
  participantes: ParticipanteDto[]
  recordatorios: RecordatorioDto[]
}

export type FeriadoDto = {
  date: string
  localName: string
  name: string
  types: string[]
}

export type CrearActividadReq = {
  titulo: string
  descripcion?: string | null
  tipoActividadId?: number | null
  inicioEn: string
  finEn: string
  todoDia?: boolean
  zonaHoraria?: string
  clienteId?: number | null
  proyectoId?: number | null
  ubicacion?: string | null
  urlReunion?: string | null
  visibilidad?: number
  participantesIds?: number[]
  recordatorios?: { minutosAntes: number; canal: number }[]
}

export type ActualizarActividadReq = {
  titulo?: string
  descripcion?: string | null
  tipoActividadId?: number | null
  inicioEn?: string
  finEn?: string
  todoDia?: boolean
  zonaHoraria?: string
  clienteId?: number | null
  proyectoId?: number | null
  ubicacion?: string | null
  urlReunion?: string | null
  visibilidad?: number
  participantesIds?: number[] | null
  recordatorios?: { minutosAntes: number; canal: number }[] | null
}

// ─── Tipos de actividad ────────────────────────────────────────────────────────

export async function listarTiposActividad(): Promise<TipoActividadDto[]> {
  return calFetch("/api/v1/tipos-actividad")
}

export async function crearTipoActividad(nombre: string, color: string): Promise<TipoActividadDto> {
  const params = new URLSearchParams({ nombre, color })
  return calFetch(`/api/v1/tipos-actividad?${params.toString()}`, { method: "POST" })
}

export async function actualizarTipoActividad(
  id: number,
  nombre: string,
  color: string
): Promise<TipoActividadDto> {
  const params = new URLSearchParams({ nombre, color })
  return calFetch(`/api/v1/tipos-actividad/${id}?${params.toString()}`, { method: "PUT" })
}

export async function eliminarTipoActividad(id: number): Promise<void> {
  const r = await apiFetchAuth(`/api/v1/tipos-actividad/${id}`, { method: "DELETE" })
  if (r.estado === false && r.error_mensaje) {
    throw new Error(r.error_mensaje)
  }
}

// ─── Actividades ──────────────────────────────────────────────────────────────

export async function getMisActividades(year: number, month: number): Promise<ActividadDto[]> {
  return calFetch(`/api/v1/calendario/mis-actividades?year=${year}&month=${month}`)
}

export async function getActividad(id: number): Promise<ActividadDto> {
  return calFetch(`/api/v1/calendario/${id}`)
}

export async function crearActividad(body: CrearActividadReq): Promise<ActividadDto> {
  return calFetch("/api/v1/calendario", { method: "POST", body })
}

export async function actualizarActividad(
  id: number,
  body: ActualizarActividadReq
): Promise<ActividadDto> {
  return calFetch(`/api/v1/calendario/${id}`, { method: "PUT", body })
}

export async function cancelarActividad(id: number): Promise<void> {
  const r = await apiFetchAuth(`/api/v1/calendario/${id}/cancelar`, { method: "PUT" })
  if (r.estado === false && r.error_mensaje) {
    throw new Error(r.error_mensaje)
  }
}

// ─── Feriados ─────────────────────────────────────────────────────────────────

export async function getFeriados(year: number): Promise<FeriadoDto[]> {
  return calFetch(`/api/v1/feriados/${year}`)
}
