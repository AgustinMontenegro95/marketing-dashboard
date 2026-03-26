"use client"

import type { ClienteDto } from "@/lib/clientes"
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

function getEstadoLabel(estado: number) {
  switch (estado) {
    case 1:
      return "Activo"
    case 2:
      return "Pausado"
    case 3:
      return "Finalizado"
    case 4:
      return "Eliminado"
    default:
      return `Estado ${estado}`
  }
}

function getEstadoVariant(estado: number): "default" | "secondary" | "outline" | "destructive" {
  switch (estado) {
    case 1:
      return "default"
    case 2:
      return "secondary"
    case 3:
      return "outline"
    case 4:
      return "destructive"
    default:
      return "outline"
  }
}

function getEstadoClassName(estado: number): string | undefined {
  switch (estado) {
    case 1: return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/25"
    case 2: return "bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/25"
    case 3: return "bg-slate-500/15 text-slate-500 border-slate-500/30 hover:bg-slate-500/25"
    default: return undefined
  }
}

function getCondicionIvaLabel(condicionIva: number | null | undefined) {
  switch (condicionIva) {
    case 1: return "Responsable Inscripto"
    case 2: return "Monotributo"
    case 3: return "Exento"
    case 4: return "No Responsable"
    case 5: return "Consumidor Final"
    case 6: return "No Categorizado"
    default: return "-"
  }
}

function formatCuit(cuit: string | null | undefined) {
  if (!cuit) return "-"
  const digits = cuit.replace(/\D/g, "")
  if (digits.length === 11) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits[10]}`
  }
  return cuit
}

function initialsFromName(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function ClientsTable({
  clients,
  onSelectClient,
}: {
  clients: ClienteDto[]
  onSelectClient: (client: ClienteDto) => void
}) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Listado de clientes</CardTitle>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Cliente</TableHead>
              <TableHead className="text-muted-foreground">Código</TableHead>
              <TableHead className="text-muted-foreground">Razón social</TableHead>
              <TableHead className="text-muted-foreground">CUIT</TableHead>
              <TableHead className="text-muted-foreground">IVA</TableHead>
              <TableHead className="text-muted-foreground">País</TableHead>
              <TableHead className="text-muted-foreground">Estado</TableHead>
              <TableHead className="text-muted-foreground sr-only">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {clients.length === 0 ? (
              <TableRow className="border-border/50">
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  No se encontraron clientes.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id} className="border-border/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-foreground/10 text-foreground text-xs font-semibold">
                          {initialsFromName(client.nombre)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{client.nombre}</div>
                        <div className="text-xs text-muted-foreground">
                          {client.localidad || client.provincia || "Sin ubicación"}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-xs">{client.codigo}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.razonSocial || "Sin razón social"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{formatCuit(client.cuit)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {getCondicionIvaLabel(client.condicionIva)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{client.pais || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={getEstadoVariant(client.estado)} className={getEstadoClassName(client.estado)}>
                      {getEstadoLabel(client.estado)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => onSelectClient(client)}>
                      <Eye className="size-4" />
                      <span className="sr-only">Ver detalle de {client.nombre}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}