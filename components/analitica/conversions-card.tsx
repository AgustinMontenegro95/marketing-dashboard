"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, Phone, Mail, MousePointerClick } from "lucide-react"
import { type Conversions } from "@/lib/analitica"

type Props = {
  data: Conversions | null
  loading: boolean
}

const EVENTS = [
  {
    key: "contactFormSent" as keyof Conversions,
    label: "Formulario de contacto",
    icon: MessageSquare,
  },
  {
    key: "whatsappClick" as keyof Conversions,
    label: "Clic en WhatsApp",
    icon: Phone,
  },
  {
    key: "emailClick" as keyof Conversions,
    label: "Clic en email",
    icon: Mail,
  },
  {
    key: "ctaSolicitarPropuesta" as keyof Conversions,
    label: "Solicitar propuesta",
    icon: MousePointerClick,
  },
]

export function ConversionsCard({ data, loading }: Props) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Conversiones</CardTitle>
        <CardDescription>Eventos de contacto y captación de leads</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !data ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sin datos disponibles</p>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {EVENTS.map(({ key, label, icon: Icon }) => {
                const count = data[key] as number
                const total = data.total || 1
                const pct = Math.round((count / total) * 100)
                return (
                  <div key={key} className="flex items-center justify-between rounded-lg border border-border/40 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Icon className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {data.total > 0 && (
                        <span className="text-xs text-muted-foreground font-mono">{pct}%</span>
                      )}
                      <span className="text-sm font-semibold font-mono tabular-nums w-6 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-sm font-bold font-mono tabular-nums">{data.total}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
