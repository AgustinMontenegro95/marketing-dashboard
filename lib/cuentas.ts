// lib/cuentas.ts
// Cuentas financieras (Banco, billetera, caja…), sus saldos, transferencias entre cuentas y conciliación.
import { apiFetchAuth } from "@/lib/api"
import type { FinanzasCuenta, PageResponse } from "@/lib/finanzas"

export type { FinanzasCuenta }

/** Tipos de cuenta (ver CuentaFinanciera.java en el backend). */
export const TIPOS_CUENTA: { value: number; label: string }[] = [
    { value: 1, label: "Banco" },
    { value: 2, label: "Billetera virtual" },
    { value: 3, label: "Caja / efectivo" },
    { value: 4, label: "Tarjeta de crédito" },
    { value: 5, label: "Otra" },
]

export function tipoCuentaLabel(tipo: number | null | undefined): string {
    return TIPOS_CUENTA.find((t) => t.value === tipo)?.label ?? "—"
}

export const MONEDAS = ["ARS", "USD"] as const

async function unwrap<T>(p: Promise<{ estado: boolean; error_mensaje: string | null; datos: T | null }>, msg: string): Promise<T> {
    const r = await p
    if (!r.estado || r.datos === null || r.datos === undefined) throw new Error(r.error_mensaje ?? msg)
    return r.datos
}

// ─── Cuentas ────────────────────────────────────────────────────────────────

export type CuentaSaldo = {
    cuentaId: number
    nombre: string
    moneda: string
    saldoInicial: number
    /** Ingresos confirmados + conciliados. */
    ingresos: number
    /** Egresos confirmados + conciliados. */
    egresos: number
    saldoActual: number
}

export type CuentasResumen = {
    cuentas: CuentaSaldo[]
    totalPorMoneda: Record<string, number>
}

export type CuentaFormReq = {
    nombre: string
    tipo: number
    moneda: string
    saldoInicial: number
    notas: string | null
}

export type CuentaUpdateReq = CuentaFormReq & { activo: boolean }

/** Todas las cuentas (activas e inactivas), para tener tipo/notas/activo que el resumen no trae. */
export function listarCuentas(): Promise<FinanzasCuenta[]> {
    return unwrap(
        apiFetchAuth<PageResponse<FinanzasCuenta>>("/api/v1/finanzas/cuentas/buscar", {
            method: "POST",
            body: { q: null, tipo: null, moneda: null, activo: null, page: 0, size: 200 },
        }),
        "No se pudieron cargar las cuentas"
    ).then((p) => p.contenido ?? [])
}

/** Saldos de todas las cuentas + total por moneda. */
export function getCuentasResumen(soloActivas: boolean | null = null): Promise<CuentasResumen> {
    const qs = soloActivas === null ? "" : `?soloActivas=${soloActivas}`
    return unwrap(apiFetchAuth<CuentasResumen>(`/api/v1/finanzas/cuentas/resumen${qs}`), "No se pudieron cargar los saldos")
}

export function getCuentaSaldo(id: number): Promise<CuentaSaldo> {
    return unwrap(apiFetchAuth<CuentaSaldo>(`/api/v1/finanzas/cuentas/${id}/saldo`), "No se pudo obtener el saldo")
}

export function crearCuenta(body: CuentaFormReq): Promise<FinanzasCuenta> {
    return unwrap(apiFetchAuth<FinanzasCuenta>("/api/v1/finanzas/cuentas", { method: "POST", body }), "No se pudo crear la cuenta")
}

export function editarCuenta(id: number, body: CuentaUpdateReq): Promise<FinanzasCuenta> {
    return unwrap(apiFetchAuth<FinanzasCuenta>(`/api/v1/finanzas/cuentas/${id}`, { method: "PUT", body }), "No se pudo editar la cuenta")
}

/** Baja lógica (activo=false). Los movimientos se conservan. */
export function desactivarCuenta(id: number): Promise<FinanzasCuenta> {
    return unwrap(apiFetchAuth<FinanzasCuenta>(`/api/v1/finanzas/cuentas/${id}`, { method: "DELETE" }), "No se pudo desactivar la cuenta")
}

// ─── Transferencias ─────────────────────────────────────────────────────────

export type Transferencia = {
    referenciaExterna: string
    fecha: string
    moneda: string
    monto: number
    /** Estado de los movimientos base: 1 borrador, 2 confirmado, 3 anulado, 4 conciliado. */
    estado: number | null
    cuentaOrigenId: number
    cuentaDestinoId: number
    movimientoEgresoId: number | null
    movimientoIngresoId: number | null
}

export type CrearTransferenciaReq = {
    cuentaOrigenId: number
    cuentaDestinoId: number
    fecha: string | null
    monto: number
    moneda: string
    concepto: string | null
    descripcion: string | null
    /** 1 borrador, 2 confirmado (default). */
    estado: 1 | 2
}

export type BuscarTransferenciasReq = {
    cuentaOrigenId?: number | null
    cuentaDestinoId?: number | null
    fechaDesde?: string | null
    fechaHasta?: string | null
    moneda?: string | null
    page: number
    size: number
}

export function crearTransferencia(body: CrearTransferenciaReq) {
    return unwrap(
        apiFetchAuth<{ referenciaExterna: string }>("/api/v1/finanzas/transferencias", { method: "POST", body }),
        "No se pudo crear la transferencia"
    )
}

export function buscarTransferencias(body: BuscarTransferenciasReq): Promise<PageResponse<Transferencia>> {
    return unwrap(
        apiFetchAuth<PageResponse<Transferencia>>("/api/v1/finanzas/transferencias/buscar", { method: "POST", body }),
        "No se pudieron cargar las transferencias"
    )
}

/** Reversa los dos movimientos de la transferencia (crea movimientos opuestos). */
export function reversarTransferencia(referencia: string) {
    return unwrap(
        apiFetchAuth<unknown[]>(`/api/v1/finanzas/transferencias/${encodeURIComponent(referencia)}/reversa`, { method: "POST" }),
        "No se pudo reversar la transferencia"
    )
}

// ─── Conciliación ───────────────────────────────────────────────────────────

/** Confirmado (2) → Conciliado (4). */
export function conciliarMovimiento(id: number) {
    return unwrap(apiFetchAuth(`/api/v1/finanzas/movimientos/${id}/conciliar`, { method: "POST" }), "No se pudo conciliar el movimiento")
}

/** Conciliado (4) → Confirmado (2). */
export function desconciliarMovimiento(id: number) {
    return unwrap(apiFetchAuth(`/api/v1/finanzas/movimientos/${id}/desconciliar`, { method: "POST" }), "No se pudo desconciliar el movimiento")
}
