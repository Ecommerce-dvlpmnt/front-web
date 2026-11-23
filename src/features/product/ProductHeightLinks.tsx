import Link from "next/link"

import type { ProductHeightVariant } from "@/features/product/height-variants"
import { formatPrice } from "@/lib/formatters/price"
import { cn } from "@/lib/utils"

function formatSizesCount(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return `${count} розмір`
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return `${count} розміри`
  return `${count} розмірів`
}

export function ProductHeightLinks({
  variants,
  productId,
}: {
  variants: ProductHeightVariant[]
  productId: string
}) {
  if (variants.length < 2) return null

  const currentVariant = variants.find((v) => v.id === productId)

  return (
    <nav className="mt-5 border-t border-border/70 pt-4" aria-label="Вибір висоти">
      <div className="flex items-center justify-between text-xs mb-2.5">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/90">
          <span className="inline-block size-1.5 rounded-full bg-[#D4AF37]" aria-hidden="true" />
          Доступна висота:
          {currentVariant && (
            <span className="font-bold text-foreground ml-0.5">{currentVariant.height}</span>
          )}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {formatSizesCount(variants.length)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const selected = variant.id === productId
          return (
            <Link
              key={variant.id}
              href={`/product/${encodeURIComponent(variant.slug)}`}
              prefetch={false}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "group relative inline-flex items-baseline gap-2 rounded-full border px-3.5 py-1.5 text-xs transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
                selected
                  ? "border-[#D4AF37] bg-[#D4AF37]/12 text-foreground font-semibold shadow-xs ring-1 ring-[#D4AF37]/60"
                  : "border-border/80 bg-background/80 text-muted-foreground hover:border-[#D4AF37]/60 hover:text-foreground hover:bg-muted/40"
              )}
            >
              <span
                className={cn(
                  "font-semibold text-xs leading-tight",
                  selected ? "text-foreground" : "text-foreground/90"
                )}
              >
                {variant.height}
              </span>
              <span
                className={cn(
                  "text-xs leading-tight tabular-nums",
                  selected
                    ? "text-[#8C5E14] dark:text-[#F3D078] font-medium"
                    : "text-muted-foreground"
                )}
              >
                {formatPrice(variant.price)}
              </span>
              {variant.stock <= 0 && (
                <span className="text-[10px] text-muted-foreground italic">(немає)</span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
