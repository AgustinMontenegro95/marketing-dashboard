// Guarda el reveal-token de Credenciales SOLO en memoria (nunca en localStorage/sessionStorage).
// Se pierde al refrescar la página a propósito: cada sesión de navegador tiene que
// volver a pedir el PIN.

let token: string | null = null
let expiraEn: number | null = null // epoch ms

export function setRevealToken(newToken: string, ttlSeconds: number) {
    token = newToken
    expiraEn = Date.now() + ttlSeconds * 1000
}

export function getRevealToken(): string | null {
    if (!token || !expiraEn) return null
    if (Date.now() >= expiraEn) {
        clearRevealToken()
        return null
    }
    return token
}

export function clearRevealToken() {
    token = null
    expiraEn = null
}

export function revealTokenSecondsLeft(): number {
    if (!token || !expiraEn) return 0
    return Math.max(0, Math.floor((expiraEn - Date.now()) / 1000))
}
