export interface CurrencyRateInfo {
  currency: string | null
  rate: number
  date: string
  source: string | null
}

export interface FinancialOverview {
  usdRate: number
  totalRevenue: number
  totalRevenueUsd: number
  totalDropCost: number
  totalDropCostUsd: number
  grossProfit: number
  grossProfitUsd: number
  adBudgetInvested: number
  adBudgetInvestedUsd: number
  adSpendActual: number
  adSpendActualUsd: number
  remainingAdBudget: number
  remainingAdBudgetUsd: number
  netProfitToDistribute: number
  netProfitToDistributeUsd: number
}

export interface PartnerShare {
  id: string
  adminId: string
  username: string | null
  name: string | null
  role: string | null
  investedAmount: number
  investedAmountUsd: number
  sharePercent: number
  currentPayout: number
  currentPayoutUsd: number
  roi: number
}

export interface PartnersSummary {
  financialOverview: FinancialOverview
  partners: PartnerShare[] | null
}

export interface AdSpend {
  id: string
  amount: number
  amountUsd: number
  exchangeRate: number
  source: string | null
  date: string
  note: string | null
  recordedByAdminId: string | null
  recordedByAdminName: string | null
  createdAt: string
}

export interface PartnerDeposit {
  id: string
  adminId: string
  adminUsername: string | null
  adminName: string | null
  amount: number
  amountUsd: number
  exchangeRate: number
  date: string
  note: string | null
  createdAt: string
}

export interface CreateAdSpendInput {
  amount: number
  currency: "UAH" | "USD"
  customExchangeRate?: number | null
  source: string
  date?: string | null
  note?: string | null
}

export interface CreateDepositInput {
  adminId?: string | null
  amount: number
  currency: "UAH" | "USD"
  customExchangeRate?: number | null
  date?: string | null
  note?: string | null
}

export interface UpdatePartnerSettingsInput {
  role?: string | null
  fixedSharePercent?: number | null
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const error = body as { detail?: string; title?: string } | null
    throw new Error(error?.detail ?? error?.title ?? "Не вдалося виконати фінансову операцію")
  }
  return body as T
}

async function get<T>(path: string): Promise<T> {
  return parseResponse<T>(await fetch(path, { cache: "no-store" }))
}

async function send<T>(path: string, method: string, body?: unknown): Promise<T> {
  return parseResponse<T>(await fetch(path, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }))
}

export const fetchCurrencyRate = () => get<CurrencyRateInfo>("/api/admin/finance/exchange-rate")
export const fetchPartnersSummary = () => get<PartnersSummary>("/api/admin/finance/partners-summary")
export const fetchAdSpends = () => get<AdSpend[]>("/api/admin/finance/ad-spend")
export const createAdSpend = (input: CreateAdSpendInput) => send<AdSpend>("/api/admin/finance/ad-spend", "POST", input)
export const deleteAdSpend = (id: string) => send<void>(`/api/admin/finance/ad-spend/${encodeURIComponent(id)}`, "DELETE")
export const fetchDeposits = () => get<PartnerDeposit[]>("/api/admin/finance/deposits")
export const createDeposit = (input: CreateDepositInput) => send<PartnerDeposit>("/api/admin/finance/deposits", "POST", input)
export const updatePartnerSettings = (id: string, input: UpdatePartnerSettingsInput) =>
  send<void>(`/api/admin/finance/partners/${encodeURIComponent(id)}`, "PATCH", input)
