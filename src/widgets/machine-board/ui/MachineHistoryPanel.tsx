"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { getMachineHistory, type MachineHistoryItem } from "@/entities/reservation"
import { ReservationStatusBadge } from "@/entities/reservation/ui/ReservationStatusBadge"
import { getErrorMessage } from "@/shared/api/errorMessage"
import { Button } from "@/shared/components/ui/button"
import { formatClock, formatDateTime, parseServerDateTime } from "@/shared/lib/time"

const PAGE_SIZE = 10

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
  const createdAt = parseServerDateTime(item.createdAt)
  const startTime = parseServerDateTime(item.startTime)
  const completionTime = parseServerDateTime(item.completionTime)

  return (
    <div className="rounded-lg border bg-white px-3 py-2.5 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-gray-900">{item.userRoomNumber}호</span>
        <ReservationStatusBadge status={item.status} />
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {createdAt ? `예약 ${formatDateTime(createdAt)}` : ""}
        {startTime && ` · 시작 ${formatClock(startTime)}`}
        {completionTime && ` · 종료 ${formatClock(completionTime)}`}
      </p>
    </div>
  )
}
