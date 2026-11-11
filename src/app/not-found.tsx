import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="bg-background">
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4 py-16 text-center">
        <div>
          <p className="text-sm font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Сторінку не знайдено
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Схоже, цього товару більше немає
          </h1>
          <p className="mt-4 text-muted-foreground">
            Поверніться до каталогу, щоб переглянути доступні товари.
          </p>
          <Button className="mt-7" asChild>
            <Link href="/#catalog">До каталогу</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
