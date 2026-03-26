import { apiFetchAuth, type ApiFetchOptions } from "@/lib/api"

async function proyectosFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const raw = (await apiFetchAuth<unknown>(path, options)) as any

  // Standard backend envelope: { estado, datos, error_mensaje }
  if (typeof raw.estado === "boolean") {
    if (!raw.estado || raw.datos == null) {
      throw new Error(raw.error_mensaje ?? "Error en la operación")
    }
    return raw.datos as T
  }

  // Alternative envelope: { success, data, message }
  if (!raw.success || raw.data == null) {
    throw new Error(raw.message ?? "Error en la operación")
  }

  return raw.data as T
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProyectoDto = {
  id: number
  clienteId: number
  disciplinaId: number | null
  nombre: string
  descripcion: string | null
  estado: number // 1-5
  fechaInicio: string | null // "YYYY-MM-DD"
  fechaFinEstimada: string | null
  fechaFinReal: string | null
  presupuestoTotal: number | null
  moneda: string // "ARS", "USD", etc.
  liderUsuarioId: number | null
  codigo: string | null
  creadoEn: string
  actualizadoEn: string
  creadoPorId: number
  actualizadoPorId: number
}

export type ProyectoContratoDto = {
  id: number
  proyectoId: number
  modeloCobro: number // 1-5
  moneda: string
  montoMensual: number | null
  tarifaHora: number | null
  montoUnico: number | null
  diaFacturacion: number | null
  diaVencimiento: number | null
  diasVencimiento: number | null
  vigenteDesde: string
  vigenteHasta: string | null
  activo: boolean
  creadoEn: string
}

export type ProyectoEquipoDto = {
  proyectoId: number
  usuarioId: number
  rolEnProyecto: number // 1=Líder, 2=Miembro, 3=Observador
  asignadoEn: string
}

export type FacturaDto = {
  id: number
  proyectoId: number
  periodoDesde: string | null
  periodoHasta: string | null
  emitidaEn: string
  estado: number // 1=borrador, 2=emitida
  subtotal: number | null
  moneda: string
  notas: string | null
  creadoEn: string
}

export type ProyectosPageResponse<T> = {
  contenido: T[]
  page: number
  size: number
  totalElementos: number
  totalPaginas: number
}

// ─── Request types ────────────────────────────────────────────────────────────

export type BuscarProyectosReq = {
  q: string | null
  clienteId: number | null
  disciplinaId: number | null
  liderUsuarioId: number | null
  estado: number | null
  inicioDesde: string | null
  inicioHasta: string | null
  page: number
  size: number
}

export type CrearProyectoReq = {
  clienteId: number
  disciplinaId: number | null
  liderUsuarioId: number | null
  nombre: string
  descripcion: string | null
  estado: number
  fechaInicio: string | null
  fechaFinEstimada: string | null
  fechaFinReal: string | null
  presupuestoTotal: number | null
  moneda: string
  codigo: string | null
}

export type ActualizarProyectoReq = Partial<Omit<CrearProyectoReq, "clienteId">>

export type CrearContratoReq = {
  modeloCobro: number
  moneda: string
  montoMensual: number | null
  tarifaHora: number | null
  montoUnico: number | null
  diaFacturacion: number | null
  diasVencimiento: number | null
  vigenteDesde: string | null
  activo: boolean
}

export type AgregarMiembroReq = {
  usuarioId: number
  rolEnProyecto: number
}

export type GenerarFacturaReq = {
  periodoDesde: string | null
  periodoHasta: string | null
  emitidaEn: string | null
  estado: number
  notas: string | null
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function buscarProyectos(
  body: BuscarProyectosReq
): Promise<ProyectosPageResponse<ProyectoDto>> {
  return proyectosFetch("/api/v1/proyectos/buscar", { method: "POST", body })
}

export async function crearProyecto(body: CrearProyectoReq): Promise<ProyectoDto> {
  return proyectosFetch("/api/v1/proyectos", { method: "POST", body })
}

export async function getProyecto(id: number): Promise<ProyectoDto> {
  return proyectosFetch(`/api/v1/proyectos/${id}`)
}

export async function actualizarProyecto(
  id: number,
  body: ActualizarProyectoReq
): Promise<ProyectoDto> {
  return proyectosFetch(`/api/v1/proyectos/${id}`, { method: "PUT", body })
}

export async function listarContratosProyecto(
  proyectoId: number
): Promise<ProyectoContratoDto[]> {
  return proyectosFetch(`/api/v1/proyectos/${proyectoId}/contratos`)
}

export async function crearContratoProyecto(
  proyectoId: number,
  body: CrearContratoReq
): Promise<ProyectoContratoDto> {
  return proyectosFetch(`/api/v1/proyectos/${proyectoId}/contratos`, { method: "POST", body })
}

export async function getContratoVigente(
  proyectoId: number
): Promise<ProyectoContratoDto | null> {
  try {
    return await proyectosFetch(`/api/v1/proyectos/${proyectoId}/contratos/vigente`)
  } catch {
    return null
  }
}

export async function cerrarContrato(
  proyectoId: number,
  contratoId: number,
  vigenteHasta?: string
): Promise<ProyectoContratoDto> {
  return proyectosFetch(
    `/api/v1/proyectos/${proyectoId}/contratos/${contratoId}/cerrar`,
    { method: "POST", body: { vigenteHasta: vigenteHasta ?? null, activo: false } }
  )
}

export async function listarEquipoProyecto(
  proyectoId: number
): Promise<ProyectoEquipoDto[]> {
  return proyectosFetch(`/api/v1/proyectos/${proyectoId}/equipo`)
}

export async function agregarMiembroEquipo(
  proyectoId: number,
  body: AgregarMiembroReq
): Promise<ProyectoEquipoDto> {
  return proyectosFetch(`/api/v1/proyectos/${proyectoId}/equipo`, { method: "POST", body })
}

export async function quitarMiembroEquipo(
  proyectoId: number,
  usuarioId: number
): Promise<void> {
  await proyectosFetch(`/api/v1/proyectos/${proyectoId}/equipo/${usuarioId}`, {
    method: "DELETE",
  })
}

export async function facturarProyecto(
  proyectoId: number,
  body: GenerarFacturaReq
): Promise<FacturaDto> {
  return proyectosFetch(`/api/v1/proyectos/${proyectoId}/facturacion/facturar`, {
    method: "POST",
    body,
  })
}
