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

export const teamMembers: TeamMember[] = [
  { id: "tm-1", name: "Marcela Cruz",    initials: "MC", role: "Directora de Diseño",       department: "Diseño",      status: "online"  },
  { id: "tm-2", name: "Julián Ríos",     initials: "JR", role: "Lead Developer",             department: "Desarrollo",  status: "online"  },
  { id: "tm-3", name: "Lucía Pardo",     initials: "LP", role: "Estratega de Marketing",     department: "Marketing",   status: "away"    },
  { id: "tm-4", name: "Andrés Soto",     initials: "AS", role: "Full Stack Developer",       department: "Desarrollo",  status: "online"  },
  { id: "tm-5", name: "Carolina Vega",   initials: "CV", role: "Diseñadora UX/UI",           department: "Diseño",      status: "offline" },
  { id: "tm-6", name: "Roberto Díaz",    initials: "RD", role: "Community Manager",          department: "Marketing",   status: "online"  },
]
