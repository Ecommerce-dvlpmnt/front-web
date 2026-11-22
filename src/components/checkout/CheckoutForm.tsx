"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, CreditCard, Landmark, PackageCheck, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"

import { shopConfig } from "@/lib/config/shop"
import { IbanPaymentDetails } from "@/features/checkout/IbanPaymentDetails"
import { useCart } from "@/components/cart/CartContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  checkoutDetailsSchema,
  createOrder,
  clearCartStorage,
  type CheckoutDetails,
} from "@/lib/api/orders"
import {
  getEcommerceItem,
  pushAddPaymentInfo,
  pushAddShippingInfo,
  pushBeginCheckout,
} from "@/lib/analytics/data-layer"
import { formatPrice } from "@/lib/formatters/price"
import { cn } from "@/lib/utils"
import { getWarehousesByCity } from "@/lib/api/novaposhta"
import type { NovaPoshtaWarehouse } from "./NovaPoshtaMap"
import { NovaPoshtaPickerModal } from "./NovaPoshtaPickerModal"

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
  const [citySearch, setCitySearch] = useState("")
  const [cities, setCities] = useState<Array<{ Ref: string; Description: string; AreaDescription?: string | null }>>([])
  const [warehouses, setWarehouses] = useState<NovaPoshtaWarehouse[]>([])
  const [warehouseSearch, setWarehouseSearch] = useState("")
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [courierAddress, setCourierAddress] = useState({ street: "", building: "", apartment: "" })
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [isLoadingCities, setIsLoadingCities] = useState(false)
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false)
  const hasReportedBeginCheckout = useRef(false)
  const previousDeliveryType = useRef<CheckoutDetails["deliveryType"]>("Warehouse")
  const previousPaymentMethod = useRef<CheckoutDetails["paymentMethod"]>("CashOnDelivery")
  const form = useForm<CheckoutDetails>({
    resolver: zodResolver(checkoutDetailsSchema),
    defaultValues: {
      customerFirstName: "",
      customerLastName: "",
      customerPhone: "+380",
      customerEmail: "",
      customerComment: "",
      deliveryType: "Warehouse",
      deliveryCityRef: "",
      deliveryCityName: "",
      deliveryWarehouseRef: "",
      deliveryWarehouseName: "",
      courierStreet: "",
      courierBuilding: "",
      courierApartment: "",
      paymentMethod: "CashOnDelivery",
    },
  })
  const deliveryType = useWatch({ control: form.control, name: "deliveryType" })
  const cityRef = useWatch({ control: form.control, name: "deliveryCityRef" })
  const paymentMethod = useWatch({ control: form.control, name: "paymentMethod" })

  useEffect(() => {
    if (deliveryType === previousDeliveryType.current) return
    previousDeliveryType.current = deliveryType
    if (!isHydrated || items.length === 0) return
    const shippingTiers: Record<CheckoutDetails["deliveryType"], string> = {
      Warehouse: "Nova Poshta warehouse",
      Postomat: "Nova Poshta parcel locker",
      Courier: "Nova Poshta courier",
    }
    pushAddShippingInfo(items, totalPrice, shippingTiers[deliveryType])
  }, [deliveryType, isHydrated, items, totalPrice])

  useEffect(() => {
    if (paymentMethod === previousPaymentMethod.current) return
    previousPaymentMethod.current = paymentMethod
    if (!isHydrated || items.length === 0) return
    const paymentTypes: Record<CheckoutDetails["paymentMethod"], string> = {
      CashOnDelivery: "Cash on delivery",
      Online: "IBAN bank transfer",
    }
    pushAddPaymentInfo(items, totalPrice, paymentTypes[paymentMethod])
  }, [paymentMethod, isHydrated, items, totalPrice])

  useEffect(() => {
    if (citySearch.trim().length < 2 || form.getValues("deliveryCityRef")) {
      return
    }
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setIsLoadingCities(true)
      try {
        const response = await fetch(`/api/novaposhta/cities?search=${encodeURIComponent(citySearch.trim())}`, { signal: controller.signal })
        const result = await response.json()
        if (!response.ok || !result.success) throw new Error(result.errors?.join(" ") || "Не вдалося знайти міста")
        setCities(result.data ?? [])
        setLookupError(null)
      } catch (error) {
        if (!controller.signal.aborted) setLookupError(error instanceof Error ? error.message : "Помилка пошуку міст")
      } finally {
        if (!controller.signal.aborted) setIsLoadingCities(false)
      }
    }, 300)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [citySearch, form])

    useEffect(() => {
    if (!cityRef) return
    const controller = new AbortController()
    const loadingTimer = window.setTimeout(() => setIsLoadingWarehouses(true), 0)
    getWarehousesByCity(cityRef, controller.signal)
      .then(data => {
        setWarehouses(data)
        setLookupError(null)
      })
      .catch(error => { if (!controller.signal.aborted) setLookupError(error instanceof Error ? error.message : "Помилка завантаження відділень") })
      .finally(() => {
        // Данные из кэша приходят быстрее, чем срабатывает таймер,
        // поэтому таймер нужно отменить, иначе индикатор загрузки «залипнет».
        window.clearTimeout(loadingTimer)
        if (!controller.signal.aborted) setIsLoadingWarehouses(false)
      })
    return () => { window.clearTimeout(loadingTimer); controller.abort() }
  }, [cityRef])

  const filteredWarehouses = useMemo(() => {
    if (!warehouses.length) return []
    const isTargetPostomat = deliveryType === "Postomat"
    const query = warehouseSearch.trim().toLowerCase()

    if (!query) {
      return warehouses.filter(item => {
        const isPostomat =
          item.CategoryOfWarehouse?.toLowerCase().includes("postomat") ||
          item.Description.toLowerCase().includes("поштомат")
        return isTargetPostomat ? isPostomat : !isPostomat
      })
    }

    return warehouses.filter(item => {
      const isPostomat =
        item.CategoryOfWarehouse?.toLowerCase().includes("postomat") ||
        item.Description.toLowerCase().includes("поштомат")
      if (isTargetPostomat ? !isPostomat : isPostomat) return false
      if (item.Number && item.Number.includes(query)) return true
      if (item.Description.toLowerCase().includes(query)) return true
      if (item.ShortAddress && item.ShortAddress.toLowerCase().includes(query)) return true
      return false
    })
  }, [warehouses, deliveryType, warehouseSearch])

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
          deliveryWarehouseRef: values.deliveryType === "Courier" ? "" : values.deliveryWarehouseRef,
          deliveryWarehouseName: values.deliveryType === "Courier"
            ? `вул. ${values.courierStreet?.trim()}, буд. ${values.courierBuilding?.trim()}${values.courierApartment?.trim() ? `, кв. ${values.courierApartment.trim()}` : ""}`
            : values.deliveryWarehouseName,
          items: items.map(({ product, quantity }) => ({
            productId: product.id,
            quantity,
          })),
        },
        {
          analyticsItems: items.map(({ product, quantity }) =>
            getEcommerceItem(product, quantity)
          ),
        }
      )

      clearCart()
      clearCartStorage()
      router.push(`/order/success?publicId=${encodeURIComponent(order.publicId)}`)
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

  const customerErrors = form.formState.errors

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
                Ім’я <span aria-hidden="true">*</span>
              </label>
              <Input
                id="checkout-name"
                autoComplete="name"
                placeholder="Олена Коваль"
                aria-invalid={Boolean(customerErrors.customerFirstName)}
                {...form.register("customerFirstName")}
              />
              <FieldError message={customerErrors.customerFirstName?.message} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="checkout-last-name" className="text-sm font-medium">Прізвище <span aria-hidden="true">*</span></label>
              <Input id="checkout-last-name" autoComplete="family-name" placeholder="Коваль" aria-invalid={Boolean(customerErrors.customerLastName)} {...form.register("customerLastName")} />
              <FieldError message={customerErrors.customerLastName?.message} />
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
                aria-invalid={Boolean(customerErrors.customerPhone)}
                {...form.register("customerPhone")}
              />
              <FieldError message={customerErrors.customerPhone?.message} />
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
                aria-invalid={Boolean(customerErrors.customerEmail)}
                {...form.register("customerEmail")}
              />
              <FieldError message={customerErrors.customerEmail?.message} />
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

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <label className="flex cursor-pointer gap-3 rounded-xl border border-border p-4 has-[:checked]:border-foreground">
              <input
                type="radio"
                value="Warehouse"
                className="mt-1 accent-primary"
                {...form.register("deliveryType", { onChange: () => {
                  form.setValue("deliveryWarehouseRef", "", { shouldValidate: true })
                  form.setValue("deliveryWarehouseName", "", { shouldValidate: true })
                  setWarehouseSearch("")
                } })}
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
                value="Postomat"
                className="mt-1 accent-primary"
                {...form.register("deliveryType", { onChange: () => {
                  form.setValue("deliveryWarehouseRef", "", { shouldValidate: true })
                  form.setValue("deliveryWarehouseName", "", { shouldValidate: true })
                  setWarehouseSearch("")
                } })}
              />
              <span>
                <span className="block text-sm font-medium">Поштомат</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Отримання у поштоматі Нової Пошти
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer gap-3 rounded-xl border border-border p-4 has-[:checked]:border-foreground">
              <input type="radio" value="Courier" className="mt-1 accent-primary" {...form.register("deliveryType", { onChange: () => {
                form.setValue("deliveryWarehouseRef", "", { shouldValidate: true })
                form.setValue("deliveryWarehouseName", "", { shouldValidate: true })
                setWarehouseSearch("")
              } })} />
              <span><span className="block text-sm font-medium">Кур’єр Нова Пошта</span><span className="mt-1 block text-xs text-muted-foreground">Доставка за адресою</span></span>
            </label>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="checkout-city" className="text-sm font-medium">
                Місто <span aria-hidden="true">*</span>
              </label>
              <Input id="checkout-city" autoComplete="address-level2" placeholder="Почніть вводити назву міста" value={citySearch} aria-invalid={Boolean(customerErrors.deliveryCityRef)} onChange={event => {
                const value = event.target.value
                setCitySearch(value)
                form.setValue("deliveryCityRef", "", { shouldValidate: true })
                form.setValue("deliveryCityName", "", { shouldValidate: true })
                form.setValue("deliveryWarehouseRef", "", { shouldValidate: true })
                form.setValue("deliveryWarehouseName", "", { shouldValidate: true })
                setWarehouses([])
                setCourierAddress({ street: "", building: "", apartment: "" })
                form.setValue("courierStreet", "")
                form.setValue("courierBuilding", "")
                form.setValue("courierApartment", "")
                setWarehouseSearch("")
              }} />
              {isLoadingCities && <p className="text-xs text-muted-foreground">Пошук міст…</p>}
              {cities.length > 0 && <ul className="max-h-48 overflow-auto rounded-lg border border-border" role="listbox" aria-label="Міста Нової Пошти">{cities.map(city => <li key={city.Ref}><button type="button" role="option" aria-selected={false} className="w-full px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted" onClick={() => {
                setCitySearch(city.Description)
                form.setValue("deliveryCityRef", city.Ref, { shouldValidate: true })
                form.setValue("deliveryCityName", city.Description, { shouldValidate: true })
                form.setValue("deliveryWarehouseRef", "", { shouldValidate: true })
                form.setValue("deliveryWarehouseName", "", { shouldValidate: true })
                setWarehouses([])
                setCourierAddress({ street: "", building: "", apartment: "" })
                setCities([])
              }}>{city.Description}{city.AreaDescription ? `, ${city.AreaDescription} обл.` : ""}</button></li>)}</ul>}
              <FieldError message={customerErrors.deliveryCityRef?.message} />
            </div>
            {deliveryType !== "Courier" && <div className="space-y-2">
              <label htmlFor="checkout-warehouse" className="text-sm font-medium">
                {deliveryType === "Postomat" ? "Поштомат" : "Відділення"} <span aria-hidden="true">*</span>
              </label>
              {form.getValues("deliveryWarehouseRef") ? (
                <div className="rounded-2xl border border-[#D4AF37]/50 bg-[#D4AF37]/10 p-4 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#8C5E14] dark:text-[#F3D078] flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        Вибраний пункт отримання
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {form.getValues("deliveryWarehouseName")}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 rounded-full border-border/80 text-xs font-medium hover:border-[#D4AF37]"
                      disabled={!cityRef}
                      onClick={() => setIsMapOpen(true)}
                    >
                      <MapPin className="mr-1.5 size-3.5 text-[#8C5E14] dark:text-[#F3D078]" />
                      Змінити
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Input
                    id="checkout-warehouse"
                    placeholder={cityRef ? "Пошук за номером або адресою" : "Спочатку оберіть місто"}
                    value={warehouseSearch}
                    disabled={!cityRef || isLoadingWarehouses}
                    onChange={event => {
                      setWarehouseSearch(event.target.value)
                      form.setValue("deliveryWarehouseRef", "", { shouldValidate: true })
                      form.setValue("deliveryWarehouseName", "", { shouldValidate: true })
                    }}
                  />
                  {isLoadingWarehouses && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="inline-block size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Завантаження точок Нової Пошти…
                    </p>
                  )}
                  {cityRef && filteredWarehouses.length > 0 && (
                    <ul className="max-h-48 overflow-auto rounded-lg border border-border" role="listbox" aria-label="Точки Нової Пошти">
                      {filteredWarehouses.slice(0, 50).map(item => (
                        <li key={item.Ref}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={form.getValues("deliveryWarehouseRef") === item.Ref}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted"
                            onClick={() => {
                              form.setValue("deliveryWarehouseRef", item.Ref, { shouldValidate: true })
                              form.setValue("deliveryWarehouseName", item.Description, { shouldValidate: true })
                              setWarehouseSearch(item.Description)
                            }}
                          >
                            {item.Description}{item.ShortAddress && item.ShortAddress !== item.Description ? ` — ${item.ShortAddress}` : ""}
                          </button>
                        </li>
                      ))}
                      {filteredWarehouses.length > 50 && (
                        <li className="bg-muted/40 px-3 py-2 text-center text-xs text-muted-foreground">
                          Показано перші 50 точок із {filteredWarehouses.length}. Введіть номер або адресу для точного пошуку.
                        </li>
                      )}
                    </ul>
                  )}
                  <Button
                    type="button"
                    disabled={!cityRef || isLoadingWarehouses}
                    onClick={() => setIsMapOpen(true)}
                    className={cn(
                      "w-full cursor-pointer font-medium transition-colors",
                      cityRef
                        ? "bg-[#181512] text-[#FAF8F5] hover:bg-[#2A231D] dark:bg-[#D4AF37] dark:text-[#181512] dark:hover:bg-[#C59F2D] border-transparent shadow-xs"
                        : "bg-muted text-muted-foreground border border-border"
                    )}
                  >
                    <MapPin className="mr-2 size-4 text-[#D4AF37] dark:text-[#181512] shrink-0" />
                    <span>{isLoadingWarehouses ? "Завантаження точок…" : "Обрати на мапі"}</span>
                  </Button>
                </>
              )}
              <FieldError message={customerErrors.deliveryWarehouseRef?.message} />
            </div>}
          </div>
          {deliveryType === "Courier" && <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="space-y-2"><label htmlFor="courier-street" className="text-sm font-medium">Вулиця *</label><Input id="courier-street" placeholder="Сумська" value={courierAddress.street} disabled={!cityRef} aria-invalid={Boolean(customerErrors.courierStreet)} onChange={event => { const street = event.target.value; setCourierAddress(prev => ({ ...prev, street })); form.setValue("courierStreet", street, { shouldValidate: true }); form.setValue("deliveryWarehouseName", street ? `вул. ${street}` : "") }} /><FieldError message={customerErrors.courierStreet?.message} /></div>
            <div className="space-y-2"><label htmlFor="courier-building" className="text-sm font-medium">Будинок *</label><Input id="courier-building" placeholder="10" value={courierAddress.building} disabled={!cityRef} aria-invalid={Boolean(customerErrors.courierBuilding)} onChange={event => { const building = event.target.value; setCourierAddress(prev => ({ ...prev, building })); form.setValue("courierBuilding", building, { shouldValidate: true }) }} /><FieldError message={customerErrors.courierBuilding?.message} /></div>
            <div className="space-y-2"><label htmlFor="courier-apartment" className="text-sm font-medium">Квартира / офіс</label><Input id="courier-apartment" placeholder="5" value={courierAddress.apartment} disabled={!cityRef} onChange={event => { const apartment = event.target.value; setCourierAddress(prev => ({ ...prev, apartment })); form.setValue("courierApartment", apartment) }} /></div>
          </div>}
          {lookupError && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <p className="text-sm text-destructive" role="alert">{lookupError}</p>
              {cityRef && (
                <button
                  type="button"
                  onClick={() => {
                    setLookupError(null)
                    setIsLoadingWarehouses(true)
                    getWarehousesByCity(cityRef)
                      .then(data => {
                        setWarehouses(data)
                        setLookupError(null)
                      })
                      .catch(err =>
                        setLookupError(err instanceof Error ? err.message : "Помилка завантаження відділень"),
                      )
                      .finally(() => setIsLoadingWarehouses(false))
                  }}
                  className="cursor-pointer text-xs font-medium text-primary underline hover:no-underline"
                >
                  Спробувати ще раз
                </button>
              )}
            </div>
          )}
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Доставка оплачується за тарифами перевізника Нової Пошти.
          </p>
          {isMapOpen && cityRef && <NovaPoshtaPickerModal
            warehouses={warehouses}
            type={deliveryType === "Postomat" ? "Postomat" : "Warehouse"}
            selectedRef={form.getValues("deliveryWarehouseRef") ?? ""}
            onClose={() => setIsMapOpen(false)}
            onSelect={warehouse => {
              form.setValue("deliveryWarehouseRef", warehouse.Ref, { shouldValidate: true })
              form.setValue("deliveryWarehouseName", warehouse.Description, { shouldValidate: true })
              setWarehouseSearch(warehouse.Description)
              setIsMapOpen(false)
            }}
          />}
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
                value="CashOnDelivery"
                className="mt-1 accent-primary"
                {...form.register("paymentMethod")}
              />
              <CreditCard className="mt-0.5 size-5 text-muted-foreground" aria-hidden="true" />
              <span>
                <span className="block text-sm font-medium">Оплата при отриманні</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Накладений платіж у відділенні або поштоматі.
                </span>
                <span className="mt-2 block text-xs leading-5 text-muted-foreground">
                  Додатково стягується комісія Нової Пошти за грошовий переказ (20 грн + 2% від суми)
                </span>
              </span>
            </label>
            {shopConfig.payment.iban && (
              <label className="flex cursor-pointer gap-3 rounded-xl border border-border p-4 has-[:checked]:border-foreground">
                <input
                  type="radio"
                  value="Online"
                  className="mt-1 accent-primary"
                  {...form.register("paymentMethod")}
                />
                <Landmark className="mt-0.5 size-5 text-muted-foreground" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-medium">Оплата за реквізитами IBAN</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Банківський переказ на рахунок ФОП.
                  </span>
                </span>
              </label>
            )}
          </div>
          {shopConfig.payment.iban && paymentMethod === "Online" && <IbanPaymentDetails amount={totalPrice} />}
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
            {...form.register("customerComment")}
          />
          <FieldError message={form.formState.errors.customerComment?.message} />
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
        <p className="mt-3 text-sm text-muted-foreground">Доставка — за тарифами Нової Пошти, сплачується окремо.</p>
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
          Валюта замовлення — гривня (UAH). Прихованих комісій з боку Jingle Decor немає.
        </p>
      </aside>
    </form>
  )
}
