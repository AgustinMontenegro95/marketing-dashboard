"use client"

import { FileText, FileCheck, FilePen, FileSearch, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ReportesKpis({
  total,
  published,
  drafts,
  inReview,
  totalDownloads,
}: {
  total: number
  published: number
  drafts: number
  inReview: number
  totalDownloads: number
}) {
  const kpis = [
    {
      title: "Total Reportes",
      value: total,
      icon: FileText,
    },
    {
      title: "Publicados",
      value: published,
      icon: FileCheck,
    },
    {
      title: "Borradores",
      value: drafts,
      icon: FilePen,
    },
    {
      title: "En Revision",
      value: inReview,
      icon: FileSearch,
    },
    {
      title: "Descargas Totales",
      value: totalDownloads,
      icon: Download,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <kpi.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{kpi.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
