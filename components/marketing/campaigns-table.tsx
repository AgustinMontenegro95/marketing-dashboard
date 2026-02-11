"use client"

import type { Campaign } from "./marketing-page-content"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Pause, Play, BarChart3, Trash2 } from "lucide-react"
import { toast } from "sonner"

function getStatusVariant(status: string) {
  switch (status) {
    case "Activa":
      return "default"
    case "Pausada":
      return "secondary"
    case "Completada":
      return "outline"
    case "Borrador":
      return "secondary"
    default:
      return "default"
  }
}

function getPlatformBadge(platform: string) {
  return (
    <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
      {platform}
    </span>
  )
}

export function CampaignsTable({
  campaigns,
  setCampaigns,
  onSelect,
}: {
  campaigns: Campaign[]
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>
  onSelect: (campaign: Campaign) => void
}) {
  function handleTogglePause(id: string) {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        const newStatus = c.status === "Activa" ? "Pausada" : "Activa"
        toast.success(`Campana ${newStatus === "Activa" ? "reanudada" : "pausada"}`)
        return { ...c, status: newStatus }
      })
    )
  }

  function handleDelete(id: string) {
    setCampaigns((prev) => prev.filter((c) => c.id !== id))
    toast.success("Campana eliminada")
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Campanas</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Campana</TableHead>
              <TableHead className="text-muted-foreground">Cliente</TableHead>
              <TableHead className="text-muted-foreground">Plataforma</TableHead>
              <TableHead className="text-muted-foreground">Estado</TableHead>
              <TableHead className="text-muted-foreground">Presupuesto</TableHead>
              <TableHead className="text-muted-foreground">Gastado</TableHead>
              <TableHead className="text-muted-foreground">ROI</TableHead>
              <TableHead className="text-muted-foreground w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => {
              const spentPercent = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0
              return (
                <TableRow key={campaign.id} className="border-border/50 cursor-pointer" onClick={() => onSelect(campaign)}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{campaign.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{campaign.id}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{campaign.client}</TableCell>
                  <TableCell>{getPlatformBadge(campaign.platform)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(campaign.status) as "default" | "secondary" | "outline"}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">${campaign.budget.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-sm">${campaign.spent.toLocaleString()}</span>
                      <Progress value={spentPercent} className="h-1.5 w-16" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-mono text-sm font-semibold ${campaign.roi >= 100 ? "text-foreground" : "text-primary"}`}>
                      {campaign.roi}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(campaign) }}>
                          <Eye className="size-4 mr-2" />
                          Ver detalle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.success("Abriendo metricas...") }}>
                          <BarChart3 className="size-4 mr-2" />
                          Ver metricas
                        </DropdownMenuItem>
                        {(campaign.status === "Activa" || campaign.status === "Pausada") && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleTogglePause(campaign.id) }}>
                            {campaign.status === "Activa" ? (
                              <>
                                <Pause className="size-4 mr-2" />
                                Pausar
                              </>
                            ) : (
                              <>
                                <Play className="size-4 mr-2" />
                                Reanudar
                              </>
                            )}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => { e.stopPropagation(); handleDelete(campaign.id) }}
                        >
                          <Trash2 className="size-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
