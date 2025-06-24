const BASE_URL = "https://washer-server.zzunipark.com"

// API 응답 타입 정의 - 로그인 응답 구조 업데이트
export interface AuthResponse {
  success: boolean
  data: {
    accessToken: string
    accessTokenExpiredAt: string
    refreshToken: string
    refreshTokenExpiredAt: string
    role: "ROLE_USER" | "ROLE_ADMIN"
  }
  message: string
  timestamp: string
}

export interface ApiError {
  message: string
  status: number
}

// 세탁기 작업 상태 타입 정의
export type WasherJobState =
  | "airWash"
  | "aIRinse"
  | "aISpin"
  | "aIWash"
  | "cooling"
  | "delayWash"
  | "drying"
  | "finish"
  | "none"
  | "preWash"
  | "rinse"
  | "spin"
  | "wash"
  | "weightSensing"
  | "wrinklePrevent"
  | "freezeProtection"

// 건조기 작업 상태 타입 정의
export type DryerJobState =
  | "cooling"
  | "delayWash"
  | "drying"
  | "finished"
  | "none"
  | "refreshing"
  | "weightSensing"
  | "wrinklePrevent"
  | "dehumidifying"
  | "aIDrying"
  | "sanitizing"
  | "internalCare"
  | "freezeProtection"
  | "continuousDehumidifying"
  | "thawingFrozenInside"

// 기기 상태 타입 정의
export type MachineState = "pause" | "run" | "stop"

// Machine API 타입 정의 - 예약 ID 필드 추가
export interface MachineReservation {
  startTime: string
  room: string
  status: "waiting" | "reserved" | "confirmed" | "running"
}

export interface MachineDevice {
  id: number
  label: string
  floor: string
  powerState: "on" | "off"
  machineState: MachineState
  jobState: WasherJobState | DryerJobState // washerJobState, dryerJobState 대신 jobState 사용
  remainingTime: string // "00:00:00" 형식
  isOutOfOrder: boolean
  reservations: MachineReservation[]
}

export interface DevicesResponse {
  success: boolean
  data: {
    washer: MachineDevice[]
    dryer: MachineDevice[]
  }
  message: string
  timestamp: string
}

export interface ReportResponse {
  success: boolean
  message: string
  timestamp: string
}

export interface Report {
  reportId: number
  machineName: string
  reportedByUserName: string
  reportedByUserNumber: string
  description: string
  status: "pending" | "in_progress" | "resolved"
  resolvedAt: string | null
}

export interface ReportsResponse {
  success: boolean
  data: Report[]
  message: string
  timestamp: string
}

// 고장 기기 타입 정의 - 새로운 명세에 맞게 수정
export interface OutOfOrderDevice {
  name: string
  type: "washer" | "dryer"
  floor: string // "_4F", "_5F" 형식
  outOfOrder: boolean
}

export interface OutOfOrderResponse {
  success: boolean
  data: OutOfOrderDevice[]
  message: string
  timestamp: string
}

// Reservation API 타입 정의
export interface ReservationResponse {
  success: boolean
  message: string
  timestamp: string
}

export interface AdminReservationInfo {
  reservationId: number
  machineLabel: string
  status: "waiting" | "reserved" | "confirmed" | "running"
  startTime: string
  remainingSeconds: number
}

export interface AdminReservationsResponse {
  success: boolean
  data: AdminReservationInfo[]
  message: string
  timestamp: string
}

// User API 타입 정의 - restrictedUntil과 restrictionReason 추가
export interface UserInfo {
  id: string
  name: string
  schoolNumber?: string
  roomNumber: string
  gender: "male" | "female"
  restrictedUntil: string | null
  restrictionReason: string | null
  reservationId?: number
  machineLabel?: string
  status?: "waiting" | "reserved" | "confirmed" | "running"
  startTime?: string
  remainingSeconds?: number
  remainingTime?: string // 새로 추가
}

export interface UserInfoResponse {
  success: boolean
  data: UserInfo
  message: string
  timestamp: string
}

