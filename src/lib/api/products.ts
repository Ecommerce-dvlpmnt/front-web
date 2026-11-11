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
  categoryId: string
  categoryName: string | null
  supplierId: string
  sku: string
  name: string
  slug: string
  description: string | null
  dropPrice: number
  price: number
  oldPrice: number | null
  stock: number
  mainImageUrl: string | null
  attributes: string | null
  metaTitle: string | null
  metaDescription: string | null
  weightKg: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  images: ProductImageDto[] | null
}

interface ProductPageDto {
  items: ProductDto[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
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

  const image = value as Partial<ProductImageDto>

  return (
    typeof image.id === "string" &&
    typeof image.url === "string" &&
    (image.alt === null || typeof image.alt === "string") &&
    typeof image.sortOrder === "number"
  )
}

function isProductDto(value: unknown): value is ProductDto {
  if (!value || typeof value !== "object") return false

  const product = value as Partial<ProductDto>

  return (
    typeof product.id === "string" &&
    typeof product.categoryId === "string" &&
    (product.categoryName === null || typeof product.categoryName === "string") &&
    typeof product.sku === "string" &&
    typeof product.name === "string" &&
    typeof product.slug === "string" &&
    (product.description === null || typeof product.description === "string") &&
    typeof product.price === "number" &&
    (product.oldPrice === null || typeof product.oldPrice === "number") &&
    typeof product.stock === "number" &&
    (product.mainImageUrl === null || typeof product.mainImageUrl === "string") &&
    (product.attributes === null || typeof product.attributes === "string") &&
    (product.metaTitle === null || typeof product.metaTitle === "string") &&
    (product.metaDescription === null || typeof product.metaDescription === "string") &&
    (product.images === null ||
      (Array.isArray(product.images) && product.images.every(isProductImage)))
  )
}

function isProductPageDto(value: unknown): value is ProductPageDto {
  if (!value || typeof value !== "object") return false

  const page = value as Partial<ProductPageDto>

  return (
    Array.isArray(page.items) &&
    typeof page.totalPages === "number" &&
    typeof page.totalCount === "number"
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

  if (!isProductPageDto(payload)) {
    throw new Error("Backend returned an invalid products response")
  }

  return payload
}

function toProduct(product: ProductDto): Product {
  const oldPrice = product.oldPrice ?? null

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    dropPrice: product.dropPrice,
    oldPrice,
    stock: product.stock,
    mainImageUrl: product.mainImageUrl?.trim() || PRODUCT_IMAGE_PLACEHOLDER,
    categoryId: product.categoryId,
    categoryName: product.categoryName,
    description: product.description,
    sku: product.sku,
    attributes: product.attributes,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    weightKg: product.weightKg,
    supplierId: product.supplierId,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    images: product.images ?? [],
    badge: oldPrice != null && oldPrice > product.price ? "sale" : undefined,
  }
}

async function getProductByPath(path: string): Promise<Product> {
  const payload = await apiFetch<unknown>(path, productFetchOptions)

  if (!isProductDto(payload)) {
    throw new Error("Backend returned an invalid product response")
  }

  return toProduct(payload)
}

export async function getProductBySlug(
  slug: string
): Promise<Product | null> {
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

export async function getProductById(
  id: string
): Promise<Product | null> {
  try {
    return await getProductByPath(`products/${encodeURIComponent(id)}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }

    throw error
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

  const products = [...firstPage.items]

  for (let pageNumber = 2; pageNumber <= firstPage.totalPages; pageNumber += 1) {
    const page = await getProductsPage({
      ...options,
      pageNumber,
      pageSize,
    })

    products.push(...page.items)
  }

  return products.map(toProduct)
}
