
export type ProductBadge = "sale" | "hit" | "new"

export interface Product {
  id: string
  slug: string
  name: string
  price: number
  oldPrice?: number | null
  stock: number
  mainImageUrl: string
  categorySlug?: string
  badge?: ProductBadge
}
