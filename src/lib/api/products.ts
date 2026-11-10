import { apiFetch } from "./client"
import type { Product } from "@/types/product"

export const PAGE_SIZE = 12

const FALLBACK_IMAGE = "https://placehold.co/600x600"

// Только нужные нам поля из ProductDto бэка.
interface ProductDto {
  id: string
  slug: string | null
  name: string | null
  price: number
  oldPrice: number | null
  stock: number
  mainImageUrl: string | null
}

interface ProductsResponse {
  items: ProductDto[] | null
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

function toProduct(dto: ProductDto): Product {
  return {
    id: dto.id,
    slug: dto.slug ?? dto.id,
    name: dto.name ?? "Без назви",
    price: dto.price,
    oldPrice: dto.oldPrice,
    stock: dto.stock,
    mainImageUrl: dto.mainImageUrl || FALLBACK_IMAGE,
    badge: dto.oldPrice && dto.oldPrice > dto.price ? "sale" : undefined,
  }
}

export async function getProducts(page: number) {
  const query = new URLSearchParams({
    PageNumber: String(page),
    PageSize: String(PAGE_SIZE),
    OnlyActive: "true",
  })

  const data = await apiFetch<ProductsResponse>(`/products?${query}`)

  return {
    products: (data.items ?? []).map(toProduct),
    totalPages: Math.max(1, data.totalPages),
  }
}