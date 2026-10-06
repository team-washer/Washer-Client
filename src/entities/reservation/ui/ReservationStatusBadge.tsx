import { Badge } from "@/shared/components/ui/badge"
import type { ReservationStatus } from "../model/reservation"

const statusBadges: Record<ReservationStatus, { label: string; className: string }> = {
  RESERVED: { label: "예약됨", className: "bg-amber-100 text-amber-800 hover:bg-amber-100" },
  RUNNING: { label: "사용 중", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  COMPLETED: { label: "완료", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  CANCELLED: { label: "취소", className: "bg-gray-100 text-gray-700 hover:bg-gray-100" },
}

export function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
  const { label, className } = statusBadges[status]
  return <Badge className={className}>{label}</Badge>
}
