import test from "node:test"
import assert from "node:assert/strict"
import { getReserveBlockReason } from "../src/widgets/machine-board/lib/reserveBlockReason.ts"

const allowed = {
  machineReservable: true,
  machineType: "WASHER",
  canReserve: true,
  isBanned: false,
  hasMyActiveReservation: false,
  roomReservationTypes: ["DRYER"],
}

test("allows a reservation when every rule passes", () => {
  assert.equal(getReserveBlockReason(allowed), null)
})

test("blocks an unavailable machine first", () => {
  assert.equal(
    getReserveBlockReason({ ...allowed, machineReservable: false, isBanned: true }),
    "MACHINE_UNAVAILABLE",
  )
})

test("reports a room ban ahead of a penalty", () => {
  assert.equal(
    getReserveBlockReason({ ...allowed, canReserve: false, isBanned: true }),
    "BANNED",
  )
  assert.equal(getReserveBlockReason({ ...allowed, canReserve: false }), "PENALTY")
})

test("enforces one active reservation per user", () => {
  assert.equal(
    getReserveBlockReason({ ...allowed, hasMyActiveReservation: true }),
    "ALREADY_RESERVED",
  )
})

test("blocks a machine type already reserved by the room", () => {
  assert.equal(
    getReserveBlockReason({ ...allowed, roomReservationTypes: ["WASHER"] }),
    "ROOM_TYPE_TAKEN",
  )
  assert.equal(
    getReserveBlockReason({ ...allowed, machineType: "DRYER" }),
    "ROOM_TYPE_TAKEN",
  )
})
