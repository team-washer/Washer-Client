"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileQuestion, Home, ArrowLeft, RefreshCw } from "lucide-react"

export default function Error404Page() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <FileQuestion className="h-8 w-8 text-gray-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">404 - 페이지를 찾을 수 없음</CardTitle>
          <CardDescription className="text-gray-600">요청하신 페이지가 존재하지 않습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500 text-center">
            페이지가 삭제되었거나 주소가 변경되었을 수 있습니다. URL을 다시 확인해주세요.
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
