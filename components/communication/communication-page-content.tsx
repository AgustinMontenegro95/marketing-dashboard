"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { MessageBoard } from "./message-board"
import { TaskBoard } from "./task-board"
import { TeamMembers } from "./team-members"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type TeamMember = {
  id: string
  name: string
  initials: string
  role: string
  department: "Marketing" | "Diseño" | "Desarrollo"
  status: "online" | "offline" | "away"
}

export type Message = {
  id: string
  author: TeamMember
  content: string
  timestamp: string
  channel: string
}

export type Task = {
  id: string
  title: string
  description: string
  assignee: TeamMember
  assignedBy: string
  status: "Pendiente" | "En progreso" | "Completada"
  priority: "Alta" | "Media" | "Baja"
  dueDate: string
  project: string
}

export const teamMembers: TeamMember[] = [
  { id: "tm-1", name: "Marcela Cruz", initials: "MC", role: "Directora de Diseño", department: "Diseño", status: "online" },
  { id: "tm-2", name: "Julián Ríos", initials: "JR", role: "Lead Developer", department: "Desarrollo", status: "online" },
  { id: "tm-3", name: "Lucía Pardo", initials: "LP", role: "Estratega de Marketing", department: "Marketing", status: "away" },
  { id: "tm-4", name: "Andrés Soto", initials: "AS", role: "Full Stack Developer", department: "Desarrollo", status: "online" },
  { id: "tm-5", name: "Carolina Vega", initials: "CV", role: "Diseñadora UX/UI", department: "Diseño", status: "offline" },
  { id: "tm-6", name: "Roberto Díaz", initials: "RD", role: "Community Manager", department: "Marketing", status: "online" },
]

const initialMessages: Message[] = [
  {
    id: "msg-1",
    author: teamMembers[1],
    content: "Deploy del E-commerce PlantaVida listo en staging. Falta QA antes de producción.",
    timestamp: "2026-02-11 09:45",
    channel: "general",
  },
  {
    id: "msg-2",
    author: teamMembers[0],
    content: "Actualicé los mockups del rebrand de Luxe Hotels. Revisen el Figma actualizado.",
    timestamp: "2026-02-11 09:30",
    channel: "general",
  },
  {
    id: "msg-3",
    author: teamMembers[2],
    content: "Los números de la campaña de FitLife superaron las expectativas. Armando el reporte para el cliente.",
    timestamp: "2026-02-11 09:15",
    channel: "general",
  },
  {
    id: "msg-4",
    author: teamMembers[5],
    content: "Programé las publicaciones de la semana para todos los clientes. Cualquier cambio avisen antes del jueves.",
    timestamp: "2026-02-11 08:50",
    channel: "marketing",
  },
  {
    id: "msg-5",
    author: teamMembers[3],
    content: "Encontré un bug en la pasarela de pagos de FinTrack. Abro ticket y lo priorizo.",
    timestamp: "2026-02-10 18:20",
    channel: "desarrollo",
  },
  {
    id: "msg-6",
    author: teamMembers[4],
    content: "Terminé los wireframes del nuevo dashboard de DataPulse. Están en el proyecto de Figma compartido.",
    timestamp: "2026-02-10 17:00",
    channel: "diseño",
  },
]

const initialTasks: Task[] = [
  {
    id: "task-1",
    title: "Revisar mockups Luxe Hotels v3",
    description: "Dar feedback sobre la tercera iteración del rebrand",
    assignee: teamMembers[0],
    assignedBy: "Admin",
    status: "En progreso",
    priority: "Alta",
    dueDate: "2026-02-12",
    project: "Rebrand Luxe Hotel",
  },
  {
    id: "task-2",
    title: "Fix pasarela de pagos FinTrack",
    description: "Resolver bug reportado en la integración de pagos",
    assignee: teamMembers[3],
    assignedBy: "Julián Ríos",
    status: "Pendiente",
    priority: "Alta",
    dueDate: "2026-02-11",
    project: "App Móvil FinTrack",
  },
  {
    id: "task-3",
    title: "QA E-commerce PlantaVida",
    description: "Testing completo del flujo de compra antes de producción",
    assignee: teamMembers[1],
    assignedBy: "Admin",
    status: "En progreso",
    priority: "Alta",
    dueDate: "2026-02-13",
    project: "E-commerce PlantaVida",
  },
  {
    id: "task-4",
    title: "Reporte campaña FitLife Gym",
    description: "Armar reporte de métricas y resultados de la campaña de social media",
    assignee: teamMembers[2],
    assignedBy: "Admin",
    status: "En progreso",
    priority: "Media",
    dueDate: "2026-02-14",
    project: "Campaña Social Media",
  },
  {
    id: "task-5",
    title: "Publicaciones semana 7",
    description: "Programar y diseñar las publicaciones de redes sociales de la semana",
    assignee: teamMembers[5],
    assignedBy: "Lucía Pardo",
    status: "Completada",
    priority: "Media",
    dueDate: "2026-02-10",
    project: "Varios",
  },
  {
    id: "task-6",
    title: "Wireframes DataPulse Dashboard",
    description: "Diseñar wireframes de alta fidelidad para el panel de analítica",
    assignee: teamMembers[4],
    assignedBy: "Admin",
    status: "Completada",
    priority: "Media",
    dueDate: "2026-02-10",
    project: "Dashboard Analytics",
  },
  {
    id: "task-7",
    title: "Setup CI/CD NeoBank landing",
    description: "Configurar pipeline de deploy automático para la landing page",
    assignee: teamMembers[3],
    assignedBy: "Julián Ríos",
    status: "Pendiente",
    priority: "Baja",
    dueDate: "2026-02-15",
    project: "Landing Page NeoBank",
  },
]

export function CommunicationPageContent() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)

  function handleSendMessage(content: string, channel: string) {
    const msg: Message = {
      id: `msg-${messages.length + 1}`,
      author: { id: "admin", name: "Admin", initials: "AD", role: "Administrador", department: "Marketing", status: "online" },
      content,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      channel,
    }
    setMessages([msg, ...messages])
  }

  function handleAddTask(task: Omit<Task, "id">) {
    setTasks([{ id: `task-${tasks.length + 1}`, ...task }, ...tasks])
  }

  function handleUpdateTaskStatus(taskId: string, status: Task["status"]) {
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status } : t)))
  }

  return (
    <DashboardShell breadcrumb="Comunicación">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Comunicación Interna</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Mensajería del equipo, tareas asignadas y coordinación
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Tabs defaultValue="mensajes" className="w-full">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="mensajes" className="flex-1 sm:flex-none">Mensajes</TabsTrigger>
              <TabsTrigger value="tareas" className="flex-1 sm:flex-none">Tareas</TabsTrigger>
            </TabsList>
            <TabsContent value="mensajes" className="mt-4">
              <MessageBoard messages={messages} onSendMessage={handleSendMessage} />
            </TabsContent>
            <TabsContent value="tareas" className="mt-4">
              <TaskBoard
                tasks={tasks}
                onAddTask={handleAddTask}
                onUpdateStatus={handleUpdateTaskStatus}
              />
            </TabsContent>
          </Tabs>
        </div>
        <TeamMembers members={teamMembers} />
      </div>
    </DashboardShell>
  )
}
