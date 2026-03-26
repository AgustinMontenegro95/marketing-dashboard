"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, ChevronsUpDown, Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ProjectDetail } from "./project-detail"
import { ProjectsTable } from "./projects-table"
import {
  buscarProyectos,
  crearProyecto,
  type BuscarProyectosReq,
  type ProyectoDto,
  type CrearProyectoReq,
} from "@/lib/proyectos"
import { buscarClientes, type ClienteDto } from "@/lib/clientes"
import { fetchEquipo, type EquipoDisciplinaDto, type EquipoUsuarioResumenDto } from "@/lib/equipo"

type ProjectFormState = {
  clienteId: string
  disciplinaId: string
  liderUsuarioId: string
  nombre: string
  descripcion: string
  estado: string
  fechaInicio: string
  fechaFinEstimada: string
  presupuestoTotal: string
  moneda: string
  codigo: string
}

const PROYECTOS_SEARCH_KEY = "chemi:proyectos:q:v1"
const PROYECTOS_ESTADO_KEY = "chemi:proyectos:estado:v1"
const DEFAULT_PAGE_SIZE = 20

function readSessionValue(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback

  try {
    return window.sessionStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

function writeSessionValue(key: string, value: string) {
  if (typeof window === "undefined") return

  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    // noop
  }
}

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

function emptyProjectForm(): ProjectFormState {
  return {
    clienteId: "",
    disciplinaId: "",
    liderUsuarioId: "",
    nombre: "",
    descripcion: "",
    estado: "1",
    fechaInicio: "",
    fechaFinEstimada: "",
    presupuestoTotal: "",
    moneda: "ARS",
    codigo: "",
  }
}

function toCreatePayload(form: ProjectFormState): CrearProyectoReq {
  return {
    clienteId: Number(form.clienteId),
    nombre: form.nombre.trim(),
    descripcion: form.descripcion.trim() || null,
    estado: Number(form.estado),
    fechaInicio: form.fechaInicio || null,
    fechaFinEstimada: form.fechaFinEstimada || null,
    fechaFinReal: null,
    presupuestoTotal: form.presupuestoTotal ? Number(form.presupuestoTotal) : null,
    moneda: form.moneda || "ARS",
    codigo: form.codigo.trim() || null,
    disciplinaId: form.disciplinaId ? Number(form.disciplinaId) : null,
    liderUsuarioId: form.liderUsuarioId ? Number(form.liderUsuarioId) : null,
  }
}

function ProjectsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <Skeleton className="h-10 w-full lg:w-[420px]" />
        <Skeleton className="h-10 w-[180px]" />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function ProjectsPageContent() {
  const [projects, setProjects] = useState<ProyectoDto[]>([])
  const [selectedProject, setSelectedProject] = useState<ProyectoDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [search, setSearch] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("todos")
  const [page, setPage] = useState(0)
  const [size] = useState(DEFAULT_PAGE_SIZE)

  const [totalElementos, setTotalElementos] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(0)

  const [newProject, setNewProject] = useState<ProjectFormState>(emptyProjectForm())
  const [clientePopoverOpen, setClientePopoverOpen] = useState(false)
  const [clientes, setClientes] = useState<ClienteDto[]>([])
  const [disciplinas, setDisciplinas] = useState<EquipoDisciplinaDto[]>([])
  const [allUsers, setAllUsers] = useState<EquipoUsuarioResumenDto[]>([])
  const [loadingRefs, setLoadingRefs] = useState(false)

  const searchBody = useMemo<BuscarProyectosReq>(
    () => ({
      q: search.trim() || null,
      clienteId: null,
      disciplinaId: null,
      liderUsuarioId: null,
      estado: estadoFilter === "todos" ? null : Number(estadoFilter),
      inicioDesde: null,
      inicioHasta: null,
      page,
      size,
    }),
    [search, estadoFilter, page, size]
  )

  async function loadProjects() {
    try {
      setLoading(true)
      setError(null)

      const res = await buscarProyectos(searchBody)
      setProjects(res.contenido)
      setTotalElementos(res.totalElementos)
      setTotalPaginas(res.totalPaginas)
    } catch (e: any) {
      const message = e?.message ?? "No se pudieron cargar los proyectos"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setSearch(readSessionValue(PROYECTOS_SEARCH_KEY, ""))
    setEstadoFilter(readSessionValue(PROYECTOS_ESTADO_KEY, "todos"))
  }, [])

  useEffect(() => { writeSessionValue(PROYECTOS_SEARCH_KEY, search) }, [search])
  useEffect(() => { writeSessionValue(PROYECTOS_ESTADO_KEY, estadoFilter) }, [estadoFilter])

  useEffect(() => {
    setPage(0)
  }, [search, estadoFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadProjects()
    }, 250)

    return () => clearTimeout(timer)
  }, [searchBody])

  useEffect(() => {
    if (!dialogOpen) return

    async function loadRefs() {
      setLoadingRefs(true)
      try {
        const [clientesRes, equipoRes] = await Promise.all([
          buscarClientes({ q: null, estado: 1, condicionIva: null, pais: null, page: 0, size: 200 }),
          fetchEquipo(),
        ])
        setClientes(clientesRes.contenido)
        setDisciplinas(equipoRes)
        setAllUsers(equipoRes.flatMap((d) => d.usuarios))
      } catch {
        // silencioso — los selects quedarán vacíos
      } finally {
        setLoadingRefs(false)
      }
    }

    void loadRefs()
  }, [dialogOpen])

  async function handleCreateProject() {
    try {
      setSubmitting(true)

      const created = await crearProyecto(toCreatePayload(newProject))
      toast.success("Proyecto creado correctamente")

      setDialogOpen(false)
      setNewProject(emptyProjectForm())
      setSelectedProject(created)

      if (page !== 0) {
        setPage(0)
      } else {
        await loadProjects()
      }
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo crear el proyecto")
    } finally {
      setSubmitting(false)
    }
  }

  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        onBack={async () => {
          setSelectedProject(null)
          await loadProjects()
        }}
        onUpdated={(project) => {
          setSelectedProject(project)
          setProjects((prev) => prev.map((item) => (item.id === project.id ? project : item)))
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proyectos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestioná tus proyectos activos y su información de facturación.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              Nuevo proyecto
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nuevo proyecto</DialogTitle>
              <DialogDescription>
                Completá la información base para crear el proyecto.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="p-nombre">Nombre <span className="text-destructive">*</span></Label>
                <Input
                  id="p-nombre"
                  value={newProject.nombre}
                  onChange={(e) => setNewProject((prev) => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre del proyecto"
                />
              </div>

              {/* Cliente + Código */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Cliente <span className="text-destructive">*</span></Label>
                  <Popover open={clientePopoverOpen} onOpenChange={setClientePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                        disabled={loadingRefs}
                      >
                        <span className="truncate">
                          {newProject.clienteId
                            ? (clientes.find((c) => String(c.id) === newProject.clienteId)?.nombre ?? `Cliente #${newProject.clienteId}`)
                            : (loadingRefs ? "Cargando..." : "Seleccioná un cliente")}
                        </span>
                        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar cliente..." />
                        <CommandList>
                          <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                          <CommandGroup>
                            {clientes.map((c) => (
                              <CommandItem
                                key={c.id}
                                value={`${c.nombre} ${c.razonSocial ?? ""} ${c.cuit ?? ""}`}
                                onSelect={() => {
                                  setNewProject((prev) => ({ ...prev, clienteId: String(c.id) }))
                                  setClientePopoverOpen(false)
                                }}
                              >
                                <Check className={cn("mr-2 size-4 shrink-0", newProject.clienteId === String(c.id) ? "opacity-100" : "opacity-0")} />
                                <span className="flex-1 truncate">{c.nombre}</span>
                                {c.razonSocial && (
                                  <span className="ml-2 text-xs text-muted-foreground truncate">{c.razonSocial}</span>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="p-codigo">Código</Label>
                  <Input
                    id="p-codigo"
                    value={newProject.codigo}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, codigo: e.target.value }))}
                    placeholder="PROY-XXX-001"
                  />
                </div>
              </div>

              {/* Disciplina + Lider */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="p-disciplina">Disciplina</Label>
                  <Select
                    value={newProject.disciplinaId}
                    onValueChange={(v) => setNewProject((prev) => ({ ...prev, disciplinaId: v }))}
                    disabled={loadingRefs}
                  >
                    <SelectTrigger id="p-disciplina">
                      <SelectValue placeholder={loadingRefs ? "Cargando..." : "Sin disciplina"} />
                    </SelectTrigger>
                    <SelectContent>
                      {disciplinas.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="p-lider">Líder del proyecto</Label>
                  <Select
                    value={newProject.liderUsuarioId}
                    onValueChange={(v) => setNewProject((prev) => ({ ...prev, liderUsuarioId: v }))}
                    disabled={loadingRefs}
                  >
                    <SelectTrigger id="p-lider">
                      <SelectValue placeholder={loadingRefs ? "Cargando..." : "Sin líder asignado"} />
                    </SelectTrigger>
                    <SelectContent>
                      {allUsers.map((u) => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.nombre} {u.apellido}
                          {u.disciplina && <span className="text-muted-foreground"> · {u.disciplina.nombre}</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Estado + Fechas */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="p-estado">Estado</Label>
                  <Select
                    value={newProject.estado}
                    onValueChange={(v) => setNewProject((prev) => ({ ...prev, estado: v }))}
                  >
                    <SelectTrigger id="p-estado">
                      <SelectValue />
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
                  <Label htmlFor="p-inicio">Fecha inicio</Label>
                  <Input
                    id="p-inicio"
                    type="date"
                    value={newProject.fechaInicio}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, fechaInicio: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="p-fin">Fecha fin estimada</Label>
                  <Input
                    id="p-fin"
                    type="date"
                    value={newProject.fechaFinEstimada}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, fechaFinEstimada: e.target.value }))}
                  />
                </div>
              </div>

              {/* Presupuesto + Moneda */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="p-presupuesto">Presupuesto</Label>
                  <Input
                    id="p-presupuesto"
                    type="number"
                    value={newProject.presupuestoTotal}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, presupuestoTotal: e.target.value }))}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="p-moneda">Moneda</Label>
                  <Select
                    value={newProject.moneda}
                    onValueChange={(v) => setNewProject((prev) => ({ ...prev, moneda: v }))}
                  >
                    <SelectTrigger id="p-moneda">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARS">ARS — Peso argentino</SelectItem>
                      <SelectItem value="USD">USD — Dólar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="p-descripcion">Descripción</Label>
                <Textarea
                  id="p-descripcion"
                  value={newProject.descripcion}
                  onChange={(e) => setNewProject((prev) => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción del proyecto"
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={submitting || !newProject.nombre.trim() || !newProject.clienteId.trim()}
              >
                Crear proyecto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:w-[360px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o código..."
              className="pl-9 pr-9"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>

          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="1">Activo</SelectItem>
              <SelectItem value="2">En pausa</SelectItem>
              <SelectItem value="3">Finalizado</SelectItem>
              <SelectItem value="4">Cancelado</SelectItem>
              <SelectItem value="5">Pendiente</SelectItem>
            </SelectContent>
          </Select>

          {estadoFilter !== "todos" ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 gap-1.5 text-muted-foreground"
              onClick={() => {
                setEstadoFilter("todos")
              }}
            >
              <X className="size-3.5" />
              Limpiar filtros
            </Button>
          ) : null}
        </div>

        <div className="text-sm text-muted-foreground">
          {totalElementos} proyecto{totalElementos === 1 ? "" : "s"}
        </div>
      </div>

      {loading ? (
        <ProjectsPageSkeleton />
      ) : error ? (
        <Card className="border-border/50">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <ProjectsTable projects={projects} onSelectProject={setSelectedProject} />

          {totalPaginas > 1 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Página {page + 1} de {totalPaginas}
              </p>

              <Pagination className="mx-0 w-auto justify-start sm:justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (page > 0) setPage(page - 1)
                      }}
                      className={page === 0 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPaginas }).slice(0, 5).map((_, index) => {
                    let pageNumber = index

                    if (totalPaginas > 5) {
                      if (page <= 2) pageNumber = index
                      else if (page >= totalPaginas - 3) pageNumber = totalPaginas - 5 + index
                      else pageNumber = page - 2 + index
                    }

                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          href="#"
                          isActive={page === pageNumber}
                          onClick={(e) => {
                            e.preventDefault()
                            setPage(pageNumber)
                          }}
                        >
                          {pageNumber + 1}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (page < totalPaginas - 1) setPage(page + 1)
                      }}
                      className={page >= totalPaginas - 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
