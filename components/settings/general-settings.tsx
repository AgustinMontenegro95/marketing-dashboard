"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Lock, Instagram, Linkedin, Facebook, Youtube, Globe, Loader2 } from "lucide-react"
import Image from "next/image"
import { getEmpresaConfig, updateEmpresaConfig, type EmpresaConfig } from "@/lib/empresa-config"

const BRAND_COLOR_NAMES = ["Primario", "Secundario", "Terciario"] as const

function ReadOnlyField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
        {label}
        <Lock className="size-3 text-muted-foreground/60" />
      </Label>
      <p className="text-sm font-medium text-foreground border border-border/50 rounded-md px-3 py-2 bg-muted/30 select-none">
        {value || "—"}
      </p>
    </div>
  )
}

function FieldSkeleton() {
  return <div className="h-9 rounded-md bg-muted animate-pulse" />
}

export function GeneralSettings() {
  const [config, setConfig] = useState<EmpresaConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Campos editables
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [website, setWebsite] = useState("")
  const [description, setDescription] = useState("")

  const [instagram, setInstagram] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [facebook, setFacebook] = useState("")
  const [youtube, setYoutube] = useState("")
  const [tiktok, setTiktok] = useState("")
  const [xTwitter, setXTwitter] = useState("")

  const [razonSocial, setRazonSocial] = useState("")
  const [cuit, setCuit] = useState("")
  const [condicionIva, setCondicionIva] = useState("")
  const [ingresosBrutos, setIngresosBrutos] = useState("")
  const [direccionFiscal, setDireccionFiscal] = useState("")

  const [anioFundacion, setAnioFundacion] = useState("")
  const [cantEmpleados, setCantEmpleados] = useState("")

  const [timezone, setTimezone] = useState("America/Argentina/Buenos_Aires")
  const [language, setLanguage] = useState("es")
  const [currency, setCurrency] = useState("ARS")

  useEffect(() => {
    getEmpresaConfig()
      .then((data) => {
        setConfig(data)
        setEmail(data.emailContacto ?? "")
        setPhone(data.telefono ?? "")
        setAddress(data.direccion ?? "")
        setWebsite(data.sitioWeb ?? "")
        setDescription(data.descripcion ?? "")
        setInstagram(data.instagramUrl ?? "")
        setLinkedin(data.linkedinUrl ?? "")
        setFacebook(data.facebookUrl ?? "")
        setYoutube(data.youtubeUrl ?? "")
        setTiktok(data.tiktokUrl ?? "")
        setXTwitter(data.twitterUrl ?? "")
        setRazonSocial(data.razonSocial ?? "")
        setCuit(data.cuit ?? "")
        setCondicionIva(data.condicionIva ?? "")
        setIngresosBrutos(data.ingresosBrutos ?? "")
        setDireccionFiscal(data.direccionFiscal ?? "")
        setAnioFundacion(data.anioFundacion?.toString() ?? "")
        setCantEmpleados(data.cantidadEmpleados ?? "")
        setTimezone(data.zonaHoraria)
        setLanguage(data.idioma)
        setCurrency(data.moneda)
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "No se pudo cargar la configuración"))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateEmpresaConfig({
        // Identidad de marca: solo lectura en UI, pero requerida por el backend
        nombreMarca: config?.nombreMarca,
        slogan: config?.slogan,
        logoUrl: config?.logoUrl,
        colorPrimario: config?.colorPrimario,
        colorSecundario: config?.colorSecundario,
        colorTerciario: config?.colorTerciario,
        // Campos editables
        emailContacto: email || null,
        telefono: phone || null,
        direccion: address || null,
        sitioWeb: website || null,
        descripcion: description || null,
        instagramUrl: instagram || null,
        linkedinUrl: linkedin || null,
        facebookUrl: facebook || null,
        youtubeUrl: youtube || null,
        tiktokUrl: tiktok || null,
        twitterUrl: xTwitter || null,
        razonSocial: razonSocial || null,
        cuit: cuit || null,
        condicionIva: condicionIva || null,
        ingresosBrutos: ingresosBrutos || null,
        direccionFiscal: direccionFiscal || null,
        anioFundacion: anioFundacion ? parseInt(anioFundacion) : null,
        cantidadEmpleados: cantEmpleados || null,
        zonaHoraria: timezone,
        idioma: language,
        moneda: currency,
      })
      toast.success("Configuración guardada correctamente")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la configuración")
    } finally {
      setSaving(false)
    }
  }

  const brandColors = [
    { name: "Primario", hex: config?.colorPrimario },
    { name: "Secundario", hex: config?.colorSecundario },
    { name: "Terciario", hex: config?.colorTerciario },
  ].filter((c) => c.hex)

  const logoSrc = config?.logoUrl ?? "/brand/logo.jpeg"

  return (
    <div className="space-y-6">

      {/* Identidad de marca — solo lectura */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Identidad de marca
            <Lock className="size-3.5 text-muted-foreground" />
          </CardTitle>
          <CardDescription>Elementos visuales gestionados por el equipo de diseño</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-5">
            <div className="shrink-0 size-20 rounded-xl border border-border overflow-hidden bg-muted">
              {loading ? (
                <div className="size-full animate-pulse bg-muted" />
              ) : (
                <Image
                  src={logoSrc}
                  alt="Logo"
                  width={80}
                  height={80}
                  className="object-cover w-full h-full select-none"
                />
              )}
            </div>
            <div className="flex-1 grid gap-4 sm:grid-cols-2">
              {loading ? (
                <>
                  <div className="space-y-2"><div className="h-4 w-24 rounded bg-muted animate-pulse" /><FieldSkeleton /></div>
                  <div className="space-y-2"><div className="h-4 w-24 rounded bg-muted animate-pulse" /><FieldSkeleton /></div>
                </>
              ) : (
                <>
                  <ReadOnlyField label="Nombre de la marca" value={config?.nombreMarca} />
                  <ReadOnlyField label="Slogan" value={config?.slogan} />
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
              Paleta de colores
              <Lock className="size-3 text-muted-foreground/60" />
            </Label>
            {loading ? (
              <div className="flex gap-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-9 w-36 rounded-md bg-muted animate-pulse" />)}
              </div>
            ) : brandColors.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {brandColors.map((c) => (
                  <div key={c.name} className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-3 py-2">
                    <span
                      className="size-4 rounded-full border border-border shrink-0"
                      style={{ backgroundColor: c.hex! }}
                    />
                    <span className="text-xs font-medium text-foreground">{c.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">{c.hex}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No hay colores configurados</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Información de la empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información de la empresa</CardTitle>
          <CardDescription>Datos de contacto y presentación de tu organización</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company-email">Correo de contacto</Label>
              {loading ? <FieldSkeleton /> : (
                <Input id="company-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={saving} />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-phone">Teléfono</Label>
              {loading ? <FieldSkeleton /> : (
                <Input id="company-phone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={saving} />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-address">Dirección</Label>
              {loading ? <FieldSkeleton /> : (
                <Input id="company-address" value={address} onChange={(e) => setAddress(e.target.value)} disabled={saving} />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-website">Sitio web</Label>
              {loading ? <FieldSkeleton /> : (
                <div className="relative">
                  <Globe className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input id="company-website" value={website} onChange={(e) => setWebsite(e.target.value)} className="pl-9" disabled={saving} />
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-description">Descripción</Label>
            {loading ? <div className="h-20 rounded-md bg-muted animate-pulse" /> : (
              <Textarea id="company-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={saving} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Redes sociales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Redes sociales</CardTitle>
          <CardDescription>Perfiles oficiales de la agencia</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { id: "instagram", label: "Instagram", value: instagram, setter: setInstagram, Icon: Instagram },
              { id: "linkedin", label: "LinkedIn", value: linkedin, setter: setLinkedin, Icon: Linkedin },
              { id: "facebook", label: "Facebook", value: facebook, setter: setFacebook, Icon: Facebook },
              { id: "youtube", label: "YouTube", value: youtube, setter: setYoutube, Icon: Youtube },
            ].map(({ id, label, value, setter, Icon }) => (
              <div key={id} className="space-y-2">
                <Label htmlFor={id}>{label}</Label>
                {loading ? <FieldSkeleton /> : (
                  <div className="relative">
                    <Icon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id={id}
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      placeholder={`https://${id}.com/...`}
                      className="pl-9"
                      disabled={saving}
                    />
                  </div>
                )}
              </div>
            ))}

            <div className="space-y-2">
              <Label htmlFor="tiktok">TikTok</Label>
              {loading ? <FieldSkeleton /> : (
                <div className="relative">
                  <svg className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
                  </svg>
                  <Input id="tiktok" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="https://tiktok.com/@..." className="pl-9" disabled={saving} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="xtwitter">X / Twitter</Label>
              {loading ? <FieldSkeleton /> : (
                <div className="relative">
                  <svg className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <Input id="xtwitter" value={xTwitter} onChange={(e) => setXTwitter(e.target.value)} placeholder="https://x.com/..." className="pl-9" disabled={saving} />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos fiscales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos fiscales</CardTitle>
          <CardDescription>Información tributaria para facturación y documentos legales</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="razon-social">Razón social</Label>
              {loading ? <FieldSkeleton /> : (
                <Input id="razon-social" value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} placeholder="Ej: Chemi S.R.L." disabled={saving} />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cuit">CUIT</Label>
              {loading ? <FieldSkeleton /> : (
                <Input id="cuit" value={cuit} onChange={(e) => setCuit(e.target.value)} placeholder="XX-XXXXXXXX-X" disabled={saving} />
              )}
            </div>
            <div className="space-y-2">
              <Label>Condición frente al IVA</Label>
              {loading ? <FieldSkeleton /> : (
                <Select value={condicionIva} onValueChange={setCondicionIva} disabled={saving}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="responsable-inscripto">Responsable Inscripto</SelectItem>
                    <SelectItem value="monotributista">Monotributista</SelectItem>
                    <SelectItem value="exento">Exento</SelectItem>
                    <SelectItem value="consumidor-final">Consumidor Final</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ingresos-brutos">Ingresos Brutos</Label>
              {loading ? <FieldSkeleton /> : (
                <Input id="ingresos-brutos" value={ingresosBrutos} onChange={(e) => setIngresosBrutos(e.target.value)} placeholder="Nº de inscripción" disabled={saving} />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="direccion-fiscal">Dirección fiscal</Label>
            {loading ? <FieldSkeleton /> : (
              <Input id="direccion-fiscal" value={direccionFiscal} onChange={(e) => setDireccionFiscal(e.target.value)} placeholder="Calle, número, ciudad, provincia" disabled={saving} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Información operativa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información operativa</CardTitle>
          <CardDescription>Contexto sobre el tamaño y el foco de la agencia</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="anio-fundacion">Año de fundación</Label>
              {loading ? <FieldSkeleton /> : (
                <Input id="anio-fundacion" value={anioFundacion} onChange={(e) => setAnioFundacion(e.target.value)} placeholder="Ej: 2018" maxLength={4} disabled={saving} />
              )}
            </div>
            <div className="space-y-2">
              <Label>Cantidad de empleados</Label>
              {loading ? <FieldSkeleton /> : (
                <Select value={cantEmpleados} onValueChange={setCantEmpleados} disabled={saving}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná un rango" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1 – 10</SelectItem>
                    <SelectItem value="11-50">11 – 50</SelectItem>
                    <SelectItem value="51-100">51 – 100</SelectItem>
                    <SelectItem value="101-250">101 – 250</SelectItem>
                    <SelectItem value="250+">Más de 250</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferencias regionales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferencias regionales</CardTitle>
          <CardDescription>Configurá zona horaria, idioma y moneda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Zona horaria</Label>
              {loading ? <FieldSkeleton /> : (
                <Select value={timezone} onValueChange={setTimezone} disabled={saving}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</SelectItem>
                    <SelectItem value="America/Mexico_City">Ciudad de México (GMT-6)</SelectItem>
                    <SelectItem value="America/Bogota">Bogotá (GMT-5)</SelectItem>
                    <SelectItem value="America/Santiago">Santiago (GMT-4)</SelectItem>
                    <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Idioma</Label>
              {loading ? <FieldSkeleton /> : (
                <Select value={language} onValueChange={setLanguage} disabled={saving}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              {loading ? <FieldSkeleton /> : (
                <Select value={currency} onValueChange={setCurrency} disabled={saving}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || loading}>
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}
