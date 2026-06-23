// ─── Types ────────────────────────────────────────────────────────────────────

export type ChatMode = "bot" | "human"
export type MessageRole = "incoming" | "outgoing"
export type ConnectionStatus = "connected" | "disconnected" | "scanning"

export interface ChatMessage {
  id: string
  role: MessageRole
  text: string
  timestamp: string
  sentByBot?: boolean
  isNote?: boolean
  tokens?: { input: number; output: number }
}

export interface Chat {
  id: string
  name: string
  phone: string
  lastMessage: string
  lastMessageTime: string
  unread: number
  mode: ChatMode
  messages: ChatMessage[]
  hasAlert?: boolean
  csat?: number
}

export interface ContactDetail {
  email?: string
  empresa?: string
  interes?: string
  origen?: string
  primerContacto: string
}

export interface PromptVariable {
  key: string
  label: string
  value: string
  placeholder: string
}

export interface DaySchedule {
  day: string
  label: string
  active: boolean
  from: string
  to: string
}

export interface ResponseTemplate {
  id: string
  category: string
  label: string
  text: string
}

export interface AnalyticsDay {
  day: string
  bot: number
  human: number
  inputTokens: number
  outputTokens: number
  avgBotResponseSec: number
  avgHumanResponseSec: number
  csatAvg: number
}

export interface FlowNode {
  id: string
  type: "start" | "message" | "condition" | "action" | "end"
  label: string
  content: string
  children: FlowNode[]
  conditionLabel?: string
}

export interface BotFlow {
  id: string
  name: string
  active: boolean
  description: string
  root: FlowNode
}

export interface ConnectionInfo {
  status: ConnectionStatus
  phone: string
  name: string
  connectedSince: string
  messagesProcessed: number
  botActive: boolean
  qrCode?: string
}

export interface ChatbotConfig {
  botActive: boolean
  model: string
  prompt: string
  variables: PromptVariable[]
  keywords: string[]
  alertKeywords: string[]
  schedule: DaySchedule[]
  outsideHoursMsg: string
  temperature: number
  maxTokens: number
}

// ─── Client ───────────────────────────────────────────────────────────────────

import { getAccessToken } from "@/lib/session"

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(process.env.NEXT_PUBLIC_API_KEY
        ? { "X-API-KEY": process.env.NEXT_PUBLIC_API_KEY }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...init,
  })
  const json = await res.json() as { estado: boolean; error_mensaje: string | null; datos: T }
  if (!res.ok || !json.estado) {
    throw new Error(json.error_mensaje ?? `[${res.status}] ${path}`)
  }
  return json.datos
}

// ─── Chats ────────────────────────────────────────────────────────────────────

export const chatbotApi = {
  // Active conversations
  getChats: () =>
    request<Chat[]>("/api/v1/chatbot/chats"),

  getMessages: (chatId: string) =>
    request<ChatMessage[]>(`/api/chatbot/chats/${chatId}/messages`),

  sendMessage: (chatId: string, text: string, isNote: boolean) =>
    request<ChatMessage>(`/api/chatbot/chats/${chatId}/messages`, {
      method: "POST",
      body: JSON.stringify({ text, isNote }),
    }),

  markRead: (chatId: string) =>
    request<void>(`/api/chatbot/chats/${chatId}/read`, { method: "PATCH" }),

  toggleMode: (chatId: string, mode: ChatMode) =>
    request<Chat>(`/api/chatbot/chats/${chatId}/mode`, {
      method: "PATCH",
      body: JSON.stringify({ mode }),
    }),

  archiveChat: (chatId: string, csat?: number, comment?: string) =>
    request<void>(`/api/chatbot/chats/${chatId}/archive`, {
      method: "POST",
      body: JSON.stringify({ csat, comment }),
    }),

  getContactDetail: (chatId: string) =>
    request<ContactDetail>(`/api/chatbot/contacts/${chatId}`),

  // Archived
  getArchivedChats: () =>
    request<Chat[]>("/api/v1/chatbot/chats/archived"),

  restoreChat: (chatId: string) =>
    request<void>(`/api/chatbot/chats/${chatId}/restore`, { method: "POST" }),

  // Connection
  getConnection: () =>
    request<ConnectionInfo>("/api/v1/chatbot/connection"),

  connectWhatsApp: () =>
    request<{ qrCode: string }>("/api/v1/chatbot/connection/connect", { method: "POST" }),

  disconnectWhatsApp: () =>
    request<void>("/api/v1/chatbot/connection/disconnect", { method: "POST" }),

  toggleGlobalBot: (active: boolean) =>
    request<void>("/api/v1/chatbot/connection/bot", {
      method: "PATCH",
      body: JSON.stringify({ active }),
    }),

  // Configuration
  getConfig: () =>
    request<ChatbotConfig>("/api/v1/chatbot/config"),

  saveConfig: (config: Partial<ChatbotConfig>) =>
    request<ChatbotConfig>("/api/v1/chatbot/config", {
      method: "PUT",
      body: JSON.stringify(config),
    }),

  // Analytics
  getAnalytics: (params?: { from?: string; to?: string }) => {
    const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : ""
    return request<AnalyticsDay[]>(`/api/chatbot/analytics${qs}`)
  },

  // Blacklist
  getBlacklist: () =>
    request<string[]>("/api/v1/chatbot/blacklist"),

  addToBlacklist: (phone: string) =>
    request<void>("/api/v1/chatbot/blacklist", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),

  removeFromBlacklist: (phone: string) =>
    request<void>(`/api/chatbot/blacklist/${encodeURIComponent(phone)}`, { method: "DELETE" }),

  // Flows
  getFlows: () =>
    request<BotFlow[]>("/api/v1/chatbot/flows"),

  createFlow: (flow: Omit<BotFlow, "id">) =>
    request<BotFlow>("/api/v1/chatbot/flows", {
      method: "POST",
      body: JSON.stringify(flow),
    }),

  updateFlow: (id: string, flow: Partial<BotFlow>) =>
    request<BotFlow>(`/api/chatbot/flows/${id}`, {
      method: "PUT",
      body: JSON.stringify(flow),
    }),

  deleteFlow: (id: string) =>
    request<void>(`/api/chatbot/flows/${id}`, { method: "DELETE" }),

  toggleFlowActive: (id: string, active: boolean) =>
    request<BotFlow>(`/api/chatbot/flows/${id}/active`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    }),

  // Templates
  getTemplates: () =>
    request<ResponseTemplate[]>("/api/v1/chatbot/templates"),

  createTemplate: (tpl: Omit<ResponseTemplate, "id">) =>
    request<ResponseTemplate>("/api/v1/chatbot/templates", {
      method: "POST",
      body: JSON.stringify(tpl),
    }),

  updateTemplate: (id: string, tpl: Partial<ResponseTemplate>) =>
    request<ResponseTemplate>(`/api/chatbot/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(tpl),
    }),

  deleteTemplate: (id: string) =>
    request<void>(`/api/chatbot/templates/${id}`, { method: "DELETE" }),
}
