"use client"

import { useMemo } from "react"
import type { CalendarEvent } from "./calendar-page-content"
import { cn } from "@/lib/utils"

const DAYS_ES = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(month: number, year: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Monday = 0
}

export function CalendarGrid({
  month,
  year,
  events,
  selectedDate,
  onSelectDate,
}: {
  month: number
  year: number
  events: CalendarEvent[]
  selectedDate: string
  onSelectDate: (date: string) => void
}) {
  const daysInMonth = getDaysInMonth(month, year)
  const firstDay = getFirstDayOfMonth(month, year)

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    for (const evt of events) {
      if (!map[evt.date]) map[evt.date] = []
      map[evt.date].push(evt)
    }
    return map
  }, [events])

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

  const cells = []

  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="min-h-[80px] border border-border/30 bg-muted/20" />)
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const dayEvents = eventsByDate[dateStr] || []
    const isSelected = dateStr === selectedDate
    const isToday = dateStr === todayStr

    cells.push(
      <button
        key={day}
        type="button"
        onClick={() => onSelectDate(dateStr)}
        className={cn(
          "min-h-[80px] border border-border/30 p-1.5 text-left transition-colors hover:bg-muted/60 flex flex-col",
          isSelected && "ring-2 ring-primary bg-primary/5",
          isToday && !isSelected && "bg-muted/40"
        )}
      >
        <span
          className={cn(
            "text-xs font-medium inline-flex items-center justify-center size-6 rounded-full",
            isToday && "bg-foreground text-background",
            isSelected && !isToday && "text-primary font-bold"
          )}
        >
          {day}
        </span>
        <div className="flex flex-col gap-0.5 mt-1 overflow-hidden flex-1">
          {dayEvents.slice(0, 3).map((evt) => (
            <div
              key={evt.id}
              className="text-[10px] leading-tight truncate rounded px-1 py-0.5"
              style={{ backgroundColor: `${evt.color}18`, color: evt.color }}
            >
              {evt.title}
            </div>
          ))}
          {dayEvents.length > 3 && (
            <span className="text-[10px] text-muted-foreground pl-1">
              +{dayEvents.length - 3} mas
            </span>
          )}
        </div>
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="grid grid-cols-7">
        {DAYS_ES.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground border-b border-border/50">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">{cells}</div>
    </div>
  )
}
