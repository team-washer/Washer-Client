import test from "node:test"
import assert from "node:assert/strict"
import { authUrls, notificationUrls, userUrls } from "../src/shared/api/apiUrls.ts"
import { normalizeApiError } from "../src/shared/api/errorHandler.ts"

test("exposes user web API endpoints from one URL map", () => {
  assert.equal(authUrls.login(), "/api/v2/auth/login")
  assert.equal(authUrls.refresh(), "/api/v2/auth/refresh")
  assert.equal(authUrls.tokenStatus(), "/api/v2/auth/token/status")
  assert.equal(userUrls.me(), "/api/v2/users/my")
  assert.equal(userUrls.withdraw(), "/api/v2/users/me")
  assert.equal(notificationUrls.list(), "/api/v2/notifications")
  assert.equal(notificationUrls.deleteAll(), "/api/v2/notifications")
})

test("normalizes backend errors into a stable app error", () => {
  const result = normalizeApiError({
    response: {
      status: 401,
      data: { message: "토큰이 만료되었습니다." },
    },
  })

  assert.ok(result instanceof Error)
  assert.equal(result.status, 401)
  assert.equal(result.message, "토큰이 만료되었습니다.")
  assert.equal(result.code, "UNAUTHORIZED")
})

test("normalizes backend failures into Error instances without losing the message", () => {
  const result = normalizeApiError({
    response: {
      status: 409,
      data: { message: "실행 중인 예약이 있어 탈퇴할 수 없습니다." },
    },
  })

  assert.ok(result instanceof Error)
  assert.equal(result.message, "실행 중인 예약이 있어 탈퇴할 수 없습니다.")
  assert.equal(result.status, 409)
  assert.equal(result.code, "CONFLICT")
})

test("preserves a backend error code and falls back to the HTTP status code", () => {
  const backendCode = normalizeApiError({
    response: {
      status: 409,
      data: {
        message: "해당 기기는 현재 사용 중입니다.",
        data: { errorCode: "MACHINE_IN_USE" },
      },
    },
  })

  assert.equal(backendCode.code, "MACHINE_IN_USE")

  const fallbackCode = normalizeApiError({
    response: {
      status: 409,
      data: { message: "충돌이 발생했습니다." },
    },
  })

  assert.equal(fallbackCode.code, "CONFLICT")
})
