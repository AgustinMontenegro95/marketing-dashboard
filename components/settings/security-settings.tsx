"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Shield, Smartphone, Key, Clock, Loader2 } from "lucide-react"
import { apiFetchAuth } from "@/lib/api"
import { getAccessToken } from "@/lib/session"
import { Check, X, Eye, EyeOff, Monitor } from "lucide-react"

function detectBrowser(): string {
  if (typeof navigator === "undefined") return "Navegador desconocido"
  const ua = navigator.userAgent
  if (ua.includes("Edg/")) return "Edge"
  if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera"
  if (ua.includes("Chrome/")) return "Chrome"
  if (ua.includes("Firefox/")) return "Firefox"
  if (ua.includes("Safari/")) return "Safari"
  return "Navegador desconocido"
}

function detectOS(): string {
  if (typeof navigator === "undefined") return "SO desconocido"
  const ua = navigator.userAgent
  if (ua.includes("Windows")) return "Windows"
  if (ua.includes("Mac OS X") && !ua.includes("iPhone") && !ua.includes("iPad")) return "macOS"
  if (ua.includes("iPhone")) return "iPhone"
  if (ua.includes("iPad")) return "iPad"
  if (ua.includes("Android")) return "Android"
  if (ua.includes("Linux")) return "Linux"
  return "SO desconocido"
}

function getLoginTime(): string {
  const token = getAccessToken()
  if (!token) return "—"
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))
    if (!payload.iat) return "—"
    return new Date(payload.iat * 1000).toLocaleString("es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  } catch {
    return "—"
  }
}

function PasswordRule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? "text-emerald-600" : "text-muted-foreground"}`}>
      {ok
        ? <Check className="size-3 shrink-0" />
        : <X className="size-3 shrink-0" />
      }
      {label}
    </div>
  )
}

async function changePassword(passwordActual: string, passwordNuevo: string): Promise<void> {
  const r = await apiFetchAuth("/api/v1/auth/change-password", {
    method: "POST",
    body: { passwordActual, passwordNuevo },
  })
  if (!r.estado) {
    throw new Error(r.error_mensaje ?? "No se pudo actualizar la contraseña")
  }
}

export function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Completa todos los campos de contraseña")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas nuevas no coinciden")
      return
    }
    if (newPassword.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres")
      return
    }
    if (!/[A-Z]/.test(newPassword)) {
      toast.error("La contraseña debe tener al menos una letra mayúscula")
      return
    }
    if (!/[a-z]/.test(newPassword)) {
      toast.error("La contraseña debe tener al menos una letra minúscula")
      return
    }
    if (!/[0-9]/.test(newPassword)) {
      toast.error("La contraseña debe tener al menos un número")
      return
    }

    setSaving(true)
    try {
      await changePassword(currentPassword, newPassword)
      toast.success("Contraseña actualizada correctamente")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar la contraseña")
    } finally {
      setSaving(false)
    }
  }

  const browser = detectBrowser()
  const os = detectOS()
  const loginTime = getLoginTime()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="size-4" />
            Cambiar contraseña
          </CardTitle>
          <CardDescription>Actualiza tu contraseña para mantener la seguridad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Contraseña actual</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingresa tu contraseña actual"
                disabled={saving}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nueva contraseña"
                  disabled={saving}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {newPassword.length > 0 && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
                  <PasswordRule ok={newPassword.length >= 8} label="Mínimo 8 caracteres" />
                  <PasswordRule ok={/[A-Z]/.test(newPassword)} label="Una mayúscula" />
                  <PasswordRule ok={/[a-z]/.test(newPassword)} label="Una minúscula" />
                  <PasswordRule ok={/[0-9]/.test(newPassword)} label="Un número" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar contraseña</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  disabled={saving}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleChangePassword} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Actualizar contraseña
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
          <CardDescription>Configurá las opciones de seguridad adicionales</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                <Smartphone className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Autenticación de dos factores</Label>
                <p className="text-xs text-muted-foreground">
                  Agrega una capa extra de seguridad a tu cuenta
                </p>
              </div>
            </div>
            <Switch checked={false} disabled />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                <Clock className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Cierre de sesión automático</Label>
                <p className="text-xs text-muted-foreground">
                  Cierra sesión después de 30 minutos de inactividad
                </p>
              </div>
            </div>
            <Switch checked={true} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sesiones activas</CardTitle>
          <CardDescription>Dispositivos donde tu cuenta está conectada</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 rounded-lg border border-border p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <Monitor className="size-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{browser} en {os}</p>
                <Badge variant="outline" className="text-xs border-primary/30 text-primary shrink-0">
                  Actual
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Inicio de sesión: {loginTime}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
