import { readFile, writeFile, mkdir } from "node:fs/promises"
import path from "node:path"
import { proxyBackendRequest } from "@/lib/api/public-proxy"

// Время жизни кэша: 2 часа в памяти, 24 часа на диске в .next/cache
const MEMORY_CACHE_TTL_MS = 2 * 60 * 60 * 1000
const DISK_CACHE_TTL_MS = 24 * 60 * 60 * 1000

interface CachedResponse {
  expiresAt: number
  data: string
}

const serverWarehousesCache = new Map<string, CachedResponse>()
const CACHE_DIR = path.join(process.cwd(), ".next", "cache", "novaposhta")

function getCacheFilePath(cityRef: string): string {
  // Санитизируем cityRef (только буквы, цифры, дефисы)
  const safeRef = cityRef.replace(/[^a-zA-Z0-9-]/g, "")
  return path.join(CACHE_DIR, `warehouses-${safeRef}.json`)
}

// Оставляем только нужные для клиента поля: экономит до 60-70% веса JSON
function minifyWarehouseData(rawList: unknown[]): unknown[] {
  return rawList.map(item => {
    const w = item as Record<string, unknown>
    return {
      Ref: w.Ref,
      Description: w.Description,
      Number: w.Number ?? null,
      Latitude: w.Latitude ?? null,
      Longitude: w.Longitude ?? null,
      ShortAddress: w.ShortAddress ?? null,
      CategoryOfWarehouse: w.CategoryOfWarehouse ?? null,
      TypeOfWarehouse: w.TypeOfWarehouse ?? null,
      TotalMaxWeightAllowed: w.TotalMaxWeightAllowed ?? null,
    }
  })
}

async function readFromDiskCache(cityRef: string): Promise<string | null> {
  try {
    const filePath = getCacheFilePath(cityRef)
    const content = await readFile(filePath, "utf-8")
    const parsed = JSON.parse(content) as { timestamp: number; payload: string }
    if (Date.now() - parsed.timestamp > DISK_CACHE_TTL_MS) {
      return null
    }
    return parsed.payload
  } catch {
    return null
  }
}

async function writeToDiskCache(cityRef: string, payload: string): Promise<void> {
  try {
    await mkdir(CACHE_DIR, { recursive: true })
    const filePath = getCacheFilePath(cityRef)
    await writeFile(
      filePath,
      JSON.stringify({ timestamp: Date.now(), payload }),
      "utf-8",
    )
  } catch {
    // Ошибки записи кэша на диск не ломают работу API
  }
}

export async function GET(request: Request) {
  const cityRef = new URL(request.url).searchParams.get("cityRef") ?? ""

  if (!cityRef) {
    return Response.json(
      { success: false, data: [], errors: ["Параметр cityRef є обов'язковим"] },
      { status: 400 },
    )
  }

  const now = Date.now()

  // 1. Проверяем память
  const inMemory = serverWarehousesCache.get(cityRef)
  if (inMemory && inMemory.expiresAt > now) {
    return new Response(inMemory.data, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Cache": "MEMORY_HIT",
      },
    })
  }

  // 2. Проверяем файловый кэш на диске (сохраняется между перезапусками сервера)
  const fromDisk = await readFromDiskCache(cityRef)
  if (fromDisk) {
    serverWarehousesCache.set(cityRef, {
      expiresAt: now + MEMORY_CACHE_TTL_MS,
      data: fromDisk,
    })
    return new Response(fromDisk, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Cache": "DISK_HIT",
      },
    })
  }

  // 3. Загружаем через backend
  const response = await proxyBackendRequest(
    `novaposhta/warehouses?cityRef=${encodeURIComponent(cityRef)}`,
  )

  if (response.ok) {
    try {
      const cloned = response.clone()
      const text = await cloned.text()
      const json = JSON.parse(text) as { success?: boolean; data?: unknown[] }

      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const minifiedData = minifyWarehouseData(json.data)
        const minifiedPayload = JSON.stringify({
          success: true,
          data: minifiedData,
          errors: [],
        })

        // Сохраняем оптимизированный ответ в память и на диск
        serverWarehousesCache.set(cityRef, {
          expiresAt: now + MEMORY_CACHE_TTL_MS,
          data: minifiedPayload,
        })
        void writeToDiskCache(cityRef, minifiedPayload)

        return new Response(minifiedPayload, {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-Cache": "MISS",
          },
        })
      }

      return new Response(text, {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      })
    } catch {
      return response
    }
  }

  return response
}
