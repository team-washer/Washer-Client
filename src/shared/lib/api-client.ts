import axios from 'axios';
import { UserRole } from './auth-utils';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

// API 응답 타입 정의 - 로그인 응답 구조 업데이트
export interface AuthResponse {
  data: {
    success: boolean;
    data: {
      accessToken: string;
      accessTokenExpiredAt: string;
      refreshToken: string;
      refreshTokenExpiredAt: string;
      role: UserRole;
    };
    message: string;
    timestamp: string;
  };
}

export interface ApiError {
  message: string;
  status: number;
}

// 세탁기 작업 상태 타입 정의
export type WasherJobState =
  | 'airWash'
  | 'aIRinse'
  | 'aISpin'
  | 'aIWash'
  | 'cooling'
  | 'delayWash'
  | 'drying'
  | 'finish'
  | 'none'
  | 'preWash'
  | 'rinse'
  | 'spin'
  | 'wash'
  | 'weightSensing'
  | 'wrinklePrevent'
  | 'freezeProtection';

// 건조기 작업 상태 타입 정의
export type DryerJobState =
  | 'cooling'
  | 'delayWash'
  | 'drying'
  | 'finished'
  | 'none'
  | 'refreshing'
  | 'weightSensing'
  | 'wrinklePrevent'
  | 'dehumidifying'
  | 'aIDrying'
  | 'sanitizing'
  | 'internalCare'
  | 'freezeProtection'
  | 'continuousDehumidifying'
  | 'thawingFrozenInside';

// 기기 상태 타입 정의
export type MachineState = 'pause' | 'run' | 'stop';

// Machine API 타입 정의 - 예약 ID 필드 추가
export interface MachineReservation {
  startTime: string;
  room: string;
  status: 'waiting' | 'reserved' | 'confirmed' | 'running';
}

export interface MachineDevice {
  id: number;
  label: string;
  floor: string;
  powerState: 'on' | 'off';
  machineState: MachineState;
  jobState: WasherJobState | DryerJobState; // washerJobState, dryerJobState 대신 jobState 사용
  remainingTime: string; // "00:00:00" 형식
  isOutOfOrder: boolean;
  reservations: MachineReservation[];
}

export interface DevicesResponse {
  success: boolean;
  data: {
    washer: MachineDevice[];
    dryer: MachineDevice[];
  };
  message: string;
  timestamp: string;
}

export interface ReportResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

export interface Report {
  reportId: number;
  machineName: string;
  reportedByUserName: string;
  reportedByUserNumber: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved';
  resolvedAt: string | null;
}

export interface ReportsResponse {
  success: boolean;
  data: Report[];
  message: string;
  timestamp: string;
}

// 고장 기기 타입 정의 - 새로운 명세에 맞게 수정
export interface OutOfOrderDevice {
  name: string;
  type: 'washer' | 'dryer';
  floor: string; // "_4F", "_5F" 형식
  outOfOrder: boolean;
}

export interface OutOfOrderResponse {
  success: boolean;
  data: OutOfOrderDevice[];
  message: string;
  timestamp: string;
}

// 기기 히스토리 타입 정의 추가 (OutOfOrderResponse 타입 정의 다음에 추가)
export interface MachineHistoryItem {
  status:
    | 'waiting'
    | 'reserved'
    | 'confirmed'
    | 'running'
    | 'cancelled'
    | 'completed';
  createdAt: string;
  pausedSince: string | null;
  confirmedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  machineLabel: string;
}

export interface MachineHistoryResponse {
  success: boolean;
  data: MachineHistoryItem[];
  message: string;
  timestamp: string;
}

// Reservation API 타입 정의
export interface ReservationResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

export interface AdminReservationInfo {
  reservationId: number;
  machineLabel: string;
  status: 'waiting' | 'reserved' | 'confirmed' | 'running';
  startTime: string;
  remainingSeconds: number;
}

export interface AdminReservationsResponse {
  success: boolean;
  data: AdminReservationInfo[];
  message: string;
  timestamp: string;
}

