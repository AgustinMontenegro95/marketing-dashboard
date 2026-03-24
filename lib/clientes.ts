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

export async function actualizarCliente(clienteId: number, body: ActualizarClienteReq): Promise<ClienteDto> {
    const r = await apiFetchAuth<ClienteDto>(`/api/v1/clientes/${clienteId}`, {
        method: "PUT",
        body,
    })

    if (!r.estado || !r.datos) {
        throw new Error(r.error_mensaje ?? "No se pudo actualizar el cliente")
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