import { Suspense } from "react"
import { ProjectsPageContent } from "@/components/projects/projects-page-content"

export default function ProyectosPage() {
  return (
    <Suspense>
      <ProjectsPageContent />
    </Suspense>
  )
}
