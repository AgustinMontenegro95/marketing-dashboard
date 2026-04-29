"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { type ChannelSource } from "@/lib/analitica"

type Props = {
  data: ChannelSource[]
  loading: boolean
}

const CHANNEL_COLORS: Record<string, string> = {
  "Organic Search":  "bg-primary",
  "Direct":          "bg-foreground",
  "Organic Social":  "bg-muted-foreground",
  "Email":           "bg-foreground/40",
  "Referral":        "bg-foreground/20",
  "Paid Search":     "bg-primary/40",
  "Paid Social":     "bg-primary/60",
}

function channelColor(name: string) {
  return CHANNEL_COLORS[name] ?? "bg-muted-foreground/50"
}

export function ChannelBreakdown({ data, loading }: Props) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Canales de tráfico</CardTitle>
        <CardDescription>Origen de visitas por canal</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col gap-5">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {data.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Sin datos disponibles</p>
            )}
            {data.map((channel) => (
              <div key={channel.channel} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{channel.channel}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      {channel.sessions.toLocaleString()}
                    </span>
                    <span className="text-xs font-semibold font-mono w-10 text-right">
                      {channel.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Progress value={channel.percentage} className="h-1.5" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
