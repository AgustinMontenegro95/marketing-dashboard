"use client"

import { useEffect } from "react"
import logo from "@/assets/logo.jpeg"

export function PreloadAssets() {
  useEffect(() => {
    const img = new Image()
    img.src = logo.src
  }, [])

  return null
}