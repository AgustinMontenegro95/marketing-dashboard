export async function apiClient(input: string, init?: RequestInit) {
    // 1) primer intento contra tu BFF /api/...
    let r = await fetch(input, { ...init })

    // 2) si es 401, intentamos refresh
    if (r.status === 401) {
        const rr = await fetch("/api/auth/refresh", { method: "POST" })
        if (rr.ok) {
            // 3) reintenta la request original
            r = await fetch(input, { ...init })
        }
    }

    return r
}