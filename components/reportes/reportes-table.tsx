"use client"

import type { Report } from "./reportes-page-content"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Download, MoreHorizontal, Eye, Trash2, Send } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

function getStatusVariant(status: string) {
  switch (status) {
    case "Publicado":
      return "default"
    case "Borrador":
      return "secondary"
    case "En revision":
      return "outline"
    default:
      return "default"
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case "Financiero":
      return "bg-primary/10 text-primary"
    case "Proyecto":
      return "bg-foreground/10 text-foreground"
    case "Marketing":
      return "bg-muted text-muted-foreground"
    case "Rendimiento":
      return "bg-foreground/10 text-foreground"
    case "Cliente":
      return "bg-primary/10 text-primary"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function ReportesTable({
  reports,
  setReports,
}: {
  reports: Report[]
  setReports: (reports: Report[]) => void
}) {
  function handleDownload(report: Report) {
    setReports(
      reports.map((r) =>
        r.id === report.id ? { ...r, downloads: r.downloads + 1 } : r
      )
    )
    toast.success(`Descargando "${report.title}"`)
  }

  function handlePublish(report: Report) {
    setReports(
      reports.map((r) =>
        r.id === report.id ? { ...r, status: "Publicado" as const } : r
      )
    )
    toast.success(`Reporte "${report.title}" publicado`)
  }

  function handleDelete(report: Report) {
    setReports(reports.filter((r) => r.id !== report.id))
    toast.success(`Reporte "${report.title}" eliminado`)
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Todos los Reportes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Reporte</TableHead>
              <TableHead className="text-muted-foreground">Tipo</TableHead>
              <TableHead className="text-muted-foreground">Periodo</TableHead>
              <TableHead className="text-muted-foreground">Autor</TableHead>
              <TableHead className="text-muted-foreground">Estado</TableHead>
              <TableHead className="text-muted-foreground text-right">Pag.</TableHead>
              <TableHead className="text-muted-foreground text-right">Descargas</TableHead>
              <TableHead className="text-muted-foreground w-10">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id} className="border-border/50">
                <TableCell>
                  <div>
                    <div className="font-medium text-sm">{report.title}</div>
                    <div className="text-xs text-muted-foreground font-mono">{report.id}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getTypeColor(report.type)}`}>
                    {report.type}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{report.period}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-6">
                      <AvatarFallback className="bg-foreground/10 text-foreground text-[10px] font-semibold">
                        {report.createdByInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{report.createdBy}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(report.status) as "default" | "secondary" | "outline"}>
                    {report.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">{report.pages}</TableCell>
                <TableCell className="text-right font-mono text-sm">{report.downloads}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Acciones</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Eye className="size-4" />
                        Ver reporte
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" onClick={() => handleDownload(report)}>
                        <Download className="size-4" />
                        Descargar
                      </DropdownMenuItem>
                      {report.status !== "Publicado" && (
                        <DropdownMenuItem className="gap-2" onClick={() => handlePublish(report)}>
                          <Send className="size-4" />
                          Publicar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="gap-2 text-destructive focus:text-destructive"
                        onClick={() => handleDelete(report)}
                      >
                        <Trash2 className="size-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
