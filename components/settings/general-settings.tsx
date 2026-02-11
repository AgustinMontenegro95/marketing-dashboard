"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export function GeneralSettings() {
  const [companyName, setCompanyName] = useState("Chemi")
  const [email, setEmail] = useState("contacto@chemi.io")
  const [phone, setPhone] = useState("+54 11 4567-0000")
  const [address, setAddress] = useState("Buenos Aires, Argentina")
  const [description, setDescription] = useState("Agencia de Marketing, Diseno y Desarrollo Web")
  const [timezone, setTimezone] = useState("america-buenos-aires")
  const [language, setLanguage] = useState("es")
  const [currency, setCurrency] = useState("ars")

  const handleSave = () => {
    toast.success("Configuracion general guardada correctamente")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informacion de la empresa</CardTitle>
          <CardDescription>Datos basicos de tu organizacion</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nombre de la empresa</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-email">Correo de contacto</Label>
              <Input
                id="company-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-phone">Telefono</Label>
              <Input
                id="company-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-address">Direccion</Label>
              <Input
                id="company-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-description">Descripcion</Label>
            <Textarea
              id="company-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferencias regionales</CardTitle>
          <CardDescription>Configura zona horaria, idioma y moneda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Zona horaria</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="america-buenos-aires">Buenos Aires (GMT-3)</SelectItem>
                  <SelectItem value="america-mexico">Ciudad de Mexico (GMT-6)</SelectItem>
                  <SelectItem value="america-bogota">Bogota (GMT-5)</SelectItem>
                  <SelectItem value="america-santiago">Santiago (GMT-4)</SelectItem>
                  <SelectItem value="europe-madrid">Madrid (GMT+1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Idioma</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Espanol</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="pt">Portugues</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ars">ARS - Peso Argentino</SelectItem>
                  <SelectItem value="usd">USD - Dolar</SelectItem>
                  <SelectItem value="eur">EUR - Euro</SelectItem>
                  <SelectItem value="mxn">MXN - Peso Mexicano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Guardar cambios</Button>
      </div>
    </div>
  )
}
