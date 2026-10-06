import { NextRequest, NextResponse } from "next/server"
import { authUrls } from "@/shared/api/apiUrls"
import { AUTH_COOKIE_NAMES } from "@/shared/auth/cookies"
import { normalizeTokenResponse } from "@/shared/auth/tokenSession"

const apiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? ""

const redirectToLogin = (request: NextRequest): NextResponse =>
  NextResponse.redirect(new URL("/login?error=oauth", request.url))

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("code")
  if (!code) return redirectToLogin(request)

  try {
    const loginUrl = new URL(authUrls.login(), apiBaseUrl() || request.url)
    const tokenResponse = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authCode: code,
        redirectUri: process.env.NEXT_PUBLIC_DATAGSM_REDIRECT_URI,
      }),
      cache: "no-store",
    })

    if (!tokenResponse.ok) return redirectToLogin(request)

    const tokens = normalizeTokenResponse(await tokenResponse.json())
    if (!tokens) return redirectToLogin(request)

    const response = NextResponse.redirect(new URL("/", request.url))
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
    return redirectToLogin(request)
  }
}
