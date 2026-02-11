"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { ProyectosKpis } from "./proyectos-kpis"
import { ProyectosTable } from "./proyectos-table"
import { ProyectoDetail } from "./proyecto-detail"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export type Project = {
  id: string
  name: string
  client: string
  type: "Marketing" | "Diseno" | "Desarrollo"
  status: "Nuevo" | "En curso" | "Revision" | "Pausado" | "Completado"
  progress: number
  budget: number
  spent: number
  startDate: string
  endDate: string
  lead: string
  leadInitials: string
  team: { name: string; initials: string }[]
  description: string
  tasks: { id: string; title: string; completed: boolean }[]
  milestones: { id: string; title: string; date: string; completed: boolean }[]
}

const initialProjects: Project[] = [
  {
    id: "PRJ-001",
    name: "Rebrand Luxe Hotels",
    client: "Luxe Hotels",
    type: "Diseno",
    status: "En curso",
    progress: 72,
    budget: 18500,
    spent: 13320,
    startDate: "2025-11-15",
    endDate: "2026-03-15",
    lead: "Marcela Cruz",
    leadInitials: "MC",
    team: [
      { name: "Marcela Cruz", initials: "MC" },
      { name: "Carolina Vega", initials: "CV" },
    ],
    description: "Rediseno completo de la identidad visual de Luxe Hotels, incluyendo logo, paleta de colores, tipografia y guia de marca.",
    tasks: [
      { id: "t1", title: "Investigacion de marca", completed: true },
      { id: "t2", title: "Moodboard y conceptos", completed: true },
      { id: "t3", title: "Diseno de logo", completed: true },
      { id: "t4", title: "Paleta de colores", completed: true },
      { id: "t5", title: "Tipografia y guia", completed: false },
      { id: "t6", title: "Aplicaciones de marca", completed: false },
      { id: "t7", title: "Entrega final", completed: false },
    ],
    milestones: [
      { id: "m1", title: "Kick-off con cliente", date: "2025-11-20", completed: true },
      { id: "m2", title: "Presentacion de conceptos", date: "2025-12-20", completed: true },
      { id: "m3", title: "Aprobacion de logo", date: "2026-01-30", completed: true },
      { id: "m4", title: "Entrega de guia de marca", date: "2026-03-15", completed: false },
    ],
  },
  {
    id: "PRJ-002",
    name: "E-commerce PlantaVida",
    client: "PlantaVida Co.",
    type: "Desarrollo",
    status: "En curso",
    progress: 45,
    budget: 42000,
    spent: 18900,
    startDate: "2026-01-10",
    endDate: "2026-05-30",
    lead: "Julian Rios",
    leadInitials: "JR",
    team: [
      { name: "Julian Rios", initials: "JR" },
      { name: "Andres Soto", initials: "AS" },
      { name: "Carolina Vega", initials: "CV" },
    ],
    description: "Desarrollo de plataforma e-commerce completa para PlantaVida con carrito, pasarela de pago, inventario y panel administrativo.",
    tasks: [
      { id: "t1", title: "Arquitectura y diseno DB", completed: true },
      { id: "t2", title: "UI/UX del storefront", completed: true },
      { id: "t3", title: "Catalogo de productos", completed: true },
      { id: "t4", title: "Carrito de compras", completed: false },
      { id: "t5", title: "Pasarela de pagos", completed: false },
      { id: "t6", title: "Panel admin", completed: false },
      { id: "t7", title: "Testing y QA", completed: false },
      { id: "t8", title: "Deploy y lanzamiento", completed: false },
    ],
    milestones: [
      { id: "m1", title: "Wireframes aprobados", date: "2026-01-25", completed: true },
      { id: "m2", title: "MVP del storefront", date: "2026-03-01", completed: false },
      { id: "m3", title: "Integracion de pagos", date: "2026-04-15", completed: false },
      { id: "m4", title: "Lanzamiento", date: "2026-05-30", completed: false },
    ],
  },
  {
    id: "PRJ-003",
    name: "Campana Social Media FitLife",
    client: "FitLife Gym",
    type: "Marketing",
    status: "Revision",
    progress: 90,
    budget: 8200,
    spent: 7380,
    startDate: "2025-12-01",
    endDate: "2026-02-28",
    lead: "Lucia Pardo",
    leadInitials: "LP",
    team: [
      { name: "Lucia Pardo", initials: "LP" },
      { name: "Roberto Diaz", initials: "RD" },
    ],
    description: "Campana integral en redes sociales para FitLife Gym incluyendo contenido, pauta publicitaria y reportes de rendimiento.",
    tasks: [
      { id: "t1", title: "Estrategia de contenido", completed: true },
      { id: "t2", title: "Calendario editorial", completed: true },
      { id: "t3", title: "Creacion de contenido", completed: true },
      { id: "t4", title: "Configuracion de pauta", completed: true },
      { id: "t5", title: "Monitoreo y optimizacion", completed: true },
      { id: "t6", title: "Reporte final de resultados", completed: false },
    ],
    milestones: [
      { id: "m1", title: "Lanzamiento de campana", date: "2025-12-15", completed: true },
      { id: "m2", title: "Revision intermedia", date: "2026-01-15", completed: true },
      { id: "m3", title: "Reporte final", date: "2026-02-28", completed: false },
    ],
  },
  {
    id: "PRJ-004",
    name: "App Movil FinTrack",
    client: "FinTrack Inc.",
    type: "Desarrollo",
    status: "En curso",
    progress: 33,
    budget: 65000,
    spent: 21450,
    startDate: "2026-01-05",
    endDate: "2026-07-30",
    lead: "Julian Rios",
    leadInitials: "JR",
    team: [
      { name: "Julian Rios", initials: "JR" },
      { name: "Andres Soto", initials: "AS" },
    ],
    description: "Desarrollo de aplicacion movil multiplataforma para gestion de finanzas personales con sincronizacion bancaria y reportes inteligentes.",
    tasks: [
      { id: "t1", title: "Diseno de arquitectura", completed: true },
      { id: "t2", title: "Prototipo UI/UX", completed: true },
      { id: "t3", title: "Modulo de autenticacion", completed: true },
      { id: "t4", title: "Dashboard principal", completed: false },
      { id: "t5", title: "Integracion bancaria", completed: false },
      { id: "t6", title: "Reportes y graficos", completed: false },
      { id: "t7", title: "Notificaciones push", completed: false },
      { id: "t8", title: "Testing", completed: false },
      { id: "t9", title: "Publicacion en stores", completed: false },
    ],
    milestones: [
      { id: "m1", title: "Prototipo funcional", date: "2026-02-15", completed: true },
      { id: "m2", title: "Beta cerrada", date: "2026-04-30", completed: false },
      { id: "m3", title: "Beta abierta", date: "2026-06-15", completed: false },
      { id: "m4", title: "Lanzamiento publico", date: "2026-07-30", completed: false },
    ],
  },
  {
    id: "PRJ-005",
    name: "SEO & Content Strategy CloudBase",
    client: "CloudBase",
    type: "Marketing",
    status: "Completado",
    progress: 100,
    budget: 12800,
    spent: 11900,
    startDate: "2025-09-01",
    endDate: "2026-01-31",
    lead: "Lucia Pardo",
    leadInitials: "LP",
    team: [
      { name: "Lucia Pardo", initials: "LP" },
      { name: "Roberto Diaz", initials: "RD" },
    ],
    description: "Estrategia completa de SEO y contenidos para CloudBase, incluyendo auditoria tecnica, keyword research, optimizacion on-page y creacion de contenido.",
    tasks: [
      { id: "t1", title: "Auditoria SEO tecnica", completed: true },
      { id: "t2", title: "Keyword research", completed: true },
      { id: "t3", title: "Optimizacion on-page", completed: true },
      { id: "t4", title: "Creacion de contenido", completed: true },
      { id: "t5", title: "Link building", completed: true },
      { id: "t6", title: "Reporte de resultados", completed: true },
    ],
    milestones: [
      { id: "m1", title: "Auditoria completada", date: "2025-09-30", completed: true },
      { id: "m2", title: "Primera fase SEO", date: "2025-11-15", completed: true },
      { id: "m3", title: "Entrega final", date: "2026-01-31", completed: true },
    ],
  },
  {
    id: "PRJ-006",
    name: "Landing Page NeoBank",
    client: "NeoBank",
    type: "Diseno",
    status: "Nuevo",
    progress: 10,
    budget: 6500,
    spent: 650,
    startDate: "2026-02-10",
    endDate: "2026-03-20",
    lead: "Marcela Cruz",
    leadInitials: "MC",
    team: [
      { name: "Marcela Cruz", initials: "MC" },
      { name: "Andres Soto", initials: "AS" },
    ],
    description: "Diseno y desarrollo de landing page de alto impacto para el lanzamiento de NeoBank, enfocada en conversion y branding moderno.",
    tasks: [
      { id: "t1", title: "Brief y research", completed: true },
      { id: "t2", title: "Wireframes", completed: false },
      { id: "t3", title: "Diseno visual", completed: false },
      { id: "t4", title: "Maquetacion responsive", completed: false },
      { id: "t5", title: "Animaciones y microinteracciones", completed: false },
      { id: "t6", title: "Optimizacion de performance", completed: false },
    ],
    milestones: [
      { id: "m1", title: "Wireframes aprobados", date: "2026-02-20", completed: false },
      { id: "m2", title: "Diseno aprobado", date: "2026-03-05", completed: false },
      { id: "m3", title: "Entrega final", date: "2026-03-20", completed: false },
    ],
  },
  {
    id: "PRJ-007",
    name: "Dashboard DataPulse",
    client: "DataPulse",
    type: "Desarrollo",
    status: "Pausado",
    progress: 55,
    budget: 35000,
    spent: 19250,
    startDate: "2025-10-01",
    endDate: "2026-04-30",
    lead: "Julian Rios",
    leadInitials: "JR",
    team: [
      { name: "Julian Rios", initials: "JR" },
      { name: "Carolina Vega", initials: "CV" },
      { name: "Marcela Cruz", initials: "MC" },
    ],
    description: "Dashboard de analitica de datos en tiempo real para DataPulse con visualizaciones interactivas, alertas automaticas y exportacion de reportes.",
    tasks: [
      { id: "t1", title: "Diseno del sistema", completed: true },
      { id: "t2", title: "API de datos", completed: true },
      { id: "t3", title: "Componentes de graficos", completed: true },
      { id: "t4", title: "Dashboard principal", completed: true },
      { id: "t5", title: "Sistema de alertas", completed: false },
      { id: "t6", title: "Exportacion de reportes", completed: false },
      { id: "t7", title: "Testing de rendimiento", completed: false },
    ],
    milestones: [
      { id: "m1", title: "API funcional", date: "2025-11-15", completed: true },
      { id: "m2", title: "Dashboard beta", date: "2026-01-15", completed: true },
      { id: "m3", title: "Version final", date: "2026-04-30", completed: false },
    ],
  },
]

