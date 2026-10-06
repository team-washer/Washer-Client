import test from "node:test"
import assert from "node:assert/strict"
import { isEmptyBody, unwrapData } from "../src/shared/api/unwrapData.ts"
import {
  getMachineFloors,
  normalizeMachineStatusListResponse,
  parseMachinePlacement,
} from "../src/entities/machine/model/machine.ts"

const wrap = (data) => ({ status: "OK", code: 200, message: "OK", data })

const machine = {
  machineId: 1,
  name: "Washer-3F-L1",
  type: "WASHER",
  status: "NORMAL",
  availability: "IN_USE",
  operatingState: "run",
  jobState: "wash",
  switchStatus: "on",
  expectedCompletionTime: "2026-10-06T15:30:00",
  remainingMinutes: 42,
  reservationId: 10,
  userId: 7,
  roomNumber: "301",
}

test("unwraps the backend v2 common response", () => {
  assert.deepEqual(unwrapData(wrap({ a: 1 })), { a: 1 })
  assert.equal(unwrapData(wrap(null)), null)
})

test("keeps an unwrapped payload as-is", () => {
  assert.deepEqual(unwrapData({ machines: [] }), { machines: [] })
})

test("treats an empty 204 body as empty", () => {
  assert.equal(isEmptyBody(""), true)
  assert.equal(isEmptyBody(undefined), true)
  assert.equal(isEmptyBody(unwrapData(wrap(null))), true)
  assert.equal(isEmptyBody({}), false)
})

test("parses floor, side, and number from a machine name", () => {
  assert.deepEqual(parseMachinePlacement("Washer-3F-L1"), {
    floor: 3,
    side: "LEFT",
    number: 1,
  })
  assert.deepEqual(parseMachinePlacement("dryer-12f-r3"), {
    floor: 12,
    side: "RIGHT",
    number: 3,
  })
  assert.equal(parseMachinePlacement("Washer-1"), null)
})

test("normalizes a wrapped machine status list", () => {
  const machines = normalizeMachineStatusListResponse(
    unwrapData(wrap({ machines: [machine], totalCount: 1 })),
  )

  assert.deepEqual(machines, [
    {
      id: 1,
      name: "Washer-3F-L1",
      type: "WASHER",
      status: "NORMAL",
      availability: "IN_USE",
      operatingState: "run",
      jobState: "wash",
      switchStatus: "on",
      expectedCompletionTime: "2026-10-06T15:30:00",
      remainingMinutes: 42,
      reservationId: 10,
      userId: 7,
      roomNumber: "301",
      placement: { floor: 3, side: "LEFT", number: 1 },
    },
  ])
})

test("fills missing optional machine fields with null", () => {
  const [idle] = normalizeMachineStatusListResponse({
    machines: [
      {
        machineId: 2,
        name: "Dryer-2F-R1",
        type: "DRYER",
        status: "NORMAL",
        availability: "AVAILABLE",
      },
    ],
  })

  assert.equal(idle.reservationId, null)
  assert.equal(idle.expectedCompletionTime, null)
  assert.deepEqual(idle.placement, { floor: 2, side: "RIGHT", number: 1 })
})

test("rejects a machine with an unknown availability", () => {
  assert.equal(
    normalizeMachineStatusListResponse({
      machines: [{ ...machine, availability: "BROKEN" }],
    }),
    null,
  )
})

test("lists distinct floors in ascending order", () => {
  const machines = normalizeMachineStatusListResponse({
    machines: [
      { ...machine, machineId: 1, name: "Washer-4F-L1" },
      { ...machine, machineId: 2, name: "Washer-2F-L1" },
      { ...machine, machineId: 3, name: "Dryer-4F-R1", type: "DRYER" },
    ],
  })

  assert.deepEqual(getMachineFloors(machines), [2, 4])
})
