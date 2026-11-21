"use client"

import { useEffect } from "react"

import { REFERRAL_QUERY_PARAM, saveReferralCode } from "@/lib/referral/storage"

export function ReferralCapture() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get(REFERRAL_QUERY_PARAM)
    saveReferralCode(code)
  }, [])

  return null
}
