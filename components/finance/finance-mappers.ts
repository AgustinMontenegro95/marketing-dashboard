import type { MovimientoFinanciero } from "@/lib/finanzas"

export function money(moneda: string, value: number) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: moneda,
        maximumFractionDigits: 2,
    }).format(value)
}

export function monthLabel(yyyyMM: string) {
    const [y, m] = yyyyMM.split("-").map(Number)
    const d = new Date(y, (m ?? 1) - 1, 1)
    return d.toLocaleDateString("es-AR", { month: "short" }).replace(".", "")
}

export function mapDireccionToType(m: MovimientoFinanciero) {
    if (m.esReversa) return "Reversa" as const
    if (m.direccion === 1) return "Ingreso" as const
    if (m.direccion === 2) return "Egreso" as const
    return "Egreso" as const
}

export function mapEstadoToStatus(m: MovimientoFinanciero) {
    // estado: 1 borrador, 2 confirmado, 3 anulado, 4 conciliado
    if (m.esReversa) return "Reversado" as const

    switch (m.estado) {
        case 2:
            return "Confirmado" as const
        case 4:
            return "Confirmado" as const
        case 3:
            return "Reversado" as const
        case 1:
        default:
            return "Pendiente" as const
    }
}