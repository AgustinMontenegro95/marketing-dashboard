"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { useSession } from "@/components/auth/session-provider"
import { MessageBoard } from "./message-board"
import { TaskBoard } from "./task-board"
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

export type TaskStatus     = "Pendiente" | "En progreso" | "En revision" | "Completada" | "Cancelada"
export type TaskDisciplina = "Marketing" | "Diseño" | "Desarrollo"
export type TaskTipo       = "Diseño" | "Desarrollo" | "Copy" | "Pauta" | "Revisión" | "Reunión" | "Entrega"

export type Task = {
  id: string        // formato TASK-001
  title: string
  description: string
  assignee: TeamMember
  assignedBy: string
  status: TaskStatus
  priority: "Alta" | "Media" | "Baja"
  disciplina: TaskDisciplina
  tipoTarea: TaskTipo
  cliente: string
  fechaInicio: string
  dueDate: string
  project: string
  tiempoEstimado: number | null   // horas (decimal)
  tiempoEmpleado: number | null   // horas (decimal)
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
  { id: "TASK-001", title: "Revisar mockups Luxe Hotels v3", description: "Dar feedback sobre la tercera iteración del rebrand", assignee: teamMembers[0], assignedBy: "Admin", status: "En progreso", priority: "Alta", disciplina: "Diseño", tipoTarea: "Revisión", cliente: "Luxe Hotels", fechaInicio: "2026-02-10", dueDate: "2026-02-12", project: "Rebrand Luxe Hotel", tiempoEstimado: 3, tiempoEmpleado: 1.5 },
  { id: "TASK-002", title: "Fix pasarela de pagos FinTrack", description: "Resolver bug reportado en la integración de pagos", assignee: teamMembers[3], assignedBy: "Julián Ríos", status: "Pendiente", priority: "Alta", disciplina: "Desarrollo", tipoTarea: "Desarrollo", cliente: "FinTrack", fechaInicio: "2026-02-11", dueDate: "2026-02-11", project: "App Móvil FinTrack", tiempoEstimado: 4, tiempoEmpleado: null },
  { id: "TASK-003", title: "QA E-commerce PlantaVida", description: "Testing completo del flujo de compra antes de producción", assignee: teamMembers[1], assignedBy: "Admin", status: "En revision", priority: "Alta", disciplina: "Desarrollo", tipoTarea: "Revisión", cliente: "PlantaVida", fechaInicio: "2026-02-11", dueDate: "2026-02-13", project: "E-commerce PlantaVida", tiempoEstimado: 6, tiempoEmpleado: 5 },
  { id: "TASK-004", title: "Reporte campaña FitLife Gym", description: "Armar reporte de métricas y resultados de la campaña de social media", assignee: teamMembers[2], assignedBy: "Admin", status: "En progreso", priority: "Media", disciplina: "Marketing", tipoTarea: "Entrega", cliente: "FitLife Gym", fechaInicio: "2026-02-12", dueDate: "2026-02-14", project: "Campaña Social Media", tiempoEstimado: 2, tiempoEmpleado: 0.5 },
  { id: "TASK-005", title: "Publicaciones semana 7", description: "Programar y diseñar las publicaciones de redes sociales de la semana", assignee: teamMembers[5], assignedBy: "Lucía Pardo", status: "Completada", priority: "Media", disciplina: "Marketing", tipoTarea: "Copy", cliente: "Varios", fechaInicio: "2026-02-09", dueDate: "2026-02-10", project: "Varios", tiempoEstimado: 3, tiempoEmpleado: 2.5 },
  { id: "TASK-006", title: "Wireframes DataPulse Dashboard", description: "Diseñar wireframes de alta fidelidad para el panel de analítica", assignee: teamMembers[4], assignedBy: "Admin", status: "Completada", priority: "Media", disciplina: "Diseño", tipoTarea: "Diseño", cliente: "DataPulse", fechaInicio: "2026-02-07", dueDate: "2026-02-10", project: "Dashboard Analytics", tiempoEstimado: 8, tiempoEmpleado: 7 },
  { id: "TASK-007", title: "Setup CI/CD NeoBank landing", description: "Configurar pipeline de deploy automático para la landing page", assignee: teamMembers[3], assignedBy: "Julián Ríos", status: "Cancelada", priority: "Baja", disciplina: "Desarrollo", tipoTarea: "Desarrollo", cliente: "NeoBank", fechaInicio: "2026-02-13", dueDate: "2026-02-15", project: "Landing Page NeoBank", tiempoEstimado: null, tiempoEmpleado: null },
]

export function CommunicationPageContent() {
  const searchParams = useSearchParams()
  const initialTaskId = searchParams.get("tarea") ?? undefined
  const { context } = useSession()

  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)

  function handleSendMessage(content: string, channel: string) {
    const u = context?.usuario
    const nombre  = u ? `${u.nombre} ${u.apellido}` : "Admin"
    const initials = u ? `${u.nombre[0]}${u.apellido[0]}`.toUpperCase() : "AD"
    const msg: Message = {
      id: `msg-${Date.now()}`,
      author: { id: String(u?.id ?? "admin"), name: nombre, initials, role: u?.puesto?.nombre ?? "Usuario", department: "Marketing", status: "online" },
      content,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      channel,
    }
    setMessages((prev) => [...prev, msg])
  }

  function handleAddTask(task: Omit<Task, "id">) {
    const nums = tasks.map((t) => parseInt(t.id.replace("TASK-", ""), 10)).filter((n) => !isNaN(n))
    const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1
    setTasks([{ id: `TASK-${String(next).padStart(3, "0")}`, ...task }, ...tasks])
  }

  function handleUpdateTaskStatus(taskId: string, status: Task["status"]) {
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status } : t)))
  }

  function handleEditTask(taskId: string, updates: Partial<Omit<Task, "id">>) {
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)))
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Comunicación interna</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Mensajería del equipo, tareas asignadas y coordinación
        </p>
      </div>

      <Tabs defaultValue={initialTaskId ? "tareas" : "mensajes"} className="w-full">
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
            onEditTask={handleEditTask}
            initialTaskId={initialTaskId}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
