import { z } from "zod"

import type { EcommerceItem } from "@/lib/analytics/data-layer"
import { CART_STORAGE_KEY } from "@/lib/cart/constants"
import { getReferralCode } from "@/lib/referral/storage"

export const checkoutDetailsSchema = z.object({
  customerFirstName: z.string().trim().min(2, "Вкажіть ім’я").max(100),
  customerLastName: z.string().trim().min(2, "Вкажіть прізвище").max(100),
  customerPhone: z.string().trim().regex(/^\+380\d{9}$/, "Вкажіть номер у форматі +380XXXXXXXXX"),
  customerEmail: z.string().trim().email("Вкажіть коректний email").max(150).optional().or(z.literal("")),
  customerComment: z.string().trim().max(1000, "Коментар занадто довгий").optional(),
  deliveryType: z.enum(["Warehouse", "Postomat", "Courier"]),
  deliveryCityRef: z.string().min(1, "Оберіть місто зі списку Нової Пошти"),
  deliveryCityName: z.string().min(1),
  deliveryWarehouseRef: z.string().optional(),
  deliveryWarehouseName: z.string().min(1, "Оберіть точку або вкажіть адресу доставки"),
  courierStreet: z.string().optional(),
  courierBuilding: z.string().optional(),
  courierApartment: z.string().optional(),
  paymentMethod: z.enum(["CashOnDelivery", "Online"]),
}).superRefine((value, context) => {
  if (value.deliveryType === "Courier") {
    if (!value.courierStreet?.trim()) context.addIssue({ code: "custom", path: ["courierStreet"], message: "Вкажіть вулицю" })
    if (!value.courierBuilding?.trim()) context.addIssue({ code: "custom", path: ["courierBuilding"], message: "Вкажіть номер будинку" })
  } else if (!value.deliveryWarehouseRef) {
    context.addIssue({ code: "custom", path: ["deliveryWarehouseRef"], message: "Оберіть відділення або поштомат зі списку" })
  }
})

export const orderSchema = z.object({ ...checkoutDetailsSchema.shape,
  items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1) })).min(1, "Кошик порожній"),
}).superRefine((value, context) => {
  if (value.deliveryType === "Courier") {
    if (!value.courierStreet?.trim()) context.addIssue({ code: "custom", path: ["courierStreet"], message: "Вкажіть вулицю" })
    if (!value.courierBuilding?.trim()) context.addIssue({ code: "custom", path: ["courierBuilding"], message: "Вкажіть номер будинку" })
  } else if (!value.deliveryWarehouseRef) context.addIssue({ code: "custom", path: ["deliveryWarehouseRef"], message: "Оберіть відділення або поштомат зі списку" })
})

export type CheckoutDetails = z.infer<typeof checkoutDetailsSchema>
export type CreateOrderInput = z.infer<typeof orderSchema>

export interface BackendOrder {
  id: string
  orderNumber: number
  publicId: string
  customerFirstName: string
  customerLastName: string
  customerFullName: string
  customerPhone: string
  customerEmail: string | null
  customerComment: string | null
  deliveryCityName: string | null
  deliveryWarehouseName: string | null
  orderStatus: string
  paymentMethod: "CashOnDelivery" | "Online"
  paymentStatus: string
  totalPrice: number
  createdAt: string
  items: Array<{ productId: string; productName: string; quantity: number; unitPrice: number; lineTotal: number }>
}

export interface LocalOrder extends CreateOrderInput {
  id: string
  publicId: string
  total: number
  currency: "UAH"
  createdAt: string
  analyticsItems: EcommerceItem[]
}

export const LAST_ORDER_STORAGE_KEY = "lumiere:last-order"

export async function createOrder(
  input: CreateOrderInput,
  options: { analyticsItems: EcommerceItem[] }
): Promise<BackendOrder> {
  const parsed = orderSchema.safeParse(input)
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Перевірте дані замовлення")

  const referralCode = getReferralCode()

  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      ...parsed.data,
      deliveryType: parsed.data.deliveryType === "Postomat" ? "Поштомат" : parsed.data.deliveryType === "Courier" ? "Кур'єр" : "Відділення",
      customerEmail: parsed.data.customerEmail || null,
      customerComment: parsed.data.customerComment || null,
      ...(referralCode ? { referralCode } : {}),
    }),
  })
  const payload: unknown = await response.json().catch(() => null)
  if (response.status !== 201) {
    const problem = payload && typeof payload === "object" ? payload as Record<string, unknown> : {}
    const detail = typeof problem.detail === "string" ? problem.detail :
      typeof problem.title === "string" ? problem.title :
      response.status === 409 ? "Не вистачає товару на складі. Оновіть кошик і спробуйте ще раз." :
      "Не вдалося створити замовлення. Перевірте дані та спробуйте ще раз."
    throw new Error(detail)
  }
  if (!payload || typeof payload !== "object" || typeof (payload as BackendOrder).publicId !== "string") {
    throw new Error("Сервер створив замовлення, але повернув некоректну відповідь.")
  }

  const order = payload as BackendOrder
  if (typeof window !== "undefined") {
    const fallback: LocalOrder = {
      ...parsed.data,
      id: String(order.orderNumber),
      publicId: order.publicId,
      total: order.totalPrice,
      currency: "UAH",
      createdAt: order.createdAt,
      analyticsItems: options.analyticsItems,
    }
    window.sessionStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(fallback))
  }
  return order
}

export async function getOrderByPublicId(publicId: string): Promise<BackendOrder> {
  const response = await fetch(`/api/orders/by-public-id/${encodeURIComponent(publicId)}`, { cache: "no-store" })
  if (!response.ok) throw new Error(`Order request failed: ${response.status}`)
  return await response.json() as BackendOrder
}

export function getLastOrder(publicId?: string): LocalOrder | null {
  if (typeof window === "undefined") return null
  try {
    const parsed: unknown = JSON.parse(window.sessionStorage.getItem(LAST_ORDER_STORAGE_KEY) ?? "null")
    if (!parsed || typeof parsed !== "object") return null
    const order = parsed as LocalOrder
    return !publicId || order.publicId === publicId ? order : null
  } catch {
    return null
  }
}

export function clearCartStorage() {
  if (typeof window !== "undefined") window.localStorage.removeItem(CART_STORAGE_KEY)
}
