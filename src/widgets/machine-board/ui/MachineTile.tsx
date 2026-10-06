"use client"

import { Shirt, Wind } from "lucide-react"
import {
  getMachineStatusView,
  type Machine,
  type MachineStatusTone,
} from "@/entities/machine"
import { formatCountdown, parseServerDateTime } from "@/shared/lib/time"

export const toneClasses: Record<MachineStatusTone, { tile: string; dot: string }> = {
  available: { tile: "border-green-200 bg-green-50", dot: "bg-green-500" },
  reserved: { tile: "border-amber-200 bg-amber-50", dot: "bg-amber-500" },
  inUse: { tile: "border-blue-200 bg-blue-50", dot: "bg-blue-500" },
  cleaning: { tile: "border-cyan-200 bg-cyan-50", dot: "bg-cyan-500" },
  broken: { tile: "border-red-200 bg-red-50", dot: "bg-red-500" },
  unavailable: { tile: "border-gray-200 bg-gray-50", dot: "bg-gray-400" },
}

const getRemainingText = (machine: Machine, now: number): string | null => {
  const completion = parseServerDateTime(machine.expectedCompletionTime)
  if (completion) {
    const remaining = completion.getTime() - now
    return remaining > 0 ? formatCountdown(remaining) : "곧 완료"
  }
  return machine.remainingMinutes !== null ? `${machine.remainingMinutes}분` : null
}

export function MachineTile({
  machine,
  now,
  onSelect,
}: {
  machine: Machine
  now: number
  onSelect: () => void
}) {
  const { label, tone } = getMachineStatusView(machine)
  const Icon = machine.type === "DRYER" ? Wind : Shirt
  const position = machine.placement
    ? `${machine.placement.side === "LEFT" ? "L" : "R"}${machine.placement.number}`
    : machine.name
  const remaining = tone === "inUse" ? getRemainingText(machine, now) : null

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border-2 p-3 text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86A9FF] ${toneClasses[tone].tile}`}
      title={machine.name}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-semibold text-gray-900">
          <Icon className="h-4 w-4 text-[#6487DB]" />
          {position}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
          <span className={`h-2 w-2 rounded-full ${toneClasses[tone].dot}`} />
          {label}
        </span>
      </div>
      <div className="mt-2 min-h-[1.25rem] text-xs text-gray-600">
        {remaining && <span className="tabular-nums">남은 시간 {remaining}</span>}
        {machine.roomNumber && (tone === "reserved" || tone === "inUse") && (
          <span className={remaining ? "ml-2" : ""}>{machine.roomNumber}호</span>
        )}
      </div>
    </button>
  )
}
