"use client"

import { useEffect, useState } from "react"

const KEY = "chatbot:showTokensPerMessage"

export function useTokenDisplay() {
  const [showTokens, setShowTokens] = useState(false)

  useEffect(() => {
    try {
      setShowTokens(localStorage.getItem(KEY) === "true")
    } catch {}
  }, [])

  function toggle(value: boolean) {
    setShowTokens(value)
    try { localStorage.setItem(KEY, String(value)) } catch {}
  }

  return { showTokens, toggle }
}
