import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  machineApi,
  userApi,
  type MachineDevice,
  type MachineReservation,
  type AdminUserInfo,
  type getMachineJobStateInfo,
  getWasherJobStateInfo,
  getDryerJobStateInfo,
  type WasherJobState,
  type DryerJobState,
  parseTimeStringToSeconds,
} from './api-client';
import { MachineOperatingState } from './machine-status';
import { RoleDecryption } from './role-decryption';

export type FloorType = 3 | 4 | 5;
export type MachineType = 'washing' | 'dryer';
export type MachineStatus = 'AVAILABLE' | 'IN-USE' | 'RESERVED';
export type ReservationStatus =
  | 'RESERVED'
  | 'CONFIRMED'
  | 'RUNNING'
  | 'COLLECTION'
  | 'CONNECTING'
  | 'CANCELLED'
  | 'COMPLETED';

// 서버 데이터를 클라이언트 형식으로 변환하는 함수들
function convertServerMachineToClient(
  serverMachine: MachineDevice,
  type: MachineType
): Machine {
  // 안전한 null 체크
  if (!serverMachine) {
    console.error('❌ serverMachine is null or undefined');
    throw new Error('Invalid machine data');
  }

  // label에서 위치 정보 추출 (예: "Washer-4F-R1" -> "R1")
  const locationMatch = serverMachine.label?.match(/-([LR]\d+)$/);
  const location = locationMatch ? locationMatch[1] : 'R1';

  // 기기 상태 결정 - reservations 배열을 활용하여 더 정확한 상태 판단
  let status: MachineStatus = 'AVAILABLE';

  // 예약 정보가 있는지 확인
  if (
    serverMachine.reservations &&
    Array.isArray(serverMachine.reservations) &&
    serverMachine.reservations.length > 0
  ) {
    const activeReservation = serverMachine.reservations.find(
      (r) =>
        r.status === 'WAITING' ||
        r.status === 'RESERVED' ||
        r.status === 'CONFIRMED' ||
        r.status === 'RUNNING'
    );

    if (activeReservation) {
      if (activeReservation.status === 'RUNNING') {
        status = 'IN-USE';
      } else {
        status = 'RESERVED';
      }
    }
  } else if (serverMachine.machineState === 'RUN') {
    // 예약 정보가 없지만 기기가 작동 중인 경우
    status = 'IN-USE';
  }

  // 남은 시간 계산 - "HH:MM:SS" 형식을 초로 변환
  let nextAvailableSeconds: number | null = null;
  if (
    serverMachine.remainingTime &&
    serverMachine.remainingTime !== '00:00:00'
  ) {
    try {
      nextAvailableSeconds = parseTimeStringToSeconds(
        serverMachine.remainingTime
      );
    } catch (error) {
      console.error(
        `❌ Failed to parse remaining time for ${serverMachine.label}:`,
        error
      );
    }
  }

  return {
    id: serverMachine.label || `unknown-${Date.now()}`,
    serverId: serverMachine.id || 0,
    type,
    floor: (serverMachine.floor as FloorType) || 3,
    location,
    status,
    isOutOfOrder: serverMachine.isOutOfOrder || false,
    nextAvailableSeconds,
    operatingState: serverMachine.jobState as MachineOperatingState,
    reservations: serverMachine.reservations || [], // 예약 정보 유지
  };
}

function convertServerReservationToClient(
  serverReservation: MachineReservation,
  machineId: string,
  type: MachineType
): Reservation {
  // 안전한 null 체크
  if (!serverReservation) {
    console.error('❌ serverReservation is null or undefined');
    throw new Error('Invalid reservation data');
  }

  // 상태 매핑
  const statusMap: Record<string, ReservationStatus> = {
    WAITING: 'RESERVED',
    RESERVED: 'RESERVED',
    CONFIRMED: 'CONFIRMED',
    RUNNING: 'RUNNING',
  };

  // 예약 시작 시간부터 경과 시간 계산
  let remainingSeconds = 0;
  if (serverReservation.startTime) {
    try {
      const startTime = new Date(serverReservation.startTime);
      const now = new Date();
      const elapsedSeconds = Math.floor(
        (now.getTime() - startTime.getTime()) / 1000
      );

      // 일반적으로 세탁/건조 시간을 45분(2700초)로 가정
      const totalDuration = type === 'washing' ? 2700 : 3600; // 세탁 45분, 건조 60분
      remainingSeconds = Math.max(0, totalDuration - elapsedSeconds);
    } catch (error) {
      console.error('❌ Failed to parse reservation start time:', error);
    }
  }

  return {
    id: Date.now() + Math.random(),
    machineId,
    type,
    status: statusMap[serverReservation.status] || 'RESERVED',
    timeRemaining: remainingSeconds,
    startTime: serverReservation.startTime
      ? new Date(serverReservation.startTime).toLocaleTimeString()
      : '',
    roomNumber: serverReservation.room || '',
    message: '서버에서 가져온 예약',
  };
}

