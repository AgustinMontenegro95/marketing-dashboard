"use client"

import { useState } from "react"
import {
  Bot, Save, RotateCcw, ChevronDown, ChevronUp, Info,
  Hash, AlertTriangle, Clock, Variable, ArrowLeft,
} from "lucide-react"
import { useTokenDisplay } from "./use-token-display"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { type DaySchedule } from "@/lib/api/chatbot"
import { useChatbotConfig } from "@/lib/hooks/use-chatbot"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"

const MODELS = [
  { value: "gpt-4o", label: "GPT-4o", description: "Más inteligente, más lento" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Equilibrado (recomendado)" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", description: "Rápido y económico" },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2">{children}</p>
}

export function ChatbotConfigContent() {
  const { showTokens, toggle: toggleTokens } = useTokenDisplay()
  const { config, update, save, reset, isDirty, saving, loading } = useChatbotConfig()

  const [newKeyword, setNewKeyword] = useState("")
  const [newAlertKw, setNewAlertKw] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)

  async function handleSave() {
    try {
      await save()
      toast.success("Configuración guardada")
    } catch {
      toast.error("No se pudo guardar la configuración")
    }
  }

  function handleReset() {
    reset()
    toast.info("Configuración restaurada")
  }

  function addKw(list: string[], field: "keywords" | "alertKeywords", val: string, setVal: (v: string) => void) {
    const kw = val.trim().toLowerCase()
    if (!kw || list.includes(kw)) return
    update({ [field]: [...list, kw] }); setVal("")
  }
  function removeKw(list: string[], field: "keywords" | "alertKeywords", kw: string) {
    update({ [field]: list.filter((k) => k !== kw) })
  }

  function updateVariable(key: string, value: string) {
    if (!config) return
    update({ variables: config.variables.map((v) => v.key === key ? { ...v, value } : v) })
  }

  function updateSchedule(day: string, field: keyof DaySchedule, value: string | boolean) {
    if (!config) return
    update({ schedule: config.schedule.map((d) => d.day === day ? { ...d, [field]: value } : d) })
  }

  if (loading || !config) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => <div key={i} className="rounded-lg border bg-muted h-20" />)}
      </div>
    )
  }

  const { botActive, model, prompt, variables, keywords, alertKeywords, schedule, outsideHoursMsg, temperature, maxTokens } = config
  const resolvedPrompt = variables.reduce((p, v) => p.replaceAll(`{{${v.key}}}`, v.value || `{{${v.key}}}`), prompt)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-7 -ml-1 cursor-pointer" asChild>
              <Link href="/chatbot"><ArrowLeft className="size-4" /></Link>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Configuración del Bot</h1>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground ml-8">Personalizá el comportamiento y el prompt del asistente</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer" onClick={handleReset}>
            <RotateCcw className="size-3.5" /> Restaurar
          </Button>
          <Button size="sm" className="gap-1.5 cursor-pointer" onClick={handleSave} disabled={!isDirty || saving}>
            <Save className="size-3.5" /> {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      {/* ── GENERAL ── */}
      <SectionLabel>General</SectionLabel>

      <div className="flex items-center justify-between rounded-lg border p-4 bg-card">
        <div className="flex items-center gap-3">
          <div className={cn("size-9 rounded-full flex items-center justify-center", botActive ? "bg-emerald-100 dark:bg-emerald-950/40" : "bg-muted")}>
            <Bot className={cn("size-5", botActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")} />
          </div>
          <div>
            <p className="text-sm font-medium">Bot global</p>
            <p className="text-xs text-muted-foreground">{botActive ? "Respondiendo activamente a todos los chats" : "Pausado — nadie recibe respuestas automáticas"}</p>
          </div>
        </div>
        <Switch checked={botActive} onCheckedChange={(v) => { update({ botActive: v }); toast.success(v ? "Bot activado" : "Bot pausado") }} />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4 bg-card">
        <div className="flex items-center gap-3">
          <div className={cn("size-9 rounded-full flex items-center justify-center", showTokens ? "bg-violet-100 dark:bg-violet-950/40" : "bg-muted")}>
            <Hash className={cn("size-5", showTokens ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground")} />
          </div>
          <div>
            <p className="text-sm font-medium">Mostrar tokens por mensaje</p>
            <p className="text-xs text-muted-foreground">{showTokens ? "Visible en cada respuesta del bot" : "Oculto — solo visible en Analytics"}</p>
          </div>
        </div>
        <Switch checked={showTokens} onCheckedChange={toggleTokens} />
      </div>

      {/* ── PROMPT & MODELO ── */}
      <SectionLabel>Prompt & Modelo</SectionLabel>

      <div className="space-y-3 rounded-lg border p-4 bg-card">
        <Label className="text-sm font-semibold">Modelo de IA</Label>
        <Select value={model} onValueChange={(v) => update({ model: v })}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MODELS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                <span>{m.label}</span>
                <span className="ml-2 text-xs text-muted-foreground">{m.description}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="size-3 shrink-0" /> {MODELS.find((m) => m.value === model)?.description}
        </p>
      </div>

      <div className="space-y-3 rounded-lg border p-4 bg-card">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">System Prompt</Label>
          <span className="text-xs text-muted-foreground">{prompt.length} caracteres</span>
        </div>
        <Textarea
          value={prompt}
          onChange={(e) => update({ prompt: e.target.value })}
          className="min-h-56 font-mono text-xs leading-relaxed resize-y"
          placeholder="Escribí las instrucciones del bot..."
        />
        <p className="text-xs text-muted-foreground">
          Usá <code className="bg-muted px-1 rounded text-[11px]">{"{{variable}}"}</code> para insertar valores dinámicos definidos abajo.
        </p>
      </div>

      {/* Variables */}
      <div className="space-y-3 rounded-lg border p-4 bg-card">
        <div className="flex items-center gap-2">
          <Variable className="size-4 text-muted-foreground" />
          <Label className="text-sm font-semibold">Variables del prompt</Label>
        </div>
        <p className="text-xs text-muted-foreground">Se reemplazan en el prompt antes de enviarlo a OpenAI y en el Simulador.</p>
        <div className="space-y-2">
          {variables.map((v) => (
            <div key={v.key} className="flex items-center gap-2">
              <code className="text-[11px] bg-muted px-2 py-1 rounded shrink-0 w-40 truncate">{`{{${v.key}}}`}</code>
              <Input
                value={v.value}
                placeholder={v.placeholder}
                className="h-8 text-sm flex-1"
                onChange={(e) => updateVariable(v.key, e.target.value)}
              />
            </div>
          ))}
        </div>
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">Ver prompt con variables aplicadas</summary>
          <pre className="mt-2 p-3 bg-muted rounded text-[11px] whitespace-pre-wrap leading-relaxed overflow-x-auto">{resolvedPrompt}</pre>
        </details>
      </div>

      {/* ── COMPORTAMIENTO ── */}
      <SectionLabel>Comportamiento</SectionLabel>

      <div className="space-y-3 rounded-lg border p-4 bg-card">
        <div>
          <Label className="text-sm font-semibold">Palabras clave para derivar al humano</Label>
          <p className="text-xs text-muted-foreground mt-0.5">El bot pausa y notifica al equipo</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((kw) => (
            <Badge key={kw} variant="secondary" className="gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-xs" onClick={() => removeKw(keywords, "keywords", kw)}>
              {kw} ×
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="agregar frase..." className="h-8 text-sm" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addKw(keywords, "keywords", newKeyword, setNewKeyword) }} />
          <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => addKw(keywords, "keywords", newKeyword, setNewKeyword)}>Agregar</Button>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border p-4 bg-card">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-red-500" />
          <div>
            <Label className="text-sm font-semibold">Alertas de urgencia</Label>
            <p className="text-xs text-muted-foreground mt-0.5">El chat se marca en rojo en la lista cuando el cliente escribe alguna de estas palabras</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {alertKeywords.map((kw) => (
            <Badge key={kw} className="gap-1 cursor-pointer bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-200 transition-colors text-xs" onClick={() => removeKw(alertKeywords, "alertKeywords", kw)}>
              {kw} ×
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="agregar palabra de alerta..." className="h-8 text-sm" value={newAlertKw} onChange={(e) => setNewAlertKw(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addKw(alertKeywords, "alertKeywords", newAlertKw, setNewAlertKw) }} />
          <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => addKw(alertKeywords, "alertKeywords", newAlertKw, setNewAlertKw)}>Agregar</Button>
        </div>
      </div>

      {/* ── HORARIO ── */}
      <SectionLabel>Horario de atención</SectionLabel>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          <Label className="text-sm font-semibold">Horario del bot por día</Label>
        </div>
        <div className="divide-y">
          {schedule.map((d) => (
            <div key={d.day} className={cn("flex items-center gap-3 px-4 py-3 transition-colors", !d.active && "bg-muted/30")}>
              <Switch
                checked={d.active}
                onCheckedChange={(v) => updateSchedule(d.day, "active", v)}
              />
              <span className={cn("text-sm w-24 font-medium", !d.active && "text-muted-foreground")}>{d.label}</span>
              {d.active ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input type="time" value={d.from} onChange={(e) => updateSchedule(d.day, "from", e.target.value)} className="h-7 text-xs w-28" />
                  <span className="text-xs text-muted-foreground">a</span>
                  <Input type="time" value={d.to} onChange={(e) => updateSchedule(d.day, "to", e.target.value)} className="h-7 text-xs w-28" />
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">Inactivo</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-lg border p-4 bg-card">
        <Label className="text-sm font-semibold">Mensaje fuera de horario</Label>
        <Textarea
          value={outsideHoursMsg}
          onChange={(e) => update({ outsideHoursMsg: e.target.value })}
          className="text-sm resize-none"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">El bot responde este mensaje automáticamente cuando recibe mensajes fuera del horario configurado.</p>
      </div>

      {/* ── AVANZADO ── */}
      <div className="rounded-lg border bg-card">
        <button className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold cursor-pointer hover:bg-muted/50 transition-colors rounded-lg" onClick={() => setShowAdvanced((v) => !v)}>
          <span>Configuración avanzada</span>
          {showAdvanced ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </button>
        {showAdvanced && (
          <div className="px-4 pb-4 space-y-5 border-t pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Temperatura</Label>
                <span className="text-sm font-mono text-muted-foreground">{temperature.toFixed(1)}</span>
              </div>
              <Slider min={0} max={1} step={0.1} value={[temperature]} onValueChange={([v]) => update({ temperature: v ?? 0.7 })} />
              <div className="flex justify-between text-xs text-muted-foreground"><span>Preciso (0)</span><span>Creativo (1)</span></div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Máximo de tokens por respuesta</Label>
                <span className="text-sm font-mono text-muted-foreground">{maxTokens}</span>
              </div>
              <Slider min={100} max={2000} step={50} value={[maxTokens]} onValueChange={([v]) => update({ maxTokens: v ?? 500 })} />
              <div className="flex justify-between text-xs text-muted-foreground"><span>100</span><span>2000</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
