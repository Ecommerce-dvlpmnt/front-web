import Link from "next/link"
import { Clock3, Globe, MessageCircle } from "lucide-react"

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
            <p>
              Пн–Пт: 09:00–19:00
              <br />
              Сб–Нд: 10:00–18:00
            </p>
          </div>
          <div className="mt-5 flex items-center gap-2">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              aria-label="Instagram"
            >
              <Globe className="size-4" />
            </a>
            <a
              href="https://t.me"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              aria-label="Telegram"
            >
              <MessageCircle className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
