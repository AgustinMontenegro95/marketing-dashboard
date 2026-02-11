"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { MarketingKpis } from "./marketing-kpis"
import { MarketingCharts } from "./marketing-charts"
import { CampaignsTable } from "./campaigns-table"
import { CampaignDetail } from "./campaign-detail"
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

export type Campaign = {
  id: string
  name: string
  client: string
  platform: "Google Ads" | "Meta Ads" | "LinkedIn" | "TikTok" | "Email" | "Multi-canal"
  status: "Activa" | "Pausada" | "Completada" | "Borrador"
  objective: string
  budget: number
  spent: number
  impressions: number
  clicks: number
  conversions: number
  roi: number
  startDate: string
  endDate: string
  lead: string
  leadInitials: string
  description: string
}

const initialCampaigns: Campaign[] = [
  {
    id: "CMP-001",
    name: "Lanzamiento Q1 - FitLife Gym",
    client: "FitLife Gym",
    platform: "Meta Ads",
    status: "Activa",
    objective: "Generacion de leads",
    budget: 8200,
    spent: 5740,
    impressions: 245000,
    clicks: 9800,
    conversions: 294,
    roi: 185,
    startDate: "2026-01-15",
    endDate: "2026-03-15",
    lead: "Lucia Pardo",
    leadInitials: "LP",
    description: "Campana de generacion de leads para el programa de membresías de inicio de ano de FitLife Gym, enfocada en audiencia fitness y bienestar.",
  },
  {
    id: "CMP-002",
    name: "Brand Awareness - NeoBank",
    client: "NeoBank",
    platform: "Google Ads",
    status: "Activa",
    objective: "Reconocimiento de marca",
    budget: 15000,
    spent: 8250,
    impressions: 520000,
    clicks: 18200,
    conversions: 182,
    roi: 142,
    startDate: "2026-01-20",
    endDate: "2026-04-20",
    lead: "Lucia Pardo",
    leadInitials: "LP",
    description: "Campana de branding para el lanzamiento de NeoBank en el mercado argentino con foco en awareness y consideracion.",
  },
  {
    id: "CMP-003",
    name: "Remarketing E-commerce - PlantaVida",
    client: "PlantaVida Co.",
    platform: "Multi-canal",
    status: "Activa",
    objective: "Ventas directas",
    budget: 6500,
    spent: 3900,
    impressions: 180000,
    clicks: 7200,
    conversions: 216,
    roi: 320,
    startDate: "2026-02-01",
    endDate: "2026-04-30",
    lead: "Roberto Diaz",
    leadInitials: "RD",
    description: "Campana de remarketing cross-platform para recuperar carritos abandonados y compradores previos de la tienda de PlantaVida.",
  },
  {
    id: "CMP-004",
    name: "Webinar Tech Leaders - CloudBase",
    client: "CloudBase",
    platform: "LinkedIn",
    status: "Completada",
    objective: "Generacion de leads B2B",
    budget: 4800,
    spent: 4800,
    impressions: 95000,
    clicks: 3800,
    conversions: 152,
    roi: 275,
    startDate: "2025-11-01",
    endDate: "2026-01-15",
    lead: "Lucia Pardo",
    leadInitials: "LP",
    description: "Campana B2B para captacion de leads calificados a traves de webinars tecnicosorientados a CTOs y decision makers.",
  },
  {
    id: "CMP-005",
    name: "App Install - FinTrack",
    client: "FinTrack Inc.",
    platform: "Google Ads",
    status: "Pausada",
    objective: "Instalaciones de app",
    budget: 12000,
    spent: 6600,
    impressions: 340000,
    clicks: 13600,
    conversions: 408,
    roi: 210,
    startDate: "2026-01-05",
    endDate: "2026-06-30",
    lead: "Roberto Diaz",
    leadInitials: "RD",
    description: "Campana de instalacion de la aplicacion movil FinTrack con segmentacion por intereses financieros y fintech.",
  },
  {
    id: "CMP-006",
    name: "SEO Content Boost - CloudBase",
    client: "CloudBase",
    platform: "Google Ads",
    status: "Completada",
    objective: "Trafico organico",
    budget: 3200,
    spent: 3200,
    impressions: 78000,
    clicks: 4680,
    conversions: 93,
    roi: 245,
    startDate: "2025-10-01",
    endDate: "2025-12-31",
    lead: "Lucia Pardo",
    leadInitials: "LP",
    description: "Campana complementaria de paid search para potenciar el contenido organico y aumentar el ranking de keywords estrategicas.",
  },
  {
    id: "CMP-007",
    name: "Holiday Promo - Luxe Hotels",
    client: "Luxe Hotels",
    platform: "Meta Ads",
    status: "Completada",
    objective: "Reservas directas",
    budget: 9500,
    spent: 9500,
    impressions: 412000,
    clicks: 16480,
    conversions: 329,
    roi: 380,
    startDate: "2025-11-15",
    endDate: "2026-01-10",
    lead: "Roberto Diaz",
    leadInitials: "RD",
    description: "Campana de temporada alta para promocionar paquetes de vacaciones y reservas directas en el portal de Luxe Hotels.",
  },
  {
    id: "CMP-008",
    name: "Video Awareness - DataPulse",
    client: "DataPulse",
    platform: "TikTok",
    status: "Borrador",
    objective: "Reconocimiento de marca",
    budget: 5000,
    spent: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    roi: 0,
    startDate: "2026-03-01",
    endDate: "2026-05-31",
    lead: "Roberto Diaz",
    leadInitials: "RD",
    description: "Campana de video corto en TikTok para posicionar DataPulse como referente en analitica de datos entre audiencias jovenes.",
  },
]

