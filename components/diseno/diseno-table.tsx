"use client"

import { useState } from "react"
import type { DesignRequest } from "@/components/diseno/diseno-page-content"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { MoreHorizontal, Eye, ArrowRight, CheckCircle2, Trash2 } from "lucide-react"
import { toast } from "sonner"

function getStageVariant(stage: string) {
  switch (stage) {
    case "Aprobado":
      return "default"
    case "Revision cliente":
      return "default"
    case "Revision interna":
      return "secondary"
    case "En diseno":
      return "secondary"
    case "Backlog":
      return "outline"
    default:
      return "outline"
  }
}

function getPriorityClass(priority: string) {
  switch (priority) {
    case "Alta":
      return "text-primary"
    case "Media":
      return "text-foreground"
    case "Baja":
      return "text-muted-foreground"
    default:
      return ""
  }
}

export function DisenoTable({
  requests,
  setRequests,
  onSelect,
}: {
  requests: DesignRequest[]
  setRequests: React.Dispatch<React.SetStateAction<DesignRequest[]>>
  onSelect: (req: DesignRequest) => void
}) {
  const stageOrder = ["Backlog", "En diseno", "Revision interna", "Revision cliente", "Aprobado"]
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  function handleAdvanceStage(id: string) {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const currentIdx = stageOrder.indexOf(r.stage)
        if (currentIdx < stageOrder.length - 1) {
          const nextStage = stageOrder[currentIdx + 1] as DesignRequest["stage"]
          toast.success(`Movido a: ${nextStage}`)
          return { ...r, stage: nextStage }
        }
        return r
      })
    )
  }

  function handleDelete(id: string) {
    setRequests((prev) => prev.filter((r) => r.id !== id))
    setPendingDeleteId(null)
    setDeleteConfirmText("")
    toast.success("Solicitud eliminada")
  }

  return (
    <>
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Solicitudes de Diseno</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Solicitud</TableHead>
              <TableHead className="text-muted-foreground">Tipo</TableHead>
              <TableHead className="text-muted-foreground">Cliente</TableHead>
              <TableHead className="text-muted-foreground">Etapa</TableHead>
              <TableHead className="text-muted-foreground">Prioridad</TableHead>
              <TableHead className="text-muted-foreground">Asignado</TableHead>
              <TableHead className="text-muted-foreground">Fecha Limite</TableHead>
              <TableHead className="text-muted-foreground w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id} className="border-border/50 cursor-pointer" onClick={() => onSelect(req)}>
                <TableCell>
                  <div>
                    <div className="font-medium text-sm">{req.title}</div>
                    <div className="text-xs text-muted-foreground font-mono">{req.id}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                    {req.type}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{req.client}</TableCell>
                <TableCell>
                  <Badge variant={getStageVariant(req.stage) as "default" | "secondary" | "outline"}>
                    {req.stage}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className={`text-sm font-medium ${getPriorityClass(req.priority)}`}>
                    {req.priority}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-6">
                      <AvatarFallback className="text-[10px] bg-primary/20 text-primary font-semibold">
                        {req.assigneeInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{req.assignee}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{req.deadline}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(req) }}>
                        <Eye className="size-4 mr-2" />
                        Ver detalle
                      </DropdownMenuItem>
                      {req.stage !== "Aprobado" && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAdvanceStage(req.id) }}>
                          <ArrowRight className="size-4 mr-2" />
                          Avanzar etapa
                        </DropdownMenuItem>
                      )}
                      {req.stage === "Revision cliente" && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAdvanceStage(req.id) }}>
                          <CheckCircle2 className="size-4 mr-2" />
                          Aprobar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setPendingDeleteId(req.id) }}
                      >
                        <Trash2 className="size-4 mr-2" />
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

    <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => { if (!open) { setPendingDeleteId(null); setDeleteConfirmText("") } }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar solicitud</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. La solicitud de diseño será eliminada permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="mt-4 space-y-2">
          <Label htmlFor="confirm-delete">Escribe <strong>eliminar</strong> para confirmar</Label>
          <Input
            id="confirm-delete"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="eliminar"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => pendingDeleteId && handleDelete(pendingDeleteId)}
            disabled={deleteConfirmText !== "eliminar"}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
