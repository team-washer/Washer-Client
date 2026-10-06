import { del, get } from "@/shared/api/http"
import { notificationUrls } from "@/shared/api/apiUrls"
import {
  normalizeNotificationListResponse,
  type Notification,
} from "../model/notification"

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await get<unknown>(notificationUrls.list())
  const notifications = normalizeNotificationListResponse(response)

  if (!notifications) {
    throw new Error("알림 목록 응답이 올바르지 않습니다.")
  }

  return notifications
}

export const deleteAllNotifications = async (): Promise<void> => {
  await del(notificationUrls.deleteAll())
}