export function MarketingPageContent() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("Todos")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    client: "",
    platform: "Google Ads" as Campaign["platform"],
    objective: "",
    budget: "",
    endDate: "",
    description: "",
  })

  const filtered = filterStatus === "Todos" ? campaigns : campaigns.filter((c) => c.status === filterStatus)

  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0)
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0)
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0)
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spent, 0)
  const activeCampaigns = campaigns.filter((c) => c.status === "Activa" || c.status === "Completada")
  const avgROI = activeCampaigns.length > 0 ? activeCampaigns.reduce((sum, c) => sum + c.roi, 0) / activeCampaigns.length : 0

  function handleCreateCampaign() {
    const campaign: Campaign = {
      id: `CMP-${String(campaigns.length + 1).padStart(3, "0")}`,
      name: newCampaign.name,
      client: newCampaign.client,
      platform: newCampaign.platform,
      status: "Borrador",
      objective: newCampaign.objective,
      budget: Number.parseFloat(newCampaign.budget) || 0,
      spent: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      roi: 0,
      startDate: new Date().toISOString().split("T")[0],
      endDate: newCampaign.endDate || new Date().toISOString().split("T")[0],
      lead: "Admin",
      leadInitials: "AD",
      description: newCampaign.description,
    }
    setCampaigns([campaign, ...campaigns])
    setNewCampaign({ name: "", client: "", platform: "Google Ads", objective: "", budget: "", endDate: "", description: "" })
    setDialogOpen(false)
    toast.success("Campana creada como borrador")
  }

  if (selectedCampaign) {
    return (
      <DashboardShell breadcrumb="Marketing">
        <CampaignDetail
          campaign={selectedCampaign}
          onBack={() => setSelectedCampaign(null)}
        />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell breadcrumb="Marketing">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketing</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestion de campanas publicitarias y metricas de rendimiento
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              Nueva Campana
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear Campana</DialogTitle>
              <DialogDescription>
                Configura los parametros iniciales de la nueva campana publicitaria.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="cmp-name">Nombre de la Campana</Label>
                <Input
                  id="cmp-name"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="Ej: Lanzamiento Q2 - ClienteX"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cmp-client">Cliente</Label>
                  <Input
                    id="cmp-client"
                    value={newCampaign.client}
                    onChange={(e) => setNewCampaign({ ...newCampaign, client: e.target.value })}
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cmp-platform">Plataforma</Label>
                  <Select
                    value={newCampaign.platform}
                    onValueChange={(val) => setNewCampaign({ ...newCampaign, platform: val as Campaign["platform"] })}
                  >
                    <SelectTrigger id="cmp-platform">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Google Ads">Google Ads</SelectItem>
                      <SelectItem value="Meta Ads">Meta Ads</SelectItem>
                      <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                      <SelectItem value="TikTok">TikTok</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Multi-canal">Multi-canal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cmp-objective">Objetivo</Label>
                  <Select
                    value={newCampaign.objective}
                    onValueChange={(val) => setNewCampaign({ ...newCampaign, objective: val })}
                  >
                    <SelectTrigger id="cmp-objective">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Generacion de leads">Generacion de leads</SelectItem>
                      <SelectItem value="Reconocimiento de marca">Reconocimiento de marca</SelectItem>
                      <SelectItem value="Ventas directas">Ventas directas</SelectItem>
                      <SelectItem value="Trafico web">Trafico web</SelectItem>
                      <SelectItem value="Instalaciones de app">Instalaciones de app</SelectItem>
                      <SelectItem value="Engagement">Engagement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cmp-budget">Presupuesto ($)</Label>
                  <Input
                    id="cmp-budget"
                    type="number"
                    value={newCampaign.budget}
                    onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cmp-end">Fecha de Finalizacion</Label>
                <Input
                  id="cmp-end"
                  type="date"
                  value={newCampaign.endDate}
                  onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cmp-desc">Descripcion</Label>
                <Textarea
                  id="cmp-desc"
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  placeholder="Breve descripcion de la campana..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCampaign} disabled={!newCampaign.name || !newCampaign.client || !newCampaign.objective}>
                Crear Campana
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <MarketingKpis
        totalImpressions={totalImpressions}
        totalClicks={totalClicks}
        avgCTR={avgCTR}
        totalConversions={totalConversions}
        totalSpend={totalSpend}
        totalROI={avgROI}
      />

      <MarketingCharts />

      <div className="flex items-center gap-2">
        {["Todos", "Activa", "Pausada", "Completada", "Borrador"].map((s) => (
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

      <CampaignsTable campaigns={filtered} setCampaigns={setCampaigns} onSelect={setSelectedCampaign} />
    </DashboardShell>
  )
}
