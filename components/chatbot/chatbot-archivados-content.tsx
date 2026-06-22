"use client"

import { useState, useMemo, useEffect } from "react"
import { ArrowLeft, Search, Bot, User, ArchiveRestore, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { type Chat } from "@/lib/api/chatbot"
import { useArchivedChats } from "@/lib/hooks/use-chatbot"
import Link from "next/link"
import { toast } from "sonner"
import { chatbotApi } from "@/lib/api/chatbot"

const AVATAR_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-orange-500",
  "bg-pink-500", "bg-cyan-500", "bg-amber-500", "bg-indigo-500",
]

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? "bg-gray-500"
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const color = getAvatarColor(name)
  return (
    <div className={cn("rounded-full flex items-center justify-center font-semibold text-white shrink-0",
      color, size === "sm" ? "size-8 text-xs" : "size-10 text-sm"
    )}>
      {getInitials(name)}
    </div>
  )
}

export function ChatbotArchivadosContent() {
  const { data: archivedData, loading } = useArchivedChats()
  const [archived, setArchived] = useState<Chat[]>([])
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (archivedData) {
      setArchived(archivedData)
      if (!selectedId && archivedData.length > 0) setSelectedId(archivedData[0]?.id ?? null)
    }
  }, [archivedData, selectedId])

  const filtered = useMemo(() =>
    archived.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.messages.some((m) => m.text.toLowerCase().includes(search.toLowerCase()))
    ),
    [archived, search]
  )

  const selected = archived.find((c) => c.id === selectedId) ?? null

  async function handleRestore(chat: Chat) {
    try {
      await chatbotApi.restoreChat(chat.id)
      setArchived((prev) => prev.filter((c) => c.id !== chat.id))
      if (selectedId === chat.id) setSelectedId(archived.find((c) => c.id !== chat.id)?.id ?? null)
      toast.success(`Chat con ${chat.name} restaurado`)
    } catch {
      toast.error("No se pudo restaurar el chat")
    }
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 120px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-7 -ml-1 cursor-pointer" asChild>
              <Link href="/chatbot"><ArrowLeft className="size-4" /></Link>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Chats archivados</h1>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground ml-8">{archived.length} conversaciones cerradas</p>
        </div>
      </div>

      {archived.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <MessageCircle className="size-10 opacity-30" />
          <p className="text-sm">No hay chats archivados</p>
          <Button variant="outline" size="sm" asChild><Link href="/chatbot">Volver a chats</Link></Button>
        </div>
      ) : (
        <div className="flex flex-1 border rounded-lg overflow-hidden min-h-0">
          {/* List */}
          <div className="w-72 shrink-0 border-r flex flex-col bg-background">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar en archivados..."
                  className="pl-8 h-8 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Sin resultados</p>}
              {filtered.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedId(chat.id)}
                  className={cn(
                    "w-full flex items-start gap-3 px-3 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50 cursor-pointer",
                    selectedId === chat.id && "bg-muted"
                  )}
                >
                  <Avatar name={chat.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-medium truncate">{chat.name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{chat.lastMessageTime}</span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate block mt-0.5">{chat.lastMessage}</span>
                    <div className="flex items-center gap-1 mt-1">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-1.5 py-0.5 border",
                        chat.mode === "bot"
                          ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
                          : "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800"
                      )}>
                        {chat.mode === "bot" ? <><Bot className="size-2.5" />Bot</> : <><User className="size-2.5" />Humano</>}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{chat.messages.length} msgs</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Conversation */}
          {selected ? (
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-background">
                <div className="flex items-center gap-3">
                  <Avatar name={selected.name} />
                  <div>
                    <p className="font-semibold text-sm">{selected.name}</p>
                    <p className="text-xs text-muted-foreground">{selected.phone} · {selected.lastMessageTime}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 cursor-pointer"
                  onClick={() => handleRestore(selected)}
                >
                  <ArchiveRestore className="size-3.5" /> Restaurar chat
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-muted/20">
                {selected.messages.map((msg) => {
                  if (msg.isNote) {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <div className="max-w-[80%] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                          <span className="font-medium">Nota interna · {msg.timestamp}</span>
                          <p className="mt-0.5">{msg.text}</p>
                        </div>
                      </div>
                    )
                  }
                  return (
                    <div key={msg.id} className={cn("flex gap-2", msg.role === "outgoing" ? "justify-end" : "justify-start")}>
                      {msg.role === "incoming" && <Avatar name={selected.name} size="sm" />}
                      <div className={cn(
                        "max-w-[70%] rounded-2xl px-3.5 py-2 text-sm",
                        msg.role === "outgoing" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-background border rounded-tl-sm"
                      )}>
                        <p className="leading-relaxed">{msg.text}</p>
                        <p className={cn("text-[10px] mt-1", msg.role === "outgoing" ? "text-primary-foreground/60" : "text-muted-foreground")}>
                          {msg.timestamp}{msg.sentByBot !== undefined && ` · ${msg.sentByBot ? "bot" : "agente"}`}
                        </p>
                      </div>
                      {msg.role === "outgoing" && (
                        <div className={cn("size-8 shrink-0 rounded-full flex items-center justify-center",
                          msg.sentByBot ? "bg-emerald-100 dark:bg-emerald-950/40" : "bg-blue-100 dark:bg-blue-950/40"
                        )}>
                          {msg.sentByBot ? <Bot className="size-4 text-emerald-600 dark:text-emerald-400" /> : <User className="size-4 text-blue-600 dark:text-blue-400" />}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="px-4 py-3 border-t bg-background">
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2.5">
                  <MessageCircle className="size-4 shrink-0" />
                  <span>Conversación archivada. Restaurala para poder responder.</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p className="text-sm">Seleccioná una conversación</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
