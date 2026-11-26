"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ReviewStars } from "@/components/product/ReviewStars"
import { filterAdminReviews, reviewDate, reviewStatusLabels } from "@/features/reviews/review-utils"
import { removeReview, updateReviewStatus } from "@/lib/api/admin/reviews"
import { reviewStatuses, type AdminReview, type ReviewStatus } from "@/types/review"

const PAGE_SIZE = 20

export function ReviewsAdmin({ initialReviews }: { initialReviews: AdminReview[] }) {
  const router = useRouter()
  const [reviews, setReviews] = useState(initialReviews)
  const [status, setStatus] = useState<ReviewStatus | "all">("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null)
  const filtered = filterAdminReviews(reviews, status, search)
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pages)
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  async function act(review: AdminReview, action: "delete" | ReviewStatus) {
    if (busy) return
    if (action === "delete" && !window.confirm(`Видалити відгук від ${review.authorName}? Цю дію неможливо скасувати.`)) return
    setBusy(review.id)
    setNotice(null)
    try {
      if (action === "delete") {
        await removeReview(review.id)
        setReviews((items) => items.filter((item) => item.id !== review.id))
      } else {
        const updated = await updateReviewStatus(review.id, action)
        setReviews((items) => items.map((item) => item.id === review.id ? { ...item, ...updated } : item))
      }
      setNotice({ error: false, text: action === "delete" ? "Відгук видалено." : action === "Approved" ? "Відгук схвалено." : "Відгук відхилено." })
      router.refresh()
    } catch (error) { setNotice({ error: true, text: error instanceof Error ? error.message : "Не вдалося виконати дію" }) }
    finally { setBusy(null) }
  }

  return <div className="space-y-6">
    <div><p className="text-sm text-muted-foreground">Адміністрування</p><h1 className="mt-1 text-3xl font-semibold">Відгуки</h1><p className="mt-2 text-sm text-muted-foreground">На модерації: {reviews.filter((review) => review.status === "Pending").length}. Усього: {reviews.length}.</p></div>
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row">
      <Input aria-label="Пошук відгуків за товаром, артикулом або автором" placeholder="Товар, артикул або автор…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
      <select aria-label="Статус відгуків" value={status} onChange={(event) => { setStatus(event.target.value as ReviewStatus | "all"); setPage(1) }} className="h-10 rounded-md border border-border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <option value="all">Усі</option>{reviewStatuses.map((status) => <option key={status} value={status}>{reviewStatusLabels[status]}</option>)}
      </select>
    </div>
    {notice && <div role={notice.error ? "alert" : "status"} className={`fixed bottom-5 right-5 z-50 max-w-[calc(100vw-2.5rem)] rounded-xl border bg-card p-4 shadow-lg ${notice.error ? "border-destructive" : "border-border"}`}><p className="text-sm">{notice.text}</p><Button variant="ghost" size="sm" onClick={() => setNotice(null)} aria-label="Закрити сповіщення">Закрити</Button></div>}
    {!visible.length ? <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">Відгуків за цими умовами немає.</p> : <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[850px] text-left text-sm"><caption className="sr-only">Відгуки покупців та дії модерації</caption><thead className="bg-muted"><tr>{["Товар", "Автор / оцінка", "Відгук", "Дата / статус", "Дії"].map((heading) => <th key={heading} scope="col" className="p-4 font-medium">{heading}</th>)}</tr></thead>
        <tbody>{visible.map((review) => <tr key={review.id} className="border-t border-border align-top">
          <td className="max-w-60 p-4">{review.productSlug ? <Link href={`/product/${encodeURIComponent(review.productSlug)}`} className="font-medium underline-offset-4 hover:underline focus-visible:outline-2">{review.productName || "Товар"}</Link> : <span>{review.productName || "Товар видалено"}</span>}<p className="mt-1 text-xs text-muted-foreground">{review.productSku || "Артикул недоступний"}</p></td>
          <td className="space-y-2 p-4"><p>{review.authorName}</p><ReviewStars rating={review.rating} /></td>
          <td className="max-w-sm space-y-2 break-words p-4"><p className="whitespace-pre-wrap">{review.comment}</p>{review.pros && <p><strong>Переваги: </strong>{review.pros}</p>}{review.cons && <p><strong>Недоліки: </strong>{review.cons}</p>}{review.adminComment && <p className="text-muted-foreground">Внутрішній коментар: {review.adminComment}</p>}</td>
          <td className="space-y-2 p-4"><time dateTime={review.createdAt}>{reviewDate(review.createdAt)}</time><div><Badge variant="outline">{reviewStatusLabels[review.status]}</Badge></div></td>
          <td className="p-4"><div className="flex flex-col items-stretch gap-2"><Button size="sm" disabled={busy !== null || review.status === "Approved"} onClick={() => act(review, "Approved")}>Одобрити</Button><Button size="sm" variant="outline" disabled={busy !== null || review.status === "Rejected"} onClick={() => act(review, "Rejected")}>Відхилити</Button><Button size="sm" variant="destructive" disabled={busy !== null} onClick={() => act(review, "delete")}>{busy === review.id ? "Обробка…" : "Видалити"}</Button></div></td>
        </tr>)}</tbody>
      </table>
    </div>}
    <div className="flex items-center justify-between gap-3"><Button variant="outline" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Назад</Button><span className="text-sm text-muted-foreground">Сторінка {currentPage} із {pages} · Знайдено: {filtered.length}</span><Button variant="outline" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Далі</Button></div>
  </div>
}
