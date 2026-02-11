"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  FolderKanban,
  Users,
  CreditCard,
  AlertTriangle,
  Info,
  Mail,
  Bell,
  Smartphone,
} from "lucide-react"

type NotifPref = {
  id: string
  label: string
  description: string
  icon: React.ElementType
  email: boolean
  push: boolean
  inApp: boolean
}

const initialPrefs: NotifPref[] = [
  {
    id: "projects",
    label: "Proyectos",
    description: "Asignaciones, actualizaciones y entregas",
    icon: FolderKanban,
    email: true,
    push: true,
    inApp: true,
  },
  {
    id: "team",
    label: "Equipo",
    description: "Nuevos miembros, reuniones y actividad",
    icon: Users,
    email: true,
    push: false,
    inApp: true,
  },
  {
    id: "finance",
    label: "Finanzas",
    description: "Pagos, facturas y reportes financieros",
    icon: CreditCard,
    email: true,
    push: true,
    inApp: true,
  },
  {
    id: "alerts",
    label: "Alertas",
    description: "Deadlines, urgencias y advertencias",
    icon: AlertTriangle,
    email: true,
    push: true,
    inApp: true,
  },
  {
    id: "general",
    label: "General",
    description: "Actualizaciones del sistema y noticias",
    icon: Info,
    email: false,
    push: false,
    inApp: true,
  },
]

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotifPref[]>(initialPrefs)

  const updatePref = (id: string, channel: "email" | "push" | "inApp", value: boolean) => {
    setPrefs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [channel]: value } : p))
    )
  }

  const handleSave = () => {
    toast.success("Preferencias guardadas correctamente")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Canales de notificacion</CardTitle>
          <CardDescription>
            Elige como quieres recibir las notificaciones para cada categoria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Channel headers */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_80px_80px_80px] items-center gap-4 px-4 pb-2 border-b border-border">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Categoria
            </span>
            <div className="flex flex-col items-center gap-1">
              <Mail className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Email</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Smartphone className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Push</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Bell className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">App</span>
            </div>
          </div>

          {prefs.map((pref) => {
            const Icon = pref.icon
            return (
              <div
                key={pref.id}
                className="flex flex-col sm:grid sm:grid-cols-[1fr_80px_80px_80px] items-start sm:items-center gap-4 px-4 py-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-foreground">{pref.label}</Label>
                    <p className="text-xs text-muted-foreground">{pref.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 sm:gap-0 sm:contents pl-12 sm:pl-0">
                  <div className="flex flex-col items-center gap-1 sm:gap-0">
                    <span className="text-xs text-muted-foreground sm:hidden">Email</span>
                    <Switch
                      checked={pref.email}
                      onCheckedChange={(v) => updatePref(pref.id, "email", v)}
                      aria-label={`${pref.label} por email`}
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1 sm:gap-0">
                    <span className="text-xs text-muted-foreground sm:hidden">Push</span>
                    <Switch
                      checked={pref.push}
                      onCheckedChange={(v) => updatePref(pref.id, "push", v)}
                      aria-label={`${pref.label} push`}
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1 sm:gap-0">
                    <span className="text-xs text-muted-foreground sm:hidden">App</span>
                    <Switch
                      checked={pref.inApp}
                      onCheckedChange={(v) => updatePref(pref.id, "inApp", v)}
                      aria-label={`${pref.label} en la app`}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Guardar preferencias</Button>
      </div>
    </div>
  )
}
