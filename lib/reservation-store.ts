import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  machineApi,
  userApi,
  tokenManager,
  type MachineDevice,
  type MachineReservation,
  type UserInfo,
  type AdminUserInfo,
  type MachineOperatingState,
  type getMachineJobStateInfo,
  getWasherJobStateInfo,
  getDryerJobStateInfo,
  type WasherJobState,
  type DryerJobState,
  parseTimeStringToSeconds,
} from "./api-client"

export type FloorType = "3F" | "4F" | "5F"
export type MachineType = "washing" | "dryer"
export type MachineStatus = "available" | "in-use" | "reserved"
export type ReservationStatus =
  | "reserved"
  | "confirmed"
  | "running"
  | "collection"
  | "connecting"
  | "cancelled"
  | "completed"

// 서버 데이터를 클라이언트 형식으로 변환하는 함수들
function convertServerMachineToClient(serverMachine: MachineDevice, type: MachineType): Machine {
  // 안전한 null 체크
  if (!serverMachine) {
    console.error("❌ serverMachine is null or undefined")
    throw new Error("Invalid machine data")
  }

  // label에서 위치 정보 추출 (예: "Washer-4F-R1" -> "R1")
  const locationMatch = serverMachine.label?.match(/-([LR]\d+)$/)
  const location = locationMatch ? locationMatch[1] : "R1"

  // 기기 상태 결정
  let status: MachineStatus = "available"
  if (serverMachine.machineState === "run") {
    status = "in-use"
  } else if (
    serverMachine.reservations &&
    Array.isArray(serverMachine.reservations) &&
    serverMachine.reservations.length > 0
  ) {
    status = "reserved"
  }

  // 남은 시간 계산 - "HH:MM:SS" 형식을 초로 변환
  let nextAvailableSeconds: number | null = null
  if (serverMachine.remainingTime && serverMachine.remainingTime !== "00:00:00") {
    try {
      nextAvailableSeconds = parseTimeStringToSeconds(serverMachine.remainingTime)
      console.log(`⏰ Calculated remaining time for ${serverMachine.label}:`, {
        remainingTimeString: serverMachine.remainingTime,
        calculatedSeconds: nextAvailableSeconds,
      })
    } catch (error) {
      console.error(`❌ Failed to parse remaining time for ${serverMachine.label}:`, error)
    }
  }

  return {
    id: serverMachine.label || `unknown-${Date.now()}`,
    serverId: serverMachine.id || 0,
    type,
    floor: (serverMachine.floor as FloorType) || "3F",
    location,
    status,
    isOutOfOrder: serverMachine.isOutOfOrder || false,
    nextAvailableSeconds,
    operatingState: serverMachine.jobState,
    reservations: serverMachine.reservations || [], // 예약 정보 추가
  }
}

function convertServerReservationToClient(
  serverReservation: MachineReservation,
  machineId: string,
  type: MachineType,
): Reservation {
  // 안전한 null 체크
  if (!serverReservation) {
    console.error("❌ serverReservation is null or undefined")
    throw new Error("Invalid reservation data")
  }

  // 상태 매핑
  const statusMap: Record<string, ReservationStatus> = {
    waiting: "reserved",
    reserved: "reserved",
    confirmed: "confirmed",
    running: "running",
  }

  // 예약 시작 시간부터 경과 시간 계산
  let remainingSeconds = 0
  if (serverReservation.startTime) {
    try {
      const startTime = new Date(serverReservation.startTime)
      const now = new Date()
      const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000)

      // 일반적으로 세탁/건조 시간을 45분(2700초)로 가정
      const totalDuration = type === "washing" ? 2700 : 3600 // 세탁 45분, 건조 60분
      remainingSeconds = Math.max(0, totalDuration - elapsedSeconds)

      console.log(`⏰ Calculated reservation remaining time:`, {
        startTime: serverReservation.startTime,
        elapsedSeconds,
        remainingSeconds,
        type,
      })
    } catch (error) {
      console.error("❌ Failed to parse reservation start time:", error)
    }
  }

  return {
    id: Date.now() + Math.random(),
    userId: "unknown",
    machineId,
    type,
    status: statusMap[serverReservation.status] || "reserved",
    timeRemaining: remainingSeconds,
    startTime: serverReservation.startTime ? new Date(serverReservation.startTime).toLocaleTimeString() : "",
    roomNumber: serverReservation.room || "",
    message: "서버에서 가져온 예약",
  }
}

