import Link from "next/link"
import { ChevronRight, Shirt, Wind } from "lucide-react"
import type { MachineSummary, MachineType } from "@/entities/machine"

const config: Record<MachineType, { label: string; href: string; icon: typeof Shirt }> = {
  WASHER: { label: "세탁기", href: "/washer", icon: Shirt },
  DRYER: { label: "건조기", href: "/dryer", icon: Wind },
}

export function MachineSummaryCard({
  type,
  summary,
}: {
  type: MachineType
  summary: MachineSummary
}) {
  const { label, href, icon: Icon } = config[type]

  return (
    <Link
      href={href}
      className="group block rounded-xl border bg-white p-5 shadow-sm transition-colors hover:border-[#86A9FF]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-[#6487DB]" />
          <p className="font-semibold text-gray-900">{label} 현황</p>
        </div>
        <span className="flex items-center text-sm text-gray-500 group-hover:text-[#6487DB]">
          전체보기
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="예약 가능" value={summary.available} className="text-green-600" />
        <Stat label="사용 중" value={summary.inUse} className="text-blue-600" />
        <Stat label="사용 불가" value={summary.unavailable} className="text-gray-500" />
      </div>
    </Link>
  )
}

function Stat({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="rounded-lg bg-gray-50 py-3">
      <p className={`text-xl font-bold ${className}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-500">{label}</p>
    </div>
  )
}
