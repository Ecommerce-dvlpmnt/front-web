import Link from "next/link"
import { Clock3, Globe, Mail, MessageCircle, Phone } from "lucide-react"

import { shopConfig } from "@/lib/config/shop"

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8 lg:py-16">
        <div>
          <Link href="/" className="text-sm font-semibold tracking-[0.18em] uppercase">
            {shopConfig.name}
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
            {shopConfig.description}. Обирайте деталі, які роблять кожен день
            особливим.
          </p>
          <p className="mt-8 text-xs text-muted-foreground">
            © {new Date().getFullYear()} {shopConfig.name}. Усі права захищені.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Покупцям</h2>
          <nav className="mt-4 flex flex-col items-start gap-3" aria-label="Посилання для покупців">
            {shopConfig.footerLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Ми на зв’язку</h2>
          <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
            <Clock3 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p className="whitespace-pre-line">{shopConfig.contact.hours.replace("; ", "\n")}</p>
          </div>
          {shopConfig.contact.phone && (
            <a
              href={`tel:${shopConfig.contact.phone.replace(/[^+\d]/g, "")}`}
              className="mt-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Phone className="size-4" aria-hidden="true" />
              {shopConfig.contact.phone}
            </a>
          )}
          {shopConfig.contact.email && (
            <a
              href={`mailto:${shopConfig.contact.email}`}
              className="mt-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Mail className="size-4" aria-hidden="true" />
              {shopConfig.contact.email}
            </a>
          )}
          <div className="mt-5 flex items-center gap-2">
            {shopConfig.contact.telegram ? (
              <a
                href={shopConfig.contact.telegram}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                aria-label="Telegram"
              >
                <MessageCircle className="size-4" />
              </a>
            ) : (
              <span
                className="rounded-full border border-border p-2 text-muted-foreground/50"
                aria-hidden="true"
              >
                <Globe className="size-4" />
              </span>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
