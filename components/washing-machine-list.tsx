"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Shirt, Clock, MapPin, AlertTriangle, CheckCircle, Loader2, Home } from "lucide-react"
import { useReservationStore, type FloorType } from "@/lib/reservation-store"
import { useToast } from "@/components/ui/use-toast"
import { LayoutModal } from "@/components/layout-modal"
import { ReportMachineModal } from "@/components/report-machine-modal"
import { reservationApi } from "@/lib/api-client"
import { formatTime } from "@/lib/utils"

export function WashingMachineList() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [reservingMachineId, setReservingMachineId] = useState<string | null>(null)

  const {
    machines,
    reservations,
    getCurrentUser,
    hasActiveReservation,
    hasActiveReservationByRoom,
    getAccessibleFloors,
    fetchMachines,
    fetchMyInfo,
    getMachineOperatingStateInfo,
    getMachineReservationInfo,
    decrementTimers,
  } = useReservationStore()

  const currentUser = getCurrentUser()
  const userId = currentUser?.id || localStorage.getItem("studentId") || ""
  const userRoomNumber = currentUser?.roomNumber || localStorage.getItem("roomNumber") || ""
  const accessibleFloors = getAccessibleFloors(userId)

  // 사용자 정지 상태 확인 함수 추가
  const isCurrentUserRestricted = () => {
    if (!currentUser?.restrictedUntil) return false
    return new Date() < new Date(currentUser.restrictedUntil)
  }

  // 1초마다 타이머 감소
  useEffect(() => {
    const timer = setInterval(() => {
      decrementTimers()
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // 세탁기만 필터링하고 접근 가능한 층만 표시
  const washingMachines = machines.filter(
    (machine) => machine.type === "washing" && accessibleFloors.includes(machine.floor),
  )

  // 층별로 그룹화
  const machinesByFloor = washingMachines.reduce(
    (acc, machine) => {
      if (!acc[machine.floor]) {
        acc[machine.floor] = []
      }
      acc[machine.floor].push(machine)
      return acc
    },
    {} as Record<FloorType, typeof washingMachines>,
  )

  // 예약하기
  const handleReserveMachine = async (machineServerId: number, machineId: string) => {
    // 정지 상태 확인
    if (isCurrentUserRestricted()) {
      toast({
        title: "예약 불가",
        description: "계정이 정지된 상태입니다. 관리자에게 문의하세요.",
        variant: "destructive",
      })
      return
    }

    if (hasActiveReservation(userId)) {
      toast({
        title: "예약 불가",
        description: "이미 활성화된 예약이 있습니다.",
        variant: "destructive",
      })
      return
    }

    if (hasActiveReservationByRoom(userRoomNumber)) {
      toast({
        title: "예약 불가",
        description: "이미 호실에 활성화된 예약이 있습니다.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setReservingMachineId(machineId)

    try {
      console.log(`📅 Attempting to reserve machine:`, {
        machineServerId,
        machineId,
        userId,
      })

      const response = await reservationApi.createReservation(machineServerId)

      if (response.success) {
        toast({
          title: "예약 성공",
          description: "세탁기가 예약되었습니다. 5분 이내에 확정해주세요.",
        })

        // 데이터 새로고침
        await fetchMyInfo(userId)
        await fetchMachines()
      }
    } catch (error: any) {
      console.error("❌ Reservation error:", error)

      let errorMessage = "예약 중 오류가 발생했습니다."

      if (error?.status === 400) {
        if (error.message.includes("이미 예약")) {
          errorMessage = "이미 예약된 기기입니다."
        } else if (error.message.includes("사용 중")) {
          errorMessage = "현재 사용 중인 기기입니다."
        } else if (error.message.includes("고장")) {
          errorMessage = "고장난 기기는 예약할 수 없습니다."
        } else {
          errorMessage = error.message
        }
      } else if (error?.status === 409) {
        errorMessage = "이미 다른 예약이 있습니다."
      } else if (error?.message) {
        errorMessage = error.message
      }

      toast({
        title: "예약 실패",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setReservingMachineId(null)
    }
  }

  // 기기 상태 가져오기
  const getMachineStatus = (machineId: string) => {
    const machine = machines.find((m) => m.id === machineId)
    const reservation = reservations.find(
      (r) =>
        r.machineId === machineId &&
        (r.status === "reserved" || r.status === "confirmed" || r.status === "running" || r.status === "collection"),
    )

    if (machine?.isOutOfOrder) return { status: "broken", color: "bg-red-500", text: "고장" }
    if (reservation) {
      switch (reservation.status) {
        case "reserved":
        case "confirmed":
          return { status: "reserved", color: "bg-yellow-500", text: "예약됨" }
        case "running":
          return { status: "running", color: "bg-blue-500", text: "사용중" }
        case "collection":
          return { status: "collection", color: "bg-purple-500", text: "수거대기" }
      }
    }
    if (machine?.status === "in-use") return { status: "in-use", color: "bg-blue-500", text: "사용중" }
    return { status: "available", color: "bg-green-500", text: "사용가능" }
  }

  // 기기의 예약 호실 정보 가져오기
  const getMachineReservationRoom = (machineId: string) => {
    const reservation = reservations.find(
      (r) =>
        r.machineId === machineId &&
        (r.status === "reserved" || r.status === "confirmed" || r.status === "running" || r.status === "collection"),
    )
    return reservation?.roomNumber || null
  }

  if (washingMachines.length === 0) {
    return (
      <div className="text-center py-8">
        <Shirt className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 mb-4">접근 가능한 세탁기가 없습니다.</p>
        <p className="text-sm text-gray-400">관리자에게 문의하세요.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(machinesByFloor)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([floor, floorMachines]) => (
          <div key={floor} className="space-y-4">
            {/* 층 헤더 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-[#6487DB] dark:text-white">{floor} 세탁기</h3>
                <Badge variant="outline" className="text-xs">
                  {floorMachines.length}대
                </Badge>
              </div>
              <LayoutModal floor={floor as FloorType} />
            </div>

            {/* 기기 목록 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {floorMachines
                .sort((a, b) => a.location.localeCompare(b.location))
                .map((machine) => {
                  const status = getMachineStatus(machine.id)
                  const operatingStateInfo = getMachineOperatingStateInfo(machine.id)
                  const reservationInfo = getMachineReservationInfo(machine.id)
                  const reservationRoom = getMachineReservationRoom(machine.id)
                  const isReserving = reservingMachineId === machine.id

                  return (
                    <Card
                      key={machine.id}
                      className={`transition-all duration-200 hover:shadow-md ${
                        status.status === "available"
                          ? "border-green-200 hover:border-green-300 dark:border-green-800"
                          : status.status === "broken"
                            ? "border-red-200 dark:border-red-800"
                            : "border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Shirt className="h-4 w-4 text-[#86A9FF]" />
                            {machine.id}
                          </CardTitle>
                          <Badge className={`${status.color} text-white border-0 text-xs`}>{status.text}</Badge>
                        </div>
                        <CardDescription className="text-xs">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {machine.location} 위치
                          </div>
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="pt-0 space-y-3">
                        {/* 기기 작동 상태 */}
                        <div className={`p-2 rounded-md border text-xs ${operatingStateInfo.color}`}>
                          <div className="flex items-center gap-2">
                            <span>{operatingStateInfo.icon}</span>
                            <div className="flex-1">
                              <div className="font-medium">{operatingStateInfo.text}</div>
                              <div className="text-xs opacity-75 mt-1">{operatingStateInfo.description}</div>
                            </div>
                          </div>
                        </div>

                        {/* 예약 호실 정보 */}
                        {reservationRoom && (
                          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md">
                            <Home className="h-4 w-4" />
                            <span className="font-medium">{reservationRoom}호 예약</span>
                          </div>
                        )}

                        {/* 남은 시간 표시 - 예약이 있을 때만 표시 */}
                        {reservationInfo.hasReservation &&
                          reservationInfo.remainingTime &&
                          reservationInfo.remainingTime > 0 && (
                            <div
                              className={`flex items-center gap-2 text-sm ${
                                reservationInfo.reservationStatus === "running"
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-orange-600 dark:text-orange-400"
                              }`}
                            >
                              <Clock className="h-4 w-4" />
                              <span>
                                {reservationInfo.reservationStatus === "running"
                                  ? machine.id.toLowerCase().includes("dryer")
                                    ? "건조 완료까지"
                                    : "세탁 완료까지"
                                  : reservationInfo.timeLabel}
                                : {formatTime(reservationInfo.remainingTime)}
                              </span>
                            </div>
                          )}

                        <Separator />

                        {/* 버튼 영역 */}
                        <div className="flex gap-2">
                          {status.status === "available" && !machine.isOutOfOrder && (
                            <Button
                              onClick={() => handleReserveMachine(machine.serverId, machine.id)}
                              disabled={
                                isLoading ||
                                hasActiveReservation(userId) ||
                                hasActiveReservationByRoom(userRoomNumber) ||
                                isCurrentUserRestricted()
                              }
                              className="flex-1 bg-[#86A9FF] hover:bg-[#6487DB] text-white text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isReserving ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  예약 중...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  {isCurrentUserRestricted() ? "정지됨" : "예약하기"}
                                </>
                              )}
                            </Button>
                          )}

                          {status.status === "broken" && (
                            <div className="flex-1 text-center py-2">
                              <p className="text-sm text-red-600 dark:text-red-400">고장으로 사용 불가</p>
                            </div>
                          )}

                          {(status.status === "reserved" ||
                            status.status === "running" ||
                            status.status === "collection") && (
                            <Button variant="outline" disabled className="flex-1 text-sm py-2 cursor-not-allowed">
                              사용 중
                            </Button>
                          )}

                          {/* 고장 신고 버튼 */}
                          <ReportMachineModal machineName={machine.id} machineType="washing" />
                        </div>

                        {/* 예약 불가 메시지 */}
                        {(hasActiveReservation(userId) ||
                          hasActiveReservationByRoom(userRoomNumber) ||
                          isCurrentUserRestricted()) &&
                          status.status === "available" && (
                            <div className="text-xs text-orange-600 dark:text-orange-400 text-center">
                              <AlertTriangle className="h-3 w-3 inline mr-1" />
                              {isCurrentUserRestricted()
                                ? "계정이 정지되어 예약할 수 없습니다"
                                : hasActiveReservation(userId)
                                  ? "이미 활성화된 예약이 있습니다"
                                  : "이미 호실에 활성화된 예약이 있습니다"}
                            </div>
                          )}
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </div>
        ))}
    </div>
  )
}
