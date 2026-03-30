"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type Integration = {
  id: string
  name: string
  description: string
  category: string
  icon: string
  color: string
}

const INTEGRATIONS: Integration[] = [
  // Analítica
  { id: "google-analytics", name: "Google Analytics", description: "Seguimiento y análisis de tráfico web", category: "Analítica", icon: "GA", color: "bg-orange-500/10 text-orange-600" },
  { id: "google-search-console", name: "Search Console", description: "Rendimiento en búsquedas de Google", category: "Analítica", icon: "SC", color: "bg-blue-500/10 text-blue-600" },
  { id: "hotjar", name: "Hotjar", description: "Mapas de calor y grabación de sesiones", category: "Analítica", icon: "HJ", color: "bg-red-500/10 text-red-600" },

  // Publicidad
  { id: "google-ads", name: "Google Ads", description: "Gestión de campañas de búsqueda y display", category: "Publicidad", icon: "GAd", color: "bg-green-500/10 text-green-600" },
  { id: "meta-ads", name: "Meta Ads", description: "Campañas en Facebook e Instagram", category: "Publicidad", icon: "MA", color: "bg-blue-600/10 text-blue-700" },
  { id: "tiktok-ads", name: "TikTok Ads", description: "Campañas publicitarias en TikTok", category: "Publicidad", icon: "TT", color: "bg-pink-500/10 text-pink-600" },
  { id: "linkedin-ads", name: "LinkedIn Ads", description: "Publicidad B2B en LinkedIn", category: "Publicidad", icon: "LI", color: "bg-sky-600/10 text-sky-700" },

  // Email Marketing
  { id: "mailchimp", name: "Mailchimp", description: "Email marketing y automatización", category: "Email", icon: "MC", color: "bg-yellow-500/10 text-yellow-600" },
  { id: "brevo", name: "Brevo", description: "Emails transaccionales y campañas", category: "Email", icon: "BR", color: "bg-teal-500/10 text-teal-600" },
  { id: "hubspot-email", name: "HubSpot", description: "CRM y automatización de marketing", category: "Email", icon: "HS", color: "bg-orange-600/10 text-orange-700" },

  // Diseño
  { id: "figma", name: "Figma", description: "Diseño y prototipado colaborativo", category: "Diseño", icon: "FG", color: "bg-purple-500/10 text-purple-600" },
  { id: "canva", name: "Canva", description: "Diseño gráfico simplificado", category: "Diseño", icon: "CV", color: "bg-cyan-500/10 text-cyan-600" },
  { id: "adobe-cc", name: "Adobe CC", description: "Suite completa de herramientas creativas", category: "Diseño", icon: "AD", color: "bg-red-600/10 text-red-700" },

  // Gestión
  { id: "notion", name: "Notion", description: "Documentación y base de conocimiento", category: "Gestión", icon: "NO", color: "bg-zinc-500/10 text-zinc-600" },
  { id: "trello", name: "Trello", description: "Tableros kanban para proyectos", category: "Gestión", icon: "TR", color: "bg-blue-500/10 text-blue-600" },
  { id: "asana", name: "Asana", description: "Gestión de proyectos y tareas del equipo", category: "Gestión", icon: "AS", color: "bg-pink-600/10 text-pink-700" },

  // Comunicación
  { id: "slack", name: "Slack", description: "Mensajería y notificaciones del equipo", category: "Comunicación", icon: "SL", color: "bg-purple-600/10 text-purple-700" },
  { id: "whatsapp", name: "WhatsApp Business", description: "Atención al cliente por WhatsApp", category: "Comunicación", icon: "WA", color: "bg-green-600/10 text-green-700" },

  // E-commerce
  { id: "tiendanube", name: "Tienda Nube", description: "Gestión de tiendas online", category: "E-commerce", icon: "TN", color: "bg-sky-500/10 text-sky-600" },
  { id: "shopify", name: "Shopify", description: "Plataforma de comercio electrónico", category: "E-commerce", icon: "SH", color: "bg-green-500/10 text-green-600" },
  { id: "mercadopago", name: "MercadoPago", description: "Pagos y cobros en línea", category: "E-commerce", icon: "MP", color: "bg-yellow-600/10 text-yellow-700" },

  // Desarrollo
  { id: "github", name: "GitHub", description: "Repositorios y control de versiones", category: "Desarrollo", icon: "GH", color: "bg-zinc-600/10 text-zinc-700" },
  { id: "vercel", name: "Vercel", description: "Deploy y hosting de aplicaciones web", category: "Desarrollo", icon: "VR", color: "bg-zinc-500/10 text-zinc-600" },

  // Almacenamiento
  { id: "google-drive", name: "Google Drive", description: "Almacenamiento y colaboración de archivos", category: "Almacenamiento", icon: "GD", color: "bg-yellow-500/10 text-yellow-600" },
  { id: "dropbox", name: "Dropbox", description: "Sincronización y compartición de archivos", category: "Almacenamiento", icon: "DB", color: "bg-blue-600/10 text-blue-700" },
]

const CATEGORIES = [...new Set(INTEGRATIONS.map((i) => i.category))]

export function IntegrationsSettings() {
  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Integraciones disponibles</CardTitle>
            <CardDescription>
              Conectá tus herramientas favoritas con Chemi — próximamente disponible
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {CATEGORIES.map((category) => (
              <div key={category}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {category}
                </p>
                <div className="space-y-2">
                  {INTEGRATIONS.filter((i) => i.category === category).map((integration) => (
                    <div
                      key={integration.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex size-10 shrink-0 items-center justify-center rounded-md text-xs font-bold ${integration.color}`}>
                          {integration.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{integration.name}</p>
                          <p className="text-xs text-muted-foreground">{integration.description}</p>
                        </div>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button variant="outline" size="sm" disabled>
                              Conectar
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Próximamente disponible</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
