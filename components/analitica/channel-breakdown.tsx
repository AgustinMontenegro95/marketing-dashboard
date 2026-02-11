"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const channels = [
  { name: "Busqueda Organica", value: 38, visits: "18,351", color: "bg-primary" },
  { name: "Redes Sociales", value: 26, visits: "12,556", color: "bg-foreground" },
  { name: "Directo", value: 18, visits: "8,693", color: "bg-muted-foreground" },
  { name: "Email Marketing", value: 11, visits: "5,312", color: "bg-foreground/40" },
  { name: "Referidos", value: 5, visits: "2,415", color: "bg-foreground/20" },
  { name: "Publicidad Paga", value: 2, visits: "966", color: "bg-primary/40" },
]

export function ChannelBreakdown() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Canales de Trafico</CardTitle>
        <CardDescription>Origen de visitas por canal</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-5">
          {channels.map((channel) => (
            <div key={channel.name} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{channel.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono">{channel.visits}</span>
                  <span className="text-xs font-semibold font-mono w-10 text-right">{channel.value}%</span>
                </div>
              </div>
              <Progress value={channel.value} className="h-1.5" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
