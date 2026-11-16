"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const schema = z.object({
  username: z.string().trim().min(3, "Вкажіть логін").max(30),
  password: z.string().min(6, "Мінімум 6 символів").max(100),
})
type FormValues = z.infer<typeof schema>

export function AdminLoginForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  })

  async function submit(values: FormValues) {
    setServerError(null)
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        const error = payload as { detail?: string; title?: string } | null
        throw new Error(error?.detail ?? error?.title ?? "Не вдалося увійти")
      }
      const requested = new URL(window.location.href).searchParams.get("next")
      router.replace(requested?.startsWith("/admin/") && requested !== "/admin/login" ? requested : "/admin/products")
      router.refresh()
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Не вдалося увійти")
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(submit)} noValidate>
      {serverError && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>}
      <div className="space-y-2">
        <label htmlFor="admin-username" className="text-sm font-medium">Логін</label>
        <Input id="admin-username" autoComplete="username" aria-invalid={Boolean(form.formState.errors.username)} {...form.register("username")} />
        {form.formState.errors.username?.message && <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>}
      </div>
      <div className="space-y-2">
        <label htmlFor="admin-password" className="text-sm font-medium">Пароль</label>
        <Input id="admin-password" type="password" autoComplete="current-password" aria-invalid={Boolean(form.formState.errors.password)} {...form.register("password")} />
        {form.formState.errors.password?.message && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
      </div>
      <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Вхід…" : "Увійти"}
      </Button>
    </form>
  )
}
