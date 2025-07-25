"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Timer, Home, ArrowLeft, RefreshCw } from "lucide-react"

export default function Error504Page() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <Timer className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-purple-600">504 - 게이트웨이 시간 초과</CardTitle>
          <CardDescription className="text-gray-600">서버 응답 시간이 초과되었습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500 text-center">
            게이트웨이나 프록시 서버가 업스트림 서버로부터 시간 내에 응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.
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
              새로고침
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
