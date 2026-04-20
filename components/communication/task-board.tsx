"use client"

import { useMemo, useState, useEffect } from "react"
import type { Task, TaskStatus, TaskDisciplina, TaskTipo } from "./communication-types"
import { teamMembers } from "./communication-types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Plus, Clock, CheckCircle2, Circle, XCircle, Eye, HelpCircle } from "lucide-react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { TaskDetailSheet } from "./task-detail-sheet"
import { useAccess, useSession } from "@/components/auth/session-provider"

// ─── Tipos exportados ──────────────────────────────────────────────────────

export type Comment = {
  id: string
  taskId: string
  authorName: string
  authorInitials: string
  authorAvatarUrl?: string | null
  content: string
  timestamp: string
}

export type HistorialEntry = {
  id: string
  timestamp: string
  authorName: string
  authorInitials: string
  type: "created" | "status_change" | "edit" | "time_update"
  description: string
}

// ─── Transiciones permitidas ───────────────────────────────────────────────

export const STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  "Pendiente":   ["En progreso", "En revision", "Cancelada"],
  "En progreso": ["En revision", "Cancelada", "Pendiente"],
  "En revision": ["Completada", "En progreso", "Cancelada"],
  "Completada":  ["En revision"],
  "Cancelada":   ["Pendiente"],
}

// ─── Estilos por estado ────────────────────────────────────────────────────

export const STATUS_STYLES: Record<TaskStatus, { badge: string; icon: React.ReactNode; label: string }> = {
  "Pendiente":   { badge: "bg-muted text-muted-foreground",       icon: <Circle className="size-4 text-muted-foreground" />,  label: "Pendiente"   },
  "En progreso": { badge: "bg-blue-500/10 text-blue-600",          icon: <Clock className="size-4 text-blue-500" />,           label: "En progreso" },
  "En revision": { badge: "bg-amber-500/10 text-amber-600",        icon: <Eye className="size-4 text-amber-500" />,            label: "En revisión" },
  "Completada":  { badge: "bg-emerald-500/10 text-emerald-600",    icon: <CheckCircle2 className="size-4 text-emerald-500" />, label: "Completada"  },
  "Cancelada":   { badge: "bg-red-500/10 text-red-600",            icon: <XCircle className="size-4 text-red-500" />,          label: "Cancelada"   },
}

const PRIORITY_STYLES: Record<Task["priority"], string> = {
  "Alta":  "bg-red-500/10 text-red-600",
  "Media": "bg-amber-500/10 text-amber-600",
  "Baja":  "bg-muted text-muted-foreground",
}

export const DISCIPLINA_STYLES: Record<TaskDisciplina, string> = {
  "Marketing":  "bg-emerald-500/10 text-emerald-700",
  "Diseño":     "bg-violet-500/10 text-violet-700",
  "Desarrollo": "bg-blue-500/10 text-blue-700",
}

export const TIPO_TAREA_OPTIONS: TaskTipo[] = ["Diseño", "Desarrollo", "Copy", "Pauta", "Revisión", "Reunión", "Entrega"]

