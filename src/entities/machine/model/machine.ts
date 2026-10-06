export const MACHINE_TYPES = ["WASHER", "DRYER"] as const
export const MACHINE_STATUSES = ["NORMAL", "MALFUNCTION"] as const
export const MACHINE_AVAILABILITIES = [
  "AVAILABLE",
  "IN_USE",
  "RESERVED",
  "CLEANING",
  "UNAVAILABLE",
] as const

export type MachineType = (typeof MACHINE_TYPES)[number]
export type MachineStatus = (typeof MACHINE_STATUSES)[number]
export type MachineAvailability = (typeof MACHINE_AVAILABILITIES)[number]
export type MachineSide = "LEFT" | "RIGHT"

export type MachinePlacement = {
  floor: number
  side: MachineSide
  number: number
}

export type Machine = {
  id: number
  name: string
  type: MachineType
  status: MachineStatus
  availability: MachineAvailability
  // SmartThings raw value: "run" | "pause" | "stop", null when unknown
  operatingState: string | null
  jobState: string | null
  switchStatus: string | null
  expectedCompletionTime: string | null
  remainingMinutes: number | null
  reservationId: number | null
  userId: number | null
  roomNumber: string | null
  placement: MachinePlacement | null
}

const PLACEMENT_PATTERN = /^.+-(\d+)F-([LR])(\d+)$/i

// "Washer-3F-L1" → { floor: 3, side: "LEFT", number: 1 }
export const parseMachinePlacement = (name: string): MachinePlacement | null => {
  const match = PLACEMENT_PATTERN.exec(name.trim())
  if (!match) return null

  return {
    floor: Number(match[1]),
    side: match[2].toUpperCase() === "L" ? "LEFT" : "RIGHT",
    number: Number(match[3]),
  }
}

export const getMachineTypeFromName = (name: string): MachineType | null => {
  if (/^washer/i.test(name.trim())) return "WASHER"
  if (/^dryer/i.test(name.trim())) return "DRYER"
  return null
}

export const isMachineReservable = (machine: Machine): boolean =>
  machine.status === "NORMAL" && machine.availability === "AVAILABLE"

export type MachineSummary = {
  total: number
  available: number
  inUse: number
  unavailable: number
}

export const summarizeMachines = (
  machines: Machine[],
  type: MachineType,
): MachineSummary => {
  const summary: MachineSummary = { total: 0, available: 0, inUse: 0, unavailable: 0 }

  for (const machine of machines) {
    if (machine.type !== type) continue
    summary.total += 1

    if (isMachineReservable(machine)) summary.available += 1
    else if (
      machine.status === "NORMAL" &&
      (machine.availability === "IN_USE" || machine.availability === "RESERVED")
    ) {
      summary.inUse += 1
    } else summary.unavailable += 1
  }

  return summary
}

export const getMachineFloors =(machines: Machine[]): number[] =>
  [
    ...new Set(
      machines.flatMap((machine) =>
        machine.placement ? [machine.placement.floor] : [],
      ),
    ),
  ].sort((a, b) => a - b)

const isOneOf = <T extends string>(
  values: readonly T[],
  value: unknown,
): value is T => typeof value === "string" && values.includes(value as T)

const isNullableString = (value: unknown): value is string | null | undefined =>
  value === null || value === undefined || typeof value === "string"

const isNullableNumber = (value: unknown): value is number | null | undefined =>
  value === null || value === undefined || typeof value === "number"

export const normalizeMachine = (payload: unknown): Machine | null => {
  if (!payload || typeof payload !== "object") return null

  const value = payload as Record<string, unknown>
  if (
    typeof value.machineId !== "number" ||
    typeof value.name !== "string" ||
    !isOneOf(MACHINE_TYPES, value.type) ||
    !isOneOf(MACHINE_STATUSES, value.status) ||
    !isOneOf(MACHINE_AVAILABILITIES, value.availability) ||
    !isNullableString(value.operatingState) ||
    !isNullableString(value.jobState) ||
    !isNullableString(value.switchStatus) ||
    !isNullableString(value.expectedCompletionTime) ||
    !isNullableNumber(value.remainingMinutes) ||
    !isNullableNumber(value.reservationId) ||
    !isNullableNumber(value.userId) ||
    !isNullableString(value.roomNumber)
  ) {
    return null
  }

  return {
    id: value.machineId,
    name: value.name,
    type: value.type,
    status: value.status,
    availability: value.availability,
    operatingState: value.operatingState ?? null,
    jobState: value.jobState ?? null,
    switchStatus: value.switchStatus ?? null,
    expectedCompletionTime: value.expectedCompletionTime ?? null,
    remainingMinutes: value.remainingMinutes ?? null,
    reservationId: value.reservationId ?? null,
    userId: value.userId ?? null,
    roomNumber: value.roomNumber ?? null,
    placement: parseMachinePlacement(value.name),
  }
}

export const normalizeMachineStatusListResponse = (
  payload: unknown,
): Machine[] | null => {
  if (!payload || typeof payload !== "object") return null

  const value = payload as { machines?: unknown }
  if (!Array.isArray(value.machines)) return null

  const machines: Machine[] = []
  for (const item of value.machines) {
    const machine = normalizeMachine(item)
    if (!machine) return null
    machines.push(machine)
  }

  return machines
}
