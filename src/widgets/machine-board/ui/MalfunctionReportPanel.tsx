"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import type { Machine } from "@/entities/machine"
import {
  createMalfunctionReport,
  MALFUNCTION_DESCRIPTION_MAX_LENGTH,
} from "@/entities/malfunction"
import { getErrorMessage } from "@/shared/api/errorMessage"
import { Button } from "@/shared/components/ui/button"
import { Textarea } from "@/shared/components/ui/textarea"
import { useToast } from "@/shared/components/ui/use-toast"

export function MalfunctionReportPanel({
  machine,
  onDone,
  onCancel,
}: {
  machine: Machine
  onDone: () => void
  onCancel: () => void
}) {
  const { toast } = useToast()
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const trimmed = description.trim()

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await createMalfunctionReport(machine.id, trimmed)
      toast({
        title: "신고 접수 완료",
        description: `${machine.name} 고장 신고가 접수되었습니다.`,
      })
      onDone()
    } catch (error) {
      toast({
        title: "신고 실패",
        description: getErrorMessage(error, "고장 신고 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      <label htmlFor="malfunction-description" className="text-sm font-medium text-gray-900">
        고장 증상
      </label>
      <Textarea
        id="malfunction-description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        maxLength={MALFUNCTION_DESCRIPTION_MAX_LENGTH}
        rows={5}
        placeholder="고장 증상을 자세히 설명해주세요. (예: 전원이 켜지지 않아요, 탈수 중 소음이 심해요)"
      />
      <p className="text-right text-xs text-gray-500">
        {description.length} / {MALFUNCTION_DESCRIPTION_MAX_LENGTH}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isSubmitting}>
          뒤로
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          disabled={trimmed.length === 0 || isSubmitting}
          onClick={() => void handleSubmit()}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          신고하기
        </Button>
      </div>
    </div>
  )
}
