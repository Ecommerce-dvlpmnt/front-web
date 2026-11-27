import Link from "next/link"
import { Building2, CheckCircle2, FileCheck2, Tag, Truck } from "lucide-react"

import { InfoPage } from "@/components/content/InfoPage"
import { pageMetadata } from "@/lib/seo/metadata"

export const metadata = pageMetadata(
  "/terms",
  "Публічна оферта — Jingle Decor",
  "Умови продажу товарів у магазині Jingle Decor."
)

export default function TermsPage() {
  return (
    <InfoPage
      activeHref="/terms"
      title="Публічна оферта"
      description="Основні умови замовлення, оплати, доставки та гарантійних зобов’язань в інтернет-магазині Jingle Decor."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-3xl border border-[#D4AF37]/25 bg-card p-6 shadow-xs dark:bg-[#0E1914]/90">
          <div className="flex items-center justify-between gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl border border-[#D4AF37]/35 bg-[#FBF6EB] text-[#8C5E14] dark:bg-[#162920] dark:text-[#F3D078]">
              <FileCheck2 className="size-5" aria-hidden="true" />
            </div>
            <span className="text-xs font-bold tracking-widest text-[#8C5E14]/70 dark:text-[#F3D078]/70">01</span>
          </div>
          <h2 className="mt-4">Предмет договору</h2>
          <p className="mt-2 text-sm sm:text-base">
            Магазин пропонує покупцеві святковий декор та штучні ялинки, представлені у каталозі на сайті, а покупець оформлює замовлення й оплачує його на погоджених умовах.
          </p>
        </section>

        <section className="rounded-3xl border border-[#D4AF37]/25 bg-card p-6 shadow-xs dark:bg-[#0E1914]/90">
          <div className="flex items-center justify-between gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl border border-[#D4AF37]/35 bg-[#FBF6EB] text-[#8C5E14] dark:bg-[#162920] dark:text-[#F3D078]">
              <Tag className="size-5" aria-hidden="true" />
            </div>
            <span className="text-xs font-bold tracking-widest text-[#8C5E14]/70 dark:text-[#F3D078]/70">02</span>
          </div>
          <h2 className="mt-4">Ціни та наявність</h2>
          <p className="mt-2 text-sm sm:text-base">
            Усі ціни на сайті вказані у гривнях (UAH). Актуальна вартість, обрані параметри та наявність товару на складі фіксуються й підтверджуються під час оформлення замовлення перед передачею перевізнику.
          </p>
        </section>

        <section className="rounded-3xl border border-[#D4AF37]/25 bg-card p-6 shadow-xs dark:bg-[#0E1914]/90">
          <div className="flex items-center justify-between gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl border border-[#D4AF37]/35 bg-[#FBF6EB] text-[#8C5E14] dark:bg-[#162920] dark:text-[#F3D078]">
              <CheckCircle2 className="size-5" aria-hidden="true" />
            </div>
            <span className="text-xs font-bold tracking-widest text-[#8C5E14]/70 dark:text-[#F3D078]/70">03</span>
          </div>
          <h2 className="mt-4">Підтвердження замовлення</h2>
          <p className="mt-2 text-sm sm:text-base">
            Після отримання заявки менеджер зв’язується з покупцем за потреби для перевірки контактів, відділення доставки та способу оплати. Замовлення вважається прийнятим до виконання після підтвердження.
          </p>
        </section>

        <section className="rounded-3xl border border-[#D4AF37]/25 bg-card p-6 shadow-xs dark:bg-[#0E1914]/90">
          <div className="flex items-center justify-between gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl border border-[#D4AF37]/35 bg-[#FBF6EB] text-[#8C5E14] dark:bg-[#162920] dark:text-[#F3D078]">
              <Truck className="size-5" aria-hidden="true" />
            </div>
            <span className="text-xs font-bold tracking-widest text-[#8C5E14]/70 dark:text-[#F3D078]/70">04</span>
          </div>
          <h2 className="mt-4">Доставка, оплата та повернення</h2>
          <p className="mt-2 text-sm sm:text-base">
            Відправлення й розрахунок здійснюються відповідно до умов у розділі{" "}
            <Link
              href="/delivery-and-payment"
              className="font-semibold text-[#8C5E14] underline underline-offset-4 outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60 dark:text-[#F3D078]"
            >
              Оплата і доставка
            </Link>
            . Обмін і повернення регулюються розділом{" "}
            <Link
              href="/returns"
              className="font-semibold text-[#8C5E14] underline underline-offset-4 outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60 dark:text-[#F3D078]"
            >
              Обмін та повернення
            </Link>{" "}
            та чинним законодавством України.
          </p>
        </section>
      </div>

      <section className="rounded-3xl border border-[#D4AF37]/25 bg-card p-6 shadow-xs dark:bg-[#0E1914]/90">
        <div className="flex items-start gap-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/35 bg-[#FBF6EB] text-[#8C5E14] dark:bg-[#162920] dark:text-[#F3D078]">
            <Building2 className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2>Реквізити продавця та підтримка</h2>
            <p className="mt-1.5 text-sm sm:text-base">
              Актуальні платіжні реквізити надаються покупцеві під час оформлення замовлення, а зв’язатися з підтримкою магазину можна у розділі{" "}
              <Link
                href="/contacts"
                className="font-semibold text-[#8C5E14] underline underline-offset-4 outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60 dark:text-[#F3D078]"
              >
                Контакти
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </InfoPage>
  )
}
