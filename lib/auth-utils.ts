import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 사용자 역할 타입
export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN';

// 인증 상태 타입
interface AuthState {
  isLoggedIn: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
}

// 인증 상태 스토어
export const authStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      setIsLoggedIn: (isLoggedIn: boolean) => {
        set({ isLoggedIn });
      },
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: (name) => {
          if (typeof window !== 'undefined') {
            const value = localStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          }
          return null;
        },
        setItem: (name, value) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(name, JSON.stringify(value));
          }
        },
        removeItem: (name) => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(name);
          }
        },
      },
    }
  )
);

// 보안 관리자
export const securityManager = {
  // 토큰과 역할의 일관성 검증
  validateTokenAndRole: async (): Promise<boolean> => {
    try {
      if (typeof window === 'undefined') return false;

      const hasToken = localStorage.getItem('authToken') !== null;
      // const hasRole = document.
      const isLoggedIn = authStore.getState().isLoggedIn;

      // return hasToken && hasRole && isLoggedIn
      return hasToken && isLoggedIn;
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      return false;
    }
  },

  // 권한 변조 시도 감지
  detectTampering: (): boolean => {
    try {
      if (typeof window === 'undefined') return false;

      // const role = roleManager.getRole()
      const token = localStorage.getItem('authToken');

      // 역할이 null이거나 토큰이 없으면 변조 의심
      // if (role === null || !token) {
      //   console.warn("⚠️ Potential tampering detected: missing role or token")
      //   return true
      // }

      return false;
    } catch (error) {
      // 복호화 실패 시 변조로 간주
      console.error('❌ Tampering detection error:', error);
      return true;
    }
  },

  // 관리자 권한 검증
  validateAdminAccess: (): boolean => {
    try {
      // const isAdmin = roleManager.isAdmin()
      const hasValidToken = checkAuthState();

      // return isAdmin && hasValidToken
      return hasValidToken;
    } catch (error) {
      console.error('❌ Admin access validation failed:', error);
      return false;
    }
  },
};

// 인증 상태 확인 헬퍼
export const checkAuthState = () => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const hasValidToken = Boolean(
    token && token !== 'null' && token !== 'undefined'
  );
  const currentLoginState = authStore.getState().isLoggedIn;

  // 토큰이 없는데 로그인 상태가 true인 경우 강제 로그아웃 및 새로고침
  if (!hasValidToken && currentLoginState) {
    authStore.getState().setIsLoggedIn(false);
    // roleManager.clearRole()
    localStorage.removeItem('authToken');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('studentId');

    // 강제 새로고침
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
    return false;
  }

  // 토큰과 로그인 상태가 일치하지 않으면 동기화
  if (hasValidToken !== currentLoginState) {
    authStore.getState().setIsLoggedIn(hasValidToken);
  }

  return hasValidToken;
};

// 로그아웃 헬퍼
export const performLogout = () => {
  if (typeof window !== 'undefined') {
    // 인증 상태 초기화
    authStore.getState().setIsLoggedIn(false);

    // 토큰 및 역할 정보 삭제
    localStorage.removeItem('authToken');
    // roleManager.clearRole()

    // 기타 로그인 관련 정보 삭제
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('studentId');
  }
};
