import test from "node:test"
import assert from "node:assert/strict"
import { normalizeMyInfoResponse } from "../src/entities/user/model/user.ts"

const validUser = {
  id: 1,
  name: "김철수",
  studentId: "20210001",
  roomNumber: "301",
  grade: 3,
  floor: 3,
  penaltyCount: 0,
  createdAt: "2025-01-15T14:30:00",
  updatedAt: "2025-01-15T14:30:00",
  canReserve: true,
  penaltyExpiresAt: null,
  role: "USER",
}

test("normalizes the direct backend v2 my-info response", () => {
  assert.deepEqual(normalizeMyInfoResponse(validUser), validUser)
})

test("rejects an incomplete my-info response", () => {
  const { roomNumber: _, ...incompleteUser } = validUser
  assert.equal(normalizeMyInfoResponse(incompleteUser), null)
})
