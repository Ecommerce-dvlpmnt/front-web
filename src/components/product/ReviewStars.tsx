import { Star } from "lucide-react"

export function ReviewStars({ rating }: { rating: number }) {
  return <span className="inline-flex gap-0.5 text-gold" role="img" aria-label={`${rating.toFixed(1)} з 5 зірок`}>
    {[1, 2, 3, 4, 5].map((star) => <Star key={star} aria-hidden="true" className={`size-4 ${star <= Math.round(rating) ? "fill-current" : "text-muted-foreground/40"}`} />)}
  </span>
}
