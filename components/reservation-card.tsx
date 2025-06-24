"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, Shirt, Wind, User, Building, AlertTriangle, CheckCircle, XCircle, Zap } from "lucide-react"
import { useReservationStore, type Reservation } from "@/lib/reservation-store"
import { formatTime } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { reservationApi } from "@/lib/api-client"

interface ReservationCardProps {
  reservation: Reservation
}

export function ReservationCard({ reservation }: ReservationCardProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const {
    updateReservation,
    cancelReservation,
    fetchMyInfo,
    fetchMachines,
    getCurrentUser,
    getMachineOperatingStateInfo,
  } = useReservationStore()

  const currentUser = getCurrentUser()
  const userId = currentUser?.id || localStorage.getItem("studentId") || ""
  const operatingStateInfo = getMachineOperatingStateInfo(reservation.machineId)

  // 예약 확인 (세탁/건조 시작)
  const handleConfirmReservation = async () => {
    setIsLoading(true)
    try {
      // serverId가 있으면 사용, 없으면 일반 id 사용
      const reservationIdToConfirm = reservation.serverId || reservation.id
      console.log(`✅ Attempting to confirm reservation:`, {
        clientId: reservation.id,
        serverId: reservation.serverId,
        usingId: reservationIdToConfirm,
      })

      const response = await reservationApi.confirmReservation(reservationIdToConfirm)

      if (response.success) {
        toast({
          title: "예약 확인 완료",
          description: `${reservation.type === "washing" ? "세탁" : "건조"}을 시작합니다.`,
        })

        // 데이터 새로고침
        await fetchMyInfo(userId)
        await fetchMachines()
      }
    } catch (error: any) {
      console.error("❌ Confirm reservation error:", error)

      let errorMessage = "예약 확인 중 오류가 발생했습니다."

      if (error?.status === 404) {
        errorMessage = "예약을 찾을 수 없습니다. 이미 취소되었거나 만료되었을 수 있습니다."
        // 404 에러인 경우 로컬에서도 제거
        cancelReservation(reservation.id)
        await fetchMyInfo(userId)
        await fetchMachines()
      } else if (error?.message) {
        errorMessage = error.message
      }

      toast({
        title: "예약 확인 실패",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 예약 취소
  const handleCancelReservation = async () => {
    setIsLoading(true)
    try {
      // serverId가 있으면 사용, 없으면 일반 id 사용
      const reservationIdToDelete = reservation.serverId || reservation.id
      console.log(`🗑️ Attempting to delete reservation:`, {
        clientId: reservation.id,
        serverId: reservation.serverId,
        usingId: reservationIdToDelete,
      })

      const response = await reservationApi.deleteReservation(reservationIdToDelete)

      if (response.success) {
        toast({
          title: "예약 취소 완료",
          description: "예약이 성공적으로 취소되었습니다.",
        })

        // 로컬 상태에서도 제거
        cancelReservation(reservation.id)

        // 데이터 새로고침
        await fetchMyInfo(userId)
        await fetchMachines()
      }
    } catch (error: any) {
      console.error("❌ Cancel reservation error:", error)

      let errorMessage = "예약 취소 중 오류가 발생했습니다."

      if (error?.status === 404) {
        errorMessage = "예약을 찾을 수 없습니다. 이미 취소되었거나 만료되었을 수 있습니다."
        // 404 에러인 경우 로컬에서도 제거
        cancelReservation(reservation.id)
        await fetchMyInfo(userId)
        await fetchMachines()
      } else if (error?.message) {
        errorMessage = error.message
      }

      toast({
        title: "예약 취소 실패",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 상태별 색상 및 텍스트
  const getStatusInfo = () => {
    switch (reservation.status) {
      case "reserved":
        return {
          color: "bg-yellow-500",
          text: "예약됨",
          description: "5분 이내에 확인 버튼을 눌러주세요",
          icon: Clock,
        }
      case "confirmed":
        return {
          color: "bg-blue-500",
          text: "확인됨",
          description: "기기에서 시작 버튼을 눌러주세요",
          icon: CheckCircle,
        }
      case "running":
        return {
          color: "bg-green-500",
          text: "사용 중",
          description: "현재 사용 중입니다",
          icon: Zap,
        }
      case "collection":
        return {
          color: "bg-purple-500",
          text: "수거 대기",
          description: "세탁물을 수거해주세요",
          icon: AlertTriangle,
        }
      case "connecting":
        return {
          color: "bg-orange-500",
          text: "연결 중",
          description: "기기와 연결 중입니다",
          icon: Clock,
        }
      default:
        return {
          color: "bg-gray-500",
          text: "알 수 없음",
          description: "",
          icon: XCircle,
        }
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  return (
    <Card className="overflow-hidden border-[#EDF2FF] dark:border-gray-700">
      <CardHeader className="bg-[#F5F8FF] dark:bg-gray-700 py-3">
        <CardTitle className="text-[#6487DB] dark:text-[#86A9FF] text-base flex items-center justify-between">
          <div className="flex items-center">
            {reservation.type === "washing" ? (
              <Shirt className="h-5 w-5 mr-2 text-[#86A9FF]" />
            ) : (
              <Wind className="h-5 w-5 mr-2 text-[#86A9FF]" />
            )}
            {reservation.machineId}
          </div>
          <Badge className={`${statusInfo.color} text-white border-0`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.text}
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs dark:text-gray-400">
          {reservation.type === "washing" ? "세탁기" : "건조기"} 예약
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4">
        {/* 기기 작동 상태 표시 */}
        <div className={`mb-3 p-2 rounded-md border ${operatingStateInfo.color}`}>
          <div className="flex items-center gap-2">
            <span className="text-sm">{operatingStateInfo.icon}</span>
            <div className="flex-1">
              <div className="text-xs font-medium">기기 상태: {operatingStateInfo.text}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{operatingStateInfo.description}</div>
            </div>
          </div>
        </div>

        {/* 예약 정보 */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm">
            <User className="h-4 w-4 mr-2 text-[#86A9FF]" />
            <span className="text-gray-600 dark:text-gray-400">사용자:</span>
            <span className="ml-1 font-medium dark:text-white">{currentUser?.name || "알 수 없음"}</span>
          </div>

          <div className="flex items-center text-sm">
            <Building className="h-4 w-4 mr-2 text-[#86A9FF]" />
            <span className="text-gray-600 dark:text-gray-400">호실:</span>
            <span className="ml-1 font-medium dark:text-white">{reservation.roomNumber}</span>
          </div>

          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-2 text-[#86A9FF]" />
            <span className="text-gray-600 dark:text-gray-400">시작 시간:</span>
            <span className="ml-1 font-medium dark:text-white">{reservation.startTime}</span>
          </div>

          {reservation.timeRemaining > 0 && (
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-2 text-[#86A9FF]" />
              <span className="text-gray-600 dark:text-gray-400">남은 시간:</span>
              <span className="ml-1 font-medium text-red-600 dark:text-red-400">
                {formatTime(reservation.timeRemaining)}
              </span>
            </div>
          )}
        </div>

        {/* 상태 설명 */}
        {statusInfo.description && (
          <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-400">{statusInfo.description}</p>
          </div>
        )}

        <Separator className="my-3 dark:bg-gray-700" />

        {/* 버튼 영역 */}
        <div className="flex flex-col gap-2">
          {reservation.status === "reserved" && (
            <Button
              onClick={handleConfirmReservation}
              disabled={isLoading}
              className="w-full bg-[#86A9FF] hover:bg-[#6487DB] text-white dark:bg-[#6487DB] dark:hover:bg-[#86A9FF]"
            >
              {isLoading ? "처리 중..." : `${reservation.type === "washing" ? "세탁" : "건조"}할게요`}
            </Button>
          )}

          {(reservation.status === "reserved" ||
            reservation.status === "confirmed" ||
            reservation.status === "connecting") && (
            <Button
              variant="outline"
              onClick={handleCancelReservation}
              disabled={isLoading}
              className="w-full border-red-500 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-500 dark:hover:bg-red-900/20"
            >
              {isLoading ? "취소 중..." : "예약 취소"}
            </Button>
          )}
        </div>

        {/* 메시지 */}
        {reservation.message && (
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">{reservation.message}</div>
        )}
      </CardContent>
    </Card>
  )
}
