"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Monitor, Moon, Sun } from "lucide-react"
import { useAppearance } from "@/components/appearance-provider"

export function AppearanceSettings() {
  const {
    theme, setTheme,
    compactMode, setCompactMode,
    animations, setAnimations,
    fontSize, setFontSize,
    sidebarCollapsed, setSidebarCollapsed,
  } = useAppearance()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tema</CardTitle>
          <CardDescription>Seleccioná el modo de color de la interfaz</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: "system", label: "Sistema", icon: Monitor },
              { value: "light", label: "Claro", icon: Sun },
              { value: "dark", label: "Oscuro", icon: Moon },
            ] as const).map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors cursor-pointer ${
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
          <CardDescription>Ajustá la apariencia de los componentes</CardDescription>
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
              <p className="text-xs text-muted-foreground">Reduce el espaciado para mostrar más contenido</p>
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
              <Label className="text-sm font-medium">Tamaño de fuente</Label>
              <p className="text-xs text-muted-foreground">Ajusta el tamaño del texto general</p>
            </div>
            <Select value={fontSize} onValueChange={setFontSize}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Pequeño</SelectItem>
                <SelectItem value="default">Normal</SelectItem>
                <SelectItem value="large">Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
