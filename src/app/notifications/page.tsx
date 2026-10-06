"use client"

import { useCallback, useEffect, useState } from "react"
import { Bell, BellRing, Loader2, Trash2 } from "lucide-react"
import { deleteAllNotifications, getNotifications } from "@/entities/notification"
import type { Notification } from "@/entities/notification"
import { notifyNotificationsUpdated } from "@/entities/notification/lib/events"
import { requestPermission } from "@/shared/lib/firebase"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { useToast } from "@/shared/components/ui/use-toast"

const notificationLabels: Record<Notification["type"], string> = {
  COMPLETION: "완료",
  MALFUNCTION: "이상 감지",
  WARNING: "경고",
  INTERRUPTION: "중단",
  AUTO_CANCELLED: "자동 취소",
  PAUSE_TIMEOUT: "일시정지 초과",
  STARTED: "시작",
  TIMEOUT_WARNING: "취소 경고",
  CANCELLATION_BLOCKED: "예약 차단",
  CANCELLATION_BLOCK_EXTENDED: "예약 차단 연장",
}

export default function NotificationsPage() {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEnablingPush, setIsEnablingPush] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setNotifications(await getNotifications())
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "알림을 불러오지 못했습니다.",
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadNotifications()
  }, [loadNotifications])

  const handleDeleteAll = async () => {
    if (notifications.length === 0 || !window.confirm("모든 알림을 삭제할까요?")) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteAllNotifications()
      setNotifications([])
      notifyNotificationsUpdated()
      toast({ title: "알림 삭제 완료", description: "모든 알림을 삭제했습니다." })
    } catch (deleteError) {
      toast({
        title: "알림 삭제 실패",
        description:
          deleteError instanceof Error
            ? deleteError.message
            : "알림 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEnablePush = async () => {
    setIsEnablingPush(true)
    try {
      const token = await requestPermission()
      toast(
        token
          ? { title: "알림 설정 완료", description: "웹 알림을 받을 수 있습니다." }
          : {
              title: "알림 설정이 필요합니다",
              description: "브라우저 알림 권한과 환경 설정을 확인해주세요.",
              variant: "destructive",
            },
      )
    } finally {
      setIsEnablingPush(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFF] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#6487DB]">INBOX</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
              알림
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Washer에서 발생한 알림을 확인하세요.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleEnablePush}
              disabled={isEnablingPush}
            >
              {isEnablingPush ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BellRing className="mr-2 h-4 w-4" />
              )}
              웹 알림 켜기
            </Button>
            <Button
              variant="outline"
              onClick={handleDeleteAll}
              disabled={isDeleting || notifications.length === 0}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              전체 삭제
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-[#6487DB]" />
              알림 목록
              <span className="text-sm font-normal text-gray-500">
                ({notifications.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#86A9FF]" />
              </div>
            ) : error ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-500">{error}</p>
                <Button className="mt-4" variant="outline" onClick={() => void loadNotifications()}>
                  다시 시도
                </Button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">새로운 알림이 없습니다.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <article key={notification.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EDF2FF]">
                      <Bell className="h-4 w-4 text-[#6487DB]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {notificationLabels[notification.type]}
                        </p>
                        <time className="text-xs text-gray-400" dateTime={notification.createdAt}>
                          {formatNotificationDate(notification.createdAt)}
                        </time>
                      </div>
                      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-gray-600">
                        {notification.message}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function formatNotificationDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
