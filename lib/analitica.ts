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

/** Rango de fechas en formato YYYY-MM-DD (inclusive). */
export type DateRange = { desde: string; hasta: string }

export type AnalyticsQuery = { days: number; range?: DateRange }

export async function getWebAnalytics(query: AnalyticsQuery): Promise<AnalyticsWebDto> {
  const params = new URLSearchParams({ days: String(query.days) })
  if (query.range) {
    params.set("desde", query.range.desde)
    params.set("hasta", query.range.hasta)
  }
  const res = await apiFetchAuth<AnalyticsWebDto>(`/api/v1/analytics/web?${params}`)
  if (!res.estado || !res.datos) throw new Error(res.error_mensaje ?? "Error al cargar analítica")
  return res.datos
}

export function periodToDays(period: string): number {
  switch (period) {
    case "Hoy":      return 1
    case "7 días":   return 7
    case "90 días":  return 90
    case "Este año": return 365
    default:         return 30
  }
}

/** Fecha local en formato YYYY-MM-DD. */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Cantidad de días (inclusive) entre dos fechas YYYY-MM-DD. */
export function rangeDays(range: DateRange): number {
  const a = new Date(`${range.desde}T00:00:00`)
  const b = new Date(`${range.hasta}T00:00:00`)
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1)
}

/** Formatea YYYY-MM-DD como DD/MM/YYYY. */
export function formatIsoDate(iso: string): string {
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}m ${s.toString().padStart(2, "0")}s`
}
