"use client"

import type { DesignRequest } from "./diseno-page-content"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

const stageColors: Record<string, string> = {
  "Backlog": "bg-muted",
  "En diseno": "bg-foreground",
  "Revision interna": "bg-primary/20",
  "Revision cliente": "bg-primary",
  "Aprobado": "bg-muted",
}

const stages = ["Backlog", "En diseno", "Revision interna", "Revision cliente", "Aprobado"] as const

export function DisenoPipeline({
  requests,
  onSelect,
}: {
  requests: DesignRequest[]
  onSelect: (req: DesignRequest) => void
}) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Pipeline de Diseno</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-3">
          {stages.map((stage) => {
            const stageItems = requests.filter((r) => r.stage === stage)
            return (
              <div key={stage} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{stage}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {stageItems.length}
                  </Badge>
                </div>
                <ScrollArea className="h-[320px]">
                  <div className="flex flex-col gap-2 pr-2">
                    {stageItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onSelect(item)}
                        className="flex flex-col gap-2 rounded-lg border border-border/50 bg-card p-3 text-left transition-colors hover:bg-accent"
                      >
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {item.type}
                          </Badge>
                        </div>
                        <p className="text-xs font-medium leading-tight">{item.title}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground font-mono">{item.id}</span>
                          <Avatar className="size-5">
                            <AvatarFallback className="text-[8px] bg-primary/20 text-primary font-semibold">
                              {item.assigneeInitials}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        {item.priority === "Alta" && (
                          <div className="flex items-center gap-1">
                            <div className="size-1.5 rounded-full bg-primary" />
                            <span className="text-[10px] text-primary font-medium">Prioridad alta</span>
                          </div>
                        )}
                      </button>
                    ))}
                    {stageItems.length === 0 && (
                      <div className="flex items-center justify-center rounded-lg border border-dashed border-border/50 py-8">
                        <span className="text-xs text-muted-foreground">Vacio</span>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
