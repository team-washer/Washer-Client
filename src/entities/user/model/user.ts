export const USER_ROLES = ["ADMIN", "USER", "DORMITORY_COUNCIL"] as const

export type UserRole = (typeof USER_ROLES)[number]

export type MyInfo = {
  id: number
  name: string
  studentId: string
  roomNumber: string
  grade: number
  floor: number
  penaltyCount: number
  createdAt: string
  updatedAt: string
  canReserve: boolean
  penaltyExpiresAt: string | null
  role: UserRole
}

export const normalizeMyInfoResponse = (payload: unknown): MyInfo | null => {
  if (!payload || typeof payload !== "object") return null

  const value = payload as Record<string, unknown>
  const isRole = (role: unknown): role is UserRole =>
    typeof role === "string" && USER_ROLES.includes(role as UserRole)

  if (
    typeof value.id !== "number" ||
    typeof value.name !== "string" ||
    typeof value.studentId !== "string" ||
    typeof value.roomNumber !== "string" ||
    typeof value.grade !== "number" ||
    typeof value.floor !== "number" ||
    typeof value.penaltyCount !== "number" ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string" ||
    typeof value.canReserve !== "boolean" ||
    (value.penaltyExpiresAt !== null &&
      typeof value.penaltyExpiresAt !== "string") ||
    !isRole(value.role)
  ) {
    return null
  }

  return {
    id: value.id,
    name: value.name,
    studentId: value.studentId,
    roomNumber: value.roomNumber,
    grade: value.grade,
    floor: value.floor,
    penaltyCount: value.penaltyCount,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    canReserve: value.canReserve,
    penaltyExpiresAt: value.penaltyExpiresAt,
    role: value.role,
  }
}
