import Link from "next/link"
import { ClipboardCheck, Lock, Scale, UserCheck } from "lucide-react"

import { InfoPage } from "@/components/content/InfoPage"
import { pageMetadata } from "@/lib/seo/metadata"

export const metadata = pageMetadata(
  "/privacy-policy",
  "Політика конфіденційності — Jingle Decor",
  "Політика обробки персональних даних на сайті Jingle Decor."
)

const PRIVACY_SECTIONS = [
  {
    code: "01",
    icon: UserCheck,
    title: "Які дані ми отримуємо",
    body: "Під час оформлення замовлення або заявки на зворотний дзвінок ми можемо отримати ім’я, номер телефону, email, місто, дані вибраного відділення чи адреси доставки та ваш коментар до замовлення.",
  },
  {
    code: "02",
    icon: ClipboardCheck,
    title: "Для чого вони потрібні",
    body: "Дані використовуються виключно для зв’язку з покупцем, консультації, комплектації замовлення, передачі інформації службі доставки та виконання вимог чинного законодавства України.",
  },
  {
    code: "03",
    icon: Lock,
    title: "Зберігання й захист",
    body: "Ми не продаємо та не передаємо персональні дані стороннім рекламним мережам. Доступ до інформації надається лише залученим до виконання замовлення фахівцям і логістичним сервісам у необхідному обсязі.",
  },
  {
    code: "04",
    icon: Scale,
    title: "Ваші права",
    body: "Ви маєте право уточнити, виправити або запросити видалення своїх персональних даних у будь-який момент, звернувшись через контакти магазину.",
  },
]

export default function PrivacyPolicyPage() {
  return (
    <InfoPage
      activeHref="/privacy-policy"
      title="Політика конфіденційності"
      description="Дбайливо ставимося до приватності та обробляємо лише ті дані, які потрібні для швидкого оформлення, доставки й підтримки вашого замовлення."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {PRIVACY_SECTIONS.map((section) => {
          const Icon = section.icon
          return (
            <section
              key={section.code}
              className="rounded-3xl border border-[#D4AF37]/25 bg-card p-6 shadow-xs dark:bg-[#0E1914]/90"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl border border-[#D4AF37]/35 bg-[#FBF6EB] text-[#8C5E14] dark:bg-[#162920] dark:text-[#F3D078]">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <span className="text-xs font-bold tracking-widest text-[#8C5E14]/70 dark:text-[#F3D078]/70">
                  {section.code}
                </span>
              </div>
              <h2 className="mt-4">{section.title}</h2>
              <p className="mt-2 text-sm sm:text-base">{section.body}</p>
            </section>
          )
        })}
      </div>

      <div className="rounded-2xl border border-border/70 bg-muted/40 px-5 py-4 text-xs leading-relaxed sm:text-sm dark:bg-[#0B1410]/70">
        Маєте запитання щодо обробки персональних даних? Зв’яжіться з нами на сторінці{" "}
        <Link
          href="/contacts"
          className="font-semibold text-[#8C5E14] underline underline-offset-4 outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60 dark:text-[#F3D078]"
        >
          Контакти
        </Link>
        .
      </div>
    </InfoPage>
  )
}
