import { adminApiFetch } from "@/lib/api/admin/auth"
import type {
  AdSpend,
  CurrencyRateInfo,
  PartnerDeposit,
  PartnersSummary,
} from "@/lib/api/admin/finance"

export async function getFinanceSnapshot() {
  const [exchangeRate, partnersSummary, adSpends, deposits] = await Promise.all([
    adminApiFetch<CurrencyRateInfo>("admin/finance/exchange-rate"),
    adminApiFetch<PartnersSummary>("admin/finance/partners-summary"),
    adminApiFetch<AdSpend[]>("admin/finance/ad-spend"),
    adminApiFetch<PartnerDeposit[]>("admin/finance/deposits"),
  ])

  return { exchangeRate, partnersSummary, adSpends, deposits }
}
