"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { getContador } from "@/lib/notificaciones"

const POLL_MS = 60_000 // refresca cada 60 segundos

type UnreadCountCtx = {
  count: number
  refresh: () => void
}

const UnreadCountContext = createContext<UnreadCountCtx>({ count: 0, refresh: () => {} })

export function UnreadCountProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0)

  const fetchCount = useCallback(async () => {
    try {
      const data = await getContador()
      setCount(data.noLeidas)
    } catch {
      // mantiene el valor anterior si falla la red
    }
  }, [])

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, POLL_MS)
    return () => clearInterval(interval)
  }, [fetchCount])

  return (
    <UnreadCountContext.Provider value={{ count, refresh: fetchCount }}>
      {children}
    </UnreadCountContext.Provider>
  )
}

export function useUnreadCount() {
  return useContext(UnreadCountContext)
}
