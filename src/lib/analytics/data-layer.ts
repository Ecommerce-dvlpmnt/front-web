import type { Product } from "@/types/product"

export interface EcommerceItem {
  item_id: string
  item_name: string
  price: number
  quantity: number
  item_category?: string
  index?: number
}

interface EcommercePayload {
  currency?: "UAH"
  value?: number
  transaction_id?: string
  order_number?: number
  item_list_name?: string
  shipping_tier?: string
  payment_type?: string
  items: EcommerceItem[]
}

declare global {
  interface Window {
    dataLayer?: Array<IArguments | unknown[]>
    gtag?: (...args: unknown[]) => void
    __jingleGa4Configured?: boolean
  }
}

const reportedPurchases = new Set<string>()

export function pushAnalyticsEvent(event: string, params: Record<string, unknown>): boolean {
  if (typeof window === "undefined") return false

  try {
    window.dataLayer = window.dataLayer ?? []
    if (window.gtag) {
      window.gtag("event", event, params)
    } else {
      window.dataLayer.push(["event", event, params])
    }
    return true
  } catch {
    return false
  }
}

export function getEcommerceItem(
  product: Product,
  quantity = 1
): EcommerceItem {
  return {
    // Keep in sync with <g:id> in src/app/feed.xml/route.ts.
    item_id: product.sku?.trim() || product.id,
    item_name: product.name,
    price: product.price,
    quantity,
    item_category: product.categoryName ?? undefined,
  }
}

export function pushEcommerceEvent(
  event: string,
  ecommerce: EcommercePayload,
  eventParams: { order_number?: number } = {}
) {
  return pushAnalyticsEvent(event, { ...ecommerce, ...eventParams })
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

export function pushViewItemList(products: Product[], itemListName: string) {
  pushEcommerceEvent("view_item_list", {
    item_list_name: itemListName,
    items: products.map((product, index) => ({
      ...getEcommerceItem(product),
      index: index + 1,
    })),
  })
}

export function pushViewItem(product: Product) {
  pushEcommerceEvent("view_item", {
    currency: "UAH",
    value: product.price,
    items: [getEcommerceItem(product)],
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
  orderNumber: number,
  items: EcommerceItem[],
  value: number
) {
  if (typeof window === "undefined" || !transactionId || reportedPurchases.has(transactionId)) return false

  const storageKey = `jingle-decor:purchase-reported:${transactionId}`
  try {
    if (window.sessionStorage.getItem(storageKey)) return false
  } catch {
    // Storage can be unavailable in private browsing; keep the in-memory guard.
  }

  const sent = pushEcommerceEvent("purchase", {
    transaction_id: transactionId,
    currency: "UAH",
    value,
    items,
  }, { order_number: orderNumber })

  if (sent) {
    reportedPurchases.add(transactionId)
    try {
      window.sessionStorage.setItem(storageKey, "1")
    } catch {
      // The in-memory guard still protects this page load.
    }
  }
  return sent
}

export function pushAddShippingInfo(items: CartAnalyticsItem[], value: number, shippingTier: string) {
  pushEcommerceEvent("add_shipping_info", {
    currency: "UAH",
    value,
    shipping_tier: shippingTier,
    items: items.map(toEcommerceItem),
  })
}

export function pushAddPaymentInfo(items: CartAnalyticsItem[], value: number, paymentType: string) {
  pushEcommerceEvent("add_payment_info", {
    currency: "UAH",
    value,
    payment_type: paymentType,
    items: items.map(toEcommerceItem),
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
