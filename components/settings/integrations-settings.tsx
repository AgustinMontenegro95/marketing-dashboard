"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

type Integration = {
  id: string
  name: string
  description: string
  category: string
  connected: boolean
  icon: string
}

const initialIntegrations: Integration[] = [
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Seguimiento y analisis de trafico web",
    category: "Analitica",
    connected: true,
    icon: "GA",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Mensajeria y notificaciones del equipo",
    category: "Comunicacion",
    connected: true,
    icon: "SL",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Almacenamiento y colaboracion de archivos",
    category: "Productividad",
    connected: true,
    icon: "GD",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Procesamiento de pagos y facturacion",
    category: "Pagos",
    connected: false,
    icon: "ST",
  },
  {
    id: "figma",
    name: "Figma",
    description: "Diseno y prototipado colaborativo",
    category: "Diseno",
    connected: false,
    icon: "FG",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Repositorios y control de versiones",
    category: "Desarrollo",
    connected: true,
    icon: "GH",
  },
  {
    id: "trello",
    name: "Trello",
    description: "Gestion de tareas y tableros",
    category: "Productividad",
    connected: false,
    icon: "TR",
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Email marketing y automatizacion",
    category: "Marketing",
    connected: false,
    icon: "MC",
  },
]

export function IntegrationsSettings() {
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations)

  const toggleIntegration = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const newState = !i.connected
          toast.success(
            newState
              ? `${i.name} conectado correctamente`
              : `${i.name} desconectado`
          )
          return { ...i, connected: newState }
        }
        return i
      })
    )
  }

  const connected = integrations.filter((i) => i.connected)
  const available = integrations.filter((i) => !i.connected)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conectadas</CardTitle>
          <CardDescription>
            Servicios actualmente integrados con Chemi ({connected.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connected.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay integraciones conectadas
            </p>
          ) : (
            <div className="space-y-3">
              {connected.map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
                      {integration.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{integration.name}</p>
                        <Badge variant="outline" className="text-xs text-primary border-primary/30">
                          {integration.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{integration.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={integration.connected}
                    onCheckedChange={() => toggleIntegration(integration.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Disponibles</CardTitle>
          <CardDescription>
            Servicios que puedes conectar para ampliar funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {available.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-md bg-muted text-sm font-bold text-muted-foreground">
                    {integration.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{integration.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {integration.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{integration.description}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleIntegration(integration.id)}
                >
                  Conectar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
