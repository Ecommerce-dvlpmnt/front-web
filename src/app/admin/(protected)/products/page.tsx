import type { Metadata } from "next"

import { ProductsAdmin } from "@/components/admin/products/ProductsAdmin"
import { getAdminProducts } from "@/lib/api/admin/products"
import { getCategories } from "@/lib/api/categories"
import { getSuppliers } from "@/lib/api/admin/suppliers"

export const metadata: Metadata = {
  title: "Товари — адмін-панель",
  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic = "force-dynamic"

export default async function AdminProductsPage() {
  const [products, categories, suppliers] = await Promise.all([
    getAdminProducts({ onlyActive: false }).catch((error) => {
      console.error("Failed to load products in admin:", error)
      return []
    }),
    getCategories({ onlyActive: false }).catch((error) => {
      console.error("Failed to load categories in admin:", error)
      return []
    }),
    getSuppliers({ onlyActive: false }).catch((error) => {
      console.error("Failed to load suppliers in admin:", error)
      return []
    }),
  ])

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <ProductsAdmin
          initialProducts={products}
          categories={categories}
          suppliers={suppliers}
        />
      </div>
    </div>
  )
}
