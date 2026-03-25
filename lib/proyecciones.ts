// lib/proyecciones.ts
import { apiFetchAuth } from "@/lib/api"
import type { PageResponse } from "@/lib/finanzas"

const BASE = "/api/v1/finanzas/proyecciones"

// ==================== TIPOS ====================

export type PlantillaMovimiento = {
    id: number
    nombre: string
    direccion: 1 | 2
    categoriaId: number | null
    categoriaNombre: string | null
    cuentaId: number | null
    cuentaNombre: string | null
    monto: number
    moneda: string
    periodicidad: 1 | 2 | 3   // 1=mensual, 2=trimestral, 3=anual
    diaDelMes: number
    activo: boolean
    vigenteDesde: string | null  // YYYY-MM-DD
    vigenteHasta: string | null  // YYYY-MM-DD
    descripcion: string | null
    creadoEn: string | null
    actualizadoEn: string | null
}

export type BuscarPlantillasReq = {
    q: string | null
    direccion: 1 | 2 | null
    activo: boolean | null
    periodicidad: 1 | 2 | 3 | null
    moneda: string | null
    page: number
    size: number
}

export type PlantillaFormReq = {
    nombre: string
    direccion: 1 | 2
    categoriaId: number
    cuentaId: number | null
    monto: number
    moneda: string
    periodicidad: 1 | 2 | 3
    diaDelMes: number
    activo: boolean
    vigenteDesde: string | null
    vigenteHasta: string | null
    descripcion: string | null
}

export type MovimientoProyectado = {
    id: number
    nombre: string
    direccion: 1 | 2
    categoriaId: number | null
    categoriaNombre: string | null
    cuentaId: number | null
    cuentaNombre: string | null
    fechaEsperada: string   // YYYY-MM-DD
    monto: number
    moneda: string
    estado: 1 | 2 | 3       // 1=pendiente, 2=ejecutado, 3=omitido
    plantillaId: number | null
    movimientoFinancieroId: number | null
    notas: string | null
    creadoEn: string | null
    actualizadoEn: string | null
}

export type BuscarProyeccionesReq = {
    estado: 1 | 2 | 3 | null
    direccion: 1 | 2 | null
    fechaDesde: string | null
    fechaHasta: string | null
    page: number
    size: number
}

export type CrearProyeccionReq = {
    nombre: string
    direccion: 1 | 2
    categoriaId: number
    cuentaId: number | null
    fechaEsperada: string
    monto: number
    moneda: string
    notas: string | null
}

export type EjecutarProyeccionReq = {
    monto: number | null
    cuentaId: number | null
    fecha: string | null
    notas: string | null
}

export type GenerarProyeccionesReq = {
    anio: number
    mes: number
}

export type ResumenBucket = {
    proyectado: number
    ejecutado: number
    pendiente: number
    omitido: number
}

export type ProyeccionesResumen = {
    desde: string
    hasta: string
    ingresos: ResumenBucket
    egresos: ResumenBucket
    netoProyectado: number
    netoEjecutado: number
    netoPendiente: number
    items: MovimientoProyectado[]
}

// ==================== PLANTILLAS ====================

export async function buscarPlantillas(body: BuscarPlantillasReq): Promise<PageResponse<PlantillaMovimiento>> {
    const r = await apiFetchAuth<PageResponse<PlantillaMovimiento>>(`${BASE}/plantillas/buscar`, {
        method: "POST",
        body,
    })
    if (!r.estado || !r.datos) throw new Error(r.error_mensaje ?? "No se pudieron cargar las plantillas")
    return r.datos
}

export async function crearPlantilla(body: PlantillaFormReq): Promise<PlantillaMovimiento> {
    const r = await apiFetchAuth<PlantillaMovimiento>(`${BASE}/plantillas`, {
        method: "POST",
        body,
    })
    if (!r.estado || !r.datos) throw new Error(r.error_mensaje ?? "No se pudo crear la plantilla")
    return r.datos
}