// User API 타입 정의 - restrictedUntil과 restrictionReason 추가
export interface UserInfo {
  id: string;
  name: string;
  schoolNumber?: string;
  roomNumber: string;
  gender: 'male' | 'female';
  restrictedUntil: string | null;
  restrictionReason: string | null;
  reservationId?: number;
  machineLabel?: string;
  status?: 'waiting' | 'reserved' | 'confirmed' | 'running';
  startTime?: string;
  remainingSeconds?: number;
  remainingTime?: string; // 새로 추가
}

export interface UserInfoResponse {
  success: boolean;
  data: UserInfo;
  message: string;
  timestamp: string;
}

export interface AdminUserInfo {
  id: number;
  name: string;
  schoolNumber: string;
  gender: 'male' | 'female';
  roomName: string;
  restrictedUntil: string | null;
  restrictionReason: string | null;
}

export interface AdminUsersResponse {
  success: boolean;
  data: AdminUserInfo[];
  message: string;
  timestamp: string;
}

export interface RestrictResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

// 기기 작업 상태 표시 정보
export interface JobStateInfo {
  text: string;
  color: string;
  icon: string;
  description: string;
}

// 세탁기 작업 상태 매핑 함수
export function getWasherJobStateInfo(
  state: WasherJobState | undefined
): JobStateInfo {
  const stateMap: Record<WasherJobState, JobStateInfo> = {
    none: {
      text: '대기 중',
      color: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: '⏸️',
      description: '현재 작업 상태가 없습니다',
    },
    airWash: {
      text: '에어워시 중',
      color: 'bg-sky-50 text-sky-700 border-sky-200',
      icon: '💨',
      description: '에어워시 모드로 작동 중입니다',
    },
    aIRinse: {
      text: 'AI 헹굼 중',
      color: 'bg-violet-50 text-violet-700 border-violet-200',
      icon: '🤖',
      description: 'AI 헹굼 모드로 작동 중입니다',
    },
    aISpin: {
      text: 'AI 탈수 중',
      color: 'bg-violet-50 text-violet-700 border-violet-200',
      icon: '🤖',
      description: 'AI 탈수 모드로 작동 중입니다',
    },
    aIWash: {
      text: 'AI 세탁 중',
      color: 'bg-violet-50 text-violet-700 border-violet-200',
      icon: '🤖',
      description: 'AI 세탁 모드로 작동 중입니다',
    },
    cooling: {
      text: '냉각 중',
      color: 'bg-sky-50 text-sky-700 border-sky-200',
      icon: '❄️',
      description: '세탁 완료 후 냉각하고 있습니다',
    },
    delayWash: {
      text: '예약 대기',
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: '⏰',
      description: '예약된 시간을 기다리고 있습니다',
    },
    drying: {
      text: '건조 중',
      color: 'bg-red-50 text-red-700 border-red-200',
      icon: '🔥',
      description: '건조 작업을 진행하고 있습니다',
    },
    finish: {
      text: '완료',
      color: 'bg-green-50 text-green-700 border-green-200',
      icon: '✅',
      description: '세탁이 완료되었습니다',
    },
    preWash: {
      text: '예비세탁 중',
      color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      icon: '🫧',
      description: '예비세탁을 진행하고 있습니다',
    },
    rinse: {
      text: '헹굼 중',
      color: 'bg-teal-50 text-teal-700 border-teal-200',
      icon: '💧',
      description: '헹굼 작업을 진행하고 있습니다',
    },
    spin: {
      text: '탈수 중',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: '🌀',
      description: '탈수 작업을 진행하고 있습니다',
    },
    wash: {
      text: '세탁 중',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: '🌊',
      description: '세탁 작업을 진행하고 있습니다',
    },
    weightSensing: {
      text: '무게 감지 중',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: '⚖️',
      description: '세탁물의 무게를 감지하고 있습니다',
    },
    wrinklePrevent: {
      text: '구김 방지 중',
      color: 'bg-pink-50 text-pink-700 border-pink-200',
      icon: '👔',
      description: '구김 방지 모드가 작동 중입니다',
    },
    freezeProtection: {
      text: '동결 방지 중',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: '🧊',
      description: '동결 방지 모드가 작동 중입니다',
    },
  };

  return stateMap[state || 'none'] || stateMap.none;
}

