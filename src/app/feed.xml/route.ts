import { getProducts } from "@/lib/api/products"
import { getSiteOrigin } from "@/lib/config/site"
import { generateGoogleFeed } from "@/features/catalog/google-feed"

export async function GET(): Promise<Response> {
  // The public API caps pages at 100; this loader rejects incomplete catalogs.
  const products = await getProducts({ pageSize: 100, includeDetails: true })

  return new Response(generateGoogleFeed(products, getSiteOrigin(), process.env.API_URL), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  })
}
