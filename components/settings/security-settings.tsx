"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Shield, Smartphone, Key, Clock } from "lucide-react"

export function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [twoFactor, setTwoFactor] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState(true)

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Completa todos los campos de contrasena")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contrasenas nuevas no coinciden")
      return
    }
    if (newPassword.length < 8) {
      toast.error("La contrasena debe tener al menos 8 caracteres")
      return
    }
    toast.success("Contrasena actualizada correctamente")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  const sessions = [
    { device: "Chrome en Windows", location: "Buenos Aires, AR", lastActive: "Ahora", current: true },
    { device: "Safari en iPhone", location: "Buenos Aires, AR", lastActive: "Hace 2 horas", current: false },
    { device: "Firefox en MacOS", location: "Cordoba, AR", lastActive: "Hace 1 dia", current: false },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="size-4" />
            Cambiar contrasena
          </CardTitle>
          <CardDescription>Actualiza tu contrasena para mantener la seguridad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Contrasena actual</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Ingresa tu contrasena actual"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contrasena</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimo 8 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar contrasena</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contrasena"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleChangePassword} variant="outline">
              Actualizar contrasena
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="size-4" />
            Opciones de seguridad
          </CardTitle>
          <CardDescription>Configura las opciones de seguridad adicionales</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                <Smartphone className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Autenticacion de dos factores</Label>
                <p className="text-xs text-muted-foreground">
                  Agrega una capa extra de seguridad a tu cuenta
                </p>
              </div>
            </div>
            <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                <Clock className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Cierre de sesion automatico</Label>
                <p className="text-xs text-muted-foreground">
                  Cierra sesion despues de 30 minutos de inactividad
                </p>
              </div>
            </div>
            <Switch checked={sessionTimeout} onCheckedChange={setSessionTimeout} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sesiones activas</CardTitle>
          <CardDescription>Dispositivos donde tu cuenta esta conectada</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.map((session, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{session.device}</p>
                    {session.current && (
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                        Actual
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {session.location} &middot; {session.lastActive}
                  </p>
                </div>
                {!session.current && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => toast.success("Sesion cerrada correctamente")}
                  >
                    Cerrar
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
