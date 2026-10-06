export type ReserveBlockReason =
  | "MACHINE_UNAVAILABLE"
  | "BANNED"
  | "PENALTY"
  | "ALREADY_RESERVED"
  | "ROOM_TYPE_TAKEN"

export type ReserveContext = {
  machineReservable: boolean
  machineType: "WASHER" | "DRYER"
  canReserve: boolean
  isBanned: boolean
  hasMyActiveReservation: boolean
  // Machine type of each active reservation in the user's room (null if unknown)
  roomReservationTypes: ("WASHER" | "DRYER" | null)[]
}

// Mirrors the backend reservation rules so the button can explain itself
// before the request; the server remains the source of truth.
export const getReserveBlockReason = (
  context: ReserveContext,
): ReserveBlockReason | null => {
  if (!context.machineReservable) return "MACHINE_UNAVAILABLE"
  if (context.isBanned) return "BANNED"
  if (!context.canReserve) return "PENALTY"
  if (context.hasMyActiveReservation) return "ALREADY_RESERVED"
  if (context.roomReservationTypes.includes(context.machineType)) {
    return "ROOM_TYPE_TAKEN"
  }
  return null
}
