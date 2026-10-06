import { get } from "@/shared/api/http"
import { machineUrls } from "@/shared/api/apiUrls"
import { unwrapData } from "@/shared/api/unwrapData"
import {
  normalizeMachineStatusListResponse,
  type Machine,
} from "../model/machine"

export const getMachineStatuses = async (): Promise<Machine[]> => {
  const response = await get<unknown>(machineUrls.statuses())
  const machines = normalizeMachineStatusListResponse(unwrapData(response))

  if (!machines) {
    throw new Error("기기 목록 응답이 올바르지 않습니다.")
  }

  return machines
}
