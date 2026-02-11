"use client"

import type { FullTeamMember } from "./team-page-content"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const statusLabel: Record<string, string> = {
  online: "En linea",
  offline: "Desconectado",
  away: "Ausente",
}

export function TeamMemberCard({
  member,
  deptColor,
  onSelect,
}: {
  member: FullTeamMember
  deptColor: string
  onSelect: () => void
}) {
  return (
    <Card
      className="border-border cursor-pointer transition-all hover:shadow-md hover:border-foreground/20 group"
      onClick={onSelect}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="size-12 border-2 border-border">
              <AvatarFallback className="text-sm font-semibold bg-muted text-foreground">
                {member.initials}
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "absolute bottom-0 right-0 size-3 rounded-full border-2 border-card",
                member.status === "online" && "bg-green-500",
                member.status === "away" && "bg-yellow-500",
                member.status === "offline" && "bg-muted-foreground/40"
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
              {member.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate">{member.role}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0"
                style={{ borderColor: deptColor, color: deptColor }}
              >
                {member.department}
              </Badge>
              <span className="text-[10px] text-muted-foreground">{statusLabel[member.status]}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <span>{member.activeProjects.length} proyectos activos</span>
          <span>{member.completedProjects} completados</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {member.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
            >
              {skill}
            </span>
          ))}
          {member.skills.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              +{member.skills.length - 3}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