// ─── Tarjeta ───────────────────────────────────────────────────────────────

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  return (
    <button
      type="button"
      className="w-full text-left rounded-lg border border-border/50 bg-card p-3 flex flex-col gap-2 cursor-pointer hover:border-border hover:shadow-sm transition-all"
      onClick={onClick}
    >
      {/* Fila superior: ID + badges */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] text-muted-foreground font-mono">{task.id}</p>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${DISCIPLINA_STYLES[task.disciplina]}`}>
            {task.disciplina}
          </span>
          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${PRIORITY_STYLES[task.priority]}`}>
            {task.priority}
          </span>
        </div>
      </div>

      {/* Título */}
      <h4 className="text-sm font-medium leading-tight">{task.title}</h4>

      {/* Descripción */}
      <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>

      {/* Cliente */}
      {task.cliente && (
        <p className="text-[10px] text-muted-foreground truncate">
          <span className="font-medium text-foreground/70">{task.cliente}</span>
          {task.tipoTarea && <span className="ml-1 opacity-60">· {task.tipoTarea}</span>}
        </p>
      )}

      {/* Asignado + fecha */}
      <div className="flex items-center justify-between">
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
    </button>
  )
}

// ─── TaskBoard ─────────────────────────────────────────────────────────────

export function TaskBoard({
  tasks,
  onAddTask,
  onUpdateStatus,
  onEditTask,
  initialTaskId,
}: {
  tasks: Task[]
  onAddTask: (task: Omit<Task, "id">) => void
  onUpdateStatus: (taskId: string, status: TaskStatus) => void
  onEditTask: (taskId: string, updates: Partial<Omit<Task, "id">>) => void
  initialTaskId?: string
}) {
  const access = useAccess()
  const { context } = useSession()
  const canFilterUsers = access.can("USUARIOS_VER_TODO")
  const canEdit = access.canEdit("COMUNICACION") || access.canCreate("COMUNICACION")

  const currentUserName = context
    ? `${context.usuario.nombre} ${context.usuario.apellido}`
    : null

  const uniqueAssignees = useMemo(() => {
    const map = new Map<string, { id: string; name: string; initials: string }>()
    tasks.forEach((t) => map.set(t.assignee.id, { id: t.assignee.id, name: t.assignee.name, initials: t.assignee.initials }))
    return Array.from(map.values())
  }, [tasks])

  const [helpOpen, setHelpOpen] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    if (!initialTaskId) return
    const task = tasks.find((t) => t.id === initialTaskId)
    if (task) {
      setSelectedTask(task)
      setDetailOpen(true)
    }
  }, [initialTaskId]) // eslint-disable-line react-hooks/exhaustive-deps
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [historial, setHistorial] = useState<Record<string, HistorialEntry[]>>({})
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: "", description: "", assigneeId: "",
    priority: "Media" as Task["priority"],
    disciplina: "Marketing" as TaskDisciplina,
    tipoTarea: "Diseño" as TaskTipo,
    cliente: "", fechaInicio: "", dueDate: "", project: "",
    tiempoEstimado: "", tiempoEmpleado: "",
  })

  function toggleUser(userId: string) {
    setSelectedUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) { next.delete(userId) } else { next.add(userId) }
      return next
    })
  }

  const filtered = useMemo(() => {
    if (canFilterUsers) {
      return selectedUserIds.size === 0 ? tasks : tasks.filter((t) => selectedUserIds.has(t.assignee.id))
    }
    if (currentUserName) {
      const mine = tasks.filter((t) => t.assignee.name === currentUserName)
      return mine.length > 0 ? mine : tasks
    }
    return tasks
  }, [tasks, selectedUserIds, canFilterUsers, currentUserName])

  function addHistorialEntry(taskId: string, type: HistorialEntry["type"], description: string) {
    if (!context) return
    const entry: HistorialEntry = {
      id: `h-${Date.now()}`,
      timestamp: new Date().toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      authorName: `${context.usuario.nombre} ${context.usuario.apellido}`,
      authorInitials: `${context.usuario.nombre[0]}${context.usuario.apellido[0]}`.toUpperCase(),
      type,
      description,
    }
    setHistorial((prev) => ({ ...prev, [taskId]: [...(prev[taskId] ?? []), entry] }))
  }

  function handleTaskClick(task: Task) {
    setSelectedTask(task)
    setDetailOpen(true)
  }

  function handleStatusChange(taskId: string, status: TaskStatus) {
    const prev = tasks.find((t) => t.id === taskId)?.status
    onUpdateStatus(taskId, status)
    setSelectedTask((t) => t?.id === taskId ? { ...t, status } : t)
    addHistorialEntry(taskId, "status_change", `Estado cambiado de "${prev}" → "${status}"`)
  }

  function handleEdit(taskId: string, updates: Partial<Omit<Task, "id">>) {
    onEditTask(taskId, updates)
    setSelectedTask((t) => t?.id === taskId ? { ...t, ...updates } : t)
    addHistorialEntry(taskId, "edit", "Tarea editada")
  }

  function handleAddComment(taskId: string, content: string) {
    if (!context) return
    const c: Comment = {
      id: `c-${Date.now()}`,
      taskId,
      authorName: `${context.usuario.nombre} ${context.usuario.apellido}`,
      authorInitials: `${context.usuario.nombre[0]}${context.usuario.apellido[0]}`.toUpperCase(),
      authorAvatarUrl: context.usuario.urlImagenPerfil ?? null,
      content,
      timestamp: new Date().toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    }
    setComments((prev) => ({ ...prev, [taskId]: [...(prev[taskId] ?? []), c] }))
  }

  function handleAdd() {
    const assignee = teamMembers.find((m) => m.id === newTask.assigneeId) ?? teamMembers[0]
    onAddTask({
      title: newTask.title, description: newTask.description,
      assignee, assignedBy: currentUserName ?? "Admin",
      status: "Pendiente", priority: newTask.priority,
      disciplina: newTask.disciplina, tipoTarea: newTask.tipoTarea,
      cliente: newTask.cliente, fechaInicio: newTask.fechaInicio,
      dueDate: newTask.dueDate, project: newTask.project,
      tiempoEstimado: newTask.tiempoEstimado ? Number(newTask.tiempoEstimado) : null,
      tiempoEmpleado: newTask.tiempoEmpleado ? Number(newTask.tiempoEmpleado) : null,
    })
    setNewTask({ title: "", description: "", assigneeId: "", priority: "Media", disciplina: "Marketing", tipoTarea: "Diseño", cliente: "", fechaInicio: "", dueDate: "", project: "", tiempoEstimado: "", tiempoEmpleado: "" })
    setNewTaskOpen(false)
  }

  const columns: TaskStatus[] = ["Pendiente", "En progreso", "En revision", "Completada", "Cancelada"]

  return (
    <div className="flex flex-col gap-4">

      {/* Filtros + acción */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {canFilterUsers && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedUserIds(new Set())}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                selectedUserIds.size === 0
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/40"
              }`}
            >
              Todos
            </button>
            {uniqueAssignees.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => toggleUser(user.id)}
                title={user.name}
                className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition-colors ${
                  selectedUserIds.has(user.id)
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/40"
                }`}
              >
                <Avatar className="size-4">
                  <AvatarFallback className="text-[8px]">{user.initials}</AvatarFallback>
                </Avatar>
                {user.name.split(" ")[0]}
              </button>
            ))}
          </div>
        )}

        <Sheet open={helpOpen} onOpenChange={setHelpOpen}>
          <SheetContent className="flex w-full flex-col sm:max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
            <SheetHeader className="pb-2">
              <SheetTitle>¿Cómo funciona esta sección?</SheetTitle>
              <p className="text-sm text-muted-foreground">Guía rápida de tareas</p>
            </SheetHeader>
            <ScrollArea className="-mx-6 flex-1">
              <div className="px-6 py-3 space-y-5 pb-6 text-sm text-muted-foreground text-justify">

                <div className="space-y-1.5">
                  <p className="font-semibold text-foreground">📋 Tarjetas de tarea</p>
                  <p>Cada tarjeta tiene un ID único (ej: <span className="font-mono text-xs bg-muted px-1 rounded">TASK-001</span>) para identificarla fácilmente. Hacé click en cualquier tarjeta para ver el detalle completo.</p>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <p className="font-semibold text-foreground">🔄 Estados y flujo</p>
                  <ul className="space-y-1 text-xs">
                    <li><span className="font-medium text-foreground">Pendiente</span> → En progreso, En revisión, Cancelada</li>
                    <li><span className="font-medium text-foreground">En progreso</span> → En revisión, Cancelada, Pendiente</li>
                    <li><span className="font-medium text-foreground">En revisión</span> → Completada, En progreso, Cancelada</li>
                    <li><span className="font-medium text-foreground">Completada</span> → En revisión (para reabrir)</li>
                    <li><span className="font-medium text-foreground">Cancelada</span> → Pendiente (para reactivar)</li>
                  </ul>
                  <p className="text-xs">Los botones de transición aparecen dentro del detalle de cada tarea.</p>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <p className="font-semibold text-foreground">🔍 Filtros por persona</p>
                  <p>Si tenés permisos de administrador, podés filtrar el tablero por miembro del equipo usando los chips de avatar en la parte superior. Podés seleccionar varios a la vez.</p>
                  <p>Sin permisos especiales, ves automáticamente solo las tareas asignadas a vos.</p>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <p className="font-semibold text-foreground">✏️ Editar una tarea</p>
                  <p>Abrí el detalle de la tarea y hacé click en el ícono de lápiz (requiere permisos). Podés modificar título, descripción, asignado, prioridad, fecha límite y tiempos.</p>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <p className="font-semibold text-foreground">⏱️ Tiempo estimado y empleado</p>
                  <p>Cada tarea puede tener un tiempo estimado (cuánto se cree que va a llevar) y un tiempo empleado (cuánto se tardó realmente). Se registran en horas decimales (ej: 1.5 = 1h 30min).</p>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <p className="font-semibold text-foreground">🔗 Compartir una tarea</p>
                  <p>En el detalle de la tarea encontrás un botón para copiar el link directo y otro para compartir por WhatsApp. El link incluye el ID de la tarea para identificarla al instante.</p>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <p className="font-semibold text-foreground">💬 Comentarios e historial</p>
                  <p>Dentro del detalle hay dos pestañas adicionales: <span className="font-medium text-foreground">Comentarios</span> (podés dejar notas sobre la tarea) e <span className="font-medium text-foreground">Historial</span> (registro automático de todos los cambios de estado y ediciones).</p>
                </div>

              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          <Button size="sm" className="gap-1.5" onClick={() => setNewTaskOpen(true)}>
            <Plus className="size-3.5" />
            Nueva tarea
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setHelpOpen(true)}>
            <HelpCircle className="size-3.5" />
            Ayuda
          </Button>
        </div>

        <Sheet open={newTaskOpen} onOpenChange={setNewTaskOpen}>
          <SheetContent className="flex w-full flex-col sm:max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
            <SheetHeader className="pb-2">
              <SheetTitle>Nueva tarea</SheetTitle>
              <p className="text-sm text-muted-foreground">Asigná una tarea a un miembro del equipo.</p>
            </SheetHeader>
            <ScrollArea className="-mx-6 flex-1">
              <form
                id="new-task-form"
                onSubmit={(e) => { e.preventDefault(); handleAdd() }}
                className="px-6 py-3 space-y-5 pb-6"
              >
                {/* General */}
                <section className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">General</p>
                  <div className="space-y-2">
                    <Label htmlFor="nt-title">Título *</Label>
                    <Input id="nt-title" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="Nombre de la tarea" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nt-desc">Descripción</Label>
                    <Textarea id="nt-desc" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} rows={3} className="resize-none" placeholder="Detalle de la tarea..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nt-proj">Proyecto</Label>
                    <Input id="nt-proj" value={newTask.project} onChange={(e) => setNewTask({ ...newTask, project: e.target.value })} placeholder="Nombre del proyecto" />
                  </div>
                </section>

                <Separator />

                {/* Clasificación */}
                <section className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clasificación</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Disciplina</Label>
                      <Select value={newTask.disciplina} onValueChange={(v) => setNewTask({ ...newTask, disciplina: v as TaskDisciplina })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Diseño">Diseño</SelectItem>
                          <SelectItem value="Desarrollo">Desarrollo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de tarea</Label>
                      <Select value={newTask.tipoTarea} onValueChange={(v) => setNewTask({ ...newTask, tipoTarea: v as TaskTipo })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TIPO_TAREA_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nt-cliente">Cliente</Label>
                    <Input id="nt-cliente" value={newTask.cliente} onChange={(e) => setNewTask({ ...newTask, cliente: e.target.value })} placeholder="Nombre del cliente" />
                  </div>
                </section>

                <Separator />

                {/* Asignación */}
                <section className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Asignación</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Asignar a *</Label>
                      <Select value={newTask.assigneeId} onValueChange={(v) => setNewTask({ ...newTask, assigneeId: v })}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                          {teamMembers.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Prioridad</Label>
                      <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v as Task["priority"] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Alta">Alta</SelectItem>
                          <SelectItem value="Media">Media</SelectItem>
                          <SelectItem value="Baja">Baja</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nt-inicio">Fecha inicio</Label>
                      <Input id="nt-inicio" type="date" value={newTask.fechaInicio} onChange={(e) => setNewTask({ ...newTask, fechaInicio: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nt-due">Fecha límite</Label>
                      <Input id="nt-due" type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} />
                    </div>
                  </div>
                </section>

                <Separator />

                {/* Tiempo */}
                <section className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tiempo</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nt-estimado">Estimado (horas)</Label>
                      <Input id="nt-estimado" type="number" min="0" step="0.5" placeholder="ej: 4" value={newTask.tiempoEstimado} onChange={(e) => setNewTask({ ...newTask, tiempoEstimado: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nt-empleado">Empleado (horas)</Label>
                      <Input id="nt-empleado" type="number" min="0" step="0.5" placeholder="ej: 2.5" value={newTask.tiempoEmpleado} onChange={(e) => setNewTask({ ...newTask, tiempoEmpleado: e.target.value })} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Usá decimales para minutos: 1.5 = 1h 30min</p>
                </section>
              </form>
            </ScrollArea>
            <div className="flex justify-end gap-2 pt-4 shrink-0">
              <Button variant="outline" onClick={() => setNewTaskOpen(false)}>Cancelar</Button>
              <Button type="submit" form="new-task-form" disabled={!newTask.title || !newTask.assigneeId}>Crear tarea</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Kanban 5 columnas (scroll horizontal en pantallas chicas) */}
      <div className="overflow-x-auto pb-2">
        <div className="grid grid-cols-5 gap-3 min-w-[900px]">
          {columns.map((status) => {
            const items = filtered.filter((t) => t.status === status)
            const style = STATUS_STYLES[status]
            return (
              <Card key={status} className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {style.icon}
                    <span className="truncate">{style.label}</span>
                    <Badge variant="secondary" className="ml-auto text-[10px] font-mono shrink-0">{items.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {items.map((t) => (
                    <TaskCard key={t.id} task={t} onClick={() => handleTaskClick(t)} />
                  ))}
                  {items.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Sin tareas</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {context && (
        <TaskDetailSheet
          task={selectedTask}
          comments={selectedTask ? (comments[selectedTask.id] ?? []) : []}
          historial={selectedTask ? (historial[selectedTask.id] ?? []) : []}
          currentUser={{ nombre: context.usuario.nombre, apellido: context.usuario.apellido, urlImagenPerfil: context.usuario.urlImagenPerfil }}
          canEdit={canEdit}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onAddComment={handleAddComment}
        />
      )}
    </div>
  )
}
