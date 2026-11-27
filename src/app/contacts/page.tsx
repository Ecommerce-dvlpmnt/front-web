import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react"

import { InfoPage } from "@/components/content/InfoPage"
import { shopConfig } from "@/lib/config/shop"
import { pageMetadata } from "@/lib/seo/metadata"

export const metadata = pageMetadata(
  "/contacts",
  "Контакти — Jingle Decor",
  "Контакти та графік роботи магазину Jingle Decor."
)

export default function ContactsPage() {
  const cleanPhone = shopConfig.contact.phone.replace(/[^+\d]/g, "")

  return (
    <InfoPage
      activeHref="/contacts"
      title="Контакти"
      description="Залиште запитання або зателефонуйте — допоможемо обрати висоту й модель ялинки, уточнити доставку або оформити обмін."
    >
      <div className="not-prose grid gap-4 sm:grid-cols-3">
        <a
          className="group rounded-3xl border border-[#D4AF37]/25 bg-card p-6 shadow-xs outline-none transition-all hover:-translate-y-0.5 hover:border-[#D4AF37]/55 focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60 dark:bg-[#0E1914]/90"
          href={cleanPhone ? `tel:${cleanPhone}` : undefined}
        >
          <div className="flex size-11 items-center justify-center rounded-2xl border border-[#D4AF37]/35 bg-[#FBF6EB] text-[#8C5E14] transition-transform duration-200 group-hover:scale-105 dark:bg-[#162920] dark:text-[#F3D078]">
            <Phone className="size-5" aria-hidden="true" />
          </div>
          <p className="mt-4 font-heading text-base font-semibold text-foreground">Телефон</p>
          <p className="mt-1 break-words text-sm text-muted-foreground">
            {shopConfig.contact.phone || "Скористайтеся кнопкою дзвінка справа внизу"}
          </p>
        </a>

        <a
          className="group rounded-3xl border border-[#D4AF37]/25 bg-card p-6 shadow-xs outline-none transition-all hover:-translate-y-0.5 hover:border-[#D4AF37]/55 focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60 dark:bg-[#0E1914]/90"
          href={shopConfig.contact.email ? `mailto:${shopConfig.contact.email}` : undefined}
        >
          <div className="flex size-11 items-center justify-center rounded-2xl border border-[#D4AF37]/35 bg-[#FBF6EB] text-[#8C5E14] transition-transform duration-200 group-hover:scale-105 dark:bg-[#162920] dark:text-[#F3D078]">
            <Mail className="size-5" aria-hidden="true" />
          </div>
          <p className="mt-4 font-heading text-base font-semibold text-foreground">Email</p>
          <p className="mt-1 break-words text-sm text-muted-foreground">
            {shopConfig.contact.email || "Для письмових звернень та пропозицій"}
          </p>
        </a>

        <a
          className="group rounded-3xl border border-[#D4AF37]/25 bg-card p-6 shadow-xs outline-none transition-all hover:-translate-y-0.5 hover:border-[#D4AF37]/55 focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60 dark:bg-[#0E1914]/90"
          href={shopConfig.contact.telegram || undefined}
          target={shopConfig.contact.telegram ? "_blank" : undefined}
          rel={shopConfig.contact.telegram ? "noreferrer" : undefined}
        >
          <div className="flex size-11 items-center justify-center rounded-2xl border border-[#D4AF37]/35 bg-[#FBF6EB] text-[#8C5E14] transition-transform duration-200 group-hover:scale-105 dark:bg-[#162920] dark:text-[#F3D078]">
            <MessageCircle className="size-5" aria-hidden="true" />
          </div>
          <p className="mt-4 font-heading text-base font-semibold text-foreground">Месенджер</p>
          <p className="mt-1 break-words text-sm text-muted-foreground">
            {shopConfig.contact.telegram || "Швидкі фото та відеоогляди моделей"}
          </p>
        </a>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-3xl border border-[#D4AF37]/25 bg-card p-6 shadow-xs dark:bg-[#0E1914]/90">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/35 bg-[#FBF6EB] text-[#8C5E14] dark:bg-[#162920] dark:text-[#F3D078]">
              <Clock className="size-5" aria-hidden="true" />
            </div>
            <h2>Графік роботи підтримки</h2>
          </div>
          <p className="mt-3 whitespace-pre-line font-medium text-foreground">
            {shopConfig.contact.hours.replace("; ", "\n")}
          </p>
          <p className="mt-2 text-sm">
            Відповідаємо на звернення у робочі години та обов’язково підтверджуємо замовлення перед відправленням.
          </p>
        </section>

        <section className="rounded-3xl border border-[#D4AF37]/25 bg-card p-6 shadow-xs dark:bg-[#0E1914]/90">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/35 bg-[#FBF6EB] text-[#8C5E14] dark:bg-[#162920] dark:text-[#F3D078]">
              <MapPin className="size-5" aria-hidden="true" />
            </div>
            <h2>Адреса повернення</h2>
          </div>
          <p className="mt-3 font-medium text-foreground">{shopConfig.returns.address}</p>
          <p className="mt-2 text-sm">
            Перед відправленням повернення або обміну узгодьте номер замовлення з менеджером для швидкої обробки посилки.
          </p>
        </section>
      </div>
    </InfoPage>
  )
}
