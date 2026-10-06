import axios, { AxiosHeaders } from "axios";
import { UserRole } from "./auth-utils";

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

export interface UserInfo {
  id: string;
  name: string;
  schoolNumber?: string;
  roomNumber: string;
  gender: "MALE" | "FEMALE";
  restrictedUntil: string | null;
  restrictionReason: string | null;
  reservationId?: number;
  machineLabel?: string;
  status?: "WAITING" | "RESERVED" | "CONFIRMED" | "RUNNING";
  startTime?: string;
  remainingSeconds?: number;
}

export interface UserInfoResponse {
  completedAt: Date | null;
  gender: "MALE" | "FEMALE";
  id: string;
  machineLabel?: string;
  name: string;
  remainingTime?: string;
  reservationId?: number;
  restrictedUntil?: string;
  restrictionReason?: string;
  roomNumber: string;
  schoolNumber: string;
  startTime?: string;
  status: "WAITING" | "RESERVED" | "CONFIRMED" | "RUNNING";
}

export interface AdminUserInfo {
  id: number;
  name: string;
  schoolNumber: string;
  gender: "MALE" | "FEMALE";
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

// 안전한 토큰 로깅 헬퍼 함수
const safeTokenLog = (
  token: string | null | undefined,
  prefix = ""
): string => {
  if (!token || token === "null" || token === "undefined") {
    return "null";
  }
  return `${prefix}${token.substring(0, 20)}...`;
};

// 로그아웃 및 리다이렉트 헬퍼 함수
const forceLogout = async (reason = "Authentication failed") => {
  if (typeof window !== "undefined") {
    await axios.post("/api/auth/logout", {});
    await axios.post("/api/auth/logout/delete-cookie", {});
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
    return axios.post("/api/auth/signup", data);
  },

  sendSignupVerification: async (email: string) => {
    return axios.post("/api/auth/signup/mailsend", { email });
  },

  verifySignupEmail: async (email: string, code: string) => {
    return axios.post("/api/auth/signup/emailverify", {
      email,
      code,
    });
  },

  signin: async (email: string, password: string) => {
    try {
      const response = await axios.post(`/api/signin`, { email, password });
    } catch (error) {
      console.error("❌ Login API error:", error);
      throw error;
    }
  },

  verifyPasswordChangeEmail: async (email: string, code: string) => {
    return axios.post("/api/auth/pwchange/verify", {
      email,
      code,
    });
  },

  sendPasswordChangeVerification: async (email: string) => {
    return axios.post("/api/auth/pwchange/mailsend", {
      email,
    });
  },

  changePassword: async (email: string, password: string) => {
    return axios.post("/api/auth/pwchange", {
      email,
      password,
    });
  },

  logout: async () => {
    await forceLogout("User initiated logout");
  },
};

// User API 함수들
export const userApi = {
  getMyInfo: async () => {
    return axios.get<UserInfoResponse>("/api/user/me");
  },

  getUsers: async (
    name?: string,
    gender?: "MALE" | "FEMALE",
    floor?: string
  ) => {
    const params = new URLSearchParams();
    if (name) params.append("name", name);
    if (gender) params.append("gender", gender);
    if (floor) params.append("floor", floor);

    const queryString = params.toString();
    const endpoint = `/api/user/admin/user/info${
      queryString ? `?${queryString}` : ""
    }`;

    return axios.get<AdminUserInfo[]>(endpoint);
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
  gender: "MALE" | "FEMALE";
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
