import { apiFetchAuth } from "@/lib/api"

export type PageResponse<T> = {
    contenido: T[]
    page: number
    size: number
    totalElementos: number
    totalPaginas: number
}

export type ClienteDto = {
    id: number
    codigo: string
    nombre: string
    razonSocial: string | null
    cuit: string | null
    condicionIva: number | null
    direccion: string | null
    localidad: string | null
    provincia: string | null
    cp: string | null
    pais: string | null
    notas: string | null
    estado: number
}

export type BuscarClientesReq = {
    q: string | null
    estado: number | null
    condicionIva: number | null
    pais: string | null
    page: number
    size: number
}

export type CrearClienteReq = {
    nombre: string
    razonSocial: string | null
    cuit: string | null
    condicionIva: number | null
    direccion: string | null
    localidad: string | null
    provincia: string | null
    cp: string | null
    pais: string | null
    notas: string | null
    estado: number
}

export type ActualizarClienteReq = Partial<CrearClienteReq>

export type ClienteContactoDto = {
    id: number
    clienteId: number
    nombre: string
    email: string | null
    telefono: string | null
    cargo: string | null
    esPrincipal: boolean
    notas: string | null
    creadoEn: string | null
}

export type CrearClienteContactoReq = {
    nombre: string
    email: string | null
    telefono: string | null
    cargo: string | null
    esPrincipal: boolean
    notas: string | null
}

export type ActualizarClienteContactoReq = Partial<CrearClienteContactoReq>

export async function buscarClientes(body: BuscarClientesReq): Promise<PageResponse<ClienteDto>> {
    const r = await apiFetchAuth<PageResponse<ClienteDto>>("/api/v1/clientes/buscar", {
        method: "POST",
        body,
    })

    if (!r.estado || !r.datos) {
        throw new Error(r.error_mensaje ?? "No se pudieron cargar los clientes")
    }

    return r.datos
}

export async function crearCliente(body: CrearClienteReq): Promise<ClienteDto> {
    const r = await apiFetchAuth<ClienteDto>("/api/v1/clientes", {
        method: "POST",
        body,
    })

    if (!r.estado || !r.datos) {
        throw new Error(r.error_mensaje ?? "No se pudo crear el cliente")
    }

    return r.datos
}

/** Campos opcionales que se pueden vaciar. En el PUT, null = "no tocar"; para borrar hay que listarlos en `limpiar`. */
const CLIENTE_CAMPOS_VACIABLES = ["razonSocial", "cuit", "condicionIva", "direccion", "localidad", "provincia", "cp", "notas"] as const

export async function actualizarCliente(clienteId: number, body: ActualizarClienteReq): Promise<ClienteDto> {
    const limpiar = CLIENTE_CAMPOS_VACIABLES.filter((k) => k in body && body[k] === null)
    const r = await apiFetchAuth<ClienteDto>(`/api/v1/clientes/${clienteId}`, {
        method: "PUT",
        body: { ...body, limpiar },
    })

    if (!r.estado || !r.datos) {
        throw new Error(r.error_mensaje ?? "No se pudo actualizar el cliente")
    }

    return r.datos
}

export async function getCliente(clienteId: number): Promise<ClienteDto> {
    const r = await apiFetchAuth<ClienteDto>(`/api/v1/clientes/${clienteId}`, {
        method: "GET",
    })

    if (!r.estado || !r.datos) {
        throw new Error(r.error_mensaje ?? "No se pudo obtener el cliente")
    }

    return r.datos
}

export async function eliminarCliente(clienteId: number): Promise<ClienteDto> {
    const r = await apiFetchAuth<ClienteDto>(`/api/v1/clientes/${clienteId}`, {
        method: "DELETE",
    })

    if (!r.estado || !r.datos) {
        throw new Error(r.error_mensaje ?? "No se pudo eliminar el cliente")
    }

    return r.datos
}

export async function listarContactosCliente(clienteId: number): Promise<ClienteContactoDto[]> {
    const r = await apiFetchAuth<ClienteContactoDto[]>(`/api/v1/clientes/${clienteId}/contactos`, {
        method: "GET",
    })

    if (!r.estado || !r.datos) {
        throw new Error(r.error_mensaje ?? "No se pudieron cargar los contactos")
    }

    return r.datos
}

