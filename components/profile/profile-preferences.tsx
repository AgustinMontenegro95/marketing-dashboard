"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export function ProfilePreferences() {
  const [emailDigest, setEmailDigest] = useState("daily")
  const [showOnlineStatus, setShowOnlineStatus] = useState(true)
  const [profileVisibility, setProfileVisibility] = useState("team")
  const [emailOnMention, setEmailOnMention] = useState(true)
  const [emailOnAssignment, setEmailOnAssignment] = useState(true)
  const [desktopNotifications, setDesktopNotifications] = useState(false)

  const handleSave = () => {
    toast.success("Preferencias de perfil guardadas")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Privacidad</CardTitle>
          <CardDescription>Controla quien puede ver tu informacion</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Mostrar estado en linea</Label>
              <p className="text-xs text-muted-foreground">Permite que otros vean cuando estas conectado</p>
            </div>
            <Switch checked={showOnlineStatus} onCheckedChange={setShowOnlineStatus} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Visibilidad del perfil</Label>
              <p className="text-xs text-muted-foreground">Quien puede ver los detalles de tu perfil</p>
            </div>
            <Select value={profileVisibility} onValueChange={setProfileVisibility}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Todos</SelectItem>
                <SelectItem value="team">Solo equipo</SelectItem>
                <SelectItem value="private">Solo yo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comunicaciones</CardTitle>
          <CardDescription>Gestiona como recibes las comunicaciones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Resumen por email</Label>
              <p className="text-xs text-muted-foreground">Recibe un resumen de la actividad periodicamente</p>
            </div>
            <Select value={emailDigest} onValueChange={setEmailDigest}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Tiempo real</SelectItem>
                <SelectItem value="daily">Diario</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="never">Desactivado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Email al ser mencionado</Label>
              <p className="text-xs text-muted-foreground">Recibe un correo cuando alguien te menciona</p>
            </div>
            <Switch checked={emailOnMention} onCheckedChange={setEmailOnMention} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Email al ser asignado</Label>
              <p className="text-xs text-muted-foreground">Recibe un correo al asignarte un proyecto o tarea</p>
            </div>
            <Switch checked={emailOnAssignment} onCheckedChange={setEmailOnAssignment} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Notificaciones de escritorio</Label>
              <p className="text-xs text-muted-foreground">Recibe notificaciones push en tu navegador</p>
            </div>
            <Switch checked={desktopNotifications} onCheckedChange={setDesktopNotifications} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Guardar preferencias</Button>
      </div>
    </div>
  )
}
