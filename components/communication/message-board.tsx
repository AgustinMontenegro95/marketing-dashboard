"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { Message, Channel, TeamMember } from "./communication-types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Send, Pencil, Trash2, Plus, Loader2, HelpCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useSession } from "@/components/auth/session-provider"
import {
  getChannels, createChannel, updateChannel, deleteChannel,
  getMessages, sendMessage, markChannelRead,
} from "@/lib/comunicacion-api"

// ─── Colores ──────────────────────────────────────────────────────────────────

const COLOR_OPTIONS: Record<string, { dot: string; activeBg: string; text: string; label: string }> = {
  slate:   { dot: "bg-slate-400",   activeBg: "bg-slate-500/10",   text: "text-slate-500",   label: "Gris"    },
  red:     { dot: "bg-red-500",     activeBg: "bg-red-500/10",     text: "text-red-600",     label: "Rojo"    },
  orange:  { dot: "bg-orange-500",  activeBg: "bg-orange-500/10",  text: "text-orange-600",  label: "Naranja" },
  amber:   { dot: "bg-amber-400",   activeBg: "bg-amber-500/10",   text: "text-amber-600",   label: "Ámbar"   },
  emerald: { dot: "bg-emerald-500", activeBg: "bg-emerald-500/10", text: "text-emerald-600", label: "Verde"   },
  teal:    { dot: "bg-teal-500",    activeBg: "bg-teal-500/10",    text: "text-teal-600",    label: "Teal"    },
  blue:    { dot: "bg-blue-500",    activeBg: "bg-blue-500/10",    text: "text-blue-600",    label: "Azul"    },
  violet:  { dot: "bg-violet-500",  activeBg: "bg-violet-500/10",  text: "text-violet-600",  label: "Violeta" },
  pink:    { dot: "bg-pink-500",    activeBg: "bg-pink-500/10",    text: "text-pink-600",    label: "Rosa"    },
}

// ─── Utilidades ──────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getDateLabel(timestamp: string): string {
  const d = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (isSameDay(d, today)) return "Hoy"
  if (isSameDay(d, yesterday)) return "Ayer"
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "long" })
}

function formatMsgTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
}

type MessageGroup = { dateLabel: string; messages: Message[] }

function groupByDate(messages: Message[]): MessageGroup[] {
  const sorted = [...messages].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  const groups: MessageGroup[] = []
  for (const msg of sorted) {
    const label = getDateLabel(msg.timestamp)
    const last = groups.at(-1)
    if (last && last.dateLabel === label) { last.messages.push(msg) }
    else { groups.push({ dateLabel: label, messages: [msg] }) }
  }
  return groups
}

// ─── ChannelSheet ─────────────────────────────────────────────────────────────

type ChannelFormData = { id?: string; label: string; description: string; color: string; memberIds: string[] }

