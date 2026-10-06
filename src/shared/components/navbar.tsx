"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  ClipboardList,
  History,
  Home,
  LogOut,
  Menu,
  Shirt,
  User,
  Wind,
} from "lucide-react"
import { getMyInfo } from "@/entities/user"
import type { MyInfo } from "@/entities/user"
import { getNotifications } from "@/entities/notification"
import { NOTIFICATIONS_UPDATED_EVENT } from "@/entities/notification/lib/events"
import { clearBrowserAuthSession } from "@/shared/auth/session"
import { Button } from "@/shared/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/shared/components/ui/sheet"
import { useToast } from "@/shared/components/ui/use-toast"

const authPaths = new Set(["/login"])

const navigationItems = [
  { href: "/", label: "홈", icon: Home },
  { href: "/washer", label: "세탁기", icon: Shirt },
  { href: "/dryer", label: "건조기", icon: Wind },
  { href: "/reservation-history", label: "이용 내역", icon: History },
  { href: "/my-page", label: "마이페이지", icon: ClipboardList },
  { href: "/notifications", label: "알림", icon: Bell },
]

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [user, setUser] = useState<MyInfo | null>(null)
  const [notificationCount, setNotificationCount] = useState(0)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const isAuthPage = authPaths.has(pathname)

  useEffect(() => {
    if (isAuthPage) {
      setUser(null)
      return
    }

    let isMounted = true
    void getMyInfo()
      .then((nextUser) => {
        if (isMounted) setUser(nextUser)
      })
      .catch(() => {
        if (isMounted) setUser(null)
      })

    return () => {
      isMounted = false
    }
  }, [isAuthPage])

  useEffect(() => {
    if (isAuthPage) {
      setNotificationCount(0)
      return
    }

    let isMounted = true
    const loadNotificationCount = async () => {
      try {
        const notifications = await getNotifications()
        if (isMounted) setNotificationCount(notifications.length)
      } catch {
        if (isMounted) setNotificationCount(0)
      }
    }

    const handleNotificationsUpdated = () => {
      void loadNotificationCount()
    }

    void loadNotificationCount()
    window.addEventListener(
      NOTIFICATIONS_UPDATED_EVENT,
      handleNotificationsUpdated,
    )

    return () => {
      isMounted = false
      window.removeEventListener(
        NOTIFICATIONS_UPDATED_EVENT,
        handleNotificationsUpdated,
      )
    }
  }, [isAuthPage])

  const handleLogout = () => {
    setIsLoggingOut(true)
    clearBrowserAuthSession()
    toast({
      title: "로그아웃 완료",
      description: "안전하게 로그아웃되었습니다.",
    })
    router.replace("/login")
  }

  if (isAuthPage) return null

  const userLabel = user ? `${user.studentId} ${user.name}` : "사용자"

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="container mx-auto flex h-14 items-center px-3 sm:px-4 md:h-16">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center">
            <Shirt className="h-5 w-5 text-[#86A9FF] md:h-6 md:w-6" />
            <span className="ml-2 text-lg font-bold text-[#6487DB] md:text-xl">
              Washer
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navigationItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === href
                    ? "bg-[#A8C2FF] text-[#6487DB]"
                    : "text-gray-600 hover:bg-[#EDF2FF]"
                }`}
              >
                <span className="flex items-center">
                  <Icon className="mr-1 h-4 w-4" />
                  {label}
                  {href === "/notifications" && notificationCount > 0 && (
                    <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] leading-none text-white">
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden text-right md:block">
            <p className="text-sm font-medium text-gray-700">{userLabel}</p>
            {user?.roomNumber && (
              <p className="text-xs text-gray-500">{user.roomNumber}호</p>
            )}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-[#EDF2FF]"
              onClick={() => router.push("/my-page")}
              aria-label="마이페이지"
            >
              <User className="h-4 w-4 text-[#6487DB]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-red-100"
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label="로그아웃"
            >
              <LogOut className="h-4 w-4 text-red-600" />
            </Button>
          </div>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">메뉴 열기</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 sm:w-80">
                <div className="flex h-full flex-col">
                  <div className="mb-4 border-b border-gray-200 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EDF2FF]">
                        <User className="h-6 w-6 text-[#6487DB]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {userLabel}
                        </p>
                        {user?.roomNumber && (
                          <p className="text-xs text-gray-500">
                            {user.roomNumber}호
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-1">
                    {navigationItems.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        className={`flex items-center rounded-md px-3 py-3 text-sm font-medium transition-colors ${
                          pathname === href
                            ? "bg-[#A8C2FF] text-[#6487DB]"
                            : "text-gray-600 hover:bg-[#EDF2FF]"
                        }`}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {label}
                        {href === "/notifications" && notificationCount > 0 && (
                          <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] leading-none text-white">
                            {notificationCount > 99 ? "99+" : notificationCount}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <Button
                      variant="ghost"
                      className="w-full justify-start py-3 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      로그아웃
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
