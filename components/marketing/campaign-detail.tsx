"use client"

import type { Campaign } from "./marketing-page-content"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Eye,
  MousePointerClick,
  Target,
  DollarSign,
  TrendingUp,
  Calendar,
  ExternalLink,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const dailyData = [
  { day: "Lun", impresiones: 12000, clicks: 480, conversiones: 14 },
  { day: "Mar", impresiones: 15200, clicks: 608, conversiones: 18 },
  { day: "Mie", impresiones: 13800, clicks: 552, conversiones: 16 },
  { day: "Jue", impresiones: 18400, clicks: 736, conversiones: 22 },
  { day: "Vie", impresiones: 21000, clicks: 840, conversiones: 25 },
  { day: "Sab", impresiones: 9600, clicks: 384, conversiones: 11 },
  { day: "Dom", impresiones: 7200, clicks: 288, conversiones: 8 },
]

const dailyConfig = {
  impresiones: { label: "Impresiones", color: "hsl(0, 0%, 20%)" },
  clicks: { label: "Clicks", color: "hsl(0, 100%, 50%)" },
}

export function CampaignDetail({
  campaign,
  onBack,
}: {
  campaign: Campaign
  onBack: () => void
}) {
  const spentPercent = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0
  const ctr = campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : "0"
  const cpc = campaign.clicks > 0 ? (campaign.spent / campaign.clicks).toFixed(2) : "0"
  const cpa = campaign.conversions > 0 ? (campaign.spent / campaign.conversions).toFixed(2) : "0"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
            <Badge
              variant={
                campaign.status === "Activa"
                  ? "default"
                  : campaign.status === "Completada"
                    ? "outline"
                    : "secondary"
              }
            >
              {campaign.status}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {campaign.client} - {campaign.platform} - {campaign.id}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Impresiones</CardTitle>
            <Eye className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.impressions.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clicks</CardTitle>
            <MousePointerClick className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.clicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">CTR: {ctr}%</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversiones</CardTitle>
            <Target className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.conversions}</div>
            <p className="text-xs text-muted-foreground mt-1">CPA: ${cpa}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Presupuesto</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">${campaign.spent.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={spentPercent} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground font-mono">{spentPercent.toFixed(0)}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">de ${campaign.budget.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rendimiento" className="w-full">
        <TabsList>
          <TabsTrigger value="rendimiento">Rendimiento</TabsTrigger>
          <TabsTrigger value="detalles">Detalles</TabsTrigger>
          <TabsTrigger value="audiencia">Audiencia</TabsTrigger>
        </TabsList>

        <TabsContent value="rendimiento" className="mt-4 flex flex-col gap-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Rendimiento Diario</CardTitle>
              <CardDescription>Impresiones y clicks de la ultima semana</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={dailyConfig} className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillDailyImp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0, 0%, 20%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(0, 0%, 20%)" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="fillDailyClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0, 100%, 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(0, 100%, 50%)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 88%)" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "hsl(0, 0%, 42%)", fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(0, 0%, 42%)", fontSize: 12 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="impresiones" stroke="hsl(0, 0%, 20%)" fill="url(#fillDailyImp)" strokeWidth={2} />
                    <Area type="monotone" dataKey="clicks" stroke="hsl(0, 100%, 50%)" fill="url(#fillDailyClicks)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">CPC (Costo por Click)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">${cpc}</div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">CPA (Costo por Adquisicion)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">${cpa}</div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold font-mono ${campaign.roi >= 100 ? "" : "text-primary"}`}>{campaign.roi}%</span>
                  <TrendingUp className="size-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detalles" className="mt-4 flex flex-col gap-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Informacion de la Campana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Objetivo</span>
                  <span className="text-sm font-medium">{campaign.objective}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Plataforma</span>
                  <span className="text-sm font-medium">{campaign.platform}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Fecha de Inicio</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium font-mono">{campaign.startDate}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Fecha de Fin</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium font-mono">{campaign.endDate}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-sm text-muted-foreground">Descripcion</span>
                  <span className="text-sm leading-relaxed">{campaign.description}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Responsable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                    {campaign.leadInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{campaign.lead}</p>
                  <p className="text-xs text-muted-foreground">Estratega de Marketing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audiencia" className="mt-4 flex flex-col gap-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Segmentacion de Audiencia</CardTitle>
              <CardDescription>Parametros de targeting configurados para esta campana</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Ubicacion</span>
                  <span className="text-sm font-medium">Argentina, Chile, Colombia, Mexico</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Rango de Edad</span>
                  <span className="text-sm font-medium">25 - 54 anos</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Intereses</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {["Tecnologia", "Negocios", "Startups", "SaaS"].map((interest) => (
                      <Badge key={interest} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Dispositivos</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {["Mobile", "Desktop", "Tablet"].map((device) => (
                      <Badge key={device} variant="outline" className="text-xs">
                        {device}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Distribucion por Dispositivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {[
                  { device: "Mobile", percent: 62 },
                  { device: "Desktop", percent: 30 },
                  { device: "Tablet", percent: 8 },
                ].map((item) => (
                  <div key={item.device} className="flex items-center gap-4">
                    <span className="text-sm w-16">{item.device}</span>
                    <Progress value={item.percent} className="h-2 flex-1" />
                    <span className="text-sm font-mono text-muted-foreground w-10 text-right">{item.percent}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
