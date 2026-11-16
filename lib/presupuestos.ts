import { apiFetchAuth } from "@/lib/api"
import { getAccessToken } from "@/lib/session"

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type Frecuencia = "SEMANAL" | "QUINCENAL" | "MENSUAL" | "UNICA"
export type OrigenCatalogo = "CURADO" | "USO"

export type Area = "MARKETING" | "SOFTWARE" | "DISENO"

export const AREAS: { value: Area; label: string }[] = [
    { value: "MARKETING", label: "Marketing" },
    { value: "SOFTWARE", label: "Software" },
    { value: "DISENO", label: "Diseño" },
]

export function areaLabel(area: string | null | undefined): string {
    return AREAS.find((a) => a.value === area)?.label ?? area ?? "—"
}

export type EstadoPresupuesto = "BORRADOR" | "ENVIADO" | "ACEPTADO" | "RECHAZADO"

export const ESTADOS: { value: EstadoPresupuesto; label: string }[] = [
    { value: "BORRADOR", label: "Borrador" },
    { value: "ENVIADO", label: "Enviado" },
    { value: "ACEPTADO", label: "Aceptado" },
    { value: "RECHAZADO", label: "Rechazado" },
]

export function estadoLabel(estado: string | null | undefined): string {
    return ESTADOS.find((e) => e.value === estado)?.label ?? estado ?? "—"
}

export type PresupuestoItemCatalogoDto = {
    id: number
    area: string
    categoria: string | null
    unidad: string
    origen: OrigenCatalogo
    vecesUsado: number
}

export type PresupuestoItemDto = {
    id: number
    orden: number
    cantidad: number | null
    unidad: string | null
    frecuencia: Frecuencia | null
    textoManual: string | null
    textoManualActivo: boolean
    textoResuelto: string
}

export type ItemInput = {
    cantidad?: number | null
    unidad?: string | null
    frecuencia?: Frecuencia | null
    textoManual?: string | null
    textoManualActivo: boolean
}

export type PlanificacionFrecuencia = "MENSUAL" | "QUINCENAL" | "MENSUAL_QUINCENAL"
export type ReunionFrecuencia = "SEMANAL" | "QUINCENAL" | "MENSUAL"

/** Notas a nivel documento — comunes a todo el presupuesto/plantilla. */
export type ChecklistNotas = {
    validezDias: number
    actualizaPrecio: boolean
    actualizaPorcentaje: number | null
    actualizaCadaMeses: number | null
    incluyePlanificacion: boolean
    planificacionFrecuencia: PlanificacionFrecuencia
    requiereInfoAnticipada: boolean
    incluyeReunionEstrategica: boolean
    reunionFrecuencia: ReunionFrecuencia
    pedirLogoVectorizado: boolean
    aclararFactura: boolean
    notasLibres: string | null
    condicionesPago: string | null
}

/** Horas de cobertura audiovisual — varía por plan, no por documento. */
export type HorasCobertura = {
    incluyeHorasCobertura: boolean
    horasCobertura: number | null
}

export type PresupuestoPlantillaDto = ChecklistNotas & HorasCobertura & {
    id: number
    area: string
    nombreInterno: string
    subtitulo: string | null
    objetivo: string | null
    categoriaServicio: string | null
    precioBase: number
    precioActualizadoEn: string
    items: PresupuestoItemDto[]
}

export type PlantillaInput = ChecklistNotas & HorasCobertura & {
    area?: string
    nombreInterno: string
    subtitulo?: string | null
    objetivo?: string | null
    categoriaServicio?: string | null
    precioBase: number
    items: ItemInput[]
}

export type PresupuestoPlanDto = HorasCobertura & {
    id: number
    plantillaOrigenId: number | null
    nombre: string
    objetivo: string | null
    precio: number
    orden: number
    incluirEnPdf: boolean
    items: PresupuestoItemDto[]
}

export type PlanInput = HorasCobertura & {
    plantillaOrigenId?: number | null
    nombre: string
    objetivo?: string | null
    precio: number
    incluirEnPdf: boolean
    items: ItemInput[]
}

export type PresupuestoEnfoquePilarDto = {
    id: number
    titulo: string
    descripcion: string | null
    orden: number
}

export type PilarInput = {
    titulo: string
    descripcion?: string | null
}

export type PresupuestoDto = ChecklistNotas & {
    id: number
    /** Número visible, ej. "0012". */
    numero: string
    area: string
    estado: EstadoPresupuesto
    /** BORRADOR/ENVIADO con la fecha de validez ya pasada. */
    vencido: boolean
    estadoActualizadoEn: string | null
    planAceptadoNombre: string | null
    montoAceptado: number | null
    proyectoId: number | null
    categoriaServicio: string | null
    clienteId: number
    clienteNombre: string
    fecha: string
    validaHasta: string | null
    enfoqueIntro: string | null
    enfoqueObjetivoGeneral: string | null
    pilares: PresupuestoEnfoquePilarDto[]
    itemsComunes: PresupuestoItemDto[]
    planes: PresupuestoPlanDto[]
    creadoPorId: number | null
    creadoPorNombre: string | null
    creadoEn: string
    actualizadoEn: string
}

