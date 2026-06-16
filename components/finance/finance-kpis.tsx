"use client"

import { useEffect, useRef, useMemo, useState } from "react"
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  const displayedRef = useRef(0)

  useEffect(() => {
    const from = displayedRef.current
    const to = Number(target ?? 0)

    if (from === to) return

    if (duration <= 0) {
      displayedRef.current = to
      setValue(to)
      return
    }

    let frame = 0
    let start: number | null = null

    const animate = (timestamp: number) => {
      if (start === null) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const next = from + (to - from) * eased

      displayedRef.current = next
      setValue(next)

      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      } else {
        displayedRef.current = to
        setValue(to)
      }
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}

function AnimatedMoney({
  value,
  className,
  duration,
}: {
  value: number
  className?: string
  duration?: number
}) {
  const animated = useCountUp(value, duration)

  const text = useMemo(() => {
    const fmt = new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(animated)
    return `$ ${fmt}`
  }, [animated])

  return <div className={className}>{text}</div>
}

export function FinanceKpis({
  totalIncome,
  totalExpenses,
  totalReversals,
  netBalance,
  duration = 900,
}: {
  totalIncome: number
  totalExpenses: number
  totalReversals: number
  netBalance: number
  duration?: number
}) {
  const netClass =
    netBalance > 0 ? "text-emerald-600" : netBalance < 0 ? "text-red-600" : "text-foreground"

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos</CardTitle>
          <ArrowUpRight className="size-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <AnimatedMoney
            value={totalIncome}
            duration={duration}
            className="text-lg sm:text-2xl font-bold font-mono text-emerald-600"
          />
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Egresos</CardTitle>
          <ArrowDownLeft className="size-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <AnimatedMoney
            value={totalExpenses}
            duration={duration}
            className="text-lg sm:text-2xl font-bold font-mono text-red-600"
          />
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Reversas</CardTitle>
          <RefreshCw className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <AnimatedMoney
            value={totalReversals}
            duration={duration}
            className="text-lg sm:text-2xl font-bold font-mono"
          />
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Balance neto</CardTitle>
          <Wallet className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <AnimatedMoney
            value={netBalance}
            duration={duration}
            className={`text-lg sm:text-2xl font-bold font-mono ${netClass}`}
          />
        </CardContent>
      </Card>
    </div>
  )
}
