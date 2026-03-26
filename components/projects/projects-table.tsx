"use client"

import type { ProyectoDto } from "@/lib/proyectos"
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

function getEstadoProyectoLabel(estado: number): string {
  switch (estado) {
    case 1: return "Activo"
    case 2: return "En pausa"
    case 3: return "Finalizado"
    case 4: return "Cancelado"
    case 5: return "Pendiente"
    default: return `Estado ${estado}`
  }
}

function getEstadoProyectoVariant(estado: number): "default" | "secondary" | "outline" | "destructive" {
  return estado === 4 ? "destructive" : "outline"
}

function getEstadoProyectoClassName(estado: number): string | undefined {
  switch (estado) {
    case 1: return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
    case 2: return "bg-amber-500/15 text-amber-600 border-amber-500/30"
    case 3: return "bg-slate-500/15 text-slate-500 border-slate-500/30"
    case 5: return "bg-blue-500/15 text-blue-600 border-blue-500/30"
    default: return undefined
  }
}

function formatDateAR(date: string | null | undefined): string {
  if (!date) return "-"
  const d = new Date(date + "T00:00:00")
  if (isNaN(d.getTime())) return "-"
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" }).format(d)
}

function formatMoney(amount: number | null | undefined, moneda = "ARS"): string {
  if (amount == null) return "-"
  const formatted = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount)
  return moneda === "ARS" ? `$ ${formatted}` : `${moneda} ${formatted}`
}

function initialsFromName(value: string): string {
  return value.split(" ").filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("")
}

export function ProjectsTable({
  projects,
  onSelectProject,
}: {
  projects: ProyectoDto[]
  onSelectProject: (p: ProyectoDto) => void
}) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Listado de proyectos</CardTitle>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Proyecto</TableHead>
              <TableHead className="text-muted-foreground">Cliente</TableHead>
              <TableHead className="text-muted-foreground">Estado</TableHead>
              <TableHead className="text-muted-foreground">Inicio</TableHead>
              <TableHead className="text-muted-foreground">Fin estimado</TableHead>
              <TableHead className="text-muted-foreground text-right">Presupuesto</TableHead>
              <TableHead className="text-muted-foreground sr-only">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {projects.length === 0 ? (
              <TableRow className="border-border/50">
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  No se encontraron proyectos.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id} className="border-border/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-foreground/10 text-foreground text-xs font-semibold">
                          {initialsFromName(project.nombre)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{project.nombre}</div>
                        {project.codigo ? (
                          <div className="text-xs text-muted-foreground font-mono">{project.codigo}</div>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-muted-foreground">#{project.clienteId}</TableCell>

                  <TableCell>
                    <Badge
                      variant={getEstadoProyectoVariant(project.estado)}
                      className={getEstadoProyectoClassName(project.estado)}
                    >
                      {getEstadoProyectoLabel(project.estado)}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {formatDateAR(project.fechaInicio)}
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {formatDateAR(project.fechaFinEstimada)}
                  </TableCell>

                  <TableCell className="text-right font-mono font-medium">
                    {formatMoney(project.presupuestoTotal, project.moneda)}
                  </TableCell>

                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => onSelectProject(project)}>
                      <Eye className="size-4" />
                      <span className="sr-only">Ver detalle de {project.nombre}</span>
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
