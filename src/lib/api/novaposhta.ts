// Клиентский модуль для работы с точками Новой Почты.
// Запросы идут через наш Next.js route /api/novaposhta/warehouses,
// который проксирует их на .NET backend.

export interface NovaPoshtaWarehouse {
  Ref: string
  Description: string
  Number?: string | null
  Latitude?: string | null
  Longitude?: string | null
  ShortAddress?: string | null
  CategoryOfWarehouse?: string | null
}

interface ApiResult<T> {
  success?: boolean
  data?: T
  errors?: string[]
  detail?: string
}

// Сколько хранить список точек города в памяти (10 минут).
const CACHE_TTL_MS = 10 * 60 * 1000

// Ключ — cityRef. Храним именно Promise, а не готовые данные:
// так два одновременных запроса одного города превращаются в один.
const warehousesCache = new Map<
  string,
  { expiresAt: number; promise: Promise<NovaPoshtaWarehouse[]> }
>()

// Та же логика определения поштомата, что уже используется в проекте.
export function isPostomatWarehouse(warehouse: NovaPoshtaWarehouse): boolean {
  return Boolean(
    warehouse.CategoryOfWarehouse?.toLowerCase().includes("postomat") ||
      warehouse.Description.toLowerCase().includes("поштомат"),
  )
}

// Убираем возможные дубликаты по Ref, чтобы не было двойных маркеров.
function dedupeByRef(warehouses: NovaPoshtaWarehouse[]): NovaPoshtaWarehouse[] {
  const byRef = new Map<string, NovaPoshtaWarehouse>()
  for (const warehouse of warehouses) {
    if (!byRef.has(warehouse.Ref)) byRef.set(warehouse.Ref, warehouse)
  }
  return [...byRef.values()]
}

async function requestWarehouses(cityRef: string): Promise<NovaPoshtaWarehouse[]> {
  const response = await fetch(
    `/api/novaposhta/warehouses?cityRef=${encodeURIComponent(cityRef)}`,
  )
  const result = (await response.json().catch(() => null)) as
    | ApiResult<NovaPoshtaWarehouse[]>
    | null

  if (!response.ok || !result?.success) {
    throw new Error(
      result?.errors?.join(" ") || result?.detail || "Не вдалося завантажити відділення",
    )
  }
  return dedupeByRef(result.data ?? [])
}

// Позволяет вызывающему коду «перестать ждать» общий Promise,
// не отменяя сам запрос для других потребителей кэша.
function waitWithAbort<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise
  if (signal.aborted) return Promise.reject(signal.reason)

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason)
    signal.addEventListener("abort", onAbort, { once: true })
    promise.then(
      value => {
        signal.removeEventListener("abort", onAbort)
        resolve(value)
      },
      error => {
        signal.removeEventListener("abort", onAbort)
        reject(error)
      },
    )
  })
}

export function getWarehousesByCity(
  cityRef: string,
  signal?: AbortSignal,
): Promise<NovaPoshtaWarehouse[]> {
  const now = Date.now()
  let entry = warehousesCache.get(cityRef)

  if (!entry || entry.expiresAt <= now) {
    const promise = requestWarehouses(cityRef)
    entry = { expiresAt: now + CACHE_TTL_MS, promise }
    warehousesCache.set(cityRef, entry)

    // Ошибки не кэшируем: следующая попытка сделает новый запрос.
    promise.catch(() => {
      if (warehousesCache.get(cityRef)?.promise === promise) {
        warehousesCache.delete(cityRef)
      }
    })
  }

  return waitWithAbort(entry.promise, signal)
}
