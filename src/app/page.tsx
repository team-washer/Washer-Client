"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Shirt, Wind, RefreshCw, AlertCircle, Calendar } from "lucide-react"
import { WashingMachineList } from "@/shared/components/washing-machine-list"
import { DryerList } from "@/shared/components/dryer-list"
import { ReservationCard } from "@/shared/components/reservation-card"
import { useReservationStore } from "@/shared/lib/reservation-store"
import { useToast } from "@/shared/components/ui/use-toast"
import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh"

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
    fetchMachines,
    fetchMyInfo,
    decrementTimers,
  } = useReservationStore()

  const currentUser = getCurrentUser();
  const [userRoomNumber] = useState(currentUser?.roomNumber || "")

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

      setIsLoading(true)

      try {
        // 1순위: 기기 상태와 남은 시간 정보 먼저 로드
        await fetchMachines()

        setIsInitialized(true) // 초기화 완료 표시
      } catch (error: any) {
        toast({
          title: "데이터 로드 실패",
          description: error.response?.data?.message,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [isInitialized]) // isInitialized만 의존성으로 사용

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchMachines()
        fetchMyInfo()
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

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

  // Pull to refresh 설정 (메모이제이션)
  const pullToRefreshHandler = useCallback(async () => {
    if (refreshCooldown > 0) return

    setRefreshCooldown(5)
    try {
      await fetchMachines()
      await fetchMyInfo()
      toast({
        title: "새로고침 완료",
        description: "최신 정보로 업데이트되었습니다.",
      })
    } catch (error: any) {
      toast({
        title: "새로고침 실패",
        description: error.response?.data?.message,
        variant: "destructive",
      })
    }
  }, [refreshCooldown, fetchMachines, fetchMyInfo, toast])

  const { pullDistance, isPulling, isRefreshing } = usePullToRefresh({
    onRefresh: pullToRefreshHandler,
    disabled: isLoading,
  })

  const userReservations = reservations.filter((r) => r.roomNumber === userRoomNumber)

  // 통계 계산
  const totalMachines = machines.length
  const availableMachines = machines.filter((m) => !m.isOutOfOrder && m.status === "AVAILABLE").length
  const inUseMachines = machines.filter((m) => m.status === "IN-USE" || m.status === "RESERVED").length

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      {/* Pull to refresh indicator - 완전히 새로운 접근 */}
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

      {/* 메인 컨텐츠 */}
      <div
        className="container mx-auto px-4 py-6 space-y-6"
        style={{
          transform: `translateY(${Math.min(pullDistance, 100)}px)`,
          transition: isPulling ? "none" : "transform 0.3s ease-out",
        }}
      >
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
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted p-2 rounded-lg">
                <TabsTrigger
                  value="washing"
                  className="flex items-center gap-2 h-8 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-sm px-4 py-2"
                >
                  <Shirt className="h-4 w-4" />
                  세탁기
                </TabsTrigger>
                <TabsTrigger
                  value="dryer"
                  className="flex items-center gap-2 h-8 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-sm px-4 py-2"
                >
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
