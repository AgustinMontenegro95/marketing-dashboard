"use client"

import { useState } from "react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Calendar, User, Briefcase, Clock, Pencil, Copy, Check, MessageCircle, History, Share2, Tag, Building2 } from "lucide-react"
import { toast } from "sonner"
import type { Task, TaskStatus, TaskDisciplina, TaskTipo } from "./communication-page-content"
import { teamMembers } from "./communication-page-content"
import { STATUS_TRANSITIONS, STATUS_STYLES, DISCIPLINA_STYLES, TIPO_TAREA_OPTIONS, type Comment, type HistorialEntry } from "./task-board"

type Props = {
  task: Task | null
  comments: Comment[]
  historial: HistorialEntry[]
  currentUser: { nombre: string; apellido: string; urlImagenPerfil?: string | null }
  canEdit: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
  onEdit: (taskId: string, updates: Partial<Omit<Task, "id">>) => void
  onAddComment: (taskId: string, content: string) => void
}

const PRIORITY_STYLES: Record<Task["priority"], string> = {
  "Alta":  "bg-red-500/10 text-red-600",
  "Media": "bg-amber-500/10 text-amber-600",
  "Baja":  "bg-muted text-muted-foreground",
}

const STATUS_BUTTON_STYLES: Record<TaskStatus, string> = {
  "Pendiente":   "border-border/60 text-muted-foreground hover:bg-muted",
  "En progreso": "border-blue-500/40 text-blue-600 hover:bg-blue-500/10",
  "En revision": "border-amber-500/40 text-amber-600 hover:bg-amber-500/10",
  "Completada":  "border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10",
  "Cancelada":   "border-red-500/40 text-red-600 hover:bg-red-500/10",
}

function formatHours(h: number | null): string {
  if (h == null) return "—"
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  if (mm === 0) return `${hh}h`
  return `${hh}h ${mm}min`
}

function userInitials(nombre: string, apellido: string) {
  return `${nombre[0] ?? ""}${apellido[0] ?? ""}`.toUpperCase()
}

const HISTORIAL_ICONS: Record<HistorialEntry["type"], string> = {
  created:       "🆕",
  status_change: "🔄",
  edit:          "✏️",
  time_update:   "⏱️",
}

function TimeInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const totalMinutes = value != null ? Math.round(value * 60) : 0
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  function update(h: number, m: number) {
    const total = h * 60 + m
    onChange(total > 0 ? total / 60 : null)
  }

  function addMinutes(add: number) {
    const newTotal = Math.max(0, totalMinutes + add)
    onChange(newTotal > 0 ? newTotal / 60 : null)
  }

  const QUICK = [
    { label: "+15m", mins: 15 },
    { label: "+30m", mins: 30 },
    { label: "+1h",  mins: 60 },
    { label: "+2h",  mins: 120 },
    { label: "+4h",  mins: 240 },
  ]

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {QUICK.map(({ label, mins }) => (
          <button
            key={label}
            type="button"
            onClick={() => addMinutes(mins)}
            className="text-[11px] px-2 py-0.5 rounded border border-border hover:border-foreground/40 hover:bg-muted transition-colors font-mono"
          >
            {label}
          </button>
        ))}
        {totalMinutes > 0 && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[11px] px-2 py-0.5 rounded border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors ml-auto"
          >
            Limpiar
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min="0"
            max="999"
            className="w-16 text-center tabular-nums"
            value={hours === 0 ? "" : hours}
            placeholder="0"
            onChange={(e) => update(Math.max(0, parseInt(e.target.value) || 0), minutes)}
          />
          <span className="text-sm text-muted-foreground">h</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min="0"
            max="59"
            className="w-16 text-center tabular-nums"
            value={minutes === 0 ? "" : minutes}
            placeholder="0"
            onChange={(e) => {
              const m = Math.min(59, Math.max(0, parseInt(e.target.value) || 0))
              update(hours, m)
            }}
          />
          <span className="text-sm text-muted-foreground">min</span>
        </div>
        {totalMinutes > 0 && (
          <span className="text-xs text-muted-foreground font-mono">= {formatHours(value)}</span>
        )}
      </div>
    </div>
  )
}

