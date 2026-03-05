import type { MovimientoFinanciero } from "@/lib/finanzas"

export function money(moneda: string, value: number) {
    // Formato AR: xxx.xxx,cc (con símbolo de moneda)
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: moneda,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value)
}

export function numberAR(value: number) {
    return new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: 2,
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

export function direccionColor(m: MovimientoFinanciero) {
    if (m.esReversa) return "text-amber-600"
    if (m.direccion === 1) return "text-emerald-600"
    if (m.direccion === 2) return "text-red-600"
    return "text-muted-foreground"
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

export function estadoDotClass(m: MovimientoFinanciero) {
    if (m.esReversa) return "bg-amber-500"

    switch (m.estado) {
        case 2:
        case 4:
            return "bg-emerald-500"
        case 1:
            return "bg-amber-500"
        case 3:
            return "bg-red-500"
        default:
            return "bg-muted-foreground"
    }
}

export function estadoTextClass(m: MovimientoFinanciero) {
    if (m.esReversa) return "text-amber-700"

    switch (m.estado) {
        case 2:
        case 4:
            return "text-emerald-700"
        case 1:
            return "text-amber-700"
        case 3:
            return "text-red-700"
        default:
            return "text-muted-foreground"
    }
}