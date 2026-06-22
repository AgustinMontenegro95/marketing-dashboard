"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import {
  Bot, User, Search, Wifi, Settings2, Pause, Play, Send, MoreVertical,
  Circle, MessageCircle, UserCheck, BotMessageSquare, StickyNote,
  Zap, X, Download, BarChart2, UserRound, Archive, FlaskConical, AlertTriangle,
  Star, GitBranch, Ban,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { type Chat, type ChatMode } from "@/lib/api/chatbot"
import { chatbotApi } from "@/lib/api/chatbot"
import { useChats, useConnection, useTemplates } from "@/lib/hooks/use-chatbot"
import { ChatContactPanel } from "./chatbot-contact-panel"
import { useTokenDisplay } from "./use-token-display"
import Link from "next/link"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "sonner"

// ─── helpers ────────────────────────────────────────────────────────────────

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

function highlightText(text: string, query: string) {
  if (!query.trim()) return <>{text}</>
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded-sm px-0.5">{part}</mark>
          : part
      )}
    </>
  )
}

function exportChat(chat: Chat) {
  const lines: string[] = [
    `Conversación con ${chat.name} (${chat.phone})`,
    `Exportado el ${new Date().toLocaleString("es-AR")}`,
    "─".repeat(50),
    "",
  ]
  for (const msg of chat.messages) {
    if (msg.isNote) {
      lines.push(`[NOTA INTERNA - ${msg.timestamp}]`)
      lines.push(msg.text)
    } else {
      const quien = msg.role === "incoming" ? chat.name : msg.sentByBot ? "Bot" : "Agente"
      lines.push(`[${msg.timestamp}] ${quien}:`)
      lines.push(msg.text)
    }
    lines.push("")
  }
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `chat-${chat.name.replace(/\s+/g, "-").toLowerCase()}.txt`
  a.click()
  URL.revokeObjectURL(url)
  toast.success("Conversación exportada")
}

// ─── sub-components ──────────────────────────────────────────────────────────

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const color = getAvatarColor(name)
  const sizeClass = size === "sm" ? "size-8 text-xs" : size === "lg" ? "size-10 text-base" : "size-9 text-sm"
  return (
    <div className={cn("rounded-full flex items-center justify-center font-semibold text-white shrink-0", color, sizeClass)}>
      {getInitials(name)}
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="flex gap-2 justify-start">
      <div className="size-8 shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
        <Bot className="size-4 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="bg-background border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 150, 300].map((delay) => (
          <span key={delay} className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
            style={{ animationDelay: `${delay}ms`, animationDuration: "900ms" }} />
        ))}
      </div>
    </div>
  )
}

function ModeBadge({ mode }: { mode: ChatMode }) {
  return mode === "bot" ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-full px-1.5 py-0.5">
      <Bot className="size-2.5" /> Bot
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-full px-1.5 py-0.5">
      <User className="size-2.5" /> Humano
    </span>
  )
}

// ─── main ────────────────────────────────────────────────────────────────────

