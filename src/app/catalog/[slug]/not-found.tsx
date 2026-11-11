import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function CategoryNotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-2xl items-center justify-center px-4 py-16 text-center">
      <div>
        <p className="text-sm font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Категорію не знайдено
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Схоже, цієї категорії більше немає
        </h1>
        <p className="mt-4 text-muted-foreground">
          Поверніться до каталогу, щоб переглянути всі доступні товари.
        </p>
        <Button className="mt-7" asChild>
          <Link href="/#catalog">До каталогу</Link>
        </Button>
      </div>
    </div>
  )
}
