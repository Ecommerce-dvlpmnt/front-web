import Link from "next/link"
import { Clock3, Globe, Mail, Phone } from "lucide-react"

import { BrandLogo } from "@/components/layout/BrandLogo"
import { shopConfig } from "@/lib/config/shop"

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-[#D4AF37]/25 dark:border-[#D4AF37]/20 bg-gradient-to-b from-[#F4EFE6]/85 via-[#EDE5D7]/75 to-[#E6DCC8]/70 dark:from-[#0E1814] dark:via-[#0B1310] dark:to-[#080D0B]">
      <div
        className="pointer-events-none absolute -top-24 left-1/4 h-56 w-96 rounded-full bg-[#D4AF37]/12 dark:bg-[#D4AF37]/8 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto grid max-w-7xl gap-9 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-10 lg:px-8 lg:py-14">
        <div>
          <Link
            href="/"
            className="inline-flex items-center overflow-visible rounded-xl py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`${shopConfig.name} — на головну`}
          >
            <BrandLogo animated={false} />
          </Link>
          <p className="mt-3.5 max-w-xs text-sm leading-6 text-muted-foreground">
            {shopConfig.description}. Обирайте деталі, які роблять кожен день
            особливим.
          </p>
          <p className="mt-6 sm:mt-8 text-xs text-muted-foreground">
            © {new Date().getFullYear()} {shopConfig.name}. Усі права захищені.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-xs font-bold uppercase tracking-[0.16em] text-[#8C5E14] dark:text-[#F3D078]">Покупцям</h2>
          <nav className="mt-4 flex flex-col items-start gap-2.5" aria-label="Посилання для покупців">
            {shopConfig.footerLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-md py-0.5 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h2 className="font-heading text-xs font-bold uppercase tracking-[0.16em] text-[#8C5E14] dark:text-[#F3D078]">Ми на зв’язку</h2>
          <div className="mt-4 flex items-start gap-2.5 text-sm text-muted-foreground">
            <Clock3 className="mt-0.5 size-4 shrink-0 text-[#8C5E14] dark:text-[#F3D078]" aria-hidden="true" />
            <p className="whitespace-pre-line">{shopConfig.contact.hours.replace("; ", "\n")}</p>
          </div>
          {shopConfig.contact.phone ? (
            <a
              href={`tel:${shopConfig.contact.phone.replace(/[^+\d]/g, "")}`}
              className="mt-3 flex w-fit items-center gap-2.5 rounded-md text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
            >
              <Phone className="size-4 text-[#8C5E14] dark:text-[#F3D078]" aria-hidden="true" />
              {shopConfig.contact.phone}
            </a>
          ) : null}
          {shopConfig.contact.email ? (
            <a
              href={`mailto:${shopConfig.contact.email}`}
              className="mt-3 flex w-fit items-center gap-2.5 rounded-md text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
            >
              <Mail className="size-4 text-[#8C5E14] dark:text-[#F3D078]" aria-hidden="true" />
              {shopConfig.contact.email}
            </a>
          ) : null}
          <div className="mt-5 flex items-center gap-2">
            {shopConfig.contact.telegram ? (
              <a
                href={shopConfig.contact.telegram}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[#D4AF37]/35 bg-background/60 p-2.5 text-muted-foreground outline-none transition-colors hover:border-[#D4AF37]/70 hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
                aria-label="Telegram"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M21.94 4.67a1.2 1.2 0 0 0-1.42-.31L2.76 11.3a1.15 1.15 0 0 0 .08 2.16l4.42 1.44 1.7 5.35a1.14 1.14 0 0 0 1.9.48l2.46-2.4 4.55 3.34a1.2 1.2 0 0 0 1.86-.72l2.57-15.1a1.2 1.2 0 0 0-.36-1.18ZM9.08 14.3l8.84-6.44-7.1 8.04-.46 2.02-1.28-3.62Z" />
                </svg>
              </a>
            ) : (
              <span
                className="rounded-full border border-border p-2.5 text-muted-foreground/50"
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
