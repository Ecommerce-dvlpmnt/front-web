import type { Metadata } from "next"

import { AdminLoginForm } from "@/components/admin/AdminLoginForm"

export const metadata: Metadata = {
  title: "Вхід до адмін-панелі",
  robots: { index: false, follow: false },
}

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-sm text-muted-foreground">Адміністрування</p>
        <h1 className="mt-2 text-2xl font-semibold">Вхід до адмін-панелі</h1>
        <p className="mt-2 text-sm text-muted-foreground">Увійдіть за обліковими даними адміністратора.</p>
        <AdminLoginForm />
      </section>
    </main>
  )
}
