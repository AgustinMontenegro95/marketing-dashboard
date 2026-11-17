// Exportación de movimientos financieros a CSV para Excel (configuración regional argentina).
// Se arma en el navegador: se piden TODAS las páginas de /movimientos/buscar con los filtros elegidos.

import { buscarMovimientos, type BuscarMovimientosReq, type MovimientoFinanciero } from "@/lib/finanzas"

export type ExportFiltros = Omit<BuscarMovimientosReq, "page" | "size">

export type ExportOpciones = {
    /** Incluir movimientos anulados (estado 3). Por defecto no: no suman a ningún saldo. */
    incluirAnulados?: boolean
    /** Progreso de la descarga: cargados / total. */
    onProgress?: (cargados: number, total: number) => void
}

/** Máximo que acepta el backend (MovimientosSearchRequest: @Max(200)). */
const PAGE_SIZE = 200
/** Tope de seguridad para no colgar el navegador. */
const MAX_FILAS = 50_000

const ESTADOS: Record<number, string> = { 1: "Borrador", 2: "Confirmado", 3: "Anulado", 4: "Conciliado" }
const DIRECCIONES: Record<number, string> = { 1: "Ingreso", 2: "Egreso", 3: "Transferencia" }

/** Trae todas las páginas que cumplen los filtros. */
export async function traerTodosLosMovimientos(filtros: ExportFiltros, onProgress?: ExportOpciones["onProgress"]) {
    const filas: MovimientoFinanciero[] = []
    let page = 0
    let total = 0
    for (;;) {
        const res = await buscarMovimientos({ ...filtros, page, size: PAGE_SIZE })
        total = res.totalElementos ?? 0
        filas.push(...(res.contenido ?? []))
        onProgress?.(filas.length, total)
        page++
        if (page >= (res.totalPaginas ?? 0) || (res.contenido ?? []).length === 0) break
        if (filas.length >= MAX_FILAS) {
            throw new Error(`Son más de ${MAX_FILAS.toLocaleString("es-AR")} movimientos. Acotá el período o filtrá por cuenta.`)
        }
    }
    return filas
}

/** Número para Excel en es-AR: sin separador de miles y con coma decimal (ej. 1234567,89). */
function num(n: number | null | undefined): string {
    if (n == null || !Number.isFinite(n)) return ""
    return n.toFixed(2).replace(".", ",")
}

/** "2026-11-17" → "17/11/2026" (Excel lo reconoce como fecha en es-AR). */
function fecha(iso: string | null | undefined): string {
    if (!iso) return ""
    const [y, m, d] = iso.slice(0, 10).split("-")
    return y && m && d ? `${d}/${m}/${y}` : iso
}

/** Escapa un campo CSV y neutraliza fórmulas (=, +, -, @) para que Excel no las ejecute. */
function campo(v: unknown): string {
    let s = v == null ? "" : String(v)
    if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(,\d+)?$/.test(s)) s = `'${s}`
    if (/[;"\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`
    return s
}

const COLUMNAS = [
    "Código", "Fecha", "Tipo", "Estado", "Cuenta", "Categoría", "Concepto", "Descripción",
    "Cliente", "Proyecto", "Disciplina", "Moneda", "Ingreso", "Egreso", "Monto (con signo)",
    "Es reversa", "Reversa de", "Referencia externa", "Cargado por", "Cargado el",
]

function fila(m: MovimientoFinanciero): string[] {
    const ingreso = m.direccion === 1 ? m.monto : null
    const egreso = m.direccion === 2 ? m.monto : null
    const conSigno = m.direccion === 1 ? m.monto : m.direccion === 2 ? -m.monto : 0
    const proyecto = [m.proyectoCodigo, m.proyectoNombre].filter(Boolean).join(" · ")
    return [
        m.codigo, fecha(m.fecha), DIRECCIONES[m.direccion] ?? "", ESTADOS[m.estado] ?? "",
        m.cuentaNombre ?? "", m.categoriaNombre ?? "", m.concepto ?? "", m.descripcion ?? "",
        m.clienteNombre ?? "", proyecto, m.disciplinaNombre ?? "", m.moneda ?? "",
        num(ingreso), num(egreso), num(conSigno),
        m.esReversa ? "Sí" : "No", m.movimientoOrigenCodigo ?? "", m.referenciaExterna ?? "",
        m.creadoPorNombre ?? "", fecha(m.creadoEn),
    ].map(campo)
}

export function movimientosACsv(movs: MovimientoFinanciero[]): string {
    // "sep=;" fuerza a Excel a usar punto y coma aunque la configuración regional diga otra cosa.
    const lineas = ["sep=;", COLUMNAS.map(campo).join(";"), ...movs.map((m) => fila(m).join(";"))]
    return lineas.join("\r\n")
}

function descargar(contenido: string, nombre: string) {
    // BOM para que Excel lea bien los acentos (UTF-8).
    const blob = new Blob(["﻿" + contenido], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = nombre
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Descarga el CSV. Devuelve la cantidad de movimientos exportados. */
export async function exportarMovimientosCsv(filtros: ExportFiltros, opciones: ExportOpciones = {}): Promise<number> {
    let movs = await traerTodosLosMovimientos(filtros, opciones.onProgress)
    if (!opciones.incluirAnulados && filtros.estado !== 3) movs = movs.filter((m) => m.estado !== 3)

    // Cronológico (el backend devuelve del más nuevo al más viejo por id).
    movs.sort((a, b) => (a.fecha ?? "").localeCompare(b.fecha ?? "") || a.id - b.id)

    const periodo = [filtros.fechaDesde, filtros.fechaHasta].filter(Boolean).join("_a_") || "todo"
    descargar(movimientosACsv(movs), `movimientos_${filtros.moneda ?? "todas"}_${periodo}.csv`)
    return movs.length
}
