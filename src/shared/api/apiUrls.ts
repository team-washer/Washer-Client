export const authUrls = {
  login: () => "/api/v2/auth/login",
  refresh: () => "/api/v2/auth/refresh",
  tokenStatus: () => "/api/v2/auth/token/status",
} as const

export const userUrls = {
  me: () => "/api/v2/users/my",
  withdraw: () => "/api/v2/users/me",
} as const

export const notificationUrls = {
  list: () => "/api/v2/notifications",
  deleteAll: () => "/api/v2/notifications",
  fcmToken: () => "/api/v2/notifications/fcm-token",
} as const
