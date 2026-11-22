"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

import { REFERRAL_QUERY_PARAM, saveReferralCode } from "@/lib/referral/storage"

export function ReferralCapture() {
  const searchParams = useSearchParams()
  const code = searchParams.get(REFERRAL_QUERY_PARAM)

  useEffect(() => {
    saveReferralCode(code)
  }, [code])

  return null
}
