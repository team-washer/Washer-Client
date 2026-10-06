import test from "node:test"
import assert from "node:assert/strict"
import { normalizeNotificationListResponse } from "../src/entities/notification/model/notification.ts"

const validResponse = {
  notifications: [
    {
      id: 1,
      type: "COMPLETION",
      message: "WASHER-3F-L1의 세탁이 완료되었습니다.",
      createdAt: "2026-03-30T14:30:00",
    },
  ],
}

test("normalizes the direct backend v2 notification list", () => {
  assert.deepEqual(
    normalizeNotificationListResponse(validResponse),
    validResponse.notifications,
  )
})

test("normalizes the wrapped backend v2 notification list", () => {
  assert.deepEqual(
    normalizeNotificationListResponse({
      status: 200,
      code: "SUCCESS",
      message: "알림 목록 조회 성공",
      data: validResponse,
    }),
    validResponse.notifications,
  )
})

test("rejects an invalid notification list response", () => {
  assert.equal(
    normalizeNotificationListResponse({ notifications: [{ id: 1 }] }),
    null,
  )
})
