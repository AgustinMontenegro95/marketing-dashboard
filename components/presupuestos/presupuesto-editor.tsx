"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowLeft, ArrowUp, CircleHelp, Copy, Download, Eye, GripVertical, LibraryBig, Lock, Plus, RotateCcw, Trash2, UserPlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useAccess } from "@/components/auth/session-provider"
import { buscarClientes, crearCliente, type ClienteDto } from "@/lib/clientes"
import {
    crearPresupuesto,
    descargarPresupuestoPdf,
    editarPresupuesto,
    listarPlantillas,
    listarPresupuestos,
    obtenerPresupuesto,
    type ChecklistNotas,
    type ItemInput,
    type PilarInput,
    type PlanInput,
    type PresupuestoDto,
    type PresupuestoInput,
    type PresupuestoPlantillaDto,
} from "@/lib/presupuestos"
import { ItemListEditor } from "./item-editor"
import { ChecklistNotasEditor, checklistDefault } from "./checklist-notas-editor"
import { HorasCoberturaField } from "./horas-cobertura-field"
import { PdfPreviewDialog } from "./pdf-preview-dialog"
import { SectionCard } from "./section-card"
import { BulletListEditor } from "./bullet-list-editor"

/** Numerito de paso, para que se note el orden de los bloques del formulario. */
function NumeroBloque({ n }: { n: number }) {
    return (
        <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
            {n}
        </span>
    )
}

/** Envuelve un botón/ícono con tooltip, siguiendo el estilo del resto de la app. */
function ConTooltip({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
        </Tooltip>
    )
}

type PlanState = PlanInput & { _key: string; _open: boolean; _objetivoModoParrafo: boolean }

/** Payload real que espera el backend — saca los campos que solo existen para la UI del editor. */
function planStateAPlanInput(plan: PlanState): PlanInput {
    const { _key, _open, _objetivoModoParrafo, ...p } = plan
    return p
}

function planDesdeplantilla(p: PresupuestoPlantillaDto): PlanState {
    return {
        _key: crypto.randomUUID(),
        _open: false,
        _objetivoModoParrafo: false,
        plantillaOrigenId: p.id,
        nombre: p.nombreInterno,
        objetivo: p.objetivo,
        precio: p.precioBase,
        incluirEnPdf: true,
        incluyeHorasCobertura: p.incluyeHorasCobertura,
        horasCobertura: p.horasCobertura,
        items: p.items.map((i) => ({
            cantidad: i.cantidad, unidad: i.unidad, frecuencia: i.frecuencia,
            textoManual: i.textoManual, textoManualActivo: i.textoManualActivo,
        })),
    }
}

function planEnBlanco(): PlanState {
    return {
        _key: crypto.randomUUID(), _open: false, _objetivoModoParrafo: false, plantillaOrigenId: null, nombre: "Plan nuevo", objetivo: "", precio: 0,
        incluirEnPdf: true, incluyeHorasCobertura: false, horasCobertura: null, items: [],
    }
}

/** Copia un plan existente como uno nuevo "en blanco" (editable e independiente del original). */
function duplicarPlanState(plan: PlanState): PlanState {
    return {
        ...plan,
        _key: crypto.randomUUID(),
        _open: false,
        plantillaOrigenId: null,
        nombre: `${plan.nombre} (copia)`,
        items: plan.items.map((i) => ({ ...i })),
    }
}

const fmtMoney = (n: number) => `$${n.toLocaleString("es-AR")}`

/** Redacción sugerida de arranque para Enfoque estratégico — editable, se personaliza sola con el nombre del cliente. */
function introDefault(nombreCliente?: string): string {
    const marca = nombreCliente?.trim() || "la marca"
    return `Hoy las redes sociales dejaron de ser únicamente un espacio para mostrar productos o servicios. Se transformaron en una herramienta clave para posicionar la marca, generar confianza y conectar con potenciales clientes.\nDesde CHEMI proponemos una estrategia de comunicación enfocada en fortalecer la presencia digital de ${marca}, generando contenido de valor que la posicione como referente en su rubro y genere nuevas oportunidades comerciales.`
}

function objetivoGeneralDefault(): string {
    return "Generar presencia profesional en redes y despertar el interés de nuevos clientes."
}

function pilaresDefault(): PilarInput[] {
    return [
        { titulo: "Posicionamiento de Marca", descripcion: "Construir reconocimiento y una identidad propia, fortaleciendo la percepción de la marca en su mercado." },
        { titulo: "Contenido de Valor", descripcion: "Generar información útil y relevante que eduque e interese al público objetivo." },
        { titulo: "Comunidad", descripcion: "Construir una comunidad activa e interesada en la marca y sus servicios." },
        { titulo: "Generación de Consultas", descripcion: "Transformar el alcance y la interacción en consultas y oportunidades comerciales concretas." },
    ]
}

function hoyISO(): string {
    return new Date().toISOString().slice(0, 10)
}
function sumarDias(fechaISO: string, dias: number): string {
    const d = new Date(fechaISO + "T00:00:00")
    d.setDate(d.getDate() + dias)
    return d.toISOString().slice(0, 10)
}

