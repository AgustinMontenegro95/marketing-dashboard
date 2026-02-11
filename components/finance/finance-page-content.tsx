"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { FinanceKpis } from "./finance-kpis"
import { FinanceChart } from "./finance-chart"
import { TransactionsTable } from "./transactions-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export type Transaction = {
  id: string
  date: string
  type: "Ingreso" | "Egreso" | "Reversa"
  category: string
  concept: string
  client: string
  amount: number
  status: "Confirmado" | "Pendiente" | "Reversado"
}

const initialTransactions: Transaction[] = [
  {
    id: "TXN-001",
    date: "2026-02-10",
    type: "Ingreso",
    category: "Servicio",
    concept: "Pago proyecto Rebrand - Luxe Hotels",
    client: "Luxe Hotels",
    amount: 18500,
    status: "Confirmado",
  },
  {
    id: "TXN-002",
    date: "2026-02-08",
    type: "Egreso",
    category: "Herramientas",
    concept: "Licencia Adobe Creative Cloud - Anual",
    client: "-",
    amount: 4200,
    status: "Confirmado",
  },
  {
    id: "TXN-003",
    date: "2026-02-07",
    type: "Ingreso",
    category: "Servicio",
    concept: "Anticipo E-commerce - PlantaVida",
    client: "PlantaVida Co.",
    amount: 21000,
    status: "Confirmado",
  },
  {
    id: "TXN-004",
    date: "2026-02-05",
    type: "Egreso",
    category: "Sueldos",
    concept: "Nómina Febrero - Equipo Desarrollo",
    client: "-",
    amount: 32000,
    status: "Confirmado",
  },
  {
    id: "TXN-005",
    date: "2026-02-04",
    type: "Egreso",
    category: "Sueldos",
    concept: "Nómina Febrero - Equipo Marketing",
    client: "-",
    amount: 18500,
    status: "Confirmado",
  },
  {
    id: "TXN-006",
    date: "2026-02-03",
    type: "Ingreso",
    category: "Servicio",
    concept: "Campaña Social Media - FitLife Gym",
    client: "FitLife Gym",
    amount: 8200,
    status: "Pendiente",
  },
  {
    id: "TXN-007",
    date: "2026-02-02",
    type: "Reversa",
    category: "Ajuste",
    concept: "Reversa cobro duplicado - FinTrack",
    client: "FinTrack Inc.",
    amount: 5000,
    status: "Reversado",
  },
  {
    id: "TXN-008",
    date: "2026-02-01",
    type: "Ingreso",
    category: "Servicio",
    concept: "App Móvil milestone 2 - FinTrack",
    client: "FinTrack Inc.",
    amount: 32500,
    status: "Confirmado",
  },
  {
    id: "TXN-009",
    date: "2026-01-30",
    type: "Egreso",
    category: "Infraestructura",
    concept: "Servidores y hosting - Vercel + AWS",
    client: "-",
    amount: 2800,
    status: "Confirmado",
  },
  {
    id: "TXN-010",
    date: "2026-01-28",
    type: "Egreso",
    category: "Marketing",
    concept: "Publicidad Google Ads - Campaña interna",
    client: "-",
    amount: 5600,
    status: "Confirmado",
  },
  {
    id: "TXN-011",
    date: "2026-01-25",
    type: "Ingreso",
    category: "Servicio",
    concept: "SEO mensual - CloudBase",
    client: "CloudBase",
    amount: 4800,
    status: "Confirmado",
  },
  {
    id: "TXN-012",
    date: "2026-01-22",
    type: "Egreso",
    category: "Herramientas",
    concept: "Figma Team - Licencia mensual",
    client: "-",
    amount: 1200,
    status: "Confirmado",
  },
]

export function FinancePageContent() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newTx, setNewTx] = useState({
    type: "Ingreso" as Transaction["type"],
    category: "",
    concept: "",
    client: "",
    amount: "",
    notes: "",
  })

  const totalIncome = transactions
    .filter((t) => t.type === "Ingreso" && t.status !== "Reversado")
    .reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = transactions
    .filter((t) => t.type === "Egreso" && t.status !== "Reversado")
    .reduce((sum, t) => sum + t.amount, 0)
  const totalReversals = transactions
    .filter((t) => t.type === "Reversa")
    .reduce((sum, t) => sum + t.amount, 0)
  const netBalance = totalIncome - totalExpenses - totalReversals

  function handleAddTransaction() {
    const tx: Transaction = {
      id: `TXN-${String(transactions.length + 1).padStart(3, "0")}`,
      date: new Date().toISOString().split("T")[0],
      type: newTx.type,
      category: newTx.category,
      concept: newTx.concept,
      client: newTx.client || "-",
      amount: Number.parseFloat(newTx.amount) || 0,
      status: newTx.type === "Reversa" ? "Reversado" : "Pendiente",
    }
    setTransactions([tx, ...transactions])
    setNewTx({ type: "Ingreso", category: "", concept: "", client: "", amount: "", notes: "" })
    setDialogOpen(false)
  }

  return (
    <DashboardShell breadcrumb="Finanzas">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finanzas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Control de ingresos, egresos y movimientos financieros
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              Nuevo Movimiento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Movimiento</DialogTitle>
              <DialogDescription>
                Agrega un nuevo ingreso, egreso o reversa al sistema financiero.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tx-type">Tipo</Label>
                  <Select
                    value={newTx.type}
                    onValueChange={(val) => setNewTx({ ...newTx, type: val as Transaction["type"] })}
                  >
                    <SelectTrigger id="tx-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ingreso">Ingreso</SelectItem>
                      <SelectItem value="Egreso">Egreso</SelectItem>
                      <SelectItem value="Reversa">Reversa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tx-category">Categoría</Label>
                  <Select
                    value={newTx.category}
                    onValueChange={(val) => setNewTx({ ...newTx, category: val })}
                  >
                    <SelectTrigger id="tx-category">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Servicio">Servicio</SelectItem>
                      <SelectItem value="Sueldos">Sueldos</SelectItem>
                      <SelectItem value="Herramientas">Herramientas</SelectItem>
                      <SelectItem value="Infraestructura">Infraestructura</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Ajuste">Ajuste</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tx-amount">Monto ($)</Label>
                  <Input
                    id="tx-amount"
                    type="number"
                    value={newTx.amount}
                    onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tx-client">Cliente (opcional)</Label>
                  <Input
                    id="tx-client"
                    value={newTx.client}
                    onChange={(e) => setNewTx({ ...newTx, client: e.target.value })}
                    placeholder="Nombre del cliente"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tx-concept">Concepto</Label>
                <Textarea
                  id="tx-concept"
                  value={newTx.concept}
                  onChange={(e) => setNewTx({ ...newTx, concept: e.target.value })}
                  placeholder="Descripción del movimiento..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddTransaction} disabled={!newTx.concept || !newTx.amount || !newTx.category}>
                Registrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <FinanceKpis
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        totalReversals={totalReversals}
        netBalance={netBalance}
      />

      <FinanceChart />

      <TransactionsTable transactions={transactions} />
    </DashboardShell>
  )
}
