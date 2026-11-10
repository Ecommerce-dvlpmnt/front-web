import Link from "next/link"

import { cn } from "@/lib/utils"

interface PaginationProps {
  page: number
  totalPages: number
}

const linkClass =
  "rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
const disabledClass = "pointer-events-none opacity-40"

export function Pagination({ page, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null

  const hasPrev = page > 1
  const hasNext = page < totalPages

  return (
    <nav
      aria-label="Пагінація"
      className="mt-10 flex items-center justify-center gap-4"
    >
      {hasPrev ? (
        <Link href={`/?page=${page - 1}#catalog`} className={linkClass}>
          Назад
        </Link>
      ) : (
        <span className={cn(linkClass, disabledClass)}>Назад</span>
      )}

      <span className="text-sm text-muted-foreground">
        {page} / {totalPages}
      </span>

      {hasNext ? (
        <Link href={`/?page=${page + 1}#catalog`} className={linkClass}>
          Далі
        </Link>
      ) : (
        <span className={cn(linkClass, disabledClass)}>Далі</span>
      )}
    </nav>
  )
}