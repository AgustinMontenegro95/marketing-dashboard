"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

const projects = [
  {
    id: "PRJ-001",
    name: "Rebrand Luxe Hotel",
    client: "Luxe Hotels",
    type: "Diseño",
    status: "En curso",
    progress: 72,
    budget: "$18,500",
    lead: "MC",
  },
  {
    id: "PRJ-002",
    name: "E-commerce PlantaVida",
    client: "PlantaVida Co.",
    type: "Desarrollo",
    status: "En curso",
    progress: 45,
    budget: "$42,000",
    lead: "JR",
  },
  {
    id: "PRJ-003",
    name: "Campaña Social Media",
    client: "FitLife Gym",
    type: "Marketing",
    status: "Revisión",
    progress: 90,
    budget: "$8,200",
    lead: "LP",
  },
  {
    id: "PRJ-004",
    name: "App Móvil FinTrack",
    client: "FinTrack Inc.",
    type: "Desarrollo",
    status: "En curso",
    progress: 33,
    budget: "$65,000",
    lead: "AS",
  },
  {
    id: "PRJ-005",
    name: "SEO & Content Strategy",
    client: "CloudBase",
    type: "Marketing",
    status: "Completado",
    progress: 100,
    budget: "$12,800",
    lead: "LP",
  },
  {
    id: "PRJ-006",
    name: "Landing Page NeoBank",
    client: "NeoBank",
    type: "Diseño",
    status: "Nuevo",
    progress: 10,
    budget: "$6,500",
    lead: "MC",
  },
]

function getStatusVariant(status: string) {
  switch (status) {
    case "En curso":
      return "default"
    case "Completado":
      return "secondary"
    case "Revisión":
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
    case "Diseño":
      return "bg-foreground/10 text-foreground"
    case "Desarrollo":
      return "bg-muted text-muted-foreground"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function RecentProjectsTable() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Proyectos Recientes</CardTitle>
        <CardDescription>
          Resumen de los proyectos activos y su progreso
        </CardDescription>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id} className="border-border/50">
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
                <TableCell className="text-right font-mono font-medium">{project.budget}</TableCell>
                <TableCell>
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-foreground/10 text-foreground text-[10px] font-semibold">
                      {project.lead}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
