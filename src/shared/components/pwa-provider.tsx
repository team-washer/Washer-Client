"use client"

import { useEffect, type ReactNode } from "react"

export function PwaProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    void navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .catch((error) => {
        console.error("PWA service worker 등록 오류:", error)
      })
  }, [])

  return children
}
