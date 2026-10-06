"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Loader2, LogOut, UserRound } from "lucide-react"
import { getMyInfo, withdrawUser } from "@/entities/user"
import type { MyInfo } from "@/entities/user"
import { clearBrowserAuthSession } from "@/shared/auth/session"
import type { NormalizedApiError } from "@/shared/api/errorHandler"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Separator } from "@/shared/components/ui/separator"
import { useToast } from "@/shared/components/ui/use-toast"

const roleLabels: Record<MyInfo["role"], string> = {
  ADMIN: "관리자",
  USER: "사용자",
  DORMITORY_COUNCIL: "기숙사자치위원회",
}

const isUnauthorizedError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "status" in error &&
  (error as NormalizedApiError).status === 401

export default function MyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<MyInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadUser = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      setUser(await getMyInfo())
    } catch (error) {
      if (isUnauthorizedError(error)) {
        clearBrowserAuthSession()
        router.replace("/login")
        return
      }

      setLoadError(
        error instanceof Error
          ? error.message
          : "사용자 정보를 불러오지 못했습니다.",
      )
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    void loadUser()
  }, [loadUser])

  const handleWithdraw = async () => {
    if (
      !window.confirm(
        "정말 탈퇴하시겠습니까? 탈퇴 후 30일간 재가입할 수 없습니다.",
      )
    ) {
      return
    }

    setIsWithdrawing(true)
    try {
      await withdrawUser()
      clearBrowserAuthSession()
      toast({
        title: "회원탈퇴 완료",
        description: "이용해주셔서 감사합니다.",
      })
      router.replace("/login")
    } catch (error) {
      toast({
        title: "회원탈퇴 실패",
        description:
          error instanceof Error
            ? error.message
            : "회원탈퇴 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsWithdrawing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl items-center justify-center px-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#86A9FF]" aria-label="불러오는 중" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <AlertTriangle className="h-10 w-10 text-red-500" />
            <p className="text-sm text-gray-600">
              {loadError ?? "사용자 정보를 불러오지 못했습니다."}
            </p>
            <Button onClick={() => void loadUser()}>다시 시도</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFF] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-sm font-medium text-[#6487DB]">ACCOUNT</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            마이페이지
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Washer 계정 정보를 확인하고 관리하세요.
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF2FF]">
              <UserRound className="h-7 w-7 text-[#6487DB]" />
            </div>
            <div>
              <CardTitle>{user.name}</CardTitle>
              <p className="mt-1 text-sm text-gray-500">
                {user.studentId} · {roleLabels[user.role]}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow label="학번" value={user.studentId} />
              <InfoRow label="호실" value={`${user.roomNumber}호`} />
              <InfoRow label="학년" value={`${user.grade}학년`} />
              <InfoRow label="기숙사 층" value={`${user.floor}층`} />
              <InfoRow label="패널티 횟수" value={`${user.penaltyCount}회`} />
              <InfoRow
                label="예약 상태"
                value={user.canReserve ? "예약 가능" : "예약 제한 중"}
                valueClassName={user.canReserve ? "text-green-600" : "text-red-600"}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-100">
          <CardHeader>
            <CardTitle className="text-base">계정 관리</CardTitle>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-gray-900">회원탈퇴</p>
                <p className="mt-1 text-sm text-gray-500">
                  계정과 관련된 데이터가 삭제되며 30일간 재가입이 제한됩니다.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className="shrink-0"
              >
                {isWithdrawing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                회원탈퇴
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InfoRow({
  label,
  value,
  valueClassName = "text-gray-900",
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="rounded-lg bg-gray-50 px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 font-medium ${valueClassName}`}>{value}</p>
    </div>
  )
}
