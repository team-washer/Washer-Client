import { post } from "@/shared/api/http"
import { malfunctionUrls } from "@/shared/api/apiUrls"

export const MALFUNCTION_DESCRIPTION_MAX_LENGTH = 200

export const createMalfunctionReport = async (
  machineId: number,
  description: string,
): Promise<void> => {
  await post(malfunctionUrls.create(), { machineId, description })
}
