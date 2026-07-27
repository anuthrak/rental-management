"use client"

import { useEffect } from "react"

import { useSimpleModeStore } from "@/store/use-simple-mode-store"

// Mirrors the persisted Simple Mode preference onto <html> so the CSS rules
// in globals.css (scoped under .simple-mode) apply everywhere at once,
// including portaled content like Sheets/Dialogs.
export function SimpleModeEffect() {
  const simpleMode = useSimpleModeStore((s) => s.simpleMode)

  useEffect(() => {
    document.documentElement.classList.toggle("simple-mode", simpleMode)
  }, [simpleMode])

  return null
}
