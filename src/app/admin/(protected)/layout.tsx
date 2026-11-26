import { redirect } from "next/navigation"

import { AdminNavigation } from "@/components/admin/AdminNavigation"
import { getCurrentAdmin } from "@/lib/api/admin/auth"

import { getAdminReviews } from "@/lib/api/admin/reviews-server"

export const dynamic = "force-dynamic"

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/admin/login")

  const pendingReviews = await getAdminReviews("Pending").then((reviews) => reviews.length).catch(() => 0)

  return (
    <>
      <AdminNavigation name={admin.name || admin.username} pendingReviews={pendingReviews} />
      {children}
    </>
  )
}
