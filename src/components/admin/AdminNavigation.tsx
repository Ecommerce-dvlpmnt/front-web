"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"

export function AdminNavigation({ name, pendingReviews = 0 }: { name: string; pendingReviews?: number }) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function signOut() {
    setIsSigningOut(true)
    await fetch("/api/admin/auth/logout", { method: "POST" })
    router.replace("/admin/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/85 bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium" aria-label="Адмін-навігація">
          <Link href="/admin/products" className="rounded-full px-3 py-1.5 text-foreground/85 outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">Товари</Link>
          <Link href="/admin/orders" className="rounded-full px-3 py-1.5 text-foreground/85 outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">Замовлення</Link>
          <Link href="/admin/analytics" className="rounded-full px-3 py-1.5 text-foreground/85 outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">Аналітика</Link>
          <Link href="/admin/reviews" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-foreground/85 outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">Відгуки{pendingReviews > 0 && <span aria-label={`${pendingReviews} на модерації`} className="rounded-full bg-[#D4AF37] px-2 py-0.5 text-[11px] font-bold text-[#0B0F0E]">{pendingReviews}</span>}</Link>
          <Link href="/admin/suppliers" className="rounded-full px-3 py-1.5 text-foreground/85 outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">Постачальники</Link>
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-medium text-muted-foreground sm:inline">{name}</span>
          <Button type="button" variant="outline" size="sm" className="h-8 rounded-full px-3.5 text-xs font-medium" disabled={isSigningOut} onClick={signOut}>
            {isSigningOut ? "Вихід…" : "Вийти"}
          </Button>
        </div>
      </div>
    </header>
  )
}
