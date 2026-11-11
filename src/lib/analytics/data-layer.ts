import type { Product } from "@/types/product"

export interface EcommerceItem {
  item_id: string
  item_name: string
  price: number
  quantity: number
  item_category?: string
}

interface EcommercePayload {
  currency?: "UAH"
  value?: number
  transaction_id?: string
  items: EcommerceItem[]
}

interface DataLayerEvent {
  event: string
  ecommerce?: EcommercePayload | null
}

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[]
  }
}

export function getEcommerceItem(
  product: Product,
  quantity = 1
): EcommerceItem {
  return {
    item_id: product.sku || product.id,
    item_name: product.name,
    price: product.price,
    quantity,
    item_category: product.categoryName ?? undefined,
  }
}

export function pushEcommerceEvent(
  event: string,
  ecommerce: EcommercePayload
) {
  if (typeof window === "undefined") return

  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push({ ecommerce: null, event: "ecommerce_reset" })
  window.dataLayer.push({ event, ecommerce })
}

export function pushAddToCart(product: Product, quantity: number) {
  pushEcommerceEvent("add_to_cart", {
    currency: "UAH",
    value: product.price * quantity,
    items: [getEcommerceItem(product, quantity)],
  })
}

export function pushRemoveFromCart(product: Product, quantity: number) {
  pushEcommerceEvent("remove_from_cart", {
    currency: "UAH",
    value: product.price * quantity,
    items: [getEcommerceItem(product, quantity)],
  })
}

export function pushViewCart(items: CartAnalyticsItem[], value: number) {
  pushEcommerceEvent("view_cart", {
    currency: "UAH",
    value,
    items: items.map(toEcommerceItem),
  })
}

export function pushBeginCheckout(items: CartAnalyticsItem[], value: number) {
  pushEcommerceEvent("begin_checkout", {
    currency: "UAH",
    value,
    items: items.map(toEcommerceItem),
  })
}

export function pushPurchase(
  transactionId: string,
  items: EcommerceItem[],
  value: number
) {
  pushEcommerceEvent("purchase", {
    transaction_id: transactionId,
    currency: "UAH",
    value,
    items,
  })
}

export interface CartAnalyticsItem {
  product: Product
  quantity: number
}

function toEcommerceItem(item: CartAnalyticsItem): EcommerceItem {
  return getEcommerceItem(item.product, item.quantity)
}

export {}
