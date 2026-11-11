"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"

export default function AdminProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4 py-16 text-center">
      <div role="alert">
        <p className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          Адмін-панель
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Не вдалося завантажити товари
        </h1>
        <p className="mt-4 text-muted-foreground">
          Перевірте з’єднання з backend та спробуйте ще раз.
        </p>
        <Button className="mt-7" onClick={() => reset()}>
          Спробувати ще раз
        </Button>
      </div>
    </div>
  )
}
