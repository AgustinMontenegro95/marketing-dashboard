"use client"

import type { FullTeamMember } from "./team-page-content"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, Phone, Calendar, Clock, Briefcase, FolderKanban } from "lucide-react"
import { cn } from "@/lib/utils"

const statusLabel: Record<string, string> = {
  online: "En linea",
  offline: "Desconectado",
  away: "Ausente",
}

export function TeamMemberDetail({
  member,
  onBack,
}: {
  member: FullTeamMember
  onBack: () => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" onClick={onBack} className="w-fit gap-2 -ml-2">
        <ArrowLeft className="size-4" />
        Volver al equipo
      </Button>

      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <div className="relative">
          <Avatar className="size-20 border-2 border-border">
            <AvatarFallback className="text-xl font-bold bg-muted text-foreground">
              {member.initials}
            </AvatarFallback>
          </Avatar>
          <span
            className={cn(
              "absolute bottom-1 right-1 size-4 rounded-full border-2 border-background",
              member.status === "online" && "bg-green-500",
              member.status === "away" && "bg-yellow-500",
              member.status === "offline" && "bg-muted-foreground/40"
            )}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{member.name}</h1>
            <Badge variant="outline" className="text-xs">
              {statusLabel[member.status]}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{member.role} &mdash; {member.department}</p>
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl">{member.bio}</p>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
              <Mail className="size-4 text-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium truncate">{member.email}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
              <Phone className="size-4 text-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Telefono</p>
              <p className="text-sm font-medium">{member.phone}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
              <Calendar className="size-4 text-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Ingreso</p>
              <p className="text-sm font-medium">{member.joinedDate}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
              <Clock className="size-4 text-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Horario</p>
              <p className="text-sm font-medium">{member.schedule}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Skills */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Briefcase className="size-4" />
              Habilidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {member.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active projects */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FolderKanban className="size-4" />
              Proyectos Activos ({member.activeProjects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {member.activeProjects.map((project) => (
                <div
                  key={project}
                  className="flex items-center gap-3 rounded-lg border border-border/50 p-3"
                >
                  <div className="size-2 rounded-full bg-primary" />
                  <span className="text-sm font-medium">{project}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-sm text-muted-foreground">
              <span>Proyectos completados</span>
              <span className="font-semibold text-foreground">{member.completedProjects}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compensation */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Informacion Laboral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Salario mensual</p>
              <p className="text-lg font-bold mt-0.5">{member.salary}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Departamento</p>
              <p className="text-lg font-bold mt-0.5">{member.department}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Horario</p>
              <p className="text-lg font-bold mt-0.5">{member.schedule}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