export interface AdminUserInfo {
  id: number
  name: string
  schoolNumber: string
  gender: "male" | "female"
  roomName: string
  restrictedUntil: string | null
  restrictionReason: string | null
}

export interface AdminUsersResponse {
  success: boolean
  data: AdminUserInfo[]
  message: string
  timestamp: string
}

export interface RestrictResponse {
  success: boolean
  message: string
  timestamp: string
}

// 기기 작업 상태 표시 정보
export interface JobStateInfo {
  text: string
  color: string
  icon: string
  description: string
}

// 세탁기 작업 상태 매핑 함수
export function getWasherJobStateInfo(state: WasherJobState | undefined): JobStateInfo {
  const stateMap: Record<WasherJobState, JobStateInfo> = {
    none: {
      text: "대기 중",
      color: "bg-gray-50 text-gray-700 border-gray-200",
      icon: "⏸️",
      description: "현재 작업 상태가 없습니다",
    },
    airWash: {
      text: "에어워시 중",
      color: "bg-sky-50 text-sky-700 border-sky-200",
      icon: "💨",
      description: "에어워시 모드로 작동 중입니다",
    },
    aIRinse: {
      text: "AI 헹굼 중",
      color: "bg-violet-50 text-violet-700 border-violet-200",
      icon: "🤖",
      description: "AI 헹굼 모드로 작동 중입니다",
    },
    aISpin: {
      text: "AI 탈수 중",
      color: "bg-violet-50 text-violet-700 border-violet-200",
      icon: "🤖",
      description: "AI 탈수 모드로 작동 중입니다",
    },
    aIWash: {
      text: "AI 세탁 중",
      color: "bg-violet-50 text-violet-700 border-violet-200",
      icon: "🤖",
      description: "AI 세탁 모드로 작동 중입니다",
    },
    cooling: {
      text: "냉각 중",
      color: "bg-sky-50 text-sky-700 border-sky-200",
      icon: "❄️",
      description: "세탁 완료 후 냉각하고 있습니다",
    },
    delayWash: {
      text: "예약 대기",
      color: "bg-orange-50 text-orange-700 border-orange-200",
      icon: "⏰",
      description: "예약된 시간을 기다리고 있습니다",
    },
    drying: {
      text: "건조 중",
      color: "bg-red-50 text-red-700 border-red-200",
      icon: "🔥",
      description: "건조 작업을 진행하고 있습니다",
    },
    finish: {
      text: "완료",
      color: "bg-green-50 text-green-700 border-green-200",
      icon: "✅",
      description: "세탁이 완료되었습니다",
    },
    preWash: {
      text: "예비세탁 중",
      color: "bg-cyan-50 text-cyan-700 border-cyan-200",
      icon: "🫧",
      description: "예비세탁을 진행하고 있습니다",
    },
    rinse: {
      text: "헹굼 중",
      color: "bg-teal-50 text-teal-700 border-teal-200",
      icon: "💧",
      description: "헹굼 작업을 진행하고 있습니다",
    },
    spin: {
      text: "탈수 중",
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
      icon: "🌀",
      description: "탈수 작업을 진행하고 있습니다",
    },
    wash: {
      text: "세탁 중",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      icon: "🌊",
      description: "세탁 작업을 진행하고 있습니다",
    },
    weightSensing: {
      text: "무게 감지 중",
      color: "bg-purple-50 text-purple-700 border-purple-200",
      icon: "⚖️",
      description: "세탁물의 무게를 감지하고 있습니다",
    },
    wrinklePrevent: {
      text: "구김 방지 중",
      color: "bg-pink-50 text-pink-700 border-pink-200",
      icon: "👔",
      description: "구김 방지 모드가 작동 중입니다",
    },
    freezeProtection: {
      text: "동결 방지 중",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      icon: "🧊",
      description: "동결 방지 모드가 작동 중입니다",
    },
  }

  return stateMap[state || "none"] || stateMap.none
}