function convertAdminUserToClient(serverUser: AdminUserInfo): User {
  // 안전한 null 체크
  if (!serverUser) {
    console.error('❌ serverUser is null or undefined');
    throw new Error('Invalid admin user data');
  }

  return {
    id: serverUser.id?.toString() || 'unknown',
    serverId: serverUser.id?.toString() || 'unknown',
    name: serverUser.name || 'Unknown',
    roomNumber: serverUser.roomName || '000',
    gender: (serverUser.gender?.toLowerCase() as 'MALE' | 'FEMALE') || 'MALE',
    isAdmin: false,
    restrictedUntil: null,
    restrictionReason: null,
    schoolNumber: serverUser.schoolNumber || 'unknown',
  };
}

export interface Machine {
  id: string;
  serverId: number; // 서버의 실제 ID
  type: MachineType;
  floor: FloorType;
  location: string;
  status: MachineStatus;
  isOutOfOrder: boolean;
  nextAvailableSeconds: number | null;
  operatingState?: MachineOperatingState; // 새로운 필드 추가
  reservations?: MachineReservation[]; // 예약 정보 추가
}

export interface Reservation {
  id: number;
  serverId?: number; // 서버에서 받은 실제 예약 ID
  machineId: string;
  type: MachineType;
  status: ReservationStatus;
  timeRemaining: number;
  startTime: string;
  roomNumber: string;
  message: string;
}

export interface User {
  id: string;
  serverId?: string; // 서버에서 받은 실제 ID
  name: string;
  roomNumber: string;
  gender: 'MALE' | 'FEMALE';
  isAdmin?: boolean;
  restrictedUntil?: string | null;
  restrictionReason?: string | null;
  schoolNumber?: string;
  reservationId?: number;
  machineLabel?: string;
  status?: 'WAITING' | 'RESERVED' | 'CONFIRMED' | 'RUNNING' | 'CANCELLED' | 'COMPLETED';
  startTime?: string;
  remainingSeconds?: number;
  remainingTime?: string; // 새로 추가
}

interface ReservationStore {
  machines: Machine[];
  reservations: Reservation[];
  users: User[];
  isLoading: boolean;
  lastFetched: number | null;
  currentUserInfo: User | null;
  lastTimerUpdate?: number; // 새로 추가

  // 서버에서 데이터 가져오기
  fetchMachines: () => Promise<void>;
  fetchMyInfo: () => Promise<void>;
  fetchUsers: (
    name?: string,
    gender?: 'MALE' | 'FEMALE',
    floor?: string
  ) => Promise<void>;

  // 기존 함수들...
  addReservation: (reservation: Omit<Reservation, 'id'>) => void;
  updateReservation: (id: number, updates: Partial<Reservation>) => void;
  cancelReservation: (id: number) => void;
  completeCollection: (id: number) => void;
  reconnectMachine: (id: number) => void;
  updateMachine: (id: string, updates: Partial<Machine>) => void;
  decrementTimers: () => void;
  hasActiveReservation: (userId: string) => boolean;
  hasActiveReservationByRoom: (roomNumber: string) => boolean;
  getUser: (userId: string) => User | undefined;
  getCurrentUser: () => User | null; // 현재 사용자 정보 가져오기
  isUserRestricted: (userId: string) => boolean;
  restrictUser: (userId: string, hours: number, reason: string) => void;
  removeRestriction: (userId: string) => void;
  checkAndRemoveExpiredRestrictions: () => void;
  autoDeleteExpiredCollections: () => void;
  getAccessibleFloors: (roomNumber: string) => FloorType[];

