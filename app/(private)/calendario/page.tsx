import { Suspense } from "react"
import { CalendarPageContent } from "@/components/calendar/calendar-page-content"

export default function CalendarioPage() {
  return (
    <Suspense>
      <CalendarPageContent />
    </Suspense>
  )
}
