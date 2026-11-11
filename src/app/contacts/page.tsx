import type { Metadata } from "next"
import { Mail, MessageCircle, Phone } from "lucide-react"

import { InfoPage } from "@/components/content/InfoPage"
import { shopConfig } from "@/lib/config/shop"

export const metadata: Metadata = {
  title: "Контакти — Lumière",
  description: "Контакти та графік роботи магазину Lumière.",
}

export default function ContactsPage() {
  return (
    <InfoPage
      title="Контакти"
      description="Залиште запитання — ми допоможемо обрати товар, уточнити доставку або оформити повернення."
    >
      <div className="not-prose grid gap-4 sm:grid-cols-3">
        <a className="rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted" href={shopConfig.contact.phone ? `tel:${shopConfig.contact.phone.replace(/[^+\d]/g, "")}` : undefined}>
          <Phone className="size-5 text-muted-foreground" aria-hidden="true" />
          <p className="mt-4 text-sm font-semibold">Телефон</p>
          <p className="mt-1 break-words text-sm text-muted-foreground">{shopConfig.contact.phone || "Додайте номер у налаштуваннях"}</p>
        </a>
        <a className="rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted" href={shopConfig.contact.email ? `mailto:${shopConfig.contact.email}` : undefined}>
          <Mail className="size-5 text-muted-foreground" aria-hidden="true" />
          <p className="mt-4 text-sm font-semibold">Email</p>
          <p className="mt-1 break-words text-sm text-muted-foreground">{shopConfig.contact.email || "Додайте email у налаштуваннях"}</p>
        </a>
        <a className="rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted" href={shopConfig.contact.telegram || undefined} target={shopConfig.contact.telegram ? "_blank" : undefined} rel={shopConfig.contact.telegram ? "noreferrer" : undefined}>
          <MessageCircle className="size-5 text-muted-foreground" aria-hidden="true" />
          <p className="mt-4 text-sm font-semibold">Месенджер</p>
          <p className="mt-1 break-words text-sm text-muted-foreground">{shopConfig.contact.telegram || "Додайте Telegram у налаштуваннях"}</p>
        </a>
      </div>
      <h2>Графік роботи</h2>
      <p className="whitespace-pre-line">{shopConfig.contact.hours.replace("; ", "\n")}</p>
      <p>Відповідаємо на звернення у робочі години та підтверджуємо замовлення перед відправленням.</p>
    </InfoPage>
  )
}
