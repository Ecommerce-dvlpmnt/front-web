import Link from "next/link"
import { CalendarClock, CheckCircle2, MapPin, RefreshCw } from "lucide-react"

import { InfoPage } from "@/components/content/InfoPage"
import { shopConfig } from "@/lib/config/shop"
import { pageMetadata } from "@/lib/seo/metadata"

export const metadata = pageMetadata(
  "/returns",
  "Обмін і повернення — Jingle Decor",
  "Умови обміну та повернення товарів Jingle Decor."
)

const RETURN_STEPS = [
  {
    step: "01",
    title: "Зверніться до нас",
    text: "Напишіть або зателефонуйте нам через контакти магазину та повідомте номер вашого замовлення.",
  },
  {
    step: "02",
    title: "Узгодьте деталі",
    text: "Отримайте від менеджера підтвердження способу відправлення й актуальних даних для повернення.",
  },
  {
    step: "03",
    title: "Надішліть ТТН",
    text: "Відправте товар у заводській упаковці та передайте номер експрес-накладної менеджеру.",
  },
]

export default function ReturnsPage() {
  return (
    <InfoPage
      activeHref="/returns"
      title="Обмін і повернення"
      description="Ми прагнемо, щоб покупка залишала лише приємні святкові враження. Якщо модель або висота вам не підійшли, зв’яжіться з нами до відправлення повернення."
    >
      {/* Головний акцент — 14 днів */}
      <section className="flex flex-col gap-4 rounded-3xl border border-[#D4AF37]/30 bg-card p-6 shadow-xs sm:flex-row sm:items-center sm:p-7 dark:bg-[#0E1914]/90">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/35 bg-[#FBF6EB] text-[#8C5E14] dark:bg-[#162920] dark:text-[#F3D078]">
          <CalendarClock className="size-6" aria-hidden="true" />
        </div>
        <div>
          <h2>Термін — 14 календарних днів</h2>
          <p className="mt-1 text-sm sm:text-base">
            Товар належної якості можна обміняти на іншу висоту/модель або повернути протягом 14 днів, не рахуючи дня купівлі, відповідно до чинного законодавства України.
          </p>
        </div>
      </section>

      {/* Кроки оформлення */}
      <section className="space-y-4">
        <h2>Як оформити обмін або повернення</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {RETURN_STEPS.map((item) => (
            <div
              key={item.step}
              className="rounded-3xl border border-[#D4AF37]/25 bg-card p-5 shadow-xs dark:bg-[#0E1914]/90"
            >
              <span className="inline-flex rounded-full border border-[#D4AF37]/40 bg-[#FBF6EB] px-2.5 py-0.5 text-xs font-bold text-[#8C5E14] dark:bg-[#162920] dark:text-[#F3D078]">
                Крок {item.step}
              </span>
              <h3 className="mt-3 font-heading text-base font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Умови */}
        <section className="rounded-3xl border border-[#D4AF37]/25 bg-card p-6 shadow-xs dark:bg-[#0E1914]/90">
          <div className="flex size-10 items-center justify-center rounded-2xl border border-[#D4AF37]/35 bg-[#FBF6EB] text-[#8C5E14] dark:bg-[#162920] dark:text-[#F3D078]">
            <CheckCircle2 className="size-5" aria-hidden="true" />
          </div>
          <h2 className="mt-4">Умови прийняття повернення</h2>
          <p className="mt-2 text-sm sm:text-base">
            Товар має бути без слідів використання, зі збереженим товарним виглядом, споживчими властивостями, фабричною коробкою, ярликами та документом, що підтверджує покупку. Обмеження та винятки визначаються законодавством України.
          </p>
        </section>

        {/* Вартість і реквізити */}
        <section className="rounded-3xl border border-[#D4AF37]/25 bg-card p-6 shadow-xs dark:bg-[#0E1914]/90">
          <div className="flex size-10 items-center justify-center rounded-2xl border border-[#D4AF37]/35 bg-[#FBF6EB] text-[#8C5E14] dark:bg-[#162920] dark:text-[#F3D078]">
            <RefreshCw className="size-5" aria-hidden="true" />
          </div>
          <h2 className="mt-4">Вартість і повернення коштів</h2>
          <p className="mt-2 text-sm sm:text-base">
            Витрати на доставку повернення товару належної якості несе покупець, якщо інше не погоджено з магазином. Після отримання та перевірки товару кошти повертаються тим самим або погодженим способом у передбачені законом строки.
          </p>

          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-border/70 bg-muted/40 p-3.5 text-xs sm:text-sm dark:bg-[#0B1410]/70">
            <MapPin className="mt-0.5 size-4 shrink-0 text-[#8C5E14] dark:text-[#F3D078]" aria-hidden="true" />
            <div>
              <p className="font-semibold text-foreground">Адреса повернення:</p>
              <p className="mt-0.5">
                {shopConfig.returns.address || "буде вказана менеджером після звернення"}
              </p>
              {shopConfig.returns.email && (
                <p className="mt-1">Email для звернень: {shopConfig.returns.email}</p>
              )}
              <Link
                href="/contacts"
                className="mt-2 inline-block font-semibold text-[#8C5E14] underline underline-offset-4 outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60 dark:text-[#F3D078]"
              >
                Перейти до контактів →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </InfoPage>
  )
}