// 건조기 작업 상태 매핑 함수
export function getDryerJobStateInfo(
  state: DryerJobState | undefined
): JobStateInfo {
  const stateMap: Record<DryerJobState, JobStateInfo> = {
    none: {
      text: '대기 중',
      color: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: '⏸️',
      description: '현재 작업 상태가 없습니다',
    },
    cooling: {
      text: '냉각 중',
      color: 'bg-sky-50 text-sky-700 border-sky-200',
      icon: '❄️',
      description: '건조 완료 후 냉각하고 있습니다',
    },
    delayWash: {
      text: '예약 대기',
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: '⏰',
      description: '예약된 시간을 기다리고 있습니다',
    },
    drying: {
      text: '건조 중',
      color: 'bg-red-50 text-red-700 border-red-200',
      icon: '🔥',
      description: '건조 작업을 진행하고 있습니다',
    },
    finished: {
      text: '완료',
      color: 'bg-green-50 text-green-700 border-green-200',
      icon: '✅',
      description: '건조가 완료되었습니다',
    },
    refreshing: {
      text: '리프레쉬 중',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: '🌿',
      description: '탈취 또는 리프레쉬 작업 중입니다',
    },
    weightSensing: {
      text: '무게 감지 중',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: '⚖️',
      description: '세탁물의 무게를 감지하고 있습니다',
    },
    wrinklePrevent: {
      text: '구김 방지 중',
      color: 'bg-pink-50 text-pink-700 border-pink-200',
      icon: '👔',
      description: '구김 방지 모드가 작동 중입니다',
    },
    dehumidifying: {
      text: '제습 중',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: '💨',
      description: '제습 모드가 작동 중입니다',
    },
    aIDrying: {
      text: 'AI 건조 중',
      color: 'bg-violet-50 text-violet-700 border-violet-200',
      icon: '🤖',
      description: 'AI 건조 기능이 작동 중입니다',
    },
    sanitizing: {
      text: '살균 중',
      color: 'bg-lime-50 text-lime-700 border-lime-200',
      icon: '🦠',
      description: '살균 모드가 작동 중입니다',
    },
    internalCare: {
      text: '내부 관리 중',
      color: 'bg-slate-50 text-slate-700 border-slate-200',
      icon: '🔧',
      description: '내부 관리(통세척 등) 작업 중입니다',
    },
    freezeProtection: {
      text: '동결 방지 중',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: '🧊',
      description: '동결 방지 모드가 작동 중입니다',
    },
    continuousDehumidifying: {
      text: '지속 제습 중',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: '💨',
      description: '지속 제습 모드가 작동 중입니다',
    },
    thawingFrozenInside: {
      text: '해동 중',
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: '🔥',
      description: '내부 결빙을 해동하고 있습니다',
    },
  };

  return stateMap[state || 'none'] || stateMap.none;
}

// 기기 타입에 따른 작업 상태 정보 가져오기
export function getMachineJobStateInfo(
  machine: MachineDevice,
  machineType: 'washer' | 'dryer'
): JobStateInfo {
  if (machineType === 'washer') {
    return getWasherJobStateInfo(machine.jobState as WasherJobState);
  } else {
    return getDryerJobStateInfo(machine.jobState as DryerJobState);
  }
}

// 남은 시간 계산 함수 - "HH:MM:SS" 형식을 초로 변환
export function parseTimeStringToSeconds(timeString: string): number {
  try {
    if (!timeString || timeString === '00:00:00') {
      return 0;
    }

    const parts = timeString.split(':');
    if (parts.length !== 3) {
      return 0;
    }

    const hours = Number.parseInt(parts[0]) || 0;
    const minutes = Number.parseInt(parts[1]) || 0;
    const seconds = Number.parseInt(parts[2]) || 0;

    return hours * 3600 + minutes * 60 + seconds;
  } catch (error) {
    console.error('❌ Failed to parse time string:', error);
    return 0;
  }
}

