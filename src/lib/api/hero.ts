import { getCategories } from "@/lib/api/categories"
import { getHeroProductCandidates } from "@/lib/api/products"
import { heroSlides, type HeroProductCandidate, type HeroSlide } from "@/lib/config/shop"
import { formatPrice } from "@/lib/formatters/price"

function resolveHeroImageUrl(value: string): string | null {
  const raw = value.trim()
  if (!raw) return null

  try {
    if (/^https?:\/\//i.test(raw)) return new URL(raw).href
    if (!raw.startsWith("/") && !raw.startsWith("uploads/")) return null

    const apiUrl = process.env.API_URL
    if (!apiUrl) return null

    const origin = new URL(apiUrl).origin
    return new URL(raw.replace(/^\/?/, "/"), origin).href
  } catch {
    return null
  }
}

export async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    const categories = await getCategories()
    return await Promise.all(heroSlides.map(async (slide): Promise<HeroSlide> => {
      const category = categories.find((item) => item.slug === slide.categorySlug)
      if (!category) return slide

      try {
        const products = await getHeroProductCandidates(category.id)
        const candidates: HeroProductCandidate[] = products.flatMap((product) => {
          const image = resolveHeroImageUrl(product.mainImageUrl)
          if (!image) return []

          return [{
            id: product.id,
            image,
            imageAlt: product.name,
            title: product.name,
            subtitle: [product.categoryName, product.sku].filter(Boolean).join(" · "),
            price: formatPrice(product.price),
            href: `/product/${encodeURIComponent(product.slug)}`,
          }]
        })
        if (candidates.length === 0) return slide

        const first = candidates[0]
        return {
          ...slide,
          image: first.image,
          imageAlt: first.imageAlt,
          card: {
            tag: slide.card.tag,
            title: first.title,
            subtitle: first.subtitle,
            price: first.price,
            href: first.href,
          },
          candidates,
        }
      } catch {
        return slide
      }
    }))
  } catch {
    return heroSlides
  }
}
