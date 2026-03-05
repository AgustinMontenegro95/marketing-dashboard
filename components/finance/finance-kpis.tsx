"use client"

import { ArrowDownLeft, ArrowUpRight, RefreshCw, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function FinanceKpis({
  totalIncome,
  totalExpenses,
  totalReversals,
  netBalance,
}: {
  totalIncome: number
  totalExpenses: number
  totalReversals: number
  netBalance: number
}) {
  // Formato: xxx.xxx,cc
  const fmt = (n: number) =>
    new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n)

  const money = (n: number) => `$ ${fmt(n)}`

  // Balance Neto: verde si >0, rojo si <0, negro si 0
  const netClass =
    netBalance > 0 ? "text-emerald-600" : netBalance < 0 ? "text-red-600" : "text-foreground"

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Totales</CardTitle>
          <ArrowUpRight className="size-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono text-emerald-600">{money(totalIncome)}</div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Egresos Totales</CardTitle>
          <ArrowDownLeft className="size-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono text-red-600">{money(totalExpenses)}</div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Reversas</CardTitle>
          <RefreshCw className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">{money(totalReversals)}</div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Balance Neto</CardTitle>
          <Wallet className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold font-mono ${netClass}`}>{money(netBalance)}</div>
        </CardContent>
      </Card>
    </div>
  )
}