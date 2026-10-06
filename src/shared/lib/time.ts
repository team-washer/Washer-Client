// Backend v2 sends LocalDateTime without an offset ("2026-10-06T15:30:00"),
// which the browser parses as local (KST) time.
export const parseServerDateTime = (value: string | null): Date | null => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const pad = (value: number): string => String(value).padStart(2, "0")

// 65_000 → "01:05", 3_725_000 → "1:02:05"; negative values clamp to "00:00".
export const formatCountdown = (milliseconds: number): string => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`
}

export const formatClock = (date: Date): string =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`

export const formatDateTime = (date: Date): string =>
  `${date.getMonth() + 1}/${date.getDate()} ${formatClock(date)}`
