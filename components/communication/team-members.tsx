"use client"

import type { TeamMember } from "./communication-page-content"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

function getStatusColor(status: string) {
  switch (status) {
    case "online":
      return "bg-foreground"
    case "away":
      return "bg-primary"
    case "offline":
      return "bg-muted-foreground/40"
    default:
      return "bg-muted-foreground/40"
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "online":
      return "En línea"
    case "away":
      return "Ausente"
    case "offline":
      return "Desconectado"
    default:
      return status
  }
}

export function TeamMembers({ members }: { members: TeamMember[] }) {
  const onlineCount = members.filter((m) => m.status === "online").length

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base">
          Equipo
          <span className="text-xs font-normal text-muted-foreground ml-2">
            {onlineCount} en línea
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="size-8">
                <AvatarFallback className="bg-foreground/10 text-foreground text-[10px] font-semibold">
                  {member.initials}
                </AvatarFallback>
              </Avatar>
              <span
                className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card ${getStatusColor(member.status)}`}
                aria-label={getStatusLabel(member.status)}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{member.name}</p>
              <p className="text-xs text-muted-foreground truncate">{member.role}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
