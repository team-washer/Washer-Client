// Works with both the plain NormalizedApiError object and the Error-based
// ApiError, since both expose `status` and `message`.
export const getErrorStatus = (error: unknown): number | null => {
  if (!error || typeof error !== "object") return null
  const status = (error as { status?: unknown }).status
  return typeof status === "number" ? status : null
}

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (!error || typeof error !== "object") return fallback
  const message = (error as { message?: unknown }).message
  return typeof message === "string" && message.length > 0 ? message : fallback
}

// 451: users outside floors 1–4 cannot use the service.
export const isServiceUnavailableForUser = (error: unknown): boolean =>
  getErrorStatus(error) === 451
