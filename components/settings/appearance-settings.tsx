"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Monitor, Moon, Sun } from "lucide-react"

export function AppearanceSettings() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [compactMode, setCompactMode] = useState(false)
  const [animations, setAnimations] = useState(true)
  const [fontSize, setFontSize] = useState("default")

  const handleSave = () => {
    toast.success("Preferencias de apariencia guardadas")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tema</CardTitle>
          <CardDescription>Selecciona el modo de color de la interfaz</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: "light", label: "Claro", icon: Sun },
              { value: "dark", label: "Oscuro", icon: Moon },
              { value: "system", label: "Sistema", icon: Monitor },
            ] as const).map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                    theme === option.value
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className={`size-5 ${theme === option.value ? "text-primary" : ""}`} />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Interfaz</CardTitle>
          <CardDescription>Ajusta la apariencia de los componentes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Sidebar colapsada por defecto</Label>
              <p className="text-xs text-muted-foreground">Inicia con la barra lateral minimizada</p>
            </div>
            <Switch checked={sidebarCollapsed} onCheckedChange={setSidebarCollapsed} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Modo compacto</Label>
              <p className="text-xs text-muted-foreground">Reduce el espaciado para mostrar mas contenido</p>
            </div>
            <Switch checked={compactMode} onCheckedChange={setCompactMode} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Animaciones</Label>
              <p className="text-xs text-muted-foreground">Habilita transiciones y efectos visuales</p>
            </div>
            <Switch checked={animations} onCheckedChange={setAnimations} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Tamano de fuente</Label>
              <p className="text-xs text-muted-foreground">Ajusta el tamano del texto general</p>
            </div>
            <Select value={fontSize} onValueChange={setFontSize}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Pequeno</SelectItem>
                <SelectItem value="default">Normal</SelectItem>
                <SelectItem value="large">Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Guardar cambios</Button>
      </div>
    </div>
  )
}
