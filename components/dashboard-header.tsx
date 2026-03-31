"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"
import { useUnreadCount } from "@/components/unread-count-provider"
import { CommandPalette } from "@/components/command-palette"
import { getUserLite } from "@/lib/session"

// ─── Weather ──────────────────────────────────────────────────────────────────

type WeatherInfo = { temp: number; emoji: string; city: string }

function wmoEmoji(code: number): string {
  if (code === 0)  return "☀️"
  if (code <= 2)   return "🌤️"
  if (code === 3)  return "☁️"
  if (code <= 49)  return "🌫️"
  if (code <= 67)  return "🌧️"
  if (code <= 77)  return "🌨️"
  if (code <= 82)  return "🌧️"
  return "⛈️"
}

async function resolveCity(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
      { headers: { "Accept-Language": "es" } }
    )
    const json = await res.json()
    const a = json.address ?? {}
    return a.city ?? a.town ?? a.village ?? a.county ?? a.state ?? "Mi ubicación"
  } catch {
    return "Mi ubicación"
  }
}

async function loadWeather(lat: number, lon: number, city?: string): Promise<WeatherInfo> {
  const [weatherRes, resolvedCity] = await Promise.all([
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code&timezone=auto&forecast_days=1`
    ).then((r) => r.json()),
    city ? Promise.resolve(city) : resolveCity(lat, lon),
  ])
  return {
    temp: Math.round(weatherRes.current.temperature_2m),
    emoji: wmoEmoji(weatherRes.current.weather_code),
    city: resolvedCity,
  }
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

function todayLabel(): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date())
}

function greetingText(nombre: string): string {
  const h = new Date().getHours()
  const saludo =
    h >= 6 && h < 12 ? "Buenos días" :
    h >= 12 && h < 19 ? "Buenas tardes" :
    "Buenas noches"
  return `${saludo}, ${nombre}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardHeader() {
  const { count } = useUnreadCount()
  const [greeting, setGreeting] = useState<string | null>(null)
  const [today, setToday] = useState<string | null>(null)
  const [weather, setWeather] = useState<WeatherInfo | null>(null)

  useEffect(() => {
    const user = getUserLite()
    if (user?.nombre) setGreeting(greetingText(user.nombre))
    setToday(todayLabel())
  }, [])

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => loadWeather(pos.coords.latitude, pos.coords.longitude).then(setWeather).catch(() => {}),
        ()    => loadWeather(-27.7951, -64.2615, "Santiago del Estero").then(setWeather).catch(() => {}),
        { timeout: 5000 }
      )
    } else {
      loadWeather(-27.7951, -64.2615, "Santiago del Estero").then(setWeather).catch(() => {})
    }
  }, [])

  return (
    <header className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-border/50 px-4">

      {/* ── Izquierda: expand · saludo · fecha · temperatura ── */}
      <div className="flex items-center gap-2 min-w-0">
        <SidebarTrigger className="-ml-1 shrink-0" />

        {greeting && (
          <>
            <Separator orientation="vertical" className="h-4 shrink-0" />
            <span className="hidden sm:block text-sm text-muted-foreground whitespace-nowrap select-none truncate">
              {greeting}
            </span>
          </>
        )}

        {today && (
          <>
            <Separator orientation="vertical" className="h-4 shrink-0 hidden sm:block" />
            <span className="hidden sm:block text-xs text-muted-foreground capitalize select-none whitespace-nowrap">
              {today}
            </span>
          </>
        )}

        {weather && (
          <>
            <Separator orientation="vertical" className="h-4 shrink-0 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-base leading-none">{weather.emoji}</span>
              <span className="text-sm font-semibold tabular-nums">{weather.temp}°C</span>
              <span className="hidden lg:block text-xs text-muted-foreground">{weather.city}</span>
            </div>
          </>
        )}
      </div>

      {/* ── Centro: Chemi ── */}
      <div className="hidden md:flex justify-center pointer-events-none">
        <span className="font-bertha text-xl font-semibold text-foreground select-none">
          Chemi
        </span>
      </div>

      {/* ── Derecha: buscar · campana ── */}
      <div className="flex items-center gap-2 justify-end">
        <CommandPalette />

        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link href="/notificaciones">
            <Bell className="size-4" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {count > 99 ? "99+" : count}
              </span>
            )}
            <span className="sr-only">Notificaciones</span>
          </Link>
        </Button>
      </div>

    </header>
  )
}
