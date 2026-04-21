export type TeamMember = {
  id: string
  name: string
  initials: string
  role: string
  department: "Marketing" | "Diseño" | "Desarrollo"
  status: "online" | "offline" | "away"
  avatarUrl?: string | null
}

export type Message = {
  id: string
  author: TeamMember
  content: string
  timestamp: string
  channelId: string
}

export type Channel = {
  id: string
  label: string
  description: string
  color: string
  memberIds: string[]
  members: TeamMember[]
  unreadCount: number
  lastMessage: { content: string; timestamp: string; authorName: string } | null
}

export type TaskStatus     = "Pendiente" | "En progreso" | "En revision" | "Completada" | "Cancelada"
export type TaskDisciplina = "Marketing" | "Diseño" | "Desarrollo"
export type TaskTipo       = "Diseño" | "Desarrollo" | "Copy" | "Pauta" | "Revisión" | "Reunión" | "Entrega"

export type Task = {
  id: string
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
  tiempoEstimado: number | null
  tiempoEmpleado: number | null
}

export type Comment = {
  id: string
  taskId: string
  authorName: string
  authorInitials: string
  authorAvatarUrl?: string | null
  content: string
  timestamp: string
}

export type HistorialEntry = {
  id: string
  timestamp: string
  authorName: string
  authorInitials: string
  type: "created" | "status_change" | "edit" | "time_update"
  description: string
}
