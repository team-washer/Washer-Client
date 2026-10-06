import { NextRequest, NextResponse } from "next/server"
import { authUrls } from "@/shared/api/apiUrls"
import { AUTH_COOKIE_NAMES } from "@/shared/auth/cookies"
import { normalizeTokenResponse } from "@/shared/auth/tokenSession"

const apiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? ""

const clearSessionAndRedirect = (request: NextRequest): NextResponse => {
  const response = NextResponse.redirect(new URL("/login", request.url))
  response.cookies.delete(AUTH_COOKIE_NAMES.ACCESS_TOKEN)
  response.cookies.delete(AUTH_COOKIE_NAMES.REFRESH_TOKEN)
  return response
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const accessToken = request.cookies.get(AUTH_COOKIE_NAMES.ACCESS_TOKEN)?.value
  const refreshToken = request.cookies.get(AUTH_COOKIE_NAMES.REFRESH_TOKEN)?.value

  if (accessToken) return NextResponse.next()
  if (!refreshToken) return clearSessionAndRedirect(request)

  try {
    const refreshUrl = new URL(authUrls.refresh(), apiBaseUrl() || request.url)
    const tokenResponse = await fetch(refreshUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    })

    if (!tokenResponse.ok) return clearSessionAndRedirect(request)

    const tokens = normalizeTokenResponse(await tokenResponse.json())
    if (!tokens) return clearSessionAndRedirect(request)

    const response = NextResponse.next()
    const secure = process.env.NODE_ENV === "production"
    response.cookies.set(AUTH_COOKIE_NAMES.ACCESS_TOKEN, tokens.accessToken, {
      httpOnly: false,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: tokens.expiresIn,
    })
    response.cookies.set(AUTH_COOKIE_NAMES.REFRESH_TOKEN, tokens.refreshToken, {
      httpOnly: false,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
    return response
  } catch {
    return clearSessionAndRedirect(request)
  }
}

export const config = {
  matcher: [
    "/((?!api|login|auth/callback|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
}
