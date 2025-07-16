"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Separator } from "@/shared/components/ui/separator"
import {
  User,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Play,
  RefreshCw,
  Loader2,
  GraduationCap,
} from "lucide-react"
import { useToast } from "@/shared/components/ui/use-toast"
import {
  userApi,
  reservationApi,
  machineApi,
  getMachineJobStateInfo,
  parseTimeStringToSeconds,
  type UserInfo,
} from "@/shared/lib/api-client"
import { formatTime } from "@/shared/lib/utils"
import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh"

export default function MyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [remainingTime, setRemainingTime] = useState<number>(0)
  const [refreshCooldown, setRefreshCooldown] = useState(0)
  const [actionLoading, setActionLoading] = useState(false)
  const [machineCheckInterval, setMachineCheckInterval] = useState<NodeJS.Timeout | null>(null)
  const [currentMachineState, setCurrentMachineState] = useState<string>("")

  const loadUserInfo = async () => {
    try {
      setIsLoading(true)
      const response = await userApi.getMyInfo()

      if (response.success) {
        setUserInfo(response.data)

        // 서버에서 받은 remainingTime을 우선적으로 사용
        if (response.data.remainingTime && response.data.remainingTime !== "00:00:00") {
          // 서버에서 받은 remainingTime 파싱 (HH:MM:SS 형식)
          const parsedTime = parseTimeStringToSeconds(response.data.remainingTime)
          setRemainingTime(parsedTime)
        } else if (response.data.remainingSeconds && response.data.remainingSeconds > 0) {
          // remainingSeconds가 있으면 사용
          setRemainingTime(response.data.remainingSeconds)
        } else {
          // 서버에서 시간 정보가 없을 때만 클라이언트에서 추정
          if (response.data.status === "waiting") {
            // 대기 중: 5분 (300초)
            setRemainingTime(300)
          } else if (response.data.status === "confirmed") {
            // 확정됨: 2분 (120초) - 서버 연결 대기 시간
            setRemainingTime(120)
          } else {
            setRemainingTime(0)
          }
        }
      }
    } catch (error: any) {
      console.error("Failed to load user info:", error)
      toast({
        title: "사용자 정보 로드 실패",
        description: error.message || "사용자 정보를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // 로그인 상태 확인
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    if (!isLoggedIn) {
      router.push("/login")
      return
    }

    loadUserInfo()
  }, [router])

  // 실시간 타이머 - 1초마다 남은 시간 감소
  useEffect(() => {
    if (remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            // 시간이 끝나면 사용자 정보 다시 로드
            loadUserInfo()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [remainingTime])

  // 새로고침 쿨타임 타이머
  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setTimeout(() => {
        setRefreshCooldown(refreshCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [refreshCooldown])

  // 기기 상태 체크 (confirmed 상태일 때 20초마다)
  const checkMachineStatus = useCallback(async () => {
    if (!userInfo?.reservationId || !userInfo?.machineLabel) return

    try {
      const response = await machineApi.getDevices()

      if (response.success) {
        const { washer, dryer } = response.data
        const allMachines = [...washer, ...dryer]

        // 현재 예약된 기기 찾기
        const currentMachine = allMachines.find((machine) => machine.label === userInfo.machineLabel)

        if (currentMachine) {
          const machineType = userInfo.machineLabel?.toLowerCase().includes("dryer") ? "dryer" : "washer"
          const jobStateInfo = getMachineJobStateInfo(currentMachine, machineType)

          // 현재 기기 상태 업데이트
          setCurrentMachineState(jobStateInfo.text)

          // machineState가 run이면 실제 세탁/건조 시작됨
          if (currentMachine.machineState === "run") {
            // 기기 상태 체크 중단
            if (machineCheckInterval) {
              clearInterval(machineCheckInterval)
              setMachineCheckInterval(null)
            }

            // remainingTime이 있으면 파싱해서 초로 변환
            if (currentMachine.remainingTime && currentMachine.remainingTime !== "00:00:00") {
              const calculatedTime = parseTimeStringToSeconds(currentMachine.remainingTime)
              setRemainingTime(calculatedTime)
            }

            // 사용자 정보 새로고침하여 running 상태로 업데이트
            const updatedUserInfo = await userApi.getMyInfo()
            if (updatedUserInfo.success) {
              setUserInfo(updatedUserInfo.data)
            }

            const machineTypeName = userInfo.machineLabel?.toLowerCase().includes("dryer") ? "건조기" : "세탁기"
            toast({
              title: `${machineTypeName} 작동 시작`,
              description: `기기가 정상적으로 작동을 시작했습니다. (${jobStateInfo.text})`,
            })
          }
        }
      }
    } catch (error) {
      console.error("❌ Failed to check machine status:", error)
    }
  }, [userInfo?.reservationId, userInfo?.machineLabel, machineCheckInterval])

  // confirmed 상태일 때 기기 상태 체크 시작
  useEffect(() => {
    if (userInfo?.status === "confirmed" && !machineCheckInterval) {
      const interval = setInterval(checkMachineStatus, 20000) // 20초마다
      setMachineCheckInterval(interval)

      // 즉시 한 번 체크
      checkMachineStatus()
    } else if (userInfo?.status !== "confirmed" && machineCheckInterval) {
      clearInterval(machineCheckInterval)
      setMachineCheckInterval(null)
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (machineCheckInterval) {
        clearInterval(machineCheckInterval)
      }
    }
  }, [userInfo?.status, machineCheckInterval, checkMachineStatus])

  const handleRefresh = async () => {
    if (refreshCooldown > 0) {
      toast({
        title: "새로고침 대기",
        description: `${refreshCooldown}초 후에 다시 시도해주세요.`,
        variant: "destructive",
      })
      return
    }

    setRefreshCooldown(5) // 5초 쿨타임 설정
    await loadUserInfo()

    toast({
      title: "새로고침 완료",
      description: "최신 정보로 업데이트되었습니다.",
    })
  }

  // Pull to refresh 설정
  const pullToRefreshHandler = useCallback(async () => {
    if (refreshCooldown > 0) return

    setRefreshCooldown(5)
    await loadUserInfo()

    toast({
      title: "새로고침 완료",
      description: "최신 정보로 업데이트되었습니다.",
    })
  }, [refreshCooldown, loadUserInfo, toast])

  const { pullDistance, isPulling, isRefreshing } = usePullToRefresh({
    onRefresh: pullToRefreshHandler,
    disabled: isLoading,
  })

  const handleCancelReservation = async () => {
    if (!userInfo?.reservationId) return

    setActionLoading(true)
    try {
      const response = await reservationApi.deleteReservation(userInfo.reservationId)

      if (response.success) {
        // 기기 상태 체크 중단
        if (machineCheckInterval) {
          clearInterval(machineCheckInterval)
          setMachineCheckInterval(null)
        }

        toast({
          title: "예약 취소 완료",
          description: "예약이 성공적으로 취소되었습니다.",
        })

        // 사용자 정보 새로고침
        const updatedUserInfo = await userApi.getMyInfo()
        if (updatedUserInfo.success) {
          setUserInfo(updatedUserInfo.data)
        }
      }
    } catch (error: any) {
      console.error("❌ Cancel reservation error:", error)
      toast({
        title: "예약 취소 실패",
        description: (error.message as string) || "예약 취소 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmReservation = async () => {
    if (!userInfo?.reservationId) return

    setActionLoading(true)
    try {
      const response = await reservationApi.confirmReservation(userInfo.reservationId)

      if (response.success) {
        const machineType = userInfo.machineLabel?.toLowerCase().includes("dryer") ? "건조" : "세탁"

        if (userInfo.status === "waiting") {
          toast({
            title: "예약 확정 완료",
            description: `예약이 확정되었습니다. ${machineType} 시작 버튼을 눌러주세요.`,
          })
        } else if (userInfo.status === "reserved") {
          toast({
            title: `${machineType} 시작`,
            description: `${machineType}기에 연결 중입니다. 잠시만 기다려주세요.`,
          })
        }

        // 사용자 정보 새로고침
        const updatedUserInfo = await userApi.getMyInfo()
        if (updatedUserInfo.success) {
          setUserInfo(updatedUserInfo.data)
        }
      }
    } catch (error: any) {
      console.error("❌ Confirm reservation error:", error)
      toast({
        title: "예약 확정 실패",
        description: error.message || "예약 확정 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
          >
            <Clock className="h-3 w-3 mr-1" />
            대기 중
          </Badge>
        )
      case "reserved":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            예약됨
          </Badge>
        )
      case "confirmed":
        return (
          <Badge variant="default" className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            연결 중
          </Badge>
        )
      case "running":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <Play className="h-3 w-3 mr-1" />
            사용 중
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="default" className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            완료됨
          </Badge>
        )
      default:
        return <Badge variant="outline">알 수 없음</Badge>
    }
  }

  const getStatusDescription = (status: string) => {
    switch (status) {
      case "waiting":
        return "예약이 대기 중입니다. 5분 이내에 확정해주세요."
      case "reserved":
        return "예약이 확정되었습니다. 세탁/건조를 시작해주세요."
      case "confirmed":
        return "기기에 연결 중입니다. 잠시만 기다려주세요."
      case "running":
        return "현재 세탁/건조가 진행 중입니다."
      case "completed":
        return "세탁/건조가 완료되었습니다."
      default:
        return ""
    }
  }

  const getRemainingTimeLabel = (status: string) => {
    switch (status) {
      case "waiting":
        return "확정까지 남은 시간"
      case "confirmed":
        return "연결까지 남은 시간"
      case "running":
        return "완료까지 남은 시간"
      default:
        return "남은 시간"
    }
  }

  const isRestricted = userInfo?.restrictedUntil && new Date(userInfo.restrictedUntil) > new Date()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#86A9FF] mx-auto mb-2"></div>
          <p className="text-gray-500">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!userInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">정보 로드 실패</CardTitle>
            <CardDescription>사용자 정보를 불러올 수 없습니다.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push("/")} className="bg-[#86A9FF] hover:bg-[#6487DB]">
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      {/* Pull to refresh indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="absolute -top-[100px] left-0 right-0 flex justify-center pt-20 z-50"
          style={{
            transform: `translateY(${Math.min(pullDistance * 0.5, 50)}px)`,
            transition: isPulling ? "none" : "transform 0.3s ease-out",
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg border">
            <RefreshCw className={`h-6 w-6 text-[#86A9FF] ${isRefreshing ? "animate-spin" : ""}`} />
          </div>
        </div>
      )}

      <div
        className="container mx-auto py-6 px-4 max-w-2xl relative overflow-hidden"
        style={{
          transform: `translateY(${Math.min(pullDistance, 100)}px)`,
          transition: isPulling ? "none" : "transform 0.3s ease-out",
        }}
      >
        <div className="space-y-6">
          {/* 헤더 */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#6487DB] dark:text-[#86A9FF] mb-2">마이페이지</h1>
              <p className="text-gray-600">내 정보와 예약 현황을 확인하세요</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshCooldown > 0}
              className="border-[#86A9FF] text-[#6487DB] hover:bg-[#EDF2FF] dark:border-[#6487DB] dark:text-[#86A9FF] dark:hover:bg-gray-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshCooldown > 0 ? "animate-spin" : ""}`} />
              {refreshCooldown > 0 ? `새로고침 (${refreshCooldown}초)` : "새로고침"}
            </Button>
          </div>

          {/* 사용자 정보 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                사용자 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">이름</span>
                  </div>
                  <p className="font-medium">{userInfo.name}</p>
                </div>

                {userInfo.schoolNumber && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">학번</span>
                    </div>
                    <p className="font-medium">{userInfo.schoolNumber}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">호실</span>
                  </div>
                  <p className="font-medium">{userInfo.roomNumber}호</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">성별</span>
                  </div>
                  <p className="font-medium">{userInfo.gender === "male" ? "남성" : "여성"}</p>
                </div>
              </div>

              {/* 제재 정보 */}
              {isRestricted && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800 dark:text-red-400">서비스 이용 제한</span>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-400 mb-1">
                    제한 해제: {new Date(userInfo.restrictedUntil!).toLocaleString()}
                  </p>
                  {userInfo.restrictionReason && (
                    <p className="text-sm text-red-700 dark:text-red-400">사유: {userInfo.restrictionReason}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 예약 정보 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                예약 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userInfo.reservationId ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-lg">{userInfo.machineLabel}</p>
                      <p className="text-sm text-gray-500">
                        예약 시작: {userInfo.startTime ? new Date(userInfo.startTime).toLocaleString() : "정보 없음"}
                      </p>
                    </div>
                    {userInfo.status && getStatusBadge(userInfo.status)}
                  </div>

                  {/* 상태 설명 */}
                  {userInfo.status && getStatusDescription(userInfo.status) && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        {getStatusDescription(userInfo.status)}
                      </p>
                    </div>
                  )}

                  {/* 기기 상태 체크 중 표시 */}
                  {userInfo.status === "confirmed" && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg dark:bg-orange-900/20 dark:border-orange-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="h-4 w-4 text-orange-600 animate-spin" />
                        <span className="text-sm text-orange-700 dark:text-orange-400">
                          기기 상태를 확인하고 있습니다... (20초마다 자동 확인)
                        </span>
                      </div>
                      {currentMachineState && (
                        <p className="text-xs text-orange-600 dark:text-orange-300">
                          현재 기기 상태: {currentMachineState}
                        </p>
                      )}
                    </div>
                  )}

                  {remainingTime > 0 && (
                    <div
                      className={`p-4 rounded-lg border ${
                        userInfo.status === "running"
                          ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                          : "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Clock
                          className={`h-5 w-5 ${userInfo.status === "running" ? "text-green-600" : "text-blue-600"}`}
                        />
                        <span
                          className={`font-medium ${
                            userInfo.status === "running"
                              ? "text-green-800 dark:text-green-400"
                              : "text-blue-800 dark:text-blue-400"
                          }`}
                        >
                          {getRemainingTimeLabel(userInfo.status || "")}
                        </span>
                      </div>
                      <p
                        className={`text-2xl font-bold ${
                          userInfo.status === "running"
                            ? "text-green-600 dark:text-green-400"
                            : "text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {formatTime(remainingTime)}
                      </p>
                    </div>
                  )}

                  <Separator />

                  <div className="flex gap-2">
                    {/* 대기 중일 때: 예약 확정 버튼 */}
                    {userInfo.status === "waiting" && (
                      <Button
                        onClick={handleConfirmReservation}
                        disabled={actionLoading}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {actionLoading ? "처리 중..." : "예약 확정"}
                      </Button>
                    )}

                    {/* 예약됨 상태일 때: 세탁/건조 시작 버튼 */}
                    {userInfo.status === "reserved" && (
                      <Button
                        onClick={handleConfirmReservation}
                        disabled={actionLoading}
                        className="flex-1 bg-[#86A9FF] hover:bg-[#6487DB]"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {actionLoading
                          ? "처리 중..."
                          : userInfo.machineLabel?.toLowerCase().includes("dryer")
                            ? "건조 시작"
                            : "세탁 시작"}
                      </Button>
                    )}

                    {/* 취소 버튼 - waiting, reserved, confirmed 상태에서만 표시 */}
                    {["waiting", "reserved", "confirmed"].includes(userInfo.status || "") && (
                      <Button
                        variant="destructive"
                        onClick={handleCancelReservation}
                        disabled={actionLoading}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {actionLoading ? "취소 중..." : "예약 취소"}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">현재 예약이 없습니다</p>
                  <Button onClick={() => router.push("/")} className="bg-[#86A9FF] hover:bg-[#6487DB]">
                    예약하러 가기
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 액션 버튼 */}
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.push("/")} className="flex-1">
              홈으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
