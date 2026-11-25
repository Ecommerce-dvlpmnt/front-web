import type { Product, ProductImage, ProductPage } from "@/types/product"

import { ApiError, apiFetch } from "@/lib/api/client"

interface ProductImageDto extends ProductImage {
  id: string
  url: string
  alt: string | null
  sortOrder: number
}

interface ProductVariantDto {
  id: string
  name?: string | null
  slug?: string | null
  price?: number | string | null
  oldPrice?: number | string | null
  height?: string | null
  inStock?: boolean | null
  isCurrent?: boolean | null
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
  variants?: ProductVariantDto[] | null
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
  sortBy?: "date_desc" | "price_asc" | "price_desc"
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  categoryId?: string
  categoryIds?: string[]
  pageSize?: number
  includeDetails?: boolean
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

  return Array.isArray(items) && items.every(isProductDto)
}

async function fetchProductsPage(
  options: GetProductsOptions & { pageNumber: number }
): Promise<ProductPageDto> {
  const query = new URLSearchParams({
    OnlyActive: "true",
    PageNumber: String(options.pageNumber),
    PageSize: String(options.pageSize ?? DEFAULT_PAGE_SIZE),
    Summary: String(!options.includeDetails),
  })

  const search = options.search?.trim()

  if (search) {
    query.set("Search", search)
  }
  if (options.sortBy) query.set("SortBy", options.sortBy)
  if (options.minPrice !== undefined) query.set("MinPrice", String(options.minPrice))
  if (options.maxPrice !== undefined) query.set("MaxPrice", String(options.maxPrice))
  if (options.inStock) query.set("InStock", "true")

  if (options.categoryId) {
    query.set("CategoryId", options.categoryId)
  }

  for (const categoryId of [...new Set(options.categoryIds ?? [])].sort()) {
    query.append("CategoryIds", categoryId)
  }

  const payload = await apiFetch<unknown>(
    `products?${query.toString()}`,
    productFetchOptions
  )

  if (Array.isArray(payload)) {
    return {
      items: payload.map((item) => {
        if (!isProductDto(item)) throw new Error("Backend returned an invalid product")
        return item
      }),
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
  const pageSize = Number(raw.pageSize ?? raw.PageSize) || items.length || options.pageSize || DEFAULT_PAGE_SIZE
  const totalCount = raw.totalCount ?? raw.TotalCount
  const totalPages = raw.totalPages ?? raw.TotalPages

  // Use the server's effective page size: the API may cap it below the request.
  const pageCount = totalPages ?? (typeof totalCount === "number"
    ? Math.ceil(totalCount / pageSize)
    : undefined)
  if (pageCount !== undefined && (!Number.isSafeInteger(pageCount) || Number(pageCount) < 0)) {
    throw new Error("Backend returned invalid product pagination")
  }

  return {
    items,
    totalCount: typeof totalCount === "number" ? totalCount : undefined,
    pageNumber: options.pageNumber,
    pageSize,
    totalPages: pageCount as number | undefined,
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
    isActive: product.isActive === true,
    updatedAt: product.updatedAt,
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
    variants: (product.variants ?? []).map((v) => ({
      id: String(v.id),
      name: v.name?.trim() || "",
      slug: v.slug?.trim() || "",
      price: Number(v.price) || 0,
      oldPrice: v.oldPrice != null ? Number(v.oldPrice) : null,
      height: v.height?.trim() || "",
      inStock: Boolean(v.inStock),
      isCurrent: Boolean(v.isCurrent),
    })),
    badge: oldPrice != null && oldPrice > price ? "sale" : undefined,
  }
}

// Storefront pages must request only one page. The full-catalog loader below
// is reserved for exports such as feed.xml and sitemap.xml.
export async function getCatalogProductsPage(
  options: Omit<GetProductsOptions, "pageSize" | "includeDetails"> & { pageNumber?: number } = {}
): Promise<ProductPage> {
  const pageNumber = options.pageNumber ?? 1
  if (!Number.isSafeInteger(pageNumber) || pageNumber < 1 || pageNumber > 2147483647) {
    throw new Error("Invalid catalog page number")
  }
  const page = await fetchProductsPage({ ...options, pageNumber, pageSize: 24 })
  if (page.totalCount === undefined || !Number.isSafeInteger(page.totalCount) || page.totalCount < 0 ||
      page.totalPages === undefined || !page.pageSize || page.pageSize > 24 || page.items.length > 24) {
    throw new Error("Backend returned invalid catalog pagination")
  }
  return {
    items: page.items.map(toProduct),
    totalCount: page.totalCount,
    pageNumber,
    pageSize: page.pageSize,
    totalPages: page.totalPages,
  }
}

// Variant lookups need more than the 24 items displayed by the catalog page.
export async function getProductOptionsSearchPage(search: string, categoryId: string): Promise<Product[]> {
  const page = await fetchProductsPage({ search, categoryId, pageNumber: 1, pageSize: 100 })
  if ((page.pageSize ?? 100) > 100 || page.items.length > 100) throw new Error("Backend returned invalid variant pagination")
  return page.items.map(toProduct)
}

export async function getHeroProductCandidates(categoryId: string): Promise<Product[]> {
  const page = await fetchProductsPage({
    categoryId,
    inStock: true,
    pageNumber: 1,
    pageSize: 20,
  })

  return page.items
    .map(toProduct)
    .filter((item) => item.slug && item.price > 0 && item.mainImageUrl !== PRODUCT_IMAGE_PLACEHOLDER)
}

export async function getProducts(
  options: GetProductsOptions = {}
): Promise<Product[]> {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const firstPage = await fetchProductsPage({
    ...options,
    pageNumber: 1,
    pageSize,
  })
  const products = [...firstPage.items]
  const seen = new Set(products.map((product) => product.id))
  const appendPage = (page: ProductPageDto) => {
    const newItems = page.items.filter((product) => !seen.has(product.id))
    if (page.items.length > 0 && newItems.length === 0) {
      throw new Error("Backend repeated a products page; refusing a truncated catalog")
    }
    for (const product of newItems) seen.add(product.id)
    products.push(...newItems)
  }

  if (firstPage.totalPages !== undefined) {
    // Bound concurrency so a cold catalog does not wait for every page in series.
    for (let start = 2; start <= firstPage.totalPages; start += 4) {
      const pages = await Promise.all(
        Array.from({ length: Math.min(4, firstPage.totalPages - start + 1) }, (_, index) =>
          fetchProductsPage({ ...options, pageNumber: start + index, pageSize })
        )
      )
      for (const page of pages) appendPage(page)
    }
    if (firstPage.totalCount !== undefined && products.length !== firstPage.totalCount) {
      throw new Error("Backend returned an incomplete products catalog")
    }
  } else if (firstPage.items.length > 0) {
    // Older API deployments may omit totals. Continue until an empty page,
    // rather than treating their first (possibly capped) page as the catalog.
    for (let pageNumber = 2; ; pageNumber += 1) {
      const page = await fetchProductsPage({ ...options, pageNumber, pageSize })
      if (page.items.length === 0) break
      appendPage(page)
    }
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
