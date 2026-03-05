import { apiFetchAuth } from "@/lib/api"

export type IdNombreDto = {
    id: number
    nombre: string
    descripcion?: string | null
}

export type TipoEmpleoDto = {
    id: 1 | 2 | 3
    nombre: string
}

export type CuentaInfo = {
    id: number
    nombre: string
    apellido: string
    fechaNacimiento: string | null
    dni: string | null
    cuilCuit: string | null
    email: string
    telefono: string | null

    biografia: string | null
    pais: string | null
    provinciaEstado: string | null
    ciudad: string | null
    codigoPostal: string | null
    direccionLinea1: string | null
    direccionLinea2: string | null

    urlImagenPerfil: string | null

    tipoEmpleo: TipoEmpleoDto | null
    disciplina: IdNombreDto | null
    puesto: IdNombreDto | null

    fechaIngreso: string | null
    salarioMensual: number | null
    tarifaHora: number | null

    ultimoLoginEn: string | null
    creadoEn: string
    actualizadoEn: string

    activo: boolean
    roles: string[]
}

type Envelope<T> = {
    estado: boolean
    error_mensaje: string | null
    datos: T | null
}

// ✅ cache en memoria (vive mientras la app esté abierta)
let cuentaInfoCache: CuentaInfo | null = null
let cuentaInfoInflight: Promise<CuentaInfo> | null = null

export function clearCuentaInfoCache() {
    cuentaInfoCache = null
    cuentaInfoInflight = null
}

export async function fetchCuentaInfo(opts?: { force?: boolean }): Promise<CuentaInfo> {
    const force = opts?.force === true

    if (!force && cuentaInfoCache) return cuentaInfoCache
    if (!force && cuentaInfoInflight) return cuentaInfoInflight

    cuentaInfoInflight = (async () => {
        const r = (await apiFetchAuth<CuentaInfo>("/api/v1/cuenta/info", { method: "GET" })) as Envelope<CuentaInfo>

        if (!r.estado || !r.datos) {
            throw new Error(r.error_mensaje ?? "No se pudo cargar la información de la cuenta")
        }

        cuentaInfoCache = r.datos
        return r.datos
    })()

    try {
        return await cuentaInfoInflight
    } finally {
        cuentaInfoInflight = null
    }
}