// 안전한 토큰 로깅 헬퍼 함수
const safeTokenLog = (
  token: string | null | undefined,
  prefix = ''
): string => {
  if (!token || token === 'null' || token === 'undefined') {
    return 'null';
  }
  return `${prefix}${token.substring(0, 20)}...`;
};

// 로그아웃 및 리다이렉트 헬퍼 함수
const forceLogout = async (reason = 'Authentication failed') => {
  if (typeof window !== 'undefined') {
    // auth-utils에서 로그인 상태를 false로 설정
    try {
      const { authStore } = await import('./auth-utils');
      authStore.getState().setIsLoggedIn(false);
    } catch (error) {
      console.error('❌ Failed to update auth state:', error);
    }

    // 로컬스토리지 완전 초기화
    localStorage.clear();

    // 세션스토리지도 초기화
    sessionStorage.clear();

    // 쿠키도 초기화 (만약 있다면)
    document.cookie.split(';').forEach((c) => {
      const eqPos = c.indexOf('=');
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });

    // 현재 페이지가 로그인 페이지가 아닌 경우에만 리다이렉트
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
      // 강제 새로고침으로 완전히 초기화
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  }
};

// 간단한 토큰 관리
export const tokenManager = {
  getToken: () => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('authToken');
    return token;
  },

  setToken: async (token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('authToken', token);

    // 토큰 설정 시 isLoggedIn을 true로 설정
    try {
      const { authStore } = await import('./auth-utils');
      authStore.getState().setIsLoggedIn(true);
    } catch (error) {
      console.error('❌ Failed to update auth state:', error);
    }
  },

  clearToken: async () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('authToken');

    // 토큰 삭제 시 isLoggedIn을 false로 설정
    try {
      const { authStore } = await import('./auth-utils');
      authStore.getState().setIsLoggedIn(false);
    } catch (error) {
      console.error('❌ Failed to update auth state:', error);
    }
  },

  hasToken: () => {
    const token = tokenManager.getToken();
    return token && token !== 'null' && token !== 'undefined';
  },

  // 토큰 유효성 검사 및 로그인 상태 동기화
  validateAndSyncAuth: async () => {
    const token = tokenManager.getToken();
    const hasValidToken = token && token !== 'null' && token !== 'undefined';

    try {
      const { authStore } = await import('./auth-utils');
      const currentLoginState = authStore.getState().isLoggedIn;

      // 토큰 상태와 로그인 상태가 일치하지 않으면 동기화
      if (hasValidToken !== currentLoginState) {
        authStore.getState().setIsLoggedIn(hasValidToken);
      }

      // 토큰이 없으면 강제 로그아웃
      if (!hasValidToken && currentLoginState) {
        await forceLogout('Token validation failed');
      }

      return hasValidToken;
    } catch (error) {
      console.error('❌ Failed to validate and sync auth:', error);
      return false;
    }
  },
};

