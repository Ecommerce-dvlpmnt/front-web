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
  TypeOfWarehouse?: string | null
  TotalMaxWeightAllowed?: string | number | null
}

interface ApiResult<T> {
  success?: boolean
  data?: T
  errors?: string[]
  detail?: string
}

// Время жизни кэша: 30 минут в памяти и в sessionStorage
const CACHE_TTL_MS = 30 * 60 * 1000
const SESSION_STORAGE_PREFIX = "np_wh_cache_"

// In-memory кэш (Promise для дедупликации одновременных вызовов)
const memoryCache = new Map<
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

// Нормализуем данные, сохраняя только нужные поля (экономит до 70% памяти и места в sessionStorage)
function normalizeWarehouse(item: NovaPoshtaWarehouse): NovaPoshtaWarehouse {
  return {
    Ref: item.Ref,
    Description: item.Description,
    Number: item.Number ?? null,
    Latitude: item.Latitude ?? null,
    Longitude: item.Longitude ?? null,
    ShortAddress: item.ShortAddress ?? null,
    CategoryOfWarehouse: item.CategoryOfWarehouse ?? null,
    TypeOfWarehouse: item.TypeOfWarehouse ?? null,
    TotalMaxWeightAllowed: item.TotalMaxWeightAllowed ?? null,
  }
}

// Убираем возможные дубликаты по Ref, чтобы не было двойных маркеров.
function dedupeAndNormalize(warehouses: NovaPoshtaWarehouse[]): NovaPoshtaWarehouse[] {
  const byRef = new Map<string, NovaPoshtaWarehouse>()
  for (const warehouse of warehouses) {
    if (!byRef.has(warehouse.Ref)) {
      byRef.set(warehouse.Ref, normalizeWarehouse(warehouse))
    }
  }
  return [...byRef.values()]
}

function getFromSessionStorage(cityRef: string): NovaPoshtaWarehouse[] | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(`${SESSION_STORAGE_PREFIX}${cityRef}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { timestamp: number; data: NovaPoshtaWarehouse[] }
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      window.sessionStorage.removeItem(`${SESSION_STORAGE_PREFIX}${cityRef}`)
      return null
    }
    return parsed.data
  } catch {
    return null
  }
}

function saveToSessionStorage(cityRef: string, data: NovaPoshtaWarehouse[]): void {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(
      `${SESSION_STORAGE_PREFIX}${cityRef}`,
      JSON.stringify({ timestamp: Date.now(), data }),
    )
  } catch {
    // Безопасно игнорируем превышение квоты или приватный режим
  }
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

  const cleaned = dedupeAndNormalize(result.data ?? [])
  saveToSessionStorage(cityRef, cleaned)
  return cleaned
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
  let entry = memoryCache.get(cityRef)

  // 1. Проверяем память
  if (entry && entry.expiresAt > now) {
    return waitWithAbort(entry.promise, signal)
  }

  // 2. Проверяем sessionStorage (быстрый доступ при перезагрузке страницы или смене вкладок)
  const sessionCached = getFromSessionStorage(cityRef)
  if (sessionCached && sessionCached.length > 0) {
    const resolvedPromise = Promise.resolve(sessionCached)
    memoryCache.set(cityRef, { expiresAt: now + CACHE_TTL_MS, promise: resolvedPromise })
    return waitWithAbort(resolvedPromise, signal)
  }

  // 3. Загружаем по сети
  const promise = requestWarehouses(cityRef)
  entry = { expiresAt: now + CACHE_TTL_MS, promise }
  memoryCache.set(cityRef, entry)

  // Ошибки не кэшируем: следующая попытка сделает новый запрос.
  promise.catch(() => {
    if (memoryCache.get(cityRef)?.promise === promise) {
      memoryCache.delete(cityRef)
    }
  })

  return waitWithAbort(promise, signal)
}
