"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { ClientsTable } from "./clients-table"
import { ClientDetail } from "./client-detail"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

export type Client = {
  id: string
  name: string
  company: string
  email: string
  phone: string
  plan: "Starter" | "Profesional" | "Enterprise"
  status: "Activo" | "Pausado" | "Finalizado"
  balance: number
  totalPaid: number
  projects: number
  joinedDate: string
  cbu: string
  cuit: string
}

const initialClients: Client[] = [
  {
    id: "CLI-001",
    name: "Martín López",
    company: "Luxe Hotels",
    email: "martin@luxehotels.com",
    phone: "+54 11 4567-8901",
    plan: "Enterprise",
    status: "Activo",
    balance: 12500,
    totalPaid: 86000,
    projects: 4,
    joinedDate: "2024-03-15",
    cbu: "0170099220000067890016",
    cuit: "30-71234567-9",
  },
  {
    id: "CLI-002",
    name: "Laura Fernández",
    company: "PlantaVida Co.",
    email: "laura@plantavida.com",
    phone: "+54 11 5678-1234",
    plan: "Profesional",
    status: "Activo",
    balance: -3200,
    totalPaid: 42000,
    projects: 2,
    joinedDate: "2024-06-20",
    cbu: "0140099220000045670018",
    cuit: "20-32456789-1",
  },
  {
    id: "CLI-003",
    name: "Diego Ramírez",
    company: "FitLife Gym",
    email: "diego@fitlifegym.com",
    phone: "+54 11 6789-2345",
    plan: "Starter",
    status: "Activo",
    balance: 0,
    totalPaid: 8200,
    projects: 1,
    joinedDate: "2025-01-10",
    cbu: "0720099220000023450012",
    cuit: "20-40567891-3",
  },
  {
    id: "CLI-004",
    name: "Sofía Gutiérrez",
    company: "FinTrack Inc.",
    email: "sofia@fintrack.io",
    phone: "+54 11 7890-3456",
    plan: "Enterprise",
    status: "Activo",
    balance: 28000,
    totalPaid: 132000,
    projects: 3,
    joinedDate: "2023-11-05",
    cbu: "0110099220000089010025",
    cuit: "30-72345678-0",
  },
  {
    id: "CLI-005",
    name: "Pablo Méndez",
    company: "CloudBase",
    email: "pablo@cloudbase.tech",
    phone: "+54 11 8901-4567",
    plan: "Profesional",
    status: "Finalizado",
    balance: 0,
    totalPaid: 25600,
    projects: 2,
    joinedDate: "2024-01-22",
    cbu: "0150099220000034560019",
    cuit: "20-35678901-5",
  },
  {
    id: "CLI-006",
    name: "Valentina Torres",
    company: "NeoBank",
    email: "valentina@neobank.ar",
    phone: "+54 11 9012-5678",
    plan: "Starter",
    status: "Activo",
    balance: 6500,
    totalPaid: 6500,
    projects: 1,
    joinedDate: "2025-11-01",
    cbu: "0270099220000056780014",
    cuit: "30-73456789-1",
  },
  {
    id: "CLI-007",
    name: "Andrés Castro",
    company: "DataPulse",
    email: "andres@datapulse.com",
    phone: "+54 11 0123-6789",
    plan: "Enterprise",
    status: "Activo",
    balance: 15200,
    totalPaid: 70400,
    projects: 3,
    joinedDate: "2024-05-18",
    cbu: "0340099220000078900020",
    cuit: "30-74567890-2",
  },
  {
    id: "CLI-008",
    name: "Camila Herrera",
    company: "ShopEasy",
    email: "camila@shopeasy.com",
    phone: "+54 11 1234-7890",
    plan: "Profesional",
    status: "Pausado",
    balance: -1400,
    totalPaid: 18800,
    projects: 2,
    joinedDate: "2024-08-30",
    cbu: "0200099220000012340011",
    cuit: "20-36789012-7",
  },
]

export function ClientsPageContent() {
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newClient, setNewClient] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    plan: "Starter" as Client["plan"],
    cbu: "",
    cuit: "",
  })

  function handleAddClient() {
    const client: Client = {
      id: `CLI-${String(clients.length + 1).padStart(3, "0")}`,
      ...newClient,
      status: "Activo",
      balance: 0,
      totalPaid: 0,
      projects: 0,
      joinedDate: new Date().toISOString().split("T")[0],
    }
    setClients([...clients, client])
    setNewClient({ name: "", company: "", email: "", phone: "", plan: "Starter", cbu: "", cuit: "" })
    setDialogOpen(false)
  }

  if (selectedClient) {
    return (
      <DashboardShell breadcrumb="Clientes">
        <ClientDetail client={selectedClient} onBack={() => setSelectedClient(null)} />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell breadcrumb="Clientes">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona los clientes, sus planes y cuentas corrientes
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
              <DialogDescription>
                Completa los datos del nuevo cliente para registrarlo en el sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    placeholder="Juan Pérez"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={newClient.company}
                    onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                    placeholder="Empresa S.A."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    placeholder="email@empresa.com"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    placeholder="+54 11 1234-5678"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cuit">CUIT</Label>
                  <Input
                    id="cuit"
                    value={newClient.cuit}
                    onChange={(e) => setNewClient({ ...newClient, cuit: e.target.value })}
                    placeholder="20-12345678-9"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="plan">Plan</Label>
                  <Select
                    value={newClient.plan}
                    onValueChange={(val) => setNewClient({ ...newClient, plan: val as Client["plan"] })}
                  >
                    <SelectTrigger id="plan">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Starter">Starter</SelectItem>
                      <SelectItem value="Profesional">Profesional</SelectItem>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cbu">CBU / Cuenta bancaria</Label>
                <Input
                  id="cbu"
                  value={newClient.cbu}
                  onChange={(e) => setNewClient({ ...newClient, cbu: e.target.value })}
                  placeholder="0170099220000067890016"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddClient} disabled={!newClient.name || !newClient.company || !newClient.email}>
                Agregar Cliente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ClientsTable clients={clients} onSelectClient={setSelectedClient} />
    </DashboardShell>
  )
}
