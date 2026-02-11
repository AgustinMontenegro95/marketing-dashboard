"use client"

import { useState } from "react"
import type { Task } from "./communication-page-content"
import { teamMembers } from "./communication-page-content"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Plus, Clock, CheckCircle2, Circle } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function getPriorityColor(priority: string) {
  switch (priority) {
    case "Alta":
      return "bg-primary/10 text-primary"
    case "Media":
      return "bg-foreground/10 text-foreground"
    case "Baja":
      return "bg-muted text-muted-foreground"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "Pendiente":
      return <Circle className="size-4 text-muted-foreground" />
    case "En progreso":
      return <Clock className="size-4 text-primary" />
    case "Completada":
      return <CheckCircle2 className="size-4" />
    default:
      return null
  }
}

export function TaskBoard({
  tasks,
  onAddTask,
  onUpdateStatus,
}: {
  tasks: Task[]
  onAddTask: (task: Omit<Task, "id">) => void
  onUpdateStatus: (taskId: string, status: Task["status"]) => void
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assigneeId: "",
    priority: "Media" as Task["priority"],
    dueDate: "",
    project: "",
  })

  const pending = tasks.filter((t) => t.status === "Pendiente")
  const inProgress = tasks.filter((t) => t.status === "En progreso")
  const completed = tasks.filter((t) => t.status === "Completada")

  function handleAdd() {
    const assignee = teamMembers.find((m) => m.id === newTask.assigneeId) || teamMembers[0]
    onAddTask({
      title: newTask.title,
      description: newTask.description,
      assignee,
      assignedBy: "Admin",
      status: "Pendiente",
      priority: newTask.priority,
      dueDate: newTask.dueDate,
      project: newTask.project,
    })
    setNewTask({ title: "", description: "", assigneeId: "", priority: "Media", dueDate: "", project: "" })
    setDialogOpen(false)
  }

  function TaskCard({ task }: { task: Task }) {
    const nextStatus: Record<string, Task["status"]> = {
      Pendiente: "En progreso",
      "En progreso": "Completada",
      Completada: "Pendiente",
    }

    return (
      <div
        className="rounded-lg border border-border/50 bg-card p-3 flex flex-col gap-2 cursor-pointer hover:border-border transition-colors"
        onClick={() => onUpdateStatus(task.id, nextStatus[task.status])}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onUpdateStatus(task.id, nextStatus[task.status])
          }
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium leading-tight">{task.title}</h4>
          <span className={`shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5">
            <Avatar className="size-5">
              <AvatarFallback className="bg-foreground/10 text-foreground text-[8px] font-semibold">
                {task.assignee.initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-[10px] text-muted-foreground">{task.assignee.name.split(" ")[0]}</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">{task.dueDate}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Haz click en una tarea para avanzar su estado</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="size-3.5" />
              Nueva Tarea
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Asignar Nueva Tarea</DialogTitle>
              <DialogDescription>
                Crea una tarea y asígnala a un miembro del equipo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="task-title">Título</Label>
                <Input
                  id="task-title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Nombre de la tarea"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="task-desc">Descripción</Label>
                <Textarea
                  id="task-desc"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Describe la tarea..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="task-assignee">Asignar a</Label>
                  <Select
                    value={newTask.assigneeId}
                    onValueChange={(val) => setNewTask({ ...newTask, assigneeId: val })}
                  >
                    <SelectTrigger id="task-assignee">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="task-priority">Prioridad</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(val) => setNewTask({ ...newTask, priority: val as Task["priority"] })}
                  >
                    <SelectTrigger id="task-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alta">Alta</SelectItem>
                      <SelectItem value="Media">Media</SelectItem>
                      <SelectItem value="Baja">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="task-project">Proyecto</Label>
                  <Input
                    id="task-project"
                    value={newTask.project}
                    onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
                    placeholder="Nombre del proyecto"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="task-due">Fecha límite</Label>
                  <Input
                    id="task-due"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdd} disabled={!newTask.title || !newTask.assigneeId}>
                Crear Tarea
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              {getStatusIcon("Pendiente")}
              Pendiente
              <Badge variant="secondary" className="ml-auto text-[10px] font-mono">{pending.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {pending.map((t) => <TaskCard key={t.id} task={t} />)}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              {getStatusIcon("En progreso")}
              En Progreso
              <Badge variant="secondary" className="ml-auto text-[10px] font-mono">{inProgress.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {inProgress.map((t) => <TaskCard key={t.id} task={t} />)}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              {getStatusIcon("Completada")}
              Completada
              <Badge variant="secondary" className="ml-auto text-[10px] font-mono">{completed.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {completed.map((t) => <TaskCard key={t.id} task={t} />)}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
