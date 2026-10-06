import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios"
import { normalizeApiError } from "./errorHandler"
import { authUrls } from "./apiUrls"
import {
  AUTH_COOKIE_NAMES,
  deleteBrowserCookie,
  getBrowserCookie,
  setBrowserCookie,
} from "../auth/cookies"
import { normalizeTokenResponse, type AuthTokens } from "../auth/tokenSession"

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? ""

export const httpClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
})

const refreshClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
})

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

let refreshPromise: Promise<AuthTokens> | null = null

const saveBrowserTokens = (tokens: AuthTokens): void => {
  setBrowserCookie(AUTH_COOKIE_NAMES.ACCESS_TOKEN, tokens.accessToken, {
    maxAge: tokens.expiresIn,
    sameSite: "lax",
  })
  setBrowserCookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN, tokens.refreshToken, {
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  })
}

const refreshAccessToken = async (): Promise<AuthTokens> => {
  const refreshToken = getBrowserCookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN)
  if (!refreshToken) {
    throw new Error("로그인 세션이 없습니다.")
  }

  const response = await refreshClient.post(authUrls.refresh(), {
    refreshToken,
  })
  const tokens = normalizeTokenResponse(response.data)

  if (!tokens) {
    throw new Error("토큰 갱신 응답이 올바르지 않습니다.")
  }

  saveBrowserTokens(tokens)
  return tokens
}

const getRefreshedAccessToken = (): Promise<AuthTokens> => {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

httpClient.interceptors.request.use((config) => {
  const accessToken = getBrowserCookie(AUTH_COOKIE_NAMES.ACCESS_TOKEN)
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const originalRequest = (
      error as { config?: RetryableRequestConfig; response?: { status?: number } }
    ).config

    if (
      !originalRequest ||
      (error as { response?: { status?: number } }).response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes(authUrls.refresh())
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      const tokens = await getRefreshedAccessToken()
      originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`
      return httpClient.request(originalRequest)
    } catch (refreshError) {
      deleteBrowserCookie(AUTH_COOKIE_NAMES.ACCESS_TOKEN)
      deleteBrowserCookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN)
      return Promise.reject(refreshError)
    }
  },
)

const request = async <T>(config: AxiosRequestConfig): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await httpClient.request<T>(config)
    return response.data
  } catch (error) {
    throw normalizeApiError(error)
  }
}

export const get = <T>(url: string, config?: AxiosRequestConfig) =>
  request<T>({ ...config, method: "GET", url })

export const post = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
) => request<T>({ ...config, method: "POST", url, data })

export const put = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
) => request<T>({ ...config, method: "PUT", url, data })

export const patch = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
) => request<T>({ ...config, method: "PATCH", url, data })

export const del = <T>(url: string, config?: AxiosRequestConfig) =>
  request<T>({ ...config, method: "DELETE", url })
