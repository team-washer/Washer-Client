export const NOTIFICATIONS_UPDATED_EVENT = "washer:notifications-updated"

export const notifyNotificationsUpdated = (): void => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT))
  }
}
