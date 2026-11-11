import { ApiError, apiFetch } from "@/lib/api/client"
import type {
  AdminProduct,
  ProductImage,
} from "@/types/product"

export interface ProductImageInput {
  url: string
  alt?: string | null
  sortOrder: number
}

export interface ProductInput {
  categoryId: string
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
  images: ProductImageInput[]
}

export interface GetAdminProductsOptions {
  categoryId?: string
  supplierId?: string
  search?: string
  onlyActive?: boolean
  pageSize?: number
}

interface ProductDto {
  id: string
  categoryId: string
  categoryName: string | null
  supplierId: string
  sku: string | null
  name: string | null
  slug: string | null
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

interface ProductImageDto {
  id: string
  url: string | null
  alt: string | null
  sortOrder: number
}

interface ProductPageDto {
  items: ProductDto[] | null
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

const DEFAULT_PAGE_SIZE = 100
const PRODUCT_IMAGE_PLACEHOLDER = "/product-placeholder.svg"

const productFetchOptions = {
  next: {
    revalidate: 60,
    tags: ["products"],
  },
}

function isProductImage(value: unknown): value is ProductImageDto {
  if (!value || typeof value !== "object") return false

  const image = value as Partial<ProductImageDto>

  return (
    typeof image.id === "string" &&
    (image.url === null || typeof image.url === "string") &&
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
    typeof product.supplierId === "string" &&
    (product.sku === null || typeof product.sku === "string") &&
    (product.name === null || typeof product.name === "string") &&
    (product.slug === null || typeof product.slug === "string") &&
    (product.description === null || typeof product.description === "string") &&
    typeof product.dropPrice === "number" &&
    typeof product.price === "number" &&
    (product.oldPrice === null || typeof product.oldPrice === "number") &&
    typeof product.stock === "number" &&
    (product.mainImageUrl === null || typeof product.mainImageUrl === "string") &&
    (product.attributes === null || typeof product.attributes === "string") &&
    (product.metaTitle === null || typeof product.metaTitle === "string") &&
    (product.metaDescription === null || typeof product.metaDescription === "string") &&
    (product.weightKg === null || typeof product.weightKg === "number") &&
    typeof product.isActive === "boolean" &&
    (product.images === null ||
      (Array.isArray(product.images) && product.images.every(isProductImage)))
  )
}

function isProductPageDto(value: unknown): value is ProductPageDto {
  if (!value || typeof value !== "object") return false

  const page = value as Partial<ProductPageDto>

  return (
    (page.items === null ||
      (Array.isArray(page.items) && page.items.every(isProductDto))) &&
    typeof page.totalPages === "number" &&
    typeof page.totalCount === "number" &&
    typeof page.pageNumber === "number" &&
    typeof page.pageSize === "number"
  )
}

function toProductImage(image: ProductImageDto): ProductImage | null {
  const url = image.url?.trim()

  if (!url) return null

  return {
    id: image.id,
    url,
    alt: image.alt,
    sortOrder: image.sortOrder,
  }
}

function toAdminProduct(product: ProductDto): AdminProduct {
  const oldPrice = product.oldPrice ?? null
  const images = (product.images ?? [])
    .map(toProductImage)
    .filter((image): image is ProductImage => image !== null)

  return {
    id: product.id,
    slug: product.slug?.trim() || "",
    name: product.name?.trim() || "Без назви",
    price: product.price,
    dropPrice: product.dropPrice,
    oldPrice,
    stock: product.stock,
    mainImageUrl: product.mainImageUrl?.trim() || PRODUCT_IMAGE_PLACEHOLDER,
    categoryId: product.categoryId,
    categoryName: product.categoryName,
    description: product.description,
    sku: product.sku?.trim() || "",
    attributes: product.attributes,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    weightKg: product.weightKg,
    supplierId: product.supplierId,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    images,
    badge: oldPrice != null && oldPrice > product.price ? "sale" : undefined,
  }
}

async function getProductsPage(
  options: GetAdminProductsOptions & { pageNumber: number }
): Promise<ProductPageDto> {
  const query = new URLSearchParams({
    OnlyActive: String(options.onlyActive ?? false),
    PageNumber: String(options.pageNumber),
    PageSize: String(options.pageSize ?? DEFAULT_PAGE_SIZE),
  })

  if (options.categoryId) query.set("CategoryId", options.categoryId)
  if (options.supplierId) query.set("SupplierId", options.supplierId)

  const search = options.search?.trim()
  if (search) query.set("Search", search)

  const payload = await apiFetch<unknown>(
    `products?${query.toString()}`,
    productFetchOptions
  )

  if (!isProductPageDto(payload)) {
    throw new Error("Backend returned an invalid products response")
  }

  return payload
}

export async function getAdminProducts(
  options: GetAdminProductsOptions = {}
): Promise<AdminProduct[]> {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const firstPage = await getProductsPage({
    ...options,
    pageNumber: 1,
    pageSize,
  })
  const products = [...(firstPage.items ?? [])]

  for (let pageNumber = 2; pageNumber <= firstPage.totalPages; pageNumber += 1) {
    const page = await getProductsPage({
      ...options,
      pageNumber,
      pageSize,
    })
    products.push(...(page.items ?? []))
  }

  return products.map(toAdminProduct)
}

async function getProductByPath(path: string): Promise<AdminProduct> {
  const payload = await apiFetch<unknown>(path, productFetchOptions)

  if (!isProductDto(payload)) {
    throw new Error("Backend returned an invalid product response")
  }

  return toAdminProduct(payload)
}

export async function getAdminProduct(id: string): Promise<AdminProduct | null> {
  try {
    return await getProductByPath(`products/${encodeURIComponent(id)}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

function parseProduct(value: unknown): AdminProduct {
  if (!isProductDto(value)) {
    throw new Error("Backend returned an invalid product response")
  }

  return toAdminProduct(value)
}

export async function createProduct(input: ProductInput): Promise<AdminProduct> {
  return parseProduct(
    await apiFetch<unknown>("products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  )
}

export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<AdminProduct> {
  return parseProduct(
    await apiFetch<unknown>(`products/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  )
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch<unknown>(`products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
}
