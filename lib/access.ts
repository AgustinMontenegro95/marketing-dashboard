import type { LoginContext } from "@/lib/session"

/**
 * IMPORTANTE (según tu doc):
 * - El frontend NO decide seguridad real. Solo UI + navegación.
 * - Backend valida siempre.
 *
 * Esta capa sirve para:
 * - Sidebar (mostrar módulos)
 * - RouteGuard (evitar entrar a páginas sin acceso)
 * - PermissionGate (mostrar/ocultar botones)
 */

export type Permission = string

export type ModuleKey =
    | "ANALITICA"
    | "CALENDARIO"
    | "CLIENTES"
    | "COMUNICACION"
    | "CONFIGURACION"
    | "DISENO"
    | "USUARIOS"
    | "FINANZAS"
    | "MARKETING"
    | "NOTIFICACIONES"
    | "PERFIL"
    | "PROYECTOS"
    | "SOFTWARE"
    | "REPORTES"

export type ActionKey = "VER" | "CREAR" | "EDITAR" | "BORRAR" | "GESTIONAR" | "BAJA"
export type ScopeKey = "PROPIO" | "AREA" | "TODO"

// Permisos mínimos para ENTRAR al módulo (rutas / pages)
const MODULE_MIN_PERMISSIONS: Record<ModuleKey, Permission[]> = {
    ANALITICA: ["ANALITICA_VER_TODO", "ANALITICA_VER_AREA"],
    CALENDARIO: ["CALENDARIO_VER_TODO", "CALENDARIO_VER_PROPIO"],
    CLIENTES: ["CLIENTES_VER_TODO", "CLIENTES_VER_AREA"],
    COMUNICACION: ["COMUNICACION_VER_TODO"],
    CONFIGURACION: ["CONFIGURACION_VER_TODO"],
    DISENO: ["DISENO_VER_TODO", "DISENO_VER_AREA"],
    USUARIOS: ["USUARIOS_VER_TODO"],
    FINANZAS: ["FINANZAS_VER_TODO"],
    MARKETING: ["MARKETING_VER_TODO", "MARKETING_VER_AREA"],
    NOTIFICACIONES: ["NOTIFICACIONES_VER_PROPIO"],
    PERFIL: ["PERFIL_VER_PROPIO"],
    PROYECTOS: ["PROYECTOS_VER_TODO", "PROYECTOS_VER_AREA"],
    SOFTWARE: ["SOFTWARE_VER_TODO", "SOFTWARE_VER_AREA"],
    REPORTES: ["REPORTES_VER_TODO", "REPORTES_VER_AREA"],
}

function toSet(permisos?: Permission[] | null): Set<Permission> {
    return new Set((permisos ?? []).filter(Boolean))
}

export function createAccess(context: LoginContext | null) {
    const permisosSet = toSet(context?.permisos)
    const roles = context?.roles ?? []

    const can = (permission: Permission) => permisosSet.has(permission)

    const canAny = (permissions: Permission[]) => permissions.some((p) => permisosSet.has(p))

    const canAll = (permissions: Permission[]) => permissions.every((p) => permisosSet.has(p))

    /** Permisos mínimos para "entrar" a un módulo (rutas) */
    const canModule = (module: ModuleKey) => canAny(MODULE_MIN_PERMISSIONS[module] ?? [])

    const requiredForModule = (module: ModuleKey) => MODULE_MIN_PERMISSIONS[module] ?? []

    /**
     * Helpers por convención MODULO_ACCION_ALCANCE
     * Ej: CLIENTES_EDITAR_TODO
     */
    const perm = (module: ModuleKey, action: ActionKey, scope: ScopeKey) =>
        `${module}_${action}_${scope}` as Permission

    const canView = (module: ModuleKey) =>
        canAny([perm(module, "VER", "TODO"), perm(module, "VER", "AREA"), perm(module, "VER", "PROPIO")])

    const canCreate = (module: ModuleKey) =>
        canAny([perm(module, "CREAR", "TODO"), perm(module, "CREAR", "AREA"), perm(module, "CREAR", "PROPIO")])

    const canEdit = (module: ModuleKey) =>
        canAny([perm(module, "EDITAR", "TODO"), perm(module, "EDITAR", "AREA"), perm(module, "EDITAR", "PROPIO")])

    const canDelete = (module: ModuleKey) =>
        canAny([perm(module, "BORRAR", "TODO"), perm(module, "BORRAR", "AREA"), perm(module, "BORRAR", "PROPIO")])

    /**
     * Roles en frontend: solo info / UX (NO seguridad)
     * Te lo dejo por si querés badges, defaults, etc.
     */
    const hasRole = (role: string) => roles.includes(role)

    return {
        // base
        roles,
        permisosSet,

        // checks
        can,
        canAny,
        canAll,

        // module
        canModule,
        requiredForModule,

        // convention helpers
        perm,
        canView,
        canCreate,
        canEdit,
        canDelete,

        // roles (UX)
        hasRole,
    }
}