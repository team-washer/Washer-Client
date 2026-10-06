"use client"

import { useState } from "react"
import { CalendarPlus, Loader2 } from "lucide-react"
import {
  getMachineStatusView,
  getMachineTypeFromName,
  isMachineReservable,
  type Machine,
} from "@/entities/machine"
import {
  createReservation,
  RESERVED_TIMEOUT_MINUTES,
  type Reservation,
  type ReservationAvailability,
} from "@/entities/reservation"
import { getErrorMessage } from "@/shared/api/errorMessage"
import { Button } from "@/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import { useToast } from "@/shared/components/ui/use-toast"
import { formatClock, formatCountdown, parseServerDateTime } from "@/shared/lib/time"
import { getReserveBlockReason, type ReserveBlockReason } from "../lib/reserveBlockReason"
import { toneClasses } from "./MachineTile"

export type ReservationContext = {
  availability: ReservationAvailability
  myReservation: Reservation | null
  roomReservations: Reservation[]
}

const typeLabels = { WASHER: "세탁기", DRYER: "건조기" } as const

const blockMessage = (
  reason: ReserveBlockReason,
  machine: Machine,
  context: ReservationContext,
): string => {
  switch (reason) {
    case "MACHINE_UNAVAILABLE":
      return "지금은 예약할 수 없는 기기입니다."
    case "BANNED":
      return "호실 세탁 금지 중이라 예약할 수 없습니다."
    case "PENALTY": {
      const until = parseServerDateTime(context.availability.penaltyExpiresAt)
      return until
        ? `패널티로 ${formatClock(until)}까지 예약할 수 없습니다.`
        : "예약 제한이 적용되어 있습니다."
    }
    case "ALREADY_RESERVED":
      return "이미 진행 중인 예약이 있습니다. 한 사람당 하나만 예약할 수 있어요."
    case "ROOM_TYPE_TAKEN":
      return `우리 호실에서 이미 ${typeLabels[machine.type]}를 예약하거나 사용 중입니다.`
  }
}

export function MachineDialog({
  machine,
  now,
  context,
  onOpenChange,
  onChanged,
}: {
  machine: Machine | null
  now: number
  context: ReservationContext | null
  onOpenChange: (open: boolean) => void
  onChanged: () => Promise<void>
}) {
  const { toast } = useToast()
  const [isReserving, setIsReserving] = useState(false)

  if (!machine) return null

  const { label, tone } = getMachineStatusView(machine)
  const completion = parseServerDateTime(machine.expectedCompletionTime)
  const blockReason = context
    ? getReserveBlockReason({
        machineReservable: isMachineReservable(machine),
        machineType: machine.type,
        canReserve: context.availability.canReserve,
        isBanned: context.availability.isBanned,
        hasMyActiveReservation: context.myReservation !== null,
        roomReservationTypes: context.roomReservations.map(({ machineName }) =>
          getMachineTypeFromName(machineName),
        ),
      })
    : null

  const handleReserve = async () => {
    setIsReserving(true)
    try {
      await createReservation(machine.id)
      toast({
        title: "예약 완료",
        description: `${RESERVED_TIMEOUT_MINUTES}분 안에 ${machine.name}을(를) 시작하지 않으면 예약이 자동 취소됩니다.`,
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "예약 실패",
        description: getErrorMessage(error, "예약 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setIsReserving(false)
      await onChanged()
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{machine.name}</DialogTitle>
          <DialogDescription>{typeLabels[machine.type]} 상세 정보</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 rounded-lg bg-gray-50 px-4 py-3 text-sm">
          <Row label="상태">
            <span className="flex items-center gap-1.5 font-medium">
              <span className={`h-2 w-2 rounded-full ${toneClasses[tone].dot}`} />
              {label}
            </span>
          </Row>
          {machine.roomNumber && (tone === "reserved" || tone === "inUse") && (
            <Row label="사용 호실">{machine.roomNumber}호</Row>
          )}
          {tone === "inUse" && completion && (
            <>
              <Row label="남은 시간">
                <span className="tabular-nums">
                  {completion.getTime() > now ? formatCountdown(completion.getTime() - now) : "곧 완료"}
                </span>
              </Row>
              <Row label="완료 예정">{formatClock(completion)}</Row>
            </>
          )}
        </div>

        <div className="space-y-2">
          <Button
            className="w-full bg-[#86A9FF] hover:bg-[#6487DB]"
            disabled={!context || blockReason !== null || isReserving}
            onClick={() => void handleReserve()}
          >
            {isReserving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CalendarPlus className="mr-2 h-4 w-4" />
            )}
            예약하기
          </Button>
          <p className="text-center text-xs text-gray-500">
            {!context
              ? "예약 가능 여부를 확인하고 있습니다."
              : blockReason
                ? blockMessage(blockReason, machine, context)
                : `예약 후 ${RESERVED_TIMEOUT_MINUTES}분 안에 기기를 시작해 주세요.`}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900">{children}</span>
    </div>
  )
}
