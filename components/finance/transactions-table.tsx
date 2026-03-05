"use client"

import React from "react"
import type { Transaction } from "./finance-page-content"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react"
import { money } from "./finance-mappers"
import { MovementDetailDialog } from "./movement-detail-dialog"

function typeColor(tx: Transaction) {
  if (tx.esReversa) return "text-amber-600"
  if (tx.type === "Ingreso") return "text-emerald-600"
  if (tx.type === "Egreso") return "text-red-600"
  return "text-muted-foreground"
}

function statusDot(tx: Transaction) {
  if (tx.esReversa) return "bg-amber-500"
  switch (tx.estado) {
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

function getTypeIcon(type: string) {
  switch (type) {
    case "Ingreso":
      return <ArrowUpRight className="size-4" />
    case "Egreso":
      return <ArrowDownLeft className="size-4" />
    case "Reversa":
      return <RefreshCw className="size-4" />
    default:
      return null
  }
}

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<Transaction | null>(null)

  const openDetail = (tx: Transaction) => {
    setSelected(tx)
    setOpen(true)
  }

  return (
    <>
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
                <TableHead className="text-muted-foreground">Cuenta</TableHead>
                <TableHead className="text-muted-foreground">Categoría</TableHead>
                <TableHead className="text-muted-foreground">Concepto</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <TableHead className="text-muted-foreground text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {transactions.map((tx) => {
                const c = typeColor(tx)

                return (
                  <TableRow
                    key={tx.movimientoId ?? tx.id}
                    className="border-border/50 cursor-pointer hover:bg-muted/40 transition-colors"
                    role="button"
                    tabIndex={0}
                    onClick={() => openDetail(tx)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        openDetail(tx)
                      }
                    }}
                    title="Ver detalle"
                  >
                    <TableCell>
                      <span className={c}>
                        {React.cloneElement(getTypeIcon(tx.type) as any, { className: `size-4 ${c}` })}
                      </span>
                    </TableCell>

                    <TableCell className="text-muted-foreground font-mono text-xs whitespace-nowrap">
                      {tx.date}
                    </TableCell>

                    <TableCell className="text-sm max-w-[180px] truncate" title={tx.account}>
                      {tx.account}
                    </TableCell>

                    <TableCell>
                      <span
                        className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground max-w-[180px] truncate"
                        title={tx.category}
                      >
                        {tx.category}
                      </span>
                    </TableCell>

                    <TableCell className="max-w-[280px] truncate" title={tx.concept}>
                      <div>
                        <div className="font-medium text-sm truncate">{tx.concept}</div>
                        {tx.codigo ? (
                          <div className="text-xs text-muted-foreground font-mono truncate">{tx.codigo}</div>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block size-2 rounded-full ${statusDot(tx)}`} />
                        <span className="text-sm text-muted-foreground">{tx.status}</span>
                      </div>
                    </TableCell>

                    <TableCell className={`text-right font-mono font-semibold ${c}`}>
                      {money(tx.moneda, tx.amount)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <MovementDetailDialog open={open} onOpenChange={setOpen} movement={selected} />
    </>
  )
}