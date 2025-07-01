import { create } from "zustand"
import { persist } from "zustand/middleware"

// 사용자 역할 타입
export type UserRole = "ROLE_USER" | "ROLE_ADMIN"

// 인증 상태 타입
interface AuthState {
  isLoggedIn: boolean
  setIsLoggedIn: (isLoggedIn: boolean) => void
}

// Base32 인코딩/디코딩 함수
const base32Encode = (str: string): string => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = 0
  let value = 0
  let output = ''

  for (let i = 0; i < str.length; i++) {
    value = (value << 8) | str.charCodeAt(i)
    bits += 8

    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31]
  }

  return output
}

const base32Decode = (str: string): string => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = 0
  let value = 0
  let output = ''

  for (let i = 0; i < str.length; i++) {
    const char = str[i].toUpperCase()
    const index = alphabet.indexOf(char)
    if (index === -1) continue

    value = (value << 5) | index
    bits += 5

    while (bits >= 8) {
      output += String.fromCharCode((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }

  return output
}

// 인증 상태 스토어
export const authStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      setIsLoggedIn: (isLoggedIn: boolean) => {
        set({ isLoggedIn })
      },
    }),
    {
      name: "auth-storage",
      storage: {
        getItem: (name) => {
          if (typeof window !== "undefined") {
            const value = localStorage.getItem(name)
            return value ? JSON.parse(value) : null
          }
          return null
        },
        setItem: (name, value) => {
          if (typeof window !== "undefined") {
            localStorage.setItem(name, JSON.stringify(value))
          }
        },
        removeItem: (name) => {
          if (typeof window !== "undefined") {
            localStorage.removeItem(name)
          }
        },
      },
    },
  ),
)

// 역할 관리자
export const roleManager = {
  setRole: (role: UserRole) => {
    if (typeof window !== "undefined") {
      let encodedRole = role as string
      
      // base64 5회
      for (let i = 0; i < 5; i++) {
        encodedRole = btoa(encodedRole)
      }
      
      // base32 1회
      encodedRole = base32Encode(encodedRole)
      
      // base64 5회
      for (let i = 0; i < 5; i++) {
        encodedRole = btoa(encodedRole)
      }
      
      // base32 1회
      encodedRole = base32Encode(encodedRole)
      
      localStorage.setItem("userRole", encodedRole)
    }
  },

  getRole: (): UserRole | null => {
    if (typeof window === "undefined") return null

    try {
      let encodedRole = localStorage.getItem("userRole")
      if (!encodedRole) return null

      let role = encodedRole
      
      // base32 1회 디코딩
      role = base32Decode(role)
      
      // base64 5회 디코딩
      for (let i = 0; i < 5; i++) {
        role = atob(role)
      }
      
      // base32 1회 디코딩
      role = base32Decode(role)
      
      // base64 5회 디코딩
      for (let i = 0; i < 5; i++) {
        role = atob(role)
      }
      
      return role === "ROLE_USER" || role === "ROLE_ADMIN" ? (role as UserRole) : null
    } catch (error) {
      console.error("❌ Failed to decode role:", error)
      return null
    }
  },

  clearRole: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("userRole")
    }
  },

  isAdmin: (): boolean => {
    return roleManager.getRole() === "ROLE_ADMIN"
  },

  isUser: (): boolean => {
    return roleManager.getRole() === "ROLE_USER"
  },

  hasRole: (): boolean => {
    return roleManager.getRole() !== null
  },
}

// 보안 관리자
export const securityManager = {
  // 토큰과 역할의 일관성 검증
  validateTokenAndRole: async (): Promise<boolean> => {
    try {
      if (typeof window === "undefined") return false

      const hasToken = localStorage.getItem("authToken") !== null
      const hasRole = roleManager.hasRole()
      const isLoggedIn = authStore.getState().isLoggedIn

      return hasToken && hasRole && isLoggedIn
    } catch (error) {
      console.error("❌ Token validation failed:", error)
      return false
    }
  },

  // 권한 변조 시도 감지
  detectTampering: (): boolean => {
    try {
      if (typeof window === "undefined") return false

      const role = roleManager.getRole()
      const token = localStorage.getItem("authToken")

      // 역할이 null이거나 토큰이 없으면 변조 의심
      if (role === null || !token) {
        console.warn("⚠️ Potential tampering detected: missing role or token")
        return true
      }

      return false
    } catch (error) {
      // 복호화 실패 시 변조로 간주
      console.error("❌ Tampering detection error:", error)
      return true
    }
  },

  // 관리자 권한 검증
  validateAdminAccess: (): boolean => {
    try {
      const isAdmin = roleManager.isAdmin()
      const hasValidToken = checkAuthState()

      return isAdmin && hasValidToken
    } catch (error) {
      console.error("❌ Admin access validation failed:", error)
      return false
    }
  },
}

// 인증 상태 확인 헬퍼
export const checkAuthState = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
  const hasValidToken = Boolean(token && token !== "null" && token !== "undefined")
  const currentLoginState = authStore.getState().isLoggedIn

  // 토큰이 없는데 로그인 상태가 true인 경우 강제 로그아웃 및 새로고침
  if (!hasValidToken && currentLoginState) {
    authStore.getState().setIsLoggedIn(false)
    roleManager.clearRole()
    localStorage.removeItem("authToken")
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("studentId")

    // 강제 새로고침
    if (typeof window !== "undefined") {
      window.location.reload()
    }
    return false
  }

  // 토큰과 로그인 상태가 일치하지 않으면 동기화
  if (hasValidToken !== currentLoginState) {
    authStore.getState().setIsLoggedIn(hasValidToken)
  }

  return hasValidToken
}

// 로그아웃 헬퍼
export const performLogout = () => {
  if (typeof window !== "undefined") {
    // 인증 상태 초기화
    authStore.getState().setIsLoggedIn(false)

    // 토큰 및 역할 정보 삭제
    localStorage.removeItem("authToken")
    roleManager.clearRole()

    // 기타 로그인 관련 정보 삭제
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("studentId")

  }
}
