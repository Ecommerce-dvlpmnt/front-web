
export type ProductBadge = "sale" | "hit" | "new"

export interface ProductVariant {
  id: string
  name: string
  slug: string
  price: number
  oldPrice?: number | null
  height: string
  inStock: boolean
  isCurrent?: boolean
  showOnHomepage?: boolean
  isRecommended?: boolean
  isFeatured?: boolean
}

export interface ProductImage {
  id: string
  url: string
  alt: string | null
  sortOrder: number
}

export interface Product {
  reviewCount?: number
  averageRating?: number | null
  id: string
  slug: string
  name: string
  price: number
  dropPrice?: number
  oldPrice?: number | null
  stock: number
  mainImageUrl: string
  categoryId?: string
  categoryName?: string | null
  description?: string | null
  sku?: string
  attributes?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  weightKg?: number | null
  supplierId?: string
  isActive?: boolean
  showOnHomepage?: boolean
  isRecommended?: boolean
  isFeatured?: boolean
  createdAt?: string
  updatedAt?: string
  images?: ProductImage[]
  variants?: ProductVariant[]
  categorySlug?: string
  badge?: ProductBadge
}

export interface AdminProduct extends Product {
  categoryId: string
  supplierId: string
  sku: string
  dropPrice: number
  isActive: boolean
}

export interface ProductPage {
  items: Product[]
  totalCount: number
  totalSkuCount?: number
  pageNumber: number
  pageSize: number
  totalPages: number
}
