"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"

export function AdminNavigation({ name }: { name: string }) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function signOut() {
    setIsSigningOut(true)
    await fetch("/api/admin/auth/logout", { method: "POST" })
    router.replace("/admin/login")
    router.refresh()
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-4 text-sm font-medium" aria-label="Адмін-навігація">
          <Link href="/admin/products" className="hover:underline">Товари</Link>
          <Link href="/admin/orders" className="hover:underline">Замовлення</Link>
          <Link href="/admin/analytics" className="hover:underline">Аналітика</Link>
          <Link href="/admin/suppliers" className="hover:underline">Постачальники</Link>
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">{name}</span>
          <Button type="button" variant="outline" size="sm" disabled={isSigningOut} onClick={signOut}>
            {isSigningOut ? "Вихід…" : "Вийти"}
          </Button>
        </div>
      </div>
    </header>
  )
}
