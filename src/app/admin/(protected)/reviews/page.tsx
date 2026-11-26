import type { Metadata } from "next"
import { ReviewsAdmin } from "@/components/admin/reviews/ReviewsAdmin"
import { getAdminReviewsWithProducts } from "@/lib/api/admin/reviews-server"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Відгуки — адмін-панель", robots: { index: false, follow: false } }

export default async function AdminReviewsPage() {
  const reviews = await getAdminReviewsWithProducts()
  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><ReviewsAdmin initialReviews={reviews} /></div>
}
