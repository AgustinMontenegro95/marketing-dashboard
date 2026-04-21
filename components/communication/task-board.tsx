"use client"

import { useMemo, useState, useEffect } from "react"
import type { Task, TaskStatus, TaskDisciplina, TaskTipo, TeamMember, Comment, HistorialEntry } from "./communication-types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Plus, Clock, CheckCircle2, Circle, XCircle, Eye, HelpCircle, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TaskDetailSheet } from "./task-detail-sheet"
import { useAccess, useSession } from "@/components/auth/session-provider"
import { getTasks, createTask, updateTaskStatus, updateTask, addComment, getTaskDetail } from "@/lib/comunicacion-api"

// ─── Transiciones permitidas ──────────────────────────────────────────────────

export const STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  "Pendiente":   ["En progreso", "En revision", "Cancelada"],
  "En progreso": ["En revision", "Cancelada", "Pendiente"],
  "En revision": ["Completada", "En progreso", "Cancelada"],
  "Completada":  ["En revision"],
  "Cancelada":   ["Pendiente"],
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

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

// ─── TaskCard ─────────────────────────────────────────────────────────────────

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full text-left rounded-lg border border-border/50 bg-card p-3 flex flex-col gap-2 cursor-pointer hover:border-border hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] text-muted-foreground font-mono">{task.id}</p>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${DISCIPLINA_STYLES[task.disciplina]}`}>{task.disciplina}</span>
          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
        </div>
      </div>
      <h4 className="text-sm font-medium leading-tight">{task.title}</h4>
      <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
      {task.cliente && (
        <p className="text-[10px] text-muted-foreground truncate">
          <span className="font-medium text-foreground/70">{task.cliente}</span>
          {task.tipoTarea && <span className="ml-1 opacity-60">· {task.tipoTarea}</span>}
        </p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Avatar className="size-5">
            <AvatarFallback className="bg-foreground/10 text-foreground text-[8px] font-semibold">{task.assignee.initials}</AvatarFallback>
          </Avatar>
          <span className="text-[10px] text-muted-foreground">{task.assignee.name.split(" ")[0]}</span>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">{task.dueDate}</span>
      </div>
    </button>
  )
}

// ─── TaskBoard ────────────────────────────────────────────────────────────────

