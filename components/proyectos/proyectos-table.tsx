"use client"

import type { Project } from "./proyectos-page-content"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { ExternalLink } from "lucide-react"

function getStatusVariant(status: string) {
  switch (status) {
    case "En curso":
      return "default"
    case "Completado":
      return "secondary"
    case "Revision":
      return "outline"
    case "Pausado":
      return "destructive"
    case "Nuevo":
      return "secondary"
    default:
      return "default"
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case "Marketing":
      return "bg-primary/10 text-primary"
    case "Diseno":
      return "bg-foreground/10 text-foreground"
    case "Desarrollo":
      return "bg-muted text-muted-foreground"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function ProyectosTable({
  projects,
  onSelect,
}: {
  projects: Project[]
  onSelect: (project: Project) => void
}) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Listado de Proyectos</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Proyecto</TableHead>
              <TableHead className="text-muted-foreground">Cliente</TableHead>
              <TableHead className="text-muted-foreground">Tipo</TableHead>
              <TableHead className="text-muted-foreground">Estado</TableHead>
              <TableHead className="text-muted-foreground">Progreso</TableHead>
              <TableHead className="text-muted-foreground text-right">Presupuesto</TableHead>
              <TableHead className="text-muted-foreground">Lead</TableHead>
              <TableHead className="text-muted-foreground">Equipo</TableHead>
              <TableHead className="text-muted-foreground w-10">
                <span className="sr-only">Ver</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id} className="border-border/50 cursor-pointer" onClick={() => onSelect(project)}>
                <TableCell>
                  <div>
                    <div className="font-medium">{project.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{project.id}</div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{project.client}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getTypeColor(project.type)}`}>
                    {project.type}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(project.status) as "default" | "secondary" | "outline" | "destructive"}>
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={project.progress} className="h-1.5 w-16" />
                    <span className="text-xs text-muted-foreground font-mono">{project.progress}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                  ${project.budget.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-foreground/10 text-foreground text-[10px] font-semibold">
                      {project.leadInitials}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>
                  <div className="flex -space-x-2">
                    {project.team.slice(0, 3).map((member) => (
                      <Avatar key={member.initials} className="size-7 border-2 border-card">
                        <AvatarFallback className="bg-foreground/10 text-foreground text-[10px] font-semibold">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {project.team.length > 3 && (
                      <Avatar className="size-7 border-2 border-card">
                        <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-semibold">
                          +{project.team.length - 3}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="size-8">
                    <ExternalLink className="size-4" />
                    <span className="sr-only">Ver detalle</span>
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
