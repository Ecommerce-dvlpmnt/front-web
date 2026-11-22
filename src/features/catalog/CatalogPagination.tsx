import Link from "next/link"

import { Button } from "@/components/ui/button"
import { getCatalogHref } from "@/features/catalog/navigation"

interface CatalogPaginationProps {
  pageNumber: number
  totalPages: number
  categorySlug?: string
  searchQuery?: string
}

export function CatalogPagination({ pageNumber, totalPages, categorySlug, searchQuery }: CatalogPaginationProps) {
  if (totalPages <= 1) return null
  const href = (page: number) => getCatalogHref({ categorySlug, searchQuery, pageNumber: page })
  const pages = [...new Set([1, pageNumber - 1, pageNumber, pageNumber + 1, totalPages])]
    .filter((page) => page > 0 && page <= totalPages)
    .sort((a, b) => a - b)

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Сторінки каталогу">
      {pageNumber > 1 && (
        <Button variant="outline" asChild>
          <Link href={href(pageNumber - 1)} prefetch={false} rel="prev">Попередня</Link>
        </Button>
      )}
      {pages.map((page, index) => (
        <span className="inline-flex items-center gap-2" key={page}>
          {index > 0 && page > pages[index - 1] + 1 && <span className="px-1 text-muted-foreground" aria-hidden="true">…</span>}
          {page === pageNumber ? (
            <span className="flex size-9 items-center justify-center rounded-lg bg-foreground text-sm font-medium text-background" aria-current="page" aria-label={`Сторінка ${page}`}>
              {page}
            </span>
          ) : (
            <Button variant="outline" size="icon" asChild>
              <Link href={href(page)} prefetch={false} aria-label={`Сторінка ${page}`}>{page}</Link>
            </Button>
          )}
        </span>
      ))}
      {pageNumber < totalPages && (
        <Button variant="outline" asChild>
          <Link href={href(pageNumber + 1)} prefetch={false} rel="next">Наступна</Link>
        </Button>
      )}
    </nav>
  )
}
