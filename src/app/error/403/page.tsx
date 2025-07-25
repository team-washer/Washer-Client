"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Shield, Home, ArrowLeft } from "lucide-react"

export default function Error403Page() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">403 - 접근 금지</CardTitle>
          <CardDescription className="text-gray-600">이 페이지에 접근할 권한이 없습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500 text-center">
            요청하신 페이지에 접근하기 위한 적절한 권한이 없습니다. 관리자에게 문의하거나 로그인 상태를 확인해주세요.
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
