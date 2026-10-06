import { del, get, post } from "@/shared/api/http"
import { machineUrls, reservationUrls } from "@/shared/api/apiUrls"
import { isEmptyBody, unwrapData } from "@/shared/api/unwrapData"
import {
  normalizeCancellationResult,
  normalizeMachineHistoryPage,
  normalizeReservation,
  normalizeReservationAvailability,
  normalizeReservationHistoryPage,
  normalizeRoomActiveReservationsResponse,
  type CancellationResult,
  type MachineHistoryItem,
  type Page,
  type Reservation,
  type ReservationAvailability,
  type ReservationHistoryItem,
  type ReservationMachineType,
  type ReservationStatus,
} from "../model/reservation"

export type HistoryQuery = {
  status?: ReservationStatus
  page?: number
  size?: number
}

export type ReservationHistoryQuery = HistoryQuery & {
  machineType?: ReservationMachineType
}

export const createReservation = async (
  machineId: number,
): Promise<Reservation> => {
  const response = await post<unknown>(reservationUrls.create(), { machineId })
  const reservation = normalizeReservation(unwrapData(response))

  if (!reservation) {
    throw new Error("예약 생성 응답이 올바르지 않습니다.")
  }

  return reservation
}

export const cancelReservation = async (
  reservationId: number,
): Promise<CancellationResult> => {
  const response = await del<unknown>(reservationUrls.cancel(reservationId))
  const result = normalizeCancellationResult(unwrapData(response))

  if (!result) {
    throw new Error("예약 취소 응답이 올바르지 않습니다.")
  }

  return result
}

// Returns null when the user has no active reservation (204).
export const getActiveReservation = async (): Promise<Reservation | null> => {
  const data = unwrapData(await get<unknown>(reservationUrls.active()))
  if (isEmptyBody(data)) return null

  const reservation = normalizeReservation(data)
  if (!reservation) {
    throw new Error("활성 예약 응답이 올바르지 않습니다.")
  }

  return reservation
}

export const getRoomActiveReservations = async (): Promise<Reservation[]> => {
  const response = await get<unknown>(reservationUrls.roomActive())
  const reservations = normalizeRoomActiveReservationsResponse(
    unwrapData(response),
  )

  if (!reservations) {
    throw new Error("호실 예약 응답이 올바르지 않습니다.")
  }

  return reservations
}

export const getReservationAvailability =
  async (): Promise<ReservationAvailability> => {
    const response = await get<unknown>(reservationUrls.availability())
    const availability = normalizeReservationAvailability(unwrapData(response))

    if (!availability) {
      throw new Error("예약 가능 여부 응답이 올바르지 않습니다.")
    }

    return availability
  }

export const getReservationHistory = async (
  query: ReservationHistoryQuery = {},
): Promise<Page<ReservationHistoryItem>> => {
  const response = await get<unknown>(reservationUrls.history(), {
    params: query,
  })
  const page = normalizeReservationHistoryPage(unwrapData(response))

  if (!page) {
    throw new Error("예약 이력 응답이 올바르지 않습니다.")
  }

  return page
}

export const getMachineHistory = async (
  machineId: number,
  query: HistoryQuery = {},
): Promise<Page<MachineHistoryItem>> => {
  const response = await get<unknown>(machineUrls.history(machineId), {
    params: query,
  })
  const page = normalizeMachineHistoryPage(unwrapData(response))

  if (!page) {
    throw new Error("기기 이력 응답이 올바르지 않습니다.")
  }

  return page
}
