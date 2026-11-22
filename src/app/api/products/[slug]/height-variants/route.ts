import { getProductHeightVariants } from "@/lib/api/product-height-variants"
import { getProductBySlug } from "@/lib/api/products"

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const product = await getProductBySlug(slug)
    if (!product || product.isActive !== true) return Response.json({ error: "Товар не знайдено" }, { status: 404 })
    return Response.json(await getProductHeightVariants(product), {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=300" },
    })
  } catch {
    return Response.json({ error: "Не вдалося завантажити висоти" }, { status: 503 })
  }
}
