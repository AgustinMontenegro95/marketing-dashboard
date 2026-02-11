"use client"

import type { Client } from "./clients-page-content"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Building2, CreditCard, Mail, Phone, Calendar, Hash, Landmark } from "lucide-react"

const planFeatures: Record<string, string[]> = {
  Starter: [
    "1 proyecto activo",
    "Soporte por email",
    "Reportes mensuales básicos",
    "1 revisión por entrega",
  ],
  Profesional: [
    "Hasta 5 proyectos activos",
    "Soporte prioritario",
    "Reportes semanales",
    "3 revisiones por entrega",
    "Acceso a analítica",
  ],
  Enterprise: [
    "Proyectos ilimitados",
    "Account Manager dedicado",
    "Reportes en tiempo real",
    "Revisiones ilimitadas",
    "Analítica avanzada",
    "SLA garantizado",
  ],
}

const mockTransactions = [
  { id: 1, date: "2025-12-01", concept: "Pago mensual - Diciembre", amount: 8500, type: "ingreso" },
  { id: 2, date: "2025-11-15", concept: "Servicio adicional - SEO", amount: 3200, type: "ingreso" },
  { id: 3, date: "2025-11-01", concept: "Pago mensual - Noviembre", amount: 8500, type: "ingreso" },
  { id: 4, date: "2025-10-20", concept: "Nota de crédito - Ajuste", amount: -1200, type: "egreso" },
  { id: 5, date: "2025-10-01", concept: "Pago mensual - Octubre", amount: 8500, type: "ingreso" },
  { id: 6, date: "2025-09-01", concept: "Pago mensual - Septiembre", amount: 8500, type: "ingreso" },
]

export function ClientDetail({ client, onBack }: { client: Client; onBack: () => void }) {
  const initials = client.name.split(" ").map((n) => n[0]).join("")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="size-4" />
          <span className="sr-only">Volver</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
          <p className="text-muted-foreground text-sm">{client.company}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client Info */}
        <Card className="border-border/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-14">
                <AvatarFallback className="bg-foreground/10 text-foreground text-lg font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{client.name}</p>
                <Badge variant={client.status === "Activo" ? "default" : client.status === "Pausado" ? "secondary" : "outline"}>
                  {client.status}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-3">
                <Building2 className="size-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Empresa:</span>
                <span className="font-medium ml-auto">{client.company}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium ml-auto text-xs">{client.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="size-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Teléfono:</span>
                <span className="font-medium ml-auto">{client.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="size-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Cliente desde:</span>
                <span className="font-medium ml-auto">{client.joinedDate}</span>
              </div>
              <div className="flex items-center gap-3">
                <Hash className="size-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">CUIT:</span>
                <span className="font-medium font-mono ml-auto">{client.cuit}</span>
              </div>
              <div className="flex items-center gap-3">
                <Landmark className="size-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">CBU:</span>
                <span className="font-medium font-mono ml-auto text-xs">{client.cbu}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan and Account */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Plan Card */}
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Plan Contratado</CardTitle>
                  <CardDescription>Detalles del plan actual del cliente</CardDescription>
                </div>
                <span className="inline-flex items-center rounded-md bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">
                  {client.plan}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {(planFeatures[client.plan] || []).map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    <div className="size-1.5 rounded-full bg-primary shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Account Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Balance Actual</span>
                  <span className={`text-2xl font-bold font-mono ${client.balance < 0 ? "text-primary" : ""}`}>
                    {client.balance < 0 ? "-" : ""}${Math.abs(client.balance).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Total Pagado</span>
                  <span className="text-2xl font-bold font-mono">${client.totalPaid.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Proyectos</span>
                  <span className="text-2xl font-bold">{client.projects}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Statement */}
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="size-4" />
                    Cuenta Corriente
                  </CardTitle>
                  <CardDescription>Historial de movimientos del cliente</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {mockTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{tx.concept}</span>
                      <span className="text-xs text-muted-foreground font-mono">{tx.date}</span>
                    </div>
                    <span className={`font-mono font-semibold text-sm ${tx.amount < 0 ? "text-primary" : ""}`}>
                      {tx.amount < 0 ? "-" : "+"}${Math.abs(tx.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