function convertServerUserToClient(serverUser: UserInfo, currentUserId: string): User {
  // 안전한 null 체크
  if (!serverUser) {
    console.error("❌ serverUser is null or undefined")
    throw new Error("Invalid user data")
  }

  return {
    id: currentUserId, // 현재 로그인한 사용자 ID 사용
    serverId: serverUser.id, // 서버 ID 별도 저장
    name: serverUser.name || "Unknown",
    roomNumber: serverUser.roomNumber || "000",
    gender: serverUser.gender || "male",
    isAdmin: false, // 서버에서 제공하지 않으므로 기본값
    restrictedUntil: serverUser.restrictedUntil,
    restrictionReason: serverUser.restrictionReason,
    studentId: serverUser.schoolNumber || serverUser.id, // schoolNumber가 있으면 사용, 없으면 id 사용
  }
}

function convertAdminUserToClient(serverUser: AdminUserInfo): User {
  // 안전한 null 체크
  if (!serverUser) {
    console.error("❌ serverUser is null or undefined")
    throw new Error("Invalid admin user data")
  }

  return {
    id: serverUser.id?.toString() || "unknown",
    serverId: serverUser.id?.toString() || "unknown",
    name: serverUser.name || "Unknown",
    roomNumber: serverUser.roomName || "000",
    gender: (serverUser.gender?.toLowerCase() as "male" | "female") || "male",
    isAdmin: false,
    restrictedUntil: null,
    restrictionReason: null,
    studentId: serverUser.schoolNumber || serverUser.id?.toString() || "unknown",
  }
}

export interface Machine {
  id: string
  serverId: number // 서버의 실제 ID
  type: MachineType
  floor: FloorType
  location: string
  status: MachineStatus
  isOutOfOrder: boolean
  nextAvailableSeconds: number | null
  operatingState?: MachineOperatingState // 새로운 필드 추가
  reservations?: MachineReservation[] // 예약 정보 추가
}

export interface Reservation {
  id: number
  serverId?: number // 서버에서 받은 실제 예약 ID
  userId: string
  machineId: string
  type: MachineType
  status: ReservationStatus
  timeRemaining: number
  startTime: string
  roomNumber: string
  message: string
}

export interface User {
  id: string
  serverId?: string // 서버에서 받은 실제 ID
  name: string
  roomNumber: string
  gender: "male" | "female"
  isAdmin?: boolean
  restrictedUntil?: string | null
  restrictionReason?: string | null
  studentId?: string // 학번 필드 추가
}

interface ReservationStore {
  machines: Machine[]
  reservations: Reservation[]
  users: User[]
  isLoading: boolean
  lastFetched: number | null
  currentUserInfo: User | null
  lastTimerUpdate?: number // 새로 추가

  // 서버에서 데이터 가져오기
  fetchMachines: () => Promise<void>
  fetchMyInfo: (currentUserId: string) => Promise<void>
  fetchUsers: (name?: string, gender?: "male" | "female", floor?: string) => Promise<void>

