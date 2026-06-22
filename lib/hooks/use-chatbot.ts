"use client"

import { useState, useEffect, useCallback } from "react"
import { chatbotApi, type Chat, type ChatbotConfig, type ConnectionInfo, type BotFlow, type ResponseTemplate } from "@/lib/api/chatbot"

// ─── Generic async state helper ───────────────────────────────────────────────

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[] = []): AsyncState<T> & { refetch: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null })

  const run = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }))
    fetcher()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: unknown) => setState({ data: null, loading: false, error: err instanceof Error ? err.message : "Error desconocido" }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { run() }, [run])

  return { ...state, refetch: run }
}

// ─── Chats ────────────────────────────────────────────────────────────────────

export function useChats() {
  const { data, loading, error, refetch } = useAsync(() => chatbotApi.getChats(), [])
  const [chats, setChats] = useState<Chat[]>([])

  useEffect(() => { if (data) setChats(data) }, [data])

  return { chats, setChats, loading, error, refetch }
}

export function useArchivedChats() {
  return useAsync(() => chatbotApi.getArchivedChats(), [])
}

export function useContactDetail(chatId: string | null) {
  return useAsync(
    () => (chatId ? chatbotApi.getContactDetail(chatId) : Promise.resolve(null)),
    [chatId],
  )
}

// ─── Connection ───────────────────────────────────────────────────────────────

export function useConnection() {
  const { data, loading, error, refetch } = useAsync<ConnectionInfo>(() => chatbotApi.getConnection(), [])
  const [connection, setConnection] = useState<ConnectionInfo | null>(null)

  useEffect(() => { if (data) setConnection(data) }, [data])

  return { connection, setConnection, loading, error, refetch }
}

// ─── Config ───────────────────────────────────────────────────────────────────

export function useChatbotConfig() {
  const { data, loading, error, refetch } = useAsync<ChatbotConfig>(() => chatbotApi.getConfig(), [])
  const [config, setConfig] = useState<ChatbotConfig | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (data) setConfig(data) }, [data])

  function update(partial: Partial<ChatbotConfig>) {
    setConfig((prev) => prev ? { ...prev, ...partial } : null)
    setIsDirty(true)
  }

  async function save() {
    if (!config) return
    setSaving(true)
    try {
      const saved = await chatbotApi.saveConfig(config)
      setConfig(saved)
      setIsDirty(false)
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    if (data) { setConfig(data); setIsDirty(false) }
  }

  return { config, update, save, reset, isDirty, saving, loading, error, refetch }
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export function useAnalytics(params?: { from?: string; to?: string }) {
  return useAsync(() => chatbotApi.getAnalytics(params), [params?.from, params?.to])
}

// ─── Blacklist ────────────────────────────────────────────────────────────────

export function useBlacklist() {
  const { data, loading, error, refetch } = useAsync(() => chatbotApi.getBlacklist(), [])
  const [blocked, setBlocked] = useState<string[]>([])

  useEffect(() => { if (data) setBlocked(data) }, [data])

  async function add(phone: string) {
    await chatbotApi.addToBlacklist(phone)
    setBlocked((prev) => [...prev, phone])
  }

  async function remove(phone: string) {
    await chatbotApi.removeFromBlacklist(phone)
    setBlocked((prev) => prev.filter((p) => p !== phone))
  }

  return { blocked, add, remove, loading, error, refetch }
}

// ─── Flows ────────────────────────────────────────────────────────────────────

export function useFlows() {
  const { data, loading, error, refetch } = useAsync(() => chatbotApi.getFlows(), [])
  const [flows, setFlows] = useState<BotFlow[]>([])

  useEffect(() => { if (data) setFlows(data) }, [data])

  async function toggle(id: string, active: boolean) {
    const updated = await chatbotApi.toggleFlowActive(id, active)
    setFlows((prev) => prev.map((f) => (f.id === id ? updated : f)))
  }

  async function remove(id: string) {
    await chatbotApi.deleteFlow(id)
    setFlows((prev) => prev.filter((f) => f.id !== id))
  }

  async function create(flow: Omit<BotFlow, "id">) {
    const created = await chatbotApi.createFlow(flow)
    setFlows((prev) => [...prev, created])
    return created
  }

  async function update(id: string, partial: Partial<BotFlow>) {
    const updated = await chatbotApi.updateFlow(id, partial)
    setFlows((prev) => prev.map((f) => (f.id === id ? updated : f)))
  }

  return { flows, setFlows, toggle, remove, create, update, loading, error, refetch }
}

// ─── Templates ────────────────────────────────────────────────────────────────

export function useTemplates() {
  const { data, loading, error, refetch } = useAsync(() => chatbotApi.getTemplates(), [])
  const [templates, setTemplates] = useState<ResponseTemplate[]>([])

  useEffect(() => { if (data) setTemplates(data) }, [data])

  return { templates, setTemplates, loading, error, refetch }
}
