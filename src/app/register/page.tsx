"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import {
  Shirt,
  ArrowRight,
  ArrowLeft,
  Check,
  Hand,
  User,
  GraduationCap,
  Mail,
  Shield,
  FileText,
  Lock,
  Clock,
} from "lucide-react"
import { useReservationStore } from "@/shared/lib/reservation-store"
import { useToast } from "@/shared/components/ui/use-toast"
import { authApi } from "@/shared/lib/api-client"

type Step = "welcome" | "name" | "studentId" | "email" | "verification" | "basicInfo" | "password" | "complete"

type WelcomeStep = "greeting" | "service" | "warning" | "start" | "button"

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [currentStep, setCurrentStep] = useState<Step>("welcome")
  const [welcomeStep, setWelcomeStep] = useState<WelcomeStep>("greeting")
  const [isAnimating, setIsAnimating] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    studentId: "",
    emailPrefix: "",
    password: "",
    confirmPassword: "",
    roomNumber: "",
    gender: "" 
  })
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [sentCode, setSentCode] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordMatch, setPasswordMatch] = useState(true)
  const [verificationTimer, setVerificationTimer] = useState(0)

  const stepConfig = {
    name: { title: "이름이 무엇인가요?", description: "실명을 입력해주세요.", icon: User },
    studentId: { title: "학번은 어떻게 되나요?", description: "4자리 학번을 입력해주세요.", icon: GraduationCap },
    email: { title: "이메일을 입력해주세요.", description: "학교 이메일을 입력해주세요.", icon: Mail },
    verification: {
      title: "인증코드를 입력해주세요.",
      description: "이메일로 전송된 5자리 코드를 입력해주세요.",
      icon: Shield,
    },
    basicInfo: { title: "기본 정보를 입력해주세요.", description: "성별과 호실을 선택해주세요.", icon: FileText },
    password: { title: "비밀번호를 설정해주세요.", description: "안전한 비밀번호를 만들어주세요.", icon: Lock },
    complete: { title: "회원가입이 완료되었습니다!", description: "이제 로그인할 수 있습니다.", icon: Check },
  }

  // 웰컴 화면 애니메이션 시퀀스
  useEffect(() => {
    if (currentStep === "welcome") {
      const sequence = async () => {
        // 1. 반가워요! (2초 표시 후 페이드아웃)
        setWelcomeStep("greeting")
        setShowContent(true)
        await new Promise((resolve) => setTimeout(resolve, 2500))
        setShowContent(false)
        await new Promise((resolve) => setTimeout(resolve, 500))

        // 2. 서비스 소개 (3초 표시 후 페이드아웃)
        setWelcomeStep("service")
        setShowContent(true)
        await new Promise((resolve) => setTimeout(resolve, 3500))
        setShowContent(false)
        await new Promise((resolve) => setTimeout(resolve, 500))

        // 3. 주의사항 (4초 표시 후 페이드아웃)
        setWelcomeStep("warning")
        setShowContent(true)
        await new Promise((resolve) => setTimeout(resolve, 4500))
        setShowContent(false)
        await new Promise((resolve) => setTimeout(resolve, 500))

        // 4. 시작 메시지 (2초 표시 후 버튼 표시)
        setWelcomeStep("start")
        setShowContent(true)
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // 5. 버튼 표시
        setWelcomeStep("button")
      }

      sequence()
    }
  }, [currentStep])

  // 인증번호 타이머
  useEffect(() => {
    if (verificationTimer > 0) {
      const timer = setTimeout(() => {
        setVerificationTimer(verificationTimer - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [verificationTimer])

  // 성별에 따른 호실 옵션 생성
  const getRoomOptions = (gender: string | '') => {
    if (gender === "MALE") {
      const rooms = []
      for (let i = 301; i <= 320; i++) {
        rooms.push(`${i}`)
      }
      for (let i = 401; i <= 421; i++) {
        rooms.push(`${i}`)
      }
      return rooms
    } else if (gender === "FEMALE") {
      const rooms = []
      for (let i = 501; i <= 518; i++) {
        rooms.push(`${i}`)
      }
      return rooms
    }
    return []
  }

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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "studentId") {
      const sanitized = value.replace(/[^0-9]/g, "")
      if (sanitized.length <= 4) {
        setFormData((prev) => ({ ...prev, [name]: sanitized }))
      }
    } else if (name === "password") {
      setFormData((prev) => ({ ...prev, [name]: value }))
      setPasswordError(getPasswordErrorMessage(value))
      // 비밀번호 확인과 일치 여부 체크
      if (formData.confirmPassword) {
        setPasswordMatch(value === formData.confirmPassword)
      }
    } else if (name === "confirmPassword") {
      setFormData((prev) => ({ ...prev, [name]: value }))
      // 비밀번호와 일치 여부 체크
      setPasswordMatch(formData.password === value)
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "gender" && { roomNumber: "" }),
    }))
  }

  const nextStep = () => {
    setIsAnimating(true)
    setTimeout(() => {
      const steps: Step[] = [
        "welcome",
        "name",
        "studentId",
        "email",
        "verification",
        "basicInfo",
        "password",
        "complete",
      ]
      const currentIndex = steps.indexOf(currentStep)
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1])
      }
      setIsAnimating(false)
    }, 300)
  }

  const prevStep = () => {
    setIsAnimating(true)
    setTimeout(() => {
      const steps: Step[] = [
        "welcome",
        "name",
        "studentId",
        "email",
        "verification",
        "basicInfo",
        "password",
        "complete",
      ]
      const currentIndex = steps.indexOf(currentStep)
      if (currentIndex > 0) {
        setCurrentStep(steps[currentIndex - 1])
      }
      setIsAnimating(false)
    }, 300)
  }

  const handleSendVerification = async () => {
    const fullEmail = `${formData.emailPrefix}@gsm.hs.kr`

    try {
      setIsVerifying(true)
      await authApi.sendSignupVerification(fullEmail)

      // 3분 타이머 시작
      setVerificationTimer(180) // 3분 = 180초

      toast({
        title: "인증코드 발송",
        description: `${fullEmail}로 인증코드를 발송했습니다.`,
      })
      nextStep()
    } catch (error) {
      toast({
        title: "인증코드 발송 실패",
        description: error.message || "인증코드 발송 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleVerifyCode = async () => {
    const fullEmail = `${formData.emailPrefix}@gsm.hs.kr`

    try {
      await authApi.verifySignupEmail(fullEmail, verificationCode)
      setIsVerified(true)
      setVerificationTimer(0) // 타이머 중지
      toast({
        title: "인증 완료",
        description: "이메일 인증이 완료되었습니다.",
      })
      nextStep()
    } catch (error) {
      toast({
        title: "인증 실패",
        description: error.message || "인증코드가 올바르지 않습니다.",
        variant: "destructive",
      })
    }
  }

  const handleComplete = async () => {
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
      await authApi.signup({
        email: fullEmail,
        password: formData.password,
        name: formData.name,
        schoolNumber: formData.studentId,
        gender: formData.gender,
        room: formData.roomNumber,
      })

      toast({
        title: "회원가입 완료",
        description: "회원가입이 성공적으로 완료되었습니다.",
      })
      nextStep()
    } catch (error) {
      toast({
        title: "회원가입 실패",
        description: error.message || "회원가입 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case "welcome":
        return welcomeStep === "button"
      case "name":
        return formData.name.trim().length > 0
      case "studentId":
        return formData.studentId.length === 4
      case "email":
        return formData.emailPrefix.trim().length > 0
      case "verification":
        return verificationCode.length === 5
      case "basicInfo":
        return formData.gender && formData.roomNumber
      case "password":
        return validatePassword(formData.password) && formData.password === formData.confirmPassword
      default:
        return false
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canProceed()) {
      handleNext()
    }
  }

  const handleNext = () => {
    switch (currentStep) {
      case "email":
        handleSendVerification()
        break
      case "verification":
        handleVerifyCode()
        break
      case "password":
        handleComplete()
        break
      case "complete":
        router.push("/login")
        break
      default:
        nextStep()
    }
  }

  const renderWelcomeContent = () => {
    switch (welcomeStep) {
      case "greeting":
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-[#86A9FF] to-[#6487DB] rounded-full flex items-center justify-center shadow-lg">
                  <Shirt className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <Hand className="w-8 h-8 text-yellow-400 animate-wave" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-[#6487DB]">반가워요!</h1>
          </div>
        )

      case "service":
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#86A9FF] to-[#6487DB] rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Shirt className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-[#6487DB]">Washer</h2>
              <p className="text-base text-gray-700 leading-relaxed">
                GSM에서 세탁기/건조기 예약을
                <br />
                손쉽게 도와주는 서비스에요.
              </p>
            </div>
          </div>
        )

      case "warning":
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-red-600 font-medium leading-relaxed">
                세탁기/건조기를 Washer에서 예약 및<br />
                세탁/건조 준비 버튼을 누르지 않고 전원을 동작시킬 시<br />
                <span className="font-bold">전원이 자동으로 꺼짐</span>을 유의해 주시고,
              </p>
              <p className="text-sm text-red-600 font-bold">전원이 켜진 후에 꼭 세탁/건조 시작 버튼을 눌러주세요!</p>
            </div>
          </div>
        )

      case "start":
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <span className="text-2xl">✨</span>
            </div>
            <h2 className="text-xl font-bold text-[#6487DB]">자, 그럼 시작해 볼까요?</h2>
          </div>
        )

      case "button":
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <span className="text-2xl">✨</span>
            </div>
            <h2 className="text-xl font-bold text-[#6487DB]">자, 그럼 시작해 볼까요?</h2>
            <div className="animate-fade-in-up">
              <Button
                onClick={nextStep}
                className="bg-gradient-to-r from-[#86A9FF] to-[#6487DB] hover:from-[#6487DB] hover:to-[#86A9FF] text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-300"
              >
                시작하기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case "welcome":
        return (
          <div className="min-h-[350px] flex items-center justify-center">
            <div
              className={`transition-all duration-500 ${
                showContent ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-8"
              }`}
            >
              {renderWelcomeContent()}
            </div>
          </div>
        )

      case "name":
        return (
          <div className="space-y-4">
            <Input
              placeholder="이름을 입력하세요"
              value={formData.name}
              name="name"
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="text-base p-4 border-2 border-[#A8C2FF] focus-visible:ring-[#86A9FF] focus-visible:border-[#86A9FF] rounded-lg"
              autoFocus
            />
          </div>
        )

      case "studentId":
        return (
          <div className="space-y-4">
            <Input
              placeholder="3301"
              value={formData.studentId}
              name="studentId"
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="text-base p-4 border-2 border-[#A8C2FF] focus-visible:ring-[#86A9FF] focus-visible:border-[#86A9FF] rounded-lg text-center tracking-widest"
              maxLength={4}
              autoFocus
            />
            <p className="text-sm text-gray-500 text-center">학년반번호 4자리를 입력해주세요</p>
          </div>
        )

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
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-base p-4 text-center tracking-widest border-2 border-[#A8C2FF] focus-visible:ring-[#86A9FF] focus-visible:border-[#86A9FF] rounded-lg"
              maxLength={5}
              autoFocus
            />
            {verificationTimer > 0 && (
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 text-orange-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">남은 시간: {formatTime(verificationTimer)}</span>
                </div>
              </div>
            )}
            {verificationTimer === 0 && currentStep === "verification" && (
              <div className="text-center">
                <p className="text-sm text-red-500">인증 시간이 만료되었습니다. 다시 발송해주세요.</p>
              </div>
            )}
            {isVerifying && (
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#86A9FF]"></div>
                  <span className="text-sm">인증코드를 발송하고 있습니다...</span>
                </div>
              </div>
            )}
          </div>
        )

      case "basicInfo":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">성별</Label>
              <Select onValueChange={(value) => handleSelectChange("gender", value)}>
                <SelectTrigger className="text-base p-4 border-2 border-[#A8C2FF] focus:ring-[#86A9FF] focus:border-[#86A9FF] rounded-lg">
                  <SelectValue placeholder="성별을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">남성</SelectItem>
                  <SelectItem value="FEMALE">여성</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">호실</Label>
              <Select
                onValueChange={(value) => handleSelectChange("roomNumber", value)}
                disabled={!formData.gender}
                value={formData.roomNumber}
              >
                <SelectTrigger className="text-base p-4 border-2 border-[#A8C2FF] focus:ring-[#86A9FF] focus:border-[#86A9FF] rounded-lg disabled:opacity-50">
                  <SelectValue placeholder={formData.gender ? "호실을 선택하세요" : "먼저 성별을 선택하세요"} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {getRoomOptions(formData.gender).map((room) => (
                    <SelectItem key={room} value={room}>
                      {room}호
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case "password":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="비밀번호"
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
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="비밀번호 확인"
                value={formData.confirmPassword}
                name="confirmPassword"
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className={`text-base p-4 border-2 focus-visible:ring-[#86A9FF] rounded-lg ${
                  formData.confirmPassword && !passwordMatch
                    ? "border-red-500 focus-visible:border-red-500"
                    : "border-[#A8C2FF] focus-visible:border-[#86A9FF]"
                }`}
              />
              {formData.confirmPassword && !passwordMatch && (
                <p className="text-sm text-red-500">비밀번호가 일치하지 않습니다</p>
              )}
              {formData.confirmPassword && passwordMatch && formData.password && (
                <p className="text-sm text-green-600">✓ 비밀번호가 일치합니다</p>
              )}
            </div>
            <p className="text-xs text-gray-500">
              영문 대소문자, 숫자, 특수문자를 각각 최소 1자 이상 포함한 8자리 이상
            </p>
          </div>
        )

      case "complete":
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                <Check className="w-8 h-8 text-white animate-bounce" />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-[#6487DB]">{formData.name}님, 환영합니다! 🎉</h3>
              <div className="space-y-1 text-gray-600">
                <p className="text-base">학번: {formData.studentId}</p>
                <p className="text-sm">이제 로그인하여 세탁기와 건조기를 예약할 수 있습니다.</p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const currentConfig = currentStep !== "welcome" && currentStep !== "complete" ? stepConfig[currentStep] : null
  const IconComponent = currentConfig?.icon

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F8FF] via-white to-[#EDF2FF] p-4 overflow-hidden">
      <Card className="w-full max-w-md border-0 shadow-xl bg-white/95 backdrop-blur-sm">
        {currentStep !== "welcome" && (
          <CardHeader className="text-center pb-4">
            {IconComponent && (
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#86A9FF] to-[#6487DB] rounded-full flex items-center justify-center shadow-md">
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
              </div>
            )}
            <div
              className={`transition-all duration-300 ${
                isAnimating ? "opacity-0 transform translate-y-2" : "opacity-100 transform translate-y-0"
              }`}
            >
              <CardTitle className="text-lg font-bold text-[#6487DB] mb-1">{currentConfig?.title}</CardTitle>
              <CardDescription className="text-sm text-gray-600">{currentConfig?.description}</CardDescription>
            </div>
          </CardHeader>
        )}

        <CardContent className="px-6 pb-4">
          <div
            className={`transition-all duration-300 ${
              isAnimating ? "opacity-0 transform translate-y-2" : "opacity-100 transform translate-y-0"
            }`}
          >
            {renderStepContent()}
          </div>
        </CardContent>

        {currentStep !== "welcome" && (
          <CardFooter className="flex justify-between px-6 pb-6">
            {currentStep !== "name" && currentStep !== "complete" && (
              <Button
                variant="outline"
                onClick={prevStep}
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
                disabled={!canProceed() || isVerifying || (currentStep === "verification" && verificationTimer === 0)}
                className="bg-gradient-to-r from-[#86A9FF] to-[#6487DB] hover:from-[#6487DB] hover:to-[#86A9FF] text-white rounded-lg px-4 py-2 disabled:opacity-50"
              >
                {currentStep === "email"
                  ? "인증코드 발송"
                  : currentStep === "verification"
                    ? "인증하기"
                    : currentStep === "password"
                      ? "회원가입 완료"
                      : "다음"}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}

            {currentStep === "complete" && (
              <Button
                onClick={() => router.push("/login")}
                className="bg-gradient-to-r from-[#86A9FF] to-[#6487DB] hover:from-[#6487DB] hover:to-[#86A9FF] text-white rounded-lg px-4 py-2"
              >
                로그인하러 가기
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </CardFooter>
        )}

        {currentStep === "name" && (
          <div className="px-6 pb-6">
            <p className="text-sm text-gray-500 text-center">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-[#6487DB] hover:underline font-medium">
                로그인
              </Link>
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
