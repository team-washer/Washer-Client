// Backend v2 wraps every success body as { status, code, message, data }
// (the-sdk ApiResponseWrapper). Return the inner data, or the payload as-is
// when it is not wrapped.
export const unwrapData = (payload: unknown): unknown => {
  if (!payload || typeof payload !== "object") return payload

  const value = payload as Record<string, unknown>
  if ("data" in value && typeof value.code === "number") return value.data

  return payload
}

// 204 No Content arrives as an empty body.
export const isEmptyBody = (payload: unknown): boolean =>
  payload === undefined || payload === null || payload === ""
