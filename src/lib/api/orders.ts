import { z } from "zod"

import type { EcommerceItem } from "@/lib/analytics/data-layer"
import { CART_STORAGE_KEY } from "@/lib/cart/constants"

export const checkoutDetailsSchema = z.object({
  customer: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Вкажіть ім’я та прізвище")
      .refine(
        (value) => value.split(/\s+/).filter(Boolean).length >= 2,
        "Вкажіть ім’я та прізвище"
      ),
    phone: z
      .string()
      .trim()
      .regex(/^\+380\d{9}$/, "Вкажіть номер у форматі +380XXXXXXXXX"),
    email: z
      .string()
      .trim()
      .email("Вкажіть коректний email")
      .optional()
      .or(z.literal("")),
  }),
  delivery: z.object({
    service: z.literal("nova_poshta"),
    type: z.enum(["warehouse", "postomat"]),
    city: z.string().trim().min(2, "Вкажіть місто"),
    warehouse: z.string().trim().min(2, "Вкажіть номер або адресу точки"),
  }),
  paymentMethod: z.enum(["cod", "iban"]),
  comment: z.string().trim().max(1000, "Коментар занадто довгий").optional(),
})

export const orderSchema = checkoutDetailsSchema.extend({
  items: z
    .array(
      z.object({
        productId: z.string().uuid("Некоректний товар"),
        quantity: z.number().int().min(1).max(999),
      })
    )
    .min(1, "Кошик порожній"),
})

export type CheckoutDetails = z.infer<typeof checkoutDetailsSchema>
export type CreateOrderInput = z.infer<typeof orderSchema>

export interface LocalOrder extends CreateOrderInput {
  id: string
  total: number
  currency: "UAH"
  createdAt: string
  analyticsItems: EcommerceItem[]
}

const storedOrderSchema = orderSchema.extend({
  id: z.string(),
  total: z.number().nonnegative(),
  currency: z.literal("UAH"),
  createdAt: z.string(),
  analyticsItems: z.array(z.object({
    item_id: z.string(),
    item_name: z.string(),
    price: z.number(),
    quantity: z.number(),
    item_category: z.string().optional(),
  })),
})

export const LAST_ORDER_STORAGE_KEY = "lumiere:last-order"

export async function createOrder(
  input: CreateOrderInput,
  options: { total: number; analyticsItems: EcommerceItem[] }
): Promise<LocalOrder> {
  const parsed = orderSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Перевірте дані замовлення")
  }

  if (typeof window === "undefined") {
    throw new Error("Замовлення можна створити лише з браузера")
  }

  await new Promise((resolve) => window.setTimeout(resolve, 650))

  const order: LocalOrder = {
    ...parsed.data,
    id: createOrderId(),
    total: options.total,
    currency: "UAH",
    createdAt: new Date().toISOString(),
    analyticsItems: options.analyticsItems,
  }

  window.sessionStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(order))
  window.localStorage.removeItem(CART_STORAGE_KEY)

  return order
}

export function getLastOrder(): LocalOrder | null {
  if (typeof window === "undefined") return null

  try {
    const storedOrder = window.sessionStorage.getItem(LAST_ORDER_STORAGE_KEY)
    if (!storedOrder) return null

    const parsed: unknown = JSON.parse(storedOrder)
    const result = storedOrderSchema.safeParse(parsed)

    return result.success ? result.data : null
  } catch {
    return null
  }
}

function createOrderId(): string {
  const date = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 12)
  const suffix = Math.floor(Math.random() * 900 + 100)

  return `LUM-${date}-${suffix}`
}
