import test from "node:test"
import assert from "node:assert/strict"
import {
  formatClock,
  formatCountdown,
  parseServerDateTime,
} from "../src/shared/lib/time.ts"

test("formats countdowns under and over an hour", () => {
  assert.equal(formatCountdown(65_000), "01:05")
  assert.equal(formatCountdown(3_725_000), "1:02:05")
})

test("clamps negative countdowns to zero", () => {
  assert.equal(formatCountdown(-5_000), "00:00")
})

test("parses backend local date-times and rejects invalid values", () => {
  const date = parseServerDateTime("2026-10-06T09:05:00")
  assert.equal(formatClock(date), "09:05")
  assert.equal(parseServerDateTime(null), null)
  assert.equal(parseServerDateTime("not-a-date"), null)
})
