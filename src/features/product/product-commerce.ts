import type { Product } from "@/types/product"

export function getProductCommerce(product: Product) {
  const price = Number(product.price.toFixed(2))
  const previous = product.oldPrice != null && Number.isFinite(product.oldPrice) ? Number(product.oldPrice.toFixed(2)) : 0
  return {
    price, previous, onSale: previous > price && price > 0,
    currency: "UAH", inStock: Number.isInteger(product.stock) && product.stock > 0,
  }
}
