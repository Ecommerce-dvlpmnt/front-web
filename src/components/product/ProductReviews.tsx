import { ReviewForm } from "@/features/reviews/ReviewForm"
import { reviewDate } from "@/features/reviews/review-utils"
import { ReviewStars } from "@/components/product/ReviewStars"
import type { ProductReviewsSummary } from "@/types/review"

export function ProductReviews({ summary, unavailable = false }: { summary: ProductReviewsSummary; unavailable?: boolean }) {
  return <section id="reviews-section" className="mt-12 space-y-5 border-t border-border pt-8" aria-labelledby="reviews-heading">
    <h2 id="reviews-heading" className="text-2xl font-semibold">Відгуки покупців</h2>
    {summary.totalReviews > 0 && summary.averageRating > 0 ? <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
      <ReviewStars rating={summary.averageRating} /><strong>{summary.averageRating.toFixed(1)} / 5</strong><span className="text-sm text-muted-foreground">Відгуків: {summary.totalReviews}</span>
    </div> : !unavailable && <p className="text-sm text-muted-foreground">Відгуків поки немає. Поділіться першими враженнями.</p>}
    {unavailable && <p role="status" className="text-sm text-muted-foreground">Не вдалося завантажити список відгуків. Спробуйте оновити сторінку пізніше.</p>}
    <div className="grid gap-4 md:grid-cols-2">
      {summary.reviews.map((review) => <article key={review.id} className="min-w-0 space-y-3 rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{review.authorName}</h3><time dateTime={review.createdAt} className="text-xs text-muted-foreground">{reviewDate(review.createdAt)}</time></div>
        <ReviewStars rating={review.rating} />
        <p className="whitespace-pre-wrap break-words text-sm">{review.comment}</p>
        {review.pros && <p className="break-words text-sm"><strong>Переваги: </strong>{review.pros}</p>}
        {review.cons && <p className="break-words text-sm"><strong>Недоліки: </strong>{review.cons}</p>}
      </article>)}
    </div>
    <ReviewForm productId={summary.productId} />
  </section>
}
