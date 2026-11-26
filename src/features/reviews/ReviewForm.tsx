"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { submitReview } from "@/lib/api/reviews-client"

export function ReviewForm({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError("")
    try {
      await submitReview({ productId, authorName: String(data.get("authorName") ?? ""), rating: Number(data.get("rating")),
        comment: String(data.get("comment") ?? ""), pros: String(data.get("pros") ?? ""), cons: String(data.get("cons") ?? ""), honeypot: String(data.get("honeypot") ?? "") })
      setSubmitted(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не вдалося надіслати відгук")
    } finally { setBusy(false) }
  }

  if (submitted) return <p role="status" className="rounded-xl border border-border bg-muted p-4 text-sm">Дякуємо! Відгук надіслано й буде опубліковано після перевірки модератором.</p>
  return <div className="space-y-4">
    <Button type="button" variant="outline" aria-expanded={open} aria-controls="review-form" onClick={() => setOpen(!open)}>{open ? "Закрити форму" : "Залишити відгук"}</Button>
    {open && <form id="review-form" onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <h3 className="font-semibold">Залишити відгук</h3>
      <label className="block space-y-1 text-sm"><span>Ваше ім’я</span><Input name="authorName" autoComplete="name" required minLength={2} maxLength={80} disabled={busy} /></label>
      <label className="block space-y-1 text-sm"><span>Оцінка</span><select name="rating" defaultValue="5" disabled={busy} className="h-10 w-full rounded-md border border-border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring">{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} з 5</option>)}</select></label>
      <label className="block space-y-1 text-sm"><span>Коментар</span><textarea name="comment" required minLength={3} maxLength={500} rows={4} disabled={busy} className="w-full rounded-md border border-border bg-background p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
      <label className="block space-y-1 text-sm"><span>Переваги (необов’язково)</span><Input name="pros" maxLength={250} disabled={busy} /></label>
      <label className="block space-y-1 text-sm"><span>Недоліки (необов’язково)</span><Input name="cons" maxLength={250} disabled={busy} /></label>
      <div hidden aria-hidden="true"><label>Website<Input name="honeypot" tabIndex={-1} autoComplete="off" /></label></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={busy}>{busy ? "Надсилання…" : "Надіслати відгук"}</Button>
      <p className="text-xs text-muted-foreground">Відгуки з’являються після модерації.</p>
    </form>}
  </div>
}
