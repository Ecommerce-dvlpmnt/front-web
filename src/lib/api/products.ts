import type { Product, ProductImage } from "@/types/product"

import { ApiError, apiFetch } from "@/lib/api/client"

interface ProductImageDto extends ProductImage {
  id: string
  url: string
  alt: string | null
  sortOrder: number
}

interface ProductDto {
  id: string
  categoryId?: string | null
  categoryName?: string | null
  supplierId?: string | null
  sku?: string | null
  name?: string | null
  slug?: string | null
  description?: string | null
  dropPrice?: number | string | null
  price?: number | string | null
  oldPrice?: number | string | null
  stock?: number | string | null
  mainImageUrl?: string | null
  attributes?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  weightKg?: number | string | null
  isActive?: boolean | null
  createdAt?: string
  updatedAt?: string
  images?: ProductImageDto[] | null
}

interface ProductPageDto {
  items: ProductDto[]
  totalCount?: number
  pageNumber?: number
  pageSize?: number
  totalPages?: number
}

interface GetProductsOptions {
  search?: string
  categoryId?: string
  pageSize?: number
}

const DEFAULT_PAGE_SIZE = 100
const PRODUCT_IMAGE_PLACEHOLDER = "/product-placeholder.svg"

const productFetchOptions = {
  next: {
    revalidate: 300,
    tags: ["products"],
  },
}

function isProductImage(value: unknown): value is ProductImageDto {
  if (!value || typeof value !== "object") return false

  const image = value as Record<string, unknown>

  return (
    typeof image.id === "string" &&
    (image.url == null || typeof image.url === "string") &&
    (image.alt == null || typeof image.alt === "string") &&
    (typeof image.sortOrder === "number" || image.sortOrder == null)
  )
}

function isProductDto(value: unknown): value is ProductDto {
  if (!value || typeof value !== "object") return false

  const product = value as Record<string, unknown>

  return (
    typeof product.id === "string" &&
    (typeof product.categoryId === "string" || product.categoryId == null) &&
    (product.categoryName == null || typeof product.categoryName === "string") &&
    (product.sku == null || typeof product.sku === "string") &&
    (product.name == null || typeof product.name === "string") &&
    (product.slug == null || typeof product.slug === "string") &&
    (product.description == null || typeof product.description === "string") &&
    (typeof product.price === "number" || typeof product.price === "string" || product.price == null) &&
    (product.oldPrice == null || typeof product.oldPrice === "number" || typeof product.oldPrice === "string") &&
    (typeof product.stock === "number" || typeof product.stock === "string" || product.stock == null) &&
    (product.mainImageUrl == null || typeof product.mainImageUrl === "string") &&
    (product.attributes == null || typeof product.attributes === "string") &&
    (product.metaTitle == null || typeof product.metaTitle === "string") &&
    (product.metaDescription == null || typeof product.metaDescription === "string") &&
    (product.images == null ||
      (Array.isArray(product.images) && product.images.every(isProductImage)))
  )
}

function isProductPageDto(value: unknown): value is ProductPageDto {
  if (!value || typeof value !== "object") return false

  const page = value as Record<string, unknown>
  const items = page.items ?? page.Items

  return (
    (Array.isArray(items) && items.every(isProductDto)) ||
    (typeof page.totalPages === "number" || typeof page.TotalPages === "number" || page.totalPages == null || page.TotalPages == null)
  )
}

async function getProductsPage(
  options: GetProductsOptions & { pageNumber: number }
): Promise<ProductPageDto> {
  const query = new URLSearchParams({
    OnlyActive: "true",
    PageNumber: String(options.pageNumber),
    PageSize: String(options.pageSize ?? DEFAULT_PAGE_SIZE),
  })

  const search = options.search?.trim()

  if (search) {
    query.set("Search", search)
  }

  if (options.categoryId) {
    query.set("CategoryId", options.categoryId)
  }

  const payload = await apiFetch<unknown>(
    `products?${query.toString()}`,
    {
      next: {
        revalidate: 60,
        tags: ["products"],
      },
    }
  )

  if (Array.isArray(payload)) {
    return {
      items: payload.filter(isProductDto),
      totalCount: payload.length,
      pageNumber: options.pageNumber,
      pageSize: options.pageSize ?? DEFAULT_PAGE_SIZE,
      totalPages: 1,
    }
  }

  if (!isProductPageDto(payload)) {
    throw new Error("Backend returned an invalid products response")
  }

  const raw = payload as unknown as Record<string, unknown>
  const items = ((raw.items ?? raw.Items) as ProductDto[] | null) ?? []
  const totalPages = Number(raw.totalPages ?? raw.TotalPages) || 1
  const totalCount = Number(raw.totalCount ?? raw.TotalCount) || items.length

  return {
    items,
    totalCount,
    pageNumber: options.pageNumber,
    pageSize: options.pageSize ?? DEFAULT_PAGE_SIZE,
    totalPages,
  }
}

function toProductImage(image: ProductImageDto): ProductImage | null {
  const url = image.url?.trim()

  if (!url) return null

  return {
    id: image.id,
    url,
    alt: image.alt ?? null,
    sortOrder: typeof image.sortOrder === "number" ? image.sortOrder : 0,
  }
}

function toProduct(product: ProductDto): Product {
  const oldPrice = product.oldPrice != null ? Number(product.oldPrice) : null
  const price = Number(product.price) || 0
  const stock = Number(product.stock) || 0
  const dropPrice = product.dropPrice != null ? Number(product.dropPrice) : 0

  return {
    id: String(product.id),
    slug: product.slug?.trim() || "",
    name: product.name?.trim() || "Без назви",
    price,
    dropPrice,
    oldPrice,
    stock,
    mainImageUrl: product.mainImageUrl?.trim() || PRODUCT_IMAGE_PLACEHOLDER,
    categoryId: String(product.categoryId || ""),
    categoryName: product.categoryName ?? null,
    description: product.description ?? null,
    sku: product.sku?.trim() || "",
    attributes: product.attributes ?? null,
    metaTitle: product.metaTitle ?? null,
    metaDescription: product.metaDescription ?? null,
    images: (product.images ?? [])
      .map(toProductImage)
      .filter((image): image is ProductImage => image !== null),
    badge: oldPrice != null && oldPrice > price ? "sale" : undefined,
  }
}

export async function getProducts(
  options: GetProductsOptions = {}
): Promise<Product[]> {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const firstPage = await getProductsPage({
    ...options,
    pageNumber: 1,
    pageSize,
  })
  const products = [...(firstPage.items ?? [])]
  const totalPages = firstPage.totalPages ?? 1

  for (let pageNumber = 2; pageNumber <= totalPages; pageNumber += 1) {
    // Propagate failures so consumers never receive a silently truncated catalog.
    const page = await getProductsPage({
      ...options,
      pageNumber,
      pageSize,
    })
    products.push(...(page.items ?? []))
  }

  return products.map(toProduct)
}

async function getProductByPath(path: string): Promise<Product> {
  const payload = await apiFetch<unknown>(path, productFetchOptions)

  if (!isProductDto(payload)) {
    throw new Error("Backend returned an invalid product response")
  }

  return toProduct(payload)
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    return await getProductByPath(`products/${encodeURIComponent(id)}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }

    throw error
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    return await getProductByPath(
      `products/by-slug/${encodeURIComponent(slug)}`
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }

    throw error
  }
}
