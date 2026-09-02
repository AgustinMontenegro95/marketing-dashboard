import { apiFetchAuth } from "@/lib/api"
import { getAccessToken } from "@/lib/session"

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type Frecuencia = "SEMANAL" | "QUINCENAL" | "MENSUAL" | "UNICA"
export type OrigenCatalogo = "CURADO" | "USO"

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
    area: string
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

    if (!r.ok) throw new Error("Error al generar el PDF")

    const blob = await r.blob()
    const disposition = r.headers.get("Content-Disposition") ?? ""
    const match = disposition.match(/filename="?([^"]+)"?/)
    return { blob, filename: match?.[1] ?? `presupuesto_${id}.pdf` }
}

/** Descarga el PDF del presupuesto. Si se pasan planIds, solo esos planes entran al documento. */
export async function descargarPresupuestoPdf(id: number, planIds?: number[]): Promise<void> {
    const { blob, filename } = await fetchPresupuestoPdfBlob(id, planIds)
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
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

    if (!r.ok) throw new Error("Error al generar la vista previa")

    const blob = await r.blob()
    return URL.createObjectURL(blob)
}
