import { renderOpenGraphImage } from "@/lib/seo/opengraph-image"

export const revalidate = 86400

export function GET() {
  return renderOpenGraphImage()
}
