// SmartThings 기기 상태 타입 정의
export type WashingMachineOperatingState =
  | "none"
  | "prewash"
  | "wash"
  | "rinse"
  | "spin"
  | "finished"
  | "pause"
  | "delayWash"
  | "weightSensing"

export type DryerOperatingState =
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

export type MachineOperatingState = WashingMachineOperatingState | DryerOperatingState

export interface MachineStatusInfo {
  icon: string
  text: string
  description: string
  color: string
  bgColor: string
}

// 세탁기 상태 정보 매핑
const washingMachineStatusMap: Record<WashingMachineOperatingState, MachineStatusInfo> = {
  none: {
    icon: "⚪",
    text: "대기 중",
    description: "현재 작업 상태가 없습니다",
    color: "text-gray-600",
    bgColor: "bg-gray-50 border-gray-200",
  },
  prewash: {
    icon: "🔄",
    text: "예비세탁 중",
    description: "예비세탁 과정을 진행하고 있습니다",
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
  },
  wash: {
    icon: "🌊",
    text: "세탁 중",
    description: "메인 세탁 과정을 진행하고 있습니다",
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
  },
  rinse: {
    icon: "💧",
    text: "헹굼 중",
    description: "헹굼 과정을 진행하고 있습니다",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 border-cyan-200",
  },
  spin: {
    icon: "🌀",
    text: "탈수 중",
    description: "탈수 과정을 진행하고 있습니다",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 border-indigo-200",
  },
  finished: {
    icon: "✅",
    text: "세탁 완료",
    description: "세탁이 완료되었습니다",
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
  },
  pause: {
    icon: "⏸️",
    text: "일시정지",
    description: "세탁이 일시정지되었습니다",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 border-yellow-200",
  },
  delayWash: {
    icon: "⏰",
    text: "예약 세탁",
    description: "예약된 시간에 세탁을 시작합니다",
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-200",
  },
  weightSensing: {
    icon: "⚖️",
    text: "무게 감지 중",
    description: "세탁물의 무게를 감지하고 있습니다",
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-200",
  },
}

// 건조기 상태 정보 매핑
const dryerStatusMap: Record<DryerOperatingState, MachineStatusInfo> = {
  cooling: {
    icon: "❄️",
    text: "냉각 중",
    description: "건조 완료 후 냉각 중입니다",
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
  },
  delayWash: {
    icon: "⏰",
    text: "예약 건조",
    description: "예약된 시간에 건조를 시작합니다",
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-200",
  },
  drying: {
    icon: "🔥",
    text: "건조 중",
    description: "일반 건조 중입니다",
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
  },
  finished: {
    icon: "✅",
    text: "건조 완료",
    description: "건조 작업이 완료되었습니다",
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
  },
  none: {
    icon: "⚪",
    text: "대기 중",
    description: "현재 작업 상태가 없습니다",
    color: "text-gray-600",
    bgColor: "bg-gray-50 border-gray-200",
  },
  refreshing: {
    icon: "🌿",
    text: "리프레쉬 중",
    description: "탈취 또는 리프레쉬 작업 중입니다",
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
  },
  weightSensing: {
    icon: "⚖️",
    text: "무게 감지 중",
    description: "세탁물의 무게를 감지하고 있습니다",
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-200",
  },
  wrinklePrevent: {
    icon: "👔",
    text: "구김 방지 중",
    description: "구김 방지 모드 작동 중입니다",
    color: "text-pink-600",
    bgColor: "bg-pink-50 border-pink-200",
  },
  dehumidifying: {
    icon: "💨",
    text: "제습 중",
    description: "제습 모드 작동 중입니다",
    color: "text-sky-600",
    bgColor: "bg-sky-50 border-sky-200",
  },
  aIDrying: {
    icon: "🤖",
    text: "AI 건조 중",
    description: "AI 건조 기능이 작동 중입니다",
    color: "text-violet-600",
    bgColor: "bg-violet-50 border-violet-200",
  },
  sanitizing: {
    icon: "🦠",
    text: "살균 중",
    description: "살균 모드 작동 중입니다",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-200",
  },
  internalCare: {
    icon: "🔧",
    text: "내부 관리 중",
    description: "내부 관리(통세척 등) 작업 중입니다",
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-200",
  },
  freezeProtection: {
    icon: "🧊",
    text: "동결 방지 중",
    description: "동결 방지 모드 작동 중입니다",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 border-cyan-200",
  },
  continuousDehumidifying: {
    icon: "💨",
    text: "지속 제습 중",
    description: "지속 제습 모드 작동 중입니다",
    color: "text-teal-600",
    bgColor: "bg-teal-50 border-teal-200",
  },
  thawingFrozenInside: {
    icon: "🌡️",
    text: "해동 중",
    description: "내부 결빙 해동 중입니다",
    color: "text-rose-600",
    bgColor: "bg-rose-50 border-rose-200",
  },
}

// 기기 상태 정보 가져오기
export function getMachineStatusInfo(
  state: MachineOperatingState,
  machineType: "washing" | "dryer",
): MachineStatusInfo {
  if (machineType === "washing") {
    return washingMachineStatusMap[state as WashingMachineOperatingState] || washingMachineStatusMap.none
  } else {
    return dryerStatusMap[state as DryerOperatingState] || dryerStatusMap.none
  }
}

// 기기의 현재 작동 상태 가져오기 (임시 함수 - 실제로는 API에서 가져와야 함)
export function getMachineOperatingState(machineId: string, machineType: "washing" | "dryer"): MachineOperatingState {
  // TODO: 실제 API에서 기기 상태를 가져오는 로직 구현
  // 현재는 테스트용 랜덤 상태 반환
  const washingStates: WashingMachineOperatingState[] = ["none", "wash", "rinse", "spin", "finished"]
  const dryerStates: DryerOperatingState[] = ["none", "drying", "cooling", "finished", "wrinklePrevent"]

  if (machineType === "washing") {
    return washingStates[Math.floor(Math.random() * washingStates.length)]
  } else {
    return dryerStates[Math.floor(Math.random() * dryerStates.length)]
  }
}
