"use client"

import type { Transaction } from "./finance-page-content"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react"

function getTypeIcon(type: string) {
  switch (type) {
    case "Ingreso":
      return <ArrowUpRight className="size-4" />
    case "Egreso":
      return <ArrowDownLeft className="size-4 text-primary" />
    case "Reversa":
      return <RefreshCw className="size-4 text-muted-foreground" />
    default:
      return null
  }
}

function getStatusVariant(status: string) {
  switch (status) {
    case "Confirmado":
      return "default"
    case "Pendiente":
      return "secondary"
    case "Reversado":
      return "outline"
    default:
      return "default"
  }
}

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Movimientos</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground w-10">Tipo</TableHead>
              <TableHead className="text-muted-foreground">Fecha</TableHead>
              <TableHead className="text-muted-foreground">Concepto</TableHead>
              <TableHead className="text-muted-foreground">Categoría</TableHead>
              <TableHead className="text-muted-foreground">Cliente</TableHead>
              <TableHead className="text-muted-foreground">Estado</TableHead>
              <TableHead className="text-muted-foreground text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id} className="border-border/50">
                <TableCell>{getTypeIcon(tx.type)}</TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">{tx.date}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-sm">{tx.concept}</div>
                    <div className="text-xs text-muted-foreground font-mono">{tx.id}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                    {tx.category}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{tx.client}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(tx.status) as "default" | "secondary" | "outline"}>
                    {tx.status}
                  </Badge>
                </TableCell>
                <TableCell className={`text-right font-mono font-semibold ${tx.type === "Egreso" || tx.type === "Reversa" ? "text-primary" : ""}`}>
                  {tx.type === "Egreso" || tx.type === "Reversa" ? "-" : "+"}${tx.amount.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
