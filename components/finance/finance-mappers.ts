export function monthLabel(yyyyMm: string) {
    const [y, m] = yyyyMm.split("-").map(Number)
    const d = new Date(y, (m ?? 1) - 1, 1)
    return new Intl.DateTimeFormat("es-AR", { month: "short", year: "numeric" }).format(d)
}

export function formatDateOnlyAR(iso?: string | null): string {
    if (!iso) return "-"

    // LocalDate "YYYY-MM-DD" => fecha local SIN shift UTC
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        const [y, m, d] = iso.split("-").map(Number)
        const local = new Date(y, (m ?? 1) - 1, d ?? 1)
        return new Intl.DateTimeFormat("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(local)
    }

    const dt = new Date(iso)
    if (Number.isNaN(dt.getTime())) return "-"
    return new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(dt)
}

export function formatDateTimeAR(iso?: string | null): string {
    if (!iso) return "-"
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return "-"

    const date = new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(d)

    const time = new Intl.DateTimeFormat("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).format(d)

    return `${date} ${time} hs`
}

export function money(moneda: string, amount: number) {
    try {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: moneda || "ARS",
            currencyDisplay: "symbol",
        }).format(amount ?? 0)
    } catch {
        return `${moneda ?? "ARS"} ${amount ?? 0}`
    }
}

export function mapDireccionToType(m: { esReversa: boolean; direccion: number }) {
    if (m.esReversa) return "Reversa" as const
    return m.direccion === 1 ? ("Ingreso" as const) : ("Egreso" as const)
}

export function mapEstadoToStatus(m: { estado: number; esReversa: boolean }) {
    if (m.esReversa) return "Reversado" as const
    return m.estado === 1 ? ("Pendiente" as const) : ("Confirmado" as const)
}