export type PresupuestoInput = ChecklistNotas & {
    clienteId: number
    area?: Area
    categoriaServicio?: string | null
    fecha?: string | null
    validaHasta?: string | null
    plantillaIds?: number[]
    planes?: PlanInput[]
    itemsComunes?: ItemInput[]
    enfoqueIntro?: string | null
    enfoqueObjetivoGeneral?: string | null
    pilares?: PilarInput[]
}

// ─── Helper ─────────────────────────────────────────────────────────────────

async function unwrap<T>(
    res: { estado: boolean; error_mensaje: string | null; datos: T | null },
    label: string
): Promise<T> {
    if (!res.estado || res.datos === null) throw new Error(res.error_mensaje ?? `Error al ${label}`)
    return res.datos
}

const BASE = "/api/v1/presupuestos"

// ─── Catálogo ───────────────────────────────────────────────────────────────

export async function listarCatalogo(area = "MARKETING"): Promise<PresupuestoItemCatalogoDto[]> {
    const res = await apiFetchAuth<PresupuestoItemCatalogoDto[]>(`${BASE}/catalogo?area=${area}`)
    return unwrap(res, "listar el catálogo")
}

export async function sugerenciasCatalogo(q: string, area = "MARKETING"): Promise<PresupuestoItemCatalogoDto[]> {
    const res = await apiFetchAuth<PresupuestoItemCatalogoDto[]>(
        `${BASE}/catalogo/sugerencias?area=${area}&q=${encodeURIComponent(q)}`
    )
    return unwrap(res, "buscar sugerencias")
}

export async function crearItemCatalogo(body: { area?: string; categoria?: string | null; unidad: string }): Promise<PresupuestoItemCatalogoDto> {
    const res = await apiFetchAuth<PresupuestoItemCatalogoDto>(`${BASE}/catalogo`, { method: "POST", body })
    return unwrap(res, "crear el ítem de catálogo")
}

export async function borrarItemCatalogo(id: number): Promise<void> {
    const res = await apiFetchAuth<null>(`${BASE}/catalogo/${id}`, { method: "DELETE" })
    if (!res.estado) throw new Error(res.error_mensaje ?? "Error al borrar el ítem")
}

// ─── Plantillas ─────────────────────────────────────────────────────────────

export async function listarPlantillas(area = "MARKETING"): Promise<PresupuestoPlantillaDto[]> {
    const res = await apiFetchAuth<PresupuestoPlantillaDto[]>(`${BASE}/plantillas?area=${area}`)
    return unwrap(res, "listar las plantillas")
}

export async function crearPlantilla(body: PlantillaInput): Promise<PresupuestoPlantillaDto> {
    const res = await apiFetchAuth<PresupuestoPlantillaDto>(`${BASE}/plantillas`, { method: "POST", body })
    return unwrap(res, "crear la plantilla")
}

export async function editarPlantilla(id: number, body: PlantillaInput): Promise<PresupuestoPlantillaDto> {
    const res = await apiFetchAuth<PresupuestoPlantillaDto>(`${BASE}/plantillas/${id}`, { method: "PUT", body })
    return unwrap(res, "editar la plantilla")
}

export async function borrarPlantilla(id: number): Promise<void> {
    const res = await apiFetchAuth<null>(`${BASE}/plantillas/${id}`, { method: "DELETE" })
    if (!res.estado) throw new Error(res.error_mensaje ?? "Error al borrar la plantilla")
}

// ─── Presupuestos ───────────────────────────────────────────────────────────

export async function listarPresupuestos(opts?: { area?: string; clienteId?: number }): Promise<PresupuestoDto[]> {
    const params = new URLSearchParams()
    params.set("area", opts?.area ?? "MARKETING")
    if (opts?.clienteId) params.set("clienteId", String(opts.clienteId))
    const res = await apiFetchAuth<PresupuestoDto[]>(`${BASE}?${params.toString()}`)
    return unwrap(res, "listar los presupuestos")
}

export async function obtenerPresupuesto(id: number): Promise<PresupuestoDto> {
    const res = await apiFetchAuth<PresupuestoDto>(`${BASE}/${id}`)
    return unwrap(res, "obtener el presupuesto")
}

