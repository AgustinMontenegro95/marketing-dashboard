"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Mail, Phone, MapPin, Calendar, Pencil } from "lucide-react"

export function ProfileInfo() {
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState({
    name: "Admin",
    initials: "AD",
    email: "admin@chemi.io",
    phone: "+54 11 4567-0000",
    location: "Buenos Aires, Argentina",
    role: "Administrador",
    department: "Direccion",
    joinedDate: "Enero 2023",
    bio: "Administrador general de la plataforma Chemi. Responsable de la gestion integral de proyectos, equipo y operaciones de la agencia.",
  })

  const [editForm, setEditForm] = useState(profile)

  const handleSave = () => {
    setProfile(editForm)
    setOpen(false)
    toast.success("Perfil actualizado correctamente")
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <Avatar className="size-20 shrink-0">
            <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
              {profile.initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{profile.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                    {profile.role}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {profile.department}
                  </Badge>
                </div>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setEditForm(profile)}
                  >
                    <Pencil className="size-3.5" />
                    Editar perfil
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Editar perfil</DialogTitle>
                    <DialogDescription>Actualiza tu informacion personal</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Nombre completo</Label>
                      <Input
                        id="edit-name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Correo electronico</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Telefono</Label>
                      <Input
                        id="edit-phone"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-location">Ubicacion</Label>
                      <Input
                        id="edit-location"
                        value={editForm.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-bio">Biografia</Label>
                      <Textarea
                        id="edit-bio"
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSave}>Guardar cambios</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              {profile.bio}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Mail className="size-3.5" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="size-3.5" />
                <span>{profile.phone}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                <span>{profile.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                <span>Desde {profile.joinedDate}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
