"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import {
  Shirt,
  User,
  LogOut,
  Home,
  ClipboardList,
  ShieldAlert,
  Menu,
} from "lucide-react";
import { useToast } from "@/shared/components/ui/use-toast";
import { useReservationStore } from "@/shared/lib/reservation-store";
import { authApi, userApi, UserInfoResponse } from "@/shared/lib/api-client";
import axios from "axios";
import { cookies } from "next/headers";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [user, setUser] = useState<UserInfoResponse | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { fetchMyInfo } = useReservationStore();
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password";

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const { data } = await axios.get(`/api/auth/role`);
        setIsAdmin(data.role === "ROLE_ADMIN");
      } catch (error) {
        console.error("Failed to fetch role:", error);
        setIsAdmin(false);
      }
    };

    const fetchUserInfo = async () => {
      try {
        const userInfo = await userApi.getMyInfo();
        setUser(userInfo.data);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        setUser(null);
      }
    };

    if (!isAuthPage) {
      checkAdminRole();
      setIsAuthenticated(true);
    } else if (isAuthPage) {
      setIsAuthenticated(false);
    }

    fetchMyInfo();
    fetchUserInfo();
  }, [pathname, fetchMyInfo, isAuthPage]);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch (error) {
      // 로그아웃은 실패해도 진행
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }

    setIsOpen(false);

    toast({
      title: "로그아웃 성공",
      description: "안전하게 로그아웃되었습니다.",
    });

    router.push("/login");
  };

  const closeSheet = () => {
    setIsOpen(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  const navigationItems = [
    {
      href: "/",
      label: "홈",
      icon: Home,
      active: pathname === "/",
    },
    {
      href: "/my-page",
      label: "마이페이지",
      icon: ClipboardList,
      active: pathname === "/my-page",
    },
    ...(isAdmin
      ? [
          {
            href: "/admin",
            label: "관리자",
            icon: ShieldAlert,
            active: pathname === "/admin",
          },
        ]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 h-14 md:h-16 flex items-center">
        <div className="flex items-center space-x-4 sm:space-x-6">
          <Link href="/" className="flex items-center">
            <Shirt className="h-5 w-5 md:h-6 md:w-6 text-[#86A9FF]" />
            <span className="ml-2 text-lg md:text-xl font-bold text-[#6487DB]">
              Washer
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  item.active
                    ? "bg-[#A8C2FF] text-[#6487DB]"
                    : "text-gray-600 hover:bg-[#EDF2FF]"
                }`}
              >
                <div className="flex items-center">
                  <item.icon className="h-4 w-4 mr-1" />
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-end space-x-2">
          {/* 데스크톱 사용자 정보 */}
          <div className="hidden md:flex items-center space-x-2">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-700">
                {user ? (
                  <>
                    {user.schoolNumber} {user.name}
                  </>
                ) : (
                  "로딩 중..."
                )}
              </div>
              {user?.roomNumber && !isAdmin && (
                <div className="text-xs text-gray-500">{user.roomNumber}호</div>
              )}
              {isAdmin && user?.roomNumber && (
                <div className="text-xs text-red-500">
                  관리자 | {user.roomNumber}호
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-[#EDF2FF] h-8 w-8"
              onClick={() => router.push("/my-page")}
            >
              <User className="h-4 w-4 text-[#6487DB]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-red-100 h-8 w-8"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 text-red-600" />
            </Button>
          </div>

          {/* 모바일 메뉴 */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">메뉴 열기</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 sm:w-80">
                <div className="flex flex-col h-full">
                  {/* 사용자 정보 */}
                  <div className="border-b border-gray-200 pb-4 mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-[#EDF2FF]">
                        <User className="h-6 w-6 text-[#6487DB]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {user ? (
                            <>
                              {user.schoolNumber} {user.name}
                            </>
                          ) : (
                            "로딩 중..."
                          )}
                        </div>
                        {user?.roomNumber && !isAdmin && (
                          <div className="text-xs text-gray-500">
                            {user.roomNumber}호
                          </div>
                        )}
                        {isAdmin && user?.roomNumber && (
                          <div className="text-xs text-red-500">
                            관리자 | {user.roomNumber}호
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 네비게이션 메뉴 */}
                  <div className="flex-1 space-y-1">
                    {navigationItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeSheet}
                        className={`flex items-center px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                          item.active
                            ? "bg-[#A8C2FF] text-[#6487DB]"
                            : "text-gray-600 hover:bg-[#EDF2FF]"
                        }`}
                      >
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.label}
                      </Link>
                    ))}
                  </div>

                  {/* 로그아웃 버튼 */}
                  <div className="border-t border-gray-200 pt-4">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 py-3"
                      onClick={handleLogout}
                      disabled={isLoading}
                    >
                      <LogOut className="h-5 w-5 mr-3" />
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
  );
}
