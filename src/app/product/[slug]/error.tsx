"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"

export default function ProductError({
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
    <div className="mx-auto flex min-h-[50vh] max-w-2xl items-center justify-center px-4 py-16 text-center">
      <div role="alert">
        <p className="text-sm font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Сторінка товару тимчасово недоступна
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Не вдалося завантажити товар
        </h1>
        <p className="mt-4 text-muted-foreground">
          Перевірте з’єднання та спробуйте ще раз трохи пізніше.
        </p>
        <Button className="mt-7" onClick={() => reset()}>
          Спробувати ще раз
        </Button>
      </div>
    </div>
  )
}
