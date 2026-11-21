export const REFERRAL_STORAGE_KEY = "lumiere:referralCode"
export const REFERRAL_QUERY_PARAM = "ref"

export function normalizeReferralCode(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function saveReferralCode(value: string | null | undefined): void {
  const code = normalizeReferralCode(value)
  if (!code || typeof window === "undefined") return

  try {
    window.localStorage.setItem(REFERRAL_STORAGE_KEY, code)
  } catch {
    // localStorage може бути недоступний (приватний режим, заблоковані cookies)
  }
}

export function getReferralCode(): string | null {
  if (typeof window === "undefined") return null

  try {
    return normalizeReferralCode(window.localStorage.getItem(REFERRAL_STORAGE_KEY))
  } catch {
    return null
  }
}
