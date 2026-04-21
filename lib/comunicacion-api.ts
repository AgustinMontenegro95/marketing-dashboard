import { apiFetchAuth } from "@/lib/api"
import type { TeamMember, Message, Task, Channel, Comment, HistorialEntry } from "@/components/communication/communication-types"

// ─── Raw API shapes ──────────────────────────────────────────────────────────

type RawMember = {
  id: number; name: string; initials: string; role: string
  department: string
  status: "online" | "offline" | "away"; avatarUrl: string | null
}
type RawChannel = {
  id: number; label: string; description: string; color: string
  memberIds: number[]; members: RawMember[]; unreadCount: number
  lastMessage: { content: string; timestamp: string; authorName: string } | null
}
type RawMsg = {
  id: number
  channelId?: number; channel_id?: number
  content: string
  timestamp?: string; created_at?: string
  author?: RawMember
  userId?: number; user_id?: number
  authorName?: string; authorInitials?: string
}
type RawMessagePage = { mensajes?: RawMsg[]; data?: RawMsg[]; meta: { hasMore: boolean; nextCursor: number | null; total: number } }
type RawTask = {
  id: string; title: string; description: string; status: string; priority: string
  disciplina: string; tipoTarea: string; cliente: string; project: string
  fechaInicio: string; dueDate: string; tiempoEstimado: number | null; tiempoEmpleado: number | null
  assignee: RawMember; assignedBy: string
}
type RawComment = {
  id: number; taskId: string; content: string; timestamp: string
  author: { id: number; name: string; initials: string; avatarUrl: string | null }
}
type RawHistorial = {
  id: string; taskId: string; type: "created" | "status_change" | "edit" | "time_update"
  description: string; timestamp: string; author: { id: number; name: string; initials: string }
}
type Paginated<T> = { contenido?: T[]; data?: T[]; tareas?: T[]; meta?: { page: number; pageSize: number; total: number; totalPages: number } }

// ─── Mappers ─────────────────────────────────────────────────────────────────

const DEPT_MAP: Record<string, TeamMember["department"]> = {
  marketing: "Marketing", diseño: "Diseño", diseno: "Diseño", desarrollo: "Desarrollo", software: "Desarrollo",
}
function mapMember(r: RawMember): TeamMember {
  const dept = DEPT_MAP[r.department?.toLowerCase()] ?? "Marketing"
  return { id: String(r.id), name: r.name, initials: r.initials, role: r.role, department: dept, status: r.status, avatarUrl: r.avatarUrl }
}
function mapChannel(r: RawChannel): Channel {
  return { id: String(r.id), label: r.label, description: r.description, color: r.color, memberIds: r.memberIds.map(String), members: r.members.map(mapMember), unreadCount: r.unreadCount, lastMessage: r.lastMessage ?? null }
}
function mapMsg(r: RawMsg): Message {
  const channelId = String(r.channelId ?? r.channel_id ?? 0)
  const timestamp = r.timestamp ?? r.created_at ?? new Date().toISOString()
  const author: TeamMember = r.author
    ? mapMember(r.author)
    : {
        id: String(r.userId ?? r.user_id ?? 0),
        name: r.authorName ?? "Usuario",
        initials: r.authorInitials ?? "U",
        role: "", department: "Marketing", status: "online",
      }
  return { id: String(r.id), channelId, content: r.content, timestamp, author }
}
function mapTask(r: RawTask): Task {
  const assignee: TeamMember = r.assignee
    ? mapMember(r.assignee)
    : { id: String((r as any).assigneeId ?? 0), name: "—", initials: "?", role: "", department: "Marketing", status: "online" }
  return { id: r.id, title: r.title, description: r.description, status: r.status as Task["status"], priority: r.priority as Task["priority"], disciplina: r.disciplina as Task["disciplina"], tipoTarea: r.tipoTarea as Task["tipoTarea"], cliente: r.cliente, project: r.project, fechaInicio: r.fechaInicio, dueDate: r.dueDate, tiempoEstimado: r.tiempoEstimado, tiempoEmpleado: r.tiempoEmpleado, assignee, assignedBy: r.assignedBy }
}
function mapComment(r: RawComment): Comment {
  return { id: String(r.id), taskId: r.taskId, authorName: r.author.name, authorInitials: r.author.initials, authorAvatarUrl: r.author.avatarUrl, content: r.content, timestamp: r.timestamp }
}
function mapHistorial(r: RawHistorial): HistorialEntry {
  return { id: r.id, timestamp: r.timestamp, authorName: r.author.name, authorInitials: r.author.initials, type: r.type, description: r.description }
}

// ─── Team Members ─────────────────────────────────────────────────────────────

export async function getTeamMembers(): Promise<TeamMember[]> {
  const res = await apiFetchAuth<RawMember[]>("/api/v1/team-members")
  return res.datos?.map(mapMember) ?? []
}

// ─── Channels ─────────────────────────────────────────────────────────────────

export async function getChannels(): Promise<Channel[]> {
  const res = await apiFetchAuth<RawChannel[]>("/api/v1/channels")
  return res.datos?.map(mapChannel) ?? []
}

export async function createChannel(body: { label: string; description: string; color: string; memberIds: string[] }): Promise<Channel | null> {
  const res = await apiFetchAuth<RawChannel>("/api/v1/channels", { method: "POST", body: { ...body, memberIds: body.memberIds.map(Number) } })
  return res.datos ? mapChannel(res.datos) : null
}

