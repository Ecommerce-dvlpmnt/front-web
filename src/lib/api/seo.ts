import { SITE_ORIGIN } from "@/lib/config/site"

export interface SeoPayload {
  metaTitle?: string
  metaDescription?: string
  canonicalUrl?: string
  jsonLd?: unknown
}

export function normalizeSeoUrls(text: string): string {
  return text.replace(/https?:\/\/(?:www\.)?jingledecor\.com\.ua(?=[:/\s"'#?)}\]]|$)(?::\d+)?|https?:\/\/(?:[\w.-]+\.(?:vercel\.app|up\.railway\.app|railway\.app)|localhost|127\.0\.0\.1)(?::\d+)?/giu, SITE_ORIGIN)
}

async function seoFetch(path: string): Promise<Response> {
  const base = process.env.API_URL?.replace(/\/+$/, "")
  if (!base) throw new Error("API_URL is not configured")
  const response = await fetch(`${base}/seo/${path}`, {
    headers: { Accept: path.endsWith(".txt") ? "text/plain" : "application/json" },
    next: { revalidate: 300, tags: ["seo", "products", "categories"] },
    signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) throw new Error(`SEO API returned ${response.status}`)
  return response
}

export async function getSeoData(kind: "home" | "category" | "product", slug?: string): Promise<SeoPayload> {
  try {
    const response = await seoFetch(`structured-data/${kind}${slug ? `/${encodeURIComponent(slug)}` : ""}`)
    const data: unknown = await response.json()
    if (!data || typeof data !== "object" || Array.isArray(data)) return {}
    const raw = data as Record<string, unknown>
    return {
      metaTitle: typeof raw.metaTitle === "string" ? raw.metaTitle : undefined,
      metaDescription: typeof raw.metaDescription === "string" ? raw.metaDescription : undefined,
      canonicalUrl: typeof raw.canonicalUrl === "string" ? normalizeSeoUrls(raw.canonicalUrl) : undefined,
      jsonLd: raw.jsonLd,
    }
  } catch { return {} }
}

const FALLBACK = `# Jingle Decor

> Український інтернет-магазин штучних ялинок, вінків, гірлянд та святкового декору.

Офіційний сайт: ${SITE_ORIGIN}
Мова: українська. Валюта: UAH. Актуальні ціни й наявність наведено на сторінках товарів.

## Розділи
- [Каталог](${SITE_ORIGIN}/#catalog)
- [Доставка й оплата](${SITE_ORIGIN}/delivery-and-payment)
- [Обмін і повернення](${SITE_ORIGIN}/returns)
- [Контакти](${SITE_ORIGIN}/contacts)
- [Карта сайту](${SITE_ORIGIN}/sitemap.xml)
- [Повний довідник](${SITE_ORIGIN}/llms-full.txt)
`

export async function getLlmsText(full = false): Promise<string> {
  try {
    const response = await seoFetch(full ? "llms-full.txt" : "llms.txt")
    const text = await response.text()
    if (!text.trim() || /<\/?(?:html|script|!doctype)/iu.test(text)) return FALLBACK
    return normalizeSeoUrls(text)
  } catch { return FALLBACK }
}
