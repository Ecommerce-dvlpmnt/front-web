import { CreditCard, PackageCheck, ShieldCheck, Truck } from "lucide-react"

import { InfoPage } from "@/components/content/InfoPage"
import { shopConfig } from "@/lib/config/shop"
import { pageMetadata } from "@/lib/seo/metadata"

export const metadata = pageMetadata(
  "/delivery-and-payment",
  "Доставка й оплата — Jingle Decor",
  "Умови комплектації, доставки Новою Поштою та оплати замовлень Jingle Decor."
)

export default function DeliveryAndPaymentPage() {
  return (
    <InfoPage
      activeHref="/delivery-and-payment"
      title="Доставка й оплата"
      description="Прозорі умови відправлення у фірмовій коробці, швидка доставка по Україні та зручні способи оплати після огляду."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {/* Комплектація */}
        <section className="rounded-3xl border border-[#D4AF37]/25 bg-card p-6 shadow-xs dark:bg-[#0E1914]/90">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-[#D4AF37]/35 bg-[#FBF6EB] text-[#8C5E14] dark:bg-[#162920] dark:text-[#F3D078]">
            <PackageCheck className="size-5" aria-hidden="true" />
          </div>
          <h2 className="mt-4">Комплектація та відправлення</h2>
          <p className="mt-2 text-sm sm:text-base">
            Ми комплектуємо замовлення протягом 1–2 робочих днів після підтвердження даних. Кожна ялинка, вінок або гірлянда пакується у цупку коробку для безпечного транспортування й подальшого зберігання.
          </p>
          <p className="mt-2 text-sm sm:text-base">
            Після відправлення ви отримаєте номер експрес-накладної доступним каналом зв’язку.
          </p>
        </section>

        {/* Доставка */}
        <section className="rounded-3xl border border-[#D4AF37]/25 bg-card p-6 shadow-xs dark:bg-[#0E1914]/90">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-[#D4AF37]/35 bg-[#FBF6EB] text-[#8C5E14] dark:bg-[#162920] dark:text-[#F3D078]">
            <Truck className="size-5" aria-hidden="true" />
          </div>
          <h2 className="mt-4">Доставка Новою Поштою</h2>
          <p className="mt-2 text-sm sm:text-base">
            Доставка здійснюється Новою Поштою у вибране відділення, поштомат або кур’єром за вашою адресою по всій Україні.
          </p>
          <p className="mt-2 text-sm sm:text-base">
            Вартість доставки розраховується за тарифами перевізника Нової Пошти залежно від габаритів обраної моделі та сплачується отримувачем.
          </p>
        </section>
      </div>

      {/* Оплата */}
      <section className="rounded-3xl border border-[#D4AF37]/25 bg-card p-6 shadow-xs sm:p-7 dark:bg-[#0E1914]/90">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/35 bg-[#FBF6EB] text-[#8C5E14] dark:bg-[#162920] dark:text-[#F3D078]">
              <CreditCard className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2>Способи оплати</h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Усі ціни на сайті вказані у гривнях (UAH)
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#D4AF37]/35 bg-[#FBF6EB] px-3 py-1 text-xs font-semibold text-[#8C5E14] dark:bg-[#162920] dark:text-[#F3D078]">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            <span>Огляд перед оплатою</span>
          </span>
        </div>

        <ul className="mt-4 text-sm sm:text-base">
          <li>
            <strong className="font-semibold text-foreground">Оплата при отриманні</strong> — накладений платіж у вибраній точці Нової Пошти після огляду товару.
          </li>
          {shopConfig.payment.iban && (
            <li>
              <strong className="font-semibold text-foreground">Оплата за реквізитами IBAN</strong> — реквізити відображаються одразу після створення замовлення.
            </li>
          )}
        </ul>

        <p className="mt-4 rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-xs leading-relaxed sm:text-sm dark:bg-[#0B1410]/70">
          Jingle Decor не додає прихованих комісій до вартості товарів; можливі платежі перевізника за переказ коштів або комісії банку відображаються окремо відповідно до їхніх тарифів.
        </p>
      </section>
    </InfoPage>
  )
}
