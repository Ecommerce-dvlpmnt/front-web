"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"

interface CatalogErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export function CatalogError({ error, reset }: CatalogErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-2xl items-center justify-center px-4 py-16 text-center">
      <div role="alert">
        <p className="text-sm font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Каталог тимчасово недоступний
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Не вдалося завантажити товари
        </h1>
        <p className="mt-4 text-muted-foreground">
          Перевірте з’єднання та спробуйте ще раз. Якщо проблема повторюється,
          поверніться трохи пізніше.
        </p>
        <Button className="mt-7" onClick={() => reset()}>
          Спробувати ще раз
        </Button>
      </div>
    </div>
  )
}
