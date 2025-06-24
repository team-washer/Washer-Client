// 간단한 암호화/복호화 유틸리티
const ENCRYPTION_KEY = "washer_app_secret_key_2024"

// 문자열을 Base64로 인코딩하고 키와 XOR 연산
function encrypt(text: string): string {
  const keyBytes = new TextEncoder().encode(ENCRYPTION_KEY)
  const textBytes = new TextEncoder().encode(text)

  const encrypted = new Uint8Array(textBytes.length)
  for (let i = 0; i < textBytes.length; i++) {
    encrypted[i] = textBytes[i] ^ keyBytes[i % keyBytes.length]
  }

  return btoa(String.fromCharCode(...encrypted))
}

// Base64 디코딩하고 키와 XOR 연산으로 복호화
function decrypt(encryptedText: string): string {
  try {
    const keyBytes = new TextEncoder().encode(ENCRYPTION_KEY)
    const encryptedBytes = new Uint8Array(
      atob(encryptedText)
        .split("")
        .map((char) => char.charCodeAt(0)),
    )

    const decrypted = new Uint8Array(encryptedBytes.length)
    for (let i = 0; i < encryptedBytes.length; i++) {
      decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length]
    }

    return new TextDecoder().decode(decrypted)
  } catch (error) {
    console.error("Decryption failed:", error)
    return ""
  }
}

// 사용자 역할 관리
export const roleManager = {
  // 역할 저장 (암호화)
  setRole: (role: "ROLE_USER" | "ROLE_ADMIN") => {
    if (typeof window === "undefined") return
    const encryptedRole = encrypt(role)
    localStorage.setItem("userRole", encryptedRole)
    console.log(`🔐 Role encrypted and stored: ${role}`)
  },

  // 역할 가져오기 (복호화)
  getRole: (): "ROLE_USER" | "ROLE_ADMIN" | null => {
    if (typeof window === "undefined") return null
    const encryptedRole = localStorage.getItem("userRole")
    if (!encryptedRole) return null

    const decryptedRole = decrypt(encryptedRole)
    if (decryptedRole === "ROLE_USER" || decryptedRole === "ROLE_ADMIN") {
      return decryptedRole
    }

    console.warn("Invalid role found, clearing...")
    roleManager.clearRole()
    return null
  },

  // 역할 삭제
  clearRole: () => {
    if (typeof window === "undefined") return
    localStorage.removeItem("userRole")
    console.log(`🗑️ Role cleared`)
  },

  // 관리자 권한 확인
  isAdmin: (): boolean => {
    const role = roleManager.getRole()
    return role === "ROLE_ADMIN"
  },

  // 사용자 권한 확인
  isUser: (): boolean => {
    const role = roleManager.getRole()
    return role === "ROLE_USER" || role === "ROLE_ADMIN"
  },

  // 역할 존재 확인
  hasRole: (): boolean => {
    return roleManager.getRole() !== null
  },
}

// 추가 보안을 위한 토큰 검증
export const securityManager = {
  // 토큰과 역할의 일관성 검증 (서버에서 재확인)
  validateTokenAndRole: async (): Promise<boolean> => {
    try {
      // 실제로는 서버에서 토큰을 검증하고 역할을 재확인해야 함
      // 여기서는 간단히 토큰 존재 여부만 확인
      const hasToken = localStorage.getItem("authToken") !== null
      const hasRole = roleManager.hasRole()

      return hasToken && hasRole
    } catch (error) {
      console.error("Token validation failed:", error)
      return false
    }
  },

  // 권한 변조 시도 감지
  detectTampering: (): boolean => {
    try {
      const role = roleManager.getRole()
      // 역할이 null이거나 유효하지 않으면 변조 의심
      return role === null
    } catch (error) {
      // 복호화 실패 시 변조로 간주
      return true
    }
  },
}
