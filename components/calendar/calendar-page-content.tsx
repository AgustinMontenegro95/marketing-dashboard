"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Video,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  listarTiposActividad,
  crearTipoActividad,
  actualizarTipoActividad,
  eliminarTipoActividad,
  getMisActividades,
  getActividad,
  crearActividad,
  actualizarActividad,
  cancelarActividad,
  getFeriados,
  type TipoActividadDto,
  type ActividadDto,
  type FeriadoDto,
  type CrearActividadReq,
  type ActualizarActividadReq,
} from "@/lib/calendario"
import { buscarClientes, type ClienteDto } from "@/lib/clientes"
import { fetchEquipo, type EquipoUsuarioResumenDto } from "@/lib/equipo"
import { buscarProyectos, getProyecto, type ProyectoDto } from "@/lib/proyectos"

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toISO(date: string, time: string): string {
  return `${date}T${time}:00-03:00`
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
  } catch {
    return ""
  }
}

function formatDateHeader(year: number, month: number): string {
  const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ]
  return `${MONTHS[month - 1]} ${year}`
}

function formatDateDisplay(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

function toDateInputValue(iso: string): string {
  try {
    const d = new Date(iso)
    const y = d.getFullYear()
    const mo = (d.getMonth() + 1).toString().padStart(2, "0")
    const day = d.getDate().toString().padStart(2, "0")
    return `${y}-${mo}-${day}`
  } catch {
    return ""
  }
}

function toTimeInputValue(iso: string): string {
  try {
    const d = new Date(iso)
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
  } catch {
    return "09:00"
  }
}

function buildCalendarCells(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month - 1, 1)
  // 0=Sun..6=Sat → convert to 0=Mon..6=Sun
  let startDow = firstOfMonth.getDay() - 1
  if (startDow < 0) startDow = 6

  const cells: Date[] = []
  const start = new Date(year, month - 1, 1 - startDow)
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  }
  return cells
}

// ─── Form types ───────────────────────────────────────────────────────────────

type ActividadForm = {
  titulo: string
  descripcion: string
  tipoActividadId: string
  todoDia: boolean
  fechaInicio: string
  horaInicio: string
  fechaFin: string
  horaFin: string
  ubicacion: string
  urlReunion: string
  visibilidad: string
  clienteId: string
  proyectoId: string
  participantesIds: number[]
  recordatorios: { minutosAntes: string; canal: string }[]
}

function defaultForm(date?: string): ActividadForm {
  const today = date ?? new Date().toISOString().slice(0, 10)
  return {
    titulo: "",
    descripcion: "",
    tipoActividadId: "",
    todoDia: false,
    fechaInicio: today,
    horaInicio: "09:00",
    fechaFin: today,
    horaFin: "10:00",
    ubicacion: "",
    urlReunion: "",
    visibilidad: "1",
    clienteId: "",
    proyectoId: "",
    participantesIds: [],
    recordatorios: [],
  }
}

