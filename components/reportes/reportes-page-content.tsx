"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { ReportesKpis } from "./reportes-kpis"
import { ReportesChart } from "./reportes-chart"
import { ReportesTable } from "./reportes-table"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
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

export type Report = {
  id: string
  title: string
  type: "Financiero" | "Proyecto" | "Marketing" | "Rendimiento" | "Cliente"
  period: string
  createdBy: string
  createdByInitials: string
  createdAt: string
  status: "Publicado" | "Borrador" | "En revision"
  downloads: number
  pages: number
}

const initialReports: Report[] = [
  {
    id: "RPT-001",
    title: "Reporte Financiero Mensual - Enero 2026",
    type: "Financiero",
    period: "Enero 2026",
    createdBy: "Admin",
    createdByInitials: "AD",
    createdAt: "2026-02-01",
    status: "Publicado",
    downloads: 14,
    pages: 12,
  },
  {
    id: "RPT-002",
    title: "Rendimiento del Equipo - Q4 2025",
    type: "Rendimiento",
    period: "Oct - Dic 2025",
    createdBy: "Admin",
    createdByInitials: "AD",
    createdAt: "2026-01-15",
    status: "Publicado",
    downloads: 22,
    pages: 18,
  },
  {
    id: "RPT-003",
    title: "Campana FitLife Gym - Resultados",
    type: "Marketing",
    period: "Dic 2025 - Ene 2026",
    createdBy: "Lucia Pardo",
    createdByInitials: "LP",
    createdAt: "2026-02-05",
    status: "En revision",
    downloads: 3,
    pages: 8,
  },
  {
    id: "RPT-004",
    title: "Estado de Proyectos Activos",
    type: "Proyecto",
    period: "Febrero 2026",
    createdBy: "Julian Rios",
    createdByInitials: "JR",
    createdAt: "2026-02-08",
    status: "Borrador",
    downloads: 0,
    pages: 6,
  },
  {
    id: "RPT-005",
    title: "Satisfaccion de Clientes - Encuesta Semestral",
    type: "Cliente",
    period: "Jul - Dic 2025",
    createdBy: "Marcela Cruz",
    createdByInitials: "MC",
    createdAt: "2026-01-20",
    status: "Publicado",
    downloads: 31,
    pages: 15,
  },
  {
    id: "RPT-006",
    title: "ROI Campanas de Marketing - 2025",
    type: "Marketing",
    period: "Ano 2025",
    createdBy: "Lucia Pardo",
    createdByInitials: "LP",
    createdAt: "2026-01-10",
    status: "Publicado",
    downloads: 28,
    pages: 22,
  },
  {
    id: "RPT-007",
    title: "Reporte Financiero Mensual - Diciembre 2025",
    type: "Financiero",
    period: "Diciembre 2025",
    createdBy: "Admin",
    createdByInitials: "AD",
    createdAt: "2026-01-03",
    status: "Publicado",
    downloads: 19,
    pages: 11,
  },
  {
    id: "RPT-008",
    title: "Avance Proyecto E-commerce PlantaVida",
    type: "Proyecto",
    period: "Enero 2026",
    createdBy: "Julian Rios",
    createdByInitials: "JR",
    createdAt: "2026-01-28",
    status: "Publicado",
    downloads: 8,
    pages: 9,
  },
]

export function ReportesPageContent() {
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newReport, setNewReport] = useState({
    title: "",
    type: "Financiero" as Report["type"],
    period: "",
    description: "",
  })

  function handleCreateReport() {
    const report: Report = {
      id: `RPT-${String(reports.length + 1).padStart(3, "0")}`,
      title: newReport.title,
      type: newReport.type,
      period: newReport.period,
      createdBy: "Admin",
      createdByInitials: "AD",
      createdAt: new Date().toISOString().split("T")[0],
      status: "Borrador",
      downloads: 0,
      pages: 0,
    }
    setReports([report, ...reports])
    setNewReport({ title: "", type: "Financiero", period: "", description: "" })
    setDialogOpen(false)
    toast.success("Reporte creado como borrador")
  }

  function handleExportAll() {
    toast.success("Exportando todos los reportes...")
  }

  const published = reports.filter((r) => r.status === "Publicado").length
  const drafts = reports.filter((r) => r.status === "Borrador").length
  const inReview = reports.filter((r) => r.status === "En revision").length
  const totalDownloads = reports.reduce((sum, r) => sum + r.downloads, 0)

  return (
    <DashboardShell breadcrumb="Reportes">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Genera, administra y descarga reportes de la agencia
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExportAll}>
            <Download className="size-4" />
            <span className="hidden sm:inline">Exportar Todo</span>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="size-4" />
                Nuevo Reporte
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Crear Reporte</DialogTitle>
                <DialogDescription>
                  Define los parametros para generar un nuevo reporte.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="rpt-title">Titulo</Label>
                  <Input
                    id="rpt-title"
                    value={newReport.title}
                    onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                    placeholder="Ej: Reporte Financiero Mensual"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="rpt-type">Tipo</Label>
                    <Select
                      value={newReport.type}
                      onValueChange={(val) => setNewReport({ ...newReport, type: val as Report["type"] })}
                    >
                      <SelectTrigger id="rpt-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Financiero">Financiero</SelectItem>
                        <SelectItem value="Proyecto">Proyecto</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Rendimiento">Rendimiento</SelectItem>
                        <SelectItem value="Cliente">Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="rpt-period">Periodo</Label>
                    <Input
                      id="rpt-period"
                      value={newReport.period}
                      onChange={(e) => setNewReport({ ...newReport, period: e.target.value })}
                      placeholder="Ej: Enero 2026"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="rpt-desc">Descripcion (opcional)</Label>
                  <Textarea
                    id="rpt-desc"
                    value={newReport.description}
                    onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                    placeholder="Notas adicionales sobre el reporte..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateReport} disabled={!newReport.title || !newReport.period}>
                  Crear Reporte
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ReportesKpis
        total={reports.length}
        published={published}
        drafts={drafts}
        inReview={inReview}
        totalDownloads={totalDownloads}
      />

      <ReportesChart />

      <ReportesTable reports={reports} setReports={setReports} />
    </DashboardShell>
  )
}
