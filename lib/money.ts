// Formato de dinero unificado: 1.234.567,89 (miles con punto, centavos con coma, siempre 2 decimales).
// Se implementa a mano para no depender del ICU del navegador/servidor (evita diferencias de hidratación
// y el caso de es-* que no agrupa números de 4 dígitos).

const CURRENCY_SYMBOLS: Record<string, string> = {
  ARS: "$",
  USD: "US$",
  EUR: "€",
}

/** 1234567.891 -> "1.234.567,89" */
export function formatAmount(n: number | null | undefined, decimals = 2): string {
  const value = Number(n)
  if (n == null || !Number.isFinite(value)) return "0," + "0".repeat(decimals)
  const fixed = Math.abs(value).toFixed(decimals)
  const [intPart, decPart] = fixed.split(".")
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  const result = decPart ? `${grouped},${decPart}` : grouped
  return value < 0 && Number(fixed) !== 0 ? `-${result}` : result
}

/** 1234.5 -> "$ 1.234,50" ; (1234.5, "USD") -> "US$ 1.234,50" */
export function formatMoney(n: number | null | undefined, moneda: string = "ARS"): string {
  const symbol = CURRENCY_SYMBOLS[moneda?.toUpperCase?.() ?? "ARS"] ?? moneda
  const formatted = formatAmount(n)
  return formatted.startsWith("-") ? `-${symbol} ${formatted.slice(1)}` : `${symbol} ${formatted}`
}

/**
 * Texto tipeado por el usuario -> string crudo parseable por Number() ("1234.5", "1234.", "").
 * La coma es el separador decimal; los puntos se toman como separador de miles.
 */
export function parseMoneyInput(text: string): string {
  const s = text.replace(/[^\d,.-]/g, "")
  const commaIdx = s.lastIndexOf(",")
  if (commaIdx !== -1) {
    const intPart = s.slice(0, commaIdx).replace(/\D/g, "")
    const decPart = s.slice(commaIdx + 1).replace(/\D/g, "").slice(0, 2)
    return `${intPart || (decPart ? "0" : "")}.${decPart}`
  }
  // Punto al final = punto del teclado numérico: empieza la parte decimal
  if (s.endsWith(".")) return `${s.replace(/\D/g, "")}.`
  // El resto de los puntos son separadores de miles
  return s.replace(/\D/g, "")
}

/** String crudo ("1234.5") -> texto para mostrar mientras se edita ("1.234,5") */
export function formatMoneyInput(raw: string | number | null | undefined): string {
  if (raw == null || raw === "") return ""
  const str = typeof raw === "number" ? (Number.isFinite(raw) ? String(raw) : "") : raw
  if (!str) return ""
  const [intPart, decPart] = str.split(".")
  const grouped = (intPart || "").replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return decPart !== undefined ? `${grouped || "0"},${decPart.slice(0, 2)}` : grouped
}

/** Número -> texto con 2 decimales para precargar un input ("1.234,50") */
export function numberToMoneyInput(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(Number(n))) return ""
  return formatAmount(n)
}

/** Texto con formato ("1.234,50") -> número (1234.5); NaN si está vacío o es inválido */
export function moneyInputToNumber(text: string): number {
  const raw = parseMoneyInput(text)
  return raw === "" ? NaN : Number(raw)
}