export function ChatbotPageContent() {
  const { chats, setChats, loading: chatsLoading } = useChats()
  const { connection, setConnection } = useConnection()
  const { templates } = useTemplates()
  const [selectedId, setSelectedId] = useState<string>("")
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"todos" | "sinleer" | "bot" | "humano">("todos")
  const [globalBotActive, setGlobalBotActive] = useState(false)

  useEffect(() => {
    if (chats.length > 0 && !selectedId) setSelectedId(chats[0]?.id ?? "")
  }, [chats, selectedId])

  useEffect(() => {
    if (connection) setGlobalBotActive(connection.botActive)
  }, [connection])
  const [inputText, setInputText] = useState("")
  const [typingChats, setTypingChats] = useState<Set<string>>(new Set())
  const [isNoteMode, setIsNoteMode] = useState(false)
  const [showContactPanel, setShowContactPanel] = useState(false)
  const [convSearch, setConvSearch] = useState("")
  const [showConvSearch, setShowConvSearch] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [csatOpen, setCsatOpen] = useState(false)
  const [csatForChatId, setCsatForChatId] = useState<string | null>(null)
  const [csatRating, setCsatRating] = useState(0)
  const [csatComment, setCsatComment] = useState("")
  const { showTokens } = useTokenDisplay()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const convSearchRef = useRef<HTMLInputElement>(null)

  const filteredChats = useMemo(() => {
    return chats.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
      const matchesFilter =
        filter === "todos" ? true :
        filter === "sinleer" ? c.unread > 0 :
        filter === "bot" ? c.mode === "bot" :
        c.mode === "human"
      return matchesSearch && matchesFilter
    })
  }, [chats, search, filter])

  const selectedChat = chats.find((c) => c.id === selectedId) ?? null

  const visibleMessages = useMemo(() => {
    if (!selectedChat) return []
    if (!convSearch.trim()) return selectedChat.messages
    const q = convSearch.toLowerCase()
    return selectedChat.messages.filter((m) => m.text.toLowerCase().includes(q))
  }, [selectedChat, convSearch])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedId, selectedChat?.messages.length, typingChats.size])

  useEffect(() => {
    if (showConvSearch) convSearchRef.current?.focus()
    else setConvSearch("")
  }, [showConvSearch])

  // reset note mode & search when changing chat
  useEffect(() => {
    setIsNoteMode(false)
    setShowConvSearch(false)
  }, [selectedId])

  const BOT_REPLIES: Record<string, string> = {
    "1": "¡Gracias por escribirnos! ¿Hay algo más en lo que pueda ayudarte?",
    "2": "¡Sí! Tenemos descuentos especiales para pymes. ¿Querés que te pase los detalles por aquí o preferís que un asesor te llame?",
    "3": "Perfecto, ya retomé la conversación. ¿Necesitás algo más de mi parte?",
    "4": "¡Hola! Somos una agencia de marketing y diseño. ¿En qué podemos ayudarte hoy?",
    "5": "Genial, ¿te gustaría que te enviemos ejemplos de trabajos anteriores?",
    "6": "¡Perfecto! Ya quedó anotado el llamado para mañana a las 10. Te confirmaremos por este medio. 👍",
  }

  function triggerBotTyping(chatId: string) {
    setTypingChats((prev) => new Set(prev).add(chatId))
    setTimeout(() => {
      setTypingChats((prev) => { const n = new Set(prev); n.delete(chatId); return n })
      const text = BOT_REPLIES[chatId] ?? "Entendido, retomo la conversación desde aquí."
      const newMsg = {
        id: `bot-${Date.now()}`,
        role: "outgoing" as const,
        text,
        timestamp: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
        sentByBot: true,
      }
      setChats((prev) => prev.map((c) =>
        c.id === chatId ? { ...c, messages: [...c.messages, newMsg], lastMessage: text, lastMessageTime: "Ahora" } : c
      ))
    }, 1800 + Math.random() * 1000)
  }

  async function toggleChatMode(chatId: string) {
    const chat = chats.find((c) => c.id === chatId)
    if (!chat) return
    const newMode: ChatMode = chat.mode === "bot" ? "human" : "bot"
    try {
      await chatbotApi.toggleMode(chatId, newMode)
      setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, mode: newMode } : c))
      toast.success(newMode === "human" ? `Tomaste control del chat con ${chat.name}` : `El bot retomó el chat con ${chat.name}`)
      if (newMode === "bot") triggerBotTyping(chatId)
    } catch {
      toast.error("No se pudo cambiar el modo del chat")
    }
  }

  async function handleSelectChat(id: string) {
    setSelectedId(id)
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)))
    try { await chatbotApi.markRead(id) } catch { /* silent */ }
  }

  const ALERT_KEYWORDS = ["urgente", "queja", "cancelar", "reclamo", "problema", "molesto", "enojado"]

  function checkAlert(text: string) {
    return ALERT_KEYWORDS.some((kw) => text.toLowerCase().includes(kw))
  }

  async function handleSend() {
    if (!inputText.trim() || !selectedChat) return
    const text = inputText.trim()
    setInputText("")
    try {
      const newMsg = await chatbotApi.sendMessage(selectedId, text, isNoteMode)
      setChats((prev) => prev.map((c) =>
        c.id === selectedId
          ? { ...c, messages: [...c.messages, newMsg], lastMessage: isNoteMode ? c.lastMessage : newMsg.text, lastMessageTime: isNoteMode ? c.lastMessageTime : "Ahora" }
          : c
      ))
      if (isNoteMode) toast.success("Nota interna guardada")
    } catch {
      toast.error("No se pudo enviar el mensaje")
      setInputText(text)
    }
  }

  function handleIncomingMessage(chatId: string, text: string) {
    const isAlert = checkAlert(text)
    const ts = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
    const newMsg = { id: `in${Date.now()}`, role: "incoming" as const, text, timestamp: ts }
    setChats((prev) => prev.map((c) =>
      c.id === chatId
        ? { ...c, messages: [...c.messages, newMsg], lastMessage: text, lastMessageTime: "Ahora", unread: c.unread + 1, hasAlert: isAlert || c.hasAlert }
        : c
    ))
    if (isAlert) toast.error("⚠️ Alerta: mensaje urgente en el chat", { duration: 4000 })
  }

  function openCsat(chatId: string) {
    setCsatForChatId(chatId)
    setCsatRating(0)
    setCsatComment("")
    setCsatOpen(true)
  }

  async function handleCsatSubmit() {
    if (!csatForChatId) return
    try {
      await chatbotApi.archiveChat(csatForChatId, csatRating > 0 ? csatRating : undefined, csatComment || undefined)
      setChats((prev) => prev.filter((c) => c.id !== csatForChatId))
      if (selectedId === csatForChatId) {
        const remaining = chats.filter((c) => c.id !== csatForChatId)
        setSelectedId(remaining[0]?.id ?? "")
      }
      setCsatOpen(false)
      const stars = csatRating > 0 ? ` · ${csatRating}★` : ""
      toast.success(`Chat archivado${stars}`)
    } catch {
      toast.error("No se pudo archivar el chat")
    }
  }

  const totalUnread = chats.reduce((acc, c) => acc + c.unread, 0)
  const totalBot = chats.filter((c) => c.mode === "bot").length
  const totalHuman = chats.filter((c) => c.mode === "human").length

  const FILTERS = [
    { key: "todos", label: "Todos", count: chats.length },
    { key: "sinleer", label: "Sin leer", count: chats.filter((c) => c.unread > 0).length },
    { key: "bot", label: "Bot", count: totalBot },
    { key: "humano", label: "Humano", count: totalHuman },
  ] as const

  const templatesByCategory = useMemo(() => {
    const map = new Map<string, typeof templates>()
    for (const t of templates) {
      if (!map.has(t.category)) map.set(t.category, [])
      map.get(t.category)!.push(t)
    }
    return map
  }, [templates])

  const canType = selectedChat && (selectedChat.mode === "human" || !globalBotActive || isNoteMode)

  return (
    <div className="flex flex-col h-full -mt-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Chatbot</h1>
            <span className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2 py-0.5 border",
              globalBotActive
                ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
                : "text-gray-500 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            )}>
              <Circle className={cn("size-1.5 fill-current", globalBotActive ? "text-emerald-500" : "text-gray-400")} />
              {globalBotActive ? "Bot activo" : "Bot pausado"}
            </span>
            {totalUnread > 0 && <Badge variant="destructive" className="h-5 px-1.5 text-xs">{totalUnread}</Badge>}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">WhatsApp · {chats.length} conversaciones</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5"
            onClick={async () => {
              const next = !globalBotActive
              try {
                await chatbotApi.toggleGlobalBot(next)
                setGlobalBotActive(next)
                setConnection((prev) => prev ? { ...prev, botActive: next } : null)
                toast.success(next ? "Bot activado globalmente" : "Bot pausado globalmente")
              } catch {
                toast.error("No se pudo cambiar el estado del bot")
              }
            }}>
            {globalBotActive ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            {globalBotActive ? "Pausar bot" : "Activar bot"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href="/chatbot/simulador"><FlaskConical className="size-3.5" />Simulador</Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href="/chatbot/archivados"><Archive className="size-3.5" />Archivados</Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href="/chatbot/analytics"><BarChart2 className="size-3.5" />Analytics</Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href="/chatbot/flujos"><GitBranch className="size-3.5" />Flujos</Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href="/chatbot/lista-negra"><Ban className="size-3.5" />Bloqueados</Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href="/chatbot/conexion"><Wifi className="size-3.5" />Conexión</Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href="/chatbot/configuracion"><Settings2 className="size-3.5" />Config</Link>
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3 pb-3">
        <div className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3">
          <div className="size-8 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
            <MessageCircle className="size-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Conversaciones</p>
            <p className="text-lg font-bold leading-none mt-0.5">{chats.length}</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3">
          <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
            <BotMessageSquare className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">En bot</p>
            <p className="text-lg font-bold leading-none mt-0.5">{totalBot}</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3">
          <div className="size-8 rounded-lg bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
            <UserCheck className="size-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">En humano</p>
            <p className="text-lg font-bold leading-none mt-0.5">{totalHuman}</p>
          </div>
        </div>
      </div>

      {/* Main panel */}
      <div className="flex flex-1 border rounded-lg overflow-hidden min-h-0" style={{ height: "calc(100vh - 300px)" }}>

        {/* Chat list */}
        <div className="w-72 shrink-0 border-r flex flex-col bg-background">
          <div className="p-3 space-y-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input placeholder="Buscar conversación..." className="pl-8 h-8 text-sm"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1">
              {FILTERS.map((f) => (
                <button key={f.key} onClick={() => setFilter(f.key)} className={cn(
                  "flex-1 text-[11px] font-medium rounded-md px-1.5 py-1 transition-colors cursor-pointer",
                  filter === f.key ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                  {f.label}
                  {f.count > 0 && <span className={cn("ml-1 tabular-nums", filter === f.key ? "opacity-75" : "")}>{f.count}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredChats.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Sin resultados</p>}
            {filteredChats.map((chat) => (
              <button key={chat.id} onClick={() => handleSelectChat(chat.id)} className={cn(
                "w-full flex items-start gap-3 px-3 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50 cursor-pointer",
                selectedId === chat.id && "bg-muted",
                chat.hasAlert && "border-l-2 border-l-red-500"
              )}>
                <div className="relative mt-0.5">
                  <Avatar name={chat.name} size="md" />
                  {chat.mode === "bot" && globalBotActive && (
                    <span className="absolute -bottom-0.5 -right-0.5 size-3 bg-emerald-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-medium truncate flex items-center gap-1">
                      {chat.hasAlert && <AlertTriangle className="size-3 text-red-500 shrink-0" />}
                      {chat.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{chat.lastMessageTime}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <span className={cn("text-xs truncate", typingChats.has(chat.id) ? "text-emerald-600 dark:text-emerald-400 italic" : "text-muted-foreground")}>
                      {typingChats.has(chat.id) ? "escribiendo..." : chat.lastMessage}
                    </span>
                    {chat.unread > 0 && <Badge className="h-4 px-1.5 text-[10px] bg-emerald-500 hover:bg-emerald-500 shrink-0">{chat.unread}</Badge>}
                  </div>
                  <div className="mt-1"><ModeBadge mode={chat.mode} /></div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Conversation */}
        {selectedChat ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat header */}
            <div className="px-4 py-3 border-b bg-background space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={selectedChat.name} size="lg" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{selectedChat.name}</span>
                      <ModeBadge mode={selectedChat.mode} />
                    </div>
                    <span className="text-xs text-muted-foreground">{selectedChat.phone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="icon" className={cn("size-7 cursor-pointer", showConvSearch && "bg-muted")}
                    onClick={() => setShowConvSearch((v) => !v)}>
                    <Search className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className={cn("size-7 cursor-pointer", showContactPanel && "bg-muted")}
                    onClick={() => setShowContactPanel((v) => !v)}>
                    <UserRound className="size-3.5" />
                  </Button>
                  <Button
                    variant={selectedChat.mode === "human" ? "default" : "outline"}
                    size="sm"
                    className={cn("gap-1.5 h-7 text-xs", selectedChat.mode === "human" && "bg-blue-600 hover:bg-blue-700")}
                    onClick={() => toggleChatMode(selectedChat.id)}
                  >
                    {selectedChat.mode === "bot" ? <><User className="size-3" /> Tomar control</> : <><Bot className="size-3" /> Ceder al bot</>}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7 cursor-pointer">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2 text-sm cursor-pointer" onClick={() => exportChat(selectedChat)}>
                        <Download className="size-3.5" /> Exportar conversación
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="gap-2 text-sm text-destructive focus:text-destructive cursor-pointer"
                        onClick={() => openCsat(selectedChat.id)}
                      >
                        <Archive className="size-3.5" /> Archivar chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Conversation search bar */}
              {showConvSearch && (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    ref={convSearchRef}
                    placeholder="Buscar en la conversación..."
                    className="pl-8 h-8 text-sm pr-8"
                    value={convSearch}
                    onChange={(e) => setConvSearch(e.target.value)}
                  />
                  {convSearch && (
                    <button onClick={() => setConvSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground">
                      <X className="size-3.5" />
                    </button>
                  )}
                  {convSearch && (
                    <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                      {visibleMessages.length} resultado{visibleMessages.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-muted/20">
              {convSearch && visibleMessages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Sin resultados para "{convSearch}"</p>
              )}
              {visibleMessages.map((msg) => {
                if (msg.isNote) {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="max-w-[80%] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                        <StickyNote className="size-3 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium mb-0.5">Nota interna · {msg.timestamp}</p>
                          <p>{highlightText(msg.text, convSearch)}</p>
                        </div>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={msg.id} className={cn("flex gap-2", msg.role === "outgoing" ? "justify-end" : "justify-start")}>
                    {msg.role === "incoming" && <Avatar name={selectedChat.name} size="sm" />}
                    <div className={cn(
                      "max-w-[70%] rounded-2xl px-3.5 py-2 text-sm",
                      msg.role === "outgoing" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-background border rounded-tl-sm"
                    )}>
                      <p className="leading-relaxed">{highlightText(msg.text, convSearch)}</p>
                      <div className={cn("flex items-center gap-1 mt-1", msg.role === "outgoing" ? "justify-end" : "justify-start")}>
                        <span className={cn("text-[10px]", msg.role === "outgoing" ? "text-primary-foreground/60" : "text-muted-foreground")}>
                          {msg.timestamp}
                        </span>
                        {msg.role === "outgoing" && msg.sentByBot !== undefined && (
                          <span className="text-[10px] flex items-center gap-0.5 text-primary-foreground/60">
                            · {msg.sentByBot ? <><Bot className="size-2.5 inline" /> bot</> : <><User className="size-2.5 inline" /> vos</>}
                          </span>
                        )}
                        {showTokens && msg.sentByBot && msg.tokens && (
                          <span className="text-[10px] text-primary-foreground/50 flex items-center gap-0.5 ml-0.5">
                            · {msg.tokens.input + msg.tokens.output} tok
                          </span>
                        )}
                      </div>
                    </div>
                    {msg.role === "outgoing" && (
                      <div className={cn("size-8 shrink-0 rounded-full flex items-center justify-center",
                        msg.sentByBot ? "bg-emerald-100 dark:bg-emerald-950/40" : "bg-blue-100 dark:bg-blue-950/40"
                      )}>
                        {msg.sentByBot
                          ? <Bot className="size-4 text-emerald-600 dark:text-emerald-400" />
                          : <User className="size-4 text-blue-600 dark:text-blue-400" />
                        }
                      </div>
                    )}
                  </div>
                )
              })}
              {typingChats.has(selectedChat.id) && <TypingBubble />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t bg-background space-y-2">
              {!canType ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2.5">
                  <Bot className="size-4 text-emerald-500 shrink-0" />
                  <span>El bot está manejando esta conversación. Tomá el control para escribir.</span>
                </div>
              ) : (
                <>
                  {/* Mode toggle + templates */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsNoteMode((v) => !v)}
                      className={cn(
                        "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer",
                        isNoteMode
                          ? "bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <StickyNote className="size-3" />
                      {isNoteMode ? "Nota interna" : "Nota interna"}
                    </button>
                  </div>

                  {/* Input row */}
                  <div className="flex items-center gap-2">
                    {/* Templates */}
                    <Popover open={templatesOpen} onOpenChange={setTemplatesOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="size-9 shrink-0 cursor-pointer">
                          <Zap className="size-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" side="top" className="w-80 p-0">
                        <div className="px-3 py-2 border-b">
                          <p className="text-sm font-semibold">Respuestas rápidas</p>
                          <p className="text-xs text-muted-foreground">Clic para insertar en el mensaje</p>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {Array.from(templatesByCategory.entries()).map(([cat, templates]) => (
                            <div key={cat}>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-1.5 bg-muted/40">{cat}</p>
                              {templates.map((t) => (
                                <button
                                  key={t.id}
                                  onClick={() => { setInputText(t.text); setTemplatesOpen(false) }}
                                  className="w-full text-left px-3 py-2 hover:bg-muted transition-colors cursor-pointer border-b border-border/50 last:border-0"
                                >
                                  <p className="text-xs font-medium">{t.label}</p>
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">{t.text}</p>
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Input
                      placeholder={isNoteMode ? "Escribí una nota interna (solo visible para el equipo)..." : "Escribí un mensaje..."}
                      className={cn("flex-1 transition-colors", isNoteMode && "border-amber-300 dark:border-amber-700 focus-visible:ring-amber-400")}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    />
                    <Button size="icon" onClick={handleSend} disabled={!inputText.trim()}
                      className={cn(isNoteMode && "bg-amber-500 hover:bg-amber-600 text-white")}>
                      {isNoteMode ? <StickyNote className="size-4" /> : <Send className="size-4" />}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <Bot className="size-10 mx-auto opacity-30" />
              <p className="text-sm">Seleccioná una conversación</p>
            </div>
          </div>
        )}

        {/* Contact panel */}
        {selectedChat && showContactPanel && (
          <ChatContactPanel chat={selectedChat} onClose={() => setShowContactPanel(false)} />
        )}
      </div>

      {/* CSAT modal */}
      {csatOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => { if (e.target === e.currentTarget) setCsatOpen(false) }}>
          <div className="bg-card rounded-xl border shadow-xl w-80 p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-base">Cerrar conversación</h3>
              <p className="text-sm text-muted-foreground mt-0.5">¿Cómo evaluás esta atención?</p>
            </div>
            <div className="flex gap-2 justify-center py-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setCsatRating(n)}
                  className="cursor-pointer transition-transform hover:scale-110"
                >
                  <Star className={cn(
                    "size-9 transition-colors",
                    n <= csatRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40 hover:text-amber-300"
                  )} />
                </button>
              ))}
            </div>
            {csatRating > 0 && (
              <p className="text-center text-sm text-muted-foreground -mt-1">
                {csatRating === 5 ? "Excelente" : csatRating === 4 ? "Muy bueno" : csatRating === 3 ? "Regular" : csatRating === 2 ? "Malo" : "Muy malo"}
              </p>
            )}
            <textarea
              placeholder="Nota opcional sobre la conversación..."
              value={csatComment}
              onChange={(e) => setCsatComment(e.target.value)}
              rows={2}
              className="w-full text-sm border rounded-md px-3 py-2 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setCsatOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1 cursor-pointer" onClick={handleCsatSubmit}>
                Archivar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
