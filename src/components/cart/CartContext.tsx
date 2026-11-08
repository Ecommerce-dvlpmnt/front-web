"use client"

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react"

import type { Product } from "@/types/product"

export interface CartItem {
  product: Product
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  itemCount: number
  totalPrice: number
  addItem: (product: Product) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  function addItem(product: Product) {
    if (product.stock <= 0) return

    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.product.id === product.id
      )

      if (existingItem) {
        return currentItems.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, product.stock),
              }
            : item
        )
      }

      return [...currentItems, { product, quantity: 1 }]
    })
  }

  function updateQuantity(productId: string, quantity: number) {
    setItems((currentItems) =>
      currentItems.flatMap((item) => {
        if (item.product.id !== productId) return [item]

        if (quantity <= 0) return []

        return [{
          ...item,
          quantity: Math.min(quantity, item.product.stock),
        }]
      })
    )
  }

  function removeItem(productId: string) {
    setItems((currentItems) =>
      currentItems.filter((item) => item.product.id !== productId)
    )
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

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error("useCart must be used within CartProvider")
  }

  return context
}