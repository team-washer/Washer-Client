export const AUTH_COOKIE_NAMES = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
} as const

export type CookieSameSite = "lax" | "strict" | "none"

export type SerializeCookieOptions = {
  maxAge?: number
  path?: string
  sameSite?: CookieSameSite
  secure?: boolean
}

export const parseCookieValue = (
  cookieHeader: string,
  name: string,
): string | null => {
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))

  if (!cookie) return null

  return decodeURIComponent(cookie.slice(name.length + 1))
}

export const serializeCookie = (
  name: string,
  value: string,
  options: SerializeCookieOptions = {},
): string => {
  const attributes = [`${name}=${encodeURIComponent(value)}`]

  if (options.maxAge !== undefined) attributes.push(`Max-Age=${options.maxAge}`)
  attributes.push(`Path=${options.path ?? "/"}`)
  if (options.sameSite) {
    attributes.push(
      `SameSite=${options.sameSite[0].toUpperCase()}${options.sameSite.slice(1)}`,
    )
  }
  if (options.secure) attributes.push("Secure")

  return attributes.join("; ")
}

export const getBrowserCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null
  return parseCookieValue(document.cookie, name)
}

export const setBrowserCookie = (
  name: string,
  value: string,
  options?: SerializeCookieOptions,
): void => {
  if (typeof document === "undefined") return
  document.cookie = serializeCookie(name, value, options)
}

export const deleteBrowserCookie = (name: string): void => {
  setBrowserCookie(name, "", { maxAge: 0 })
}
