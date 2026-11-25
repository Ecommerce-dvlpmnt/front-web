import { ApiError, apiFetch } from "@/lib/api/client"
import { adminApiFetch } from "@/lib/api/admin/auth"
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
  pageNumber?: number
}

export interface AdminProductPage {
  items: AdminProduct[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
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

interface ProductImageDto {
  id: string
  url?: string | null
  alt?: string | null
  sortOrder?: number | null
}

interface ProductPageDto {
  items: ProductDto[] | null
  totalCount?: number
  pageNumber?: number
  pageSize?: number
  totalPages?: number
}

const DEFAULT_PAGE_SIZE = 25
const PRODUCT_IMAGE_PLACEHOLDER = "/product-placeholder.svg"

const productFetchOptions = {
  next: {
    revalidate: 60,
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
    (typeof product.supplierId === "string" || product.supplierId == null) &&
    (product.sku == null || typeof product.sku === "string") &&
    (product.name == null || typeof product.name === "string") &&
    (product.slug == null || typeof product.slug === "string") &&
    (product.description == null || typeof product.description === "string") &&
    (typeof product.dropPrice === "number" || typeof product.dropPrice === "string" || product.dropPrice == null) &&
    (typeof product.price === "number" || typeof product.price === "string" || product.price == null) &&
    (product.oldPrice == null || typeof product.oldPrice === "number" || typeof product.oldPrice === "string") &&
    (typeof product.stock === "number" || typeof product.stock === "string" || product.stock == null) &&
    (product.mainImageUrl == null || typeof product.mainImageUrl === "string") &&
    (product.attributes == null || typeof product.attributes === "string") &&
    (product.metaTitle == null || typeof product.metaTitle === "string") &&
    (product.metaDescription == null || typeof product.metaDescription === "string") &&
    (product.weightKg == null || typeof product.weightKg === "number" || typeof product.weightKg === "string") &&
    (typeof product.isActive === "boolean" || product.isActive == null) &&
    (product.images == null ||
      (Array.isArray(product.images) && product.images.every(isProductImage)))
  )
}

function isProductPageDto(value: unknown): value is ProductPageDto {
  if (!value || typeof value !== "object") return false

  const page = value as Record<string, unknown>
  const items = page.items ?? page.Items

  return (
    (items == null ||
      (Array.isArray(items) && items.every(isProductDto))) &&
    (typeof page.totalPages === "number" || typeof page.TotalPages === "number" || page.totalPages == null || page.TotalPages == null)
  )
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

function toAdminProduct(product: ProductDto): AdminProduct {
  const oldPrice = product.oldPrice != null ? Number(product.oldPrice) : null
  const images = (product.images ?? [])
    .map(toProductImage)
    .filter((image): image is ProductImage => image !== null)

  const price = Number(product.price) || 0
  const dropPrice = Number(product.dropPrice) || 0
  const stock = Number(product.stock) || 0
  const weightKg = product.weightKg != null ? Number(product.weightKg) : null

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
    weightKg,
    supplierId: String(product.supplierId || ""),
    isActive: product.isActive !== false,
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: product.updatedAt || new Date().toISOString(),
    images,
    badge: oldPrice != null && oldPrice > price ? "sale" : undefined,
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

  const payload = await adminApiFetch<unknown>(
    `admin/products?${query.toString()}`,
    productFetchOptions
  )

  // Якщо бекенд повернув прямий масив товарів замість обгортки PagedResult
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
  const totalPages = Number(raw.totalPages ?? raw.TotalPages ?? 0)
  const totalCount = Number(raw.totalCount ?? raw.TotalCount ?? items.length)

  return {
    items,
    totalCount,
    pageNumber: options.pageNumber,
    pageSize: options.pageSize ?? DEFAULT_PAGE_SIZE,
    totalPages,
  }
}

export async function getAdminProductsPage(
  options: GetAdminProductsOptions = {}
): Promise<AdminProductPage> {
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE))
  const pageNumber = Math.max(1, options.pageNumber ?? 1)
  const page = await getProductsPage({
    ...options,
    pageNumber,
    pageSize,
  })
  return {
    items: (page.items ?? []).map(toAdminProduct),
    totalCount: page.totalCount ?? 0,
    pageNumber,
    pageSize,
    totalPages: page.totalPages ?? 0,
  }
}

async function getProductByPath(path: string): Promise<AdminProduct> {
  let payload: unknown
  try {
    payload = await adminApiFetch<unknown>(`admin/${path}`, productFetchOptions)
  } catch {
    payload = await apiFetch<unknown>(path, productFetchOptions)
  }

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
  try {
    return parseProduct(
      await adminApiFetch<unknown>("admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
    )
  } catch {
    return parseProduct(
      await apiFetch<unknown>("products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
    )
  }
}

export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<AdminProduct> {
  try {
    return parseProduct(
      await adminApiFetch<unknown>(`admin/products/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
    )
  } catch {
    return parseProduct(
      await apiFetch<unknown>(`products/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
    )
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    await adminApiFetch<unknown>(`admin/products/${encodeURIComponent(id)}`, {
      method: "DELETE",
    })
  } catch {
    await apiFetch<unknown>(`products/${encodeURIComponent(id)}`, {
      method: "DELETE",
    })
  }
}
