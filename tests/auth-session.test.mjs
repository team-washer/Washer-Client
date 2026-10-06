import test from "node:test"
import assert from "node:assert/strict"
import {
  parseCookieValue,
  serializeCookie,
} from "../src/shared/auth/cookies.ts"
import { normalizeTokenResponse } from "../src/shared/auth/tokenSession.ts"

test("reads an auth token from a browser cookie string", () => {
  assert.equal(
    parseCookieValue("accessToken=access%20token; refreshToken=refresh", "accessToken"),
    "access token",
  )
  assert.equal(parseCookieValue("accessToken=access", "missing"), null)
})

test("serializes auth cookies with safe browser defaults", () => {
  assert.equal(
    serializeCookie("accessToken", "access token", {
      maxAge: 3600,
      sameSite: "lax",
    }),
    "accessToken=access%20token; Max-Age=3600; Path=/; SameSite=Lax",
  )
})

test("accepts the direct token response returned by backend v2", () => {
  assert.deepEqual(
    normalizeTokenResponse({
      accessToken: "access",
      expiresIn: 3600,
      refreshToken: "refresh",
    }),
    {
      accessToken: "access",
      expiresIn: 3600,
      refreshToken: "refresh",
    },
  )
})

test("rejects incomplete token responses", () => {
  assert.equal(
    normalizeTokenResponse({ accessToken: "access", refreshToken: "" }),
    null,
  )
})
