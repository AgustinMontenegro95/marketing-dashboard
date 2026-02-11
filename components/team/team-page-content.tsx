"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { TeamMemberCard } from "./team-member-card"
import { TeamMemberDetail } from "./team-member-detail"
import { Badge } from "@/components/ui/badge"

export type FullTeamMember = {
  id: string
  name: string
  initials: string
  role: string
  department: "Marketing" | "Diseno" | "Desarrollo"
  status: "online" | "offline" | "away"
  email: string
  phone: string
  joinedDate: string
  skills: string[]
  activeProjects: string[]
  completedProjects: number
  bio: string
  salary: string
  schedule: string
}

const teamData: FullTeamMember[] = [
  {
    id: "tm-1",
    name: "Marcela Cruz",
    initials: "MC",
    role: "Directora de Diseno",
    department: "Diseno",
    status: "online",
    email: "marcela@chemi.io",
    phone: "+54 11 4567-1111",
    joinedDate: "2023-03-10",
    skills: ["UI/UX Design", "Branding", "Figma", "Adobe Suite", "Motion Graphics"],
    activeProjects: ["Rebrand Luxe Hotels", "Dashboard DataPulse"],
    completedProjects: 18,
    bio: "Mas de 10 anos de experiencia en diseno digital. Lidero el equipo de diseno y se especializa en branding corporativo y experiencias de usuario.",
    salary: "$380.000",
    schedule: "Lunes a Viernes, 9:00 - 18:00",
  },
  {
    id: "tm-2",
    name: "Julian Rios",
    initials: "JR",
    role: "Lead Developer",
    department: "Desarrollo",
    status: "online",
    email: "julian@chemi.io",
    phone: "+54 11 4567-2222",
    joinedDate: "2023-01-15",
    skills: ["React", "Next.js", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
    activeProjects: ["E-commerce PlantaVida", "App Movil FinTrack"],
    completedProjects: 22,
    bio: "Ingeniero de software senior con experiencia en arquitectura de aplicaciones escalables. Lidera el equipo de desarrollo y define los estandares tecnicos.",
    salary: "$420.000",
    schedule: "Lunes a Viernes, 9:00 - 18:00",
  },
  {
    id: "tm-3",
    name: "Lucia Pardo",
    initials: "LP",
    role: "Estratega de Marketing",
    department: "Marketing",
    status: "away",
    email: "lucia@chemi.io",
    phone: "+54 11 4567-3333",
    joinedDate: "2023-06-20",
    skills: ["SEO/SEM", "Google Ads", "Analytics", "Content Strategy", "Social Media"],
    activeProjects: ["Campana FitLife Gym", "SEO CloudBase"],
    completedProjects: 15,
    bio: "Especialista en marketing digital con foco en performance y estrategia de contenidos. Gestiona las campanas de todos los clientes.",
    salary: "$350.000",
    schedule: "Lunes a Viernes, 9:00 - 18:00",
  },
  {
    id: "tm-4",
    name: "Andres Soto",
    initials: "AS",
    role: "Full Stack Developer",
    department: "Desarrollo",
    status: "online",
    email: "andres@chemi.io",
    phone: "+54 11 4567-4444",
    joinedDate: "2024-02-01",
    skills: ["React", "Python", "Docker", "GraphQL", "MongoDB"],
    activeProjects: ["App Movil FinTrack", "Landing NeoBank"],
    completedProjects: 8,
    bio: "Desarrollador full stack con experiencia en aplicaciones moviles y web. Se enfoca en performance y buenas practicas de codigo.",
    salary: "$310.000",
    schedule: "Lunes a Viernes, 10:00 - 19:00",
  },
  {
    id: "tm-5",
    name: "Carolina Vega",
    initials: "CV",
    role: "Disenadora UX/UI",
    department: "Diseno",
    status: "offline",
    email: "carolina@chemi.io",
    phone: "+54 11 4567-5555",
    joinedDate: "2024-05-15",
    skills: ["Figma", "Prototyping", "User Research", "Wireframing", "Illustration"],
    activeProjects: ["Dashboard DataPulse"],
    completedProjects: 6,
    bio: "Disenadora con pasion por la investigacion de usuarios y la creacion de interfaces intuitivas. Se especializa en wireframing y prototipado.",
    salary: "$280.000",
    schedule: "Lunes a Viernes, 9:00 - 18:00",
  },
  {
    id: "tm-6",
    name: "Roberto Diaz",
    initials: "RD",
    role: "Community Manager",
    department: "Marketing",
    status: "online",
    email: "roberto@chemi.io",
    phone: "+54 11 4567-6666",
    joinedDate: "2024-08-10",
    skills: ["Social Media", "Copywriting", "Canva", "Analytics", "Content Creation"],
    activeProjects: ["Campana FitLife Gym", "SEO CloudBase", "Redes NeoBank"],
    completedProjects: 4,
    bio: "Especialista en redes sociales y creacion de contenido. Maneja la presencia digital de multiples clientes simultaneamente.",
    salary: "$240.000",
    schedule: "Lunes a Viernes, 9:00 - 18:00",
  },
]

const deptColors: Record<string, string> = {
  Marketing: "#ff0000",
  Diseno: "#000000",
  Desarrollo: "#555555",
}

export function TeamPageContent() {
  const [selectedMember, setSelectedMember] = useState<FullTeamMember | null>(null)
  const [filterDept, setFilterDept] = useState<string>("Todos")

  const filtered = filterDept === "Todos" ? teamData : teamData.filter((m) => m.department === filterDept)

  if (selectedMember) {
    return (
      <DashboardShell breadcrumb="Equipo">
        <TeamMemberDetail member={selectedMember} onBack={() => setSelectedMember(null)} />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell breadcrumb="Equipo">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Equipo</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {teamData.length} miembros activos en el equipo de Chemi
        </p>
      </div>

      {/* Department filter */}
      <div className="flex items-center gap-2">
        {["Todos", "Marketing", "Diseno", "Desarrollo"].map((dept) => (
          <Badge
            key={dept}
            variant={filterDept === dept ? "default" : "outline"}
            className="cursor-pointer transition-colors"
            onClick={() => setFilterDept(dept)}
          >
            {dept === "Diseno" ? "Diseno" : dept}
          </Badge>
        ))}
      </div>

      {/* Team grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((member) => (
          <TeamMemberCard
            key={member.id}
            member={member}
            deptColor={deptColors[member.department] || "#000"}
            onSelect={() => setSelectedMember(member)}
          />
        ))}
      </div>
    </DashboardShell>
  )
}
