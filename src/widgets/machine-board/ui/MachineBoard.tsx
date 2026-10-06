"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DoorOpen, Loader2, RefreshCw } from "lucide-react"
import {
  buildFloorLayout,
  getMachineFloors,
  getMachineStatuses,
  type Machine,
  type MachineStatusTone,
  type MachineType,
} from "@/entities/machine"
import {
  getErrorMessage,
  getErrorStatus,
  isServiceUnavailableForUser,
} from "@/shared/api/errorMessage"
import { clearBrowserAuthSession } from "@/shared/auth/session"
import { Button } from "@/shared/components/ui/button"
import { CenteredMessage } from "@/shared/components/centered-message"
import { Card, CardContent } from "@/shared/components/ui/card"
import { useNow } from "@/shared/hooks/use-now"
import { usePolling } from "@/shared/hooks/use-polling"
import { MachineTile, toneClasses } from "./MachineTile"

const MACHINE_POLLING_MS = 30_000
const FLOOR_STORAGE_KEY = "washer:selected-floor"

const titles: Record<MachineType, { eyebrow: string; title: string }> = {
  WASHER: { eyebrow: "WASHER", title: "세탁기" },
  DRYER: { eyebrow: "DRYER", title: "건조기" },
}

const legend: { tone: MachineStatusTone; label: string }[] = [
  { tone: "available", label: "예약 가능" },
  { tone: "reserved", label: "예약됨" },
  { tone: "inUse", label: "사용 중" },
  { tone: "cleaning", label: "통세척 중" },
  { tone: "broken", label: "고장" },
]

const readStoredFloor = (): number | null => {
  try {
    const value = Number(window.localStorage.getItem(FLOOR_STORAGE_KEY))
    return Number.isInteger(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

const storeFloor = (floor: number): void => {
  try {
    window.localStorage.setItem(FLOOR_STORAGE_KEY, String(floor))
  } catch {
    // Storage may be unavailable (private mode); the selection just won't persist.
  }
}

export function MachineBoard({ type }: { type: MachineType }) {
  const router = useRouter()
  const now = useNow()
  const [machines, setMachines] = useState<Machine[] | null>(null)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null)

  const loadMachines = useCallback(async () => {
    try {
      setMachines(await getMachineStatuses())
      setLoadError(null)
    } catch (error) {
      if (getErrorStatus(error) === 401) {
        clearBrowserAuthSession()
        router.replace("/login")
        return
      }
      setLoadError(error)
    }
  }, [router])

  usePolling(loadMachines, MACHINE_POLLING_MS)

  const floors = useMemo(
    () => getMachineFloors((machines ?? []).filter((machine) => machine.type === type)),
    [machines, type],
  )

  useEffect(() => {
    if (floors.length === 0 || (selectedFloor !== null && floors.includes(selectedFloor))) {
      return
    }
    const stored = readStoredFloor()
    setSelectedFloor(stored !== null && floors.includes(stored) ? stored : floors[0])
  }, [floors, selectedFloor])

  const handleSelectFloor = (floor: number) => {
    setSelectedFloor(floor)
    storeFloor(floor)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadMachines()
    setIsRefreshing(false)
  }

  if (isServiceUnavailableForUser(loadError)) {
    return <CenteredMessage message={getErrorMessage(loadError, "1~4층 기숙사생만 이용할 수 있습니다.")} />
  }

  if (!machines) {
    if (loadError) {
      return (
        <CenteredMessage
          message={getErrorMessage(loadError, "기기 현황을 불러오지 못했습니다.")}
          onRetry={() => void handleRefresh()}
        />
      )
    }
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#86A9FF]" aria-label="불러오는 중" />
      </div>
    )
  }

  const layout = selectedFloor === null ? null : buildFloorLayout(machines, type, selectedFloor)
  const { eyebrow, title } = titles[type]

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFF] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#6487DB]">{eyebrow}</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => void handleRefresh()} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        </div>

        {floors.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="층 선택">
            {floors.map((floor) => (
              <button
                key={floor}
                type="button"
                role="tab"
                aria-selected={selectedFloor === floor}
                onClick={() => handleSelectFloor(floor)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  selectedFloor === floor
                    ? "bg-[#86A9FF] text-white"
                    : "border bg-white text-gray-600 hover:border-[#86A9FF]"
                }`}
              >
                {floor}층
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
          {legend.map(({ tone, label }) => (
            <span key={tone} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${toneClasses[tone].dot}`} />
              {label}
            </span>
          ))}
        </div>

        {layout && (layout.left.length > 0 || layout.right.length > 0) ? (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-6">
                <Column label="왼쪽" machines={layout.left} now={now} />
                <Column label="오른쪽" machines={layout.right} now={now} />
              </div>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-500">
                <DoorOpen className="h-4 w-4" />
                입구
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-sm text-gray-500">
              이 층에는 {title}가 없습니다.
            </CardContent>
          </Card>
        )}

        {layout && layout.unplaced.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">위치 정보가 없는 {title}</h2>
            <div className="grid grid-cols-2 gap-3">
              {layout.unplaced.map((machine) => (
                <MachineTile key={machine.id} machine={machine} now={now} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function Column({ label, machines, now }: { label: string; machines: Machine[]; now: number }) {
  return (
    <div className="space-y-3">
      <p className="text-center text-sm font-medium text-[#6487DB]">{label}</p>
      {machines.length === 0 ? (
        <p className="py-6 text-center text-xs text-gray-400">기기 없음</p>
      ) : (
        machines.map((machine) => <MachineTile key={machine.id} machine={machine} now={now} />)
      )}
    </div>
  )
}
