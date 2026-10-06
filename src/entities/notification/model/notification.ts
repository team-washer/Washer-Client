export const NOTIFICATION_TYPES = [
  "COMPLETION",
  "MALFUNCTION",
  "WARNING",
  "INTERRUPTION",
  "AUTO_CANCELLED",
  "PAUSE_TIMEOUT",
  "STARTED",
  "TIMEOUT_WARNING",
  "CANCELLATION_BLOCKED",
  "CANCELLATION_BLOCK_EXTENDED",
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export type Notification = {
  id: number
  type: NotificationType
  message: string
  createdAt: string
}

export type NotificationListResponse = {
  notifications: Notification[]
}

export const normalizeNotificationListResponse = (
  payload: unknown,
): Notification[] | null => {
  if (!payload || typeof payload !== "object") return null

  const objectPayload = payload as Record<string, unknown>
  const value =
    objectPayload.data &&
    typeof objectPayload.data === "object" &&
    !Array.isArray(objectPayload.data)
      ? (objectPayload.data as { notifications?: unknown })
      : objectPayload
  if (!Array.isArray(value.notifications)) return null

  const notifications: Notification[] = []
  for (const item of value.notifications) {
    if (!item || typeof item !== "object") return null
    const notification = item as Record<string, unknown>
    if (
      typeof notification.id !== "number" ||
      typeof notification.type !== "string" ||
      !NOTIFICATION_TYPES.includes(notification.type as NotificationType) ||
      typeof notification.message !== "string" ||
      typeof notification.createdAt !== "string"
    ) {
      return null
    }

    notifications.push({
      id: notification.id,
      type: notification.type as NotificationType,
      message: notification.message,
      createdAt: notification.createdAt,
    })
  }

  return notifications
}
