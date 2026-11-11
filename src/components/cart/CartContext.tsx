"use client"

import {
  createContext,
  useEffect,
  useContext,
  useState,
  type ReactNode,
} from "react"

import {
  pushAddToCart,
  pushRemoveFromCart,
} from "@/lib/analytics/data-layer"
import { CART_STORAGE_KEY } from "@/lib/cart/constants"
import type { Product } from "@/types/product"

export interface CartItem {
  product: Product
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  isHydrated: boolean
  itemCount: number
  totalPrice: number
  addItem: (product: Product, quantity?: number) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
}

export { CART_STORAGE_KEY }

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const storedItems = window.localStorage.getItem(CART_STORAGE_KEY)

        if (storedItems) {
          const parsedItems: unknown = JSON.parse(storedItems)

          if (Array.isArray(parsedItems)) {
            setItems(parsedItems.filter(isCartItem))
          }
        }
      } catch {
        window.localStorage.removeItem(CART_STORAGE_KEY)
      } finally {
        setIsHydrated(true)
      }

    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [isHydrated, items])

  function addItem(product: Product, requestedQuantity = 1) {
    if (product.stock <= 0) return

    const safeRequestedQuantity = Math.max(
      1,
      Math.floor(Number.isFinite(requestedQuantity) ? requestedQuantity : 1)
    )
    const existingItem = items.find((item) => item.product.id === product.id)
    const availableQuantity = Math.max(
      product.stock - (existingItem?.quantity ?? 0),
      0
    )
    const addedQuantity = Math.min(safeRequestedQuantity, availableQuantity)

    if (addedQuantity <= 0) return

    setItems((currentItems) => {
      const currentItem = currentItems.find(
        (item) => item.product.id === product.id
      )

      if (currentItem) {
        return currentItems.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + addedQuantity, product.stock),
              }
            : item
        )
      }

      return [...currentItems, { product, quantity: addedQuantity }]
    })

    pushAddToCart(product, addedQuantity)
  }

  function updateQuantity(productId: string, quantity: number) {
    const safeQuantity = Number.isFinite(quantity) ? Math.floor(quantity) : 1

    setItems((currentItems) =>
      currentItems.flatMap((item) => {
        if (item.product.id !== productId) return [item]

        if (safeQuantity <= 0) return []

        return [{
          ...item,
          quantity: Math.min(safeQuantity, item.product.stock),
        }]
      })
    )
  }

  function removeItem(productId: string) {
    const item = items.find((currentItem) => currentItem.product.id === productId)

    setItems((currentItems) =>
      currentItems.filter((currentItem) => currentItem.product.id !== productId)
    )

    if (item) pushRemoveFromCart(item.product, item.quantity)
  }

  function clearCart() {
    setItems([])
  }

  const itemCount = items.reduce(
    (total, item) => total + item.quantity,
    0
  )

  const totalPrice = items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        items,
        isHydrated,
        itemCount,
        totalPrice,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false

  const item = value as Partial<CartItem>

  return (
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0 &&
    Boolean(item.product) &&
    typeof item.product === "object" &&
    typeof item.product.id === "string" &&
    typeof item.product.slug === "string" &&
    typeof item.product.name === "string" &&
    typeof item.product.price === "number" &&
    typeof item.product.stock === "number" &&
    typeof item.product.mainImageUrl === "string"
  )
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error("useCart must be used within CartProvider")
  }

  return context
}
