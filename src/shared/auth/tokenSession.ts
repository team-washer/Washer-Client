export type AuthTokens = {
  accessToken: string
  expiresIn: number
  refreshToken: string
}

export const normalizeTokenResponse = (
  payload: unknown,
): AuthTokens | null => {
  if (!payload || typeof payload !== "object") return null

  const objectPayload = payload as Record<string, unknown>
  const candidateValue =
    objectPayload.data && typeof objectPayload.data === "object"
      ? objectPayload.data
      : objectPayload

  if (!candidateValue || typeof candidateValue !== "object") return null

  const candidate = candidateValue as Record<string, unknown>

  if (
    !candidate ||
    typeof candidate !== "object" ||
    typeof candidate.accessToken !== "string" ||
    candidate.accessToken.length === 0 ||
    typeof candidate.refreshToken !== "string" ||
    candidate.refreshToken.length === 0 ||
    typeof candidate.expiresIn !== "number" ||
    !Number.isFinite(candidate.expiresIn) ||
    candidate.expiresIn <= 0
  ) {
    return null
  }

  return {
    accessToken: candidate.accessToken,
    expiresIn: candidate.expiresIn,
    refreshToken: candidate.refreshToken,
  }
}