export function ProyectosPageContent() {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("Todos")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newProject, setNewProject] = useState({
    name: "",
    client: "",
    type: "Desarrollo" as Project["type"],
    budget: "",
    endDate: "",
    description: "",
  })

  const filtered = filterStatus === "Todos" ? projects : projects.filter((p) => p.status === filterStatus)

  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0)
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0)
  const activeCount = projects.filter((p) => p.status === "En curso" || p.status === "Nuevo").length
  const completedCount = projects.filter((p) => p.status === "Completado").length

  function handleCreateProject() {
    const project: Project = {
      id: `PRJ-${String(projects.length + 1).padStart(3, "0")}`,
      name: newProject.name,
      client: newProject.client,
      type: newProject.type,
      status: "Nuevo",
      progress: 0,
      budget: Number.parseFloat(newProject.budget) || 0,
      spent: 0,
      startDate: new Date().toISOString().split("T")[0],
      endDate: newProject.endDate || new Date().toISOString().split("T")[0],
      lead: "Admin",
      leadInitials: "AD",
      team: [{ name: "Admin", initials: "AD" }],
      description: newProject.description,
      tasks: [],
      milestones: [],
    }
    setProjects([project, ...projects])
    setNewProject({ name: "", client: "", type: "Desarrollo", budget: "", endDate: "", description: "" })
    setDialogOpen(false)
    toast.success("Proyecto creado exitosamente")
  }

  function handleUpdateProject(updated: Project) {
    setProjects(projects.map((p) => (p.id === updated.id ? updated : p)))
    setSelectedProject(updated)
  }

  if (selectedProject) {
    return (
      <DashboardShell breadcrumb="Proyectos">
        <ProyectoDetail
          project={selectedProject}
          onBack={() => setSelectedProject(null)}
          onUpdate={handleUpdateProject}
        />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell breadcrumb="Proyectos">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proyectos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {projects.length} proyectos totales - {activeCount} activos
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              Nuevo Proyecto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear Proyecto</DialogTitle>
              <DialogDescription>
                Define los datos iniciales del nuevo proyecto.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="prj-name">Nombre del Proyecto</Label>
                <Input
                  id="prj-name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="Ej: Redesign Portal Web"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="prj-client">Cliente</Label>
                  <Input
                    id="prj-client"
                    value={newProject.client}
                    onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="prj-type">Tipo</Label>
                  <Select
                    value={newProject.type}
                    onValueChange={(val) => setNewProject({ ...newProject, type: val as Project["type"] })}
                  >
                    <SelectTrigger id="prj-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Diseno">Diseno</SelectItem>
                      <SelectItem value="Desarrollo">Desarrollo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="prj-budget">Presupuesto ($)</Label>
                  <Input
                    id="prj-budget"
                    type="number"
                    value={newProject.budget}
                    onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="prj-end">Fecha de Entrega</Label>
                  <Input
                    id="prj-end"
                    type="date"
                    value={newProject.endDate}
                    onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="prj-desc">Descripcion</Label>
                <Textarea
                  id="prj-desc"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Breve descripcion del proyecto..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateProject} disabled={!newProject.name || !newProject.client}>
                Crear Proyecto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ProyectosKpis
        total={projects.length}
        active={activeCount}
        completed={completedCount}
        totalBudget={totalBudget}
        totalSpent={totalSpent}
      />

      <div className="flex items-center gap-2">
        {["Todos", "Nuevo", "En curso", "Revision", "Pausado", "Completado"].map((s) => (
          <Badge
            key={s}
            variant={filterStatus === s ? "default" : "outline"}
            className="cursor-pointer transition-colors"
            onClick={() => setFilterStatus(s)}
          >
            {s}
          </Badge>
        ))}
      </div>

      <ProyectosTable projects={filtered} onSelect={setSelectedProject} />
    </DashboardShell>
  )
}
