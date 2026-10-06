"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Shirt, Wind } from "lucide-react"
import {
  getReservationHistory,
  type ReservationHistoryItem,
  type ReservationMachineType,
  type ReservationStatus,
} from "@/entities/reservation"
import { ReservationStatusBadge } from "@/entities/reservation/ui/ReservationStatusBadge"
import { getErrorMessage, getErrorStatus } from "@/shared/api/errorMessage"
import { clearBrowserAuthSession } from "@/shared/auth/session"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent } from "@/shared/components/ui/card"
import { formatClock, formatDateTime, parseServerDateTime } from "@/shared/lib/time"

const PAGE_SIZE = 20

const typeFilters: { value: ReservationMachineType | null; label: string }[] = [
  { value: null, label: "전체" },
  { value: "WASHER", label: "세탁기" },
  { value: "DRYER", label: "건조기" },
]

const statusFilters: { value: ReservationStatus | null; label: string }[] = [
  { value: null, label: "전체" },
  { value: "COMPLETED", label: "완료" },
  { value: "CANCELLED", label: "취소" },
  { value: "RUNNING", label: "사용 중" },
  { value: "RESERVED", label: "예약됨" },
]

export default function ReservationHistoryPage() {
  const router = useRouter()
  const [machineType, setMachineType] = useState<ReservationMachineType | null>(null)
  const [status, setStatus] = useState<ReservationStatus | null>(null)
  const [items, setItems] = useState<ReservationHistoryItem[]>([])
  const [nextPage, setNextPage] = useState(0)
  const [isLast, setIsLast] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Responses for an outdated filter are dropped.
  const requestId = useRef(0)

  const loadPage = useCallback(
    async (page: number) => {
      const id = ++requestId.current
      setIsLoading(true)
      setError(null)
      try {
        const result = await getReservationHistory({
          page,
          size: PAGE_SIZE,
          ...(machineType && { machineType }),
          ...(status && { status }),
        })
        if (id !== requestId.current) return

        setItems((current) => (page === 0 ? result.content : [...current, ...result.content]))
        setNextPage(page + 1)
        setIsLast(result.last)
      } catch (loadError) {
        if (id !== requestId.current) return
        if (getErrorStatus(loadError) === 401) {
          clearBrowserAuthSession()
          router.replace("/login")
          return
        }
        setError(getErrorMessage(loadError, "이용 내역을 불러오지 못했습니다."))
      } finally {
        if (id === requestId.current) setIsLoading(false)
      }
    },
    [machineType, status, router],
  )

  useEffect(() => {
    setItems([])
    setIsLast(false)
    void loadPage(0)
  }, [loadPage])

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFF] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-sm font-medium text-[#6487DB]">HISTORY</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">이용 내역</h1>
          <p className="mt-2 text-sm text-gray-500">내 세탁기 · 건조기 예약과 사용 기록입니다.</p>
        </div>

        <div className="space-y-2">
          <FilterRow label="종류" options={typeFilters} value={machineType} onChange={setMachineType} />
          <FilterRow label="상태" options={statusFilters} value={status} onChange={setStatus} />
        </div>

        <div className="space-y-3">
          {items.length === 0 && !isLoading && !error && (
            <Card>
              <CardContent className="p-6 text-center text-sm text-gray-500">
                이용 내역이 없습니다.
              </CardContent>
            </Card>
          )}
          {items.map((item) => (
            <HistoryCard key={item.id} item={item} />
          ))}
          {isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-[#86A9FF]" aria-label="불러오는 중" />
            </div>
          )}
          {error && <p className="py-2 text-center text-sm text-red-600">{error}</p>}
          {!isLoading && (!isLast || error) && (
            <Button variant="outline" className="w-full" onClick={() => void loadPage(nextPage)}>
              {error ? "다시 시도" : "더 보기"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T | null; label: string }[]
  value: T | null
  onChange: (value: T | null) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-8 shrink-0 text-sm text-gray-500">{label}</span>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              value === option.value
                ? "bg-[#86A9FF] text-white"
                : "border bg-white text-gray-600 hover:border-[#86A9FF]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function HistoryCard({ item }: { item: ReservationHistoryItem }) {
  const Icon = item.machineType === "DRYER" ? Wind : Shirt
  const createdAt = parseServerDateTime(item.createdAt)
  const startTime = parseServerDateTime(item.startTime)
  const completionTime = parseServerDateTime(item.completionTime)

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDF2FF]">
            <Icon className="h-5 w-5 text-[#6487DB]" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{item.machineName}</p>
            <p className="text-sm text-gray-500">
              {createdAt ? `${formatDateTime(createdAt)} 예약` : "-"}
            </p>
          </div>
        </div>
        <ReservationStatusBadge status={item.status} />
      </div>
      {(startTime || completionTime) && (
        <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
          {startTime && `시작 ${formatClock(startTime)}`}
          {startTime && completionTime && " · "}
          {completionTime && `종료 ${formatClock(completionTime)}`}
        </p>
      )}
    </div>
  )
}