export async function updateChannel(id: string, body: { label: string; description: string; color: string; memberIds: string[] }): Promise<Channel | null> {
  const res = await apiFetchAuth<RawChannel>(`/api/v1/channels/${id}`, { method: "PUT", body: { ...body, memberIds: body.memberIds.map(Number) } })
  return res.datos ? mapChannel(res.datos) : null
}

export async function deleteChannel(id: string): Promise<boolean> {
  const res = await apiFetchAuth(`/api/v1/channels/${id}`, { method: "DELETE" })
  return res.estado
}

export async function getUnreadCounts(): Promise<Record<string, number>> {
  const res = await apiFetchAuth<Record<string, number>>("/api/v1/channels/unread")
  if (!res.datos) return {}
  return Object.fromEntries(Object.entries(res.datos).map(([k, v]) => [String(k), v]))
}

export async function markChannelRead(channelId: string): Promise<void> {
  await apiFetchAuth(`/api/v1/channels/${channelId}/read`, { method: "POST" })
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function getMessages(
  channelId: string,
  params?: { limit?: number; before?: string; after?: string }
): Promise<{ messages: Message[]; hasMore: boolean; nextCursor: string | null }> {
  const qs = new URLSearchParams()
  if (params?.limit) qs.set("limit", String(params.limit))
  if (params?.before) qs.set("before", params.before)
  if (params?.after) qs.set("after", params.after)
  const q = qs.toString()
  const res = await apiFetchAuth<RawMessagePage | RawMsg[]>(`/api/v1/channels/${channelId}/messages${q ? `?${q}` : ""}`)
  const raw = res.datos
  if (!raw) return { messages: [], hasMore: false, nextCursor: null }
  if (Array.isArray(raw)) {
    return { messages: raw.map(mapMsg), hasMore: false, nextCursor: raw.length > 0 ? String(raw[raw.length - 1].id) : null }
  }
  const msgs = raw.mensajes ?? raw.data ?? []
  return { messages: msgs.map(mapMsg), hasMore: raw.meta?.hasMore ?? false, nextCursor: raw.meta?.nextCursor != null ? String(raw.meta.nextCursor) : null }
}

export async function sendMessage(channelId: string, content: string): Promise<Message | null> {
  const res = await apiFetchAuth<RawMsg>(`/api/v1/channels/${channelId}/messages`, { method: "POST", body: { content } })
  return res.datos ? mapMsg(res.datos) : null
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTasks(filters?: Record<string, string | number | undefined>): Promise<Task[]> {
  const qs = new URLSearchParams()
  if (filters) { for (const [k, v] of Object.entries(filters)) { if (v !== undefined && v !== "") qs.set(k, String(v)) } }
  const q = qs.toString()
  const res = await apiFetchAuth<Paginated<RawTask> | RawTask[]>(`/api/v1/tasks${q ? `?${q}` : ""}`)
  if (!res.datos) return []
  if (Array.isArray(res.datos)) return res.datos.map(mapTask)
  const rows = (res.datos as any).contenido ?? (res.datos as any).tareas ?? (res.datos as any).data ?? []
  return rows.map(mapTask)
}

export async function createTask(body: {
  title: string; description?: string; assigneeId: string; status?: string
  priority: string; disciplina: string; tipoTarea: string; cliente?: string
  project?: string; fechaInicio?: string; dueDate?: string
  tiempoEstimado?: number | null; tiempoEmpleado?: number | null
}): Promise<Task | null> {
  const res = await apiFetchAuth<RawTask>("/api/v1/tasks", { method: "POST", body: { ...body, assigneeId: Number(body.assigneeId) } })
  return res.datos ? mapTask(res.datos) : null
}

export async function getTaskDetail(taskId: string): Promise<{ task: Task; comments: Comment[]; historial: HistorialEntry[] } | null> {
  const res = await apiFetchAuth<RawTask & { comments: RawComment[]; historial: RawHistorial[] }>(`/api/v1/tasks/${taskId}`)
  if (!res.datos) return null
  return { task: mapTask(res.datos), comments: res.datos.comments.map(mapComment), historial: res.datos.historial.map(mapHistorial) }
}

export async function updateTask(taskId: string, body: Partial<{
  title: string; description: string; assigneeId: string; priority: string
  disciplina: string; tipoTarea: string; cliente: string; project: string
  fechaInicio: string; dueDate: string; tiempoEstimado: number | null; tiempoEmpleado: number | null
}>): Promise<Task | null> {
  const payload: Record<string, unknown> = { ...body }
  if (body.assigneeId) payload.assigneeId = Number(body.assigneeId)
  const res = await apiFetchAuth<RawTask>(`/api/v1/tasks/${taskId}`, { method: "PUT", body: payload })
  return res.datos ? mapTask(res.datos) : null
}

export async function updateTaskStatus(taskId: string, status: string): Promise<boolean> {
  const res = await apiFetchAuth(`/api/v1/tasks/${taskId}/status`, { method: "PATCH", body: { status } })
  return res.estado
}

export async function addComment(taskId: string, content: string): Promise<Comment | null> {
  const res = await apiFetchAuth<RawComment>(`/api/v1/tasks/${taskId}/comments`, { method: "POST", body: { content } })
  return res.datos ? mapComment(res.datos) : null
}