export async function editarPlantilla(id: number, body: PlantillaFormReq): Promise<PlantillaMovimiento> {
    const r = await apiFetchAuth<PlantillaMovimiento>(`${BASE}/plantillas/${id}`, {
        method: "PUT",
        body,
    })
    if (!r.estado || !r.datos) throw new Error(r.error_mensaje ?? "No se pudo editar la plantilla")
    return r.datos
}

export async function eliminarPlantilla(id: number): Promise<void> {
    const r = await apiFetchAuth<any>(`${BASE}/plantillas/${id}`, { method: "DELETE" })
    if (!r.estado) throw new Error(r.error_mensaje ?? "No se pudo eliminar la plantilla")
}

// ==================== PROYECCIONES ====================

export async function buscarProyecciones(body: BuscarProyeccionesReq): Promise<PageResponse<MovimientoProyectado>> {
    const r = await apiFetchAuth<PageResponse<MovimientoProyectado>>(`${BASE}/buscar`, {
        method: "POST",
        body,
    })
    if (!r.estado || !r.datos) throw new Error(r.error_mensaje ?? "No se pudieron cargar las proyecciones")
    return r.datos
}

export async function crearProyeccion(body: CrearProyeccionReq): Promise<MovimientoProyectado> {
    const r = await apiFetchAuth<MovimientoProyectado>(`${BASE}`, {
        method: "POST",
        body,
    })
    if (!r.estado || !r.datos) throw new Error(r.error_mensaje ?? "No se pudo crear la proyección")
    return r.datos
}

export async function eliminarProyeccion(id: number): Promise<void> {
    const r = await apiFetchAuth<any>(`${BASE}/${id}`, { method: "DELETE" })
    if (!r.estado) throw new Error(r.error_mensaje ?? "No se pudo eliminar la proyección")
}

export async function ejecutarProyeccion(id: number, body: EjecutarProyeccionReq): Promise<MovimientoProyectado> {
    const r = await apiFetchAuth<MovimientoProyectado>(`${BASE}/${id}/ejecutar`, {
        method: "POST",
        body,
    })
    if (!r.estado || !r.datos) throw new Error(r.error_mensaje ?? "No se pudo ejecutar la proyección")
    return r.datos
}

export async function omitirProyeccion(id: number): Promise<MovimientoProyectado> {
    const r = await apiFetchAuth<MovimientoProyectado>(`${BASE}/${id}/omitir`, { method: "POST" })
    if (!r.estado || !r.datos) throw new Error(r.error_mensaje ?? "No se pudo omitir la proyección")
    return r.datos
}

export async function generarProyecciones(body: GenerarProyeccionesReq): Promise<{ generadas: number; omitidas: number }> {
    const r = await apiFetchAuth<{ generadas: number; omitidas: number }>(`${BASE}/generar`, {
        method: "POST",
        body,
    })
    if (!r.estado) throw new Error(r.error_mensaje ?? "No se pudieron generar las proyecciones")
    return r.datos ?? { generadas: 0, omitidas: 0 }
}

export async function getProyeccionesResumen(desde: string, hasta: string): Promise<ProyeccionesResumen> {
    const r = await apiFetchAuth<ProyeccionesResumen>(`${BASE}/resumen?desde=${desde}&hasta=${hasta}`, {
        method: "GET",
    })
    if (!r.estado || !r.datos) throw new Error(r.error_mensaje ?? "No se pudo cargar el resumen de proyecciones")
    return r.datos
}

// ==================== HELPERS ====================

export const PERIODICIDAD_LABELS: Record<number, string> = {
    1: "Mensual",
    2: "Trimestral",
    3: "Anual",
}

export const ESTADO_PROYECCION_LABELS: Record<number, string> = {
    1: "Pendiente",
    2: "Ejecutado",
    3: "Omitido",
}

export function firstDayOfMonth(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, "0")}-01`
}

export function lastDayOfMonth(year: number, month: number): string {
    const d = new Date(year, month, 0) // día 0 del mes siguiente = último del mes actual
    return `${year}-${String(month).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