// API 요청 헬퍼
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };

  // 인증이 필요한 엔드포인트 체크
  const isAuthEndpoint = endpoint.includes('/auth/');
  const needsAuth = !isAuthEndpoint;

  if (needsAuth) {
    // 토큰 유효성 검사 및 상태 동기화
    const isValidAuth = await tokenManager.validateAndSyncAuth();

    if (!isValidAuth) {
      await forceLogout('No valid authentication');
      return Promise.reject(new Error('No access token'));
    }

    const token = tokenManager.getToken();
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    // 401 Unauthorized 처리 - 즉시 로그아웃
    if (response.status === 401 && needsAuth) {
      await forceLogout('Authentication expired or invalid');
      throw new Error('Authentication failed');
    }

    // 403 Forbidden 처리 - 권한 없음
    if (response.status === 403) {
      await forceLogout('Insufficient permissions');
      throw new Error('Access forbidden');
    }

    if (!response.ok) {
      let errorText = '';
      let errorData: any = {};

      try {
        errorText = await response.text();
        console.error(`❌ API Error Response: ${response.status}`, errorText);
      } catch (readError) {
        console.error('❌ Failed to read error response:', readError);
        errorText = `HTTP ${response.status} ${response.statusText}`;
      }

      // JSON 파싱 시도
      try {
        if (errorText.trim()) {
          errorData = JSON.parse(errorText);
        }
      } catch (parseError) {
        errorData = { message: errorText };
      }

      // 오류 메시지 결정
      let errorMessage = '';

      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      } else if (errorText && errorText.trim()) {
        errorMessage = errorText;
      } else {
        errorMessage = `HTTP error! status: ${response.status}`;
      }

      const apiError = {
        message: errorMessage,
        status: response.status,
        originalResponse: errorText,
      } as ApiError;

      throw apiError;
    }

    if (response.status === 204) {
      return {} as T;
    }

    const responseText = await response.text();

    if (!responseText.trim()) {
      return {} as T;
    }

    try {
      const responseData = JSON.parse(responseText);
      return responseData;
    } catch (parseError) {
      console.error(`❌ JSON parse error:`, parseError);
      throw new Error(
        `서버에서 올바르지 않은 형식의 응답을 받았습니다: ${responseText}`
      );
    }
  } catch (error) {
    console.error(`💥 API Error:`, error);

    // 네트워크 오류인 경우에도 로그아웃 처리 (서버 연결 불가 등)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      await forceLogout('Network connection failed');
    }

    // 이미 ApiError 객체인 경우 그대로 throw
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      'message' in error
    ) {
      throw error;
    }

    // Error 객체인 경우 그대로 throw
    if (error instanceof Error) {
      throw error;
    }

    // 그 외의 경우만 네트워크 오류로 처리
    throw new Error('Network error occurred');
  }
}

