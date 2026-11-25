import Link from "next/link"

import { getOptionColorBackground, getOptionTarget, getProductOptionModel } from "@/features/product/variant-options"
import { cn } from "@/lib/utils"
import type { Product } from "@/types/product"

interface ProductOptionControlsProps {
  product: Product
  options: Product[]
  onSelect?: (product: Product) => void
  compact?: boolean
}

export function ProductOptionControls({ product, options, onSelect, compact = false }: ProductOptionControlsProps) {
  const current = getProductOptionModel(product)
  if (!current || options.length === 0) return null

  const dimensions = [...new Set(options.map((option) => getProductOptionModel(option)?.dimension).filter((value): value is string => Boolean(value)))]
  const colors = [...new Set(options.map((option) => getProductOptionModel(option)?.color).filter((value): value is string => Boolean(value)))]
  const dimensionLabel = current.dimensionLabel

  function optionControl(target: Product, label: string, children: React.ReactNode, className: string) {
    const selected = target.id === product.id
    if (onSelect) return (
      <button key={label} type="button" onClick={() => onSelect(target)} aria-label={label} aria-pressed={selected}
        title={label} className={className}>{children}</button>
    )
    return (
      <Link key={label} href={`/product/${encodeURIComponent(target.slug)}`} prefetch={false}
        aria-label={label} aria-current={selected ? "page" : undefined} title={label} className={className}>{children}</Link>
    )
  }

  return (
    <div className={cn(compact ? "mt-2.5 space-y-2" : "mt-5 space-y-4 border-t border-border/70 pt-4")}>
      {dimensions.length > 0 && (
        <div role="group" aria-label={`Вибір: ${dimensionLabel.toLocaleLowerCase("uk-UA")}`}>
          {!compact && <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/90">{dimensionLabel}</p>}
          <div className="flex flex-wrap gap-1.5">
            {dimensions.map((dimension) => {
              const target = getOptionTarget(options, product, "dimension", dimension)
              if (!target) return null
              const selected = current.dimension === dimension
              return optionControl(target, `${dimensionLabel} ${dimension}${target.stock <= 0 ? ", немає в наявності" : ""}`,
                <>{dimension}{target.stock <= 0 && <span className="sr-only"> — немає в наявності</span>}</>,
                cn("rounded-md border px-2 py-1 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  selected ? "border-gold bg-gold/15 font-semibold text-foreground" : "border-border bg-muted/40 text-muted-foreground hover:border-gold/50 hover:text-foreground"))
            })}
          </div>
        </div>
      )}
      {colors.length > 1 && (
        <div role="group" aria-label="Вибір кольору">
          {!compact && <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/90">Колір світіння</p>}
          <div className="flex flex-wrap items-center gap-2">
            {colors.map((color) => {
              const target = getOptionTarget(options, product, "color", color)
              if (!target) return null
              const selected = current.color === color
              return optionControl(target, `Колір ${color}`,
                <span className="block size-4 rounded-full border border-foreground/25" style={{ background: getOptionColorBackground(target) ?? "#F4F8FF" }} aria-hidden="true" />,
                cn("inline-flex size-7 items-center justify-center rounded-full border bg-background outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  selected ? "border-gold ring-1 ring-gold/70" : "border-border hover:border-gold/60"))
            })}
          </div>
        </div>
      )}
    </div>
  )
}
