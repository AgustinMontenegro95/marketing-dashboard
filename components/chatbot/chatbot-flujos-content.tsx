"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft, Play, MessageSquare, GitBranch, Zap, Square, Plus, Trash2,
  ChevronRight, CheckCircle2, Circle, Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { type FlowNode, type BotFlow } from "@/lib/api/chatbot"
import { useFlows } from "@/lib/hooks/use-chatbot"
import Link from "next/link"
import { toast } from "sonner"

// ─── node config ─────────────────────────────────────────────────────────────

type NodeType = FlowNode["type"]

const NODE_CONFIG: Record<NodeType, {
  label: string
  icon: React.ElementType
  bg: string
  border: string
  text: string
  defaultLabel: string
  defaultContent: string
}> = {
  start:     { label: "Inicio",     icon: Play,         bg: "bg-emerald-100 dark:bg-emerald-950/30", border: "border-emerald-400 dark:border-emerald-600", text: "text-emerald-700 dark:text-emerald-400", defaultLabel: "Inicio", defaultContent: "Punto de entrada del flujo" },
  message:   { label: "Mensaje",    icon: MessageSquare, bg: "bg-blue-100 dark:bg-blue-950/30",     border: "border-blue-400 dark:border-blue-600",     text: "text-blue-700 dark:text-blue-400",     defaultLabel: "Nuevo mensaje", defaultContent: "" },
  condition: { label: "Condición",  icon: GitBranch,    bg: "bg-amber-100 dark:bg-amber-950/30",    border: "border-amber-400 dark:border-amber-600",    text: "text-amber-700 dark:text-amber-400",    defaultLabel: "Nueva condición", defaultContent: "Según la respuesta del usuario" },
  action:    { label: "Acción",     icon: Zap,          bg: "bg-violet-100 dark:bg-violet-950/30",  border: "border-violet-400 dark:border-violet-600",  text: "text-violet-700 dark:text-violet-400",  defaultLabel: "Nueva acción", defaultContent: "" },
  end:       { label: "Fin",        icon: Square,       bg: "bg-gray-100 dark:bg-gray-800/40",       border: "border-gray-300 dark:border-gray-600",      text: "text-gray-600 dark:text-gray-400",      defaultLabel: "Fin", defaultContent: "Conversación finalizada" },
}

// ─── tree helpers ─────────────────────────────────────────────────────────────

function updateNode(root: FlowNode, id: string, updates: Partial<FlowNode>): FlowNode {
  if (root.id === id) return { ...root, ...updates }
  return { ...root, children: root.children.map((c) => updateNode(c, id, updates)) }
}

function addChildNode(root: FlowNode, parentId: string, newNode: FlowNode): FlowNode {
  if (root.id === parentId) return { ...root, children: [...root.children, newNode] }
  return { ...root, children: root.children.map((c) => addChildNode(c, parentId, newNode)) }
}

function deleteNode(root: FlowNode, id: string): FlowNode {
  return {
    ...root,
    children: root.children
      .filter((c) => c.id !== id)
      .map((c) => deleteNode(c, id)),
  }
}

function countNodes(node: FlowNode): number {
  return 1 + node.children.reduce((a, c) => a + countNodes(c), 0)
}

