import { redirect } from "next/navigation"

import { AdminNavigation } from "@/components/admin/AdminNavigation"
import { getCurrentAdmin } from "@/lib/api/admin/auth"

export const dynamic = "force-dynamic"

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/admin/login")

  return (
    <>
      <AdminNavigation name={admin.name || admin.username} />
      {children}
    </>
  )
}