  // 새로운 함수들
  getMachineOperatingStateInfo: (
    machineId: string
  ) => ReturnType<typeof getMachineJobStateInfo>;
  getMachineReservationInfo: (machineId: string) => {
    hasReservation: boolean;
    reservationStatus: string | null;
    remainingTime: number | null;
    timeLabel: string;
  };

  // 서버 API 함수들
  restrictUserOnServer: (userId: number, duration: string) => Promise<void>;
  unrestrictUserOnServer: (userId: number) => Promise<void>;

  // 기기별 예약 가능 여부 확인 (호실 정보 고려)
  canReserveMachine: (
    machineId: string,
    userRoomNumber: string
  ) => {
    canReserve: boolean;
    reason: string;
  };

  // 기기의 예약 호실 정보 가져오기 (서버 데이터 활용)
  getMachineReservationRoom: (machineId: string) => string | null;

  // 기기의 예약 상태 정보 가져오기 (서버 데이터 활용)
  getMachineReservationStatus: (machineId: string) => string | null;
}

// 안전한 localStorage 접근을 위한 헬퍼
const createStorage = () => {
  if (typeof window === 'undefined') {
    // SSR 환경에서는 더미 스토리지 반환
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return {
    getItem: (name: string) => {
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    },
    setItem: (name: string, value: string) => {
      try {
        localStorage.setItem(name, value);
      } catch {
        // 저장 실패 시 무시
      }
    },
    removeItem: (name: string) => {
      try {
        localStorage.removeItem(name);
      } catch {
        // 삭제 실패 시 무시
      }
    },
  };
};

export const useReservationStore = create<ReservationStore>()(
  persist(
    (set, get) => ({
      machines: [],
      reservations: [],
      users: [
        // 기본 사용자들 (개발용)
        {
          id: 'admin@gsm.hs.kr',
          name: '관리자',
          roomNumber: '000',
          gender: 'MALE',
          isAdmin: true,
          studentId: 'admin',
        },
        {
          id: 's23046@gsm.hs.kr',
          name: '박민준',
          roomNumber: '415',
          gender: 'MALE',
          studentId: 's23046',
        },
        {
          id: 's23001@gsm.hs.kr',
          name: '김지영',
          roomNumber: '315',
          gender: 'FEMALE',
          studentId: 's23001',
        },
      ],
      isLoading: false,
      lastFetched: null,
      currentUserInfo: null,
      lastTimerUpdate: undefined,

      // 서버에서 기기 데이터 가져오기 - 예약 데이터는 fetchMyInfo에서만 처리
      fetchMachines: async () => {
        set({ isLoading: true });

        try {
          const response = await machineApi.getDevices();

          if (!response.data) {
            console.error('❌ Invalid API response', response);
            set({ isLoading: false });
            return;
          }

          const machines: Machine[] = [];

          // 세탁기 데이터 변환 (예약 데이터는 제외)
          if (response.data.washer && Array.isArray(response.data.washer)) {
            response.data.washer.forEach((washer, index) => {
              try {
                // null 체크 추가
                if (!washer) {
                  console.warn(`⚠️ Washer ${index + 1} is null, skipping...`);
                  return;
                }
                const convertedMachine = convertServerMachineToClient(
                  washer,
                  'washing'
                );
                machines.push(convertedMachine);
              } catch (error) {
                console.error(
                  `❌ Error converting washer ${index + 1}:`,
                  error
                );
                console.error(`❌ Washer data:`, washer);
              }
            });
          }

          // 건조기 데이터 변환 (예약 데이터는 제외)
          if (response.data.dryer && Array.isArray(response.data.dryer)) {
            response.data.dryer.forEach((dryer, index) => {
              try {
                // null 체크 추가
                if (!dryer) {
                  console.warn(`⚠️ Dryer ${index + 1} is null, skipping...`);
                  return;
                }
                const convertedMachine = convertServerMachineToClient(
                  dryer,
                  'dryer'
                );
                machines.push(convertedMachine);
              } catch (error) {
                console.error(`❌ Error converting dryer ${index + 1}:`, error);
                console.error(`❌ Dryer data:`, dryer);
              }
            });
          }

          // 기기 정보만 업데이트 (예약 정보는 건드리지 않음)
          set({
            machines,
            lastFetched: Date.now(),
            isLoading: false,
          });
        } catch (error) {
          console.error('❌ Failed to fetch machines:', error);
          set({ isLoading: false });
        }
      },

      // 서버에서 내 정보 가져오기 - 예약 정보만 여기서 처리
      fetchMyInfo: async () => {
        set({ isLoading: true });

        try {
          const userInfo = await userApi.getMyInfo();
          console.log('Fetched user info:', userInfo);
          set({ currentUserInfo: userInfo.data, isLoading: false });
        } catch (error) {
          console.error('❌ Failed to fetch user info:', error);
          set({ isLoading: false });
        }
      },

      // 서버에서 사용자 목록 가져오기 (관리자용)
      fetchUsers: async (
        name?: string,
        gender?: 'MALE' | 'FEMALE',
        floor?: string
      ) => {
        set({ isLoading: true });

        try {
          const response = await userApi.getUsers(name, gender, floor);

          if (response.success) {
            const users = response.data
              .filter((user) => user != null) // null 사용자 필터링
              .map(convertAdminUserToClient);

            set({
              users,
              isLoading: false,
            });
          } else {
            console.error('❌ Server returned success: false');
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('❌ Failed to fetch users:', error);
          set({ isLoading: false });
        }
      },

      // 기존 함수들...
      addReservation: (reservation) => {
        const newReservation = {
          ...reservation,
          id: Date.now(),
        };
        set((state) => ({
          reservations: [...state.reservations, newReservation],
        }));
      },

      updateReservation: (id, updates) => {
        set((state) => ({
          reservations: state.reservations.map((reservation) =>
            reservation.id === id ? { ...reservation, ...updates } : reservation
          ),
        }));
      },

      cancelReservation: (id) => {
        set((state) => ({
          reservations: state.reservations.filter(
            (reservation) => reservation.id !== id
          ),
        }));
      },

      completeCollection: (id) => {
        set((state) => ({
          reservations: state.reservations.map((reservation) =>
            reservation.id === id
              ? { ...reservation, status: 'completed' as ReservationStatus }
              : reservation
          ),
        }));
      },

      reconnectMachine: (id) => {
        set((state) => ({
          reservations: state.reservations.map((reservation) =>
            reservation.id === id
              ? {
                  ...reservation,
                  status: 'confirmed' as ReservationStatus,
                  message: '재연결 시도 중...',
                }
              : reservation
          ),
        }));
      },

      updateMachine: (id, updates) => {
        set((state) => ({
          machines: state.machines.map((machine) =>
            machine.id === id ? { ...machine, ...updates } : machine
          ),
        }));
      },

      decrementTimers: () => {
        const now = Date.now();

        set((state) => {
          // 마지막 업데이트 시간 확인 (중복 실행 방지)
          if (state.lastTimerUpdate && now - state.lastTimerUpdate < 900) {
            return state; // 900ms 이내 중복 실행 방지
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
              nextAvailableSeconds: machine.nextAvailableSeconds
                ? Math.max(0, machine.nextAvailableSeconds - 1)
                : null,
            })),
          };
        });
      },

      hasActiveReservation: (userId) => {
        const { reservations } = get();
        return reservations.some(
          (reservation) =>
            reservation.status === 'RESERVED' ||
            reservation.status === 'CONFIRMED' ||
            reservation.status === 'RUNNING' ||
            reservation.status === 'CONNECTING' ||
            reservation.status === 'COLLECTION'
        );
      },

      hasActiveReservationByRoom: (roomNumber) => {
        const { reservations } = get();
        return reservations.some(
          (reservation) =>
            reservation.roomNumber === roomNumber &&
            (reservation.status === 'RESERVED' ||
              reservation.status === 'CONFIRMED' ||
              reservation.status === 'RUNNING' ||
              reservation.status === 'CONNECTING' ||
              reservation.status === 'COLLECTION')
        );
      },

      getUser: (userId) => {
        const { users } = get();
        return users.find((user) => user.id === userId);
      },

      getCurrentUser: () => {
        return get().currentUserInfo;
      },

      isUserRestricted: (userId) => {
        const user = get().getUser(userId);
        if (!user?.restrictedUntil) return false;
        return new Date() < new Date(user.restrictedUntil);
      },

      restrictUser: (userId, hours, reason) => {
        const restrictedUntil = new Date();
        restrictedUntil.setHours(restrictedUntil.getHours() + hours);

        set((state) => ({
          users: state.users.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  restrictedUntil: restrictedUntil.toISOString(),
                  restrictionReason: reason,
                }
              : user
          ),
        }));
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
              : user
          ),
        }));
      },

      checkAndRemoveExpiredRestrictions: () => {
        const now = new Date();
        set((state) => ({
          users: state.users.map((user) => {
            if (user.restrictedUntil && new Date(user.restrictedUntil) <= now) {
              return {
                ...user,
                restrictedUntil: null,
                restrictionReason: null,
              };
            }
            return user;
          }),
        }));
      },

      autoDeleteExpiredCollections: () => {
        set((state) => ({
          reservations: state.reservations.filter((reservation) => {
            if (
              reservation.status === 'COLLECTION' &&
              reservation.timeRemaining <= 0
            ) {
              return false;
            }
            return true;
          }),
        }));
      },

      getAccessibleFloors: (roomNumber: string) => {
        // 관리자는 모든 층 접근 가능
        if (RoleDecryption() === 'ROLE_ADMIN') {
          return [3, 4, 5];
        }

        const roomNum = Number.parseInt(roomNumber.replace(/[^0-9]/g, ''));

        // 3층 유저: 3층, 4층 접근 가능
        if (roomNum >= 300 && roomNum < 400) {
          return [3, 4];
        }
        // 4층 유저: 3층, 4층 접근 가능
        else if (roomNum >= 400 && roomNum < 500) {
          return [3, 4];
        }
        // 5층 유저: 5층만 접근 가능
        else if (roomNum >= 500 && roomNum < 600) {
          return [5];
        }

        // 기본값: 모든 층 접근 가능
        return [3, 4, 5];
      },

      // 새로운 함수: 기기 작동 상태 정보 가져오기
      getMachineOperatingStateInfo: (machineId: string) => {
        const { machines } = get();
        const machine = machines.find((m) => m.id === machineId);

        if (!machine) {
          return {
            text: '알 수 없음',
            color: 'bg-gray-50 text-gray-700 border-gray-200',
            icon: '❓',
            description: '기기 정보를 찾을 수 없습니다',
          };
        }

        // 기기 타입에 따라 적절한 상태 정보 함수 호출
        if (machine.type === 'washing') {
          return getWasherJobStateInfo(
            machine.operatingState as WasherJobState
          );
        } else {
          return getDryerJobStateInfo(machine.operatingState as DryerJobState);
        }
      },

      // 새로운 함수: 기기 예약 정보 가져오기
      getMachineReservationInfo: (machineId: string) => {
        const { machines } = get();
        const machine = machines.find((m) => m.id === machineId);

        if (
          !machine ||
          !machine.reservations ||
          machine.reservations.length === 0
        ) {
          return {
            hasReservation: false,
            reservationStatus: null,
            remainingTime: null,
            timeLabel: '',
          };
        }

        // 가장 최근 예약 찾기
        const activeReservation = machine.reservations[0];
        let timeLabel = '';

        switch (activeReservation.status) {
          case 'WAITING':
          case 'RESERVED':
            timeLabel = '예약 만료까지';
            break;
          case 'CONFIRMED':
            timeLabel = '예약 확인까지';
            break;
          case 'RUNNING':
            timeLabel = '사용 완료까지';
            break;
          default:
            timeLabel = '남은 시간';
        }

        return {
          hasReservation: true,
          reservationStatus: activeReservation.status,
          remainingTime: machine.nextAvailableSeconds,
          timeLabel,
        };
      },

      // 서버에서 사용자 정지
      restrictUserOnServer: async (userId: number, duration: string) => {
        try {
          const response = await userApi.restrictUser(userId, duration);

          const restrictedUntil = new Date();
          const hours = duration.includes('시간')
            ? Number.parseInt(duration)
            : duration.includes('일')
            ? Number.parseInt(duration) * 24
            : duration.includes('주일')
            ? Number.parseInt(duration) * 24 * 7
            : 1;
          restrictedUntil.setHours(restrictedUntil.getHours() + hours);

          set((state) => ({
            users: state.users.map((user) =>
              user.serverId === userId.toString()
                ? {
                    ...user,
                    restrictedUntil: restrictedUntil.toISOString(),
                    restrictionReason: `관리자에 의한 ${duration} 사용 제한`,
                  }
                : user
            ),
          }));
        } catch (error) {
          console.error('❌ Failed to restrict user:', error);
          throw error;
        }
      },

      // 서버에서 사용자 정지 해제
      unrestrictUserOnServer: async (userId: number) => {
        try {
          const response = await userApi.unrestrictUser(userId);

          set((state) => ({
            users: state.users.map((user) =>
              user.serverId === userId.toString()
                ? {
                    ...user,
                    restrictedUntil: null,
                    restrictionReason: null,
                  }
                : user
            ),
          }));
        } catch (error) {
          console.error('❌ Failed to unrestrict user:', error);
          throw error;
        }
      },

      // 기기별 예약 가능 여부 확인 (호실 정보 고려)
      canReserveMachine: (machineId: string, userRoomNumber: string) => {
        const { machines } = get();
        const machine = machines.find((m) => m.id === machineId);

        if (!machine)
          return { canReserve: false, reason: '기기를 찾을 수 없습니다.' };
        if (machine.isOutOfOrder)
          return { canReserve: false, reason: '고장난 기기입니다.' };
        if (machine.status === 'IN-USE')
          return { canReserve: false, reason: '현재 사용 중입니다.' };

        // 서버에서 받은 예약 정보 확인
        if (machine.reservations && machine.reservations.length > 0) {
          const activeReservation = machine.reservations.find(
            (r) =>
              r.status === 'WAITING' ||
              r.status === 'RESERVED' ||
              r.status === 'CONFIRMED' ||
              r.status === 'RUNNING'
          );

          if (activeReservation) {
            if (activeReservation.room === userRoomNumber) {
              return {
                canReserve: false,
                reason: '이미 같은 호실에서 예약했습니다.',
              };
            } else {
              return {
                canReserve: false,
                reason: `${activeReservation.room}호에서 예약 중입니다.`,
              };
            }
          }
        }

        return { canReserve: true, reason: '' };
      },

      // 기기의 예약 호실 정보 가져오기 (서버 데이터 활용)
      getMachineReservationRoom: (machineId: string) => {
        const { machines } = get();
        const machine = machines.find((m) => m.id === machineId);

        if (
          !machine ||
          !machine.reservations ||
          machine.reservations.length === 0
        ) {
          return null;
        }

        // 활성 예약 찾기
        const activeReservation = machine.reservations.find(
          (r) =>
            r.status === 'WAITING' ||
            r.status === 'RESERVED' ||
            r.status === 'CONFIRMED' ||
            r.status === 'RUNNING'
        );

        return activeReservation ? activeReservation.room : null;
      },

      // 기기의 예약 상태 정보 가져오기 (서버 데이터 활용)
      getMachineReservationStatus: (machineId: string) => {
        const { machines } = get();
        const machine = machines.find((m) => m.id === machineId);

        if (
          !machine ||
          !machine.reservations ||
          machine.reservations.length === 0
        ) {
          return null;
        }

        // 활성 예약 찾기
        const activeReservation = machine.reservations.find(
          (r) =>
            r.status === 'WAITING' ||
            r.status === 'RESERVED' ||
            r.status === 'CONFIRMED' ||
            r.status === 'RUNNING'
        );

        return activeReservation ? activeReservation.status : null;
      },
    }),
    {
      name: 'reservation-storage',
      storage: createStorage(),
      partialize: (state) => ({
        users: state.users,
        currentUserInfo: state.currentUserInfo,
        // machines와 reservations는 서버에서 가져오므로 저장하지 않음
      }),
    }
  )
);

// Make sure the store is properly exported

// And also add a default export:
export default useReservationStore;