function actividadToForm(a: ActividadDto): ActividadForm {
  return {
    titulo: a.titulo,
    descripcion: a.descripcion ?? "",
    tipoActividadId: a.tipoActividadId != null ? String(a.tipoActividadId) : "",
    todoDia: a.todoDia,
    fechaInicio: toDateInputValue(a.inicioEn),
    horaInicio: toTimeInputValue(a.inicioEn),
    fechaFin: toDateInputValue(a.finEn),
    horaFin: toTimeInputValue(a.finEn),
    ubicacion: a.ubicacion ?? "",
    urlReunion: a.urlReunion ?? "",
    visibilidad: String(a.visibilidad),
    clienteId: a.clienteId != null ? String(a.clienteId) : "",
    proyectoId: a.proyectoId != null ? String(a.proyectoId) : "",
    participantesIds: a.participantes.map((p) => p.usuarioId),
    recordatorios: a.recordatorios.map((r) => ({
      minutosAntes: String(r.minutosAntes),
      canal: String(r.canal),
    })),
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ESTADO_LABELS: Record<number, string> = {
  1: "Programada",
  2: "Cancelada",
  3: "Completada",
}

const ESTADO_COLORS: Record<number, string> = {
  1: "bg-blue-100 text-blue-800",
  2: "bg-red-100 text-red-800",
  3: "bg-green-100 text-green-800",
}

const ROL_PARTICIPANTE_LABELS: Record<number, string> = {
  1: "Organizador",
  2: "Asistente",
  3: "Opcional",
}

const ASISTENCIA_LABELS: Record<number, string> = {
  1: "Pendiente",
  2: "Aceptó",
  3: "Rechazó",
  4: "Tentativo",
}

const CANAL_LABELS: Record<number, string> = {
  1: "App",
  2: "Email",
  3: "Push",
}

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

const DEFAULT_ACTIVITY_COLOR = "#6366f1"

// ─── Main component ───────────────────────────────────────────────────────────

export function CalendarPageContent() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const [actividades, setActividades] = useState<ActividadDto[]>([])
  const [feriados, setFeriados] = useState<FeriadoDto[]>([])
  const [tiposActividad, setTiposActividad] = useState<TipoActividadDto[]>([])
  const [usuarios, setUsuarios] = useState<EquipoUsuarioResumenDto[]>([])
  const [clientes, setClientes] = useState<ClienteDto[]>([])
  const [proyectos, setProyectos] = useState<ProyectoDto[]>([])

  const [loading, setLoading] = useState(true)
  const [loadingActividades, setLoadingActividades] = useState(false)

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailActividad, setDetailActividad] = useState<ActividadDto | null>(null)
  const [detailProyecto, setDetailProyecto] = useState<ProyectoDto | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Create / edit dialog
  const [formOpen, setFormOpen] = useState(false)
  const [editingActividad, setEditingActividad] = useState<ActividadDto | null>(null)
  const [form, setForm] = useState<ActividadForm>(defaultForm())
  const [saving, setSaving] = useState(false)

  // Types dialog
  const [tiposOpen, setTiposOpen] = useState(false)

  // Cancel confirmation
  const [cancelConfirmId, setCancelConfirmId] = useState<number | null>(null)
  const [cancelling, setCancelling] = useState(false)

  // Delete tipo confirmation
  const [deleteTipoId, setDeleteTipoId] = useState<number | null>(null)
  const [deletingTipo, setDeletingTipo] = useState(false)

  // Tipo editing state
  const [editingTipoId, setEditingTipoId] = useState<number | null>(null)
  const [editingTipoNombre, setEditingTipoNombre] = useState("")
  const [editingTipoColor, setEditingTipoColor] = useState("")

  // New tipo state
  const [newTipoNombre, setNewTipoNombre] = useState("")
  const [newTipoColor, setNewTipoColor] = useState("#6366f1")
  const [savingTipo, setSavingTipo] = useState(false)

  // Combobox open states
  const [participantesOpen, setParticipantesOpen] = useState(false)
  const [clientesComboOpen, setClientesComboOpen] = useState(false)
  const [proyectosOpen, setProyectosOpen] = useState(false)

  // ─── Initial load ──────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const [tipos, disciplinas, clientesPage] = await Promise.all([
          listarTiposActividad().catch(() => [] as TipoActividadDto[]),
          fetchEquipo().catch(() => []),
          buscarClientes({
            q: null,
            estado: null,
            condicionIva: null,
            pais: null,
            page: 0,
            size: 200,
          }).catch(() => null),
        ])
        if (cancelled) return
        setTiposActividad(tipos)

        const allUsuarios: EquipoUsuarioResumenDto[] = []
        for (const disc of disciplinas) {
          for (const u of disc.usuarios) {
            if (!allUsuarios.find((x) => x.id === u.id)) allUsuarios.push(u)
          }
        }
        setUsuarios(allUsuarios)
        setClientes(clientesPage?.contenido ?? [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  // ─── Load feriados on year change ──────────────────────────────────────────

  useEffect(() => {
    let cancelled = false
    getFeriados(year)
      .then((f) => {
        if (!cancelled) setFeriados(f)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [year])

  // ─── Load actividades on month/year change ─────────────────────────────────

  useEffect(() => {
    let cancelled = false
    setLoadingActividades(true)
    getMisActividades(year, month)
      .then((a) => {
        if (!cancelled) setActividades(a)
      })
      .catch(() => {
        if (!cancelled) setActividades([])
      })
      .finally(() => {
        if (!cancelled) setLoadingActividades(false)
      })
    return () => {
      cancelled = true
    }
  }, [year, month])

  // ─── Navigation ────────────────────────────────────────────────────────────

  function prevMonth() {
    if (month === 1) {
      setYear((y) => y - 1)
      setMonth(12)
    } else {
      setMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (month === 12) {
      setYear((y) => y + 1)
      setMonth(1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  // ─── Calendar grid data ────────────────────────────────────────────────────

  const cells = useMemo(() => buildCalendarCells(year, month), [year, month])
  const today = useMemo(() => new Date(), [])
  const todayStr = useMemo(() => {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`
  }, [])

  const feriadosByDate = useMemo(() => {
    const map = new Map<string, FeriadoDto>()
    for (const f of feriados) {
      map.set(f.date.slice(0, 10), f)
    }
    return map
  }, [feriados])

  const actividadesByDay = useMemo(() => {
    const map = new Map<string, ActividadDto[]>()
    for (const a of actividades) {
      const key = toDateInputValue(a.inicioEn)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(a)
    }
    return map
  }, [actividades])

  // ─── Open detail ───────────────────────────────────────────────────────────

  async function openDetail(a: ActividadDto) {
    setDetailActividad(a)
    setDetailProyecto(null)
    setDetailOpen(true)
    setLoadingDetail(true)
    try {
      const full = await getActividad(a.id)
      setDetailActividad(full)
      if (full.proyectoId != null) {
        getProyecto(full.proyectoId).then(setDetailProyecto).catch(() => {})
      }
    } catch (e: any) {
      toast.error(e.message ?? "No se pudo cargar la actividad")
    } finally {
      setLoadingDetail(false)
    }
  }

  // ─── Open create form ──────────────────────────────────────────────────────

  function openCreate(date?: string) {
    setEditingActividad(null)
    setForm(defaultForm(date))
    setFormOpen(true)
  }

  // ─── Open edit form ────────────────────────────────────────────────────────

  function openEdit(a: ActividadDto) {
    setEditingActividad(a)
    setForm(actividadToForm(a))
    setDetailOpen(false)
    setFormOpen(true)
  }

  // ─── Submit form ───────────────────────────────────────────────────────────

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titulo.trim()) {
      toast.error("El título es requerido")
      return
    }

    if (!editingActividad) {
      const now = new Date()
      const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
      if (form.fechaInicio < nowStr) {
        toast.error("No se puede crear una actividad en una fecha pasada")
        return
      }
      if (!form.todoDia && form.fechaInicio === nowStr) {
        const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
        if (form.horaInicio < currentTime) {
          toast.error("No se puede crear una actividad en un horario pasado")
          return
        }
      }
    }

    setSaving(true)
    try {
      const inicioEn = form.todoDia
        ? `${form.fechaInicio}T00:00:00-03:00`
        : toISO(form.fechaInicio, form.horaInicio)
      const finEn = form.todoDia
        ? `${form.fechaFin}T23:59:00-03:00`
        : toISO(form.fechaFin, form.horaFin)

      const recordatorios = form.recordatorios
        .filter((r) => r.minutosAntes !== "" && r.canal !== "")
        .map((r) => ({ minutosAntes: Number(r.minutosAntes), canal: Number(r.canal) }))

      if (editingActividad) {
        const body: ActualizarActividadReq = {
          titulo: form.titulo.trim(),
          descripcion: form.descripcion || null,
          tipoActividadId: form.tipoActividadId ? Number(form.tipoActividadId) : null,
          inicioEn,
          finEn,
          todoDia: form.todoDia,
          zonaHoraria: "America/Argentina/Buenos_Aires",
          clienteId: form.clienteId ? Number(form.clienteId) : null,
          proyectoId: form.proyectoId ? Number(form.proyectoId) : null,
          ubicacion: form.ubicacion || null,
          urlReunion: form.urlReunion || null,
          visibilidad: Number(form.visibilidad),
          participantesIds: form.participantesIds,
          recordatorios,
        }
        await actualizarActividad(editingActividad.id, body)
        toast.success("Actividad actualizada")
      } else {
        const body: CrearActividadReq = {
          titulo: form.titulo.trim(),
          descripcion: form.descripcion || null,
          tipoActividadId: form.tipoActividadId ? Number(form.tipoActividadId) : null,
          inicioEn,
          finEn,
          todoDia: form.todoDia,
          zonaHoraria: "America/Argentina/Buenos_Aires",
          clienteId: form.clienteId ? Number(form.clienteId) : null,
          proyectoId: form.proyectoId ? Number(form.proyectoId) : null,
          ubicacion: form.ubicacion || null,
          urlReunion: form.urlReunion || null,
          visibilidad: Number(form.visibilidad),
          participantesIds: form.participantesIds,
          recordatorios,
        }
        await crearActividad(body)
        toast.success("Actividad creada")
      }

      setFormOpen(false)
      const updated = await getMisActividades(year, month).catch(() => actividades)
      setActividades(updated)
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar la actividad")
    } finally {
      setSaving(false)
    }
  }

  // ─── Cancel activity ───────────────────────────────────────────────────────

  async function handleCancelActividad() {
    if (cancelConfirmId == null) return
    setCancelling(true)
    try {
      await cancelarActividad(cancelConfirmId)
      toast.success("Actividad cancelada")
      setCancelConfirmId(null)
      setDetailOpen(false)
      const updated = await getMisActividades(year, month).catch(() => actividades)
      setActividades(updated)
    } catch (e: any) {
      toast.error(e.message ?? "Error al cancelar la actividad")
    } finally {
      setCancelling(false)
    }
  }

  // ─── Tipo handlers ─────────────────────────────────────────────────────────

  function startEditTipo(t: TipoActividadDto) {
    setEditingTipoId(t.id)
    setEditingTipoNombre(t.nombre)
    setEditingTipoColor(t.color)
  }

  async function saveEditTipo(id: number) {
    if (!editingTipoNombre.trim()) {
      toast.error("El nombre es requerido")
      return
    }
    setSavingTipo(true)
    try {
      const updated = await actualizarTipoActividad(id, editingTipoNombre.trim(), editingTipoColor)
      setTiposActividad((prev) => prev.map((t) => (t.id === id ? updated : t)))
      setEditingTipoId(null)
      toast.success("Tipo actualizado")
    } catch (e: any) {
      toast.error(e.message ?? "Error al actualizar el tipo")
    } finally {
      setSavingTipo(false)
    }
  }

  async function handleDeleteTipo() {
    if (deleteTipoId == null) return
    setDeletingTipo(true)
    try {
      await eliminarTipoActividad(deleteTipoId)
      setTiposActividad((prev) => prev.filter((t) => t.id !== deleteTipoId))
      setDeleteTipoId(null)
      toast.success("Tipo eliminado")
    } catch (e: any) {
      toast.error(e.message ?? "Error al eliminar el tipo")
    } finally {
      setDeletingTipo(false)
    }
  }

  async function handleCreateTipo() {
    if (!newTipoNombre.trim()) {
      toast.error("El nombre es requerido")
      return
    }
    setSavingTipo(true)
    try {
      const created = await crearTipoActividad(newTipoNombre.trim(), newTipoColor)
      setTiposActividad((prev) => [...prev, created])
      setNewTipoNombre("")
      setNewTipoColor("#6366f1")
      toast.success("Tipo creado")
    } catch (e: any) {
      toast.error(e.message ?? "Error al crear el tipo")
    } finally {
      setSavingTipo(false)
    }
  }

  // ─── Form helpers ──────────────────────────────────────────────────────────

  function updateForm<K extends keyof ActividadForm>(key: K, value: ActividadForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleParticipante(id: number) {
    setForm((prev) => {
      const ids = prev.participantesIds
      return {
        ...prev,
        participantesIds: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
      }
    })
  }

  function addRecordatorio() {
    setForm((prev) => ({
      ...prev,
      recordatorios: [...prev.recordatorios, { minutosAntes: "30", canal: "1" }],
    }))
  }

  function removeRecordatorio(idx: number) {
    setForm((prev) => ({
      ...prev,
      recordatorios: prev.recordatorios.filter((_, i) => i !== idx),
    }))
  }

  function updateRecordatorio(idx: number, key: "minutosAntes" | "canal", value: string) {
    setForm((prev) => {
      const recs = [...prev.recordatorios]
      recs[idx] = { ...recs[idx], [key]: value }
      return { ...prev, recordatorios: recs }
    })
  }

  const selectedCliente = clientes.find((c) => String(c.id) === form.clienteId)
  const selectedProyecto = proyectos.find((p) => String(p.id) === form.proyectoId)

  // Load projects when clienteId changes in form
  useEffect(() => {
    if (!formOpen) return
    if (!form.clienteId) {
      setProyectos([])
      return
    }
    buscarProyectos({
      q: null,
      clienteId: Number(form.clienteId),
      disciplinaId: null,
      liderUsuarioId: null,
      estado: null,
      inicioDesde: null,
      inicioHasta: null,
      page: 0,
      size: 200,
    })
      .then((res) => setProyectos(res.contenido))
      .catch(() => setProyectos([]))
  }, [form.clienteId, formOpen])

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendario</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestioná tus actividades y eventos del equipo
          </p>
        </div>
        <Button onClick={() => openCreate()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva actividad
        </Button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold w-44 text-center">
            {formatDateHeader(year, month)}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => setTiposOpen(true)}>
          Tipos de actividad
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="border rounded-lg overflow-hidden bg-background">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {WEEKDAY_LABELS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        {loadingActividades ? (
          <div className="grid grid-cols-7">
            {Array.from({ length: 42 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "min-h-[110px] border-b border-r p-2",
                  i % 7 === 6 && "border-r-0"
                )}
              >
                <Skeleton className="h-4 w-6 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((cell, idx) => {
              const isCurrentMonth =
                cell.getMonth() + 1 === month && cell.getFullYear() === year
              const isToday = isSameDay(cell, today)
              const dateKey = `${cell.getFullYear()}-${(cell.getMonth() + 1)
                .toString()
                .padStart(2, "0")}-${cell.getDate().toString().padStart(2, "0")}`
              const feriado = feriadosByDate.get(dateKey)
              const dayActividades = actividadesByDay.get(dateKey) ?? []
              const visible = dayActividades.slice(0, 3)
              const extra = dayActividades.length - 3
              const isPast = dateKey < todayStr

              return (
                <div
                  key={idx}
                  className={cn(
                    "min-h-[110px] border-b border-r p-1.5 transition-colors",
                    isPast ? "opacity-50" : "cursor-pointer hover:bg-muted/40",
                    !isCurrentMonth && "bg-muted/20",
                    idx % 7 === 6 && "border-r-0",
                    Math.floor(idx / 7) === 5 &&
                      idx >= 35 &&
                      "border-b-0"
                  )}
                  onClick={() => !isPast && openCreate(dateKey)}
                >
                  {/* Date number + holiday dot */}
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={cn(
                        "text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full",
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : isCurrentMonth
                            ? "text-foreground"
                            : "text-muted-foreground/50"
                      )}
                    >
                      {cell.getDate()}
                    </span>
                    {feriado && (
                      <span
                        className="h-2 w-2 rounded-full bg-amber-500 shrink-0"
                        title={feriado.localName}
                      />
                    )}
                  </div>

                  {/* Holiday label */}
                  {feriado && (
                    <p className="text-[9px] text-amber-600 font-medium leading-tight mb-0.5 truncate">
                      {feriado.localName}
                    </p>
                  )}

                  {/* Activity chips */}
                  <div className="flex flex-col gap-0.5">
                    {visible.map((a) => {
                      const color = a.tipoActividadColor ?? DEFAULT_ACTIVITY_COLOR
                      return (
                        <button
                          key={a.id}
                          className="text-left text-[10px] font-medium rounded px-1 py-0.5 truncate border leading-tight w-full"
                          style={{
                            backgroundColor: color + "20",
                            borderColor: color,
                            color,
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            openDetail(a)
                          }}
                          title={a.titulo}
                        >
                          {!a.todoDia && (
                            <span className="opacity-70 mr-0.5">{formatTime(a.inicioEn)}</span>
                          )}
                          {a.titulo}
                        </button>
                      )
                    })}
                    {extra > 0 && (
                      <span className="text-[9px] text-muted-foreground pl-1">
                        +{extra} más
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── Activity Detail Dialog ──────────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="pr-6">
              {detailActividad?.titulo ?? "Detalle de actividad"}
            </DialogTitle>
            {detailActividad && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    ESTADO_COLORS[detailActividad.estado] ?? "bg-gray-100 text-gray-700"
                  )}
                >
                  {ESTADO_LABELS[detailActividad.estado] ?? "—"}
                </span>
                {detailActividad.tipoActividadNombre && detailActividad.tipoActividadColor && (
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: detailActividad.tipoActividadColor + "20",
                      borderColor: detailActividad.tipoActividadColor,
                      color: detailActividad.tipoActividadColor,
                    }}
                  >
                    {detailActividad.tipoActividadNombre}
                  </span>
                )}
              </div>
            )}
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex flex-col gap-3 py-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : detailActividad ? (
            <ScrollArea className="flex-1 pr-2">
              <div className="flex flex-col gap-3 py-2">
                {/* Date / time */}
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground font-medium w-20 shrink-0">Fecha</span>
                  <span>
                    {detailActividad.todoDia
                      ? `${formatDateDisplay(detailActividad.inicioEn)} — Todo el día`
                      : `${formatDateDisplay(detailActividad.inicioEn)} · ${formatTime(detailActividad.inicioEn)} – ${formatTime(detailActividad.finEn)}`}
                  </span>
                </div>

                {/* Location */}
                {detailActividad.ubicacion && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground font-medium w-20 shrink-0">
                      Ubicación
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {detailActividad.ubicacion}
                    </span>
                  </div>
                )}

                {/* URL Reunión */}
                {detailActividad.urlReunion && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground font-medium w-20 shrink-0">
                      Reunión
                    </span>
                    <a
                      href={detailActividad.urlReunion}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline flex items-center gap-1.5"
                    >
                      <Video className="h-3.5 w-3.5 shrink-0" />
                      Unirse
                    </a>
                  </div>
                )}

                {/* Description */}
                {detailActividad.descripcion && (
                  <div className="flex flex-col gap-1 text-sm">
                    <span className="text-muted-foreground font-medium">Descripción</span>
                    <p className="text-foreground whitespace-pre-line">
                      {detailActividad.descripcion}
                    </p>
                  </div>
                )}

                {/* Client */}
                {detailActividad.clienteId != null && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground font-medium w-20 shrink-0">
                      Cliente
                    </span>
                    <span>
                      {clientes.find((c) => c.id === detailActividad.clienteId)?.nombre ??
                        `#${detailActividad.clienteId}`}
                    </span>
                  </div>
                )}

                {/* Project */}
                {detailActividad.proyectoId != null && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground font-medium w-20 shrink-0">
                      Proyecto
                    </span>
                    <span>
                      {detailProyecto ? detailProyecto.nombre : `#${detailActividad.proyectoId}`}
                    </span>
                  </div>
                )}

                {/* Visibility */}
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground font-medium w-20 shrink-0">
                    Visibilidad
                  </span>
                  <span>{detailActividad.visibilidad === 2 ? "Privada" : "Pública"}</span>
                </div>

                {/* Participants */}
                {detailActividad.participantes.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-semibold">Participantes</span>
                      {detailActividad.participantes.map((p) => (
                        <div
                          key={p.usuarioId}
                          className="flex items-center justify-between text-sm gap-2"
                        >
                          <div className="min-w-0 flex flex-col">
                            <span className="font-medium truncate">{p.nombreCompleto}</span>
                            <span className="text-muted-foreground text-xs truncate">
                              {p.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge variant="outline" className="text-xs">
                              {ROL_PARTICIPANTE_LABELS[p.rol] ?? `Rol ${p.rol}`}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {ASISTENCIA_LABELS[p.asistencia] ?? "—"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Reminders */}
                {detailActividad.recordatorios.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-semibold">Recordatorios</span>
                      {detailActividad.recordatorios.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <Bell className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            {r.minutosAntes} min antes —{" "}
                            {CANAL_LABELS[r.canal] ?? `Canal ${r.canal}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          ) : null}

          <DialogFooter className="gap-2 pt-2">
            {detailActividad && detailActividad.estado !== 2 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setCancelConfirmId(detailActividad.id)}
              >
                Cancelar actividad
              </Button>
            )}
            {detailActividad && (
              <Button variant="outline" size="sm" onClick={() => openEdit(detailActividad)}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Editar
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setDetailOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Create / Edit Dialog ────────────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingActividad ? "Editar actividad" : "Nueva actividad"}
            </DialogTitle>
            <DialogDescription>
              {editingActividad
                ? "Modificá los datos de la actividad."
                : "Completá los datos para crear una nueva actividad."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <form
              id="actividad-form"
              onSubmit={handleFormSubmit}
              className="flex flex-col gap-4 py-2"
            >
              {/* Título */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="titulo">
                  Título <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="titulo"
                  value={form.titulo}
                  onChange={(e) => updateForm("titulo", e.target.value)}
                  placeholder="Título de la actividad"
                  required
                />
              </div>

              {/* Tipo */}
              <div className="flex flex-col gap-1.5">
                <Label>Tipo de actividad</Label>
                <Select
                  value={form.tipoActividadId}
                  onValueChange={(v) => updateForm("tipoActividadId", v === "_none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin tipo">
                      {form.tipoActividadId
                        ? (() => {
                            const t = tiposActividad.find(
                              (x) => String(x.id) === form.tipoActividadId
                            )
                            return t ? (
                              <span className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: t.color }}
                                />
                                {t.nombre}
                              </span>
                            ) : (
                              "Sin tipo"
                            )
                          })()
                        : "Sin tipo"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin tipo</SelectItem>
                    {tiposActividad.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: t.color }}
                          />
                          {t.nombre}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Todo el día */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="todoDia"
                  checked={form.todoDia}
                  onCheckedChange={(v) => updateForm("todoDia", Boolean(v))}
                />
                <Label htmlFor="todoDia" className="font-normal cursor-pointer">
                  Todo el día
                </Label>
              </div>

              {/* Fechas / horas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fechaInicio">
                    Fecha inicio <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fechaInicio"
                    type="date"
                    value={form.fechaInicio}
                    min={editingActividad ? undefined : todayStr}
                    onChange={(e) => updateForm("fechaInicio", e.target.value)}
                    required
                  />
                </div>
                {!form.todoDia && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="horaInicio">Hora inicio</Label>
                    <Input
                      id="horaInicio"
                      type="time"
                      value={form.horaInicio}
                      min={
                        !editingActividad && form.fechaInicio === todayStr
                          ? `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`
                          : undefined
                      }
                      onChange={(e) => updateForm("horaInicio", e.target.value)}
                    />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fechaFin">
                    Fecha fin <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fechaFin"
                    type="date"
                    value={form.fechaFin}
                    min={editingActividad ? undefined : form.fechaInicio || todayStr}
                    onChange={(e) => updateForm("fechaFin", e.target.value)}
                    required
                  />
                </div>
                {!form.todoDia && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="horaFin">Hora fin</Label>
                    <Input
                      id="horaFin"
                      type="time"
                      value={form.horaFin}
                      onChange={(e) => updateForm("horaFin", e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Ubicación */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ubicacion">Ubicación</Label>
                <Input
                  id="ubicacion"
                  value={form.ubicacion}
                  onChange={(e) => updateForm("ubicacion", e.target.value)}
                  placeholder="Dirección o lugar"
                />
              </div>

              {/* URL reunión */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="urlReunion">URL de reunión</Label>
                <Input
                  id="urlReunion"
                  type="url"
                  value={form.urlReunion}
                  onChange={(e) => updateForm("urlReunion", e.target.value)}
                  placeholder="https://meet.google.com/..."
                />
              </div>

              {/* Descripción */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={form.descripcion}
                  onChange={(e) => updateForm("descripcion", e.target.value)}
                  placeholder="Descripción de la actividad..."
                  rows={3}
                />
              </div>

              {/* Cliente */}
              <div className="flex flex-col gap-1.5">
                <Label>Cliente</Label>
                <Popover open={clientesComboOpen} onOpenChange={setClientesComboOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
                      {selectedCliente ? selectedCliente.nombre : "Seleccionar cliente..."}
                      <span className="opacity-40 text-xs ml-2">▼</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar cliente..." />
                      <CommandList>
                        <CommandEmpty>Sin resultados</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="_none"
                            onSelect={() => {
                              updateForm("clienteId", "")
                              setClientesComboOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                form.clienteId === "" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Sin cliente
                          </CommandItem>
                          {clientes.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={`${c.id}-${c.nombre}`}
                              onSelect={() => {
                                updateForm("clienteId", String(c.id))
                                updateForm("proyectoId", "")
                                setClientesComboOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.clienteId === String(c.id) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {c.nombre}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Proyecto */}
              <div className="flex flex-col gap-1.5">
                <Label>Proyecto</Label>
                <Popover open={proyectosOpen} onOpenChange={setProyectosOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      disabled={!form.clienteId}
                      className="w-full justify-between font-normal"
                    >
                      {selectedProyecto
                        ? selectedProyecto.nombre
                        : form.clienteId
                          ? "Seleccionar proyecto..."
                          : "Seleccioná un cliente primero"}
                      <span className="opacity-40 text-xs ml-2">▼</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar proyecto..." />
                      <CommandList>
                        <CommandEmpty>Sin resultados</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="_none"
                            onSelect={() => {
                              updateForm("proyectoId", "")
                              setProyectosOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                form.proyectoId === "" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Sin proyecto
                          </CommandItem>
                          {proyectos.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={`${p.id}-${p.nombre}`}
                              onSelect={() => {
                                updateForm("proyectoId", String(p.id))
                                setProyectosOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.proyectoId === String(p.id) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {p.nombre}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Visibilidad */}
              <div className="flex flex-col gap-1.5">
                <Label>Visibilidad</Label>
                <Select
                  value={form.visibilidad}
                  onValueChange={(v) => updateForm("visibilidad", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Pública</SelectItem>
                    <SelectItem value="2">Privada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Participantes */}
              <div className="flex flex-col gap-1.5">
                <Label>Participantes</Label>
                <Popover open={participantesOpen} onOpenChange={setParticipantesOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
                      {form.participantesIds.length > 0
                        ? `${form.participantesIds.length} seleccionado(s)`
                        : "Agregar participantes..."}
                      <span className="opacity-40 text-xs ml-2">▼</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar usuario..." />
                      <CommandList>
                        <CommandEmpty>Sin resultados</CommandEmpty>
                        <CommandGroup>
                          {usuarios.map((u) => (
                            <CommandItem
                              key={u.id}
                              value={`${u.nombre} ${u.apellido} ${u.email}`}
                              onSelect={() => toggleParticipante(u.id)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  form.participantesIds.includes(u.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium">
                                  {u.nombre} {u.apellido}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {u.email}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Selected participants badges */}
                {form.participantesIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {form.participantesIds.map((uid) => {
                      const u = usuarios.find((x) => x.id === uid)
                      return (
                        <Badge key={uid} variant="secondary" className="gap-1 pr-1">
                          <span>
                            {u ? `${u.nombre} ${u.apellido}` : `#${uid}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleParticipante(uid)}
                            className="hover:text-destructive ml-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Recordatorios */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label>Recordatorios</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addRecordatorio}
                    className="h-7 text-xs gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Agregar
                  </Button>
                </div>
                {form.recordatorios.map((rec, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      type="number"
                      min={1}
                      value={rec.minutosAntes}
                      onChange={(e) => updateRecordatorio(idx, "minutosAntes", e.target.value)}
                      placeholder="Min."
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      min antes —
                    </span>
                    <Select
                      value={rec.canal}
                      onValueChange={(v) => updateRecordatorio(idx, "canal", v)}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">App</SelectItem>
                        <SelectItem value="2">Email</SelectItem>
                        <SelectItem value="3">Push</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => removeRecordatorio(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </form>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="ghost" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" form="actividad-form" disabled={saving}>
              {saving
                ? "Guardando..."
                : editingActividad
                  ? "Guardar cambios"
                  : "Crear actividad"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Cancel confirmation ─────────────────────────────────────────────── */}
      <AlertDialog
        open={cancelConfirmId != null}
        onOpenChange={(open) => {
          if (!open) setCancelConfirmId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar actividad?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará la actividad como cancelada. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelActividad}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? "Cancelando..." : "Sí, cancelar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Tipos de actividad dialog ───────────────────────────────────────── */}
      <Dialog open={tiposOpen} onOpenChange={setTiposOpen}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Tipos de actividad</DialogTitle>
            <DialogDescription>
              Gestioná los tipos para clasificar los eventos del calendario.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-2">
            <div className="flex flex-col gap-2 py-2">
              {loading ? (
                <div className="flex flex-col gap-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : tiposActividad.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay tipos creados todavía.
                </p>
              ) : (
                tiposActividad.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 rounded-lg border p-2">
                    {editingTipoId === t.id ? (
                      <>
                        <input
                          type="color"
                          value={editingTipoColor}
                          onChange={(e) => setEditingTipoColor(e.target.value)}
                          className="h-7 w-10 rounded cursor-pointer border-0 p-0 shrink-0"
                        />
                        <Input
                          value={editingTipoNombre}
                          onChange={(e) => setEditingTipoNombre(e.target.value)}
                          className="h-7 text-sm flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              saveEditTipo(t.id)
                            }
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0"
                          onClick={() => saveEditTipo(t.id)}
                          disabled={savingTipo}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0"
                          onClick={() => setEditingTipoId(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: t.color }}
                        />
                        <span className="flex-1 text-sm">{t.nombre}</span>
                        {!t.activo && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            Inactivo
                          </Badge>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0"
                          onClick={() => startEditTipo(t)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTipoId(t.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                ))
              )}

              {/* New tipo row */}
              <Separator className="my-2" />
              <div className="flex items-center gap-2 rounded-lg border border-dashed p-2">
                <input
                  type="color"
                  value={newTipoColor}
                  onChange={(e) => setNewTipoColor(e.target.value)}
                  className="h-7 w-10 rounded cursor-pointer border-0 p-0 shrink-0"
                />
                <Input
                  value={newTipoNombre}
                  onChange={(e) => setNewTipoNombre(e.target.value)}
                  placeholder="Nombre del nuevo tipo..."
                  className="h-7 text-sm flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleCreateTipo()
                    }
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  onClick={handleCreateTipo}
                  disabled={savingTipo}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="pt-2">
            <Button variant="ghost" onClick={() => setTiposOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete tipo confirmation ────────────────────────────────────────── */}
      <AlertDialog
        open={deleteTipoId != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTipoId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tipo de actividad?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Las actividades existentes con este tipo no serán
              afectadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingTipo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTipo}
              disabled={deletingTipo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingTipo ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
