"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CircleHelp, Edit2, FolderOpen, Plus, Tag, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useAccess } from "@/components/auth/session-provider"
import { Can } from "@/components/auth/can"
import {
    type CategoriaFinancieraNodo,
    type CrearCategoriaReq,
    type EditarCategoriaReq,
    fetchCategoriasArbol,
    crearCategoria,
    editarCategoria,
    toggleCategoriaActiva,
    eliminarCategoria,
} from "@/lib/finanzas"

type DireccionValue = "1" | "2" | "3" | "null"

function DireccionBadge({ d }: { d: 1 | 2 | 3 | null }) {
    if (d === 1) return <Badge className="bg-emerald-900/40 text-emerald-400 border-emerald-700 hover:bg-emerald-900/40">Ingreso</Badge>
    if (d === 2) return <Badge className="bg-red-900/40 text-red-400 border-red-700 hover:bg-red-900/40">Egreso</Badge>
    if (d === 3) return <Badge className="bg-blue-900/40 text-blue-400 border-blue-700 hover:bg-blue-900/40">Transferencia</Badge>
    return <Badge variant="secondary">Cualquiera</Badge>
}

function ActiveBadge({ activa }: { activa: boolean }) {
    if (activa) return <Badge className="bg-emerald-900/40 text-emerald-400 border-emerald-700 hover:bg-emerald-900/40">Activa</Badge>
    return <Badge variant="outline" className="text-muted-foreground">Inactiva</Badge>
}

type CategoriaFormState = {
    nombre: string
    direccionDefecto: DireccionValue
    parentId: string
    activa: boolean
}

type DialogMode = "crear" | "editar"

type DialogState = {
    open: boolean
    mode: DialogMode
    editingId: number | null
    preselectedParentId: number | null
}

function defaultForm(preselectedParentId?: number | null): CategoriaFormState {
    return {
        nombre: "",
        direccionDefecto: "null",
        parentId: preselectedParentId != null ? String(preselectedParentId) : "null",
        activa: true,
    }
}

