"use client"

import { useEffect, useState } from "react"
import type { ProyectoDto, ProyectoContratoDto, ProyectoEquipoDto, FacturaDto } from "@/lib/proyectos"
import {
  actualizarProyecto, listarContratosProyecto, crearContratoProyecto,
  cerrarContrato, listarEquipoProyecto, agregarMiembroEquipo, quitarMiembroEquipo, facturarProyecto
} from "@/lib/proyectos"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Building2, Calendar, CalendarCheck, CalendarClock, Pencil, Plus, Trash2, Users, FileText, Wallet, Receipt } from "lucide-react"
import { toast } from "sonner"

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function getEstadoProyectoLabel(estado: number): string {
  switch (estado) {
    case 1: return "Activo"
    case 2: return "En pausa"
    case 3: return "Finalizado"
    case 4: return "Cancelado"
    case 5: return "Pendiente"
    default: return "Desconocido"
  }
}

function getEstadoProyectoVariant(estado: number): "default" | "secondary" | "outline" | "destructive" {
  return estado === 4 ? "destructive" : "outline"
}

function getEstadoProyectoClassName(estado: number): string | undefined {
  switch (estado) {
    case 1: return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
    case 2: return "bg-amber-500/15 text-amber-600 border-amber-500/30"
    case 3: return "bg-slate-500/15 text-slate-600 border-slate-500/30"
    case 5: return "bg-blue-500/15 text-blue-600 border-blue-500/30"
    case 4: return undefined
    default: return undefined
  }
}

function getModeloCobroLabel(modelo: number): string {
  switch (modelo) {
    case 1: return "Mensual fijo"
    case 2: return "Por hora"
    case 3: return "Monto único"
    case 4: return "Híbrido (mensual + hora)"
    case 5: return "Híbrido"
    default: return "Desconocido"
  }
}

function getRolLabel(rol: number): string {
  switch (rol) {
    case 1: return "Líder / PM"
    case 2: return "Miembro"
    case 3: return "Observador"
    default: return "Desconocido"
  }
}

function formatDateAR(date: string | null | undefined): string {
  if (!date) return "—"
  try {
    return new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return "—"
  }
}

