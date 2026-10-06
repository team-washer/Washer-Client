import { AlertTriangle } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent } from "@/shared/components/ui/card"

export function CenteredMessage({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-red-500" />
          <p className="text-sm text-gray-600">{message}</p>
          {onRetry && <Button onClick={onRetry}>다시 시도</Button>}
        </CardContent>
      </Card>
    </div>
  )
}