// Auth API 함수들
export const authApi = {
  signup: async (data: {
    email: string;
    password: string;
    name: string;
    schoolNumber: string;
    gender: string;
    room: string;
  }) => {
    return apiRequest<void>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  sendSignupVerification: async (email: string) => {
    return apiRequest<void>('/auth/signup/mailsend', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  verifySignupEmail: async (email: string, code: string) => {
    return apiRequest<void>('/auth/signup/emailverify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  signin: async (email: string, password: string) => {
    try {
      const response = await axios.post(`/api/signin`, { email, password });
      console.log(response.data);
    } catch (error) {
      console.error('❌ Login API error:', error);
      throw error;
    }
  },

  sendPasswordChangeVerification: async (email: string) => {
    return apiRequest<void>('/auth/pwchange/mailsend', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  changePassword: async (email: string, password: string, code: string) => {
    return apiRequest<void>('/auth/pwchange', {
      method: 'POST',
      body: JSON.stringify({ email, password, code }),
    });
  },

  logout: async () => {
    await forceLogout('User initiated logout');
  },
};

// Machine API 함수들
export const machineApi = {
  getDevices: async (type?: 'washer' | 'dryer', floor?: string) => {
    const params = new URLSearchParams();
    if (type) {
      params.append('type', type);
    }
    if (floor) {
      params.append('floor', floor);
    }

    const queryString = params.toString();
    const endpoint = `/machine/devices${queryString ? `?${queryString}` : ''}`;

    try {
      const response = await apiRequest<DevicesResponse>(endpoint, {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error(`❌ getDevices API error:`, error);
      throw error;
    }
  },

  reportMachine: async (machineName: string, description: string) => {
    return apiRequest<ReportResponse>('/machine/report', {
      method: 'POST',
      body: JSON.stringify({ machineName, description }),
    });
  },

  getReports: async () => {
    return apiRequest<ReportsResponse>('/machine/admin/reports', {
      method: 'GET',
    });
  },

  updateReportStatus: async (
    reportId: number,
    status: 'pending' | 'in_progress' | 'resolved'
  ) => {
    return apiRequest<ReportResponse>(
      `/machine/admin/reports/${reportId}?status=${status}`,
      {
        method: 'PATCH',
      }
    );
  },

  getOutOfOrderDevices: async (type?: 'washer' | 'dryer', floor?: string) => {
    const params = new URLSearchParams();
    if (type) {
      params.append('type', type);
    }
    if (floor) {
      // 층 정보를 "_4F", "_5F" 형식으로 변환
      const formattedFloor = floor.startsWith('_') ? floor : `_${floor}`;
      params.append('floor', formattedFloor);
    }

    const queryString = params.toString();
    const endpoint = `/machine/admin/out-of-order${
      queryString ? `?${queryString}` : ''
    }`;

    return apiRequest<OutOfOrderResponse>(endpoint, {
      method: 'GET',
    });
  },

  updateOutOfOrderStatus: async (name: string, outOfOrder: boolean) => {
    return apiRequest<ReportResponse>('/machine/admin/out-of-order', {
      method: 'PATCH',
      body: JSON.stringify({ name, outOfOrder }),
    });
  },

  getHistory: async (machineId: number) => {
    return apiRequest<MachineHistoryResponse>(`/reservation/machine/${machineId}/history`, {
      method: 'GET',
    });
  },
};

// Reservation API 함수들
export const reservationApi = {
  createReservation: async (machineId: number) => {
    const endpoint = `/reservation/${machineId}`;

    try {
      const response = await apiRequest<ReservationResponse>(endpoint, {
        method: 'POST',
      });

      return response;
    } catch (error) {
      console.error(`❌ createReservation API error:`, error);
      console.error(`❌ Error details:`, {
        message: error?.message,
        status: error?.status,
        endpoint,
        machineId,
      });
      throw error;
    }
  },

  confirmReservation: async (reservationId: number) => {
    return apiRequest<ReservationResponse>(
      `/reservation/${reservationId}/confirm`,
      {
        method: 'POST',
      }
    );
  },

  deleteReservation: async (reservationId: number) => {
    return apiRequest<ReservationResponse>(`/reservation/${reservationId}`, {
      method: 'DELETE',
    });
  },

  getAdminReservations: async (type?: 'WASHER' | 'DRYER', floor?: string) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (floor) params.append('floor', floor);

    const queryString = params.toString();
    const endpoint = `/reservation/admin/reservations${
      queryString ? `?${queryString}` : ''
    }`;

    return apiRequest<AdminReservationsResponse>(endpoint, {
      method: 'GET',
    });
  },

  forceDeleteReservation: async (reservationId: number) => {
    return apiRequest<ReservationResponse>(
      `/reservation/admin/${reservationId}`,
      {
        method: 'DELETE',
      }
    );
  },
};

// User API 함수들
export const userApi = {
  getMyInfo: async () => {
    return apiRequest<UserInfoResponse>('/user/me', {
      method: 'GET',
    });
  },

  getUsers: async (
    name?: string,
    gender?: 'male' | 'female',
    floor?: string
  ) => {
    const params = new URLSearchParams();
    if (name) params.append('name', name);
    if (gender) params.append('gender', gender);
    if (floor) params.append('floor', floor);

    const queryString = params.toString();
    const endpoint = `/user/admin/user/info${
      queryString ? `?${queryString}` : ''
    }`;

    return apiRequest<AdminUsersResponse>(endpoint, {
      method: 'GET',
    });
  },

  restrictUser: async (
    userId: number,
    restrictionData: { period: string; restrictionReason: string }
  ) => {
    // 기간 형식을 서버가 기대하는 형식으로 변환
    const formattedData = {
      period: restrictionData.period,
      pestrictionReason: restrictionData.restrictionReason, // 명세서의 오타에 맞춤
    };

    return apiRequest<RestrictResponse>(`/user/admin/${userId}/restrict`, {
      method: 'POST',
      body: JSON.stringify(formattedData),
    });
  },

  unrestrictUser: async (userId: number) => {
    return apiRequest<RestrictResponse>(`/user/admin/${userId}/unrestrict`, {
      method: 'POST',
    });
  },
};

export interface User {
  id: string;
  name: string;
  roomNumber: string;
  gender: 'male' | 'female';
  isAdmin: boolean;
  restrictedUntil: string | null;
  restrictionReason: string | null;
  studentId: string;
}

function convertServerUserToClient(serverUser: UserInfo): User {
  return {
    id: serverUser.id,
    name: serverUser.name,
    roomNumber: serverUser.roomNumber,
    gender: serverUser.gender,
    isAdmin: false,
    restrictedUntil: serverUser.restrictedUntil,
    restrictionReason: serverUser.restrictionReason,
    studentId: serverUser.id,
  };
}