export async function crearContactoCliente(
    clienteId: number,
    body: CrearClienteContactoReq
): Promise<ClienteContactoDto> {
    const r = await apiFetchAuth<ClienteContactoDto>(`/api/v1/clientes/${clienteId}/contactos`, {
        method: "POST",
        body,
    })

    if (!r.estado || !r.datos) {
        throw new Error(r.error_mensaje ?? "No se pudo crear el contacto")
    }

    return r.datos
}

export async function actualizarContactoCliente(
    clienteId: number,
    contactoId: number,
    body: ActualizarClienteContactoReq
): Promise<ClienteContactoDto> {
    const r = await apiFetchAuth<ClienteContactoDto>(
        `/api/v1/clientes/${clienteId}/contactos/${contactoId}`,
        {
            method: "PUT",
            body,
        }
    )

    if (!r.estado || !r.datos) {
        throw new Error(r.error_mensaje ?? "No se pudo actualizar el contacto")
    }

    return r.datos
}

export async function marcarContactoPrincipal(
    clienteId: number,
    contactoId: number
): Promise<ClienteContactoDto> {
    const r = await apiFetchAuth<ClienteContactoDto>(
        `/api/v1/clientes/${clienteId}/contactos/${contactoId}/principal`,
        {
            method: "POST",
        }
    )

    if (!r.estado || !r.datos) {
        throw new Error(r.error_mensaje ?? "No se pudo marcar el contacto como principal")
    }

    return r.datos
}

export async function eliminarContactoCliente(clienteId: number, contactoId: number): Promise<boolean> {
    const r = await apiFetchAuth<boolean>(`/api/v1/clientes/${clienteId}/contactos/${contactoId}`, {
        method: "DELETE",
    })

    if (!r.estado) {
        throw new Error(r.error_mensaje ?? "No se pudo eliminar el contacto")
    }

    return r.datos === true
}
// ─── Cuenta corriente del cliente ────────────────────────────────────────────

/**
 * Tipos de movimiento de la cuenta corriente (ClienteMovimientoService):
 * - 1 Débito: suma al saldo (lo que el cliente debe; ej. factura emitida).
 * - 2 Crédito: resta del saldo (ej. pago recibido).
 * - 3 Ajuste: suma el monto con su signo (puede ser + o −).
 * Anular no borra: crea un movimiento inverso con referencia "ANULACION".
 */
export type ClienteMovimientoTipo = 1 | 2 | 3

export type ClienteMovimientoDto = {
    id: number
    clienteId: number
    fecha: string // YYYY-MM-DD
    tipo: ClienteMovimientoTipo
    referencia: string | null
    descripcion: string | null
    monto: number
    moneda: string
    proyectoId: number | null
    facturaId: number | null
    /** Saldo acumulado después de este movimiento. */
    saldo: number
    creadoEn: string | null
    movimientoFinancieroId: number | null
}

export type BuscarClienteMovimientosReq = {
    q?: string | null
    fechaDesde?: string | null
    fechaHasta?: string | null
    tipo?: ClienteMovimientoTipo | null
    moneda?: string | null
    page: number
    size: number
}

export type CrearClienteMovimientoReq = {
    fecha: string
    tipo: 1 | 2
    referencia: string | null
    descripcion: string | null
    /** Siempre positivo: el tipo define si suma o resta. */
    monto: number
    moneda: string
    proyectoId: number | null
}

export type AjusteClienteMovimientoReq = {
    fecha: string
    referencia: string | null
    descripcion: string | null
    /** Con signo: positivo aumenta la deuda, negativo la reduce. */
    monto: number
    moneda: string
    proyectoId: number | null
}

export async function saldoCliente(clienteId: number): Promise<number> {
    const r = await apiFetchAuth<number>(`/api/v1/clientes/${clienteId}/movimientos/saldo`)
    if (!r.estado) throw new Error(r.error_mensaje ?? "No se pudo obtener el saldo")
    return Number(r.datos ?? 0)
}

export async function buscarMovimientosCliente(
    clienteId: number,
    body: BuscarClienteMovimientosReq
): Promise<PageResponse<ClienteMovimientoDto>> {
    const r = await apiFetchAuth<PageResponse<ClienteMovimientoDto>>(`/api/v1/clientes/${clienteId}/movimientos/buscar`, {
        method: "POST",
        body,
    })
    if (!r.estado || !r.datos) throw new Error(r.error_mensaje ?? "No se pudieron cargar los movimientos")
    return r.datos
}

