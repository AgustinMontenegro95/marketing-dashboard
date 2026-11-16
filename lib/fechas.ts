/**
 * Helpers para fechas "de calendario" (YYYY-MM-DD, sin hora) como las que manda el backend
 * en campos LocalDate.
 *
 * Ojo: `new Date("2026-11-16")` se interpreta como medianoche UTC, que en Argentina (UTC-3)
 * es el 15/11 a las 21 hs → se mostraba un día antes. Y `toISOString()` devuelve la fecha UTC,
 * que después de las 21 hs locales ya es "mañana". Estos helpers trabajan siempre en hora local.
 */

function pad(n: number): string {
    return String(n).padStart(2, "0")
}

/** Date local → "YYYY-MM-DD" (sin pasar por UTC). */
export function toISODateLocal(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** "YYYY-MM-DD" → Date a medianoche local. */
export function parseISODateLocal(iso: string): Date {
    const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
    return new Date(y, (m ?? 1) - 1, d ?? 1)
}

/** Fecha de hoy (local) como "YYYY-MM-DD". */
export function hoyISO(): string {
    return toISODateLocal(new Date())
}

/** Suma días a una fecha "YYYY-MM-DD" y devuelve otra "YYYY-MM-DD". */
export function sumarDiasISO(iso: string, dias: number): string {
    const d = parseISODateLocal(iso)
    d.setDate(d.getDate() + dias)
    return toISODateLocal(d)
}

/** "YYYY-MM-DD" → "16/11/2026". Tolera null/vacío. */
export function formatFecha(iso: string | null | undefined): string {
    if (!iso) return "—"
    return parseISODateLocal(iso).toLocaleDateString("es-AR")
}
