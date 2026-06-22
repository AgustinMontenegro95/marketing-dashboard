"use client"

import { X, Mail, Building2, Sparkles, MapPin, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type Chat } from "@/lib/api/chatbot"
import { useContactDetail } from "@/lib/hooks/use-chatbot"

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

interface Props {
  chat: Chat
  onClose: () => void
}

export function ChatContactPanel({ chat, onClose }: Props) {
  const { data: detail } = useContactDetail(chat.id)
  const color = getAvatarColor(chat.name)

  const noteCount = chat.messages.filter((m) => m.isNote).length
  const totalMessages = chat.messages.length

  return (
    <div className="w-64 shrink-0 border-l flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <span className="text-sm font-semibold">Contacto</span>
        <Button variant="ghost" size="icon" className="size-6 cursor-pointer" onClick={onClose}>
          <X className="size-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-2 px-4 py-5 border-b">
          <div className={cn("size-14 rounded-full flex items-center justify-center font-bold text-white text-lg", color)}>
            {getInitials(chat.name)}
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm">{chat.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{chat.phone}</p>
          </div>
        </div>

        {/* Details */}
        <div className="px-4 py-4 space-y-3 border-b">
          {detail?.email && (
            <div className="flex items-start gap-2.5">
              <Mail className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Email</p>
                <p className="text-xs mt-0.5 break-all">{detail.email}</p>
              </div>
            </div>
          )}
          {detail?.empresa && (
            <div className="flex items-start gap-2.5">
              <Building2 className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Empresa</p>
                <p className="text-xs mt-0.5">{detail.empresa}</p>
              </div>
            </div>
          )}
          {detail?.interes && (
            <div className="flex items-start gap-2.5">
              <Sparkles className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Interés</p>
                <p className="text-xs mt-0.5">{detail.interes}</p>
              </div>
            </div>
          )}
          {detail?.origen && (
            <div className="flex items-start gap-2.5">
              <MapPin className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Origen</p>
                <p className="text-xs mt-0.5">{detail.origen}</p>
              </div>
            </div>
          )}
          {detail?.primerContacto && (
            <div className="flex items-start gap-2.5">
              <Calendar className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Primer contacto</p>
                <p className="text-xs mt-0.5">{detail.primerContacto}</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="px-4 py-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/50 p-2.5 text-center">
            <p className="text-lg font-bold leading-none">{totalMessages}</p>
            <p className="text-[10px] text-muted-foreground mt-1">mensajes</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2.5 text-center">
            <p className="text-lg font-bold leading-none">{noteCount}</p>
            <p className="text-[10px] text-muted-foreground mt-1">notas</p>
          </div>
        </div>
      </div>
    </div>
  )
}
