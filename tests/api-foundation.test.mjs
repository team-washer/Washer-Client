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

  assert.deepEqual(result, {
    status: 401,
    message: "토큰이 만료되었습니다.",
    code: "UNAUTHORIZED",
  })
})
