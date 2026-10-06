import { del, get } from "@/shared/api/http"
import { userUrls } from "@/shared/api/apiUrls"
import { normalizeMyInfoResponse, type MyInfo } from "../model/user"

export const getMyInfo = async (): Promise<MyInfo> => {
  const response = await get<unknown>(userUrls.me())
  const user = normalizeMyInfoResponse(response)

  if (!user) {
    throw new Error("사용자 정보 응답이 올바르지 않습니다.")
  }

  return user
}

export const withdrawUser = async (): Promise<void> => {
  await del(userUrls.withdraw())
}
