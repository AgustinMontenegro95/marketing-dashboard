import { apiFetchAuth } from "@/lib/api"

export type DailyTraffic = {
  date: string
  sessions: number
  activeUsers: number
}

export type TopPage = {
  pagePath: string
  pageTitle: string
  pageViews: number
  bounceRate: number
  avgSessionDuration: number
}

export type ChannelSource = {
  channel: string
  sessions: number
  percentage: number
}

export type Conversions = {
  contactFormSent: number
  whatsappClick: number
  emailClick: number
  ctaSolicitarPropuesta: number
  total: number
}

export type AnalyticsWebDto = {
  activeUsers: number
  sessions: number
  pageViews: number
  bounceRate: number
  avgSessionDuration: number
  activeUsersChange: number
  sessionsChange: number
  pageViewsChange: number
  bounceRateChange: number
  dailyTraffic: DailyTraffic[]
  topPages: TopPage[]
  channelSources: ChannelSource[]
  conversions: Conversions | null
}

export async function getWebAnalytics(days: number): Promise<AnalyticsWebDto> {
  const res = await apiFetchAuth<AnalyticsWebDto>(`/api/v1/analytics/web?days=${days}`)
  if (!res.estado || !res.datos) throw new Error(res.error_mensaje ?? "Error al cargar analítica")
  return res.datos
}

export function periodToDays(period: string): number {
  switch (period) {
    case "7 días":   return 7
    case "90 días":  return 90
    case "Este año": return 365
    default:         return 30
  }
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}m ${s.toString().padStart(2, "0")}s`
}
