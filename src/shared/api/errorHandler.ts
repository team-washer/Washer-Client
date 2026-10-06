import axios from "axios"

export type NormalizedApiError = {
  status: number | null
  message: string
  code: string
}

const statusCode = (status: number | null): string => {
  if (status === 401) return "UNAUTHORIZED"
  if (status === 403) return "FORBIDDEN"
  if (status === 404) return "NOT_FOUND"
  if (status !== null && status >= 500) return "SERVER_ERROR"
  return "UNKNOWN_ERROR"
}

export const normalizeApiError = (error: unknown): NormalizedApiError => {
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

    return { status, message, code: statusCode(status) }
  }

  if (error instanceof Error) {
    return { status: null, message: error.message, code: "UNKNOWN_ERROR" }
  }

  return {
    status: null,
    message: "요청에 실패했습니다.",
    code: "UNKNOWN_ERROR",
  }
}

const isResponseError = (
  error: unknown,
): error is { response: { status?: number; data?: { message?: string } } } => {
  if (!error || typeof error !== "object") return false

  const response = (error as { response?: unknown }).response
  return Boolean(response && typeof response === "object")
}
