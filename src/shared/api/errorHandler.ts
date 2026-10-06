import axios from "axios"

export class ApiError extends Error {
  public readonly status: number | null
  public readonly code: string

  constructor(message: string, status: number | null, code: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export type NormalizedApiError = ApiError

const statusCode = (status: number | null): string => {
  if (status === 401) return "UNAUTHORIZED"
  if (status === 403) return "FORBIDDEN"
  if (status === 404) return "NOT_FOUND"
  if (status !== null && status >= 500) return "SERVER_ERROR"
  return "UNKNOWN_ERROR"
}

export const normalizeApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error

  if (axios.isAxiosError(error) || isResponseError(error)) {
    const responseError = error as {
      message?: string
      response?: { status?: number; data?: { message?: string } }
    }
    const status = responseError.response?.status ?? null
    const message =
      responseError.response?.data?.message ??
      responseError.message ??
      "요청에 실패했습니다."

    return new ApiError(message, status, statusCode(status))
  }

  if (error instanceof Error) {
    return new ApiError(error.message, null, "UNKNOWN_ERROR")
  }

  return new ApiError("요청에 실패했습니다.", null, "UNKNOWN_ERROR")
}

const isResponseError = (
  error: unknown,
): error is { response: { status?: number; data?: { message?: string } } } => {
  if (!error || typeof error !== "object") return false

  const response = (error as { response?: unknown }).response
  return Boolean(response && typeof response === "object")
}