export async function crearPresupuesto(body: PresupuestoInput): Promise<PresupuestoDto> {
    const res = await apiFetchAuth<PresupuestoDto>(BASE, { method: "POST", body })
    return unwrap(res, "crear el presupuesto")
}

export async function editarPresupuesto(id: number, body: PresupuestoInput): Promise<PresupuestoDto> {
    const res = await apiFetchAuth<PresupuestoDto>(`${BASE}/${id}`, { method: "PUT", body })
    return unwrap(res, "editar el presupuesto")
}

export async function borrarPresupuesto(id: number): Promise<void> {
    const res = await apiFetchAuth<null>(`${BASE}/${id}`, { method: "DELETE" })
    if (!res.estado) throw new Error(res.error_mensaje ?? "Error al borrar el presupuesto")
}

/** Cambia el estado comercial. Para ACEPTADO, `planAceptadoId` = plan que eligió el cliente. */
export async function cambiarEstadoPresupuesto(
    id: number,
    estado: EstadoPresupuesto,
    planAceptadoId?: number | null
): Promise<PresupuestoDto> {
    const res = await apiFetchAuth<PresupuestoDto>(`${BASE}/${id}/estado`, {
        method: "PATCH",
        body: { estado, planAceptadoId: planAceptadoId ?? null },
    })
    return unwrap(res, "cambiar el estado")
}

/** Copia el presupuesto como borrador nuevo con fecha de hoy. */
export async function duplicarPresupuesto(id: number): Promise<PresupuestoDto> {
    const res = await apiFetchAuth<PresupuestoDto>(`${BASE}/${id}/duplicar`, { method: "POST" })
    return unwrap(res, "duplicar el presupuesto")
}

/** Crea un proyecto a partir del presupuesto y lo deja ACEPTADO y vinculado. */
export async function convertirPresupuestoAProyecto(
    id: number,
    body: { planId?: number | null; nombre?: string | null }
): Promise<PresupuestoDto> {
    const res = await apiFetchAuth<PresupuestoDto>(`${BASE}/${id}/proyecto`, { method: "POST", body })
    return unwrap(res, "crear el proyecto")
}

/** Si el backend respondió un error JSON ({ error_mensaje }), lo usa como mensaje. */
async function errorDesdeRespuesta(r: Response, fallback: string): Promise<Error> {
    try {
        const data = await r.json()
        if (data?.error_mensaje) return new Error(data.error_mensaje)
    } catch {
        // no era JSON
    }
    return new Error(fallback)
}

async function fetchPresupuestoPdfBlob(id: number, planIds?: number[]): Promise<{ blob: Blob; filename: string }> {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
    const apiKey = process.env.NEXT_PUBLIC_API_KEY ?? ""
    const token = getAccessToken()

    const query = planIds && planIds.length > 0 ? `?planes=${planIds.join(",")}` : ""
    const r = await fetch(`${apiBase}${BASE}/${id}/pdf${query}`, {
        headers: {
            "X-API-KEY": apiKey,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    })

    if (!r.ok) throw await errorDesdeRespuesta(r, "Error al generar el PDF")

    const blob = await r.blob()
    const disposition = r.headers.get("Content-Disposition") ?? ""
    const match = disposition.match(/filename="?([^"]+)"?/)
    return { blob, filename: match?.[1] ?? `Presupuesto_PRE-${String(id).padStart(4, "0")}.pdf` }
}

/** Descarga el PDF del presupuesto. Si se pasan planIds, solo esos planes entran al documento. */
export async function descargarPresupuestoPdf(id: number, planIds?: number[]): Promise<void> {
    const { blob, filename } = await fetchPresupuestoPdfBlob(id, planIds)
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    // Se revoca después de que el navegador arrancó la descarga (revocarlo en el acto puede cortarla).
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Genera el PDF y devuelve una object URL para previsualizarlo (ej. en un <iframe>). Acordate de revocarla cuando ya no se use. */
export async function previsualizarPresupuestoPdf(id: number, planIds?: number[]): Promise<string> {
    const { blob } = await fetchPresupuestoPdfBlob(id, planIds)
    return URL.createObjectURL(blob)
}

/**
 * Genera el PDF de un borrador SIN guardarlo — para previsualizar mientras se arma el presupuesto,
 * sin necesidad de crear/editar primero. Devuelve una object URL, acordate de revocarla al cerrar.
 */
export async function previsualizarBorradorPdf(body: PresupuestoInput): Promise<string> {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
    const apiKey = process.env.NEXT_PUBLIC_API_KEY ?? ""
    const token = getAccessToken()

    const r = await fetch(`${apiBase}${BASE}/pdf/preview`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    })

    if (!r.ok) throw await errorDesdeRespuesta(r, "Error al generar la vista previa")

    const blob = await r.blob()
    return URL.createObjectURL(blob)
}
