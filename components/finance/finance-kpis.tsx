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
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Totales</CardTitle>
          <ArrowUpRight className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">${totalIncome.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Egresos Totales</CardTitle>
          <ArrowDownLeft className="size-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono text-primary">${totalExpenses.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Reversas</CardTitle>
          <RefreshCw className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">${totalReversals.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Balance Neto</CardTitle>
          <Wallet className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold font-mono ${netBalance < 0 ? "text-primary" : ""}`}>
            {netBalance < 0 ? "-" : ""}${Math.abs(netBalance).toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
