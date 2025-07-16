"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Clock, Home, ArrowLeft, RefreshCw } from "lucide-react"

export default function Error503Page() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-blue-600">503 - 서비스 이용 불가</CardTitle>
          <CardDescription className="text-gray-600">서비스를 일시적으로 이용할 수 없습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500 text-center">
            서버가 일시적으로 과부하 상태이거나 유지보수 중입니다. 잠시 후 다시 시도해주세요.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => router.push("/")} className="w-full bg-[#86A9FF] hover:bg-[#6487DB]">
              <Home className="h-4 w-4 mr-2" />
              메인 페이지로 이동
            </Button>
            <Button variant="outline" onClick={() => router.back()} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              이전 페이지로 돌아가기
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              페이지 새로고침
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
