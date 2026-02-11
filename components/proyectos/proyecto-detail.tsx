"use client"

import type { Project } from "./proyectos-page-content"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react"
import { toast } from "sonner"

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

export function ProyectoDetail({
  project,
  onBack,
  onUpdate,
}: {
  project: Project
  onBack: () => void
  onUpdate: (project: Project) => void
}) {
  const budgetUsedPercent = Math.round((project.spent / project.budget) * 100)
  const completedTasks = project.tasks.filter((t) => t.completed).length
  const completedMilestones = project.milestones.filter((m) => m.completed).length

  function handleToggleTask(taskId: string) {
    const updatedTasks = project.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    )
    const newCompleted = updatedTasks.filter((t) => t.completed).length
    const newProgress = Math.round((newCompleted / updatedTasks.length) * 100)
    onUpdate({ ...project, tasks: updatedTasks, progress: newProgress })
  }

  function handleToggleMilestone(milestoneId: string) {
    const updatedMilestones = project.milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    )
    onUpdate({ ...project, milestones: updatedMilestones })
    toast.success("Milestone actualizado")
  }

  function handleChangeStatus(newStatus: Project["status"]) {
    const newProgress = newStatus === "Completado" ? 100 : project.progress
    onUpdate({ ...project, status: newStatus, progress: newProgress })
    toast.success(`Estado actualizado a "${newStatus}"`)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="mt-0.5">
          <ArrowLeft className="size-4" />
          <span className="sr-only">Volver</span>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant={getStatusVariant(project.status) as "default" | "secondary" | "outline" | "destructive"}>
              {project.status}
            </Badge>
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getTypeColor(project.type)}`}>
              {project.type}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {project.client} - {project.id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {project.status !== "Completado" && (
            <>
              {project.status === "Pausado" ? (
                <Button variant="outline" onClick={() => handleChangeStatus("En curso")}>
                  Reanudar
                </Button>
              ) : (
                <Button variant="outline" onClick={() => handleChangeStatus("Pausado")}>
                  Pausar
                </Button>
              )}
              <Button onClick={() => handleChangeStatus("Completado")}>
                Marcar Completado
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progreso</CardTitle>
            <CheckCircle2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{project.progress}%</div>
            <Progress value={project.progress} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Presupuesto</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">${project.spent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              de ${project.budget.toLocaleString()} ({budgetUsedPercent}%)
            </p>
            <Progress value={budgetUsedPercent} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Plazo</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{project.startDate}</div>
            <div className="text-sm font-medium text-primary">{project.endDate}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Equipo</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex -space-x-2">
              {project.team.map((member) => (
                <Avatar key={member.initials} className="size-8 border-2 border-card">
                  <AvatarFallback className="bg-foreground/10 text-foreground text-[10px] font-semibold">
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Lead: {project.lead}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for details */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">General</TabsTrigger>
          <TabsTrigger value="tasks">Tareas ({completedTasks}/{project.tasks.length})</TabsTrigger>
          <TabsTrigger value="milestones">Milestones ({completedMilestones}/{project.milestones.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border-border/50 lg:col-span-2">
              <CardHeader>
                <CardTitle>Descripcion del Proyecto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {project.description}
                </p>
                <Separator className="my-4" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cliente:</span>
                    <span className="ml-2 font-medium">{project.client}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="ml-2 font-medium">{project.type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Inicio:</span>
                    <span className="ml-2 font-medium font-mono">{project.startDate}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Entrega:</span>
                    <span className="ml-2 font-medium font-mono">{project.endDate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Equipo Asignado</CardTitle>
                <CardDescription>{project.team.length} miembros</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {project.team.map((member) => (
                    <div key={member.initials} className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-foreground/10 text-foreground text-[10px] font-semibold">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{member.name}</div>
                        {member.name === project.lead && (
                          <span className="text-xs text-primary font-medium">Lead</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Lista de Tareas</CardTitle>
              <CardDescription>
                {completedTasks} de {project.tasks.length} tareas completadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {project.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay tareas definidas para este proyecto.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {project.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 rounded-lg border border-border/50 p-3"
                    >
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => handleToggleTask(task.id)}
                      />
                      <span
                        className={`text-sm flex-1 ${
                          task.completed
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.completed ? (
                        <CheckCircle2 className="size-4 text-foreground" />
                      ) : (
                        <Circle className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Milestones del Proyecto</CardTitle>
              <CardDescription>
                {completedMilestones} de {project.milestones.length} milestones alcanzados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {project.milestones.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay milestones definidos para este proyecto.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {project.milestones.map((milestone, index) => (
                    <div key={milestone.id} className="flex items-start gap-4">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => handleToggleMilestone(milestone.id)}
                          className="flex items-center justify-center"
                          aria-label={`Toggle milestone: ${milestone.title}`}
                        >
                          {milestone.completed ? (
                            <CheckCircle2 className="size-5 text-primary" />
                          ) : (
                            <Circle className="size-5 text-muted-foreground" />
                          )}
                        </button>
                        {index < project.milestones.length - 1 && (
                          <div className="w-px h-8 bg-border" />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-sm font-medium ${
                              milestone.completed ? "text-muted-foreground" : "text-foreground"
                            }`}
                          >
                            {milestone.title}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            <span className="font-mono">{milestone.date}</span>
                          </div>
                        </div>
                        {milestone.completed && (
                          <span className="text-xs text-primary font-medium">Completado</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