// 건조기 작업 상태 매핑 함수
export function getDryerJobStateInfo(state: DryerJobState | undefined): JobStateInfo {
  const stateMap: Record<DryerJobState, JobStateInfo> = {
    none: {
      text: "대기 중",
      color: "bg-gray-50 text-gray-700 border-gray-200",
      icon: "⏸️",
      description: "현재 작업 상태가 없습니다",
    },
    cooling: {
      text: "냉각 중",
      color: "bg-sky-50 text-sky-700 border-sky-200",
      icon: "❄️",
      description: "건조 완료 후 냉각하고 있습니다",
    },
    delayWash: {
      text: "예약 대기",
      color: "bg-orange-50 text-orange-700 border-orange-200",
      icon: "⏰",
      description: "예약된 시간을 기다리고 있습니다",
    },
    drying: {
      text: "건조 중",
      color: "bg-red-50 text-red-700 border-red-200",
      icon: "🔥",
      description: "건조 작업을 진행하고 있습니다",
    },
    finished: {
      text: "완료",
      color: "bg-green-50 text-green-700 border-green-200",
      icon: "✅",
      description: "건조가 완료되었습니다",
    },
    refreshing: {
      text: "리프레쉬 중",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: "🌿",
      description: "탈취 또는 리프레쉬 작업 중입니다",
    },
    weightSensing: {
      text: "무게 감지 중",
      color: "bg-purple-50 text-purple-700 border-purple-200",
      icon: "⚖️",
      description: "세탁물의 무게를 감지하고 있습니다",
    },
    wrinklePrevent: {
      text: "구김 방지 중",
      color: "bg-pink-50 text-pink-700 border-pink-200",
      icon: "👔",
      description: "구김 방지 모드가 작동 중입니다",
    },
    dehumidifying: {
      text: "제습 중",
      color: "bg-amber-50 text-amber-700 border-amber-200",
      icon: "💨",
      description: "제습 모드가 작동 중입니다",
    },
    aIDrying: {
      text: "AI 건조 중",
      color: "bg-violet-50 text-violet-700 border-violet-200",
      icon: "🤖",
      description: "AI 건조 기능이 작동 중입니다",
    },
    sanitizing: {
      text: "살균 중",
      color: "bg-lime-50 text-lime-700 border-lime-200",
      icon: "🦠",
      description: "살균 모드가 작동 중입니다",
    },
    internalCare: {
      text: "내부 관리 중",
      color: "bg-slate-50 text-slate-700 border-slate-200",
      icon: "🔧",
      description: "내부 관리(통세척 등) 작업 중입니다",
    },
    freezeProtection: {
      text: "동결 방지 중",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      icon: "🧊",
      description: "동결 방지 모드가 작동 중입니다",
    },
    continuousDehumidifying: {
      text: "지속 제습 중",
      color: "bg-amber-50 text-amber-700 border-amber-200",
      icon: "💨",
      description: "지속 제습 모드가 작동 중입니다",
    },
    thawingFrozenInside: {
      text: "해동 중",
      color: "bg-orange-50 text-orange-700 border-orange-200",
      icon: "🔥",
      description: "내부 결빙을 해동하고 있습니다",
    },
  }

  return stateMap[state || "none"] || stateMap.none
}

// 기기 타입에 따른 작업 상태 정보 가져오기
export function getMachineJobStateInfo(machine: MachineDevice, machineType: "washer" | "dryer"): JobStateInfo {
  if (machineType === "washer") {
    return getWasherJobStateInfo(machine.jobState as WasherJobState)
  } else {
    return getDryerJobStateInfo(machine.jobState as DryerJobState)
  }
}

// 남은 시간 계산 함수 - "HH:MM:SS" 형식을 초로 변환
export function parseTimeStringToSeconds(timeString: string): number {
  try {
    if (!timeString || timeString === "00:00:00") {
      return 0
    }

    const parts = timeString.split(":")
    if (parts.length !== 3) {
      return 0
    }

    const hours = Number.parseInt(parts[0]) || 0
    const minutes = Number.parseInt(parts[1]) || 0
    const seconds = Number.parseInt(parts[2]) || 0

    return hours * 3600 + minutes * 60 + seconds
  } catch (error) {
    console.error("❌ Failed to parse time string:", error)
    return 0
  }
}

