import type { Product, ProductImage, ProductVariant } from "@/types/product"

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

  if (totalPages > 1) {
    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        getProductsPage({
          ...options,
          pageNumber: i + 2,
          pageSize,
        }).catch(() => null)
      )
    )
    for (const page of remainingPages) {
      if (page?.items) {
        products.push(...page.items)
      }
    }
  }

  return products.map(toProduct)
}

function extractHeightForVariant(name: string): { label: string; meters: number } | null {
  const match = name.match(/(\d+[.,]?\d*)\s*(м|см)(?=\s|$|\))/i)
  if (!match) return null
  const rawNum = parseFloat(match[1].replace(",", "."))
  if (Number.isNaN(rawNum)) return null
  const unit = match[2].toLowerCase()
  if (unit === "см") {
    const meters = rawNum / 100
    const label = rawNum >= 100 ? `${Number(meters.toFixed(2))} м` : `${Math.round(rawNum)} см`
    return { label, meters }
  }
  return { label: `${Number(rawNum.toFixed(2))} м`, meters: rawNum }
}

function getTreeModelGroupKey(name: string): string | null {
  const lower = name.toLowerCase()
  const isTreeOrGarland =
    (lower.includes("ялинк") ||
      lower.includes("ялин") ||
      lower.includes("сосн") ||
      lower.includes("смерек") ||
      lower.includes("гірлянд") ||
      lower.includes("туя")) &&
    !lower.includes("куль") &&
    !lower.includes("фігур")

  if (!isTreeOrGarland) return null

  return name
    .replace(/\bялина\b/gi, "ялинка")
    .replace(/,?\s*\(?\d+[.,]?\d*\s*(м|см)\)?(?=\s|$|\))/gi, " ")
    .replace(/штучна\s+ялинка\s+лита/gi, "лита штучна ялинка")
    .replace(/лита\s+ялинка\s+штучна/gi, "лита штучна ялинка")
    .replace(/саморозкладна\s+лита\s+штучна\s+ялинка/gi, "саморозкладна лита ялинка")
    .replace(/саморозкладна\s+штучна\s+лита\s+ялинка/gi, "саморозкладна лита ялинка")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

async function enrichProductVariants(product: Product): Promise<Product> {
  if (product.variants && product.variants.length > 1) {
    return product
  }

  const modelKey = getTreeModelGroupKey(product.name)
  const heightInfo = extractHeightForVariant(product.name)
  if (!modelKey || !heightInfo) {
    return product
  }

  try {
    const allProducts = await getProducts()
    const siblings = allProducts.filter(
      (item) => getTreeModelGroupKey(item.name) === modelKey && extractHeightForVariant(item.name) !== null
    )

    if (siblings.length <= 1) {
      return product
    }

    siblings.sort((a, b) => {
      const ha = extractHeightForVariant(a.name)?.meters ?? 999
      const hb = extractHeightForVariant(b.name)?.meters ?? 999
      return ha - hb || a.price - b.price
    })

    const variants: ProductVariant[] = siblings.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      price: item.price,
      oldPrice: item.oldPrice ?? null,
      height: extractHeightForVariant(item.name)?.label ?? item.name,
      inStock: item.stock > 0,
      isCurrent: item.id === product.id || item.slug === product.slug,
    }))

    return {
      ...product,
      variants,
    }
  } catch {
    return product
  }
}

async function getProductByPath(path: string): Promise<Product> {
  const payload = await apiFetch<unknown>(path, productFetchOptions)

  if (!isProductDto(payload)) {
    throw new Error("Backend returned an invalid product response")
  }

  return enrichProductVariants(toProduct(payload))
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
