import type { Metadata } from "next"

import { SuppliersAdmin } from "@/components/admin/suppliers/SuppliersAdmin"
import { getSuppliers } from "@/lib/api/admin/suppliers"

export const metadata: Metadata = {
  title: "Постачальники — адмін-панель",
  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic = "force-dynamic"

export default async function AdminSuppliersPage() {
  const suppliers = await getSuppliers({ onlyActive: false }).catch((error) => {
    console.error("Failed to load suppliers in admin:", error)
    return []
  })

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <SuppliersAdmin initialSuppliers={suppliers} />
      </div>
    </div>
  )
}
