"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"
import { formatAmount, formatMoneyInput, parseMoneyInput } from "@/lib/money"

type MoneyInputProps = Omit<React.ComponentProps<"input">, "value" | "onChange" | "type" | "defaultValue"> & {
  /** Valor crudo parseable por Number(): "1234.5", 1234.5, "" o null */
  value: string | number | null | undefined
  /** Recibe el valor crudo ("1234.5", "" si está vacío) */
  onValueChange: (raw: string) => void
}

function toRaw(value: string | number | null | undefined): string {
  if (value == null) return ""
  return typeof value === "number" ? (Number.isFinite(value) ? String(value) : "") : value
}

/**
 * Input de montos con formato 1.234.567,89 mientras se escribe.
 * Externamente trabaja con el valor crudo, así la lógica de guardado sigue usando Number(valor).
 */
const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onValueChange, onBlur, placeholder = "0,00", ...props }, ref) => {
    const raw = toRaw(value)
    const [display, setDisplay] = React.useState(() => (raw ? formatAmount(Number(raw)) : ""))

    // Sincroniza cuando el valor cambia desde afuera (reset del form, precarga, etc.)
    React.useEffect(() => {
      const current = parseMoneyInput(display)
      if (Number(current || 0) !== Number(raw || 0)) {
        setDisplay(raw ? formatAmount(Number(raw)) : "")
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [raw])

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        value={display}
        onChange={(e) => {
          const next = parseMoneyInput(e.target.value)
          setDisplay(formatMoneyInput(next))
          onValueChange(next.endsWith(".") ? next.slice(0, -1) : next)
        }}
        onBlur={(e) => {
          const next = parseMoneyInput(display)
          if (next !== "" && Number.isFinite(Number(next))) setDisplay(formatAmount(Number(next)))
          onBlur?.(e)
        }}
      />
    )
  },
)
MoneyInput.displayName = "MoneyInput"

export { MoneyInput }