function renderHistorialDescription(entry: HistorialEntry) {
  if (entry.type === "status_change") {
    const match = entry.description.match(/de "(.+)" → "(.+)"/)
    if (match) {
      const fromStatus = match[1] as TaskStatus
      const toStatus = match[2] as TaskStatus
      return (
        <p className="text-xs text-foreground leading-snug flex items-center flex-wrap gap-1">
          Estado cambiado de{" "}
          <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLES[fromStatus]?.badge ?? "bg-muted text-muted-foreground"}`}>
            {STATUS_STYLES[fromStatus]?.icon}
            {fromStatus}
          </span>
          <span className="text-muted-foreground">→</span>
          <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLES[toStatus]?.badge ?? "bg-muted text-muted-foreground"}`}>
            {STATUS_STYLES[toStatus]?.icon}
            {toStatus}
          </span>
        </p>
      )
    }
  }
  return <p className="text-xs text-foreground leading-snug">{entry.description}</p>
}

export function TaskDetailSheet({
  task, comments, historial, currentUser, canEdit,
  open, onOpenChange, onStatusChange, onEdit, onAddComment,
}: Props) {
  const [editMode, setEditMode] = useState(false)
  const [comment, setComment] = useState("")
  const [copied, setCopied] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Omit<Task, "id">>>({})

  if (!task) return null

  const transitions = STATUS_TRANSITIONS[task.status]

  function startEdit() {
    setEditForm({
      title: task!.title,
      description: task!.description,
      assignee: task!.assignee,
      priority: task!.priority,
      disciplina: task!.disciplina,
      tipoTarea: task!.tipoTarea,
      cliente: task!.cliente,
      fechaInicio: task!.fechaInicio,
      dueDate: task!.dueDate,
      project: task!.project,
      tiempoEstimado: task!.tiempoEstimado,
      tiempoEmpleado: task!.tiempoEmpleado,
    })
    setEditMode(true)
  }

  function saveEdit() {
    onEdit(task!.id, editForm)
    setEditMode(false)
  }

  function handleAddComment() {
    if (!comment.trim()) return
    onAddComment(task!.id, comment.trim())
    setComment("")
  }

  function copyLink() {
    const url = `${window.location.origin}/comunicacion?tarea=${task!.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      toast.success("Link copiado")
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function shareWhatsApp() {
    const url = `${window.location.origin}/comunicacion?tarea=${task!.id}`
    const text = encodeURIComponent(`📋 ${task!.id}: ${task!.title}\n${url}`)
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank")
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setEditMode(false) }}>
      <SheetContent
        className="flex w-full flex-col sm:max-w-lg"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <SheetHeader className="pb-2">
          <div className="pr-6">
            <p className="text-xs font-mono text-muted-foreground mb-0.5">{task.id}</p>
            <SheetTitle className="text-base leading-snug">{task.title}</SheetTitle>
          </div>

          {/* Badges estado + prioridad */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[task.status].badge}`}>
              {STATUS_STYLES[task.status].icon}
              {STATUS_STYLES[task.status].label}
            </span>
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}>
              {task.priority}
            </span>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {canEdit && !editMode && (
              <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs px-2.5" onClick={startEdit}>
                <Pencil className="size-3.5" />
                Editar
              </Button>
            )}
            <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs px-2.5" onClick={copyLink}>
              {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
              {copied ? "¡Copiado!" : "Copiar link"}
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs px-2.5 hover:border-green-500/40 hover:text-green-600" onClick={shareWhatsApp}>
              <Share2 className="size-3.5" />
              WhatsApp
            </Button>
          </div>

          {/* Botones de transición */}
          {transitions.length > 0 && !editMode && (
            <div className="flex flex-col gap-1.5 pt-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mover a</p>
              <div className="flex flex-wrap gap-1.5">
                {transitions.map((next) => (
                  <button
                    key={next}
                    type="button"
                    className={`inline-flex items-center gap-1.5 h-7 rounded-md border px-2.5 text-xs font-medium transition-colors ${STATUS_BUTTON_STYLES[next]}`}
                    onClick={() => onStatusChange(task.id, next)}
                  >
                    {STATUS_STYLES[next].icon}
                    {STATUS_STYLES[next].label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </SheetHeader>

        {/* Tabs */}
        <Tabs defaultValue="detalle" className="flex flex-col flex-1 min-h-0">
          <TabsList className="shrink-0 w-full">
            <TabsTrigger value="detalle" className="flex-1 gap-1.5 text-xs">
              <User className="size-3.5" /> Detalles
            </TabsTrigger>
            <TabsTrigger value="comentarios" className="flex-1 gap-1.5 text-xs">
              <MessageCircle className="size-3.5" /> Comentarios {comments.length > 0 && `(${comments.length})`}
            </TabsTrigger>
            <TabsTrigger value="historial" className="flex-1 gap-1.5 text-xs">
              <History className="size-3.5" /> Historial
            </TabsTrigger>
          </TabsList>

          {/* ── TAB: DETALLES ── */}
          <TabsContent value="detalle" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="-mx-6 h-full">
              <div className="px-6 py-3 space-y-5 pb-6">

                {editMode ? (
                  /* Formulario de edición */
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input value={editForm.title ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Textarea rows={3} className="resize-none" value={editForm.description ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Asignar a</Label>
                        <Select
                          value={editForm.assignee?.id ?? ""}
                          onValueChange={(v) => {
                            const m = teamMembers.find((x) => x.id === v)
                            if (m) setEditForm((p) => ({ ...p, assignee: m }))
                          }}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {teamMembers.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Prioridad</Label>
                        <Select value={editForm.priority ?? "Media"} onValueChange={(v) => setEditForm((p) => ({ ...p, priority: v as Task["priority"] }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Alta">Alta</SelectItem>
                            <SelectItem value="Media">Media</SelectItem>
                            <SelectItem value="Baja">Baja</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Disciplina</Label>
                        <Select value={editForm.disciplina ?? "Marketing"} onValueChange={(v) => setEditForm((p) => ({ ...p, disciplina: v as TaskDisciplina }))}>
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
                        <Select value={editForm.tipoTarea ?? "Diseño"} onValueChange={(v) => setEditForm((p) => ({ ...p, tipoTarea: v as TaskTipo }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {TIPO_TAREA_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Cliente</Label>
                      <Input value={editForm.cliente ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, cliente: e.target.value }))} placeholder="Nombre del cliente" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Proyecto</Label>
                        <Input value={editForm.project ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, project: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Fecha inicio</Label>
                        <Input type="date" value={editForm.fechaInicio ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, fechaInicio: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Fecha límite</Label>
                        <Input type="date" value={editForm.dueDate ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, dueDate: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Tiempo estimado</Label>
                      <TimeInput
                        value={editForm.tiempoEstimado ?? null}
                        onChange={(v) => setEditForm((p) => ({ ...p, tiempoEstimado: v }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tiempo empleado</Label>
                      <TimeInput
                        value={editForm.tiempoEmpleado ?? null}
                        onChange={(v) => setEditForm((p) => ({ ...p, tiempoEmpleado: v }))}
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={saveEdit}>Guardar</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  /* Vista de detalles */
                  <>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Building2 className="size-3.5 shrink-0" />
                        <span className="text-xs">Cliente</span>
                      </div>
                      <span className="text-xs font-medium">{task.cliente || "—"}</span>

                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Tag className="size-3.5 shrink-0" />
                        <span className="text-xs">Disciplina</span>
                      </div>
                      <span className={`inline-flex items-center self-center rounded px-1.5 py-0.5 text-[10px] font-semibold w-fit ${DISCIPLINA_STYLES[task.disciplina]}`}>
                        {task.disciplina}
                      </span>

                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Tag className="size-3.5 shrink-0" />
                        <span className="text-xs">Tipo</span>
                      </div>
                      <span className="text-xs font-medium">{task.tipoTarea}</span>

                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="size-3.5 shrink-0" />
                        <span className="text-xs">Asignado a</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Avatar className="size-5">
                          <AvatarFallback className="text-[9px]">{task.assignee.initials}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">{task.assignee.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="size-3.5 shrink-0" />
                        <span className="text-xs">Asignado por</span>
                      </div>
                      <span className="text-xs font-medium">{task.assignedBy}</span>

                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Briefcase className="size-3.5 shrink-0" />
                        <span className="text-xs">Proyecto</span>
                      </div>
                      <span className="text-xs font-medium truncate">{task.project || "—"}</span>

                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="size-3.5 shrink-0" />
                        <span className="text-xs">Inicio</span>
                      </div>
                      <span className="text-xs font-medium font-mono">{task.fechaInicio || "—"}</span>

                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="size-3.5 shrink-0" />
                        <span className="text-xs">Vence</span>
                      </div>
                      <span className="text-xs font-medium font-mono">{task.dueDate || "—"}</span>

                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="size-3.5 shrink-0" />
                        <span className="text-xs">Estimado</span>
                      </div>
                      <span className="text-xs font-medium">{formatHours(task.tiempoEstimado)}</span>

                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="size-3.5 shrink-0" />
                        <span className="text-xs">Empleado</span>
                      </div>
                      <span className="text-xs font-medium">{formatHours(task.tiempoEmpleado)}</span>
                    </div>

                    {task.description && (
                      <>
                        <Separator />
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descripción</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ── TAB: COMENTARIOS ── */}
          <TabsContent value="comentarios" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="-mx-6 h-full">
              <div className="px-6 py-3 space-y-4 pb-6">
                {comments.length === 0 && (
                  <p className="text-xs text-muted-foreground">Todavía no hay comentarios.</p>
                )}
                {comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2.5">
                    <Avatar className="size-6 mt-0.5 shrink-0">
                      <AvatarImage src={c.authorAvatarUrl ?? undefined} />
                      <AvatarFallback className="text-[9px]">{c.authorInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold">{c.authorName}</span>
                        <span className="text-[10px] text-muted-foreground">{c.timestamp}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="flex items-start gap-2.5">
                  <Avatar className="size-6 mt-2 shrink-0">
                    <AvatarImage src={currentUser.urlImagenPerfil ?? undefined} />
                    <AvatarFallback className="text-[9px]">
                      {userInitials(currentUser.nombre, currentUser.apellido)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Agregar un comentario... (Ctrl+Enter para enviar)"
                      rows={2}
                      className="resize-none text-sm"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddComment() }}
                    />
                    <Button size="sm" onClick={handleAddComment} disabled={!comment.trim()}>
                      Comentar
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ── TAB: HISTORIAL ── */}
          <TabsContent value="historial" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="-mx-6 h-full">
              <div className="px-6 py-3 space-y-3 pb-6">
                {historial.length === 0 && (
                  <p className="text-xs text-muted-foreground">No hay cambios registrados todavía.</p>
                )}
                {[...historial].reverse().map((entry) => (
                  <div key={entry.id} className="flex items-start gap-2.5">
                    <div className="size-6 shrink-0 flex items-center justify-center text-sm mt-0.5">
                      {HISTORIAL_ICONS[entry.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      {renderHistorialDescription(entry)}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-muted-foreground font-medium">{entry.authorName}</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">{entry.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
