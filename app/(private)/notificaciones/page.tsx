import { Suspense } from "react"
import { NotificationsPageContent } from "@/components/notifications/notifications-page-content"

export default function NotificacionesPage() {
  return (
    <Suspense>
      <NotificationsPageContent />
    </Suspense>
  )
}
