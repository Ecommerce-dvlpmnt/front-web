import Link from "next/link"

import type { ProductHeightVariant } from "@/features/product/height-variants"
import { formatPrice } from "@/lib/formatters/price"
import { cn } from "@/lib/utils"

export function ProductHeightLinks({ variants, productId }: { variants: ProductHeightVariant[]; productId: string }) {
  if (variants.length < 2) return null
  return (
    <nav className="mt-6 rounded-2xl border border-border/80 bg-muted/30 p-4 shadow-xs sm:p-5" aria-label="Вибір висоти">
      <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Доступні розміри (висота)</p>
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {variants.map((variant) => {
          const selected = variant.id === productId
          return (
            <Link
              key={variant.id}
              href={`/product/${encodeURIComponent(variant.slug)}`}
              prefetch={false}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected ? "border-gold bg-gold/15 ring-2 ring-gold/60" : "border-border bg-background/80 hover:border-gold/60 hover:bg-muted/60"
              )}
            >
              {selected && <span className="absolute -top-2 right-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">Обрано</span>}
              <span className="text-sm font-semibold text-foreground">{variant.height}</span>
              <span className="mt-0.5 text-xs text-muted-foreground">{formatPrice(variant.price)}</span>
              {variant.stock <= 0 && <span className="mt-1 text-xs text-muted-foreground">Немає в наявності</span>}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
