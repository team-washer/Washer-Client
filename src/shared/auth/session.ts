import {
  AUTH_COOKIE_NAMES,
  deleteBrowserCookie,
} from "./cookies"

export const clearBrowserAuthSession = (): void => {
  deleteBrowserCookie(AUTH_COOKIE_NAMES.ACCESS_TOKEN)
  deleteBrowserCookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN)
}
