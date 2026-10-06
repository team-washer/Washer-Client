"use client"

import { useEffect, useRef } from "react"

// Runs `task` immediately and then every `intervalMs` while the tab is visible.
// Hidden tabs stop polling; becoming visible again triggers an immediate run.
// A run is skipped while the previous one is still in flight.
export const usePolling = (
  task: () => Promise<void>,
  intervalMs: number,
  enabled = true,
): void => {
  const taskRef = useRef(task)
  taskRef.current = task

  useEffect(() => {
    if (!enabled) return

    let timer: ReturnType<typeof setInterval> | null = null
    let inFlight = false

    const run = async () => {
      if (inFlight) return
      inFlight = true
      try {
        await taskRef.current()
      } finally {
        inFlight = false
      }
    }

    const start = () => {
      if (timer) return
      void run()
      timer = setInterval(() => void run(), intervalMs)
    }

    const stop = () => {
      if (!timer) return
      clearInterval(timer)
      timer = null
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") start()
      else stop()
    }

    if (document.visibilityState === "visible") start()
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      stop()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [intervalMs, enabled])
}
