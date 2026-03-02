// lib/finanzas.ts
import { apiFetchAuth } from "@/lib/api"

export type PageResponse<T> = {
    contenido: T[]
    page: number
    size: number
    totalElementos: number
    totalPaginas: number
}

/** ========== DASHBOARD ========== */
export type FinanzasDashboardRequest = {
    fechaDesde: string | null
    fechaHasta: string | null
    cuentaId: number | null
    moneda: string
    meses: number
    topCategorias: number
    ultimosMovimientos: number
}

export type FinanzasKpisMesActual = {
    desde: string
    hasta: string
    moneda: string
    ingresos: number
    egresos: number
    reversas: number
    neto: number
}

export type FinanzasPorMes = {
    mes: string // "YYYY-MM"
    moneda: string
    ingresos: number
    egresos: number
    neto: number
}

/** OJO: este es el tipo correcto que usa el dashboard */
export type MovimientoFinanciero = {
    id: number
    codigo: string
    cuentaId: number
    cuentaNombre: string
    fecha: string
    direccion: 1 | 2 | 3
    estado: 1 | 2 | 3 | 4
    categoriaId: number | null
    categoriaNombre: string | null
    concepto: string
    descripcion: string
    clienteId: number | null
    proyectoId: number | null
    facturaId: number | null
    monto: number
    moneda: string
    esReversa: boolean
    movimientoOrigenId: number | null
    referenciaExterna: string | null
    creadoEn: string
    actualizadoEn: string
}

export type FinanzasDashboardResponse = {
    kpisMesActual: FinanzasKpisMesActual
    porMes: FinanzasPorMes[]
    ultimosMovimientos: MovimientoFinanciero[]
}

export async function fetchFinanzasDashboard(
    body: FinanzasDashboardRequest
): Promise<FinanzasDashboardResponse> {
    const r = await apiFetchAuth<FinanzasDashboardResponse>("/api/v1/finanzas/dashboard", {
        method: "POST",
        body,
    })

    if (!r.estado || !r.datos) {
        throw new Error(r.error_mensaje ?? "No se pudo cargar el dashboard de finanzas")
    }
    return r.datos
}

/** ========== CUENTAS ========== */
export type FinanzasCuenta = {
    id: number
    nombre: string
    tipo: number
    moneda: string
    saldoInicial: number
    activo: boolean
    notas: string | null
    creadoEn: string
}

export type BuscarCuentasReq = {
    q: string
    tipo: number | null
    moneda: string | null
    activo: boolean | null
    page: number
    size: number
}

export async function buscarCuentas(body: BuscarCuentasReq): Promise<PageResponse<FinanzasCuenta>> {
    const r = await apiFetchAuth<PageResponse<FinanzasCuenta>>("/api/v1/finanzas/cuentas/buscar", {
        method: "POST",
        body,
    })

    if (!r.estado || !r.datos) {
        throw new Error(r.error_mensaje ?? "No se pudieron cargar las cuentas")
    }
    return r.datos
}

/** ========== CATEGORÍAS ========== */
export type FinanzasCategoria = {
    id: number
    nombre: string
    direccionDefecto: 1 | 2 | null
    parentId: number | null
    activa: boolean
}

export type BuscarCategoriasReq = {
    q: string
    direccionDefecto: 1 | 2 | null
    parentId: number | null
    activa: boolean | null
    page: number
    size: number
}

export async function buscarCategorias(
    body: BuscarCategoriasReq
): Promise<PageResponse<FinanzasCategoria>> {
    const r = await apiFetchAuth<PageResponse<FinanzasCategoria>>("/api/v1/finanzas/categorias/buscar", {
        method: "POST",
        body,
    })

    if (!r.estado || !r.datos) {
        throw new Error(r.error_mensaje ?? "No se pudieron cargar las categorías")
    }
    return r.datos
}

/** ========== CREAR MOVIMIENTO ========== */
export type CrearMovimientoReq = {
    cuentaId: number
    fecha: string // YYYY-MM-DD
    direccion: 1 | 2
    estado: 1 | 2 | 3 | 4
    categoriaId: number | null
    concepto: string
    descripcion: string
    clienteId: number | null
    proyectoId: number | null
    facturaId: number | null
    monto: number
    moneda: string
    creadoPorId: number | null
}

