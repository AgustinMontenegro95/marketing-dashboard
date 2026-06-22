"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Bot, User, Send, Trash2, Info, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useChatbotConfig } from "@/lib/hooks/use-chatbot"
import Link from "next/link"
import { toast } from "sonner"

interface SimMsg {
  id: string
  role: "user" | "assistant"
  text: string
  tokens?: { input: number; output: number }
  ms?: number
}

// Mock response engine — context-aware replies based on keywords
function generateResponse(userMsg: string, history: SimMsg[], resolvedPrompt: string): { text: string; inputTokens: number; outputTokens: number } {
  const msg = userMsg.toLowerCase()
  const historyTokens = history.reduce((a, m) => a + (m.tokens ? m.tokens.input + m.tokens.output : 0), 0)
  const promptTokens = Math.round(resolvedPrompt.length / 4)
  const msgTokens = Math.round(userMsg.length / 4) + 8
  const inputTokens = promptTokens + historyTokens + msgTokens

  let text = ""

  if (msg.match(/hola|buenas|buen[ao]/)) {
    text = "¡Hola! Gracias por escribirnos. ¿En qué podemos ayudarte hoy? 😊"
  } else if (msg.match(/precio|costo|cuánto|cuanto|presupuesto/)) {
    text = "Nuestros servicios tienen distintos rangos de precio según el alcance. ¿Me podés contar un poco más sobre lo que necesitás? Así te paso los valores más exactos."
  } else if (msg.match(/diseño web|landing|página|pagina|sitio|tienda/)) {
    text = "¡Genial! Hacemos landing pages, sitios corporativos y tiendas online. Los plazos van de 5 a 20 días hábiles según el proyecto. ¿Querés que te contacte un asesor para contarte más detalles?"
  } else if (msg.match(/marketing|redes|instagram|tiktok|facebook|ads/)) {
    text = "Para gestión de redes y campañas tenemos planes que arrancan desde $80.000/mes. ¿Para qué plataformas necesitás el servicio?"
  } else if (msg.match(/logo|branding|marca|identidad/)) {
    text = "El diseño de marca incluye logo, paleta de colores, tipografías y manual de uso. El proceso toma entre 7 y 15 días hábiles con revisiones incluidas. ¿Tenés referencias de estilos que te gusten?"
  } else if (msg.match(/persona|humano|hablar|llamar|asesor/)) {
    text = "¡Claro! Te paso con uno de nuestros asesores. ¿Preferís que te llamemos o seguimos por WhatsApp? ¿Cuál es tu horario disponible?"
  } else if (msg.match(/gracias|genial|perfecto|excelente/)) {
    text = "¡De nada! Fue un placer ayudarte. Si tenés más preguntas, no dudes en escribirnos. ¡Hasta pronto! 👋"
  } else if (msg.match(/urgente|queja|problema|reclamo/)) {
    text = "Entiendo tu situación y lamento las molestias. Voy a derivarte inmediatamente con nuestro equipo de soporte para que te ayuden lo antes posible."
  } else {
    text = "Gracias por tu consulta. Para darte la mejor respuesta posible, ¿podrías contarme un poco más sobre lo que estás buscando? Así te oriento mejor."
  }

  const outputTokens = Math.round(text.length / 4) + 6
  return { text, inputTokens, outputTokens }
}