// 안전한 토큰 로깅 헬퍼 함수
const safeTokenLog = (token: string | null | undefined, prefix = ""): string => {
  if (!token || token === "null" || token === "undefined") {
    return "null"
  }
  return `${prefix}${token.substring(0, 20)}...`
}

// 간단한 토큰 관리
export const tokenManager = {
  getToken: () => {
    if (typeof window === "undefined") return null
    const token = localStorage.getItem("authToken")
    console.log(`🔑 Getting token: ${safeTokenLog(token)}`)
    return token
  },

  setToken: (token: string) => {
    if (typeof window === "undefined") return
    console.log(`💾 Storing token: ${safeTokenLog(token)}`)
    localStorage.setItem("authToken", token)
  },

  clearToken: () => {
    if (typeof window === "undefined") return
    console.log(`🗑️ Clearing token`)
    localStorage.removeItem("authToken")
  },

  hasToken: () => {
    const token = tokenManager.getToken()
    return token && token !== "null" && token !== "undefined"
  },
}

// API 요청 헬퍼
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  }

  if (!endpoint.includes("/auth/")) {
    const token = tokenManager.getToken()
    if (token && token !== "null") {
      defaultHeaders.Authorization = `Bearer ${token}`
      console.log(`🔑 Using Bearer token: Bearer ${safeTokenLog(token)}`)
    } else {
      console.log(`⚠️ No valid token available for ${endpoint}`)
      if (typeof window !== "undefined") {
        window.location.href = "/login"
        return Promise.reject(new Error("No access token"))
      }
    }
  }

  const config: RequestInit = {
    method: "GET",
    mode: "cors",
    credentials: "omit",
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  console.log(`🚀 API Request: ${config.method} ${url}`, {
    headers: config.headers,
    body: config.body,
  })

  try {
    const response = await fetch(url, config)

    console.log(`📡 API Response: ${response.status} ${response.statusText}`, {
      url,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    })

    if (response.status === 401 && !endpoint.includes("/auth/")) {
      console.log("❌ Unauthorized, clearing token and redirecting to login")
      tokenManager.clearToken()
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
      throw new Error("Authentication failed")
    }

    if (!response.ok) {
      let errorText = ""
      let errorData: any = {}

      try {
        errorText = await response.text()
        console.error(`❌ API Error Response: ${response.status}`, errorText)
      } catch (readError) {
        console.error("❌ Failed to read error response:", readError)
        errorText = `HTTP ${response.status} ${response.statusText}`
      }

      // JSON 파싱 시도
      try {
        if (errorText.trim()) {
          errorData = JSON.parse(errorText)
          console.log("📋 Parsed error data:", errorData)
        }
      } catch (parseError) {
        console.log("⚠️ Error response is not JSON:", errorText)
        errorData = { message: errorText }
      }

      // 오류 메시지 결정
      let errorMessage = ""

      if (errorData.message) {
        errorMessage = errorData.message
      } else if (errorData.error?.message) {
        errorMessage = errorData.error.message
      } else if (errorText && errorText.trim()) {
        errorMessage = errorText
      } else {
        errorMessage = `HTTP error! status: ${response.status}`
      }

      console.log(`🚨 Final error message: "${errorMessage}"`)

      const apiError = {
        message: errorMessage,
        status: response.status,
        originalResponse: errorText,
      } as ApiError

      throw apiError
    }

    if (response.status === 204) {
      return {} as T
    }

    const responseText = await response.text()
    console.log(`📄 Raw response text:`, responseText)

    if (!responseText.trim()) {
      console.log(`⚠️ Empty response received`)
      return {} as T
    }

    try {
      const responseData = JSON.parse(responseText)
      console.log(`✅ Parsed JSON response:`, responseData)
      return responseData
    } catch (parseError) {
      console.error(`❌ JSON parse error:`, parseError)
      console.log(`📄 Response was not valid JSON:`, responseText)
      throw new Error(`서버에서 올바르지 않은 형식의 응답을 받았습니다: ${responseText}`)
    }
  } catch (error) {
    console.error(`💥 API Error:`, error)

    // 이미 ApiError 객체인 경우 그대로 throw
    if (error && typeof error === "object" && "status" in error && "message" in error) {
      throw error
    }

    // Error 객체인 경우 그대로 throw
    if (error instanceof Error) {
      throw error
    }

    // 그 외의 경우만 네트워크 오류로 처리
    throw new Error("Network error occurred")
  }
}

