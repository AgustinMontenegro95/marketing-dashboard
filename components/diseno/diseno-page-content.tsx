"use client"

import { useMemo, useState } from "react"
import { DisenoKpis } from "./diseno-kpis"
import { DisenoPipeline } from "./diseno-pipeline"
import { DisenoTable } from "./diseno-table"
import { DisenoDetail } from "./diseno-detail"

export type DesignDeliverable = {
    id: string
    title: string
    format?: string
    completed: boolean
}

export type DesignFeedbackComment = {
    id: string
    author: string
    authorInitials: string
    text: string
    date: string // YYYY-MM-DD
}

export type DesignRequest = {
    id: string
    title: string
    client: string
    type: string
    stage: "Backlog" | "En diseno" | "Revision interna" | "Revision cliente" | "Aprobado"
    priority: "Alta" | "Media" | "Baja"
    createdAt: string // YYYY-MM-DD
    deadline: string // YYYY-MM-DD
    description: string
    assignee: string
    assigneeInitials: string
    revisions: number
    maxRevisions: number
    deliverables: DesignDeliverable[]
    feedbackHistory: DesignFeedbackComment[]
}

function todayISO() {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
}

function addDaysISO(days: number) {
    const d = new Date()
    d.setDate(d.getDate() + days)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
}

const seedRequests: DesignRequest[] = [
    {
        id: "DSN-1024",
        title: "Creatividades campaña IG - Febrero",
        client: "Chemi",
        type: "Social",
        stage: "En diseno",
        priority: "Alta",
        createdAt: todayISO(),
        deadline: addDaysISO(3),
        description:
            "Set de 6 piezas para Instagram (4 feed + 2 stories). Mantener lineamientos de marca y adaptar mensajes a público frío.",
        assignee: "Equipo Diseño",
        assigneeInitials: "ED",
        revisions: 1,
        maxRevisions: 3,
        deliverables: [
            { id: "del-1", title: "4x Feed 1080x1350", format: "PNG", completed: false },
            { id: "del-2", title: "2x Stories 1080x1920", format: "PNG", completed: false },
            { id: "del-3", title: "Archivos editables", format: "FIG/PSD", completed: false },
        ],
        feedbackHistory: [
            {
                id: "fb-1",
                author: "Cliente",
                authorInitials: "CL",
                text: "Sumar más énfasis al beneficio principal y una versión con CTA alternativo.",
                date: todayISO(),
            },
        ],
    },
    {
        id: "DSN-1025",
        title: "Banner homepage - Promo fin de semana",
        client: "Chemi",
        type: "Web",
        stage: "Revision interna",
        priority: "Media",
        createdAt: addDaysISO(-2),
        deadline: addDaysISO(1),
        description:
            "Banner responsive (desktop + mobile). Mensaje: 20% OFF. Incluir fecha y términos cortos.",
        assignee: "María Pérez",
        assigneeInitials: "MP",
        revisions: 0,
        maxRevisions: 2,
        deliverables: [
            { id: "del-1", title: "Banner Desktop", format: "JPG", completed: true },
            { id: "del-2", title: "Banner Mobile", format: "JPG", completed: false },
        ],
        feedbackHistory: [],
    },
    {
        id: "DSN-1026",
        title: "Pack anuncios Meta - Remarketing",
        client: "Chemi",
        type: "Ads",
        stage: "Backlog",
        priority: "Baja",
        createdAt: addDaysISO(-6),
        deadline: addDaysISO(7),
        description:
            "Variantes 1:1 y 4:5 para remarketing. Proponer 3 conceptos visuales con copy corto.",
        assignee: "Juan Gómez",
        assigneeInitials: "JG",
        revisions: 0,
        maxRevisions: 2,
        deliverables: [
            { id: "del-1", title: "3 conceptos 1:1", format: "PNG", completed: false },
            { id: "del-2", title: "3 conceptos 4:5", format: "PNG", completed: false },
        ],
        feedbackHistory: [],
    },
    {
        id: "DSN-1027",
        title: "Flyer impresión - Evento",
        client: "Partner X",
        type: "Print",
        stage: "Aprobado",
        priority: "Media",
        createdAt: addDaysISO(-10),
        deadline: addDaysISO(-3),
        description:
            "Flyer A5 frente/dorso. Entrega final en PDF para imprenta + editables.",
        assignee: "Equipo Diseño",
        assigneeInitials: "ED",
        revisions: 2,
        maxRevisions: 3,
        deliverables: [
            { id: "del-1", title: "PDF imprenta CMYK", format: "PDF", completed: true },
            { id: "del-2", title: "Editables", format: "AI", completed: true },
        ],
        feedbackHistory: [
            {
                id: "fb-1",
                author: "Cliente",
                authorInitials: "CL",
                text: "Aprobado. Muchas gracias!",
                date: addDaysISO(-4),
            },
        ],
    },
]

function calcAvgTurnaroundDays(requests: DesignRequest[]) {
    // estimación simple: (deadline - createdAt) promedio en días
    const diffs = requests
        .map((r) => {
            const a = new Date(r.createdAt).getTime()
            const b = new Date(r.deadline).getTime()
            const days = Math.round((b - a) / (1000 * 60 * 60 * 24))
            return Number.isFinite(days) ? days : null
        })
        .filter((x): x is number => x !== null)

    if (diffs.length === 0) return 0
    const sum = diffs.reduce((acc, v) => acc + v, 0)
    return Math.round((sum / diffs.length) * 10) / 10
}

export function DisenoPageContent() {
    const [requests, setRequests] = useState<DesignRequest[]>(seedRequests)
    const [selected, setSelected] = useState<DesignRequest | null>(null)

    const kpis = useMemo(() => {
        const total = requests.length
        const inProgress = requests.filter(
            (r) => r.stage !== "Backlog" && r.stage !== "Aprobado"
        ).length
        const completed = requests.filter((r) => r.stage === "Aprobado").length
        const pendingReview = requests.filter(
            (r) => r.stage === "Revision interna" || r.stage === "Revision cliente"
        ).length

        const avgTurnaround = calcAvgTurnaroundDays(requests)

        // tasa simple: revisiones promedio vs maxRevisions promedio (en %)
        const revNums = requests.map((r) => ({
            revisions: r.revisions,
            max: r.maxRevisions || 1,
        }))
        const revRate =
            revNums.length === 0
                ? 0
                : Math.round(
                    (revNums.reduce((a, x) => a + x.revisions / x.max, 0) / revNums.length) *
                    100
                )

        return {
            total,
            inProgress,
            completed,
            avgTurnaround,
            pendingReview,
            revisionRate: revRate,
        }
    }, [requests])

    function handleSelect(req: DesignRequest) {
        setSelected(req)
    }

    function handleBack() {
        setSelected(null)
    }

    function handleUpdate(updated: DesignRequest) {
        setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
        setSelected(updated)
    }

    return (
        <div className="flex flex-col gap-6">
            {selected ? (
                <DisenoDetail request={selected} onBack={handleBack} onUpdate={handleUpdate} />
            ) : (
                <>
                    <DisenoKpis
                        totalRequests={kpis.total}
                        inProgress={kpis.inProgress}
                        completed={kpis.completed}
                        avgTurnaround={kpis.avgTurnaround}
                        pendingReview={kpis.pendingReview}
                        revisionRate={kpis.revisionRate}
                    />

                    <DisenoPipeline requests={requests} onSelect={handleSelect} />

                    <DisenoTable
                        requests={requests}
                        setRequests={setRequests}
                        onSelect={handleSelect}
                    />
                </>
            )}
        </div>
    )
}