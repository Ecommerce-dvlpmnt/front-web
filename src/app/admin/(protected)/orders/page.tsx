import type { Metadata } from "next"

import { OrdersAdmin } from "@/components/admin/orders/OrdersAdmin"
import { getAdminOrders } from "@/lib/api/admin/orders-server"

export const metadata: Metadata = {
  title: "Замовлення — адмін-панель",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function AdminOrdersPage() {
  const initialPage = await getAdminOrders({ pageNumber: 1, pageSize: 50 }).catch((error) => {
    console.error("Failed to load orders in admin:", error)
    return {
      items: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 50,
      totalPages: 1,
    }
  })

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <OrdersAdmin initialPage={initialPage} />
      </div>
    </div>
  )
}
