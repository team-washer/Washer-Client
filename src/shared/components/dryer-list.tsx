"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Separator } from "@/shared/components/ui/separator"
import { Wind, Clock, MapPin, AlertTriangle, CheckCircle, Loader2, Home, RefreshCw } from "lucide-react"
import { useReservationStore, type FloorType } from "@/shared/lib/reservation-store"
import { useToast } from "@/shared/components/ui/use-toast"
import { LayoutModal } from "@/shared/components/layout-modal"
import { ReportMachineModal } from "@/shared/components/report-machine-modal"
import { reservationApi } from "@/shared/lib/api-client"
import { formatTime } from "@/shared/lib/utils"
// import 문에 MachineHistoryModal 추가
import { MachineHistoryModal } from "@/shared/components/machine-history-modal"
import { AxiosError } from "axios"
import { useRouter } from "next/navigation"

export function DryerList() {
  const { toast } = useToast()
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false)
  const [reservingMachineId, setReservingMachineId] = useState<string | null>(null)
  const [refreshCooldown, setRefreshCooldown] = useState(0)

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

  // 새로고침 쿨다운 타이머
  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setTimeout(() => {
        setRefreshCooldown(refreshCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [refreshCooldown])

  // 새로고침 함수
  const handleRefresh = async () => {
    if (refreshCooldown > 0) return

    setRefreshCooldown(5) // 5초 쿨다운
    try {
      await fetchMachines()
      await fetchMyInfo()
      toast({
        title: "새로고침 완료",
        description: "건조기 정보가 업데이트되었습니다.",
      })
    } catch (error) {
      toast({
        title: "새로고침 실패",
        description: "데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  // 사용자 정지 상태 확인 함수 추가
  const isCurrentUserRestricted = () => {
    if (!currentUser?.restrictedUntil) return false
    return new Date() < new Date(currentUser.restrictedUntil)
  }

  // 건조기만 필터링하고 접근 가능한 층만 표시
  const dryers = machines.filter((machine) => machine.type === "dryer" && accessibleFloors.includes(machine.floor))

  // 층별로 그룹화
  const machinesByFloor = dryers.reduce(
    (acc, machine) => {
      if (!acc[machine.floor]) {
        acc[machine.floor] = []
      }
      acc[machine.floor].push(machine)
      return acc
    },
    {} as Record<FloorType, typeof dryers>,
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

    // 기기별 예약 가능 여부 확인 (서버 데이터 기반)
    const reservationCheck = useReservationStore.getState().canReserveMachine(machineId, userRoomNumber)
    if (!reservationCheck.canReserve) {
      toast({
        title: "예약 불가",
        description: reservationCheck.reason,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setReservingMachineId(machineId)

    try {
      const response = await reservationApi.createReservation(machineServerId)

      toast({
        title: "예약 성공",
        description: "건조기가 예약되었습니다. 5분 이내에 확정해주세요.",
      })

      // 데이터 새로고침
      await fetchMyInfo()
      await fetchMachines()
      router.push('my-page')
    } catch (error: any) {
      console.error("❌ Reservation error:", error.status)

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
      } else if (error?.response?.status === 403) {
        errorMessage = "정지된 사용자입니다."
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

  // 기기 상태 가져오기 (서버 데이터 활용)
  const getMachineStatus = (machineId: string) => {
    const machine = machines.find((m) => m.id === machineId)

    if (!machine) return { status: "unknown", color: "bg-gray-500", text: "알 수 없음" }
    if (machine.isOutOfOrder) return { status: "BROKEN", color: "bg-red-500", text: "고장" }

    // 서버에서 받은 예약 정보 확인
    if (machine.reservations && machine.reservations.length > 0) {
      const activeReservation = machine.reservations.find(
        (r) => r.status === "WAITING" || r.status === "RESERVED" || r.status === "CONFIRMED" || r.status === "RUNNING",
      )

      if (activeReservation) {
        switch (activeReservation.status) {
          case "WAITING":
          case "RESERVED":
            return { status: "RESERVED", color: "bg-yellow-500", text: "예약됨" }
          case "CONFIRMED":
            return { status: "CONFIRMED", color: "bg-orange-500", text: "확정됨" }
          case "RUNNING":
            return { status: "RUNNING", color: "bg-blue-500", text: "사용중" }
        }
      }
    }

    // 기본 상태 확인
    if (machine.status === "IN-USE") return { status: "IN-USE", color: "bg-blue-500", text: "사용중" }
    return { status: "AVAILABLE", color: "bg-green-500", text: "사용가능" }
  }

  // 기기의 예약 호실 정보 가져오기
  const getMachineReservationRoom = (machineId: string) => {
    return useReservationStore.getState().getMachineReservationRoom(machineId)
  }

  // 현재 사용자가 해당 기기를 예약/확정했는지 확인
  const isUserMachine = (machineId: string) => {
    const machine = machines.find((m) => m.id === machineId)
    if (!machine || !machine.reservations || machine.reservations.length === 0) {
      return false
    }

    const activeReservation = machine.reservations.find(
      (r) => r.status === "WAITING" || r.status === "RESERVED" || r.status === "CONFIRMED" || r.status === "RUNNING",
    )

    return activeReservation && activeReservation.room === userRoomNumber
  }

  useEffect(() => {
    // 1초마다 타이머 감소
    const timer = setInterval(() => {
      // 스토어의 decrementTimers 함수 호출
      decrementTimers()
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (dryers.length === 0) {
    return (
      <div className="text-center py-8">
        <Wind className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 mb-4">접근 가능한 건조기가 없습니다.</p>
        <p className="text-sm text-gray-400">관리자에게 문의하세요.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(machinesByFloor)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([floorString, floorMachines]) => {
          const floor = Number(floorString) as FloorType;

          return (
            <div key={floor} className="space-y-4">
              {/* 층 헤더 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-[#6487DB] dark:text-white">{floor}층 건조기</h3>
                  <Badge variant="outline" className="text-xs">
                    {floorMachines.length}대
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleRefresh}
                    disabled={refreshCooldown > 0}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshCooldown > 0 ? "animate-spin" : ""}`} />
                    <span className="hidden sm:inline">{refreshCooldown > 0 ? `${refreshCooldown}초` : "새로고침"}</span>
                  </Button>
                  <LayoutModal floor={floor} />
                </div>
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
                    const isMyMachine = isUserMachine(machine.id)

                    return (
                      <Card
                        key={machine.id}
                        className={`transition-all duration-200 hover:shadow-md ${status.status === "AVAILABLE"
                          ? "border-green-200 hover:border-green-300 dark:border-green-800"
                          : status.status === "BROKEN"
                            ? "border-red-200 dark:border-red-800"
                            : "border-gray-200 dark:border-gray-700"
                          }`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Wind className="h-4 w-4 text-[#86A9FF]" />
                              {machine.id}
                            </CardTitle>
                            <Badge className={`${status.color} text-white border-0 text-xs`}>{status.text}</Badge>
                          </div>
                          <CardDescription className="text-xs flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {machine.location} 위치
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
                              <span className="font-medium">
                                {reservationRoom}호 {isMyMachine ? "(내 예약)" : "예약"}
                              </span>
                            </div>
                          )}

                          {/* 남은 시간 표시 - 예약이 있을 때만 표시 */}
                          {reservationInfo.hasReservation &&
                            reservationInfo.remainingTime &&
                            reservationInfo.remainingTime > 0 && (
                              <div
                                className={`flex items-center gap-2 text-sm ${reservationInfo.reservationStatus === "RUNNING"
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-orange-600 dark:text-orange-400"
                                  }`}
                              >
                                <Clock className="h-4 w-4" />
                                <span>
                                  {reservationInfo.reservationStatus === "RUNNING"
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
                            {status.status === "AVAILABLE" && !machine.isOutOfOrder && (
                              <Button
                                onClick={() => handleReserveMachine(machine.serverId, machine.id)}
                                disabled={
                                  isLoading ||
                                  hasActiveReservation(userId) ||
                                  hasActiveReservationByRoom(userRoomNumber) ||
                                  isCurrentUserRestricted() ||
                                  !!currentUser?.reservationId
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

                            {status.status === "BROKEN" && (
                              <div className="flex-1 text-center py-2">
                                <p className="text-sm text-red-600 dark:text-red-400">고장으로 사용 불가</p>
                              </div>
                            )}

                            {(status.status === "RESERVED" ||
                              status.status === "CONFIRMED" ||
                              status.status === "RUNNING" ||
                              status.status === "COLLECTION") && (
                                <Button
                                  variant="outline"
                                  disabled
                                  className="flex-1 text-sm py-2 cursor-not-allowed bg-transparent"
                                >
                                  {isMyMachine ? "내 예약" : "사용 중"}
                                </Button>
                              )}

                            {/* 고장 신고 버튼 */}
                            <ReportMachineModal machineName={machine.id} machineType="dryer" />

                            {/* 히스토리 버튼 */}
                            <MachineHistoryModal machineId={machine.serverId} machineName={machine.id} />
                          </div>

                          {/* 예약 불가 메시지 */}
                          {(hasActiveReservation(userId) ||
                            hasActiveReservationByRoom(userRoomNumber) ||
                            isCurrentUserRestricted()) &&
                            status.status === "AVAILABLE" && (
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
          )
        })}
    </div>
  )
}
