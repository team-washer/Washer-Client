export const authUrls = {
  login: () => "/api/v2/auth/login",
  refresh: () => "/api/v2/auth/refresh",
  tokenStatus: () => "/api/v2/auth/token/status",
} as const

export const userUrls = {
  me: () => "/api/v2/users/my",
  withdraw: () => "/api/v2/users/me",
} as const

export const machineUrls = {
  statuses: () => "/api/v2/machines/status",
  history: (machineId: number) => `/api/v2/machines/${machineId}/history`,
} as const

export const reservationUrls = {
  create: () => "/api/v2/reservations",
  cancel: (reservationId: number) => `/api/v2/reservations/${reservationId}`,
  active: () => "/api/v2/reservations/active",
  roomActive: () => "/api/v2/reservations/active/room",
  availability: () => "/api/v2/reservations/availability",
  history: () => "/api/v2/reservations/history",
} as const

export const malfunctionUrls = {
  create: () => "/api/v2/malfunction-reports",
} as const

export const notificationUrls = {
  list: () => "/api/v2/notifications",
  deleteAll: () => "/api/v2/notifications",
  fcmToken: () => "/api/v2/notifications/fcm-token",
} as const
