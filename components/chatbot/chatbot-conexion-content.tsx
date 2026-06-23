"use client"

import { useState, useEffect, useRef } from "react"
import { Wifi, WifiOff, QrCode, RefreshCw, Smartphone, MessageSquare, Bot, ArrowLeft, Circle, Unplug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { chatbotApi, type ConnectionStatus } from "@/lib/api/chatbot"
import { useConnection } from "@/lib/hooks/use-chatbot"

type Status = ConnectionStatus

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso))
}

function StatusIndicator({ status }: { status: Status }) {
  const config = {
    connected: { label: "Conectado", color: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500 animate-pulse" },
    disconnected: { label: "Desconectado", color: "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700", dot: "bg-gray-400" },
    scanning: { label: "Esperando escaneo...", color: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800", dot: "bg-amber-500 animate-pulse" },
  }[status]

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 border", config.color)}>
      <Circle className={cn("size-1.5 fill-current", config.dot.includes("emerald") ? "text-emerald-500" : config.dot.includes("amber") ? "text-amber-500" : "text-gray-400")} />
      {config.label}
    </span>
  )
}

export function ChatbotConexionContent() {
  const { connection, setConnection } = useConnection()
  const [loading, setLoading] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const statusPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const qrRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoFetchedRef = useRef(false)

  const status: Status = connection?.status ?? "disconnected"

  function stopAllPolling() {
    if (statusPollRef.current) { clearInterval(statusPollRef.current); statusPollRef.current = null }
    if (qrRefreshRef.current) { clearInterval(qrRefreshRef.current); qrRefreshRef.current = null }
  }

  useEffect(() => {
    if (status === "connected") { stopAllPolling(); setQrCode(null) }
  }, [status])

  useEffect(() => () => stopAllPolling(), [])

  // Si el backend ya está en "scanning" al cargar la página (Baileys iniciando),
  // auto-llamar al POST para obtener el QR real sin que el usuario tenga que hacer nada
  useEffect(() => {
    if (connection?.status === "scanning" && !qrCode && !autoFetchedRef.current) {
      autoFetchedRef.current = true
      handleConnect()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection?.status])

  async function handleConnect() {
    autoFetchedRef.current = true
    setLoading(true)
    setQrCode(null)
    setConnection((prev) => prev ? { ...prev, status: "scanning" } : { status: "scanning", phone: "", name: "", connectedSince: "", messagesProcessed: 0, botActive: false })
    try {
      const res = await chatbotApi.connectWhatsApp()
      if (res.qrCode) setQrCode(res.qrCode)

      stopAllPolling()

      // Polling de status cada 3s: detectar cuando el usuario escaneó y se conectó
      statusPollRef.current = setInterval(async () => {
        try {
          const info = await chatbotApi.getConnection()
          if (info.status === "connected") {
            setConnection(info)
            toast.success("WhatsApp conectado exitosamente")
            stopAllPolling()
          }
        } catch { /* ignorar errores de polling */ }
      }, 3000)

      // Refresh del QR cada 18s: el QR vence en ~20s, POST /connect devuelve el nuevo
      qrRefreshRef.current = setInterval(async () => {
        try {
          const fresh = await chatbotApi.connectWhatsApp()
          if (fresh.qrCode) setQrCode(fresh.qrCode)
        } catch { /* ignorar errores de refresco */ }
      }, 18000)
    } catch {
      toast.error("No se pudo conectar WhatsApp")
      setConnection((prev) => prev ? { ...prev, status: "disconnected" } : null)
    } finally {
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    stopAllPolling()
    setQrCode(null)
    try {
      await chatbotApi.disconnectWhatsApp()
      setConnection((prev) => prev ? { ...prev, status: "disconnected" } : null)
      toast.info("WhatsApp desconectado")
    } catch {
      toast.error("No se pudo desconectar")
    }
  }

  async function handleReconnect() {
    await handleDisconnect()
    await handleConnect()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="size-7 -ml-1" asChild>
            <Link href="/chatbot"><ArrowLeft className="size-4" /></Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Conexión WhatsApp</h1>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground ml-8">Estado de la sesión de Baileys y gestión de la conexión</p>
      </div>

      {/* Status card */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "size-11 rounded-full flex items-center justify-center",
              status === "connected" ? "bg-emerald-100 dark:bg-emerald-950/40" :
              status === "scanning" ? "bg-amber-100 dark:bg-amber-950/40" : "bg-muted"
            )}>
              {status === "connected"
                ? <Wifi className="size-5 text-emerald-600 dark:text-emerald-400" />
                : status === "scanning"
                ? <QrCode className="size-5 text-amber-600 dark:text-amber-400" />
                : <WifiOff className="size-5 text-muted-foreground" />
              }
            </div>
            <div>
              <p className="font-semibold text-sm">Estado de la sesión</p>
              <StatusIndicator status={status} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status === "connected" && (
              <>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReconnect} disabled={loading}>
                  <RefreshCw className={cn("size-3.5", loading && "animate-spin")} /> Reconectar
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={handleDisconnect}>
                  <Unplug className="size-3.5" /> Desconectar
                </Button>
              </>
            )}
            {status === "disconnected" && (
              <Button size="sm" className="gap-1.5" onClick={handleConnect} disabled={loading}>
                <QrCode className="size-3.5" /> Conectar
              </Button>
            )}
            {status === "scanning" && (
              <Button variant="outline" size="sm" disabled>
                <RefreshCw className="size-3.5 animate-spin mr-1.5" /> Esperando...
              </Button>
            )}
          </div>
        </div>

        {/* Session info */}
        {status === "connected" && connection && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Número vinculado</p>
              <p className="text-sm font-medium">{connection.phone}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Nombre de cuenta</p>
              <p className="text-sm font-medium">{connection.name}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Conectado desde</p>
              <p className="text-sm font-medium">{formatDate(connection.connectedSince)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Mensajes procesados</p>
              <p className="text-sm font-medium">{connection.messagesProcessed.toLocaleString("es-AR")}</p>
            </div>
          </div>
        )}
      </div>

      {/* QR Panel */}
      {status === "scanning" && (
        <div className="rounded-lg border bg-card p-6 flex flex-col items-center gap-4">
          <div className="text-center space-y-1">
            <p className="font-semibold">Escaneá el código QR</p>
            <p className="text-sm text-muted-foreground">Abrí WhatsApp en tu teléfono → Dispositivos vinculados → Vincular dispositivo</p>
          </div>

          {qrCode ? (
            <img src={qrCode} alt="QR WhatsApp" className="size-48 rounded-xl border" />
          ) : (
            <div className="size-48 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <QrCode className="size-8 animate-pulse" />
                <p className="text-xs">Generando QR...</p>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            El QR expira en 60 segundos. <button className="underline cursor-pointer hover:text-foreground transition-colors" onClick={handleConnect}>Regenerar</button>
          </p>
        </div>
      )}

      {/* Disconnected state */}
      {status === "disconnected" && (
        <div className="rounded-lg border bg-card p-6 flex flex-col items-center gap-4 text-center">
          <div className="size-14 rounded-full bg-muted flex items-center justify-center">
            <WifiOff className="size-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">Sin conexión activa</p>
            <p className="text-sm text-muted-foreground mt-1">Conectá tu WhatsApp para que el bot pueda responder mensajes automáticamente</p>
          </div>
          <Button onClick={handleConnect} disabled={loading} className="gap-2">
            <QrCode className="size-4" /> Vincular WhatsApp
          </Button>
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="size-8 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
            <Smartphone className="size-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-sm font-medium">Baileys</p>
          <p className="text-xs text-muted-foreground">Conexión a WhatsApp Web mediante la librería Baileys (Node.js)</p>
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
            <MessageSquare className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm font-medium">Mensajes en tiempo real</p>
          <p className="text-xs text-muted-foreground">Los chats se sincronizan automáticamente cuando el backend está conectado</p>
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="size-8 rounded-lg bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
            <Bot className="size-4 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="text-sm font-medium">OpenAI</p>
          <p className="text-xs text-muted-foreground">El bot usa GPT para generar respuestas basadas en el prompt configurado</p>
        </div>
      </div>
    </div>
  )
}
