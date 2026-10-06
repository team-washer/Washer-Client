"use client"

import { OAuthLoginButton } from "@themoment-team/datagsm-oauth-react"
import { Shirt } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-white p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#EDF2FF] bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#86A9FF]">
              <Shirt className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#6487DB]">Washer</h1>
          <p className="mt-2 text-sm text-gray-500">
            DataGSM 계정으로 로그인하세요.
          </p>
        </div>
        <OAuthLoginButton className="w-full rounded-lg bg-[#86A9FF] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[#6487DB]" />
      </div>
    </div>
  )
}
