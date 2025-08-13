import axios, { AxiosHeaders } from 'axios';
import { UserRole } from './auth-utils';

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
export type MachineState = 'PAUSE' | 'RUN' | 'STOP';

// Machine API 타입 정의 - 예약 ID 필드 추가
export interface MachineReservation {
  startTime: string;
  room: string;
  status: 'WAITING' | 'RESERVED' | 'CONFIRMED' | 'RUNNING';
}

export interface MachineDevice {
  id: number;
  label: string;
  floor: string;
  powerState: 'ON' | 'OFF';
  machineState: MachineState;
  jobState: WasherJobState | DryerJobState; // washerJobState, dryerJobState 대신 jobState 사용
  remainingTime: string; // "00:00:00" 형식
  isOutOfOrder: boolean;
  reservations: MachineReservation[];
}

export interface DevicesResponse {
  washer: MachineDevice[];
  dryer: MachineDevice[];
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
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
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
  type: 'WASHER' | 'DRYER';
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
    | 'WAITING'
    | 'RESERVED'
    | 'CONFIRMED'
    | 'RUNNING'
    | 'CANCELLED'
    | 'COMPLETED';
  createdAt: string;
  pausedSince: string | null;
  confirmedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  machineLabel: string;
  room: string;
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
  status: 'WAITING' | 'RESERVED' | 'CONFIRMED' | 'RUNNING';
  startTime: string;
  remainingTime: string;
}

export interface AdminReservationsResponse {
  success: boolean;
  data: AdminReservationInfo[];
  message: string;
  timestamp: string;
}

export interface UserInfo {
  id: string;
  name: string;
  schoolNumber?: string;
  roomNumber: string;
  gender: 'MALE' | 'FEMALE';
  restrictedUntil: string | null;
  restrictionReason: string | null;
  reservationId?: number;
  machineLabel?: string;
  status?: 'WAITING' | 'RESERVED' | 'CONFIRMED' | 'RUNNING';
  startTime?: string;
  remainingSeconds?: number;
}

export interface UserInfoResponse {
  completedAt: Date | null;
  gender: string;
  id: string;
  machineLabel: string | null;
  name: string;
  remainingTime: string | null;
  reservationId: number | null;
  restrictedUntil: string | null;
  restrictionReason: string | null;
  roomNumber: string;
  schoolNumber: string;
  startTime: Date | null;
  status: 'WAITING' | 'RESERVED' | 'CONFIRMED' | 'RUNNING';
}

export interface AdminUserInfo {
  id: number;
  name: string;
  schoolNumber: string;
  gender: 'MALE' | 'FEMALE';
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
    await axios.post('/api/auth/logout', {});
  }
};

export const authApi = {
  signup: async (data: {
    email: string;
    password: string;
    name: string;
    schoolNumber: string;
    gender: string;
    room: string;
  }) => {
    return axios.post('/api/auth/signup', data);
  },

  sendSignupVerification: async (email: string) => {
    axios.post('/api/auth/signup/mailsend', { email });
  },

  verifySignupEmail: async (email: string, code: string) => {
    return axios.post('/api/auth/signup/emailverify', {
      email,
      code,
    });
  },

  signin: async (email: string, password: string) => {
    try {
      const response = await axios.post(`/api/signin`, { email, password });
    } catch (error) {
      console.error('❌ Login API error:', error);
      throw error;
    }
  },

  sendPasswordChangeVerification: async (email: string) => {
    return axios.post('/api/auth/pwchange/mailsend', {
      email,
    });
  },

  changePassword: async (email: string, password: string, code: string) => {
    return axios.post('/api/auth/pwchange', {
      email,
      password,
      code,
    });
  },

  logout: async () => {
    await forceLogout('User initiated logout');
  },
};

// Machine API 함수들
export const machineApi = {
  getDevices: async () => {
    const endpoint = `/api/machine/devices`;

    try {
      const response = await axios.get<DevicesResponse>(endpoint);

      return response;
    } catch (error) {
      console.error(`❌ getDevices API error:`, error);
      throw error;
    }
  },

  reportMachine: async (machineName: string, description: string) => {
    return axios.post<ReportResponse>('/api/machine/report', {
      machineName,
      description,
    });
  },

  getReports: async () => {
    return axios.get<Report[]>('/api/machine/admin/reports');
  },

  updateReportStatus: async (
    reportId: number,
    status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'
  ) => {
    return axios.patch<ReportResponse>(
      `/machine/admin/reports/${reportId}?status=${status}`
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
    const endpoint = `/api/machine/admin/out-of-order${
      queryString ? `?${queryString}` : ''
    }`;

    return axios.get<OutOfOrderDevice[]>(endpoint);
  },

  updateOutOfOrderStatus: async (name: string, outOfOrder: boolean) => {
    return axios.patch<ReportResponse>('/api/machine/admin/out-of-order', {
      name,
      outOfOrder,
    });
  },

  getHistory: async (machineId: number) => {
    return axios.get<MachineHistoryItem[]>(
      `/api/reservation/machine/${machineId}/history`
    );
  },
};

// Reservation API 함수들
export const reservationApi = {
  createReservation: async (machineId: number) => {
    const endpoint = `/api/reservation/machine/${machineId}`;

    try {
      const response = await axios.post(endpoint);

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
    return axios.post(`/api/reservation/${reservationId}/confirm`);
  },

  deleteReservation: async (reservationId: number) => {
    return axios.delete(`/api/reservation/${reservationId}`);
  },

  getAdminReservations: async (type?: 'WASHER' | 'DRYER', floor?: string) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (floor) params.append('floor', floor);

    const queryString = params.toString();
    const endpoint = `/api/reservation/admin/reservations${
      queryString ? `?${queryString}` : ''
    }`;

    return axios.get<AdminReservationInfo[]>(endpoint);
  },

  forceDeleteReservation: async (reservationId: number) => {
    return axios.delete(`/api/reservation/admin/${reservationId}`);
  },
};

// User API 함수들
export const userApi = {
  getMyInfo: async () => {
    return axios.get<UserInfoResponse>('/api/user/me');
  },

  getUsers: async (
    name?: string,
    gender?: 'MALE' | 'FEMALE',
    floor?: string
  ) => {
    const params = new URLSearchParams();
    if (name) params.append('name', name);
    if (gender) params.append('gender', gender);
    if (floor) params.append('floor', floor);

    const queryString = params.toString();
    const endpoint = `/api/user/admin/user/info${
      queryString ? `?${queryString}` : ''
    }`;

    return axios.get<AdminUsersResponse>(endpoint);
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

    return axios.post<RestrictResponse>(
      `/api/user/admin/${userId}/restrict`,
      formattedData
    );
  },

  unrestrictUser: async (userId: number) => {
    return axios.post<RestrictResponse>(`/api/user/admin/${userId}/unrestrict`);
  },
};

export interface User {
  id: string;
  name: string;
  roomNumber: string;
  gender: 'MALE' | 'FEMALE';
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
