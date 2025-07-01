"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Map, Shirt, Wind } from "lucide-react"
import { useReservationStore, type FloorType } from "@/lib/reservation-store"

interface LayoutModalProps {
  floor: FloorType
}

export function LayoutModal({ floor }: LayoutModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { machines, reservations, getUser } = useReservationStore()

  // 해당 층의 기기들 필터링
  const floorMachines = machines.filter((machine) => machine.floor === floor)
  const washingMachines = floorMachines.filter((machine) => machine.type === "washing")
  const dryers = floorMachines.filter((machine) => machine.type === "dryer")

  // 기기 상태 가져오기 (서버 데이터 활용)
  const getMachineStatus = (machineId: string) => {
    const machine = machines.find((m) => m.id === machineId)

    if (!machine) return { status: "unknown", color: "bg-gray-500", text: "알 수 없음" }
    if (machine.isOutOfOrder) return { status: "broken", color: "bg-red-500", text: "고장" }

    // 서버에서 받은 예약 정보 확인
    if (machine.reservations && machine.reservations.length > 0) {
      const activeReservation = machine.reservations.find(
        (r) => r.status === "waiting" || r.status === "reserved" || r.status === "confirmed" || r.status === "running",
      )

      if (activeReservation) {
        switch (activeReservation.status) {
          case "waiting":
          case "reserved":
            return { status: "reserved", color: "bg-yellow-500", text: "예약됨" }
          case "confirmed":
            return { status: "confirmed", color: "bg-orange-500", text: "확정됨" }
          case "running":
            return { status: "running", color: "bg-blue-500", text: "사용중" }
        }
      }
    }

    // 기본 상태 확인
    if (machine.status === "in-use") return { status: "in-use", color: "bg-blue-500", text: "사용중" }
    return { status: "available", color: "bg-green-500", text: "사용가능" }
  }

  // 위치별로 기기 정렬 - 입구에서 가까운 순서로
  const positions = ["L3", "L2", "L1", "R3", "R2", "R1"]

  const getMachineByPosition = (position: string, type: "washing" | "dryer") => {
    const machineList = type === "washing" ? washingMachines : dryers
    return machineList.find((machine) => machine.location === position)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-[#86A9FF] text-[#6487DB] hover:bg-[#EDF2FF]">
          <Map className="h-4 w-4 mr-1" />
          배치도
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#6487DB]">{floor} 세탁실 배치도</DialogTitle>
          <DialogDescription>세탁기는 아래, 건조기는 위에 배치되어 있습니다.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 범례 */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge className="bg-green-500 text-white">사용가능</Badge>
            <Badge className="bg-yellow-500 text-white">예약됨</Badge>
            <Badge className="bg-orange-500 text-white">확정됨</Badge>
            <Badge className="bg-blue-500 text-white">사용중</Badge>
            <Badge className="bg-red-500 text-white">고장</Badge>
          </div>

          {/* 3D 스타일 배치도 */}
          <div
            className="relative p-6 pb-12 rounded-xl"
            style={{
              background: "linear-gradient(135deg, #f0f4ff 0%, #e6f0ff 50%, #dae8ff 100%)",
              boxShadow: "inset 0 2px 10px rgba(100, 135, 219, 0.1)",
            }}
          >
            <div className="grid grid-cols-2 gap-8 max-w-md mx-auto">
              {/* 왼쪽 열 */}
              <div className="space-y-4">
                <h4 className="text-center font-medium text-[#6487DB] mb-2">왼쪽</h4>
                {["L3", "L2", "L1"].map((position) => (
                  <div key={position} className="space-y-2">
                    {/* 건조기 (위) */}
                    <div className="relative">
                      {(() => {
                        const dryer = getMachineByPosition(position, "dryer")
                        const status = dryer ? getMachineStatus(dryer.id) : null
                        return (
                          <div
                            className={`
                              relative h-16 rounded-lg border-2 border-gray-300 
                              flex items-center justify-center text-xs font-medium
                              transform transition-all duration-200 hover:scale-105 hover:shadow-lg
                              ${dryer ? status?.color + " text-white" : "bg-gray-100 text-gray-400"}
                            `}
                            style={{
                              background: dryer
                                ? `linear-gradient(135deg, ${status?.color.replace("bg-", "")} 0%, ${status?.color.replace("bg-", "").replace("500", "600")} 100%)`
                                : "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                              boxShadow: dryer ? "0 4px 12px rgba(0,0,0,0.15)" : "0 2px 6px rgba(0,0,0,0.1)",
                            }}
                          >
                            <Wind className="h-4 w-4 mr-1" />
                            <span>{dryer ? dryer.id : `D${position}`}</span>
                            {dryer && (
                              <div className="absolute -top-1 -right-1">
                                <div className="w-3 h-3 rounded-full bg-white/30 animate-pulse" />
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>

                    {/* 세탁기 (아래) */}
                    <div className="relative">
                      {(() => {
                        const washer = getMachineByPosition(position, "washing")
                        const status = washer ? getMachineStatus(washer.id) : null
                        return (
                          <div
                            className={`
                              relative h-16 rounded-lg border-2 border-gray-300 
                              flex items-center justify-center text-xs font-medium
                              transform transition-all duration-200 hover:scale-105 hover:shadow-lg
                              ${washer ? status?.color + " text-white" : "bg-gray-100 text-gray-400"}
                            `}
                            style={{
                              background: washer
                                ? `linear-gradient(135deg, ${status?.color.replace("bg-", "")} 0%, ${status?.color.replace("bg-", "").replace("500", "600")} 100%)`
                                : "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                              boxShadow: washer ? "0 4px 12px rgba(0,0,0,0.15)" : "0 2px 6px rgba(0,0,0,0.1)",
                            }}
                          >
                            <Shirt className="h-4 w-4 mr-1" />
                            <span>{washer ? washer.id : `W${position}`}</span>
                            {washer && (
                              <div className="absolute -top-1 -right-1">
                                <div className="w-3 h-3 rounded-full bg-white/30 animate-pulse" />
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                ))}
              </div>

              {/* 오른쪽 열 */}
              <div className="space-y-4">
                <h4 className="text-center font-medium text-[#6487DB] mb-2">오른쪽</h4>
                {["R3", "R2", "R1"].map((position) => (
                  <div key={position} className="space-y-2">
                    {/* 건조기 (위) */}
                    <div className="relative">
                      {(() => {
                        const dryer = getMachineByPosition(position, "dryer")
                        const status = dryer ? getMachineStatus(dryer.id) : null
                        return (
                          <div
                            className={`
                              relative h-16 rounded-lg border-2 border-gray-300 
                              flex items-center justify-center text-xs font-medium
                              transform transition-all duration-200 hover:scale-105 hover:shadow-lg
                              ${dryer ? status?.color + " text-white" : "bg-gray-100 text-gray-400"}
                            `}
                            style={{
                              background: dryer
                                ? `linear-gradient(135deg, ${status?.color.replace("bg-", "")} 0%, ${status?.color.replace("bg-", "").replace("500", "600")} 100%)`
                                : "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                              boxShadow: dryer ? "0 4px 12px rgba(0,0,0,0.15)" : "0 2px 6px rgba(0,0,0,0.1)",
                            }}
                          >
                            <Wind className="h-4 w-4 mr-1" />
                            <span>{dryer ? dryer.id : `D${position}`}</span>
                            {dryer && (
                              <div className="absolute -top-1 -right-1">
                                <div className="w-3 h-3 rounded-full bg-white/30 animate-pulse" />
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>

                    {/* 세탁기 (아래) */}
                    <div className="relative">
                      {(() => {
                        const washer = getMachineByPosition(position, "washing")
                        const status = washer ? getMachineStatus(washer.id) : null
                        return (
                          <div
                            className={`
                              relative h-16 rounded-lg border-2 border-gray-300 
                              flex items-center justify-center text-xs font-medium
                              transform transition-all duration-200 hover:scale-105 hover:shadow-lg
                              ${washer ? status?.color + " text-white" : "bg-gray-100 text-gray-400"}
                            `}
                            style={{
                              background: washer
                                ? `linear-gradient(135deg, ${status?.color.replace("bg-", "")} 0%, ${status?.color.replace("bg-", "").replace("500", "600")} 100%)`
                                : "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                              boxShadow: washer ? "0 4px 12px rgba(0,0,0,0.15)" : "0 2px 6px rgba(0,0,0,0.1)",
                            }}
                          >
                            <Shirt className="h-4 w-4 mr-1" />
                            <span>{washer ? washer.id : `W${position}`}</span>
                            {washer && (
                              <div className="absolute -top-1 -right-1">
                                <div className="w-3 h-3 rounded-full bg-white/30 animate-pulse" />
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 입구 표시 */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
              <div className="bg-[#86A9FF] text-white px-3 py-1 rounded-full text-xs font-medium">입구</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
