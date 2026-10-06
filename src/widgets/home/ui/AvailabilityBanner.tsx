"use client"

import { Ban, Clock } from "lucide-react"
import type { ReservationAvailability } from "@/entities/reservation"
import { formatCountdown, formatDateTime, parseServerDateTime } from "@/shared/lib/time"

export function AvailabilityBanner({
  availability,
  now,
}: {
  availability: ReservationAvailability
  now: number
}) {
  if (availability.canReserve) return null

  if (availability.isBanned) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
        <Ban className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">호실 세탁 금지 중</p>
          <p className="mt-1 text-sm">
            관리자에 의해 호실의 세탁기 · 건조기 예약이 제한되었습니다.
          </p>
        </div>
      </div>
    )
  }

  const expiresAt = parseServerDateTime(availability.penaltyExpiresAt)

  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
      <Clock className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">지금은 예약할 수 없어요</p>
        <p className="mt-1 text-sm">
          {expiresAt
            ? `패널티가 ${formatDateTime(expiresAt)}에 해제됩니다. (남은 시간 ${formatCountdown(expiresAt.getTime() - now)})`
            : "예약 제한이 적용되어 있습니다."}
        </p>
      </div>
    </div>
  )
}
