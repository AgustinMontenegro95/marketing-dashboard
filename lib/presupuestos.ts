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

export type ChecklistNotas = {
    validezMeses: number
    actualizaPrecio: boolean
    actualizaPorcentaje: number | null
    actualizaCadaMeses: number | null
    incluyeHorasCobertura: boolean
    horasCobertura: number | null
    pedirLogoVectorizado: boolean
    aclararFactura: boolean
    notasLibres: string | null
}

export type PresupuestoPlantillaDto = ChecklistNotas & {
    id: number
    area: string
    nombreInterno: string
    subtitulo: string | null
    objetivo: string | null
    precioBase: number
    precioActualizadoEn: string
    items: PresupuestoItemDto[]
}

export type PlantillaInput = ChecklistNotas & {
    area?: string
    nombreInterno: string
    subtitulo?: string | null
    objetivo?: string | null
    precioBase: number
    items: ItemInput[]
}

export type PresupuestoPlanDto = {
    id: number
    plantillaOrigenId: number | null
    nombre: string
    objetivo: string | null
    precio: number
    orden: number
    incluirEnPdf: boolean
    items: PresupuestoItemDto[]
}

export type PlanInput = {
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
    clienteId: number
    clienteNombre: string
    fecha: string
    validaHasta: string | null
    enfoqueIntro: string | null
    enfoqueObjetivoGeneral: string | null
    pilares: PresupuestoEnfoquePilarDto[]
    planes: PresupuestoPlanDto[]
    creadoPorId: number | null
    creadoPorNombre: string | null
    creadoEn: string
    actualizadoEn: string
}

export type PresupuestoInput = ChecklistNotas & {
    clienteId: number
    fecha?: string | null
    validaHasta?: string | null
    plantillaIds?: number[]
    planes?: PlanInput[]
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

const BASE = "/api/v1/marketing/presupuestos"

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

/** Descarga el PDF del presupuesto. Si se pasan planIds, solo esos planes entran al documento. */
export async function descargarPresupuestoPdf(id: number, planIds?: number[]): Promise<void> {
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
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const disposition = r.headers.get("Content-Disposition") ?? ""
    const match = disposition.match(/filename="?([^"]+)"?/)
    a.download = match?.[1] ?? `presupuesto_${id}.pdf`
    a.click()
    URL.revokeObjectURL(url)
}