// Auth API 함수들
export const authApi = {
  signup: async (data: {
    email: string
    password: string
    name: string
    schoolNumber: string
    gender: string
    room: string
  }) => {
    return apiRequest<void>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  sendSignupVerification: async (email: string) => {
    return apiRequest<void>("/auth/signup/mailsend", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  },

  verifySignupEmail: async (email: string, code: string) => {
    return apiRequest<void>("/auth/signup/emailverify", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    })
  },

  signin: async (email: string, password: string) => {
    console.log(`🔐 Attempting login for: ${email}`)

    try {
      const response = await apiRequest<AuthResponse>("/auth/signin", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })

      console.log(`📋 Login response received:`, response)

      // 새로운 응답 구조에 맞게 처리
      if (response && response.success && response.data) {
        const { accessToken, role } = response.data

        if (accessToken) {
          console.log(`✅ Found accessToken in response.data`)
          tokenManager.setToken(accessToken)

          // 역할 정보 암호화하여 저장
          if (role === "ROLE_USER" || role === "ROLE_ADMIN") {
            const { roleManager } = await import("./auth-utils")
            roleManager.setRole(role)
            console.log(`🔐 Role stored securely: ${role}`)
          }

          // 토큰 저장 확인
          setTimeout(() => {
            const storedToken = tokenManager.getToken()
            console.log(`🔍 Token verification after storage: ${safeTokenLog(storedToken)}`)
          }, 100)

          return response
        }
      }

      // 기존 호환성을 위한 처리 (문자열 응답)
      if (typeof response === "string") {
        console.log(`⚠️ Received string response:`, response)

        if (response.includes("성공") || response.includes("success")) {
          console.log(`🔧 Creating temporary token for development`)
          const tempToken = `temp_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          tokenManager.setToken(tempToken)

          // 기본 역할 설정 (개발용)
          const { roleManager } = await import("./auth-utils")
          roleManager.setRole("ROLE_USER")

          setTimeout(() => {
            const storedToken = tokenManager.getToken()
            console.log(`🔍 Token verification after storage: ${safeTokenLog(storedToken)}`)
          }, 100)

          return { success: true, token: tempToken }
        } else {
          throw new Error(`로그인 실패: ${response}`)
        }
      }

      console.error("❌ No token found in response:", response)
      throw new Error("서버에서 토큰 정보를 받지 못했습니다.")
    } catch (error) {
      console.error("❌ Login API error:", error)
      throw error
    }
  },

  sendPasswordChangeVerification: async (email: string) => {
    return apiRequest<void>("/auth/pwchange/mailsend", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  },

  changePassword: async (email: string, password: string, code: string) => {
    return apiRequest<void>("/auth/pwchange", {
      method: "POST",
      body: JSON.stringify({ email, password, code }),
    })
  },

  logout: async () => {
    tokenManager.clearToken()
    // 역할 정보도 삭제
    const { roleManager } = await import("./auth-utils")
    roleManager.clearRole()
  },
}

// Machine API 함수들
export const machineApi = {
  getDevices: async (type?: "washer" | "dryer", floor?: string) => {
    console.log(`🚀 getDevices called with params:`, { type, floor })

    const token = tokenManager.getToken()
    console.log(`🔍 Token check in getDevices:`, {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPreview: token ? `${token.substring(0, 10)}...` : "null",
      isValidToken: token && token !== "null" && token !== "undefined",
    })

    if (!token || token === "null" || token === "undefined") {
      console.error("❌ No valid token available for getDevices")
      throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.")
    }

    const params = new URLSearchParams()
    if (type) {
      params.append("type", type)
      console.log(`🔧 Added type parameter: ${type}`)
    }
    if (floor) {
      params.append("floor", floor)
      console.log(`🔧 Added floor parameter: ${floor}`)
    }

    const queryString = params.toString()
    const endpoint = `/machine/devices${queryString ? `?${queryString}` : ""}`

    console.log(`🚀 Final API call details:`, {
      endpoint,
      fullUrl: `${BASE_URL}${endpoint}`,
      method: "GET",
      hasAuthHeader: true,
      authHeaderPreview: `Bearer ${token.substring(0, 10)}...`,
    })

    try {
      const response = await apiRequest<DevicesResponse>(endpoint, {
        method: "GET",
      })

      console.log(`✅ getDevices response received:`, {
        success: response?.success,
        hasData: !!response?.data,
        dataKeys: response?.data ? Object.keys(response.data) : [],
        message: response?.message,
        timestamp: response?.timestamp,
      })

      return response
    } catch (error) {
      console.error(`❌ getDevices API error:`, error)
      throw error
    }
  },

  reportMachine: async (machineName: string, description: string) => {
    return apiRequest<ReportResponse>("/machine/report", {
      method: "POST",
      body: JSON.stringify({ machineName, description }),
    })
  },

  getReports: async () => {
    return apiRequest<ReportsResponse>("/machine/admin/reports", {
      method: "GET",
    })
  },

  updateReportStatus: async (reportId: number, status: "pending" | "in_progress" | "resolved") => {
    return apiRequest<ReportResponse>(`/machine/admin/reports/${reportId}?status=${status}`, {
      method: "PATCH",
    })
  },

  getOutOfOrderDevices: async (type?: "washer" | "dryer", floor?: string) => {
    console.log(`🚀 getOutOfOrderDevices called with params:`, { type, floor })

    const params = new URLSearchParams()
    if (type) {
      params.append("type", type)
      console.log(`🔧 Added type parameter: ${type}`)
    }
    if (floor) {
      // 층 정보를 "_4F", "_5F" 형식으로 변환
      const formattedFloor = floor.startsWith("_") ? floor : `_${floor}`
      params.append("floor", formattedFloor)
      console.log(`🔧 Added floor parameter: ${formattedFloor}`)
    }

    const queryString = params.toString()
    const endpoint = `/machine/admin/out-of-order${queryString ? `?${queryString}` : ""}`

    console.log(`🚀 Final out-of-order API call details:`, {
      endpoint,
      fullUrl: `${BASE_URL}${endpoint}`,
      method: "GET",
    })

    return apiRequest<OutOfOrderResponse>(endpoint, {
      method: "GET",
    })
  },

  updateOutOfOrderStatus: async (name: string, outOfOrder: boolean) => {
    console.log(`🔧 Updating out-of-order status:`, { name, outOfOrder })

    return apiRequest<ReportResponse>("/machine/admin/out-of-order", {
      method: "PATCH",
      body: JSON.stringify({ name, outOfOrder }),
    })
  },
}

// Reservation API 함수들
export const reservationApi = {
  createReservation: async (machineId: number) => {
    console.log(`📅 Creating reservation for machine: ${machineId}`)

    const token = tokenManager.getToken()
    console.log(`🔍 Token check for reservation:`, {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPreview: token ? `${token.substring(0, 10)}...` : "null",
      isValidToken: token && token !== "null" && token !== "undefined",
    })

    if (!token || token === "null" || token === "undefined") {
      console.error("❌ No valid token available for createReservation")
      throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.")
    }

    const endpoint = `/reservation/${machineId}`
    console.log(`🚀 Reservation API call details:`, {
      endpoint,
      fullUrl: `${BASE_URL}${endpoint}`,
      method: "POST",
      machineId,
      hasAuthHeader: true,
      authHeaderPreview: `Bearer ${token.substring(0, 10)}...`,
    })

    try {
      const response = await apiRequest<ReservationResponse>(endpoint, {
        method: "POST",
      })

      console.log(`✅ createReservation response:`, response)
      return response
    } catch (error) {
      console.error(`❌ createReservation API error:`, error)
      console.error(`❌ Error details:`, {
        message: error?.message,
        status: error?.status,
        endpoint,
        machineId,
      })
      throw error
    }
  },

  confirmReservation: async (reservationId: number) => {
    console.log(`✅ Confirming reservation: ${reservationId}`)
    return apiRequest<ReservationResponse>(`/reservation/${reservationId}/confirm`, {
      method: "POST",
    })
  },

  deleteReservation: async (reservationId: number) => {
    console.log(`🗑️ Deleting reservation: ${reservationId}`)
    return apiRequest<ReservationResponse>(`/reservation/${reservationId}`, {
      method: "DELETE",
    })
  },

  getAdminReservations: async (type?: "WASHER" | "DRYER", floor?: string) => {
    const params = new URLSearchParams()
    if (type) params.append("type", type)
    if (floor) params.append("floor", floor)

    const queryString = params.toString()
    const endpoint = `/reservation/admin/reservations${queryString ? `?${queryString}` : ""}`

    console.log(`🔍 Getting admin reservations with endpoint: ${endpoint}`)
    return apiRequest<AdminReservationsResponse>(endpoint, {
      method: "GET",
    })
  },

  forceDeleteReservation: async (reservationId: number) => {
    console.log(`🚫 Force deleting reservation: ${reservationId}`)
    return apiRequest<ReservationResponse>(`/reservation/admin/${reservationId}`, {
      method: "DELETE",
    })
  },
}

// User API 함수들
export const userApi = {
  getMyInfo: async () => {
    console.log(`🔍 Getting user info...`)
    return apiRequest<UserInfoResponse>("/user/me", {
      method: "GET",
    })
  },

  getUsers: async (name?: string, gender?: "male" | "female", floor?: string) => {
    const params = new URLSearchParams()
    if (name) params.append("name", name)
    if (gender) params.append("gender", gender)
    if (floor) params.append("floor", floor)

    const queryString = params.toString()
    const endpoint = `/user/admin/user/info${queryString ? `?${queryString}` : ""}`

    console.log(`🔍 Getting admin users with endpoint: ${endpoint}`)
    return apiRequest<AdminUsersResponse>(endpoint, {
      method: "GET",
    })
  },

  restrictUser: async (userId: number, restrictionData: { period: string; restrictionReason: string }) => {
    console.log(`🚫 Restricting user ${userId} with data:`, restrictionData)

    // 기간 형식을 서버가 기대하는 형식으로 변환
    const formattedData = {
      period: restrictionData.period,
      pestrictionReason: restrictionData.restrictionReason, // 명세서의 오타에 맞춤
    }

    console.log(`🔧 Formatted restriction data:`, formattedData)

    return apiRequest<RestrictResponse>(`/user/admin/${userId}/restrict`, {
      method: "POST",
      body: JSON.stringify(formattedData),
    })
  },

  unrestrictUser: async (userId: number) => {
    console.log(`✅ Unrestricting user ${userId}`)
    return apiRequest<RestrictResponse>(`/user/admin/${userId}/unrestrict`, {
      method: "POST",
    })
  },
}

export interface User {
  id: string
  name: string
  roomNumber: string
  gender: "male" | "female"
  isAdmin: boolean
  restrictedUntil: string | null
  restrictionReason: string | null
  studentId: string
}

function convertServerUserToClient(serverUser: UserInfo): User {
  console.log("🔄 Converting server user:", serverUser)

  return {
    id: serverUser.id,
    name: serverUser.name,
    roomNumber: serverUser.roomNumber,
    gender: serverUser.gender,
    isAdmin: false,
    restrictedUntil: serverUser.restrictedUntil,
    restrictionReason: serverUser.restrictionReason,
    studentId: serverUser.id,
  }
}