function formatMoney(amount: number | null | undefined, moneda?: string): string {
  if (amount == null) return "—"
  const currency = moneda ?? "ARS"
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString("es-AR")}`
  }
}

function getMontoContrato(c: ProyectoContratoDto): number | null {
  switch (c.modeloCobro) {
    case 1: return c.montoMensual
    case 2: return c.tarifaHora
    case 3: return c.montoUnico
    case 4: return c.montoMensual
    case 5: return c.montoMensual
    default: return null
  }
}

function getTodayISO(): string {
  return new Date().toISOString().split("T")[0]
}

function getFirstDayOfMonthISO(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0]
}

function getLastDayOfMonthISO(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0]
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EditProjectForm = {
  nombre: string
  descripcion: string
  estado: string
  fechaInicio: string
  fechaFinEstimada: string
  fechaFinReal: string
  presupuestoTotal: string
  moneda: string
  codigo: string
}

type ContratoForm = {
  modeloCobro: string
  moneda: string
  montoMensual: string
  tarifaHora: string
  montoUnico: string
  diaFacturacion: string
  diasVencimiento: string
  vigenteDesde: string
}

type EquipoForm = {
  usuarioId: string
  rolEnProyecto: string
}

type FacturaForm = {
  periodoDesde: string
  periodoHasta: string
  emitidaEn: string
  estado: string
  notas: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProjectDetail({
  project,
  onBack,
  onUpdated,
}: {
  project: ProyectoDto
  onBack: () => void
  onUpdated: (p: ProyectoDto) => void
}) {
  // ---- core state ----
  const [currentProject, setCurrentProject] = useState<ProyectoDto>(project)
  const [contratos, setContratos] = useState<ProyectoContratoDto[]>([])
  const [equipo, setEquipo] = useState<ProyectoEquipoDto[]>([])
  const [loadingContratos, setLoadingContratos] = useState(false)
  const [loadingEquipo, setLoadingEquipo] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // ---- dialog / modal state ----
  const [editOpen, setEditOpen] = useState(false)
  const [contratoOpen, setContratoOpen] = useState(false)
  const [cerrarContratoId, setCerrarContratoId] = useState<number | null>(null)
  const [removeUsuarioId, setRemoveUsuarioId] = useState<number | null>(null)
  const [facturaResult, setFacturaResult] = useState<FacturaDto | null>(null)

  // ---- edit project form ----
  const buildEditForm = (p: ProyectoDto): EditProjectForm => ({
    nombre: p.nombre ?? "",
    descripcion: p.descripcion ?? "",
    estado: String(p.estado),
    fechaInicio: p.fechaInicio ? p.fechaInicio.split("T")[0] : "",
    fechaFinEstimada: p.fechaFinEstimada ? p.fechaFinEstimada.split("T")[0] : "",
    fechaFinReal: p.fechaFinReal ? p.fechaFinReal.split("T")[0] : "",
    presupuestoTotal: p.presupuestoTotal != null ? String(p.presupuestoTotal) : "",
    moneda: p.moneda ?? "ARS",
    codigo: p.codigo ?? "",
  })

  const [editForm, setEditForm] = useState<EditProjectForm>(() => buildEditForm(project))

  // ---- new contract form ----
  const defaultContratoForm: ContratoForm = {
    modeloCobro: "1",
    moneda: "ARS",
    montoMensual: "",
    tarifaHora: "",
    montoUnico: "",
    diaFacturacion: "",
    diasVencimiento: "",
    vigenteDesde: getTodayISO(),
  }
  const [contratoForm, setContratoForm] = useState<ContratoForm>(defaultContratoForm)

  // ---- team member form ----
  const [equipoForm, setEquipoForm] = useState<EquipoForm>({ usuarioId: "", rolEnProyecto: "2" })

  // ---- factura form ----
  const [facturaForm, setFacturaForm] = useState<FacturaForm>({
    periodoDesde: getFirstDayOfMonthISO(),
    periodoHasta: getLastDayOfMonthISO(),
    emitidaEn: getTodayISO(),
    estado: "1",
    notas: "",
  })

  // ---- data loading ----
  async function loadContratos() {
    setLoadingContratos(true)
    try {
      setContratos(await listarContratosProyecto(currentProject.id))
    } catch (e: any) {
      toast.error(e?.message ?? "Error al cargar contratos")
    } finally {
      setLoadingContratos(false)
    }
  }

  async function loadEquipo() {
    setLoadingEquipo(true)
    try {
      setEquipo(await listarEquipoProyecto(currentProject.id))
    } catch (e: any) {
      toast.error(e?.message ?? "Error al cargar el equipo")
    } finally {
      setLoadingEquipo(false)
    }
  }

  useEffect(() => {
    loadContratos()
    loadEquipo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject.id])

  // ---- handlers ----
  async function handleSaveProject() {
    if (!editForm.nombre.trim()) {
      toast.error("El nombre del proyecto es obligatorio")
      return
    }
    setSubmitting(true)
    try {
      const updated = await actualizarProyecto(currentProject.id, {
        nombre: editForm.nombre.trim(),
        descripcion: editForm.descripcion.trim() || null,
        estado: Number(editForm.estado),
        fechaInicio: editForm.fechaInicio || null,
        fechaFinEstimada: editForm.fechaFinEstimada || null,
        fechaFinReal: editForm.fechaFinReal || null,
        presupuestoTotal: editForm.presupuestoTotal ? Number(editForm.presupuestoTotal) : null,
        moneda: editForm.moneda,
        codigo: editForm.codigo.trim() || null,
      })
      setCurrentProject(updated)
      setEditOpen(false)
      onUpdated(updated)
      toast.success("Proyecto actualizado correctamente")
    } catch (e: any) {
      toast.error(e?.message ?? "Error al actualizar el proyecto")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateContrato() {
    if (!contratoForm.vigenteDesde) {
      toast.error("La fecha de vigencia es obligatoria")
      return
    }
    setSubmitting(true)
    try {
      await crearContratoProyecto(currentProject.id, {
        modeloCobro: Number(contratoForm.modeloCobro),
        moneda: contratoForm.moneda,
        montoMensual: contratoForm.montoMensual ? Number(contratoForm.montoMensual) : null,
        tarifaHora: contratoForm.tarifaHora ? Number(contratoForm.tarifaHora) : null,
        montoUnico: contratoForm.montoUnico ? Number(contratoForm.montoUnico) : null,
        diaFacturacion: contratoForm.diaFacturacion ? Number(contratoForm.diaFacturacion) : null,
        diasVencimiento: contratoForm.diasVencimiento ? Number(contratoForm.diasVencimiento) : null,
        vigenteDesde: contratoForm.vigenteDesde || null,
        activo: true,
      })
      setContratoOpen(false)
      setContratoForm(defaultContratoForm)
      await loadContratos()
      toast.success("Contrato creado correctamente")
    } catch (e: any) {
      toast.error(e?.message ?? "Error al crear el contrato")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCerrarContrato() {
    if (cerrarContratoId == null) return
    setSubmitting(true)
    try {
      await cerrarContrato(currentProject.id, cerrarContratoId)
      setCerrarContratoId(null)
      await loadContratos()
      toast.success("Contrato cerrado correctamente")
    } catch (e: any) {
      toast.error(e?.message ?? "Error al cerrar el contrato")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAddMember() {
    if (!equipoForm.usuarioId) {
      toast.error("Ingresá el ID de usuario")
      return
    }
    setSubmitting(true)
    try {
      await agregarMiembroEquipo(currentProject.id, {
        usuarioId: Number(equipoForm.usuarioId),
        rolEnProyecto: Number(equipoForm.rolEnProyecto),
      })
      setEquipoForm({ usuarioId: "", rolEnProyecto: "2" })
      await loadEquipo()
      toast.success("Miembro agregado al equipo")
    } catch (e: any) {
      toast.error(e?.message ?? "Error al agregar miembro")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemoveMember() {
    if (removeUsuarioId == null) return
    setSubmitting(true)
    try {
      await quitarMiembroEquipo(currentProject.id, removeUsuarioId)
      setRemoveUsuarioId(null)
      await loadEquipo()
      toast.success("Miembro eliminado del equipo")
    } catch (e: any) {
      toast.error(e?.message ?? "Error al eliminar miembro")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleFacturar() {
    setSubmitting(true)
    try {
      const result = await facturarProyecto(currentProject.id, {
        periodoDesde: facturaForm.periodoDesde || null,
        periodoHasta: facturaForm.periodoHasta || null,
        emitidaEn: facturaForm.emitidaEn || null,
        estado: Number(facturaForm.estado),
        notas: facturaForm.notas.trim() || null,
      })
      setFacturaResult(result)
      toast.success("Factura generada correctamente")
    } catch (e: any) {
      toast.error(e?.message ?? "Error al generar la factura")
    } finally {
      setSubmitting(false)
    }
  }

  // ---- derived ----
  const modeloCobro = Number(contratoForm.modeloCobro)
  const showMontoMensual = modeloCobro === 1 || modeloCobro === 4 || modeloCobro === 5
  const showTarifaHora = modeloCobro === 2 || modeloCobro === 4 || modeloCobro === 5
  const showMontoUnico = modeloCobro === 3

  // ---- render ----
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Button variant="ghost" className="-ml-2 w-fit gap-2 mb-1" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Volver a proyectos
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Detalle de proyecto</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setEditForm(buildEditForm(currentProject))
              setEditOpen(true)
            }}
          >
            <Pencil className="size-4" />
            Editar
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: project info card */}
        <Card className="border-border/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Información del proyecto</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Avatar + nombre + badges */}
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-foreground/70">
                  {getInitials(currentProject.nombre)}
                </span>
              </div>
              <div>
                <p className="font-semibold">{currentProject.nombre}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge
                    variant={getEstadoProyectoVariant(currentProject.estado)}
                    className={getEstadoProyectoClassName(currentProject.estado)}
                  >
                    {getEstadoProyectoLabel(currentProject.estado)}
                  </Badge>
                  {currentProject.codigo && (
                    <Badge variant="outline">{currentProject.codigo}</Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Info rows */}
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-start gap-2.5">
                <Building2 className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground leading-none mb-0.5">Cliente</p>
                  <p className="font-medium">ID #{currentProject.clienteId}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground leading-none mb-0.5">Fecha de inicio</p>
                  <p className="font-medium">{formatDateAR(currentProject.fechaInicio)}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CalendarCheck className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground leading-none mb-0.5">Fin estimado</p>
                  <p className="font-medium">{formatDateAR(currentProject.fechaFinEstimada)}</p>
                </div>
              </div>

              {currentProject.fechaFinReal && (
                <div className="flex items-start gap-2.5">
                  <CalendarClock className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground leading-none mb-0.5">Fin real</p>
                    <p className="font-medium">{formatDateAR(currentProject.fechaFinReal)}</p>
                  </div>
                </div>
              )}

              {currentProject.presupuestoTotal != null && (
                <div className="flex items-start gap-2.5">
                  <Wallet className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground leading-none mb-0.5">Presupuesto</p>
                    <p className="font-medium">
                      {formatMoney(currentProject.presupuestoTotal, currentProject.moneda)}
                    </p>
                  </div>
                </div>
              )}

              {currentProject.descripcion && (
                <div className="flex items-start gap-2.5">
                  <FileText className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground leading-none mb-0.5">Descripción</p>
                    <p className="text-muted-foreground leading-snug">{currentProject.descripcion}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="contrato">
            <TabsList className="w-full">
              <TabsTrigger value="contrato" className="flex-1 gap-1.5">
                <Receipt className="size-4" />
                Contrato
              </TabsTrigger>
              <TabsTrigger value="equipo" className="flex-1 gap-1.5">
                <Users className="size-4" />
                Equipo
              </TabsTrigger>
              <TabsTrigger value="facturacion" className="flex-1 gap-1.5">
                <FileText className="size-4" />
                Facturación
              </TabsTrigger>
            </TabsList>

            {/* TAB: Contrato */}
            <TabsContent value="contrato" className="mt-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Historial de contratos</p>
                <Button size="sm" className="gap-2" onClick={() => setContratoOpen(true)}>
                  <Plus className="size-4" />
                  Nuevo contrato
                </Button>
              </div>

              {loadingContratos ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-lg" />
                  ))}
                </div>
              ) : contratos.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/70 p-8 text-center">
                  <Receipt className="size-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No hay contratos registrados</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Creá un contrato para este proyecto
                  </p>
                </div>
              ) : (
                contratos.map((c) => (
                  <div key={c.id} className="rounded-lg border border-border/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{getModeloCobroLabel(c.modeloCobro)}</span>
                          {c.activo && (
                            <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
                              Vigente
                            </Badge>
                          )}
                        </div>
                        <p className="text-lg font-semibold">
                          {formatMoney(getMontoContrato(c), c.moneda)}
                          {c.modeloCobro === 2 && (
                            <span className="text-sm font-normal text-muted-foreground"> /hora</span>
                          )}
                          {c.modeloCobro === 1 && (
                            <span className="text-sm font-normal text-muted-foreground"> /mes</span>
                          )}
                        </p>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p>
                            Vigente desde {formatDateAR(c.vigenteDesde)}
                            {c.vigenteHasta ? ` hasta ${formatDateAR(c.vigenteHasta)}` : ""}
                          </p>
                          {c.diaFacturacion != null && (
                            <p>Facturación: día {c.diaFacturacion}</p>
                          )}
                          {c.diasVencimiento != null && (
                            <p>Vencimiento: {c.diasVencimiento} días desde emisión</p>
                          )}
                        </div>
                      </div>
                      {c.activo && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCerrarContratoId(c.id)}
                          disabled={submitting}
                        >
                          Cerrar
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* TAB: Equipo */}
            <TabsContent value="equipo" className="mt-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Miembros del equipo</p>
              </div>

              {/* Inline add member form */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Agregar miembro</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="space-y-1.5 flex-1">
                      <Label className="text-xs">ID de usuario</Label>
                      <Input
                        type="number"
                        placeholder="10"
                        value={equipoForm.usuarioId}
                        onChange={(e) =>
                          setEquipoForm((f) => ({ ...f, usuarioId: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <Label className="text-xs">Rol</Label>
                      <Select
                        value={equipoForm.rolEnProyecto}
                        onValueChange={(v) =>
                          setEquipoForm((f) => ({ ...f, rolEnProyecto: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Líder / PM</SelectItem>
                          <SelectItem value="2">Miembro</SelectItem>
                          <SelectItem value="3">Observador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={handleAddMember}
                      disabled={submitting || !equipoForm.usuarioId}
                    >
                      <Plus className="size-4" />
                      Agregar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {loadingEquipo ? (
                <div className="flex flex-col gap-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : equipo.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/70 p-8 text-center">
                  <Users className="size-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No hay miembros en el equipo</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Agregá miembros usando el formulario de arriba
                  </p>
                </div>
              ) : (
                equipo.map((m) => (
                  <div key={m.usuarioId} className="rounded-lg border border-border/50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-foreground/70">
                            {m.usuarioId}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">Usuario #{m.usuarioId}</p>
                          <p className="text-xs text-muted-foreground">
                            {getRolLabel(m.rolEnProyecto)} · Asignado {formatDateAR(m.asignadoEn)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setRemoveUsuarioId(m.usuarioId)}
                        disabled={submitting}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* TAB: Facturación */}
            <TabsContent value="facturacion" className="mt-4">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Generar factura</CardTitle>
                  <CardDescription>
                    Generá una factura para este proyecto usando el contrato vigente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Período desde</Label>
                      <Input
                        type="date"
                        value={facturaForm.periodoDesde}
                        onChange={(e) =>
                          setFacturaForm((f) => ({ ...f, periodoDesde: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Período hasta</Label>
                      <Input
                        type="date"
                        value={facturaForm.periodoHasta}
                        onChange={(e) =>
                          setFacturaForm((f) => ({ ...f, periodoHasta: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Fecha de emisión</Label>
                      <Input
                        type="date"
                        value={facturaForm.emitidaEn}
                        onChange={(e) =>
                          setFacturaForm((f) => ({ ...f, emitidaEn: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select
                        value={facturaForm.estado}
                        onValueChange={(v) => setFacturaForm((f) => ({ ...f, estado: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Borrador</SelectItem>
                          <SelectItem value="2">Emitida</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notas</Label>
                    <Textarea
                      value={facturaForm.notas}
                      onChange={(e) =>
                        setFacturaForm((f) => ({ ...f, notas: e.target.value }))
                      }
                      placeholder="Facturación mensual..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <Button className="gap-2" onClick={handleFacturar} disabled={submitting}>
                    <Receipt className="size-4" />
                    {submitting ? "Generando..." : "Generar factura"}
                  </Button>

                  {facturaResult && (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                      <p className="text-sm font-medium text-emerald-700">
                        Factura generada correctamente
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <span>ID: #{facturaResult.id}</span>
                        <span>
                          Subtotal: {formatMoney(facturaResult.subtotal, facturaResult.moneda)}
                        </span>
                        <span>
                          Estado: {facturaResult.estado === 1 ? "Borrador" : "Emitida"}
                        </span>
                        <span>Emitida: {formatDateAR(facturaResult.emitidaEn)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog: Edit Project */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar proyecto</DialogTitle>
            <DialogDescription>
              Modificá los datos del proyecto. Los cambios se guardarán inmediatamente.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Row 1: Nombre + Código */}
            <div className="grid gap-4 grid-cols-3">
              <div className="col-span-2 space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={editForm.nombre}
                  onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="Nombre del proyecto"
                />
              </div>
              <div className="space-y-2">
                <Label>Código</Label>
                <Input
                  value={editForm.codigo}
                  onChange={(e) => setEditForm((f) => ({ ...f, codigo: e.target.value }))}
                  placeholder="PRY-001"
                />
              </div>
            </div>

            {/* Row 2: Estado + Moneda */}
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={editForm.estado}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, estado: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Activo</SelectItem>
                    <SelectItem value="2">En pausa</SelectItem>
                    <SelectItem value="3">Finalizado</SelectItem>
                    <SelectItem value="4">Cancelado</SelectItem>
                    <SelectItem value="5">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select
                  value={editForm.moneda}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, moneda: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: Fechas */}
            <div className="grid gap-4 grid-cols-3">
              <div className="space-y-2">
                <Label>Fecha de inicio</Label>
                <Input
                  type="date"
                  value={editForm.fechaInicio}
                  onChange={(e) => setEditForm((f) => ({ ...f, fechaInicio: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Fin estimado</Label>
                <Input
                  type="date"
                  value={editForm.fechaFinEstimada}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, fechaFinEstimada: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Fin real</Label>
                <Input
                  type="date"
                  value={editForm.fechaFinReal}
                  onChange={(e) => setEditForm((f) => ({ ...f, fechaFinReal: e.target.value }))}
                />
              </div>
            </div>

            {/* Row 4: Presupuesto */}
            <div className="space-y-2">
              <Label>Presupuesto total</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={editForm.presupuestoTotal}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, presupuestoTotal: e.target.value }))
                }
                placeholder="0.00"
              />
            </div>

            {/* Row 5: Descripción */}
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={editForm.descripcion}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, descripcion: e.target.value }))
                }
                placeholder="Descripción del proyecto..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProject} disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: New Contract */}
      <Dialog open={contratoOpen} onOpenChange={setContratoOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Nuevo contrato</DialogTitle>
            <DialogDescription>
              Definí las condiciones del nuevo contrato para este proyecto.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Row 1: Modelo + Moneda */}
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Modelo de cobro</Label>
                <Select
                  value={contratoForm.modeloCobro}
                  onValueChange={(v) => setContratoForm((f) => ({ ...f, modeloCobro: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Mensual fijo</SelectItem>
                    <SelectItem value="2">Por hora</SelectItem>
                    <SelectItem value="3">Monto único</SelectItem>
                    <SelectItem value="4">Híbrido (mensual + hora)</SelectItem>
                    <SelectItem value="5">Híbrido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select
                  value={contratoForm.moneda}
                  onValueChange={(v) => setContratoForm((f) => ({ ...f, moneda: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Conditional amount fields */}
            {showMontoMensual && showTarifaHora ? (
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Monto mensual</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={contratoForm.montoMensual}
                    onChange={(e) =>
                      setContratoForm((f) => ({ ...f, montoMensual: e.target.value }))
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tarifa por hora</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={contratoForm.tarifaHora}
                    onChange={(e) =>
                      setContratoForm((f) => ({ ...f, tarifaHora: e.target.value }))
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
            ) : showMontoMensual ? (
              <div className="space-y-2">
                <Label>Monto mensual</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={contratoForm.montoMensual}
                  onChange={(e) =>
                    setContratoForm((f) => ({ ...f, montoMensual: e.target.value }))
                  }
                  placeholder="0.00"
                />
              </div>
            ) : showTarifaHora ? (
              <div className="space-y-2">
                <Label>Tarifa por hora</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={contratoForm.tarifaHora}
                  onChange={(e) =>
                    setContratoForm((f) => ({ ...f, tarifaHora: e.target.value }))
                  }
                  placeholder="0.00"
                />
              </div>
            ) : showMontoUnico ? (
              <div className="space-y-2">
                <Label>Monto único</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={contratoForm.montoUnico}
                  onChange={(e) =>
                    setContratoForm((f) => ({ ...f, montoUnico: e.target.value }))
                  }
                  placeholder="0.00"
                />
              </div>
            ) : null}

            {/* Fecha vigente + Día de facturación */}
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Vigente desde</Label>
                <Input
                  type="date"
                  value={contratoForm.vigenteDesde}
                  onChange={(e) =>
                    setContratoForm((f) => ({ ...f, vigenteDesde: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Día de facturación</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={contratoForm.diaFacturacion}
                  onChange={(e) =>
                    setContratoForm((f) => ({ ...f, diaFacturacion: e.target.value }))
                  }
                  placeholder="1"
                />
              </div>
            </div>

            {/* Días de vencimiento */}
            <div className="space-y-2">
              <Label>Días de vencimiento (desde emisión)</Label>
              <Input
                type="number"
                min={0}
                value={contratoForm.diasVencimiento}
                onChange={(e) =>
                  setContratoForm((f) => ({ ...f, diasVencimiento: e.target.value }))
                }
                placeholder="30"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setContratoOpen(false)
                setContratoForm(defaultContratoForm)
              }}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateContrato} disabled={submitting}>
              {submitting ? "Creando..." : "Crear contrato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Close Contract */}
      <AlertDialog
        open={cerrarContratoId != null}
        onOpenChange={(open) => {
          if (!open) setCerrarContratoId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cerrar contrato</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que querés cerrar este contrato? Esta acción marcará el contrato
              como inactivo y no podrá revertirse fácilmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCerrarContrato}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? "Cerrando..." : "Cerrar contrato"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog: Remove Team Member */}
      <AlertDialog
        open={removeUsuarioId != null}
        onOpenChange={(open) => {
          if (!open) setRemoveUsuarioId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar miembro</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que querés eliminar al usuario #{removeUsuarioId} del equipo?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? "Eliminando..." : "Eliminar miembro"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