export function ChatbotSimuladorContent() {
  const { config } = useChatbotConfig()
  const [messages, setMessages] = useState<SimMsg[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [totalTokens, setTotalTokens] = useState({ input: 0, output: 0 })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const resolvedPrompt = config
    ? config.variables.reduce(
        (p, v) => p.replaceAll(`{{${v.key}}}`, v.value || `{{${v.key}}}`),
        config.prompt
      )
    : ""

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return
    const userMsg: SimMsg = { id: `u${Date.now()}`, role: "user", text: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    const delay = 800 + Math.random() * 1200
    const start = Date.now()

    await new Promise((r) => setTimeout(r, delay))

    const { text, inputTokens, outputTokens } = generateResponse(userMsg.text, messages, resolvedPrompt)
    const elapsed = Date.now() - start

    const botMsg: SimMsg = {
      id: `b${Date.now()}`,
      role: "assistant",
      text,
      tokens: { input: inputTokens, output: outputTokens },
      ms: elapsed,
    }

    setMessages((prev) => [...prev, botMsg])
    setTotalTokens((prev) => ({ input: prev.input + inputTokens, output: prev.output + outputTokens }))
    setLoading(false)
  }

  function handleClear() {
    setMessages([])
    setTotalTokens({ input: 0, output: 0 })
    toast.info("Conversación reiniciada")
  }

  const totalCost = (totalTokens.input * 0.15 / 1_000_000) + (totalTokens.output * 0.60 / 1_000_000)

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 120px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-7 -ml-1 cursor-pointer" asChild>
              <Link href="/chatbot"><ArrowLeft className="size-4" /></Link>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Simulador del Bot</h1>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground ml-8">Probá el prompt configurado sin conectar WhatsApp</p>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground border rounded-lg px-3 py-2 bg-card">
              <span><span className="font-semibold text-foreground">{(totalTokens.input + totalTokens.output).toLocaleString()}</span> tokens</span>
              <span className="text-border">·</span>
              <span><span className="font-semibold text-foreground">${totalCost.toFixed(5)}</span> USD est.</span>
            </div>
          )}
          <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer" onClick={handleClear} disabled={messages.length === 0}>
            <Trash2 className="size-3.5" /> Limpiar
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href="/chatbot/configuracion"><Zap className="size-3.5" />Editar prompt</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Chat */}
        <div className="flex-1 flex flex-col border rounded-lg overflow-hidden bg-background">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-muted/30">
            <div className="size-7 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
              <Bot className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-sm font-medium">Asistente virtual</span>
            <Badge variant="secondary" className="text-[10px] ml-auto">Simulación</Badge>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-muted/10">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="size-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Simulador listo</p>
                  <p className="text-xs text-muted-foreground mt-1">Escribí un mensaje para probar cómo responde el bot con el prompt actual</p>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="size-8 shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mt-0.5">
                    <Bot className="size-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm",
                  msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-background border rounded-tl-sm"
                )}>
                  <p className="leading-relaxed">{msg.text}</p>
                  {msg.role === "assistant" && msg.tokens && (
                    <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-border/50">
                      <span className="text-[10px] text-muted-foreground">{msg.tokens.input + msg.tokens.output} tok</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground">{msg.tokens.input} in / {msg.tokens.output} out</span>
                      {msg.ms && <span className="text-[10px] text-muted-foreground ml-auto">{msg.ms}ms</span>}
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="size-8 shrink-0 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center mt-0.5">
                    <User className="size-4 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="size-8 shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                  <Bot className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="bg-background border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: `${d}ms`, animationDuration: "900ms" }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 py-3 border-t bg-background flex gap-2">
            <Input
              placeholder="Escribí como si fueras un cliente..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              disabled={loading}
            />
            <Button size="icon" onClick={handleSend} disabled={!input.trim() || loading}>
              <Send className="size-4" />
            </Button>
          </div>
        </div>

        {/* Prompt panel */}
        <div className="w-72 shrink-0 flex flex-col gap-3">
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Info className="size-3.5 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prompt activo</p>
            </div>
            <p className="text-xs text-muted-foreground">Variables ya aplicadas · {Math.round(resolvedPrompt.length / 4)} tokens aprox.</p>
            <div className="max-h-48 overflow-y-auto">
              <pre className="text-[11px] leading-relaxed whitespace-pre-wrap text-muted-foreground">{resolvedPrompt}</pre>
            </div>
          </div>

          {messages.length > 0 && (
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Resumen de sesión</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Mensajes</span>
                  <span className="font-medium">{messages.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tokens input</span>
                  <span className="font-medium font-mono">{totalTokens.input.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tokens output</span>
                  <span className="font-medium font-mono">{totalTokens.output.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t">
                  <span className="text-muted-foreground">Costo estimado</span>
                  <span className="font-semibold font-mono">${totalCost.toFixed(5)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
