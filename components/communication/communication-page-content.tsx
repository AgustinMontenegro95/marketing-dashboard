"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { MessageBoard } from "./message-board"
import { TaskBoard } from "./task-board"
import { getTeamMembers } from "@/lib/comunicacion-api"
import { cn } from "@/lib/utils"
import type { TeamMember } from "./communication-types"

export type { TeamMember, Message, TaskStatus, TaskDisciplina, TaskTipo, Task, Channel, Comment, HistorialEntry } from "./communication-types"

export function CommunicationPageContent({ section }: { section: "mensajes" | "tareas" }) {
  const searchParams = useSearchParams()
  const initialTaskId = searchParams.get("tarea") ?? undefined

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  useEffect(() => {
    getTeamMembers().then(setTeamMembers)
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Comunicación interna</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Mensajería del equipo, tareas asignadas y coordinación
        </p>
      </div>

      <div className="inline-flex items-center gap-1 rounded-lg border bg-muted/50 p-1 mb-4">
        <Link
          href="/comunicacion/mensajes"
          className={cn(
            "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
            section === "mensajes"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Mensajes
        </Link>
        <Link
          href="/comunicacion/tareas"
          className={cn(
            "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
            section === "tareas"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Tareas
        </Link>
      </div>

      {section === "mensajes" ? (
        <MessageBoard teamMembers={teamMembers} />
      ) : (
        <TaskBoard teamMembers={teamMembers} initialTaskId={initialTaskId} />
      )}
    </div>
  )
}
