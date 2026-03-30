import { apiFetchAuth } from "@/lib/api"

export type EmpresaConfig = {
  // Identidad de marca (solo lectura en UI)
  nombreMarca: string
  slogan: string | null
  logoUrl: string | null
  colorPrimario: string | null
  colorSecundario: string | null
  colorTerciario: string | null

  // Información general
  emailContacto: string | null
  telefono: string | null
  direccion: string | null
  sitioWeb: string | null
  descripcion: string | null

  // Redes sociales
  instagramUrl: string | null
  linkedinUrl: string | null
  facebookUrl: string | null
  youtubeUrl: string | null
  tiktokUrl: string | null
  twitterUrl: string | null

  // Datos fiscales
  razonSocial: string | null
  cuit: string | null
  condicionIva: string | null
  ingresosBrutos: string | null
  direccionFiscal: string | null

  // Información operativa
  anioFundacion: number | null
  cantidadEmpleados: string | null

  // Preferencias regionales
  zonaHoraria: string
  idioma: string
  moneda: string
}

export type EmpresaConfigUpdate = Partial<EmpresaConfig>

// Cache de sesión: vive mientras el tab está abierto, se invalida al guardar
let sessionCache: EmpresaConfig | null = null

export async function getEmpresaConfig(): Promise<EmpresaConfig> {
  if (sessionCache) return sessionCache

  const r = await apiFetchAuth<EmpresaConfig>("/api/v1/empresa/config")
  if (!r.estado || !r.datos) {
    throw new Error(r.error_mensaje ?? "No se pudo obtener la configuración")
  }
  sessionCache = r.datos
  return sessionCache
}

export async function updateEmpresaConfig(data: EmpresaConfigUpdate): Promise<void> {
  const r = await apiFetchAuth("/api/v1/empresa/config", {
    method: "PATCH",
    body: data,
  })
  if (!r.estado) {
    throw new Error(r.error_mensaje ?? "No se pudo guardar la configuración")
  }
  sessionCache = null // invalida cache para forzar re-fetch
}