export function PresupuestoEditor({ presupuestoId }: { presupuestoId?: number }) {
    const isEdit = !!presupuestoId
    const router = useRouter()
    const { toast } = useToast()
    const access = useAccess()

    const [loading, setLoading] = useState(isEdit)
    const [submitting, setSubmitting] = useState(false)
    const [plantillas, setPlantillas] = useState<PresupuestoPlantillaDto[]>([])

    const [clienteQuery, setClienteQuery] = useState("")
    const [clienteOpciones, setClienteOpciones] = useState<ClienteDto[]>([])
    const [clienteResaltado, setClienteResaltado] = useState(-1)
    const [cliente, setCliente] = useState<ClienteDto | null>(null)
    const [creandoCliente, setCreandoCliente] = useState(false)

    const [fecha, setFecha] = useState(hoyISO())
    const [validaHasta, setValidaHasta] = useState(() => sumarDias(hoyISO(), 14))
    const [validaHastaManual, setValidaHastaManual] = useState(false)

    // Presupuestos anteriores del cliente elegido, para poder partir de uno como base.
    const [presupuestosPrevios, setPresupuestosPrevios] = useState<PresupuestoDto[]>([])
    const [previoDescartado, setPrevioDescartado] = useState(false)
    const [cargandoPrevio, setCargandoPrevio] = useState(false)

    const [categoriaServicio, setCategoriaServicio] = useState("")

    const [enfoqueIntro, setEnfoqueIntro] = useState(() => (isEdit ? "" : introDefault()))
    // Mientras esté en true, la intro sugerida se sigue actualizando sola con el nombre del cliente.
    // Se apaga apenas el usuario la toca a mano, o al cargar datos reales (editar / usar como base).
    const [introEsSugerida, setIntroEsSugerida] = useState(!isEdit)
    const [enfoqueObjetivoGeneral, setEnfoqueObjetivoGeneral] = useState(() => (isEdit ? "" : objetivoGeneralDefault()))
    const [objetivoModoParrafo, setObjetivoModoParrafo] = useState(false)
    const [pilares, setPilares] = useState<PilarInput[]>(() => (isEdit ? [] : pilaresDefault()))
    const [pilarArrastrado, setPilarArrastrado] = useState<number | null>(null)
    const [pilarSobrevolado, setPilarSobrevolado] = useState<number | null>(null)
    const [enfoqueAbierto, setEnfoqueAbierto] = useState(false)

    const [itemsComunes, setItemsComunes] = useState<ItemInput[]>([])
    const [incluyeAbierto, setIncluyeAbierto] = useState(false)

    const [datosAbierto, setDatosAbierto] = useState(true)

    const [planes, setPlanes] = useState<PlanState[]>([])
    const [planesAbierto, setPlanesAbierto] = useState(false)
    const [planArrastrado, setPlanArrastrado] = useState<number | null>(null)
    const [planSobrevolado, setPlanSobrevolado] = useState<number | null>(null)
    const [checklist, setChecklist] = useState<ChecklistNotas>(checklistDefault())
    const [notasAbiertas, setNotasAbiertas] = useState(false)

    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewPayload, setPreviewPayload] = useState<PresupuestoInput | null>(null)

    // Se activa recién después del primer intento de guardar/previsualizar, para no mostrar
    // errores antes de que el usuario haya hecho nada.
    const [intentoValidar, setIntentoValidar] = useState(false)

    useEffect(() => {
        listarPlantillas().then(setPlantillas).catch(() => setPlantillas([]))
    }, [])

    /** Precarga el editor a partir de un presupuesto existente (edición, o "partir del último"). */
    function aplicarDatosPresupuesto(p: PresupuestoDto) {
        setCategoriaServicio(p.categoriaServicio ?? "")
        setEnfoqueIntro(p.enfoqueIntro ?? "")
        setIntroEsSugerida(false)
        setEnfoqueObjetivoGeneral(p.enfoqueObjetivoGeneral ?? "")
        setPilares(p.pilares.map((pi) => ({ titulo: pi.titulo, descripcion: pi.descripcion })))
        setItemsComunes(p.itemsComunes.map((i) => ({
            cantidad: i.cantidad, unidad: i.unidad, frecuencia: i.frecuencia,
            textoManual: i.textoManual, textoManualActivo: i.textoManualActivo,
        })))
        setPlanes(p.planes.map((pl, i) => ({
            _key: crypto.randomUUID(),
            _open: i === 0,
            _objetivoModoParrafo: false,
            plantillaOrigenId: pl.plantillaOrigenId,
            nombre: pl.nombre,
            objetivo: pl.objetivo,
            precio: pl.precio,
            incluirEnPdf: pl.incluirEnPdf,
            incluyeHorasCobertura: pl.incluyeHorasCobertura,
            horasCobertura: pl.horasCobertura,
            items: pl.items.map((it) => ({
                cantidad: it.cantidad, unidad: it.unidad, frecuencia: it.frecuencia,
                textoManual: it.textoManual, textoManualActivo: it.textoManualActivo,
            })),
        })))
        setChecklist(p)
    }

    useEffect(() => {
        if (!isEdit) return
        ;(async () => {
            try {
                setLoading(true)
                const p = await obtenerPresupuesto(presupuestoId!)
                setCliente({ id: p.clienteId, nombre: p.clienteNombre } as ClienteDto)
                setFecha(p.fecha)
                setValidaHasta(p.validaHasta ?? sumarDias(p.fecha, p.validezDias))
                setValidaHastaManual(true)
                aplicarDatosPresupuesto(p)
            } catch (e: any) {
                toast({ title: "Error", description: e?.message ?? "No se pudo cargar el presupuesto", variant: "destructive" })
            } finally {
                setLoading(false)
            }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [presupuestoId])

    // Automatización: "válida hasta" se recalcula sola desde fecha + validez, salvo que se pise a mano.
    useEffect(() => {
        if (validaHastaManual) return
        setValidaHasta(sumarDias(fecha, checklist.validezDias))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fecha, checklist.validezDias])

    // Automatización: la intro sugerida de Enfoque estratégico inserta el nombre del cliente apenas
    // se elige, mientras no se haya tocado a mano.
    useEffect(() => {
        if (!introEsSugerida) return
        setEnfoqueIntro(introDefault(cliente?.nombre))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cliente, introEsSugerida])

    // Automatización: al elegir un cliente existente (creando nuevo), se buscan sus presupuestos
    // anteriores para poder partir de uno como base en vez de armar todo desde cero.
    useEffect(() => {
        if (isEdit || !cliente) { setPresupuestosPrevios([]); return }
        setPrevioDescartado(false)
        listarPresupuestos({ clienteId: cliente.id })
            .then((res) => setPresupuestosPrevios(res.sort((a, b) => (a.fecha < b.fecha ? 1 : -1))))
            .catch(() => setPresupuestosPrevios([]))
    }, [cliente, isEdit])

    async function usarComoBase(p: PresupuestoDto) {
        try {
            setCargandoPrevio(true)
            const completo = await obtenerPresupuesto(p.id)
            aplicarDatosPresupuesto(completo)
            setFecha(hoyISO())
            setValidaHastaManual(false)
            setPrevioDescartado(true)
            toast({ title: "Presupuesto precargado", description: "Revisá los datos antes de guardar." })
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudo cargar el presupuesto anterior", variant: "destructive" })
        } finally {
            setCargandoPrevio(false)
        }
    }

    async function buscarCliente(q: string) {
        setClienteQuery(q)
        setClienteResaltado(-1)
        if (q.trim().length < 2) { setClienteOpciones([]); return }
        try {
            const res = await buscarClientes({ q, estado: null, condicionIva: null, pais: null, page: 0, size: 10 })
            setClienteOpciones(res.contenido)
        } catch {
            setClienteOpciones([])
        }
    }

    /** Navegación por teclado en la lista de sugerencias de cliente (flechas, Enter, Escape). */
    function onKeyDownCliente(e: React.KeyboardEvent<HTMLInputElement>) {
        const mostrarCrear = clienteQuery.trim().length >= 2 && access.canCreate("CLIENTES")
        const totalOpciones = clienteOpciones.length + (mostrarCrear ? 1 : 0)
        if (totalOpciones === 0) return

        if (e.key === "ArrowDown") {
            e.preventDefault()
            setClienteResaltado((prev) => (prev + 1 >= totalOpciones ? 0 : prev + 1))
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setClienteResaltado((prev) => (prev - 1 < 0 ? totalOpciones - 1 : prev - 1))
        } else if (e.key === "Enter") {
            if (clienteResaltado < 0) return
            e.preventDefault()
            if (clienteResaltado < clienteOpciones.length) {
                const elegido = clienteOpciones[clienteResaltado]
                setCliente(elegido); setClienteOpciones([]); setClienteQuery("")
            } else if (mostrarCrear) {
                crearClienteRapido()
            }
        } else if (e.key === "Escape") {
            setClienteOpciones([])
        }
    }

    async function crearClienteRapido() {
        const nombre = clienteQuery.trim()
        if (!nombre) return
        try {
            setCreandoCliente(true)
            const nuevo = await crearCliente({
                nombre,
                razonSocial: null, cuit: null, condicionIva: null,
                direccion: null, localidad: null, provincia: null, cp: null, pais: null,
                notas: null, estado: 1,
            })
            setCliente(nuevo)
            setClienteOpciones([])
            setClienteQuery("")
            toast({ title: "Cliente creado", description: "Podés completar sus datos después desde Clientes." })
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudo crear el cliente", variant: "destructive" })
        } finally {
            setCreandoCliente(false)
        }
    }

    function agregarPlanDesdePlantilla(id: string) {
        const plantilla = plantillas.find((p) => String(p.id) === id)
        if (!plantilla) return
        if (planes.some((p) => p.plantillaOrigenId === plantilla.id)) {
            toast({ title: "Esa plantilla ya está agregada", variant: "warning" })
            return
        }

        // Automatización: el primer plan agregado precarga las notas de la plantilla.
        if (planes.length === 0) {
            setChecklist({
                validezDias: plantilla.validezDias,
                actualizaPrecio: plantilla.actualizaPrecio,
                actualizaPorcentaje: plantilla.actualizaPorcentaje,
                actualizaCadaMeses: plantilla.actualizaCadaMeses,
                incluyePlanificacion: plantilla.incluyePlanificacion,
                planificacionFrecuencia: plantilla.planificacionFrecuencia,
                requiereInfoAnticipada: plantilla.requiereInfoAnticipada,
                incluyeReunionEstrategica: plantilla.incluyeReunionEstrategica,
                reunionFrecuencia: plantilla.reunionFrecuencia,
                pedirLogoVectorizado: plantilla.pedirLogoVectorizado,
                aclararFactura: plantilla.aclararFactura,
                notasLibres: plantilla.notasLibres,
                condicionesPago: plantilla.condicionesPago?.trim() ? plantilla.condicionesPago : checklistDefault().condicionesPago,
            })
        }

        // Automatización: si todavía no se eligió una categoría de servicio, se toma de la primera plantilla usada.
        if (!categoriaServicio.trim() && plantilla.categoriaServicio) {
            setCategoriaServicio(plantilla.categoriaServicio)
        }

        // Automatización: los planes de plantilla se insertan siempre en el orden de precio de las
        // plantillas (Start/Crecimiento/Escala), sin importar en qué orden se hayan ido agregando —
        // no se puede desordenarlos manualmente. Los planes "en blanco" no se tocan, quedan donde estén.
        const idxNueva = plantillas.findIndex((pl) => pl.id === plantilla.id)
        const nuevo = planDesdeplantilla(plantilla)
        setPlanes((prev) => {
            const next = prev.map((p) => ({ ...p, _open: false }))
            let insertarEn = next.length
            for (let i = 0; i < next.length; i++) {
                const origenId = next[i].plantillaOrigenId
                if (origenId == null) continue
                const idxExistente = plantillas.findIndex((pl) => pl.id === origenId)
                if (idxExistente !== -1 && idxExistente > idxNueva) { insertarEn = i; break }
            }
            next.splice(insertarEn, 0, nuevo)
            return next
        })
    }

    function actualizarPlan(key: string, patch: Partial<PlanState>) {
        setPlanes((prev) => prev.map((p) => (p._key === key ? { ...p, ...patch } : p)))
    }

    function quitarPlan(key: string) {
        setPlanes((prev) => prev.filter((p) => p._key !== key))
    }

    function duplicarPlan(i: number) {
        setPlanes((prev) => {
            const next = [...prev.map((p) => ({ ...p, _open: false }))]
            next.splice(i + 1, 0, duplicarPlanState(next[i]))
            return next
        })
    }

    function moverPlan(i: number, dir: -1 | 1) {
        setPlanes((prev) => {
            const j = i + dir
            if (j < 0 || j >= prev.length) return prev
            const next = [...prev]
            ;[next[i], next[j]] = [next[j], next[i]]
            return next
        })
    }
    /** Solo los planes "en blanco" se pueden arrastrar — los de plantilla tienen orden fijo. */
    function moverPlanA(from: number, to: number) {
        setPlanes((prev) => {
            if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev
            if (prev[from].plantillaOrigenId != null) return prev
            const next = [...prev]
            const [item] = next.splice(from, 1)
            next.splice(to, 0, item)
            return next
        })
    }

    function agregarPilar() {
        setPilares((prev) => [...prev, { titulo: "", descripcion: "" }])
    }
    function actualizarPilar(i: number, patch: Partial<PilarInput>) {
        setPilares((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
    }
    function quitarPilar(i: number) {
        setPilares((prev) => prev.filter((_, idx) => idx !== i))
    }
    function moverPilar(i: number, dir: -1 | 1) {
        setPilares((prev) => {
            const j = i + dir
            if (j < 0 || j >= prev.length) return prev
            const next = [...prev]
            ;[next[i], next[j]] = [next[j], next[i]]
            return next
        })
    }
    function moverPilarA(from: number, to: number) {
        setPilares((prev) => {
            if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev
            const next = [...prev]
            const [item] = next.splice(from, 1)
            next.splice(to, 0, item)
            return next
        })
    }

    const plantillasDisponibles = useMemo(() => {
        const usadas = new Set(planes.map((p) => p.plantillaOrigenId).filter((id): id is number => id != null))
        return plantillas.filter((p) => !usadas.has(p.id))
    }, [plantillas, planes])

    // Los planes son opciones alternativas para el cliente (como Start/Crecimiento/Escala), no ítems
    // que se suman — por eso no se muestra ningún precio agregado acá, solo la cantidad.
    const totales = useMemo(() => {
        const incluidos = planes.filter((p) => p.incluirEnPdf)
        return {
            cantidadPlanes: planes.length,
            cantidadIncluidos: incluidos.length,
        }
    }, [planes])

    const notasResumen = `Validez ${checklist.validezDias} día${checklist.validezDias === 1 ? "" : "s"}` +
        (checklist.actualizaPrecio ? ` · Actualiza ${checklist.actualizaPorcentaje ?? 0}% cada ${checklist.actualizaCadaMeses ?? 0} meses` : "")

    function construirPayload(): PresupuestoInput {
        return {
            clienteId: cliente!.id,
            fecha,
            validaHasta,
            categoriaServicio: categoriaServicio.trim() || null,
            enfoqueIntro: enfoqueIntro.trim() || null,
            enfoqueObjetivoGeneral: enfoqueObjetivoGeneral.trim() || null,
            pilares: pilares.filter((p) => p.titulo.trim()),
            itemsComunes,
            planes: planes.map(planStateAPlanInput),
            ...checklist,
        }
    }

    /** Snapshot del estado editable, para detectar cambios sin guardar (no depende de tener cliente elegido). */
    function snapshotActual(): string {
        return JSON.stringify({
            clienteId: cliente?.id ?? null,
            categoriaServicio, fecha, validaHasta,
            enfoqueIntro, enfoqueObjetivoGeneral, pilares,
            itemsComunes, planes: planes.map(planStateAPlanInput),
            checklist,
        })
    }

    const snapshotGuardadoRef = useRef<string | null>(null)
    useEffect(() => {
        if (!loading) snapshotGuardadoRef.current = snapshotActual()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading])

    const hayCambiosSinGuardar = snapshotGuardadoRef.current !== null && snapshotGuardadoRef.current !== snapshotActual()

    const hayCambiosSinGuardarRef = useRef(hayCambiosSinGuardar)
    useEffect(() => {
        hayCambiosSinGuardarRef.current = hayCambiosSinGuardar
    })

    // Se pisa a true justo antes de una recarga ya confirmada por el usuario (ej. "Reiniciar todo"),
    // para no mostrar el aviso nativo del navegador encima de una confirmación que ya dimos nosotros.
    const permitirSalidaRef = useRef(false)

    // Aviso nativo del navegador al cerrar la pestaña / recargar / navegar afuera con cambios sin guardar.
    useEffect(() => {
        function handler(e: BeforeUnloadEvent) {
            if (permitirSalidaRef.current || !hayCambiosSinGuardarRef.current) return
            e.preventDefault()
            e.returnValue = ""
        }
        window.addEventListener("beforeunload", handler)
        return () => window.removeEventListener("beforeunload", handler)
    }, [])

    const [confirmarSalidaAbierto, setConfirmarSalidaAbierto] = useState(false)

    function volverAPresupuestos() {
        if (hayCambiosSinGuardar) { setConfirmarSalidaAbierto(true); return }
        router.push("/presupuestos")
    }

    const [confirmarReinicioAbierto, setConfirmarReinicioAbierto] = useState(false)

    /** Recarga la página: vuelve al estado en blanco (nuevo) o al último guardado (editando), descartando todo lo tipeado. */
    function reiniciarTodo() {
        permitirSalidaRef.current = true
        window.location.reload()
    }

    /** Devuelve true si está todo OK. Si no, marca los errores para que se muestren en la UI. */
    function validar(): boolean {
        setIntentoValidar(true)
        if (!cliente) {
            setDatosAbierto(true)
            toast({ title: "Elegí un cliente", variant: "warning" })
            return false
        }
        if (planes.length === 0) {
            setPlanesAbierto(true)
            toast({ title: "Agregá al menos un plan", variant: "warning" })
            return false
        }
        const planSinPrecio = planes.find((p) => p.incluirEnPdf && (!p.precio || p.precio <= 0))
        if (planSinPrecio) {
            setPlanesAbierto(true)
            setPlanes((prev) => prev.map((p) => ({ ...p, _open: p._key === planSinPrecio._key ? true : p._open })))
            toast({ title: `El plan "${planSinPrecio.nombre || "sin nombre"}" no tiene precio cargado`, variant: "warning" })
            return false
        }
        return true
    }

    async function guardar(): Promise<number | null> {
        if (!validar()) return null

        try {
            setSubmitting(true)
            const payload = construirPayload()

            if (isEdit) {
                await editarPresupuesto(presupuestoId!, payload)
                toast({ title: "Presupuesto actualizado" })
                snapshotGuardadoRef.current = snapshotActual()
                return presupuestoId!
            } else {
                const creado = await crearPresupuesto(payload)
                toast({ title: "Presupuesto creado" })
                snapshotGuardadoRef.current = snapshotActual()
                router.replace(`/presupuestos/editar?id=${creado.id}`)
                return creado.id
            }
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudo guardar", variant: "destructive" })
            return null
        } finally {
            setSubmitting(false)
        }
    }

    async function guardarYDescargar() {
        const id = await guardar()
        if (id) await descargarPresupuestoPdf(id)
    }

    /** Genera el PDF sin guardar nada — se puede usar en cualquier momento mientras se arma el presupuesto. */
    function abrirPreview() {
        if (!validar()) return
        setPreviewPayload(construirPayload())
        setPreviewOpen(true)
    }

    /** Vista previa del PDF con un solo plan (por si querés mandarle a alguien una sola opción). */
    function previsualizarSoloPlan(plan: PlanState) {
        if (!cliente) {
            setDatosAbierto(true)
            toast({ title: "Elegí un cliente", variant: "warning" })
            return
        }
        setPreviewPayload({ ...construirPayload(), planes: [{ ...planStateAPlanInput(plan), incluirEnPdf: true }] })
        setPreviewOpen(true)
    }

    if (loading) {
        return <div className="p-6 flex flex-col gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
    }

    return (
        <TooltipProvider delayDuration={300}>
        <div className="flex flex-col gap-6 p-6 w-full">
            <div className="flex flex-col gap-1">
                <button
                    type="button"
                    onClick={volverAPresupuestos}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit mb-1"
                >
                    <ArrowLeft className="size-4" />
                    Volver a presupuestos
                </button>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {isEdit ? "Editar presupuesto" : "Nuevo presupuesto"}
                        </h1>
                        <ConTooltip label="Ayuda sobre Presupuestos">
                            <Button variant="ghost" size="icon" className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted" asChild>
                                <a href="/presupuestos/nuevo/ayuda" aria-label="Ayuda sobre el editor de presupuestos"><CircleHelp className="size-4" /></a>
                            </Button>
                        </ConTooltip>
                    </div>
                    {planes.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                            {totales.cantidadIncluidos} de {totales.cantidadPlanes} plan{totales.cantidadPlanes === 1 ? "" : "es"} en el PDF
                        </p>
                    )}
                </div>
            </div>

            <Separator />

            {/* Cliente + categoría de servicio */}
            <SectionCard
                title={<><NumeroBloque n={1} /> Datos generales</>}
                summary={cliente ? cliente.nombre : (
                    intentoValidar ? <span className="text-warning">Falta elegir un cliente</span> : "Sin cliente"
                )}
                open={datosAbierto}
                onOpenChange={setDatosAbierto}
            >
            <div className="flex flex-col gap-4">
            <div className="space-y-2">
                <Label>Cliente <span className="text-warning">*</span></Label>
                {cliente ? (
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-sm">{cliente.nombre}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => setCliente(null)}>Cambiar</Button>
                    </div>
                ) : (
                    <div className="relative">
                        <Input
                            value={clienteQuery}
                            onChange={(e) => buscarCliente(e.target.value)}
                            onKeyDown={onKeyDownCliente}
                            placeholder="Buscar cliente…"
                        />
                        {(clienteOpciones.length > 0 || (clienteQuery.trim().length >= 2 && access.canCreate("CLIENTES"))) && (
                            <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-56 overflow-y-auto">
                                {clienteOpciones.map((c, i) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        className={`block w-full text-left px-2 py-1.5 text-sm hover:bg-muted ${clienteResaltado === i ? "bg-muted" : ""}`}
                                        onMouseEnter={() => setClienteResaltado(i)}
                                        onClick={() => { setCliente(c); setClienteOpciones([]); setClienteQuery("") }}
                                    >
                                        {c.nombre}
                                    </button>
                                ))}
                                {clienteQuery.trim().length >= 2 && access.canCreate("CLIENTES") && (
                                    <button
                                        type="button"
                                        className={`flex w-full items-center gap-2 text-left px-2 py-1.5 text-sm text-primary hover:bg-muted border-t disabled:opacity-50 ${clienteResaltado === clienteOpciones.length ? "bg-muted" : ""}`}
                                        onMouseEnter={() => setClienteResaltado(clienteOpciones.length)}
                                        onClick={crearClienteRapido}
                                        disabled={creandoCliente}
                                    >
                                        <UserPlus className="size-3.5 shrink-0" />
                                        {creandoCliente ? "Creando…" : `Crear cliente "${clienteQuery.trim()}"`}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
                <p className="text-xs text-muted-foreground">
                    ¿Todavía no es cliente? Escribí su nombre y creálo al vuelo — después podés completarle los demás datos y trackear sus presupuestos.
                </p>
                {intentoValidar && !cliente && (
                    <p className="text-xs text-warning">Elegí un cliente para poder guardar o previsualizar.</p>
                )}

                {!previoDescartado && presupuestosPrevios.length > 0 && (
                    <div className="rounded-md border border-primary/30 bg-primary/5 p-3 flex items-start justify-between gap-3">
                        <div className="text-xs">
                            <p className="font-medium">
                                {cliente?.nombre} ya tiene {presupuestosPrevios.length} presupuesto{presupuestosPrevios.length === 1 ? "" : "s"} anterior{presupuestosPrevios.length === 1 ? "" : "es"}.
                            </p>
                            <p className="text-muted-foreground">
                                Último: {new Date(presupuestosPrevios[0].fecha).toLocaleDateString("es-AR")} · {presupuestosPrevios[0].planes.length} plan{presupuestosPrevios[0].planes.length === 1 ? "" : "es"}
                            </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <Button size="sm" variant="secondary" className="gap-1.5" disabled={cargandoPrevio} onClick={() => usarComoBase(presupuestosPrevios[0])}>
                                <Copy className="size-3.5" />
                                {cargandoPrevio ? "Cargando…" : "Usar como base"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setPrevioDescartado(true)}>Ignorar</Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label>Categoría de servicio <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Input
                    value={categoriaServicio}
                    onChange={(e) => setCategoriaServicio(e.target.value)}
                    placeholder="Ej: Servicio de RRSS, Marketing Digital"
                />
                <p className="text-xs text-muted-foreground">
                    Se muestra como etiqueta en el encabezado del PDF. Se precarga con la primera plantilla que agregues.
                </p>
            </div>

            <div className="flex flex-wrap gap-4">
                <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="max-w-[180px]" />
                </div>

                <div className="space-y-2">
                    <Label>Válida hasta</Label>
                    <Input
                        type="date"
                        value={validaHasta}
                        onChange={(e) => { setValidaHasta(e.target.value); setValidaHastaManual(true) }}
                        className="max-w-[180px]"
                    />
                    <p className="text-xs text-muted-foreground">
                        Se calcula sola desde la fecha + los días de validez de Notas. Se puede pisar a mano.
                    </p>
                </div>
            </div>
            </div>
            </SectionCard>

            <Separator />

            {/* Enfoque estratégico */}
            <SectionCard
                title={<><NumeroBloque n={2} /> Enfoque estratégico <span className="text-xs text-muted-foreground font-normal">(opcional)</span></>}
                summary={enfoqueIntro.trim() || enfoqueObjetivoGeneral.trim() || pilares.length > 0 ? "Cargado" : "Vacío"}
                open={enfoqueAbierto}
                onOpenChange={setEnfoqueAbierto}
            >
                <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Introducción</Label>
                            {introEsSugerida && <span className="text-xs text-muted-foreground italic">Redacción sugerida — editala libremente</span>}
                        </div>
                        <Textarea
                            value={enfoqueIntro}
                            onChange={(e) => { setEnfoqueIntro(e.target.value); setIntroEsSugerida(false) }}
                            rows={4}
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Objetivos generales</Label>
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button" size="sm" variant={!objetivoModoParrafo ? "secondary" : "ghost"}
                                    className="h-6 px-2 text-xs" onClick={() => setObjetivoModoParrafo(false)}
                                >
                                    Viñetas
                                </Button>
                                <Button
                                    type="button" size="sm" variant={objetivoModoParrafo ? "secondary" : "ghost"}
                                    className="h-6 px-2 text-xs" onClick={() => setObjetivoModoParrafo(true)}
                                >
                                    Párrafo libre
                                </Button>
                            </div>
                        </div>
                        {objetivoModoParrafo ? (
                            <Textarea
                                value={enfoqueObjetivoGeneral}
                                onChange={(e) => setEnfoqueObjetivoGeneral(e.target.value)}
                                placeholder="Ej: Lanzar y posicionar la marca como una nueva referencia, construyendo una identidad reconocible y comercialmente activa desde el primer día."
                                rows={4}
                            />
                        ) : (
                            <BulletListEditor value={enfoqueObjetivoGeneral} onChange={setEnfoqueObjetivoGeneral} placeholder="Ej: Generar presencia y primeras consultas" />
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <Label className="text-xs text-muted-foreground">Pilares</Label>
                    <div className="flex flex-col gap-3">
                        {pilares.map((p, i) => (
                            <div
                                key={i}
                                className={`flex flex-col gap-2 rounded-lg border p-3 transition-opacity ${pilarArrastrado === i ? "opacity-40" : ""} ${pilarSobrevolado === i && pilarArrastrado !== null && pilarArrastrado !== i ? "border-primary ring-2 ring-primary/50" : ""}`}
                                onDragOver={(e) => { e.preventDefault(); setPilarSobrevolado(i) }}
                                onDragLeave={() => setPilarSobrevolado((prev) => (prev === i ? null : prev))}
                                onDrop={(e) => {
                                    e.preventDefault()
                                    if (pilarArrastrado !== null) moverPilarA(pilarArrastrado, i)
                                    setPilarArrastrado(null)
                                    setPilarSobrevolado(null)
                                }}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <ConTooltip label="Arrastrar para reordenar">
                                            <div
                                                className="flex items-center text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
                                                draggable
                                                onDragStart={(e) => { setPilarArrastrado(i); e.dataTransfer.effectAllowed = "move" }}
                                                onDragEnd={() => { setPilarArrastrado(null); setPilarSobrevolado(null) }}
                                            >
                                                <GripVertical className="size-4" />
                                            </div>
                                        </ConTooltip>
                                        <span className="text-xs font-medium text-muted-foreground shrink-0">Pilar {i + 1}</span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <ConTooltip label="Subir pilar">
                                            <Button variant="ghost" size="icon" className="size-7" onClick={() => moverPilar(i, -1)} disabled={i === 0}>
                                                <ArrowUp className="size-3.5" />
                                            </Button>
                                        </ConTooltip>
                                        <ConTooltip label="Bajar pilar">
                                            <Button variant="ghost" size="icon" className="size-7" onClick={() => moverPilar(i, 1)} disabled={i === pilares.length - 1}>
                                                <ArrowDown className="size-3.5" />
                                            </Button>
                                        </ConTooltip>
                                        <ConTooltip label="Borrar pilar">
                                            <Button variant="ghost" size="icon" className="size-7" onClick={() => quitarPilar(i)}>
                                                <Trash2 className="size-3.5 text-destructive" />
                                            </Button>
                                        </ConTooltip>
                                    </div>
                                </div>
                                <Input value={p.titulo} onChange={(e) => actualizarPilar(i, { titulo: e.target.value })} placeholder="Título del pilar" className="font-medium" />
                                <Textarea value={p.descripcion ?? ""} onChange={(e) => actualizarPilar(i, { descripcion: e.target.value })} placeholder="Descripción" rows={2} />
                            </div>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 w-fit" onClick={agregarPilar}>
                        <Plus className="size-3.5" />Agregar pilar
                    </Button>
                </div>
            </SectionCard>

            <Separator />

            {/* Incluye (común a todos los planes) */}
            <SectionCard
                title={<><NumeroBloque n={3} /> Incluye en todos los planes <span className="text-xs text-muted-foreground font-normal">(opcional)</span></>}
                summary={itemsComunes.length > 0 ? `${itemsComunes.length} ítem${itemsComunes.length === 1 ? "" : "s"}` : "Vacío"}
                open={incluyeAbierto}
                onOpenChange={setIncluyeAbierto}
            >
                <p className="text-xs text-muted-foreground -mt-1">
                    Ítems que se repiten en <strong>todos</strong> los planes del presupuesto, así no hace falta cargarlos uno por uno en cada plan.
                    Ej: "Informe mensual de métricas" o "Reunión de seguimiento mensual".
                </p>
                <p className="text-xs text-muted-foreground -mt-1">
                    En el PDF aparecen bajo <em>"Incluye en todos los planes:"</em> arriba del <em>"Incluye:"</em> propio de cada plan, en la página de cada uno — no como una lista aparte.
                </p>
                <ItemListEditor items={itemsComunes} onChange={setItemsComunes} />
            </SectionCard>

            <Separator />

            {/* Planes */}
            <SectionCard
                title={<><NumeroBloque n={4} /> Planes</>}
                summary={planes.length > 0
                    ? `${totales.cantidadIncluidos} de ${totales.cantidadPlanes} plan${totales.cantidadPlanes === 1 ? "" : "es"} en el PDF`
                    : (intentoValidar ? <span className="text-warning">Falta agregar al menos un plan</span> : "Sin planes todavía")}
                open={planesAbierto}
                onOpenChange={setPlanesAbierto}
                actions={
                    <div className="flex items-center gap-2">
                        <Select key={planes.length} onValueChange={agregarPlanDesdePlantilla} disabled={plantillasDisponibles.length === 0}>
                            <SelectTrigger className="h-8 w-[280px] text-xs">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <LibraryBig className="size-3.5 text-muted-foreground shrink-0" />
                                    <SelectValue className="truncate" placeholder={plantillasDisponibles.length === 0 && plantillas.length > 0 ? "Ya agregaste todas" : "Agregar desde plantilla…"} />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                {plantillasDisponibles.map((p) => (
                                    <SelectItem key={p.id} value={String(p.id)}>
                                        {p.nombreInterno} (${p.precioBase.toLocaleString("es-AR")} · actualizado {new Date(p.precioActualizadoEn).toLocaleDateString("es-AR")})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setPlanes((prev) => [...prev.map((p) => ({ ...p, _open: false })), planEnBlanco()])}>
                            <Plus className="size-3.5" />En blanco
                        </Button>
                    </div>
                }
            >
                {planes.length === 0 && (
                    <p className={`text-sm py-6 text-center border rounded-lg ${intentoValidar ? "text-warning border-warning/40" : "text-muted-foreground"}`}>
                        Agregá al menos un plan (desde una plantilla o en blanco).
                    </p>
                )}

                {planes.map((plan, i) => (
                    <div
                        key={plan._key}
                        className={`rounded-lg transition-opacity ${planArrastrado === i ? "opacity-40" : ""} ${planSobrevolado === i && planArrastrado !== null && planArrastrado !== i ? "ring-2 ring-primary/50" : ""}`}
                        onDragOver={(e) => { if (planArrastrado !== null) { e.preventDefault(); setPlanSobrevolado(i) } }}
                        onDragLeave={() => setPlanSobrevolado((prev) => (prev === i ? null : prev))}
                        onDrop={(e) => {
                            e.preventDefault()
                            if (planArrastrado !== null) moverPlanA(planArrastrado, i)
                            setPlanArrastrado(null)
                            setPlanSobrevolado(null)
                        }}
                    >
                    <SectionCard
                        title={plan.nombre || "Plan sin nombre"}
                        summary={`${fmtMoney(plan.precio || 0)} · ${plan.items.length} ítem${plan.items.length === 1 ? "" : "s"}${plan.incluirEnPdf ? "" : " · fuera del PDF"}`}
                        open={plan._open}
                        onOpenChange={(v) => actualizarPlan(plan._key, { _open: v })}
                        actions={
                            <>
                                {plan.plantillaOrigenId == null ? (
                                    <>
                                        <ConTooltip label="Arrastrar para reordenar">
                                            <div
                                                className="flex items-center justify-center size-8 text-muted-foreground cursor-grab active:cursor-grabbing"
                                                draggable
                                                onDragStart={(e) => { setPlanArrastrado(i); e.dataTransfer.effectAllowed = "move" }}
                                                onDragEnd={() => { setPlanArrastrado(null); setPlanSobrevolado(null) }}
                                            >
                                                <GripVertical className="size-4" />
                                            </div>
                                        </ConTooltip>
                                        <ConTooltip label="Subir plan">
                                            <Button variant="ghost" size="icon" className="size-8" onClick={() => moverPlan(i, -1)} disabled={i === 0}>
                                                <ArrowUp className="size-4" />
                                            </Button>
                                        </ConTooltip>
                                        <ConTooltip label="Bajar plan">
                                            <Button variant="ghost" size="icon" className="size-8" onClick={() => moverPlan(i, 1)} disabled={i === planes.length - 1}>
                                                <ArrowDown className="size-4" />
                                            </Button>
                                        </ConTooltip>
                                    </>
                                ) : (
                                    <ConTooltip label="Orden fijo — viene de una plantilla estándar">
                                        <span className="flex items-center justify-center size-8 text-muted-foreground">
                                            <Lock className="size-3.5" />
                                        </span>
                                    </ConTooltip>
                                )}
                                <ConTooltip label="Duplicar plan">
                                    <Button variant="ghost" size="icon" className="size-8" onClick={() => duplicarPlan(i)}>
                                        <Copy className="size-4" />
                                    </Button>
                                </ConTooltip>
                                <ConTooltip label="Borrar plan">
                                    <Button variant="ghost" size="icon" className="size-8" onClick={() => quitarPlan(plan._key)}>
                                        <Trash2 className="size-4 text-destructive" />
                                    </Button>
                                </ConTooltip>
                            </>
                        }
                    >
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Nombre del plan</Label>
                            <Input
                                value={plan.nombre}
                                onChange={(e) => actualizarPlan(plan._key, { nombre: e.target.value })}
                                className="font-medium max-w-md"
                            />
                        </div>

                        <div className="space-y-1 max-w-[200px]">
                            <Label className="text-xs text-muted-foreground">Precio ($)</Label>
                            <Input
                                type="number"
                                value={plan.precio}
                                onChange={(e) => actualizarPlan(plan._key, { precio: Number(e.target.value) || 0 })}
                                className={intentoValidar && (!plan.precio || plan.precio <= 0) ? "border-warning" : ""}
                            />
                            {intentoValidar && (!plan.precio || plan.precio <= 0) && (
                                <p className="text-xs text-warning">Este plan no tiene precio cargado.</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs text-muted-foreground">Objetivos</Label>
                                <div className="flex items-center gap-1">
                                    <Button
                                        type="button" size="sm" variant={!plan._objetivoModoParrafo ? "secondary" : "ghost"}
                                        className="h-6 px-2 text-xs" onClick={() => actualizarPlan(plan._key, { _objetivoModoParrafo: false })}
                                    >
                                        Viñetas
                                    </Button>
                                    <Button
                                        type="button" size="sm" variant={plan._objetivoModoParrafo ? "secondary" : "ghost"}
                                        className="h-6 px-2 text-xs" onClick={() => actualizarPlan(plan._key, { _objetivoModoParrafo: true })}
                                    >
                                        Párrafo libre
                                    </Button>
                                </div>
                            </div>
                            {plan._objetivoModoParrafo ? (
                                <Textarea
                                    value={plan.objetivo ?? ""}
                                    onChange={(e) => actualizarPlan(plan._key, { objetivo: e.target.value })}
                                    placeholder="Ej: generar ventas constantes y un crecimiento real y sostenido para el negocio."
                                    rows={2}
                                />
                            ) : (
                                <BulletListEditor value={plan.objetivo ?? ""} onChange={(v) => actualizarPlan(plan._key, { objetivo: v })} placeholder="Ej: Generar ventas constantes y crecimiento real" />
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Switch checked={plan.incluirEnPdf} onCheckedChange={(v) => actualizarPlan(plan._key, { incluirEnPdf: v })} />
                                <Label className="text-xs cursor-pointer" onClick={() => actualizarPlan(plan._key, { incluirEnPdf: !plan.incluirEnPdf })}>
                                    Incluir en el PDF
                                </Label>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => previsualizarSoloPlan(plan)}>
                                <Eye className="size-3.5" />
                                Vista previa de solo este plan
                            </Button>
                        </div>

                        <ItemListEditor items={plan.items} onChange={(items) => actualizarPlan(plan._key, { items })} />

                        <HorasCoberturaField
                            value={{ incluyeHorasCobertura: plan.incluyeHorasCobertura, horasCobertura: plan.horasCobertura }}
                            onChange={(v) => actualizarPlan(plan._key, v)}
                        />
                    </SectionCard>
                    </div>
                ))}
            </SectionCard>

            <Separator />

            {/* Notas */}
            <SectionCard
                title={<><NumeroBloque n={5} /> Notas</>}
                summary={notasResumen}
                open={notasAbiertas}
                onOpenChange={setNotasAbiertas}
            >
                <ChecklistNotasEditor value={checklist} onChange={setChecklist} />
            </SectionCard>

            <Separator />

            <div className="flex items-center gap-2 sticky bottom-4">
                <Button onClick={() => guardar()} disabled={submitting}>
                    {submitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear presupuesto"}
                </Button>
                <Button variant="outline" className="gap-2" onClick={abrirPreview} disabled={submitting}>
                    <Eye className="size-4" />
                    Vista previa PDF
                </Button>
                <Button variant="outline" className="gap-2" onClick={guardarYDescargar} disabled={submitting}>
                    <Download className="size-4" />
                    Guardar y generar PDF
                </Button>
                <ConTooltip label={isEdit ? "Descarta los cambios y vuelve a la última versión guardada" : "Borra todo lo cargado y empieza de cero"}>
                    <Button variant="ghost" className="gap-2 text-muted-foreground ml-auto" onClick={() => setConfirmarReinicioAbierto(true)} disabled={submitting}>
                        <RotateCcw className="size-4" />
                        Reiniciar
                    </Button>
                </ConTooltip>
            </div>

            <PdfPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} payload={previewPayload} />

            <AlertDialog open={confirmarSalidaAbierto} onOpenChange={setConfirmarSalidaAbierto}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Salir sin guardar?</AlertDialogTitle>
                        <AlertDialogDescription>Tenés cambios sin guardar en este presupuesto. Si salís ahora, se van a perder.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Seguir editando</AlertDialogCancel>
                        <AlertDialogAction onClick={() => router.push("/presupuestos")} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Salir sin guardar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={confirmarReinicioAbierto} onOpenChange={setConfirmarReinicioAbierto}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Reiniciar todo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {isEdit
                                ? "Se van a descartar todos los cambios sin guardar y se va a volver a la última versión guardada de este presupuesto."
                                : "Se va a borrar todo lo cargado (cliente, planes, enfoque, notas) y vas a empezar de cero."}
                            {" "}Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={reiniciarTodo} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Sí, reiniciar todo
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        </TooltipProvider>
    )
}
