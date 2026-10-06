export const RESERVATION_STATUSES = [
  "RESERVED",
  "RUNNING",
  "COMPLETED",
  "CANCELLED",
] as const

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number]
export type ReservationMachineType = "WASHER" | "DRYER"

// A RESERVED reservation is auto-cancelled if the machine is not started
// within this many minutes of reservedAt.
export const RESERVED_TIMEOUT_MINUTES = 5

// Epoch ms at which a RESERVED reservation is auto-cancelled.
export const getReservedDeadline = (reservation: Reservation): number | null => {
  const reservedAt = new Date(reservation.reservedAt).getTime()
  if (Number.isNaN(reservedAt)) return null
  return reservedAt + RESERVED_TIMEOUT_MINUTES * 60_000
}

export type Reservation = {
  id: number
  userId: number
  userName: string
  userRoomNumber: string
  machineId: number
  machineName: string
  reservedAt: string
  startTime: string | null
  expectedCompletionTime: string | null
  status: ReservationStatus
}

export type ReservationAvailability = {
  canReserve: boolean
  penaltyExpiresAt: string | null
  isBanned: boolean
}

export type CancellationResult = {
  message: string
  penaltyApplied: boolean
  penaltyExpiresAt: string | null
}

export type ReservationHistoryItem = {
  id: number
  userRoomNumber: string
  machineName: string
  machineType: ReservationMachineType
  startTime: string | null
  completionTime: string | null
  status: ReservationStatus
  createdAt: string
}

export type MachineHistoryItem = {
  id: number
  userRoomNumber: string
  startTime: string | null
  completionTime: string | null
  status: ReservationStatus
  createdAt: string
}

export type Page<T> = {
  content: T[]
  pageNumber: number
  totalElements: number
  totalPages: number
  last: boolean
}

const isStatus = (value: unknown): value is ReservationStatus =>
  typeof value === "string" &&
  RESERVATION_STATUSES.includes(value as ReservationStatus)

const isNullableString = (value: unknown): value is string | null | undefined =>
  value === null || value === undefined || typeof value === "string"

const asRecord = (payload: unknown): Record<string, unknown> | null =>
  payload && typeof payload === "object"
    ? (payload as Record<string, unknown>)
    : null

export const normalizeReservation = (payload: unknown): Reservation | null => {
  const value = asRecord(payload)
  if (
    !value ||
    typeof value.id !== "number" ||
    typeof value.userId !== "number" ||
    typeof value.userName !== "string" ||
    typeof value.userRoomNumber !== "string" ||
    typeof value.machineId !== "number" ||
    typeof value.machineName !== "string" ||
    typeof value.reservedAt !== "string" ||
    !isNullableString(value.startTime) ||
    !isNullableString(value.expectedCompletionTime) ||
    !isStatus(value.status)
  ) {
    return null
  }

  return {
    id: value.id,
    userId: value.userId,
    userName: value.userName,
    userRoomNumber: value.userRoomNumber,
    machineId: value.machineId,
    machineName: value.machineName,
    reservedAt: value.reservedAt,
    startTime: value.startTime ?? null,
    expectedCompletionTime: value.expectedCompletionTime ?? null,
    status: value.status,
  }
}

export const normalizeRoomActiveReservationsResponse = (
  payload: unknown,
): Reservation[] | null => {
  const value = asRecord(payload)
  if (!value || !Array.isArray(value.reservations)) return null

  const reservations: Reservation[] = []
  for (const item of value.reservations) {
    const reservation = normalizeReservation(item)
    if (!reservation) return null
    reservations.push(reservation)
  }

  return reservations
}

export const normalizeReservationAvailability = (
  payload: unknown,
): ReservationAvailability | null => {
  const value = asRecord(payload)
  // Jackson may drop the "is" prefix of a boolean record component.
  const isBanned = value?.isBanned ?? value?.banned
  if (
    !value ||
    typeof value.canReserve !== "boolean" ||
    !isNullableString(value.penaltyExpiresAt) ||
    typeof isBanned !== "boolean"
  ) {
    return null
  }

  return {
    canReserve: value.canReserve,
    penaltyExpiresAt: value.penaltyExpiresAt ?? null,
    isBanned,
  }
}

export const normalizeCancellationResult = (
  payload: unknown,
): CancellationResult | null => {
  const value = asRecord(payload)
  if (
    !value ||
    typeof value.message !== "string" ||
    typeof value.penaltyApplied !== "boolean" ||
    !isNullableString(value.penaltyExpiresAt)
  ) {
    return null
  }

  return {
    message: value.message,
    penaltyApplied: value.penaltyApplied,
    penaltyExpiresAt: value.penaltyExpiresAt ?? null,
  }
}

const normalizeMachineHistoryItem = (
  payload: unknown,
): MachineHistoryItem | null => {
  const value = asRecord(payload)
  if (
    !value ||
    typeof value.id !== "number" ||
    typeof value.userRoomNumber !== "string" ||
    !isNullableString(value.startTime) ||
    !isNullableString(value.completionTime) ||
    !isStatus(value.status) ||
    typeof value.createdAt !== "string"
  ) {
    return null
  }

  return {
    id: value.id,
    userRoomNumber: value.userRoomNumber,
    startTime: value.startTime ?? null,
    completionTime: value.completionTime ?? null,
    status: value.status,
    createdAt: value.createdAt,
  }
}

const normalizeReservationHistoryItem = (
  payload: unknown,
): ReservationHistoryItem | null => {
  const base = normalizeMachineHistoryItem(payload)
  const value = asRecord(payload)
  if (
    !base ||
    !value ||
    typeof value.machineName !== "string" ||
    (value.machineType !== "WASHER" && value.machineType !== "DRYER")
  ) {
    return null
  }

  return {
    ...base,
    machineName: value.machineName,
    machineType: value.machineType,
  }
}

const normalizePage = <T>(
  payload: unknown,
  normalizeItem: (item: unknown) => T | null,
): Page<T> | null => {
  const value = asRecord(payload)
  if (
    !value ||
    !Array.isArray(value.content) ||
    typeof value.pageNumber !== "number" ||
    typeof value.totalElements !== "number" ||
    typeof value.totalPages !== "number" ||
    typeof value.last !== "boolean"
  ) {
    return null
  }

  const content: T[] = []
  for (const item of value.content) {
    const normalized = normalizeItem(item)
    if (!normalized) return null
    content.push(normalized)
  }

  return {
    content,
    pageNumber: value.pageNumber,
    totalElements: value.totalElements,
    totalPages: value.totalPages,
    last: value.last,
  }
}

export const normalizeReservationHistoryPage = (
  payload: unknown,
): Page<ReservationHistoryItem> | null =>
  normalizePage(payload, normalizeReservationHistoryItem)

export const normalizeMachineHistoryPage = (
  payload: unknown,
): Page<MachineHistoryItem> | null =>
  normalizePage(payload, normalizeMachineHistoryItem)