  // 기존 함수들...
  addReservation: (reservation: Omit<Reservation, "id">) => void
  updateReservation: (id: number, updates: Partial<Reservation>) => void
  cancelReservation: (id: number) => void
  completeCollection: (id: number) => void
  reconnectMachine: (id: number) => void
  updateMachine: (id: string, updates: Partial<Machine>) => void
  decrementTimers: () => void
  hasActiveReservation: (userId: string) => boolean
  hasActiveReservationByRoom: (roomNumber: string) => boolean
  getUser: (userId: string) => User | undefined
  getCurrentUser: () => User | null // 현재 사용자 정보 가져오기
  isUserRestricted: (userId: string) => boolean
  restrictUser: (userId: string, hours: number, reason: string) => void
  removeRestriction: (userId: string) => void
  checkAndRemoveExpiredRestrictions: () => void
  autoDeleteExpiredCollections: () => void
  getAccessibleFloors: (userId: string) => FloorType[]

  // 새로운 함수들
  getMachineOperatingStateInfo: (machineId: string) => ReturnType<typeof getMachineJobStateInfo>
  getMachineReservationInfo: (machineId: string) => {
    hasReservation: boolean
    reservationStatus: string | null
    remainingTime: number | null
    timeLabel: string
  }

  // 서버 API 함수들
  restrictUserOnServer: (userId: number, duration: string) => Promise<void>
  unrestrictUserOnServer: (userId: number) => Promise<void>
}

// 안전한 localStorage 접근을 위한 헬퍼
const createStorage = () => {
  if (typeof window === "undefined") {
    // SSR 환경에서는 더미 스토리지 반환
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    }
  }
  return {
    getItem: (name: string) => {
      try {
        return localStorage.getItem(name)
      } catch {
        return null
      }
    },
    setItem: (name: string, value: string) => {
      try {
        localStorage.setItem(name, value)
      } catch {
        // 저장 실패 시 무시
      }
    },
    removeItem: (name: string) => {
      try {
        localStorage.removeItem(name)
      } catch {
        // 삭제 실패 시 무시
      }
    },
  }
}