export async function crearMovimientoFinanciero(body: CrearMovimientoReq) {
    const r = await apiFetchAuth<any>("/api/v1/finanzas/movimientos", {
        method: "POST",
        body,
    })

    if (!r.estado) {
        throw new Error(r.error_mensaje ?? "No se pudo crear el movimiento")
    }
    return r.datos
}

// ===============================
// Cache refs (cuentas/categorías)
// ===============================

const FIN_REFS_CACHE_KEY = "fin_refs_cache_v1"
const FIN_LAST_SEL_KEY = "fin_refs_last_selection_v1"

// TTL: 10 minutos (ajustalo a gusto)
const FIN_REFS_TTL_MS = 10 * 60 * 1000

type FinanzasRefsCache = {
    savedAt: number
    moneda: string | null
    cuentas: FinanzasCuenta[]
    categorias: FinanzasCategoria[]
}

export type FinanzasLastSelection = {
    cuentaId?: number
    categoriaId?: number
}

/** solo browser */
function isBrowser() {
    return typeof window !== "undefined"
}

/** Lee cache (memoria/localStorage) y valida TTL + moneda */
export function getFinanzasRefsCache(moneda: string | null): FinanzasRefsCache | null {
    if (!isBrowser()) return null
    try {
        const raw = localStorage.getItem(FIN_REFS_CACHE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw) as FinanzasRefsCache
        if (!parsed?.savedAt) return null

        const fresh = Date.now() - parsed.savedAt <= FIN_REFS_TTL_MS
        if (!fresh) return null

        // Si tu UI depende de moneda, validamos (si no te importa, podés quitar esto)
        if (moneda && parsed.moneda && parsed.moneda !== moneda) return null

        return parsed
    } catch {
        return null
    }
}

export function setFinanzasRefsCache(cache: FinanzasRefsCache) {
    if (!isBrowser()) return
    localStorage.setItem(FIN_REFS_CACHE_KEY, JSON.stringify(cache))
}

export function clearFinanzasRefsCache() {
    if (!isBrowser()) return
    localStorage.removeItem(FIN_REFS_CACHE_KEY)
}

/** Última selección (para no pedir cada vez) */
export function getFinanzasLastSelection(): FinanzasLastSelection {
    if (!isBrowser()) return {}
    try {
        const raw = localStorage.getItem(FIN_LAST_SEL_KEY)
        if (!raw) return {}
        const parsed = JSON.parse(raw) as FinanzasLastSelection
        return parsed ?? {}
    } catch {
        return {}
    }
}

export function setFinanzasLastSelection(sel: FinanzasLastSelection) {
    if (!isBrowser()) return
    localStorage.setItem(FIN_LAST_SEL_KEY, JSON.stringify(sel))
}

/**
 * Carga refs usando cache (si está fresco) o pega al backend (si no hay cache).
 * Devuelve siempre listas para pintar selects.
 */
export async function getFinanzasRefs(moneda: string): Promise<{
    cuentas: FinanzasCuenta[]
    categorias: FinanzasCategoria[]
    fromCache: boolean
}> {
    // 1) cache
    const cached = getFinanzasRefsCache(moneda)
    if (cached) {
        return { cuentas: cached.cuentas, categorias: cached.categorias, fromCache: true }
    }

    // 2) backend
    const cuentasRes = await buscarCuentas({
        q: "",
        tipo: null,
        moneda,
        activo: true,
        page: 0,
        size: 50,
    })

    const catsRes = await buscarCategorias({
        q: "",
        direccionDefecto: null,
        parentId: null,
        activa: true,
        page: 0,
        size: 100,
    })

    const cuentas = cuentasRes.contenido ?? []
    const categorias = catsRes.contenido ?? []

    // guardo cache
    setFinanzasRefsCache({
        savedAt: Date.now(),
        moneda,
        cuentas,
        categorias,
    })

    return { cuentas, categorias, fromCache: false }
}