"use client"

import { useState } from "react"
import { CheckCircle2, MessageSquarePlus, Star, ThumbsUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  formatReviewsDeclension,
  getProductRating,
  getProductReviews,
  type Review,
  saveProductReview,
} from "@/lib/reviews/reviews-store"

interface ProductReviewsProps {
  productId: string
  productName: string
  categorySlug?: string
}

export function ProductReviews({
  productId,
  productName,
  categorySlug = "",
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>(() =>
    getProductReviews(productId, productName, categorySlug)
  )
  const [ratingInfo, setRatingInfo] = useState(() =>
    getProductRating(productId)
  )

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [author, setAuthor] = useState("")
  const [pros, setPros] = useState("")
  const [cons, setCons] = useState("")
  const [comment, setComment] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>({})

  const starLabels: Record<number, string> = {
    1: "Дуже погано",
    2: "Погано",
    3: "Нормально",
    4: "Добре",
    5: "Відмінно, рекомендую!",
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    const newReview = saveProductReview(productId, {
      author: author.trim() || "Покупець",
      rating,
      pros: pros.trim() || undefined,
      cons: cons.trim() || undefined,
      comment: comment.trim(),
    })

    setReviews((prev) => [newReview, ...prev])
    setRatingInfo(getProductRating(productId))
    setIsSubmitted(true)
    setAuthor("")
    setPros("")
    setCons("")
    setComment("")
    setRating(5)

    setTimeout(() => {
      setIsSubmitted(false)
      setIsFormOpen(false)
    }, 2500)
  }

  const handleHelpful = (id: string) => {
    setHelpfulCounts((prev) => ({
      ...prev,
      [id]: (prev[id] ?? 0) + 1,
    }))
  }

  return (
    <div id="reviews-section" className="mx-auto max-w-3xl space-y-6">
      {/* Зведена плашка рейтингу в один стовпець */}
      <div className="flex flex-col gap-5 rounded-2xl border border-border/80 bg-card p-5 shadow-luxury sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {ratingInfo.score.toFixed(1)}
            </span>
            <span className="text-[11px] text-muted-foreground">з 5.0 балів</span>
          </div>

          <div className="space-y-1 border-l border-border/70 pl-4">
            <div className="flex items-center gap-0.5 text-[#F59E0B] dark:text-[#FBBF24]">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`size-4 ${
                    i < Math.round(ratingInfo.score)
                      ? "fill-current"
                      : "text-muted-foreground/30 fill-muted-foreground/15"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              На основі <strong className="font-semibold text-foreground">{ratingInfo.count}</strong> {formatReviewsDeclension(ratingInfo.count)} покупців
            </p>
            <p className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              98% покупців рекомендують цей виріб
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => setIsFormOpen((prev) => !prev)}
          className="h-9.5 rounded-full border-0 bg-foreground px-5 text-xs font-semibold tracking-wider uppercase text-background shadow-xs hover:bg-foreground/90 cursor-pointer"
        >
          <MessageSquarePlus className="mr-2 size-4" />
          {isFormOpen ? "Закрити форму" : "Написати відгук"}
        </Button>
      </div>

      {/* Форма додавання відгуку: чітко в один вертикальний стовпець */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-border/90 bg-muted/30 p-5 sm:p-6 animate-in fade-in duration-300"
        >
          <div className="border-b border-border/70 pb-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Залишити відгук про «{productName}»
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Ваш відгук допоможе іншим обрати ідеальний святковий декор
            </p>
          </div>

          {/* 1. Оцінка зірочками */}
          <div>
            <label className="block text-xs font-semibold text-foreground">
              Ваша оцінка товару:
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isFilled =
                    (hoverRating !== null ? hoverRating : rating) >= starValue
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-0.5 text-[#F59E0B] dark:text-[#FBBF24] transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                      aria-label={`Оцінити на ${starValue} з 5`}
                    >
                      <Star
                        className={`size-6 ${
                          isFilled ? "fill-current" : "text-muted-foreground/30 fill-muted-foreground/15"
                        }`}
                      />
                    </button>
                  )
                })}
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {starLabels[hoverRating !== null ? hoverRating : rating]}
              </span>
            </div>
          </div>

          {/* 2. Ім'я покупця */}
          <div>
            <label htmlFor="review-author" className="block text-xs font-semibold text-foreground">
              Ваше ім&apos;я: *
            </label>
            <Input
              id="review-author"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Наприклад: Олена або Олексій"
              className="mt-1.5 h-10 rounded-xl bg-background text-sm"
            />
          </div>

          {/* 3. Переваги (Плюси) */}
          <div>
            <label htmlFor="review-pros" className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="flex size-4 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-bold">
                +
              </span>
              <span>Переваги (плюси):</span>
            </label>
            <Input
              id="review-pros"
              value={pros}
              onChange={(e) => setPros(e.target.value)}
              placeholder="Що найбільше сподобалося (пишність, відсутність запаху, збірка тощо)"
              className="mt-1.5 h-10 rounded-xl bg-background text-sm"
            />
          </div>

          {/* 4. Недоліки (Мінуси) */}
          <div>
            <label htmlFor="review-cons" className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
              <span className="flex size-4 items-center justify-center rounded-full bg-rose-500/15 text-[11px] font-bold">
                −
              </span>
              <span>Недоліки (мінуси):</span>
            </label>
            <Input
              id="review-cons"
              value={cons}
              onChange={(e) => setCons(e.target.value)}
              placeholder="Що можна було б покращити (або «Не виявлено»)"
              className="mt-1.5 h-10 rounded-xl bg-background text-sm"
            />
          </div>

          {/* 5. Коментар / Текст відгуку */}
          <div>
            <label htmlFor="review-comment" className="block text-xs font-semibold text-foreground">
              Ваш коментар: *
            </label>
            <textarea
              id="review-comment"
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Опишіть ваші враження від виробу, пакування чи доставки..."
              className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {isSubmitted ? (
            <div className="rounded-xl bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              ✓ Дякуємо! Ваш відгук успішно опубліковано і додано до списку.
            </div>
          ) : (
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsFormOpen(false)}
                className="rounded-full text-xs"
              >
                Скасувати
              </Button>
              <Button
                type="submit"
                className="rounded-full bg-foreground px-5 text-xs font-semibold uppercase tracking-wider text-background hover:bg-foreground/90 cursor-pointer"
              >
                Опублікувати відгук
              </Button>
            </div>
          )}
        </form>
      )}

      {/* Стрічка відгуків: строго в один стовпець */}
      <div className="space-y-4">
        {reviews.map((rev) => (
          <article
            key={rev.id}
            className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-colors hover:border-foreground/20"
          >
            {/* Верхній рядок: Автор + Бейдж + Дата */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">
                  {rev.author}
                </span>
                {rev.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-3" />
                    Перевірений покупець
                  </span>
                )}
              </div>

              <span className="text-xs text-muted-foreground">{rev.date}</span>
            </div>

            {/* Зірочки рейтингу */}
            <div className="mt-2 flex items-center gap-1 text-[#F59E0B] dark:text-[#FBBF24]">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`size-3.5 ${
                    i < rev.rating
                      ? "fill-current"
                      : "text-muted-foreground/30 fill-muted-foreground/15"
                  }`}
                />
              ))}
            </div>

            {/* Плюси (Переваги) */}
            {rev.pros && (
              <div className="mt-3 flex items-start gap-2 text-xs">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  +
                </span>
                <div className="leading-relaxed">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">Переваги: </span>
                  <span className="text-foreground/90">{rev.pros}</span>
                </div>
              </div>
            )}

            {/* Мінуси (Недоліки) */}
            {rev.cons && (
              <div className="mt-2 flex items-start gap-2 text-xs">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  −
                </span>
                <div className="leading-relaxed">
                  <span className="font-semibold text-rose-700 dark:text-rose-400">Недоліки: </span>
                  <span className="text-foreground/90">{rev.cons}</span>
                </div>
              </div>
            )}

            {/* Основний коментар */}
            {rev.comment && (
              <p className="mt-3 text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                {rev.comment}
              </p>
            )}

            {/* Відповідь магазину / адміністрації */}
            {rev.adminComment && (
              <div className="mt-3 rounded-xl border border-border/70 bg-muted/40 p-3.5 text-xs text-foreground/90">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <span className="size-2 rounded-full bg-[#C8923A] dark:bg-[#D4AF37]" />
                  <span>Відповідь магазину Jingle Decor</span>
                </div>
                <p className="mt-1 text-muted-foreground leading-relaxed">
                  {rev.adminComment}
                </p>
              </div>
            )}

            {/* Кнопка корисності */}
            <div className="mt-4 flex items-center justify-end border-t border-border/50 pt-2.5">
              <button
                type="button"
                onClick={() => handleHelpful(rev.id)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              >
                <ThumbsUp className="size-3.5" />
                <span>Відгук корисний</span>
                {helpfulCounts[rev.id] ? (
                  <span className="font-semibold">({helpfulCounts[rev.id]})</span>
                ) : null}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