export function TaskBoard({
  teamMembers,
  initialTaskId,
}: {
  teamMembers: TeamMember[]
  initialTaskId?: string
}) {
  const access = useAccess()
  const { context } = useSession()
  const canEdit = access.canEdit("COMUNICACION") || access.canCreate("COMUNICACION")
  const currentUserName = context ? `${context.usuario.nombre} ${context.usuario.apellido}` : null

  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [helpOpen, setHelpOpen] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
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

  // ── Carga inicial ────────────────────────────────────────────────────────

  useEffect(() => {
    getTasks().then((data) => { setTasks(data); setLoadingTasks(false) })
  }, [])

  useEffect(() => {
    if (!initialTaskId || tasks.length === 0) return
    const task = tasks.find((t) => t.id === initialTaskId)
    if (task) { setSelectedTask(task); setDetailOpen(true) }
  }, [initialTaskId, tasks]) // eslint-disable-line react-hooks/exhaustive-deps


  function toggleUser(userId: string) {
    setSelectedUserIds((prev) => { const next = new Set(prev); if (next.has(userId)) { next.delete(userId) } else { next.add(userId) }; return next })
  }

  const filtered = useMemo(() => {
    if (selectedUserIds.size === 0) return tasks
    return tasks.filter((t) => selectedUserIds.has(t.assignee.id))
  }, [tasks, selectedUserIds, currentUserName])

  // ── Acciones ─────────────────────────────────────────────────────────────

  async function handleTaskClick(task: Task) {
    setSelectedTask(task)
    setDetailOpen(true)
    const detail = await getTaskDetail(task.id)
    if (detail) {
      setComments((prev) => ({ ...prev, [task.id]: detail.comments }))
      setHistorial((prev) => ({ ...prev, [task.id]: detail.historial }))
    }
  }

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    const ok = await updateTaskStatus(taskId, status)
    if (ok) {
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status } : t))
      setSelectedTask((t) => t?.id === taskId ? { ...t, status } : t)
      const detail = await getTaskDetail(taskId)
      if (detail) setHistorial((prev) => ({ ...prev, [taskId]: detail.historial }))
    }
  }

  async function handleEdit(taskId: string, updates: Partial<Omit<Task, "id">>) {
    const apiBody: Parameters<typeof updateTask>[1] = {}
    if (updates.title !== undefined) apiBody.title = updates.title
    if (updates.description !== undefined) apiBody.description = updates.description
    if (updates.assignee !== undefined) apiBody.assigneeId = updates.assignee.id
    if (updates.priority !== undefined) apiBody.priority = updates.priority
    if (updates.disciplina !== undefined) apiBody.disciplina = updates.disciplina
    if (updates.tipoTarea !== undefined) apiBody.tipoTarea = updates.tipoTarea
    if (updates.cliente !== undefined) apiBody.cliente = updates.cliente
    if (updates.project !== undefined) apiBody.project = updates.project
    if (updates.fechaInicio !== undefined) apiBody.fechaInicio = updates.fechaInicio
    if (updates.dueDate !== undefined) apiBody.dueDate = updates.dueDate
    if (updates.tiempoEstimado !== undefined) apiBody.tiempoEstimado = updates.tiempoEstimado
    if (updates.tiempoEmpleado !== undefined) apiBody.tiempoEmpleado = updates.tiempoEmpleado

    const updated = await updateTask(taskId, apiBody)
    if (updated) {
      setTasks((prev) => prev.map((t) => t.id === taskId ? updated : t))
      setSelectedTask((t) => t?.id === taskId ? updated : t)
      const detail = await getTaskDetail(taskId)
      if (detail) setHistorial((prev) => ({ ...prev, [taskId]: detail.historial }))
    }
  }

  async function handleAddComment(taskId: string, content: string) {
    const comment = await addComment(taskId, content)
    if (comment) setComments((prev) => ({ ...prev, [taskId]: [...(prev[taskId] ?? []), comment] }))
  }

  async function handleAdd() {
    if (!newTask.title || !newTask.assigneeId) return
    const created = await createTask({
      title: newTask.title,
      description: newTask.description || undefined,
      assigneeId: newTask.assigneeId,
      status: "Pendiente",
      priority: newTask.priority,
      disciplina: newTask.disciplina,
      tipoTarea: newTask.tipoTarea,
      cliente: newTask.cliente || undefined,
      project: newTask.project || undefined,
      fechaInicio: newTask.fechaInicio || undefined,
      dueDate: newTask.dueDate || undefined,
      tiempoEstimado: newTask.tiempoEstimado ? Number(newTask.tiempoEstimado) : null,
      tiempoEmpleado: newTask.tiempoEmpleado ? Number(newTask.tiempoEmpleado) : null,
    })
    if (created !== null) {
      setNewTask({ title: "", description: "", assigneeId: "", priority: "Media", disciplina: "Marketing", tipoTarea: "Diseño", cliente: "", fechaInicio: "", dueDate: "", project: "", tiempoEstimado: "", tiempoEmpleado: "" })
      setNewTaskOpen(false)
      getTasks().then(setTasks)
    }
  }

  const columns: TaskStatus[] = ["Pendiente", "En progreso", "En revision", "Completada", "Cancelada"]

  return (
    <div className="flex flex-col gap-4">

      {/* Filtros + acción */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" onClick={() => setSelectedUserIds(new Set())}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${selectedUserIds.size === 0 ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/40"}`}>
              Todos
            </button>
            {teamMembers.filter((m) => m.role !== null).map((user) => (
              <button key={user.id} type="button" onClick={() => toggleUser(user.id)} title={user.name}
                className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition-colors ${selectedUserIds.has(user.id) ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/40"}`}>
                <Avatar className="size-4"><AvatarFallback className="text-[8px]">{user.initials}</AvatarFallback></Avatar>
                {user.name.split(" ")[0]}
              </button>
            ))}
        </div>

        {/* Sheet de ayuda */}
        <Sheet open={helpOpen} onOpenChange={setHelpOpen}>
          <SheetContent className="flex w-full flex-col sm:max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
            <SheetHeader className="pb-2">
              <SheetTitle>¿Cómo funciona esta sección?</SheetTitle>
              <p className="text-sm text-muted-foreground">Guía rápida de tareas</p>
            </SheetHeader>
            <ScrollArea className="-mx-6 flex-1">
              <div className="px-6 py-3 space-y-5 pb-6 text-sm text-muted-foreground text-justify">
                <div className="space-y-1.5">
                  <p className="font-semibold text-foreground">📋 Tablero Kanban</p>
                  <p>Las tareas se organizan en columnas según su estado. Cada tarjeta muestra el ID, título, descripción, cliente, disciplina, prioridad, responsable y fecha límite. Hacé click en cualquier tarjeta para ver el detalle completo y realizar acciones.</p>
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <p className="font-semibold text-foreground">🔄 Estados y transiciones</p>
                  <ul className="space-y-1 text-xs">
                    <li><span className="font-medium text-foreground">Pendiente</span> → En progreso · En revisión · Cancelada</li>
                    <li><span className="font-medium text-foreground">En progreso</span> → En revisión · Cancelada · Pendiente</li>
                    <li><span className="font-medium text-foreground">En revisión</span> → Completada · En progreso · Cancelada</li>
                    <li><span className="font-medium text-foreground">Completada</span> → En revisión (para reabrir)</li>
                    <li><span className="font-medium text-foreground">Cancelada</span> → Pendiente (para reactivar)</li>
                  </ul>
                  <p className="text-xs mt-1">Solo se permiten las transiciones indicadas. No se puede saltar estados arbitrariamente.</p>
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <p className="font-semibold text-foreground">🏷️ Disciplinas y tipos</p>
                  <p>Cada tarea tiene una <span className="font-medium text-foreground">disciplina</span> (Marketing, Diseño, Desarrollo) y un <span className="font-medium text-foreground">tipo</span> (Diseño, Desarrollo, Copy, Pauta, Revisión, Reunión, Entrega). Esto permite clasificar y organizar el trabajo por área.</p>
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <p className="font-semibold text-foreground">🔍 Filtros por miembro</p>
                  <p>Usá los chips de la barra superior para filtrar el tablero por miembro del equipo. "Todos" muestra todas las tareas sin filtro.</p>
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <p className="font-semibold text-foreground">⏱️ Registro de tiempo</p>
                  <p>El tiempo estimado y empleado se registra en <span className="font-medium text-foreground">horas decimales</span>: 1.5 = 1h 30min · 0.5 = 30min · 2 = 2h.</p>
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <p className="font-semibold text-foreground">💬 Comentarios e historial</p>
                  <p>Dentro del detalle encontrás dos pestañas: <span className="font-medium text-foreground">Comentarios</span> para comunicación sobre la tarea, e <span className="font-medium text-foreground">Historial</span> con el registro automático de todos los cambios de estado, ediciones y actualizaciones de tiempo.</p>
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <p className="font-semibold text-foreground">🔗 Compartir tarea</p>
                  <p>Desde el detalle podés copiar un link directo a la tarea para enviárselo a otro miembro del equipo.</p>
                </div>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          <Button size="sm" className="gap-1.5" onClick={() => setNewTaskOpen(true)}>
            <Plus className="size-3.5" /> Nueva tarea
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setHelpOpen(true)}>
            <HelpCircle className="size-3.5" /> Ayuda
          </Button>
        </div>

        {/* Sheet nueva tarea */}
        <Sheet open={newTaskOpen} onOpenChange={setNewTaskOpen}>
          <SheetContent className="flex w-full flex-col sm:max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
            <SheetHeader className="pb-2">
              <SheetTitle>Nueva tarea</SheetTitle>
              <p className="text-sm text-muted-foreground">Asigná una tarea a un miembro del equipo.</p>
            </SheetHeader>
            <ScrollArea className="-mx-6 flex-1">
              <form id="new-task-form" onSubmit={(e) => { e.preventDefault(); handleAdd() }} className="px-6 py-3 space-y-5 pb-6">
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
                        <SelectContent>{TIPO_TAREA_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nt-cliente">Cliente</Label>
                    <Input id="nt-cliente" value={newTask.cliente} onChange={(e) => setNewTask({ ...newTask, cliente: e.target.value })} placeholder="Nombre del cliente" />
                  </div>
                </section>
                <Separator />
                <section className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Asignación</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Asignar a *</Label>
                      <Select value={newTask.assigneeId} onValueChange={(v) => setNewTask({ ...newTask, assigneeId: v })}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>{teamMembers.filter((m) => m.role !== null).map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
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

      {/* Kanban */}
      {loadingTasks ? (
        <div className="overflow-x-auto pb-2">
          <div className="grid grid-cols-5 gap-3 min-w-[900px]">
            {columns.map((status) => {
              const style = STATUS_STYLES[status]
              return (
                <Card key={status} className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {style.icon}
                      <span className="truncate">{style.label}</span>
                      <Skeleton className="ml-auto h-4 w-5 rounded" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {[1, 2, 3].slice(0, status === "Pendiente" ? 3 : status === "En progreso" ? 2 : 1).map((i) => (
                      <div key={i} className="rounded-lg border border-border/50 p-3 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <Skeleton className="h-3 w-16 rounded" />
                          <div className="flex gap-1">
                            <Skeleton className="h-4 w-14 rounded" />
                            <Skeleton className="h-4 w-10 rounded" />
                          </div>
                        </div>
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-3 w-4/5 rounded" />
                        <Skeleton className="h-3 w-2/3 rounded" />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Skeleton className="size-5 rounded-full" />
                            <Skeleton className="h-3 w-14 rounded" />
                          </div>
                          <Skeleton className="h-3 w-20 rounded" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ) : (
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
                    {items.map((t) => <TaskCard key={t.id} task={t} onClick={() => handleTaskClick(t)} />)}
                    {items.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Sin tareas</p>}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {context && (
        <TaskDetailSheet
          task={selectedTask}
          teamMembers={teamMembers}
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
