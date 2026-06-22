"use client"

import { ArrowLeft, Bot, User, MessageCircle, TrendingUp, Hash, DollarSign, Clock, Star, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAnalytics, useArchivedChats } from "@/lib/hooks/use-chatbot"
import { type AnalyticsDay } from "@/lib/api/chatbot"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend,
  LineChart, Line, AreaChart, Area,
} from "recharts"

const GPT_PRICE = { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 }
function calcCost(input: number, output: number) {
  return input * GPT_PRICE.input + output * GPT_PRICE.output
}

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

function fmtCost(usd: number) {
  if (usd < 0.01) return `$${(usd * 100).toFixed(3)} ¢`
  return `$${usd.toFixed(4)}`
}

const TOOLTIP_STYLE = {
  contentStyle: { fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" },
  labelStyle: { fontWeight: 600 },
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="rounded-lg border bg-card p-4 flex items-center gap-4">
      <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold leading-none mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((j) => (
            <div key={j} className="rounded-lg border bg-muted h-24" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ChatbotAnalyticsContent() {
  const { data: analyticsData, loading: loadingAnalytics } = useAnalytics()
  const { data: archivedData, loading: loadingArchived } = useArchivedChats()

  const analytics: AnalyticsDay[] = analyticsData ?? []
  const archived = archivedData ?? []

  const WEEKLY_TOTAL   = analytics.reduce((a, d) => a + d.bot + d.human, 0)
  const BOT_TOTAL      = analytics.reduce((a, d) => a + d.bot, 0)
  const HUMAN_TOTAL    = analytics.reduce((a, d) => a + d.human, 0)
  const BOT_RATE       = WEEKLY_TOTAL > 0 ? Math.round((BOT_TOTAL / WEEKLY_TOTAL) * 100) : 0
  const TOTAL_INPUT    = analytics.reduce((a, d) => a + d.inputTokens, 0)
  const TOTAL_OUTPUT   = analytics.reduce((a, d) => a + d.outputTokens, 0)
  const TOTAL_TOKENS   = TOTAL_INPUT + TOTAL_OUTPUT
  const TOTAL_COST     = calcCost(TOTAL_INPUT, TOTAL_OUTPUT)

  const AVG_BOT_RESPONSE = analytics.length
    ? parseFloat((analytics.reduce((a, d) => a + d.avgBotResponseSec, 0) / analytics.length).toFixed(1))
    : 0
  const AVG_HUMAN_RESPONSE = analytics.length
    ? parseFloat((analytics.reduce((a, d) => a + d.avgHumanResponseSec, 0) / analytics.length).toFixed(1))
    : 0
  const FASTEST_BOT = analytics.length ? Math.min(...analytics.map((d) => d.avgBotResponseSec)) : 0

  const chatsWithCsat = archived.filter((c) => c.csat !== undefined)
  const AVG_CSAT = chatsWithCsat.length
    ? parseFloat((chatsWithCsat.reduce((a, c) => a + (c.csat ?? 0), 0) / chatsWithCsat.length).toFixed(1))
    : 0

  const CUMULATIVE = (() => {
    let acc = 0
    return analytics.map((d) => { acc += d.bot + d.human; return { day: d.day, total: acc } })
  })()

  const TOKEN_CHART = analytics.map((d) => ({
    day: d.day,
    input: d.inputTokens,
    output: d.outputTokens,
    costo: parseFloat(calcCost(d.inputTokens, d.outputTokens).toFixed(5)),
  }))

  const RESPONSE_CHART = analytics.map((d) => ({
    day: d.day,
    bot: d.avgBotResponseSec,
    humano: d.avgHumanResponseSec,
  }))

  function exportCSV() {
    const headers = ["Día", "Bot", "Humano", "% Bot", "Tokens Input", "Tokens Output", "Costo USD", "T. Resp Bot (s)", "T. Resp Humano (s)", "CSAT Promedio"]
    const rows = analytics.map((d) => {
      const total = d.bot + d.human
      const rate = total > 0 ? Math.round((d.bot / total) * 100) : 0
      const cost = calcCost(d.inputTokens, d.outputTokens)
      return [d.day, d.bot, d.human, `${rate}%`, d.inputTokens, d.outputTokens, cost.toFixed(5), d.avgBotResponseSec, d.avgHumanResponseSec, d.csatAvg]
    })
    const totals = ["Total", BOT_TOTAL, HUMAN_TOTAL, `${BOT_RATE}%`, TOTAL_INPUT, TOTAL_OUTPUT, TOTAL_COST.toFixed(5), AVG_BOT_RESPONSE, AVG_HUMAN_RESPONSE, AVG_CSAT]
    const csv = [headers, ...rows, totals].map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-chatbot-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-7 -ml-1 cursor-pointer" asChild>
              <Link href="/chatbot"><ArrowLeft className="size-4" /></Link>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Analytics del Bot</h1>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground ml-8">Últimos 7 días · GPT-4o-mini</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer" onClick={exportCSV} disabled={!analytics.length}>
          <Download className="size-3.5" /> Exportar CSV
        </Button>
      </div>

      {loadingAnalytics || loadingArchived ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Mensajes KPIs */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Mensajes</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon={<MessageCircle className="size-5 text-blue-600 dark:text-blue-400" />} label="Mensajes totales" value={WEEKLY_TOTAL} sub="esta semana" color="bg-blue-100 dark:bg-blue-950/40" />
              <StatCard icon={<Bot className="size-5 text-emerald-600 dark:text-emerald-400" />} label="Respondidos por bot" value={BOT_TOTAL} sub={`${BOT_RATE}% del total`} color="bg-emerald-100 dark:bg-emerald-950/40" />
              <StatCard icon={<User className="size-5 text-violet-600 dark:text-violet-400" />} label="Intervención humana" value={HUMAN_TOTAL} sub={`${100 - BOT_RATE}% del total`} color="bg-violet-100 dark:bg-violet-950/40" />
              <StatCard icon={<TrendingUp className="size-5 text-orange-600 dark:text-orange-400" />} label="Tasa bot" value={`${BOT_RATE}%`} sub="sin intervención humana" color="bg-orange-100 dark:bg-orange-950/40" />
            </div>
          </div>

          {/* Tokens KPIs */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tokens OpenAI</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon={<Hash className="size-5 text-indigo-600 dark:text-indigo-400" />} label="Tokens totales" value={fmt(TOTAL_TOKENS)} sub={`${fmt(TOTAL_INPUT)} input · ${fmt(TOTAL_OUTPUT)} output`} color="bg-indigo-100 dark:bg-indigo-950/40" />
              <StatCard icon={<Hash className="size-5 text-sky-600 dark:text-sky-400" />} label="Tokens de entrada" value={fmt(TOTAL_INPUT)} sub="contexto + historial" color="bg-sky-100 dark:bg-sky-950/40" />
              <StatCard icon={<Hash className="size-5 text-pink-600 dark:text-pink-400" />} label="Tokens de salida" value={fmt(TOTAL_OUTPUT)} sub="respuestas generadas" color="bg-pink-100 dark:bg-pink-950/40" />
              <StatCard icon={<DollarSign className="size-5 text-emerald-600 dark:text-emerald-400" />} label="Costo estimado" value={fmtCost(TOTAL_COST)} sub="GPT-4o-mini esta semana" color="bg-emerald-100 dark:bg-emerald-950/40" />
            </div>
          </div>

          {/* Tiempo de respuesta + CSAT KPIs */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tiempos y satisfacción</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon={<Clock className="size-5 text-teal-600 dark:text-teal-400" />} label="T. respuesta bot" value={`${AVG_BOT_RESPONSE}s`} sub="promedio semanal" color="bg-teal-100 dark:bg-teal-950/40" />
              <StatCard icon={<Clock className="size-5 text-blue-600 dark:text-blue-400" />} label="T. respuesta humano" value={`${AVG_HUMAN_RESPONSE}s`} sub="promedio semanal" color="bg-blue-100 dark:bg-blue-950/40" />
              <StatCard icon={<Clock className="size-5 text-emerald-600 dark:text-emerald-400" />} label="Respuesta más rápida" value={`${FASTEST_BOT}s`} sub="bot (mejor día)" color="bg-emerald-100 dark:bg-emerald-950/40" />
              <StatCard
                icon={<Star className="size-5 text-amber-600 dark:text-amber-400" />}
                label="CSAT promedio"
                value={AVG_CSAT > 0 ? `${AVG_CSAT} / 5` : "—"}
                sub={AVG_CSAT > 0 ? `${chatsWithCsat.length} evaluaciones` : "Sin datos aún"}
                color="bg-amber-100 dark:bg-amber-950/40"
              />
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-card p-5">
              <div className="mb-4">
                <p className="text-sm font-semibold">Mensajes por día</p>
                <p className="text-xs text-muted-foreground">Bot vs intervención humana</p>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analytics} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Bar dataKey="bot" name="Bot" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="human" name="Humano" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border bg-card p-5">
              <div className="mb-4">
                <p className="text-sm font-semibold">Tokens por día</p>
                <p className="text-xs text-muted-foreground">Input vs output (GPT-4o-mini)</p>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={TOKEN_CHART}>
                  <defs>
                    <linearGradient id="gInput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(239 84% 67%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(239 84% 67%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gOutput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(330 81% 60%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(330 81% 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={36} tickFormatter={fmt} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [fmt(v), ""]} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Area type="monotone" dataKey="input" name="Input" stroke="hsl(239 84% 67%)" fill="url(#gInput)" strokeWidth={2} />
                  <Area type="monotone" dataKey="output" name="Output" stroke="hsl(330 81% 60%)" fill="url(#gOutput)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Response time + cost charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-card p-5">
              <div className="mb-4">
                <p className="text-sm font-semibold">Tiempo de respuesta por día</p>
                <p className="text-xs text-muted-foreground">Segundos promedio · bot vs agente humano</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={RESPONSE_CHART}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={28} tickFormatter={(v) => `${v}s`} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v}s`, ""]} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Line type="monotone" dataKey="bot" name="Bot" stroke="hsl(142 76% 36%)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="humano" name="Humano" stroke="hsl(221 83% 53%)" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border bg-card p-5">
              <div className="mb-4">
                <p className="text-sm font-semibold">Costo estimado por día</p>
                <p className="text-xs text-muted-foreground">USD · input $0.15/1M · output $0.60/1M</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={TOKEN_CHART}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={52}
                    tickFormatter={(v) => `$${(v as number).toFixed(4)}`} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`$${v.toFixed(5)} USD`, "Costo"]} />
                  <Bar dataKey="costo" name="Costo USD" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cumulative */}
          <div className="rounded-lg border bg-card p-5">
            <div className="mb-4">
              <p className="text-sm font-semibold">Mensajes acumulados</p>
              <p className="text-xs text-muted-foreground">Total procesado en la semana</p>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={CUMULATIVE}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="total" name="Acumulado" stroke="hsl(262 83% 58%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <p className="text-sm font-semibold">Detalle por día</p>
              <button onClick={exportCSV} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors">
                <Download className="size-3" /> CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground">Día</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Bot</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Humano</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">% Bot</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">T. Bot</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">T. Humano</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">CSAT</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Tokens in</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Tokens out</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-muted-foreground">Costo USD</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.map((d) => {
                    const total = d.bot + d.human
                    const rate = total > 0 ? Math.round((d.bot / total) * 100) : 0
                    const cost = calcCost(d.inputTokens, d.outputTokens)
                    return (
                      <tr key={d.day} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-2.5 font-medium">{d.day}</td>
                        <td className="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-medium">{d.bot}</td>
                        <td className="px-4 py-2.5 text-right text-blue-600 dark:text-blue-400 font-medium">{d.human}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rate >= 70 ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" : "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"}`}>
                            {rate}%
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground font-mono text-xs">{d.avgBotResponseSec}s</td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground font-mono text-xs">{d.avgHumanResponseSec}s</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className="text-xs flex items-center justify-end gap-0.5">
                            <Star className="size-3 fill-amber-400 text-amber-400" />{d.csatAvg}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground font-mono text-xs">{d.inputTokens.toLocaleString("es-AR")}</td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground font-mono text-xs">{d.outputTokens.toLocaleString("es-AR")}</td>
                        <td className="px-5 py-2.5 text-right font-mono text-xs">${cost.toFixed(5)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/40 border-t">
                    <td className="px-5 py-2.5 font-semibold text-xs">Total</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-xs text-emerald-600 dark:text-emerald-400">{BOT_TOTAL}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-xs text-blue-600 dark:text-blue-400">{HUMAN_TOTAL}</td>
                    <td className="px-4 py-2.5 text-right"><span className="text-xs font-semibold text-muted-foreground">{BOT_RATE}%</span></td>
                    <td className="px-4 py-2.5 text-right font-semibold font-mono text-xs">{AVG_BOT_RESPONSE}s</td>
                    <td className="px-4 py-2.5 text-right font-semibold font-mono text-xs">{AVG_HUMAN_RESPONSE}s</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-xs flex items-center justify-end gap-0.5 font-semibold">
                        <Star className="size-3 fill-amber-400 text-amber-400" />{AVG_CSAT}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold font-mono text-xs">{TOTAL_INPUT.toLocaleString("es-AR")}</td>
                    <td className="px-4 py-2.5 text-right font-semibold font-mono text-xs">{TOTAL_OUTPUT.toLocaleString("es-AR")}</td>
                    <td className="px-5 py-2.5 text-right font-semibold font-mono text-xs">${TOTAL_COST.toFixed(5)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
