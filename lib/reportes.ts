import { apiFetchAuth } from "@/lib/api"
import { getAccessToken } from "@/lib/session"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildQuery(params: Record<string, string | number | boolean | null | undefined>) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") q.set(k, String(v))
  }
  const s = q.toString()
  return s ? `?${s}` : ""
}

async function unwrap<T>(
  res: { estado: boolean; error_mensaje: string | null; datos: T | null },
  label: string
): Promise<T> {
  if (!res.estado || !res.datos) throw new Error(res.error_mensaje ?? `Error al cargar ${label}`)
  return res.datos
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export type DashboardKpisDto = {
  periodo: { desde: string; hasta: string }
  generadoEn: string
  clientes: { total: number; activos: number; inactivos: number; nuevosEnPeriodo: number }
  proyectos: { total: number; planificados: number; activos: number; pausados: number; finalizados: number; cancelados: number }
  facturacion: { totalEmitido: number; totalCobrado: number; pendiente: number; vencido: number; cantidadEmitidas: number; cantidadPendientes: number; cantidadVencidas: number }
  tareas: { total: number; pendientes: number; enProgreso: number; enRevision: number; completadas: number; canceladas: number; vencidas: number }
  finanzas: { totalIngresos: number; totalEgresos: number; neto: number; moneda: string }
}

export async function getDashboardKpis(desde: string, hasta: string): Promise<DashboardKpisDto> {
  const res = await apiFetchAuth<DashboardKpisDto>(
    `/api/v1/reportes/dashboard${buildQuery({ desde, hasta, formato: "json" })}`
  )
  return unwrap(res, "dashboard")
}

// ─── Proyectos ────────────────────────────────────────────────────────────────

export type ProyectoCarteraItem = {
  id: number; nombre: string; cliente: string; estado: string
  fechaInicio: string; fechaFinEstimada: string; fechaFinReal: string | null
  presupuestoTotal: number; moneda: string; atrasado: boolean
}

export type ProyectosCarteraDto = {
  desde: string; hasta: string; generadoEn: string
  totalProyectos: number; proyectos: ProyectoCarteraItem[]
}

export type ProyectoPresupuestoItem = {
  id: number; nombre: string; cliente: string; estado: string
  presupuestoTotal: number; totalFacturado: number; totalCobrado: number
  diferencia: number; moneda: string; porcentajeEjecutado: number
}

export type ProyectosPresupuestoDto = {
  generadoEn: string; totalPresupuestado: number; totalFacturado: number; totalCobrado: number
  proyectos: ProyectoPresupuestoItem[]
}

export async function getProyectosCartera(params: { desde?: string; hasta?: string; estado?: number | null; clienteId?: number | null }): Promise<ProyectosCarteraDto> {
  return unwrap(await apiFetchAuth<ProyectosCarteraDto>(`/api/v1/reportes/proyectos/cartera${buildQuery({ ...params, formato: "json" })}`), "cartera")
}

export async function getProyectosPresupuesto(params: { desde?: string; hasta?: string; estado?: number | null; clienteId?: number | null }): Promise<ProyectosPresupuestoDto> {
  return unwrap(await apiFetchAuth<ProyectosPresupuestoDto>(`/api/v1/reportes/proyectos/presupuesto${buildQuery({ ...params, formato: "json" })}`), "presupuesto")
}

// ─── Clientes ─────────────────────────────────────────────────────────────────

export type ClienteFacturacionItem = {
  clienteId: number; clienteNombre: string; cantidadFacturas: number
  totalEmitido: number; totalCobrado: number; totalPendiente: number; totalVencido: number
}

export type ClientesFacturacionDto = {
  desde: string; hasta: string; generadoEn: string
  totalEmitido: number; totalCobrado: number; totalPendiente: number; totalVencido: number
  clientes: ClienteFacturacionItem[]
}

export type FacturaMorosidadItem = {
  facturaId: number; numero: string; clienteId: number; clienteNombre: string
  estado: string; emitidaEn: string; venceEn: string; diasAtraso: number
  total: number; moneda: string
}

export type ClientesMorosidadDto = {
  generadoEn: string; totalFacturasVencidas: number; totalMoraARS: number
  facturas: FacturaMorosidadItem[]
}

export async function getClientesFacturacion(params: { desde?: string; hasta?: string; clienteId?: number | null }): Promise<ClientesFacturacionDto> {
  return unwrap(await apiFetchAuth<ClientesFacturacionDto>(`/api/v1/reportes/clientes/facturacion${buildQuery({ ...params, formato: "json" })}`), "facturación")
}

export async function getClientesMorosidad(params: { clienteId?: number | null }): Promise<ClientesMorosidadDto> {
  return unwrap(await apiFetchAuth<ClientesMorosidadDto>(`/api/v1/reportes/clientes/morosidad${buildQuery({ ...params, formato: "json" })}`), "morosidad")
}

// ─── Tareas ───────────────────────────────────────────────────────────────────

export type TareasResumenDto = {
  desde: string; hasta: string; total: number; pendientes: number; enProgreso: number
  enRevision: number; completadas: number; canceladas: number; vencidas: number
  horasEstimadas: number; horasReales: number; diferenciaHoras: number
  porPrioridad: Record<string, number>; porTipoTarea: Record<string, number>
  porDisciplina: Record<string, number>
  topProyectosPendientes: { nombreProyecto: string; cantidadPendientes: number }[]
}

export type UsuarioTareasItem = {
  usuarioId: number; nombreCompleto: string; totalTareas: number; pendientes: number
  enProgreso: number; enRevision: number; completadas: number; canceladas: number
  vencidas: number; horasEstimadas: number; horasReales: number
  diferenciaHoras: number; porcentajeCompletado: number
}

export type TareasPorUsuarioDto = { totalUsuarios: number; usuarios: UsuarioTareasItem[] }

export type TareaVencimientoItem = {
  tareaId: number; titulo: string; estado: string; prioridad: string
  fechaLimite: string; diasRestantes: number; proyectoNombre: string
  clienteNombre: string; asignadoNombre: string; horasEstimadas: number
  horasReales: number; alerta: "VENCIDA" | "HOY" | "CRÍTICA" | "PRÓXIMA"
}

export type TareasVencimientosDto = {
  diasAdelante: number; totalVencidas: number; totalProximasAVencer: number
  tareas: TareaVencimientoItem[]
}

export async function getTareasResumen(params: { desde?: string; hasta?: string; proyectoId?: number | null }): Promise<TareasResumenDto> {
  return unwrap(await apiFetchAuth<TareasResumenDto>(`/api/v1/reportes/tareas/resumen${buildQuery({ ...params, formato: "json" })}`), "tareas")
}

export async function getTareasPorUsuario(params: { desde?: string; hasta?: string; proyectoId?: number | null }): Promise<TareasPorUsuarioDto> {
  return unwrap(await apiFetchAuth<TareasPorUsuarioDto>(`/api/v1/reportes/tareas/por-usuario${buildQuery({ ...params, formato: "json" })}`), "tareas por usuario")
}

export async function getTareasVencimientos(params: { diasAdelante?: number; proyectoId?: number | null; asignadoId?: number | null }): Promise<TareasVencimientosDto> {
  return unwrap(await apiFetchAuth<TareasVencimientosDto>(`/api/v1/reportes/tareas/vencimientos${buildQuery({ ...params, formato: "json" })}`), "vencimientos")
}

// ─── Equipo ───────────────────────────────────────────────────────────────────

export type IntegranteEquipoItem = {
  usuarioId: number; nombreCompleto: string; email: string; tipoEmpleo: string
  disciplina: string; puesto: string; fechaIngreso: string
  salarioMensual: number | null; tarifaHora: number | null; activo: boolean
}

export type EquipoPlantelDto = {
  total: number; activos: number; inactivos: number; integrantes: IntegranteEquipoItem[]
}

export async function getEquipoPlantel(params: { soloActivos?: boolean }): Promise<EquipoPlantelDto> {
  return unwrap(await apiFetchAuth<EquipoPlantelDto>(`/api/v1/reportes/equipo/plantel${buildQuery({ ...params, formato: "json" })}`), "plantel")
}

export async function getEquipoCarga(params: { desde?: string; hasta?: string; proyectoId?: number | null }): Promise<TareasPorUsuarioDto> {
  return unwrap(await apiFetchAuth<TareasPorUsuarioDto>(`/api/v1/reportes/equipo/carga${buildQuery({ ...params, formato: "json" })}`), "carga")
}

// ─── Downloads ────────────────────────────────────────────────────────────────

export async function downloadReporte(
  path: string,
  params: Record<string, string | number | boolean | null | undefined>,
  formato: "pdf" | "word"
): Promise<void> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
  const apiKey = process.env.NEXT_PUBLIC_API_KEY ?? ""
  const token = getAccessToken()

  const r = await fetch(`${apiBase}${path}${buildQuery({ ...params, formato })}`, {
    headers: {
      "X-API-KEY": apiKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!r.ok) throw new Error("Error al generar el archivo")

  const blob = await r.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  const disposition = r.headers.get("Content-Disposition") ?? ""
  const match = disposition.match(/filename="?([^"]+)"?/)
  a.download = match?.[1] ?? `reporte.${formato === "pdf" ? "pdf" : "docx"}`
  a.click()
  URL.revokeObjectURL(url)
}
