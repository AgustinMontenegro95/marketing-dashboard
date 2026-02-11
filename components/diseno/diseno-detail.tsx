"use client"

import { useState } from "react"
import type { DesignRequest } from "./diseno-page-content"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Calendar,
  Clock,
  MessageSquare,
  Send,
} from "lucide-react"
import { toast } from "sonner"

export function DisenoDetail({
  request,
  onBack,
  onUpdate,
}: {
  request: DesignRequest
  onBack: () => void
  onUpdate: (updated: DesignRequest) => void
}) {
  const [feedback, setFeedback] = useState("")
  const completedDeliverables = request.deliverables.filter((d) => d.completed).length
  const deliverableProgress = request.deliverables.length > 0 ? (completedDeliverables / request.deliverables.length) * 100 : 0

  function toggleDeliverable(id: string) {
    const updated = {
      ...request,
      deliverables: request.deliverables.map((d) =>
        d.id === id ? { ...d, completed: !d.completed } : d
      ),
    }
    onUpdate(updated)
  }

  function handleSendFeedback() {
    if (!feedback.trim()) return
    const newComment = {
      id: `fb-${Date.now()}`,
      author: "Admin",
      authorInitials: "AD",
      text: feedback,
      date: new Date().toISOString().split("T")[0],
    }
    onUpdate({
      ...request,
      feedbackHistory: [...request.feedbackHistory, newComment],
    })
    setFeedback("")
    toast.success("Feedback enviado")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{request.title}</h1>
            <Badge
              variant={
                request.stage === "Aprobado"
                  ? "default"
                  : request.stage === "Backlog"
                    ? "outline"
                    : "secondary"
              }
            >
              {request.stage}
            </Badge>
            {request.priority === "Alta" && (
              <Badge variant="destructive">Prioridad Alta</Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {request.client} - {request.type} - {request.id}
          </p>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progreso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliverableProgress.toFixed(0)}%</div>
            <Progress value={deliverableProgress} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Entregables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedDeliverables}/{request.deliverables.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revisiones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{request.revisions}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fecha Limite</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold font-mono">{request.deadline}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="entregables">Entregables</TabsTrigger>
          <TabsTrigger value="feedback">Feedback ({request.feedbackHistory.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4 flex flex-col gap-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Detalles de la Solicitud</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Tipo de Diseno</span>
                  <span className="text-sm font-medium">{request.type}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Prioridad</span>
                  <span className={`text-sm font-medium ${request.priority === "Alta" ? "text-primary" : ""}`}>
                    {request.priority}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Fecha de Creacion</span>
                  <span className="text-sm font-medium font-mono">{request.createdAt}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Revisiones Realizadas</span>
                  <span className="text-sm font-medium">{request.revisions} de {request.maxRevisions} permitidas</span>
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-sm text-muted-foreground">Descripcion</span>
                  <span className="text-sm leading-relaxed">{request.description}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Equipo Asignado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                    {request.assigneeInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{request.assignee}</p>
                  <p className="text-xs text-muted-foreground">Responsable del diseno</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entregables" className="mt-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Lista de Entregables</CardTitle>
              <CardDescription>
                {completedDeliverables} de {request.deliverables.length} completados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {request.deliverables.map((deliverable) => (
                  <div
                    key={deliverable.id}
                    className="flex items-center gap-3 rounded-lg border border-border/50 px-4 py-3"
                  >
                    <Checkbox
                      checked={deliverable.completed}
                      onCheckedChange={() => toggleDeliverable(deliverable.id)}
                    />
                    <div className="flex-1">
                      <span className={`text-sm ${deliverable.completed ? "line-through text-muted-foreground" : "font-medium"}`}>
                        {deliverable.title}
                      </span>
                      {deliverable.format && (
                        <span className="ml-2 text-xs text-muted-foreground">({deliverable.format})</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="mt-4 flex flex-col gap-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Historial de Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              {request.feedbackHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageSquare className="size-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No hay feedback aun</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {request.feedbackHistory.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback className="text-[10px] bg-primary/20 text-primary font-semibold">
                          {comment.authorInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{comment.author}</span>
                          <span className="text-xs text-muted-foreground font-mono">{comment.date}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="text-[10px] bg-primary/20 text-primary font-semibold">AD</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex flex-col gap-2">
                  <Textarea
                    placeholder="Escribe tu feedback o comentarios..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button size="sm" className="gap-2" onClick={handleSendFeedback} disabled={!feedback.trim()}>
                      <Send className="size-3.5" />
                      Enviar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
