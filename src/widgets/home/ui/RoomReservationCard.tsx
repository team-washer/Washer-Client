"use client"

import { Loader2, Shirt, Wind } from "lucide-react"
import { getMachineTypeFromName, type MachineType } from "@/entities/machine"
import { getReservedDeadline, type Reservation } from "@/entities/reservation"
import { ReservationStatusBadge } from "@/entities/reservation/ui/ReservationStatusBadge"
import { Button } from "@/shared/components/ui/button"
import {
  formatClock,
  formatCountdown,
  parseServerDateTime,
} from "@/shared/lib/time"

const typeLabels: Record<MachineType, string> = {
  WASHER: "세탁기",
  DRYER: "건조기",
}

export function RoomReservationCard({
  reservation,
  isMine,
  now,
  isCancelling,
  onCancel,
}: {
  reservation: Reservation
  isMine: boolean
  now: number
  isCancelling: boolean
  onCancel: (reservation: Reservation) => void
}) {
  const type = getMachineTypeFromName(reservation.machineName)
  const Icon = type === "DRYER" ? Wind : Shirt

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDF2FF]">
            <Icon className="h-5 w-5 text-[#6487DB]" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{reservation.machineName}</p>
            <p className="text-sm text-gray-500">
              {type ? `${typeLabels[type]} · ` : ""}
              {isMine ? "내 예약" : `${reservation.userName}님`}
            </p>
          </div>
        </div>
        <ReservationStatusBadge status={reservation.status} />
      </div>

      <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm">
        {reservation.status === "RESERVED" ? (
          <ReservedBody reservation={reservation} now={now} />
        ) : (
          <RunningBody reservation={reservation} now={now} />
        )}
      </div>

      {isMine && reservation.status === "RESERVED" && (
        <Button
          variant="outline"
          className="mt-4 w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          disabled={isCancelling}
          onClick={() => onCancel(reservation)}
        >
          {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          예약 취소
        </Button>
      )}
    </div>
  )
}

function ReservedBody({ reservation, now }: { reservation: Reservation; now: number }) {
  const deadline = getReservedDeadline(reservation)
  const remaining = deadline === null ? null : deadline - now

  return (
    <>
      <p className="flex items-center justify-between">
        <span className="text-gray-500">예약 만료까지</span>
        <span className="font-semibold tabular-nums text-amber-700">
          {remaining === null ? "-" : remaining > 0 ? formatCountdown(remaining) : "만료됨"}
        </span>
      </p>
      <p className="mt-2 text-xs text-gray-500">
        기기에서 직접 시작하면 자동으로 사용 중 상태로 바뀝니다.
      </p>
    </>
  )
}

function RunningBody({ reservation, now }: { reservation: Reservation; now: number }) {
  const completion = parseServerDateTime(reservation.expectedCompletionTime)

  if (!completion) {
    return <p className="text-gray-500">기기 동작을 확인하고 있습니다.</p>
  }

  const remaining = completion.getTime() - now

  return (
    <>
      <p className="flex items-center justify-between">
        <span className="text-gray-500">남은 시간</span>
        <span className="font-semibold tabular-nums text-blue-700">
          {remaining > 0 ? formatCountdown(remaining) : "곧 완료"}
        </span>
      </p>
      <p className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>완료 예정</span>
        <span>{formatClock(completion)}</span>
      </p>
    </>
  )
}
