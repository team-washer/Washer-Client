import test from "node:test"
import assert from "node:assert/strict"
import { unwrapData } from "../src/shared/api/unwrapData.ts"
import {
  normalizeCancellationResult,
  normalizeMachineHistoryPage,
  normalizeReservation,
  normalizeReservationAvailability,
  normalizeReservationHistoryPage,
  normalizeRoomActiveReservationsResponse,
} from "../src/entities/reservation/model/reservation.ts"

const wrap = (data) => ({ status: "OK", code: 200, message: "OK", data })

const reservationResponse = {
  id: 10,
  userId: 7,
  userName: "홍길동",
  userRoomNumber: "301",
  userStudentId: "2301",
  machineId: 1,
  machineName: "Washer-3F-L1",
  reservedAt: "2026-10-06T15:00:00",
  startTime: null,
  expectedCompletionTime: null,
  actualCompletionTime: null,
  status: "RESERVED",
  cancelledAt: null,
  dayOfWeek: "TUESDAY",
  createdAt: "2026-10-06T15:00:00",
  updatedAt: "2026-10-06T15:00:00",
}

const reservation = {
  id: 10,
  userId: 7,
  userName: "홍길동",
  userRoomNumber: "301",
  machineId: 1,
  machineName: "Washer-3F-L1",
  reservedAt: "2026-10-06T15:00:00",
  startTime: null,
  expectedCompletionTime: null,
  status: "RESERVED",
}

test("normalizes a wrapped reservation", () => {
  assert.deepEqual(
    normalizeReservation(unwrapData(wrap(reservationResponse))),
    reservation,
  )
})

test("rejects a reservation with a removed v1 status", () => {
  assert.equal(
    normalizeReservation({ ...reservationResponse, status: "CONFIRMED" }),
    null,
  )
})

test("normalizes room active reservations including an empty list", () => {
  assert.deepEqual(
    normalizeRoomActiveReservationsResponse(
      unwrapData(wrap({ reservations: [reservationResponse] })),
    ),
    [reservation],
  )
  assert.deepEqual(
    normalizeRoomActiveReservationsResponse(wrap({ reservations: [] }).data),
    [],
  )
})

test("normalizes reservation availability", () => {
  assert.deepEqual(
    normalizeReservationAvailability(
      unwrapData(
        wrap({
          canReserve: false,
          penaltyExpiresAt: "2026-10-06T15:05:00",
          isBanned: false,
        }),
      ),
    ),
    {
      canReserve: false,
      penaltyExpiresAt: "2026-10-06T15:05:00",
      isBanned: false,
    },
  )
})

test("accepts availability serialized with a 'banned' key", () => {
  assert.equal(
    normalizeReservationAvailability({
      canReserve: true,
      penaltyExpiresAt: null,
      banned: true,
    }).isBanned,
    true,
  )
})

test("normalizes a cancellation result", () => {
  assert.deepEqual(
    normalizeCancellationResult(
      unwrapData(
        wrap({
          success: true,
          message: "예약이 취소되었습니다.",
          penaltyApplied: true,
          penaltyExpiresAt: "2026-10-06T15:10:00",
        }),
      ),
    ),
    {
      message: "예약이 취소되었습니다.",
      penaltyApplied: true,
      penaltyExpiresAt: "2026-10-06T15:10:00",
    },
  )
})

const pageOf = (content) => ({
  content,
  pageNumber: 0,
  pageSize: 20,
  totalElements: content.length,
  totalPages: 1,
  last: true,
})

test("normalizes a machine history page", () => {
  const item = {
    id: 3,
    userRoomNumber: "301",
    startTime: "2026-10-06T15:01:00",
    completionTime: "2026-10-06T15:50:00",
    status: "COMPLETED",
    createdAt: "2026-10-06T15:00:00",
  }

  assert.deepEqual(normalizeMachineHistoryPage(unwrapData(wrap(pageOf([item])))), {
    content: [item],
    pageNumber: 0,
    totalElements: 1,
    totalPages: 1,
    last: true,
  })
})

test("normalizes my reservation history page", () => {
  const page = normalizeReservationHistoryPage(
    pageOf([
      {
        id: 4,
        userRoomNumber: "301",
        userStudentId: "2301",
        machineName: "Dryer-3F-R1",
        machineType: "DRYER",
        startTime: null,
        completionTime: null,
        status: "CANCELLED",
        createdAt: "2026-10-06T15:00:00",
      },
    ]),
  )

  assert.equal(page.content[0].machineType, "DRYER")
  assert.equal(page.content[0].machineName, "Dryer-3F-R1")
})

test("rejects a history page with an invalid item", () => {
  assert.equal(normalizeMachineHistoryPage(pageOf([{ id: 1 }])), null)
})
