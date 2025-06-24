"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shirt, Wind, Settings, RefreshCw, AlertCircle, Calendar } from "lucide-react"
import { WashingMachineList } from "@/components/washing-machine-list"
import { DryerList } from "@/components/dryer-list"
import { ReservationCard } from "@/components/reservation-card"
import { useReservationStore } from "@/lib/reservation-store"
import { useToast } from "@/components/ui/use-toast"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"

export default function HomePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [refreshCooldown, setRefreshCooldown] = useState(0)
  const [activeTab, setActiveTab] = useState("washing")
  const [isInitialized, setIsInitialized] = useState(false)

  const {
    machines,
    reservations,
    getCurrentUser,
    hasActiveReservation,
    hasActiveReservationByRoom,
    fetchMachines,
    fetchMyInfo,
    decrementTimers,
  } = useReservationStore()

  const currentUser = getCurrentUser()
  const [userId, setUserId] = useState("")
  const [userRoomNumber, setUserRoomNumber] = useState("")

  // localStorage 접근을 위한 useEffect (한 번만 실행)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("studentId") || ""
      const storedRoomNumber = localStorage.getItem("roomNumber") || ""
      setUserId(currentUser?.id || storedUserId)
      setUserRoomNumber(currentUser?.roomNumber || storedRoomNumber)
    }
  }, [currentUser])

  // 사용자 정지 상태 확인
  const isCurrentUserRestricted = useCallback(() => {
    if (!currentUser?.restrictedUntil) return false
    return new Date() < new Date(currentUser.restrictedUntil)
  }, [currentUser?.restrictedUntil])

  // 초기 데이터 로드 (한 번만 실행)
  useEffect(() => {
    if (isInitialized) return // 이미 초기화되었으면 실행하지 않음

    const initializeData = async () => {
      if (typeof window === "undefined") return

      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
      if (!isLoggedIn) {
        router.push("/login")
        return
      }

      console.log("🚀 Initializing data (one time only)...")
      setIsLoading(true)

      try {
        // 1순위: 기기 상태와 남은 시간 정보 먼저 로드
        await fetchMachines()

        // 2순위: 사용자 정보 로드
        const currentUserId = currentUser?.id || localStorage.getItem("studentId")
        if (currentUserId) {
          await fetchMyInfo(currentUserId)
        }

        setIsInitialized(true) // 초기화 완료 표시
        console.log("✅ Data initialization completed")
      } catch (error) {
        console.error("❌ Failed to initialize data:", error)
        toast({
          title: "데이터 로드 실패",
          description: "데이터를 불러오는 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [isInitialized]) // isInitialized만 의존성으로 사용

  // 1초마다 타이머 감소 (메모이제이션으로 최적화)
  useEffect(() => {
    const timer = setInterval(() => {
      decrementTimers()
    }, 1000)

    return () => clearInterval(timer)
  }, [decrementTimers])

  // 새로고침 쿨타임 타이머
  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setTimeout(() => {
        setRefreshCooldown(refreshCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [refreshCooldown])

  // 수동 새로고침 함수
  const handleRefresh = useCallback(async () => {
    if (refreshCooldown > 0) {
      toast({
        title: "새로고침 대기",
        description: `${refreshCooldown}초 후에 다시 시도해주세요.`,
        variant: "destructive",
      })
      return
    }

    console.log("🔄 Manual refresh triggered")
    setRefreshCooldown(5)
    setIsLoading(true)

    try {
      await fetchMachines()
      if (userId) {
        await fetchMyInfo(userId)
      }
      toast({
        title: "새로고침 완료",
        description: "최신 정보로 업데이트되었습니다.",
      })
    } catch (error) {
      toast({
        title: "새로고침 실패",
        description: "데이터를 새로고침하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [refreshCooldown, userId, fetchMachines, fetchMyInfo, toast])

  // Pull to refresh 설정 (메모이제이션)
  const pullToRefreshHandler = useCallback(async () => {
    if (refreshCooldown > 0) return

    console.log("📱 Pull to refresh triggered")
    setRefreshCooldown(5)
    try {
      await fetchMachines()
      if (userId) {
        await fetchMyInfo(userId)
      }
      toast({
        title: "새로고침 완료",
        description: "최신 정보로 업데이트되었습니다.",
      })
    } catch (error) {
      toast({
        title: "새로고침 실패",
        description: "데이터를 새로고침하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }, [refreshCooldown, userId, fetchMachines, fetchMyInfo, toast])

  usePullToRefresh(pullToRefreshHandler)

  const userReservations = reservations.filter((r) => r.userId === userId)

  // 통계 계산
  const totalMachines = machines.length
  const availableMachines = machines.filter((m) => !m.isOutOfOrder && m.status === "available").length
  const inUseMachines = machines.filter((m) => m.status === "in-use" || m.status === "reserved").length

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-[#86A9FF]" />
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#86A9FF] rounded-lg">
                <Shirt className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[#6487DB] dark:text-white">Washer</h1>
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
                <span className="sm:hidden">{refreshCooldown > 0 ? `${refreshCooldown}` : "새로고침"}</span>
              </Button>

              {currentUser?.isAdmin && (
                <Button
                  onClick={() => router.push("/admin")}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">관리자</span>
                  <span className="sm:hidden">관리</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* 사용자 제재 알림 */}
        {isCurrentUserRestricted() && (
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-400">
              <strong>서비스 이용 제한</strong>
              <br />
              제한 해제: {new Date(currentUser!.restrictedUntil!).toLocaleString()}
              <br />
              사유: {currentUser?.restrictionReason || "관리자에 의한 제한"}
            </AlertDescription>
          </Alert>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-gray-500">전체</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{totalMachines}대</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-gray-500">가능</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-600">{availableMachines}대</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-gray-500">사용중</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-600">{inUseMachines}대</div>
            </CardContent>
          </Card>
        </div>

        {/* 내 예약 현황 */}
        {userReservations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />내 예약 현황
              </CardTitle>
              <CardDescription>현재 활성화된 예약을 확인하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userReservations.map((reservation) => (
                <ReservationCard key={reservation.id} reservation={reservation} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* 기기 예약 섹션 */}
        <Card className="w-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">기기 예약</CardTitle>
            <CardDescription>사용하고 싶은 세탁기나 건조기를 선택하세요</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
                <TabsTrigger value="washing" className="flex items-center gap-2 h-10">
                  <Shirt className="h-4 w-4" />
                  세탁기
                </TabsTrigger>
                <TabsTrigger value="dryer" className="flex items-center gap-2 h-10">
                  <Wind className="h-4 w-4" />
                  건조기
                </TabsTrigger>
              </TabsList>

              <TabsContent value="washing" className="mt-0">
                <WashingMachineList />
              </TabsContent>

              <TabsContent value="dryer" className="mt-0">
                <DryerList />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
