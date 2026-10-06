"use client"

import { useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarClock, Loader2, RefreshCw } from "lucide-react"
import { getMachineStatuses, summarizeMachines, type Machine } from "@/entities/machine"
import {
  cancelReservation,
  getActiveReservation,
  getReservationAvailability,
  getRoomActiveReservations,
  type Reservation,
  type ReservationAvailability,
} from "@/entities/reservation"
import {
  getErrorMessage,
  getErrorStatus,
  isServiceUnavailableForUser,
} from "@/shared/api/errorMessage"
import { clearBrowserAuthSession } from "@/shared/auth/session"
import { Button } from "@/shared/components/ui/button"
import { CenteredMessage } from "@/shared/components/centered-message"
import { Card, CardContent } from "@/shared/components/ui/card"
import { useToast } from "@/shared/components/ui/use-toast"
import { useNow } from "@/shared/hooks/use-now"
import { usePolling } from "@/shared/hooks/use-polling"
import { formatClock, parseServerDateTime } from "@/shared/lib/time"
import { AvailabilityBanner } from "@/widgets/home/ui/AvailabilityBanner"
import { MachineSummaryCard } from "@/widgets/home/ui/MachineSummaryCard"
import { RoomReservationCard } from "@/widgets/home/ui/RoomReservationCard"

const RESERVATION_POLLING_MS = 10_000
const MACHINE_POLLING_MS = 30_000

export default function HomePage() {
  const router = useRouter()
  const { toast } = useToast()
  const now = useNow()

  const [machines, setMachines] = useState<Machine[] | null>(null)
  const [roomReservations, setRoomReservations] = useState<Reservation[] | null>(null)
  const [myReservationId, setMyReservationId] = useState<number | null>(null)
  const [availability, setAvailability] = useState<ReservationAvailability | null>(null)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  // Bumped on every reservation mutation so a poll that started earlier
  // cannot overwrite the newer state with a stale snapshot.
  const reservationVersion = useRef(0)

  const handleAuthError = useCallback(
    (error: unknown): boolean => {
      if (getErrorStatus(error) !== 401) return false
      clearBrowserAuthSession()
      router.replace("/login")
      return true
    },
    [router],
  )

  const loadMachines = useCallback(async () => {
    try {
      setMachines(await getMachineStatuses())
      setLoadError(null)
    } catch (error) {
      if (!handleAuthError(error)) setLoadError(error)
    }
  }, [handleAuthError])

  const loadReservations = useCallback(async () => {
    const version = reservationVersion.current
    try {
      const [room, mine, nextAvailability] = await Promise.all([
        getRoomActiveReservations(),
        getActiveReservation(),
        getReservationAvailability(),
      ])
      if (version !== reservationVersion.current) return

      setRoomReservations(room)
      setMyReservationId(mine?.id ?? null)
      setAvailability(nextAvailability)
    } catch (error) {
      if (!handleAuthError(error)) setLoadError((current: unknown) => current ?? error)
    }
  }, [handleAuthError])

  usePolling(loadMachines, MACHINE_POLLING_MS)
  usePolling(loadReservations, RESERVATION_POLLING_MS)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([loadMachines(), loadReservations()])
    setIsRefreshing(false)
  }

  const handleCancel = async (reservation: Reservation) => {
    if (!window.confirm(`${reservation.machineName} 예약을 취소할까요?`)) return

    setCancellingId(reservation.id)
    reservationVersion.current += 1
    try {
      const result = await cancelReservation(reservation.id)
      setRoomReservations((current) =>
        current ? current.filter(({ id }) => id !== reservation.id) : current,
      )
      setMyReservationId(null)

      const penaltyUntil = parseServerDateTime(result.penaltyExpiresAt)
      toast({
        title: "예약 취소 완료",
        description:
          result.penaltyApplied && penaltyUntil
            ? `${formatClock(penaltyUntil)}까지 같은 종류의 기기를 다시 예약할 수 없습니다.`
            : result.message,
      })
    } catch (error) {
      if (handleAuthError(error)) return
      toast({
        title: "예약 취소 실패",
        description: getErrorMessage(error, "예약 취소 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setCancellingId(null)
      reservationVersion.current += 1
      await Promise.all([loadReservations(), loadMachines()])
    }
  }

  if (isServiceUnavailableForUser(loadError)) {
    return (
      <CenteredMessage
        message={getErrorMessage(loadError, "1~4층 기숙사생만 이용할 수 있습니다.")}
      />
    )
  }

  if (!machines || !roomReservations) {
    if (loadError) {
      return (
        <CenteredMessage
          message={getErrorMessage(loadError, "세탁실 현황을 불러오지 못했습니다.")}
          onRetry={() => {
            setLoadError(null)
            void handleRefresh()
          }}
        />
      )
    }

    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#86A9FF]" aria-label="불러오는 중" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFF] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#6487DB]">HOME</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">세탁실 현황</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        </div>

        {availability && <AvailabilityBanner availability={availability} now={now} />}

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900">
            <CalendarClock className="h-5 w-5 text-[#6487DB]" />
            우리 호실 예약 현황
          </h2>
          {roomReservations.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-gray-500">
                현재 예약하거나 사용 중인 기기가 없습니다.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {roomReservations.map((reservation) => (
                <RoomReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  isMine={reservation.id === myReservationId}
                  now={now}
                  isCancelling={cancellingId === reservation.id}
                  onCancel={(target) => void handleCancel(target)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <MachineSummaryCard type="WASHER" summary={summarizeMachines(machines, "WASHER")} />
          <MachineSummaryCard type="DRYER" summary={summarizeMachines(machines, "DRYER")} />
        </section>
      </div>
    </div>
  )
}
