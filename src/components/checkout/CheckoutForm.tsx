"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, CreditCard, Landmark, PackageCheck } from "lucide-react"
import { useRouter } from "next/navigation"

import { useCart } from "@/components/cart/CartContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  checkoutDetailsSchema,
  createOrder,
  type CheckoutDetails,
} from "@/lib/api/orders"
import {
  getEcommerceItem,
  pushBeginCheckout,
} from "@/lib/analytics/data-layer"
import { formatPrice } from "@/lib/formatters/price"

function FieldError({ message }: { message?: string }) {
  if (!message) return null

  return (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  )
}

export function CheckoutForm() {
  const router = useRouter()
  const { items, isHydrated, totalPrice, clearCart } = useCart()
  const [serverError, setServerError] = useState<string | null>(null)
  const hasReportedBeginCheckout = useRef(false)
  const form = useForm<CheckoutDetails>({
    resolver: zodResolver(checkoutDetailsSchema),
    defaultValues: {
      customer: {
        name: "",
        phone: "+380",
        email: "",
      },
      delivery: {
        service: "nova_poshta",
        type: "warehouse",
        city: "",
        warehouse: "",
      },
      paymentMethod: "cod",
      comment: "",
    },
  })

  useEffect(() => {
    if (!isHydrated || items.length === 0 || hasReportedBeginCheckout.current) {
      return
    }

    hasReportedBeginCheckout.current = true
    pushBeginCheckout(
      items.map(({ product, quantity }) => ({ product, quantity })),
      totalPrice
    )
  }, [isHydrated, items, totalPrice])

  async function handleSubmit(values: CheckoutDetails) {
    if (items.length === 0) return

    setServerError(null)

    try {
      const order = await createOrder(
        {
          ...values,
          customer: {
            ...values.customer,
            email: values.customer.email?.trim() || undefined,
          },
          comment: values.comment?.trim() || undefined,
          items: items.map(({ product, quantity }) => ({
            productId: product.id,
            quantity,
          })),
        },
        {
          total: totalPrice,
          analyticsItems: items.map(({ product, quantity }) =>
            getEcommerceItem(product, quantity)
          ),
        }
      )

      clearCart()
      router.push(`/order/success?order=${encodeURIComponent(order.id)}`)
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Не вдалося створити замовлення. Спробуйте ще раз."
      )
    }
  }

  if (!isHydrated) {
    return (
      <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
        Завантаження кошика…
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <PackageCheck className="mx-auto size-9 text-muted-foreground" aria-hidden="true" />
        <h2 className="mt-4 text-xl font-semibold">Спочатку додайте товари</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          У кошику немає позицій для оформлення.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/#catalog">До каталогу</Link>
        </Button>
      </div>
    )
  }

  const customerErrors = form.formState.errors.customer
  const deliveryErrors = form.formState.errors.delivery

  return (
    <form
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.42fr)]"
      onSubmit={form.handleSubmit(handleSubmit)}
      noValidate
    >
      <div className="space-y-6">
        {serverError && (
          <p
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {serverError}
          </p>
        )}

        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6" aria-labelledby="contact-title">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                Крок 1
              </p>
              <h2 id="contact-title" className="mt-2 text-xl font-semibold">
                Контактні дані
              </h2>
            </div>
            <Badge variant="outline">Гостьове замовлення</Badge>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="checkout-name" className="text-sm font-medium">
                Ім’я та прізвище <span aria-hidden="true">*</span>
              </label>
              <Input
                id="checkout-name"
                autoComplete="name"
                placeholder="Олена Коваль"
                aria-invalid={Boolean(customerErrors?.name)}
                {...form.register("customer.name")}
              />
              <FieldError message={customerErrors?.name?.message} />
            </div>
            <div className="space-y-2">
              <label htmlFor="checkout-phone" className="text-sm font-medium">
                Телефон <span aria-hidden="true">*</span>
              </label>
              <Input
                id="checkout-phone"
                type="tel"
                autoComplete="tel"
                placeholder="+380XXXXXXXXX"
                aria-invalid={Boolean(customerErrors?.phone)}
                {...form.register("customer.phone")}
              />
              <FieldError message={customerErrors?.phone?.message} />
            </div>
            <div className="space-y-2">
              <label htmlFor="checkout-email" className="text-sm font-medium">
                Email <span className="text-muted-foreground">(необов’язково)</span>
              </label>
              <Input
                id="checkout-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={Boolean(customerErrors?.email)}
                {...form.register("customer.email")}
              />
              <FieldError message={customerErrors?.email?.message} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6" aria-labelledby="delivery-title">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Крок 2
            </p>
            <h2 id="delivery-title" className="mt-2 text-xl font-semibold">
              Доставка Новою Поштою
            </h2>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer gap-3 rounded-xl border border-border p-4 has-[:checked]:border-foreground">
              <input
                type="radio"
                value="warehouse"
                className="mt-1 accent-primary"
                {...form.register("delivery.type")}
              />
              <span>
                <span className="block text-sm font-medium">Відділення</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Отримання у відділенні Нової Пошти
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer gap-3 rounded-xl border border-border p-4 has-[:checked]:border-foreground">
              <input
                type="radio"
                value="postomat"
                className="mt-1 accent-primary"
                {...form.register("delivery.type")}
              />
              <span>
                <span className="block text-sm font-medium">Поштомат</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Отримання у поштоматі Нової Пошти
                </span>
              </span>
            </label>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="checkout-city" className="text-sm font-medium">
                Місто <span aria-hidden="true">*</span>
              </label>
              <Input
                id="checkout-city"
                autoComplete="address-level2"
                placeholder="Київ"
                aria-invalid={Boolean(deliveryErrors?.city)}
                {...form.register("delivery.city")}
              />
              <FieldError message={deliveryErrors?.city?.message} />
            </div>
            <div className="space-y-2">
              <label htmlFor="checkout-warehouse" className="text-sm font-medium">
                Номер або адреса <span aria-hidden="true">*</span>
              </label>
              <Input
                id="checkout-warehouse"
                placeholder="Відділення №12 або поштомат №12345"
                aria-invalid={Boolean(deliveryErrors?.warehouse)}
                {...form.register("delivery.warehouse")}
              />
              <FieldError message={deliveryErrors?.warehouse?.message} />
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Доставка оплачується за тарифами перевізника Нової Пошти.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6" aria-labelledby="payment-title">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Крок 3
            </p>
            <h2 id="payment-title" className="mt-2 text-xl font-semibold">
              Оплата
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            <label className="flex cursor-pointer gap-3 rounded-xl border border-border p-4 has-[:checked]:border-foreground">
              <input
                type="radio"
                value="cod"
                className="mt-1 accent-primary"
                {...form.register("paymentMethod")}
              />
              <CreditCard className="mt-0.5 size-5 text-muted-foreground" aria-hidden="true" />
              <span>
                <span className="block text-sm font-medium">Оплата при отриманні</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Накладений платіж у відділенні або поштоматі.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer gap-3 rounded-xl border border-border p-4 has-[:checked]:border-foreground">
              <input
                type="radio"
                value="iban"
                className="mt-1 accent-primary"
                {...form.register("paymentMethod")}
              />
              <Landmark className="mt-0.5 size-5 text-muted-foreground" aria-hidden="true" />
              <span>
                <span className="block text-sm font-medium">Оплата за реквізитами IBAN</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Реквізити з’являться після створення замовлення.
                </span>
              </span>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6" aria-labelledby="comment-title">
          <label htmlFor="checkout-comment" id="comment-title" className="text-sm font-medium">
            Коментар до замовлення <span className="text-muted-foreground">(необов’язково)</span>
          </label>
          <textarea
            id="checkout-comment"
            rows={4}
            placeholder="Додаткові побажання до замовлення"
            className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 mt-3 min-h-24 w-full resize-y rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3"
            {...form.register("comment")}
          />
          <FieldError message={form.formState.errors.comment?.message} />
        </section>
      </div>

      <aside className="h-fit rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-28">
        <h2 className="text-lg font-semibold">Ваше замовлення</h2>
        <div className="mt-5 space-y-4">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="line-clamp-2 font-medium">{product.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{quantity} шт.</p>
              </div>
              <span className="shrink-0">{formatPrice(product.price * quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-border pt-5 text-lg font-semibold">
          <span>Разом</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
        <Button className="mt-6 w-full" size="lg" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Створення замовлення…" : "Підтвердити замовлення"}
        </Button>
        <Link
          href="/cart"
          className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Повернутися до кошика
        </Link>
        <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
          Валюта замовлення — гривня (UAH). Прихованих комісій з боку Lumière немає.
        </p>
      </aside>
    </form>
  )
}
