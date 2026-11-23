import Link from "next/link"
import { Clock3, Globe, Mail, Phone } from "lucide-react"

import { BrandLogo } from "@/components/layout/BrandLogo"
import { shopConfig } from "@/lib/config/shop"

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8 lg:py-16">
        <div>
          <Link
            href="/"
            className="inline-flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`${shopConfig.name} — на головну`}
          >
            <BrandLogo animated={false} />
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
          {shopConfig.contact.phone ? (
            <a
              href={`tel:${shopConfig.contact.phone.replace(/[^+\d]/g, "")}`}
              className="mt-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Phone className="size-4" aria-hidden="true" />
              {shopConfig.contact.phone}
            </a>
          ) : null}
          {shopConfig.contact.email ? (
            <a
              href={`mailto:${shopConfig.contact.email}`}
              className="mt-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Mail className="size-4" aria-hidden="true" />
              {shopConfig.contact.email}
            </a>
          ) : null}
          <div className="mt-5 flex items-center gap-2">
            {shopConfig.contact.telegram ? (
              <a
                href={shopConfig.contact.telegram}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                aria-label="Telegram"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M21.94 4.67a1.2 1.2 0 0 0-1.42-.31L2.76 11.3a1.15 1.15 0 0 0 .08 2.16l4.42 1.44 1.7 5.35a1.14 1.14 0 0 0 1.9.48l2.46-2.4 4.55 3.34a1.2 1.2 0 0 0 1.86-.72l2.57-15.1a1.2 1.2 0 0 0-.36-1.18ZM9.08 14.3l8.84-6.44-7.1 8.04-.46 2.02-1.28-3.62Z" />
                </svg>
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