export const useReservationStore = create<ReservationStore>()(
  persist(
    (set, get) => ({
      machines: [],
      reservations: [],
      users: [
        // 기본 사용자들 (개발용)
        {
          id: "admin@gsm.hs.kr",
          name: "관리자",
          roomNumber: "000",
          gender: "male",
          isAdmin: true,
          studentId: "admin",
        },
        {
          id: "s23046@gsm.hs.kr",
          name: "박민준",
          roomNumber: "415",
          gender: "male",
          studentId: "s23046",
        },
        {
          id: "s23001@gsm.hs.kr",
          name: "김지영",
          roomNumber: "315",
          gender: "female",
          studentId: "s23001",
        },
      ],
      isLoading: false,
      lastFetched: null,
      currentUserInfo: null,
      lastTimerUpdate: undefined,

      // 서버에서 기기 데이터 가져오기 - 예약 데이터는 fetchMyInfo에서만 처리
      fetchMachines: async () => {
        console.log("🔄 Starting fetchMachines...")
        set({ isLoading: true })

        try {
          const token = tokenManager.getToken()
          console.log(`🔍 Token check before API call:`, {
            hasToken: !!token,
            tokenLength: token?.length || 0,
            tokenPreview: token ? `${token.substring(0, 10)}...` : "null",
          })

          if (!token || token === "null") {
            console.error("❌ No valid token available for fetchMachines")
            set({ isLoading: false })
            return
          }

          console.log("📡 Calling machineApi.getDevices()...")
          const response = await machineApi.getDevices()
          console.log("✅ Raw API response:", JSON.stringify(response, null, 2))

          if (!response?.success || !response.data) {
            console.error("❌ Invalid API response", response)
            set({ isLoading: false })
            return
          }

          const machines: Machine[] = []

          // 세탁기 데이터 변환 (예약 데이터는 제외)
          if (response.data.washer && Array.isArray(response.data.washer)) {
            console.log(`🔄 Processing ${response.data.washer.length} washers...`)
            response.data.washer.forEach((washer, index) => {
              console.log(`🔄 Converting washer ${index + 1}:`, washer)
              try {
                // null 체크 추가
                if (!washer) {
                  console.warn(`⚠️ Washer ${index + 1} is null, skipping...`)
                  return
                }
                const convertedMachine = convertServerMachineToClient(washer, "washing")
                console.log(`✅ Converted washer:`, convertedMachine)
                machines.push(convertedMachine)
              } catch (error) {
                console.error(`❌ Error converting washer ${index + 1}:`, error)
                console.error(`❌ Washer data:`, washer)
              }
            })
          }

          // 건조기 데이터 변환 (예약 데이터는 제외)
          if (response.data.dryer && Array.isArray(response.data.dryer)) {
            console.log(`🔄 Processing ${response.data.dryer.length} dryers...`)
            response.data.dryer.forEach((dryer, index) => {
              console.log(`🔄 Converting dryer ${index + 1}:`, dryer)
              try {
                // null 체크 추가
                if (!dryer) {
                  console.warn(`⚠️ Dryer ${index + 1} is null, skipping...`)
                  return
                }
                const convertedMachine = convertServerMachineToClient(dryer, "dryer")
                console.log(`✅ Converted dryer:`, convertedMachine)
                machines.push(convertedMachine)
              } catch (error) {
                console.error(`❌ Error converting dryer ${index + 1}:`, error)
                console.error(`❌ Dryer data:`, dryer)
              }
            })
          }

          console.log(`📊 Final processing results:`, {
            totalMachines: machines.length,
            washingMachines: machines.filter((m) => m.type === "washing").length,
            dryers: machines.filter((m) => m.type === "dryer").length,
          })

          // 기기 정보만 업데이트 (예약 정보는 건드리지 않음)
          set({
            machines,
            lastFetched: Date.now(),
            isLoading: false,
          })

          console.log(`✅ Successfully updated store with ${machines.length} machines`)
        } catch (error) {
          console.error("❌ Failed to fetch machines:", error)
          set({ isLoading: false })
        }
      },

      // 서버에서 내 정보 가져오기 - 예약 정보만 여기서 처리
      fetchMyInfo: async (currentUserId: string) => {
        console.log("🔄 Starting fetchMyInfo for userId:", currentUserId)

        // 토큰 검증 먼저 수행
        const token = tokenManager.getToken()
        console.log(`🔍 Token check before fetchMyInfo:`, {
          hasToken: !!token,
          tokenLength: token?.length || 0,
          tokenPreview: token ? `${token.substring(0, 10)}...` : "null",
          isValidToken: token && token !== "null" && token !== "undefined",
        })

        if (!token || token === "null" || token === "undefined") {
          console.log("⚠️ No valid token available for fetchMyInfo, skipping...")
          set({ isLoading: false })
          return
        }

        set({ isLoading: true })

        try {
          console.log("📡 Calling userApi.getMyInfo()...")
          const response = await userApi.getMyInfo()
          console.log("✅ Received user info from server:", response)

          if (response.success) {
            const userInfo = convertServerUserToClient(response.data, currentUserId)
            console.log("🔄 Converted user info:", userInfo)

            // 현재 사용자 정보 설정
            set({ currentUserInfo: userInfo, isLoading: false })

            // 사용자 목록에도 추가/업데이트
            set((state) => {
              const existingUserIndex = state.users.findIndex((user) => user.id === userInfo.id)

              if (existingUserIndex >= 0) {
                const updatedUsers = [...state.users]
                updatedUsers[existingUserIndex] = { ...updatedUsers[existingUserIndex], ...userInfo }
                console.log("✅ Updated existing user:", updatedUsers[existingUserIndex])
                return { users: updatedUsers }
              } else {
                console.log("✅ Added new user:", userInfo)
                return { users: [...state.users, userInfo] }
              }
            })

            // 사용자의 예약 정보가 있다면 설정 (기존 예약 완전 대체)
            if (response.data.reservationId && response.data.machineLabel) {
              const reservation: Reservation = {
                id: response.data.reservationId, // 서버에서 제공하는 실제 예약 ID 사용
                serverId: response.data.reservationId, // 서버 ID 저장
                userId: currentUserId,
                machineId: response.data.machineLabel,
                type: response.data.machineLabel.includes("Washer") ? "washing" : "dryer",
                status: (response.data.status as ReservationStatus) || "reserved",
                timeRemaining: response.data.remainingSeconds || 0,
                startTime: response.data.startTime ? new Date(response.data.startTime).toLocaleTimeString() : "",
                roomNumber: response.data.roomNumber,
                message: "내 예약",
              }

              console.log("✅ Setting user reservation:", reservation)

              // 예약 정보를 완전히 대체 (현재 사용자의 예약만)
              set((state) => {
                const otherReservations = state.reservations.filter((r) => r.userId !== currentUserId)
                return {
                  reservations: [...otherReservations, reservation],
                }
              })
            } else {
              // 예약이 없으면 현재 사용자의 예약 제거
              console.log("✅ No reservation found, removing user reservations")
              set((state) => ({
                reservations: state.reservations.filter((r) => r.userId !== currentUserId),
              }))
            }

            console.log(`✅ Successfully processed user info for ${userInfo.id}`)
          } else {
            console.error("❌ Server returned success: false")
            set({ isLoading: false })
          }
        } catch (error) {
          console.error("❌ Failed to fetch user info:", error)
          set({ isLoading: false })

          // 토큰 관련 오류인 경우 추가 처리
          if (error?.message?.includes("token") || error?.message?.includes("Authentication")) {
            console.log("🔄 Token-related error, clearing invalid token")
            tokenManager.clearToken()
          }
        }
      },

      // 서버에서 사용자 목록 가져오기 (관리자용)
      fetchUsers: async (name?: string, gender?: "male" | "female", floor?: string) => {
        console.log("🔄 Starting fetchUsers...")
        set({ isLoading: true })

        try {
          console.log("📡 Calling userApi.getUsers()...")
          const response = await userApi.getUsers(name, gender, floor)
          console.log("✅ Received users from server:", response)

          if (response.success) {
            const users = response.data
              .filter((user) => user != null) // null 사용자 필터링
              .map(convertAdminUserToClient)

            set({
              users,
              isLoading: false,
            })

            console.log(`✅ Updated ${users.length} users`)
          } else {
            console.error("❌ Server returned success: false")
            set({ isLoading: false })
          }
        } catch (error) {
          console.error("❌ Failed to fetch users:", error)
          set({ isLoading: false })
        }
      },

      // 기존 함수들...
      addReservation: (reservation) => {
        const newReservation = {
          ...reservation,
          id: Date.now(),
        }
        set((state) => ({
          reservations: [...state.reservations, newReservation],
        }))
      },

      updateReservation: (id, updates) => {
        set((state) => ({
          reservations: state.reservations.map((reservation) =>
            reservation.id === id ? { ...reservation, ...updates } : reservation,
          ),
        }))
      },

      cancelReservation: (id) => {
        set((state) => ({
          reservations: state.reservations.filter((reservation) => reservation.id !== id),
        }))
      },

      completeCollection: (id) => {
        set((state) => ({
          reservations: state.reservations.map((reservation) =>
            reservation.id === id ? { ...reservation, status: "completed" as ReservationStatus } : reservation,
          ),
        }))
      },

      reconnectMachine: (id) => {
        set((state) => ({
          reservations: state.reservations.map((reservation) =>
            reservation.id === id
              ? { ...reservation, status: "confirmed" as ReservationStatus, message: "재연결 시도 중..." }
              : reservation,
          ),
        }))
      },

      updateMachine: (id, updates) => {
        set((state) => ({
          machines: state.machines.map((machine) => (machine.id === id ? { ...machine, ...updates } : machine)),
        }))
      },

      decrementTimers: () => {
        const now = Date.now()

        set((state) => {
          // 마지막 업데이트 시간 확인 (중복 실행 방지)
          if (state.lastTimerUpdate && now - state.lastTimerUpdate < 900) {
            return state // 900ms 이내 중복 실행 방지
          }

          return {
            ...state,
            lastTimerUpdate: now,
            reservations: state.reservations.map((reservation) => ({
              ...reservation,
              timeRemaining: Math.max(0, reservation.timeRemaining - 1),
            })),
            machines: state.machines.map((machine) => ({
              ...machine,
              nextAvailableSeconds: machine.nextAvailableSeconds ? Math.max(0, machine.nextAvailableSeconds - 1) : null,
            })),
          }
        })
      },

      hasActiveReservation: (userId) => {
        const { reservations } = get()
        return reservations.some(
          (reservation) =>
            reservation.userId === userId &&
            (reservation.status === "reserved" ||
              reservation.status === "confirmed" ||
              reservation.status === "running" ||
              reservation.status === "connecting" ||
              reservation.status === "collection"),
        )
      },

      hasActiveReservationByRoom: (roomNumber) => {
        const { reservations } = get()
        return reservations.some(
          (reservation) =>
            reservation.roomNumber === roomNumber &&
            (reservation.status === "reserved" ||
              reservation.status === "confirmed" ||
              reservation.status === "running" ||
              reservation.status === "connecting" ||
              reservation.status === "collection"),
        )
      },

      getUser: (userId) => {
        const { users } = get()
        return users.find((user) => user.id === userId)
      },

      getCurrentUser: () => {
        return get().currentUserInfo
      },

      isUserRestricted: (userId) => {
        const user = get().getUser(userId)
        if (!user?.restrictedUntil) return false
        return new Date() < new Date(user.restrictedUntil)
      },

      restrictUser: (userId, hours, reason) => {
        const restrictedUntil = new Date()
        restrictedUntil.setHours(restrictedUntil.getHours() + hours)

        set((state) => ({
          users: state.users.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  restrictedUntil: restrictedUntil.toISOString(),
                  restrictionReason: reason,
                }
              : user,
          ),
        }))
      },

      removeRestriction: (userId) => {
        set((state) => ({
          users: state.users.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  restrictedUntil: null,
                  restrictionReason: null,
                }
              : user,
          ),
        }))
      },

      checkAndRemoveExpiredRestrictions: () => {
        const now = new Date()
        set((state) => ({
          users: state.users.map((user) => {
            if (user.restrictedUntil && new Date(user.restrictedUntil) <= now) {
              return {
                ...user,
                restrictedUntil: null,
                restrictionReason: null,
              }
            }
            return user
          }),
        }))
      },

      autoDeleteExpiredCollections: () => {
        set((state) => ({
          reservations: state.reservations.filter((reservation) => {
            if (reservation.status === "collection" && reservation.timeRemaining <= 0) {
              return false
            }
            return true
          }),
        }))
      },

      getAccessibleFloors: (userId) => {
        const user = get().getUser(userId)
        if (!user) return []

        // 관리자는 모든 층 접근 가능
        if (user.isAdmin) {
          return ["3F", "4F", "5F"]
        }

        const roomNumber = user.roomNumber
        const roomNum = Number.parseInt(roomNumber.replace(/[^0-9]/g, ""))

        // 3층 유저: 3층, 4층 접근 가능
        if (roomNum >= 300 && roomNum < 400) {
          return ["3F", "4F"]
        }
        // 4층 유저: 3층, 4층 접근 가능
        else if (roomNum >= 400 && roomNum < 500) {
          return ["3F", "4F"]
        }
        // 5층 유저: 5층만 접근 가능
        else if (roomNum >= 500 && roomNum < 600) {
          return ["5F"]
        }

        // 기본값: 모든 층 접근 가능
        return ["3F", "4F", "5F"]
      },

      // 새로운 함수: 기기 작동 상태 정보 가져오기
      getMachineOperatingStateInfo: (machineId: string) => {
        const { machines } = get()
        const machine = machines.find((m) => m.id === machineId)

        if (!machine) {
          return {
            text: "알 수 없음",
            color: "bg-gray-50 text-gray-700 border-gray-200",
            icon: "❓",
            description: "기기 정보를 찾을 수 없습니다",
          }
        }

        // 기기 타입에 따라 적절한 상태 정보 함수 호출
        if (machine.type === "washing") {
          return getWasherJobStateInfo(machine.operatingState as WasherJobState)
        } else {
          return getDryerJobStateInfo(machine.operatingState as DryerJobState)
        }
      },

      // 새로운 함수: 기기 예약 정보 가져오기
      getMachineReservationInfo: (machineId: string) => {
        const { machines } = get()
        const machine = machines.find((m) => m.id === machineId)

        if (!machine || !machine.reservations || machine.reservations.length === 0) {
          return {
            hasReservation: false,
            reservationStatus: null,
            remainingTime: null,
            timeLabel: "",
          }
        }

        // 가장 최근 예약 찾기
        const activeReservation = machine.reservations[0]
        let timeLabel = ""

        switch (activeReservation.status) {
          case "waiting":
          case "reserved":
            timeLabel = "예약 만료까지"
            break
          case "confirmed":
            timeLabel = "예약 확인까지"
            break
          case "running":
            timeLabel = "사용 완료까지"
            break
          default:
            timeLabel = "남은 시간"
        }

        return {
          hasReservation: true,
          reservationStatus: activeReservation.status,
          remainingTime: machine.nextAvailableSeconds,
          timeLabel,
        }
      },

      // 서버에서 사용자 정지
      restrictUserOnServer: async (userId: number, duration: string) => {
        try {
          console.log(`🚫 Restricting user ${userId} for ${duration}`)
          const response = await userApi.restrictUser(userId, duration)
          console.log("✅ User restriction response:", response)

          if (response.success) {
            // 로컬 상태도 업데이트
            const restrictedUntil = new Date()
            const hours = duration.includes("시간")
              ? Number.parseInt(duration)
              : duration.includes("일")
                ? Number.parseInt(duration) * 24
                : duration.includes("주일")
                  ? Number.parseInt(duration) * 24 * 7
                  : 1
            restrictedUntil.setHours(restrictedUntil.getHours() + hours)

            set((state) => ({
              users: state.users.map((user) =>
                user.serverId === userId.toString()
                  ? {
                      ...user,
                      restrictedUntil: restrictedUntil.toISOString(),
                      restrictionReason: `관리자에 의한 ${duration} 사용 제한`,
                    }
                  : user,
              ),
            }))
          }
        } catch (error) {
          console.error("❌ Failed to restrict user:", error)
          throw error
        }
      },

      // 서버에서 사용자 정지 해제
      unrestrictUserOnServer: async (userId: number) => {
        try {
          console.log(`✅ Unrestricting user ${userId}`)
          const response = await userApi.unrestrictUser(userId)
          console.log("✅ User unrestriction response:", response)

          if (response.success) {
            // 로컬 상태도 업데이트
            set((state) => ({
              users: state.users.map((user) =>
                user.serverId === userId.toString()
                  ? {
                      ...user,
                      restrictedUntil: null,
                      restrictionReason: null,
                    }
                  : user,
              ),
            }))
          }
        } catch (error) {
          console.error("❌ Failed to unrestrict user:", error)
          throw error
        }
      },
    }),
    {
      name: "reservation-storage",
      storage: createStorage(),
      partialize: (state) => ({
        users: state.users,
        currentUserInfo: state.currentUserInfo,
        // machines와 reservations는 서버에서 가져오므로 저장하지 않음
      }),
    },
  ),
)

// Make sure the store is properly exported

// And also add a default export:
export default useReservationStore
