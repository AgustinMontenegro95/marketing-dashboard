import { Suspense } from "react"
import { CommunicationPageContent } from "@/components/communication/communication-page-content"

export default function TareasPage() {
  return (
    <Suspense>
      <CommunicationPageContent section="tareas" />
    </Suspense>
  )
}
