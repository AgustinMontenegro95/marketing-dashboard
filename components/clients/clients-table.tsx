"use client"

import type { Client } from "./clients-page-content"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

function getPlanColor(plan: string) {
  switch (plan) {
    case "Enterprise":
      return "bg-primary/10 text-primary"
    case "Profesional":
      return "bg-foreground/10 text-foreground"
    case "Starter":
      return "bg-muted text-muted-foreground"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function getStatusVariant(status: string) {
  switch (status) {
    case "Activo":
      return "default"
    case "Pausado":
      return "secondary"
    case "Finalizado":
      return "outline"
    default:
      return "default"
  }
}

export function ClientsTable({
  clients,
  onSelectClient,
}: {
  clients: Client[]
  onSelectClient: (client: Client) => void
}) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Listado de Clientes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Cliente</TableHead>
              <TableHead className="text-muted-foreground">Empresa</TableHead>
              <TableHead className="text-muted-foreground">Plan</TableHead>
              <TableHead className="text-muted-foreground">Estado</TableHead>
              <TableHead className="text-muted-foreground">Proyectos</TableHead>
              <TableHead className="text-muted-foreground text-right">Balance</TableHead>
              <TableHead className="text-muted-foreground text-right">Total Pagado</TableHead>
              <TableHead className="text-muted-foreground sr-only">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id} className="border-border/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-foreground/10 text-foreground text-xs font-semibold">
                        {client.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{client.name}</div>
                      <div className="text-xs text-muted-foreground">{client.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{client.company}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getPlanColor(client.plan)}`}>
                    {client.plan}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(client.status) as "default" | "secondary" | "outline"}>
                    {client.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-center">{client.projects}</TableCell>
                <TableCell className={`text-right font-mono font-medium ${client.balance < 0 ? "text-primary" : ""}`}>
                  {client.balance < 0 ? "-" : ""}${Math.abs(client.balance).toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                  ${client.totalPaid.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => onSelectClient(client)}>
                    <Eye className="size-4" />
                    <span className="sr-only">Ver detalle de {client.name}</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
