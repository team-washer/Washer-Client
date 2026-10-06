import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios"
import { normalizeApiError } from "./errorHandler"

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? ""

export const httpClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
})

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
