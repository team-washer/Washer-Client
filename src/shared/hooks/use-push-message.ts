import { notificationUrls } from "@/shared/api/apiUrls"
import { post } from "@/shared/api/http"

interface Props {
  token: string;
}

export async function registerPushToken({ token }: Props): Promise<void> {
  try {
    await post(notificationUrls.fcmToken(), { token })
  } catch (error) {
    console.error("FCM 토큰 등록 오류:", error)
  }
}

export default registerPushToken