function makeNode(type: NodeType): FlowNode {
  const cfg = NODE_CONFIG[type]
  return {
    id: `n${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    label: cfg.defaultLabel,
    content: cfg.defaultContent,
    children: [],
  }
}

// ─── node card ────────────────────────────────────────────────────────────────

function FlowCard({ node, selected, onClick }: { node: FlowNode; selected: boolean; onClick: () => void }) {
  const cfg = NODE_CONFIG[node.type]
  const Icon = cfg.icon
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-44 rounded-xl border-2 p-3 text-left transition-all shadow-sm hover:shadow-md cursor-pointer",
        cfg.bg,
        selected ? "border-primary ring-2 ring-primary/20" : cfg.border,
      )}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={cn("size-3.5 shrink-0", cfg.text)} />
        <span className={cn("text-[10px] font-bold uppercase tracking-wide", cfg.text)}>{cfg.label}</span>
      </div>
      <p className="text-xs font-medium text-foreground leading-snug truncate">{node.label}</p>
      {node.content && node.type !== "start" && (
        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-snug">{node.content}</p>
      )}
      {node.conditionLabel && (
        <span className="inline-block mt-1 text-[9px] bg-background/60 border rounded px-1 py-0.5 font-mono text-muted-foreground">
          {node.conditionLabel}
        </span>
      )}
    </button>
  )
}

// ─── add node picker ──────────────────────────────────────────────────────────

function AddNodePicker({ onAdd, onCancel }: { onAdd: (type: NodeType) => void; onCancel: () => void }) {
  const types: NodeType[] = ["message", "condition", "action", "end"]
  return (
    <div className="flex flex-col items-center gap-1 border-2 border-dashed border-primary/40 rounded-xl p-3 bg-primary/5 w-44">
      <p className="text-[10px] font-semibold text-muted-foreground mb-1">Elegir tipo de paso</p>
      {types.map((t) => {
        const cfg = NODE_CONFIG[t]
        const Icon = cfg.icon
        return (
          <button
            key={t}
            onClick={() => onAdd(t)}
            className={cn("w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-background/60 cursor-pointer transition-colors", cfg.text)}
          >
            <Icon className="size-3.5 shrink-0" />
            <span className="text-xs font-medium">{cfg.label}</span>
          </button>
        )
      })}
      <button onClick={onCancel} className="text-[10px] text-muted-foreground hover:text-foreground mt-1 cursor-pointer">Cancelar</button>
    </div>
  )
}

// ─── tree renderer ────────────────────────────────────────────────────────────

interface TreeNodeViewProps {
  node: FlowNode
  selectedId: string | null
  addingTo: string | null
  onSelect: (node: FlowNode) => void
  onSetAdding: (id: string | null) => void
  onAddChild: (parentId: string, type: NodeType) => void
}

function TreeNodeView({ node, selectedId, addingTo, onSelect, onSetAdding, onAddChild }: TreeNodeViewProps) {
  const isSelected = node.id === selectedId
  const hasChildren = node.children.length > 0
  const isMulti = node.children.length > 1
  const showAddPicker = addingTo === node.id
  const canAdd = node.type !== "end" && !hasChildren

  return (
    <div className="flex flex-col items-center">
      <FlowCard node={node} selected={isSelected} onClick={() => onSelect(node)} />

      {hasChildren && (
        <>
          <div className="w-px h-5 bg-border/70" />
          {isMulti ? (
            <div className="relative flex gap-3">
              {/* horizontal bar */}
              <div className="absolute top-0 left-0 right-0 h-px bg-border/70" />
              {node.children.map((child) => (
                <div key={child.id} className="flex flex-col items-center">
                  <div className="w-px h-5 bg-border/70" />
                  <TreeNodeView
                    node={child} selectedId={selectedId} addingTo={addingTo}
                    onSelect={onSelect} onSetAdding={onSetAdding} onAddChild={onAddChild}
                  />
                </div>
              ))}
            </div>
          ) : (
            <TreeNodeView
              node={node.children[0]} selectedId={selectedId} addingTo={addingTo}
              onSelect={onSelect} onSetAdding={onSetAdding} onAddChild={onAddChild}
            />
          )}
        </>
      )}

      {canAdd && (
        <>
          <div className="w-px h-4 bg-border/40" />
          {showAddPicker ? (
            <AddNodePicker
              onAdd={(type) => { onAddChild(node.id, type); onSetAdding(null) }}
              onCancel={() => onSetAdding(null)}
            />
          ) : (
            <button
              onClick={() => onSetAdding(node.id)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-primary rounded-lg px-3 py-1.5 transition-colors cursor-pointer hover:bg-muted/40"
            >
              <Plus className="size-3" /> Agregar paso
            </button>
          )}
        </>
      )}

      {/* Add branch option for condition nodes */}
      {node.type === "condition" && (
        <div className="mt-2">
          <button
            onClick={() => onSetAdding(`branch_${node.id}`)}
            className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
          >
            + Agregar rama
          </button>
          {addingTo === `branch_${node.id}` && (
            <div className="mt-1">
              <AddBranchInput
                onAdd={(label, type) => { onAddChild(node.id, type); onSetAdding(null) }}
                onCancel={() => onSetAdding(null)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AddBranchInput({ onAdd, onCancel }: { onAdd: (label: string, type: NodeType) => void; onCancel: () => void }) {
  const [label, setLabel] = useState("")
  const [type, setType] = useState<NodeType>("message")
  return (
    <div className="border rounded-lg p-2 bg-card w-44 space-y-1.5">
      <Input placeholder="Ej: &quot;1&quot; o &quot;precio&quot;" value={label} onChange={(e) => setLabel(e.target.value)} className="h-7 text-xs" />
      <select value={type} onChange={(e) => setType(e.target.value as NodeType)} className="w-full text-xs border rounded px-1.5 py-1 bg-background">
        {(["message", "action", "end"] as NodeType[]).map((t) => (
          <option key={t} value={t}>{NODE_CONFIG[t].label}</option>
        ))}
      </select>
      <div className="flex gap-1">
        <Button size="sm" className="flex-1 h-6 text-xs" onClick={() => onAdd(label, type)}>Agregar</Button>
        <Button size="sm" variant="ghost" className="flex-1 h-6 text-xs" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  )
}

// ─── edit panel ───────────────────────────────────────────────────────────────

function EditPanel({ node, onUpdate, onDelete }: {
  node: FlowNode
  onUpdate: (id: string, updates: Partial<FlowNode>) => void
  onDelete: (id: string) => void
}) {
  const cfg = NODE_CONFIG[node.type]
  const Icon = cfg.icon
  const isDeletable = node.type !== "start"

  return (
    <div className="w-64 shrink-0 flex flex-col gap-4 border-l bg-card p-4 overflow-y-auto">
      <div>
        <div className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold mb-3", cfg.bg, cfg.text)}>
          <Icon className="size-3.5" />{cfg.label}
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Etiqueta</label>
            <Input
              value={node.label}
              onChange={(e) => onUpdate(node.id, { label: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          {node.type !== "start" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                {node.type === "message" ? "Texto del mensaje" :
                 node.type === "condition" ? "Descripción de la condición" :
                 node.type === "action" ? "Descripción de la acción" : "Nota"}
              </label>
              <textarea
                value={node.content}
                onChange={(e) => onUpdate(node.id, { content: e.target.value })}
                rows={4}
                className="w-full text-sm border rounded-md px-3 py-2 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}
          {node.conditionLabel !== undefined && (
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Condición de entrada</label>
              <Input
                value={node.conditionLabel ?? ""}
                onChange={(e) => onUpdate(node.id, { conditionLabel: e.target.value })}
                placeholder="Ej: &quot;1&quot; o &quot;precio&quot;"
                className="h-8 text-sm font-mono"
              />
            </div>
          )}
        </div>
      </div>

      {isDeletable && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-destructive border-destructive/50 hover:bg-destructive/10 cursor-pointer mt-auto"
          onClick={() => { if (confirm("¿Eliminar este nodo y todos sus hijos?")) onDelete(node.id) }}
        >
          <Trash2 className="size-3.5" /> Eliminar nodo
        </Button>
      )}
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export function ChatbotFluijosContent() {
  const { flows, setFlows, toggle: toggleFlowActive, update: updateFlowApi, create: createFlowApi, loading } = useFlows()
  const [selectedFlowId, setSelectedFlowId] = useState<string>("")
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (flows.length > 0 && !selectedFlowId) setSelectedFlowId(flows[0]?.id ?? "")
  }, [flows, selectedFlowId])

  const selectedFlow = flows.find((f) => f.id === selectedFlowId) ?? null
  const selectedNode = selectedFlow ? findNode(selectedFlow.root, selectedNodeId) : null

  function findNode(root: FlowNode, id: string | null): FlowNode | null {
    if (!id) return null
    if (root.id === id) return root
    for (const c of root.children) {
      const found = findNode(c, id)
      if (found) return found
    }
    return null
  }

  function updateLocalFlow(updater: (f: BotFlow) => BotFlow) {
    setFlows((prev) => prev.map((f) => f.id === selectedFlowId ? updater(f) : f))
  }

  function handleUpdateNode(id: string, updates: Partial<FlowNode>) {
    updateLocalFlow((f) => ({ ...f, root: updateNode(f.root, id, updates) }))
  }

  function handleAddChild(parentId: string, type: NodeType) {
    const newNode = makeNode(type)
    updateLocalFlow((f) => ({ ...f, root: addChildNode(f.root, parentId, newNode) }))
    setSelectedNodeId(newNode.id)
    toast.success(`Nodo "${NODE_CONFIG[type].label}" agregado`)
  }

  function handleDeleteNode(id: string) {
    updateLocalFlow((f) => ({ ...f, root: deleteNode(f.root, id) }))
    setSelectedNodeId(null)
    toast.success("Nodo eliminado")
  }

  async function handleToggleActive(flowId: string) {
    const flow = flows.find((f) => f.id === flowId)
    if (!flow) return
    try {
      await toggleFlowActive(flowId, !flow.active)
    } catch {
      toast.error("No se pudo cambiar el estado del flujo")
    }
  }

  async function handleSaveFlow() {
    if (!selectedFlow) return
    setSaving(true)
    try {
      await updateFlowApi(selectedFlow.id, selectedFlow)
      toast.success("Flujos guardados")
    } catch {
      toast.error("No se pudieron guardar los cambios")
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateFlow() {
    const newFlow: Omit<BotFlow, "id"> = {
      name: "Nuevo flujo",
      active: false,
      description: "",
      root: makeNode("start"),
    }
    try {
      const created = await createFlowApi(newFlow)
      setSelectedFlowId(created.id)
      setSelectedNodeId(null)
    } catch {
      toast.error("No se pudo crear el flujo")
    }
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 120px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-7 -ml-1 cursor-pointer" asChild>
              <Link href="/chatbot"><ArrowLeft className="size-4" /></Link>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Flujos del Bot</h1>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground ml-8">Editor visual de flujos de conversación</p>
        </div>
        <Button size="sm" className="gap-1.5 cursor-pointer" onClick={handleSaveFlow} disabled={saving}>
          <CheckCircle2 className="size-3.5" /> {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>

      <div className="flex flex-1 gap-0 border rounded-lg overflow-hidden min-h-0">
        {/* Flow list */}
        <div className="w-56 shrink-0 border-r flex flex-col bg-background">
          <div className="p-3 border-b flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Flujos</p>
            <button
              onClick={handleCreateFlow}
              className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {flows.map((flow) => (
              <button
                key={flow.id}
                onClick={() => { setSelectedFlowId(flow.id); setSelectedNodeId(null) }}
                className={cn(
                  "w-full text-left px-3 py-3 border-b border-border/50 hover:bg-muted/40 transition-colors cursor-pointer",
                  selectedFlowId === flow.id && "bg-muted"
                )}
              >
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-sm font-medium truncate">{flow.name}</span>
                  <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-1.5 py-0.5 border",
                    flow.active
                      ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
                      : "text-gray-500 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  )}>
                    <Circle className={cn("size-1.5 fill-current", flow.active ? "text-emerald-500" : "text-gray-400")} />
                    {flow.active ? "Activo" : "Inactivo"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{countNodes(flow.root)} nodos</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-muted/20 relative">
          {selectedFlow ? (
            <div className="min-h-full flex flex-col items-center py-8 px-6">
              {/* Flow header */}
              <div className="w-full max-w-2xl mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      value={selectedFlow.name}
                      onChange={(e) => updateLocalFlow((f) => ({ ...f, name: e.target.value }))}
                      className="text-base font-semibold bg-transparent border-none outline-none focus:underline"
                    />
                    <p className="text-xs text-muted-foreground">{selectedFlow.description || "Sin descripción"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={selectedFlow.active ? "default" : "secondary"}
                    className="cursor-pointer select-none"
                    onClick={() => handleToggleActive(selectedFlow.id)}
                  >
                    {selectedFlow.active ? "Activo" : "Inactivo"}
                  </Badge>
                  <button className="text-muted-foreground hover:text-foreground cursor-pointer">
                    <Pencil className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Tree */}
              <TreeNodeView
                node={selectedFlow.root}
                selectedId={selectedNodeId}
                addingTo={addingTo}
                onSelect={(n) => setSelectedNodeId(selectedNodeId === n.id ? null : n.id)}
                onSetAdding={setAddingTo}
                onAddChild={handleAddChild}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">Seleccioná un flujo</p>
            </div>
          )}
        </div>

        {/* Edit panel */}
        {selectedNode && (
          <EditPanel
            node={selectedNode}
            onUpdate={handleUpdateNode}
            onDelete={handleDeleteNode}
          />
        )}
      </div>
    </div>
  )
}
