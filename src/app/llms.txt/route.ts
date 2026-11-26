import { getLlmsText } from "@/lib/api/seo"

export const revalidate = 300

export async function GET() {
  return new Response(await getLlmsText(), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  })
}
