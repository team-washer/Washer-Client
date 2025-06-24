"use client"

import { useCallback, useEffect, useState } from "react"

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  threshold?: number
  disabled?: boolean
}

export function usePullToRefresh({ onRefresh, threshold = 80, disabled = false }: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [startY, setStartY] = useState(0)

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || window.scrollY > 0) return
      setStartY(e.touches[0].clientY)
    },
    [disabled],
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (disabled || window.scrollY > 0 || startY === 0) return

      const currentY = e.touches[0].clientY
      const distance = currentY - startY

      if (distance > 0) {
        e.preventDefault()
        const maxDistance = Math.min(distance, 120)
        setPullDistance(maxDistance)
        setIsPulling(maxDistance > threshold)
      }
    },
    [disabled, startY, threshold],
  )

  const handleTouchEnd = useCallback(async () => {
    if (disabled) return

    if (isPulling && pullDistance > threshold) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } catch (error) {
        console.error("Refresh failed:", error)
      } finally {
        setIsRefreshing(false)
      }
    }

    setPullDistance(0)
    setIsPulling(false)
    setStartY(0)
  }, [disabled, isPulling, pullDistance, threshold, onRefresh])

  useEffect(() => {
    if (disabled) return

    document.addEventListener("touchstart", handleTouchStart, { passive: false })
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("touchend", handleTouchEnd)

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [disabled, handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    pullDistance,
    isPulling,
    isRefreshing,
  }
}