function ChannelSheet({
  open, onOpenChange, channel, teamMembers, onSave, onDelete,
}: {
  open: boolean; onOpenChange: (v: boolean) => void
  channel: Channel | null; teamMembers: TeamMember[]
  onSave: (cfg: ChannelFormData) => void
  onDelete?: (id: string) => void
}) {
  const isEdit = !!channel
  const [label, setLabel] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState("slate")
  const [memberIds, setMemberIds] = useState<string[]>([])
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (open) {
      setLabel(channel?.label ?? "")
      setDescription(channel?.description ?? "")
      setColor(channel?.color ?? "slate")
      setMemberIds(channel?.memberIds ?? [])
      setConfirmDelete(false)
    }
  }, [open, channel])

  function toggleMember(id: string) {
    setMemberIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  function handleSave() {
    if (!label.trim()) return
    onSave({ id: channel?.id, label: label.trim(), description: description.trim(), color, memberIds })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader className="pb-2">
          <SheetTitle>{isEdit ? "Editar canal" : "Nuevo canal"}</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {isEdit ? `Modificá la configuración de #${channel?.label}` : "Creá un nuevo canal para el equipo."}
          </p>
        </SheetHeader>

        <ScrollArea className="-mx-6 flex-1">
          <div className="px-6 py-3 space-y-6 pb-6">

            <section className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">General</p>
              <div className="space-y-2">
                <Label htmlFor="ch-label">Nombre *</Label>
                <Input id="ch-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ej: clientes, proyectos..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ch-desc">Descripción</Label>
                <Input id="ch-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="¿Para qué se usa este canal?" />
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Color</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(COLOR_OPTIONS).map(([key, val]) => (
                  <button key={key} type="button" title={val.label} onClick={() => setColor(key)}
                    className={cn("size-7 rounded-full transition-all", val.dot, color === key ? "ring-2 ring-offset-2 ring-foreground/40 scale-110" : "opacity-60 hover:opacity-100")}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Seleccionado: <span className="font-medium">{COLOR_OPTIONS[color]?.label}</span></p>
            </section>

            <Separator />

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Miembros</p>
                <span className="text-xs text-muted-foreground">{memberIds.length} seleccionados</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {teamMembers.map((m) => {
                  const selected = memberIds.includes(m.id)
                  return (
                    <button key={m.id} type="button" onClick={() => toggleMember(m.id)}
                      className={cn("flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors",
                        selected ? "border-foreground/30 bg-foreground/5 text-foreground" : "border-border text-muted-foreground hover:border-foreground/20"
                      )}>
                      <Avatar className="size-6 shrink-0">
                        <AvatarFallback className="text-[9px] font-semibold bg-foreground/10">{m.initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{m.name.split(" ")[0]}</p>
                        <p className="text-[10px] opacity-60 truncate">{m.role}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            {isEdit && onDelete && (
              <>
                <Separator />
                <section className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Zona de peligro</p>
                  {confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground flex-1">¿Eliminar este canal?</p>
                      <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => { onDelete(channel!.id); onOpenChange(false) }}>Confirmar</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="gap-1.5 text-red-500 border-red-500/30 hover:bg-red-500/10 hover:text-red-600" onClick={() => setConfirmDelete(true)}>
                      <Trash2 className="size-3.5" /> Eliminar canal
                    </Button>
                  )}
                </section>
              </>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!label.trim()}>{isEdit ? "Guardar cambios" : "Crear canal"}</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── MessageBoard ─────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 8000

export function MessageBoard({ teamMembers }: { teamMembers: TeamMember[] }) {
  const { context } = useSession()
  const currentUserName = context ? `${context.usuario.nombre} ${context.usuario.apellido}` : null

  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null)
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, Message[]>>({})
  const [loadingChannels, setLoadingChannels] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionAnchor, setMentionAnchor] = useState(0)

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lastMsgIdRef = useRef<Record<string, string>>({})
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Mount: cargar canales ─────────────────────────────────────────────────

  useEffect(() => {
    getChannels().then((chs) => {
      setChannels(chs)
      if (chs.length > 0) setActiveChannelId(chs[0].id)
      setLoadingChannels(false)
    })
  }, [])

  // ── Cambio de canal: cargar mensajes + marcar leído ───────────────────────

  useEffect(() => {
    if (!activeChannelId) return
    setLoadingMessages(true)
    getMessages(activeChannelId).then(({ messages }) => {
      setMessagesByChannel((prev) => {
        const existing = prev[activeChannelId] ?? []
        const existingIds = new Set(existing.map((m) => m.id))
        const merged = [...existing]
        for (const msg of messages) {
          if (!existingIds.has(msg.id)) merged.push(msg)
        }
        merged.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        return { ...prev, [activeChannelId]: merged }
      })
      if (messages.length > 0) lastMsgIdRef.current[activeChannelId] = messages[messages.length - 1].id
      setLoadingMessages(false)
      scrollToBottom("instant")
    })
    markChannelRead(activeChannelId)
    setChannels((prev) => prev.map((c) => c.id === activeChannelId ? { ...c, unreadCount: 0 } : c))
  }, [activeChannelId])

  // ── Polling de mensajes nuevos ────────────────────────────────────────────

  const pollMessages = useCallback(async () => {
    if (!activeChannelId) return
    const lastId = lastMsgIdRef.current[activeChannelId]
    if (!lastId) return
    const { messages: newMsgs } = await getMessages(activeChannelId, { after: lastId })
    if (newMsgs.length > 0) {
      setMessagesByChannel((prev) => {
        const existing = prev[activeChannelId] ?? []
        const existingIds = new Set(existing.map((m) => m.id))
        const toAdd = newMsgs.filter((m) => !existingIds.has(m.id))
        if (toAdd.length === 0) return prev
        return { ...prev, [activeChannelId]: [...existing, ...toAdd] }
      })
      lastMsgIdRef.current[activeChannelId] = newMsgs[newMsgs.length - 1].id
    }
  }, [activeChannelId])

  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(pollMessages, POLL_INTERVAL_MS)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [pollMessages])

  // ── Scroll ────────────────────────────────────────────────────────────────

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }

  const channelMessages = activeChannelId ? (messagesByChannel[activeChannelId] ?? []) : []
  const groups = groupByDate(channelMessages)

  useEffect(() => { scrollToBottom("smooth") }, [channelMessages.length])

  // ── Mention ───────────────────────────────────────────────────────────────

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setInput(val)
    const cursor = e.target.selectionStart ?? 0
    const match = val.slice(0, cursor).match(/@([^@\s]*)$/)
    if (match) { setMentionQuery(match[1]); setMentionAnchor(cursor - match[0].length) }
    else { setMentionQuery(null) }
  }

  function selectMention(name: string) {
    const before = input.slice(0, mentionAnchor)
    const after = input.slice(mentionAnchor + (mentionQuery?.length ?? 0) + 1)
    setInput(`${before}@${name} ${after}`)
    setMentionQuery(null)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const mentionResults = mentionQuery !== null
    ? teamMembers.filter((m) => m.name.toLowerCase().includes(mentionQuery.toLowerCase()) || m.initials.toLowerCase().includes(mentionQuery.toLowerCase()))
    : []

  // ── Enviar mensaje ────────────────────────────────────────────────────────

  async function handleSend() {
    if (!input.trim() || !activeChannelId || sending) return
    const content = input.trim()
    setInput("")
    setMentionQuery(null)
    setSending(true)
    const msg = await sendMessage(activeChannelId, content)
    if (msg) {
      setMessagesByChannel((prev) => {
        const existing = prev[activeChannelId] ?? []
        if (existing.some((m) => m.id === msg.id)) return prev
        return { ...prev, [activeChannelId]: [...existing, msg] }
      })
      lastMsgIdRef.current[activeChannelId] = msg.id
    }
    setSending(false)
  }

  // ── CRUD de canales ───────────────────────────────────────────────────────

  function openCreate() { setEditingChannel(null); setSheetOpen(true) }
  function openEdit(ch: Channel, e: React.MouseEvent) { e.stopPropagation(); setEditingChannel(ch); setSheetOpen(true) }

  async function handleSaveChannel(cfg: ChannelFormData) {
    if (cfg.id) {
      const updated = await updateChannel(cfg.id, cfg)
      if (updated) setChannels((prev) => prev.map((c) => c.id === cfg.id ? updated : c))
    } else {
      const created = await createChannel(cfg)
      if (created) setChannels((prev) => [...prev, created])
    }
  }

  async function handleDeleteChannel(id: string) {
    const ok = await deleteChannel(id)
    if (ok) {
      setChannels((prev) => prev.filter((c) => c.id !== id))
      if (activeChannelId === id) setActiveChannelId(channels.find((c) => c.id !== id)?.id ?? null)
    }
  }

  const activeChannel = channels.find((c) => c.id === activeChannelId)
  const color = activeChannel ? (COLOR_OPTIONS[activeChannel.color] ?? COLOR_OPTIONS.slate) : COLOR_OPTIONS.slate

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex border border-border/50 rounded-xl overflow-hidden h-[720px] bg-card">

        {/* ── Sidebar ── */}
        <aside className="w-44 shrink-0 border-r border-border/50 flex flex-col bg-muted/20">
          <div className="px-3 pt-4 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">Canales</p>
          </div>

          <nav className="flex flex-col gap-0.5 px-2 flex-1 overflow-y-auto">
            {loadingChannels ? (
              <div className="flex flex-col gap-1 px-1 pt-1">
                {[72, 56, 88, 64, 80].map((w) => (
                  <div key={w} className="flex items-center gap-2 px-2 py-1.5">
                    <Skeleton className="size-2 rounded-full shrink-0" />
                    <Skeleton className="h-3 rounded" style={{ width: w }} />
                  </div>
                ))}
              </div>
            ) : channels.map((ch) => {
              const isActive = ch.id === activeChannelId
              const c = COLOR_OPTIONS[ch.color] ?? COLOR_OPTIONS.slate
              return (
                <button key={ch.id} type="button" onClick={() => setActiveChannelId(ch.id)}
                  className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left transition-colors w-full",
                    isActive ? cn(c.activeBg, c.text, "font-medium") : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                  )}>
                  <span className={cn("size-2 rounded-full shrink-0", c.dot)} />
                  <span className="flex-1 truncate">{ch.label}</span>
                  {ch.unreadCount > 0 && (
                    <span className="text-[10px] font-mono tabular-nums bg-primary text-primary-foreground rounded-full px-1 min-w-[16px] text-center">
                      {ch.unreadCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="px-2 py-2 border-t border-border/50">
            <button type="button" onClick={openCreate}
              className="flex items-center gap-1.5 w-full rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors">
              <Plus className="size-3.5" /> Nuevo canal
            </button>
          </div>
        </aside>

        {/* ── Área principal ── */}
        <div className="flex flex-col flex-1 min-w-0">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {loadingChannels ? (
                <>
                  <Skeleton className="size-2.5 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-28 rounded" />
                </>
              ) : (
                <>
                  <span className={cn("size-2.5 rounded-full shrink-0", color.dot)} />
                  <span className="text-sm font-semibold truncate">{activeChannel?.label}</span>
                  {activeChannel?.description && (
                    <span className="text-xs text-muted-foreground truncate hidden sm:block">— {activeChannel.description}</span>
                  )}
                </>
              )}
            </div>

            {activeChannel && activeChannel.members.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex gap-1">
                  {activeChannel.members.slice(0, 6).map((m) => (
                    <Tooltip key={m.id}>
                      <TooltipTrigger asChild>
                        <div className="cursor-default">
                          <Avatar className="size-6">
                            <AvatarFallback className="bg-foreground/10 text-foreground text-[9px] font-semibold">{m.initials}</AvatarFallback>
                          </Avatar>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom"><p>{m.name}</p><p className="text-xs opacity-70">{m.role}</p></TooltipContent>
                    </Tooltip>
                  ))}
                  {activeChannel.members.length > 6 && (
                    <div className="size-6 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-[9px] text-muted-foreground font-semibold">+{activeChannel.members.length - 6}</span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {activeChannel.members.length} {activeChannel.members.length === 1 ? "miembro" : "miembros"}
                </span>
              </div>
            )}

            {activeChannel && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" onClick={(e) => openEdit(activeChannel, e)}
                    className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Pencil className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Editar canal</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" onClick={() => setHelpOpen(true)}
                  className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <HelpCircle className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Ayuda</TooltipContent>
            </Tooltip>
          </div>

          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
            {loadingChannels || loadingMessages ? (
              <div className="flex flex-col gap-5 pt-2">
                {/* mensaje ajeno */}
                <div className="flex items-end gap-2">
                  <Skeleton className="size-7 rounded-full shrink-0" />
                  <div className="flex flex-col gap-1.5 items-start">
                    <Skeleton className="h-2.5 w-20 rounded" />
                    <Skeleton className="h-9 w-56 rounded-2xl rounded-bl-sm" />
                    <Skeleton className="h-2 w-10 rounded" />
                  </div>
                </div>
                {/* mensaje propio */}
                <div className="flex items-end gap-2 justify-end">
                  <div className="flex flex-col gap-1.5 items-end">
                    <Skeleton className="h-9 w-44 rounded-2xl rounded-br-sm" />
                    <Skeleton className="h-2 w-10 rounded" />
                  </div>
                </div>
                {/* mensaje ajeno largo */}
                <div className="flex items-end gap-2">
                  <Skeleton className="size-7 rounded-full shrink-0" />
                  <div className="flex flex-col gap-1.5 items-start">
                    <Skeleton className="h-2.5 w-24 rounded" />
                    <Skeleton className="h-14 w-64 rounded-2xl rounded-bl-sm" />
                    <Skeleton className="h-2 w-10 rounded" />
                  </div>
                </div>
                {/* mensaje propio corto */}
                <div className="flex items-end gap-2 justify-end">
                  <div className="flex flex-col gap-1.5 items-end">
                    <Skeleton className="h-9 w-32 rounded-2xl rounded-br-sm" />
                    <Skeleton className="h-2 w-10 rounded" />
                  </div>
                </div>
              </div>
            ) : groups.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No hay mensajes en este canal todavía.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {groups.map((group) => (
                  <div key={group.dateLabel}>
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-border/50" />
                      <span className="text-[11px] text-muted-foreground font-medium shrink-0 select-none">{group.dateLabel}</span>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>
                    <div className="flex flex-col gap-3">
                      {group.messages.map((msg) => {
                        const isMe = !!currentUserName && msg.author.name === currentUserName
                        return (
                          <div key={msg.id} className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                            {!isMe && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="relative shrink-0 cursor-default">
                                    <Avatar className="size-7">
                                      <AvatarFallback className="bg-foreground/10 text-foreground text-[10px] font-semibold">{msg.author.initials}</AvatarFallback>
                                    </Avatar>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="right"><p>{msg.author.name}</p><p className="text-xs opacity-70">{msg.author.role}</p></TooltipContent>
                              </Tooltip>
                            )}
                            <div className={cn("flex flex-col max-w-[72%]", isMe ? "items-end" : "items-start")}>
                              {!isMe && (
                                <div className="flex items-baseline gap-1.5 mb-1 px-1">
                                  <span className="text-xs font-semibold">{msg.author.name}</span>
                                  <span className="text-[10px] text-muted-foreground">{msg.author.role}</span>
                                </div>
                              )}
                              <div className={cn("px-3 py-2 text-sm leading-relaxed break-words",
                                isMe ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm" : "bg-muted text-foreground rounded-2xl rounded-bl-sm"
                              )}>
                                {msg.content}
                              </div>
                              <span className="text-[10px] text-muted-foreground mt-1 px-1 tabular-nums flex items-center gap-1">
                                {formatMsgTime(msg.timestamp)}
                                {isMe && (
                                  <span className="inline-flex items-center text-muted-foreground/60">
                                    <span className="text-[11px] leading-none">✓</span>
                                    <span className="text-[11px] leading-none -ml-[5px]">✓</span>
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-4 pb-4 pt-2 border-t border-border/50 shrink-0">
            {mentionQuery !== null && mentionResults.length > 0 && (
              <div className="mb-2 rounded-lg border border-border bg-popover shadow-md overflow-hidden">
                {mentionResults.map((m) => (
                  <button key={m.id} type="button" onMouseDown={(e) => { e.preventDefault(); selectMention(m.name) }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors">
                    <Avatar className="size-6 shrink-0">
                      <AvatarFallback className="bg-foreground/10 text-foreground text-[9px] font-semibold">{m.initials}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{m.name}</span>
                    <span className="text-xs text-muted-foreground">{m.role}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <Textarea ref={textareaRef} placeholder={`Mensaje en #${activeChannel?.label.toLowerCase() ?? "canal"}...`}
                value={input} rows={2} className="resize-none flex-1 text-sm" onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Escape") { setMentionQuery(null); return }
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
                }}
              />
              <Button size="icon" onClick={handleSend} disabled={!input.trim() || sending} className="shrink-0">
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                <span className="sr-only">Enviar</span>
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">Enter para enviar · Shift+Enter para nueva línea</p>
          </div>
        </div>
      </div>

      <Sheet open={helpOpen} onOpenChange={setHelpOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
          <SheetHeader className="pb-2">
            <SheetTitle>¿Cómo funciona esta sección?</SheetTitle>
            <p className="text-sm text-muted-foreground">Guía rápida de mensajes</p>
          </SheetHeader>
          <ScrollArea className="-mx-6 flex-1">
            <div className="px-6 py-3 space-y-5 pb-6 text-sm text-muted-foreground text-justify">
              <div className="space-y-1.5">
                <p className="font-semibold text-foreground">📢 Canales</p>
                <p>Los canales organizan la comunicación por tema, proyecto o área. Cada canal tiene un nombre, descripción, color identificador y miembros asignados. Podés crear nuevos canales con el botón <span className="font-medium text-foreground">+ Nuevo canal</span> en el panel izquierdo.</p>
              </div>
              <Separator />
              <div className="space-y-1.5">
                <p className="font-semibold text-foreground">✏️ Editar y eliminar canales</p>
                <p>Hacé click en el ícono de lápiz en el encabezado del canal activo para editar su nombre, descripción, color o miembros. Desde ahí también podés eliminarlo. Esta acción es irreversible.</p>
              </div>
              <Separator />
              <div className="space-y-1.5">
                <p className="font-semibold text-foreground">💬 Enviar mensajes</p>
                <p>Escribí en el campo de texto y presioná <span className="font-medium text-foreground">Enter</span> para enviar. Usá <span className="font-medium text-foreground">Shift + Enter</span> para insertar un salto de línea sin enviar.</p>
              </div>
              <Separator />
              <div className="space-y-1.5">
                <p className="font-semibold text-foreground">@ Menciones</p>
                <p>Escribí <span className="font-mono text-xs bg-muted px-1 rounded">@</span> seguido del nombre de un miembro para mencionarlo en el mensaje. Aparecerá un listado de sugerencias para seleccionar.</p>
              </div>
              <Separator />
              <div className="space-y-1.5">
                <p className="font-semibold text-foreground">🔴 Mensajes no leídos</p>
                <p>Los canales con mensajes nuevos muestran un contador en rojo. Al abrir el canal, los mensajes se marcan automáticamente como leídos.</p>
              </div>
              <Separator />
              <div className="space-y-1.5">
                <p className="font-semibold text-foreground">🔄 Actualización automática</p>
                <p>Los mensajes nuevos se cargan automáticamente cada pocos segundos sin necesidad de recargar la página.</p>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <ChannelSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        channel={editingChannel}
        teamMembers={teamMembers}
        onSave={handleSaveChannel}
        onDelete={handleDeleteChannel}
      />
    </TooltipProvider>
  )
}
