"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { useToast } from "@/shared/components/ui/use-toast"
import { ArrowLeft, Mail, Shield, Lock, Check } from "lucide-react"
import { authApi } from "@/shared/lib/api-client"

type Step = "email" | "verification" | "password" | "complete"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<Step>("email")
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    emailPrefix: "",
    verificationCode: "",
    password: "",
    confirmPassword: "",
  })
  const [passwordError, setPasswordError] = useState("")

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/
    return regex.test(password)
  }

  const getPasswordErrorMessage = (password: string) => {
    if (password.length === 0) return ""
    if (password.length < 8) return "비밀번호는 8자리 이상이어야 합니다"
    if (!/(?=.*[a-z])/.test(password)) return "영문 소문자를 포함해야 합니다"
    if (!/(?=.*[A-Z])/.test(password)) return "영문 대문자를 포함해야 합니다"
    if (!/(?=.*\d)/.test(password)) return "숫자를 포함해야 합니다"
    if (!/(?=.*[\W_])/.test(password)) return "특수문자를 포함해야 합니다"
    return ""
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === "password") {
      setFormData((prev) => ({ ...prev, [name]: value }))
      setPasswordError(getPasswordErrorMessage(value))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canProceed() && !isLoading) {
      handleNext()
    }
  }

  const handleSendVerification = async () => {
    const fullEmail = `${formData.emailPrefix}@gsm.hs.kr`

    try {
      setIsLoading(true)
      await authApi.sendPasswordChangeVerification(fullEmail)

      toast({
        title: "인증코드 발송",
        description: `${fullEmail}로 인증코드를 발송했습니다.`,
      })
      setCurrentStep("verification")
    } catch (error: any) {
      toast({
        title: "인증코드 발송 실패",
        description: error.response?.data?.message || "인증코드 발송 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 인증코드 검증 함수 추가
  const handleVerifyCode = async () => {
    // 인증코드 길이만 체크하고 바로 다음 단계로
    if (formData.verificationCode.length === 5) {
      try{
        await authApi.verifyPasswordChangeEmail(`${formData.emailPrefix}@gsm.hs.kr`, formData.verificationCode)
        toast({
          title: "인증코드 확인",
          description: "인증코드가 확인되었습니다. 새 비밀번호를 설정해주세요.",
        })
        setCurrentStep("password")
      } catch (error: any) {
        toast({
          title: "인증코드 오류",
          description: error.response?.data?.message || "인증코드 확인 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "인증코드 오류",
        description: "5자리 인증코드를 입력해주세요.",
        variant: "destructive",
      })
    }
  }

  const handleChangePassword = async () => {
    if (!validatePassword(formData.password)) {
      toast({
        title: "비밀번호 오류",
        description: "영문 대소문자, 숫자, 특수문자를 각각 최소 1자 이상 포함한 8자리 이상의 비밀번호를 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "비밀번호 불일치",
        description: "비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      })
      return
    }

    const fullEmail = `${formData.emailPrefix}@gsm.hs.kr`

    try {
      setIsLoading(true)
      await authApi.changePassword(fullEmail, formData.password)

      toast({
        title: "비밀번호 변경 완료",
        description: "비밀번호가 성공적으로 변경되었습니다.",
      })
      setCurrentStep("complete")
    } catch (error: any) {
      let errorMessage = "비밀번호 변경 중 오류가 발생했습니다."

      if (error.status === 400) {
        if (error.response?.data?.message.includes("만료") || error.response?.data?.message.includes("expired")) {
          errorMessage = "인증코드가 만료되었습니다. 처음부터 다시 시도해주세요."
        } else if (error.response?.data?.message.includes("잘못된") || error.response?.data?.message.includes("invalid")) {
          errorMessage = "잘못된 인증코드입니다. 다시 확인해주세요."
        } else {
          errorMessage = error.response?.data?.message
        }
      }

      toast({
        title: "비밀번호 변경 실패",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = () => {
    switch (currentStep) {
      case "email":
        handleSendVerification()
        break
      case "verification":
        handleVerifyCode() // 이제 단순히 다음 단계로만 이동
        break
      case "password":
        handleChangePassword()
        break
      case "complete":
        router.push("/login")
        break
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case "email":
        return formData.emailPrefix.trim().length > 0
      case "verification":
        return formData.verificationCode.length === 5
      case "password":
        return validatePassword(formData.password) && formData.password === formData.confirmPassword
      default:
        return true
    }
  }

  const stepConfig = {
    email: { title: "이메일을 입력해주세요", description: "비밀번호를 변경할 계정의 이메일을 입력하세요.", icon: Mail },
    verification: {
      title: "인증코드를 입력해주세요",
      description: "이메일로 전송된 5자리 코드를 입력하세요.",
      icon: Shield,
    },
    password: { title: "새 비밀번호를 설정해주세요", description: "안전한 새 비밀번호를 만들어주세요.", icon: Lock },
    complete: {
      title: "",
      description: "",
      icon: Check,
    },
  }

  const currentConfig = stepConfig[currentStep]
  const IconComponent = currentConfig.icon

  const renderStepContent = () => {
    switch (currentStep) {
      case "email":
        return (
          <div className="space-y-4">
            <div className="relative">
              <Input
                placeholder="이메일 아이디"
                value={formData.emailPrefix}
                name="emailPrefix"
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="text-base p-4 pr-32 border-2 border-[#A8C2FF] focus-visible:ring-[#86A9FF] focus-visible:border-[#86A9FF] rounded-lg"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                @gsm.hs.kr
              </span>
            </div>
          </div>
        )

      case "verification":
        return (
          <div className="space-y-4">
            <Input
              placeholder="5자리 인증코드"
              value={formData.verificationCode}
              name="verificationCode"
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="text-base p-4 text-center tracking-widest border-2 border-[#A8C2FF] focus-visible:ring-[#86A9FF] focus-visible:border-[#86A9FF] rounded-lg"
              maxLength={5}
              autoFocus
            />
          </div>
        )

      case "password":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="새 비밀번호"
                value={formData.password}
                name="password"
                onChange={handleInputChange}
                className="text-base p-4 border-2 border-[#A8C2FF] focus-visible:ring-[#86A9FF] focus-visible:border-[#86A9FF] rounded-lg"
                autoFocus
              />
              {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
              {!passwordError && formData.password && (
                <p className="text-sm text-green-600">✓ 비밀번호 조건을 만족합니다</p>
              )}
            </div>
            <Input
              type="password"
              placeholder="새 비밀번호 확인"
              value={formData.confirmPassword}
              name="confirmPassword"
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="text-base p-4 border-2 border-[#A8C2FF] focus-visible:ring-[#86A9FF] focus-visible:border-[#86A9FF] rounded-lg"
            />
            <p className="text-xs text-gray-500">
              영문 대소문자, 숫자, 특수문자를 각각 최소 1자 이상 포함한 8자리 이상
            </p>
          </div>
        )

      case "complete":
        return (
          <div className="space-y-6 text-center py-8">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <Check className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-green-600">성공! 🎉</h3>
              <div className="space-y-2 text-gray-600">
                <p className="text-base font-medium">비밀번호가 안전하게 변경되었습니다</p>
                <p className="text-sm">새로운 비밀번호로 로그인해보세요</p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // complete 단계에서는 헤더를 숨김
  const showHeader = currentStep !== "complete"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F8FF] via-white to-[#EDF2FF] p-4">
      <Card className="w-full max-w-md border-0 shadow-xl bg-white/95 backdrop-blur-sm">
        {showHeader && (
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#86A9FF] to-[#6487DB] rounded-full flex items-center justify-center shadow-md">
                <IconComponent className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-lg font-bold text-[#6487DB] mb-1">{currentConfig.title}</CardTitle>
            <CardDescription className="text-sm text-gray-600">{currentConfig.description}</CardDescription>
          </CardHeader>
        )}

        <CardContent className="px-6 pb-4">{renderStepContent()}</CardContent>

        <CardFooter className="flex justify-between px-6 pb-6">
          {currentStep !== "email" && currentStep !== "complete" && (
            <Button
              variant="outline"
              onClick={() => {
                if (currentStep === "verification") setCurrentStep("email")
                else if (currentStep === "password") setCurrentStep("verification")
              }}
              className="border-2 border-[#86A9FF] text-[#6487DB] hover:bg-[#EDF2FF] rounded-lg px-4 py-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              이전
            </Button>
          )}

          <div className="flex-1" />

          {currentStep !== "complete" && (
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
              className="bg-gradient-to-r from-[#86A9FF] to-[#6487DB] hover:from-[#6487DB] hover:to-[#86A9FF] text-white rounded-lg px-4 py-2 disabled:opacity-50"
            >
              {isLoading
                ? "처리 중..."
                : currentStep === "email"
                  ? "인증코드 발송"
                  : currentStep === "verification"
                    ? "인증코드 확인"
                    : currentStep === "password"
                      ? "비밀번호 변경"
                      : "다음"}
            </Button>
          )}

          {currentStep === "complete" && (
            <Button
              onClick={() => router.push("/login")}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg px-4 py-2"
            >
              로그인하러 가기
            </Button>
          )}
        </CardFooter>

        {currentStep === "email" && (
          <div className="px-6 pb-6">
            <p className="text-sm text-gray-500 text-center">
              <Link
                href="/login"
                className="text-[#6487DB] hover:underline font-medium flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                로그인으로 돌아가기
              </Link>
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