export default function CategoriasPageClient() {
    const { toast } = useToast()
    const access = useAccess()

    const [arbol, setArbol] = useState<CategoriaFinancieraNodo[]>([])
    const [loading, setLoading] = useState(true)
    const [soloActivas, setSoloActivas] = useState(false)

    const [dialog, setDialog] = useState<DialogState>({
        open: false,
        mode: "crear",
        editingId: null,
        preselectedParentId: null,
    })
    const [form, setForm] = useState<CategoriaFormState>(defaultForm())
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    async function cargarArbol() {
        try {
            setLoading(true)
            const data = await fetchCategoriasArbol(soloActivas ? true : null)
            setArbol(data)
        } catch (e: any) {
            toast({ title: "Error", description: e?.message ?? "No se pudieron cargar las categorías", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!access.canModule("FINANZAS")) return
        cargarArbol()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [soloActivas])

    function openCrear(preselectedParentId?: number | null) {
        setForm(defaultForm(preselectedParentId))
        setSubmitError(null)
        setDialog({ open: true, mode: "crear", editingId: null, preselectedParentId: preselectedParentId ?? null })
    }

    function openEditar(nodo: CategoriaFinancieraNodo, parentId: number | null) {
        setForm({
            nombre: nodo.nombre,
            direccionDefecto: nodo.direccionDefecto != null ? String(nodo.direccionDefecto) as DireccionValue : "null",
            parentId: parentId != null ? String(parentId) : "null",
            activa: nodo.activa,
        })
        setSubmitError(null)
        setDialog({ open: true, mode: "editar", editingId: nodo.id, preselectedParentId: null })
    }

    function closeDialog() {
        setDialog((p) => ({ ...p, open: false }))
        setSubmitError(null)
    }

    async function handleToggle(nodo: CategoriaFinancieraNodo) {
        try {
            await toggleCategoriaActiva(nodo.id, !nodo.activa)
            toast({ title: nodo.activa ? "Categoría desactivada" : "Categoría activada" })
            await cargarArbol()
        } catch (e: any) {
            toast({ title: "Error", description: e?.message, variant: "destructive" })
        }
    }

    async function handleEliminar(nodo: CategoriaFinancieraNodo) {
        try {
            await eliminarCategoria(nodo.id)
            toast({ title: "Categoría desactivada" })
            await cargarArbol()
        } catch (e: any) {
            toast({ title: "Error", description: e?.message, variant: "destructive" })
        }
    }

    async function handleSubmit() {
        if (!form.nombre.trim()) {
            setSubmitError("El nombre es requerido")
            return
        }
        try {
            setSubmitting(true)
            setSubmitError(null)

            const dir = form.direccionDefecto !== "null" ? (Number(form.direccionDefecto) as 1 | 2 | 3) : null
            const parentId = form.parentId !== "null" ? Number(form.parentId) : null

            if (dialog.mode === "crear") {
                const body: CrearCategoriaReq = { nombre: form.nombre.trim(), direccionDefecto: dir, parentId }
                await crearCategoria(body)
                toast({ title: "Categoría creada" })
            } else if (dialog.editingId != null) {
                const body: EditarCategoriaReq = { nombre: form.nombre.trim(), direccionDefecto: dir, parentId, activa: form.activa }
                await editarCategoria(dialog.editingId, body)
                toast({ title: "Categoría actualizada" })
            }

            closeDialog()
            await cargarArbol()
        } catch (e: any) {
            setSubmitError(e?.message ?? "No se pudo guardar la categoría")
        } finally {
            setSubmitting(false)
        }
    }

    const padresDisponibles = arbol

    if (!access.canModule("FINANZAS")) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px] text-muted-foreground">
                No tenés permisos para acceder a este módulo.
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <Link
                        href="/finanzas"
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit mb-1"
                    >
                        <ArrowLeft className="size-4" />
                        Volver a finanzas
                    </Link>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-2xl font-semibold tracking-tight">Categorías</h1>
                        <Button variant="ghost" size="icon" className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted" asChild>
                            <Link href="/finanzas/categorias/ayuda" aria-label="Ayuda sobre Categorías">
                                <CircleHelp className="size-4" />
                            </Link>
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Gestioná las categorías financieras y sus subcategorías.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Can permission="FINANZAS_EDITAR_TODO">
                        <Button className="gap-2" onClick={() => openCrear()}>
                            <Plus className="size-4" />
                            Nueva categoría
                        </Button>
                    </Can>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Switch
                    id="solo-activas"
                    checked={soloActivas}
                    onCheckedChange={setSoloActivas}
                />
                <Label htmlFor="solo-activas" className="text-sm cursor-pointer">
                    Solo activas
                </Label>
            </div>

            {loading ? (
                <div className="flex flex-col gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-lg border bg-card p-4 flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-5 w-5 rounded" />
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-5 w-16" />
                            </div>
                            <div className="pl-8 flex flex-col gap-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-28" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : arbol.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                    <Tag className="size-10 opacity-30" />
                    <p className="text-sm">No hay categorías{soloActivas ? " activas" : ""}.</p>
                    <Can permission="FINANZAS_EDITAR_TODO">
                        <Button variant="outline" className="gap-2" onClick={() => openCrear()}>
                            <Plus className="size-4" />
                            Crear la primera categoría
                        </Button>
                    </Can>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {arbol.map((padre) => (
                        <div key={padre.id} className="rounded-lg border bg-card overflow-hidden">
                            <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
                                <FolderOpen className="size-4 text-muted-foreground shrink-0" />
                                <span className="font-medium text-sm flex-1">{padre.nombre}</span>
                                <DireccionBadge d={padre.direccionDefecto} />
                                <ActiveBadge activa={padre.activa} />
                                <Can permission="FINANZAS_EDITAR_TODO">
                                    <div className="flex items-center gap-1 ml-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-7"
                                            onClick={() => openEditar(padre, null)}
                                        >
                                            <Edit2 className="size-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-7 gap-2"
                                            onClick={() => openCrear(padre.id)}
                                            title="Agregar subcategoría"
                                        >
                                            <Plus className="size-3.5" />
                                        </Button>
                                    </div>
                                </Can>
                            </div>

                            {padre.children.length === 0 ? (
                                <div className="px-4 py-2.5 text-xs text-muted-foreground italic">
                                    Sin subcategorías
                                </div>
                            ) : (
                                <div className="divide-y divide-border/50">
                                    {padre.children.map((hijo) => (
                                        <div key={hijo.id} className="flex items-center gap-3 px-4 py-2.5 pl-10 hover:bg-muted/20 transition-colors">
                                            <Tag className="size-3.5 text-muted-foreground shrink-0" />
                                            <span className="text-sm flex-1">{hijo.nombre}</span>
                                            <DireccionBadge d={hijo.direccionDefecto} />
                                            <ActiveBadge activa={hijo.activa} />
                                            <Can permission="FINANZAS_EDITAR_TODO">
                                                <div className="flex items-center gap-1 ml-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7"
                                                        onClick={() => openEditar(hijo, padre.id)}
                                                    >
                                                        <Edit2 className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7"
                                                        onClick={() => handleToggle(hijo)}
                                                        title={hijo.activa ? "Desactivar" : "Activar"}
                                                    >
                                                        <Trash2 className={`size-3.5 ${hijo.activa ? "text-red-400" : "text-emerald-400"}`} />
                                                    </Button>
                                                </div>
                                            </Can>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={dialog.open} onOpenChange={(v) => { if (!v) closeDialog() }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {dialog.mode === "crear" ? "Nueva categoría" : "Editar categoría"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div className="flex flex-col gap-2">
                            <Label>Nombre</Label>
                            <Input
                                value={form.nombre}
                                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                                placeholder="Ej: Sueldos, Servicios, Ventas"
                                autoFocus
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Dirección por defecto</Label>
                            <Select
                                value={form.direccionDefecto}
                                onValueChange={(v) => setForm((p) => ({ ...p, direccionDefecto: v as DireccionValue }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="null">Cualquiera</SelectItem>
                                    <SelectItem value="1">Ingreso</SelectItem>
                                    <SelectItem value="2">Egreso</SelectItem>
                                    <SelectItem value="3">Transferencia</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label className="flex items-center gap-2">
                                Categoría padre
                                <span className="text-[11px] font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">opcional</span>
                            </Label>
                            <Select
                                value={form.parentId}
                                onValueChange={(v) => setForm((p) => ({ ...p, parentId: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="null">Sin padre (categoría raíz)</SelectItem>
                                    {padresDisponibles
                                        .filter((p) => dialog.editingId == null || p.id !== dialog.editingId)
                                        .map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.nombre}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {dialog.mode === "editar" && (
                            <div className="flex items-center gap-3">
                                <Switch
                                    id="dialog-activa"
                                    checked={form.activa}
                                    onCheckedChange={(v) => setForm((p) => ({ ...p, activa: v }))}
                                />
                                <Label htmlFor="dialog-activa" className="cursor-pointer">Activa</Label>
                            </div>
                        )}
                    </div>

                    {submitError && (
                        <div className="rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-400">
                            {submitError}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog} disabled={submitting}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting || !form.nombre.trim()}>
                            {submitting ? "Guardando…" : dialog.mode === "crear" ? "Crear" : "Guardar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