export async function crearMovimientoCliente(clienteId: number, body: CrearClienteMovimientoReq): Promise<ClienteMovimientoDto> {
    const r = await apiFetchAuth<ClienteMovimientoDto>(`/api/v1/clientes/${clienteId}/movimientos`, {
        method: "POST",
        body: { ...body, facturaId: null, movimientoFinancieroId: null },
    })
    if (!r.estado || !r.datos) throw new Error(r.error_mensaje ?? "No se pudo registrar el movimiento")
    return r.datos
}

export async function ajusteMovimientoCliente(clienteId: number, body: AjusteClienteMovimientoReq): Promise<ClienteMovimientoDto> {
    const r = await apiFetchAuth<ClienteMovimientoDto>(`/api/v1/clientes/${clienteId}/movimientos/ajuste`, {
        method: "POST",
        body: { ...body, facturaId: null },
    })
    if (!r.estado || !r.datos) throw new Error(r.error_mensaje ?? "No se pudo registrar el ajuste")
    return r.datos
}

export async function anularMovimientoCliente(
    clienteId: number,
    movimientoId: number,
    body?: { fecha?: string | null; descripcion?: string | null }
): Promise<ClienteMovimientoDto> {
    const r = await apiFetchAuth<ClienteMovimientoDto>(`/api/v1/clientes/${clienteId}/movimientos/${movimientoId}/anular`, {
        method: "POST",
        body: body ?? {},
    })
    if (!r.estado || !r.datos) throw new Error(r.error_mensaje ?? "No se pudo anular el movimiento")
    return r.datos
}

// ─── Cuentas bancarias del cliente ───────────────────────────────────────────

export type ClienteCuentaBancariaDto = {
    id: number
    clienteId: number
    banco: string | null
    titular: string | null
    cbu: string | null
    alias: string | null
    numeroCuenta: string | null
    moneda: string | null
    creadoEn: string | null
}

export type ClienteCuentaBancariaReq = {
    banco: string | null
    titular: string | null
    cbu: string | null
    alias: string | null
    numeroCuenta: string | null
    moneda: string | null
}

export async function listarCuentasBancariasCliente(clienteId: number): Promise<ClienteCuentaBancariaDto[]> {
    const r = await apiFetchAuth<ClienteCuentaBancariaDto[]>(`/api/v1/clientes/${clienteId}/cuentas-bancarias`)
    if (!r.estado || !r.datos) throw new Error(r.error_mensaje ?? "No se pudieron cargar las cuentas bancarias")
    return r.datos
}

export async function crearCuentaBancariaCliente(clienteId: number, body: ClienteCuentaBancariaReq): Promise<ClienteCuentaBancariaDto> {
    const r = await apiFetchAuth<ClienteCuentaBancariaDto>(`/api/v1/clientes/${clienteId}/cuentas-bancarias`, {
        method: "POST",
        body,
    })
    if (!r.estado || !r.datos) throw new Error(r.error_mensaje ?? "No se pudo crear la cuenta bancaria")
    return r.datos
}

/** El PUT reemplaza todos los campos: mandar el objeto completo. */
export async function actualizarCuentaBancariaCliente(
    clienteId: number,
    cuentaId: number,
    body: ClienteCuentaBancariaReq
): Promise<ClienteCuentaBancariaDto> {
    const r = await apiFetchAuth<ClienteCuentaBancariaDto>(`/api/v1/clientes/${clienteId}/cuentas-bancarias/${cuentaId}`, {
        method: "PUT",
        body,
    })
    if (!r.estado || !r.datos) throw new Error(r.error_mensaje ?? "No se pudo actualizar la cuenta bancaria")
    return r.datos
}

export async function eliminarCuentaBancariaCliente(clienteId: number, cuentaId: number): Promise<void> {
    const r = await apiFetchAuth<ClienteCuentaBancariaDto>(`/api/v1/clientes/${clienteId}/cuentas-bancarias/${cuentaId}`, {
        method: "DELETE",
    })
    if (!r.estado) throw new Error(r.error_mensaje ?? "No se pudo eliminar la cuenta bancaria")
}
