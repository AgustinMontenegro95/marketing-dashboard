"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let frame = 0
    let start: number | null = null

    const from = 0
    const to = Number(target ?? 0)

    const animate = (timestamp: number) => {
      if (start === null) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)

      const eased = 1 - Math.pow(1 - progress, 3)
      const next = from + (to - from) * eased

      setValue(next)

      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      } else {
        setValue(to)
      }
    }

    setValue(0)
    frame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}

function AnimatedMoney({ value, className }: { value: number; className?: string }) {
  const animated = useCountUp(value)

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
  periodLabel,
}: {
  totalIncome: number
  totalExpenses: number
  totalReversals: number
  netBalance: number
  periodLabel?: string
}) {
  const netClass =
    netBalance > 0 ? "text-emerald-600" : netBalance < 0 ? "text-red-600" : "text-foreground"

  const suffix = periodLabel ? ` (${periodLabel})` : ""

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos{suffix}
            </CardTitle>
            {periodLabel ? <CardDescription className="text-xs">Total del período visible</CardDescription> : null}
          </div>
          <ArrowUpRight className="size-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <AnimatedMoney
            value={totalIncome}
            className="text-2xl font-bold font-mono text-emerald-600"
          />
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Egresos{suffix}
            </CardTitle>
            {periodLabel ? <CardDescription className="text-xs">Total del período visible</CardDescription> : null}
          </div>
          <ArrowDownLeft className="size-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <AnimatedMoney
            value={totalExpenses}
            className="text-2xl font-bold font-mono text-red-600"
          />
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reversas{suffix}
            </CardTitle>
            {periodLabel ? <CardDescription className="text-xs">Total del período visible</CardDescription> : null}
          </div>
          <RefreshCw className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <AnimatedMoney
            value={totalReversals}
            className="text-2xl font-bold font-mono"
          />
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Balance neto{suffix}
            </CardTitle>
            {periodLabel ? <CardDescription className="text-xs">Resultado del período visible</CardDescription> : null}
          </div>
          <Wallet className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <AnimatedMoney
            value={netBalance}
            className={`text-2xl font-bold font-mono ${netClass}`}
          />
        </CardContent>
      </Card>
    </div>
  )
}