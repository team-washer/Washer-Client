"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import {
  getMachineHistory,
  type MachineHistoryItem,
  type ReservationStatus,
} from "@/entities/reservation"
import { getErrorMessage } from "@/shared/api/errorMessage"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { formatClock, formatDateTime, parseServerDateTime } from "@/shared/lib/time"

const PAGE_SIZE = 10

const statusBadges: Record<ReservationStatus, { label: string; className: string }> = {
  RESERVED: { label: "예약됨", className: "bg-amber-100 text-amber-800 hover:bg-amber-100" },
  RUNNING: { label: "사용 중", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  COMPLETED: { label: "완료", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  CANCELLED: { label: "취소", className: "bg-gray-100 text-gray-700 hover:bg-gray-100" },
}

export function MachineHistoryPanel({
  machineId,
  onBack,
}: {
  machineId: number
  onBack: () => void
}) {
  const [items, setItems] = useState<MachineHistoryItem[]>([])
  const [nextPage, setNextPage] = useState(0)
  const [isLast, setIsLast] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPage = useCallback(
    async (page: number) => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await getMachineHistory(machineId, { page, size: PAGE_SIZE })
        setItems((current) => (page === 0 ? result.content : [...current, ...result.content]))
        setNextPage(page + 1)
        setIsLast(result.last)
      } catch (loadError) {
        setError(getErrorMessage(loadError, "이용 이력을 불러오지 못했습니다."))
      } finally {
        setIsLoading(false)
      }
    },
    [machineId],
  )

  useEffect(() => {
    void loadPage(0)
  }, [loadPage])

  return (
    <div className="space-y-3">
      <div className="max-h-[50vh] space-y-2 overflow-y-auto">
        {items.length === 0 && !isLoading && !error && (
          <p className="py-8 text-center text-sm text-gray-500">이용 이력이 없습니다.</p>
        )}
        {items.map((item) => (
          <HistoryRow key={item.id} item={item} />
        ))}
        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-[#86A9FF]" aria-label="불러오는 중" />
          </div>
        )}
        {error && <p className="py-4 text-center text-sm text-red-600">{error}</p>}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          뒤로
        </Button>
        {(!isLast || error) && (
          <Button
            variant="outline"
            className="flex-1"
            disabled={isLoading}
            onClick={() => void loadPage(nextPage)}
          >
            {error ? "다시 시도" : "더 보기"}
          </Button>
        )}
      </div>
    </div>
  )
}

function HistoryRow({ item }: { item: MachineHistoryItem }) {
  const badge = statusBadges[item.status]
  const createdAt = parseServerDateTime(item.createdAt)
  const startTime = parseServerDateTime(item.startTime)
  const completionTime = parseServerDateTime(item.completionTime)

  return (
    <div className="rounded-lg border bg-white px-3 py-2.5 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-gray-900">{item.userRoomNumber}호</span>
        <Badge className={badge.className}>{badge.label}</Badge>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {createdAt ? `예약 ${formatDateTime(createdAt)}` : ""}
        {startTime && ` · 시작 ${formatClock(startTime)}`}
        {completionTime && ` · 종료 ${formatClock(completionTime)}`}
      </p>
    </div>
  )
}
