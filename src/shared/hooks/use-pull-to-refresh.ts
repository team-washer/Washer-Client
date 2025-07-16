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
        const maxDistance = Math.min(distance * 0.5, 100) // 저항감 추가
        setPullDistance(maxDistance)
        setIsPulling(maxDistance > threshold * 0.5)
      }
    },
    [disabled, startY, threshold],
  )

  const handleTouchEnd = useCallback(async () => {
    if (disabled) return

    if (isPulling && pullDistance > threshold * 0.5) {
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

    const handleTouchStartPassive = (e: TouchEvent) => handleTouchStart(e)
    const handleTouchMovePassive = (e: TouchEvent) => handleTouchMove(e)
    const handleTouchEndPassive = () => handleTouchEnd()

    document.addEventListener("touchstart", handleTouchStartPassive, { passive: true })
    document.addEventListener("touchmove", handleTouchMovePassive, { passive: false })
    document.addEventListener("touchend", handleTouchEndPassive, { passive: true })

    return () => {
      document.removeEventListener("touchstart", handleTouchStartPassive)
      document.removeEventListener("touchmove", handleTouchMovePassive)
      document.removeEventListener("touchend", handleTouchEndPassive)
    }
  }, [disabled, handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    pullDistance,
    isPulling,
    isRefreshing,
  }
}
