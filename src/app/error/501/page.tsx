"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Wrench, Home, ArrowLeft } from "lucide-react"

export default function Error501Page() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <Wrench className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-orange-600">501 - 구현되지 않음</CardTitle>
          <CardDescription className="text-gray-600">요청된 기능이 아직 구현되지 않았습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500 text-center">
            서버가 요청을 이행하는 데 필요한 기능을 지원하지 않습니다. 해당 기능은 향후 업데이트에서 제공될 예정입니다.
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
