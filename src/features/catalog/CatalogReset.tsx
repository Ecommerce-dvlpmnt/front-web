"use client"

export function CatalogReset({ categorySlug }: { categorySlug?: string }) {
  return (
    <button
      type="button"
      className="text-xs font-medium text-[#8C5E14] underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-[#F3D078]"
      onClick={() => window.dispatchEvent(new CustomEvent("catalog-reset", { detail: { categorySlug } }))}
    >
      Скинути все
    </button>
  )
}
