"use client"

import React from "react"
import type { Transaction } from "./finance-page-content"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowDownLeft, ArrowUpRight, RefreshCw, X } from "lucide-react"
import { money } from "./finance-mappers"
import { MovementDetailDialog } from "./movement-detail-dialog"

function typeColor(tx: Transaction) {
  if (tx.estado === 3) return "text-slate-400"
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

function getTypeIcon(tx: Transaction) {
  if (tx.estado === 3) {
    return <X className="size-4" />
  }

  switch (tx.type) {
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

export function TransactionsTable({
  transactions,
  footer,
  title = "Movimientos",
  onMovementUpdated,
}: {
  transactions: Transaction[]
  footer?: React.ReactNode
  title?: string
  onMovementUpdated?: () => Promise<void> | void
}) {
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
          <CardTitle>{title}</CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="w-10 text-muted-foreground">Tipo</TableHead>
                <TableHead className="text-muted-foreground">Fecha</TableHead>
                <TableHead className="text-muted-foreground">Cuenta</TableHead>
                <TableHead className="text-muted-foreground">Categoría</TableHead>
                <TableHead className="text-muted-foreground">Concepto</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <TableHead className="text-right text-muted-foreground">Monto</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {transactions.map((tx) => {
                const c = typeColor(tx)
                const amountClass = tx.estado === 3 ? "text-slate-400" : c

                return (
                  <TableRow
                    key={tx.movimientoId ?? tx.id}
                    className={`cursor-pointer border-border/50 transition-colors hover:bg-muted/40 ${tx.estado === 3 ? "opacity-70" : ""
                      }`}
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
                        {React.cloneElement(getTypeIcon(tx) as any, { className: `size-4 ${c}` })}
                      </span>
                    </TableCell>

                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {tx.date}
                    </TableCell>

                    <TableCell className="max-w-[180px] truncate text-sm" title={tx.account}>
                      {tx.account}
                    </TableCell>

                    <TableCell>
                      <span
                        className="inline-flex max-w-[180px] items-center truncate rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                        title={tx.category}
                      >
                        {tx.category}
                      </span>
                    </TableCell>

                    <TableCell className="max-w-[280px] truncate" title={tx.concept}>
                      <div>
                        <div className="truncate text-sm font-medium">{tx.concept}</div>
                        {tx.codigo ? (
                          <div className="truncate font-mono text-xs text-muted-foreground">{tx.codigo}</div>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block size-2 rounded-full ${statusDot(tx)}`} />
                        <span className="text-sm text-muted-foreground">{tx.status}</span>
                      </div>
                    </TableCell>

                    <TableCell className={`text-right font-mono font-semibold ${amountClass}`}>
                      {money(tx.moneda, tx.amount)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {footer ?? null}
        </CardContent>
      </Card>

      <MovementDetailDialog
        open={open}
        onOpenChange={setOpen}
        movement={selected}
        onChanged={onMovementUpdated}
      />
    </>
  )
}