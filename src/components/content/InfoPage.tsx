import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, Sparkles } from "lucide-react"

import { shopConfig } from "@/lib/config/shop"
import { cn } from "@/lib/utils"

interface InfoPageProps {
  eyebrow?: string
  title: string
  description: string
  activeHref?: string
  children: ReactNode
}

export function InfoPage({
  eyebrow = "Довідка покупця · Jingle Decor",
  title,
  description,
  activeHref,
  children,
}: InfoPageProps) {
  return (
    <div className="relative min-h-full overflow-hidden bg-background">
      {/* М’яке фонове свічення у фірмових тонах */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,rgba(212,175,55,0.12),transparent_72%)] dark:bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,rgba(27,67,50,0.34),transparent_72%)]"
      />

      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="mb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/80 px-3.5 py-1.5 text-xs font-medium text-muted-foreground outline-none transition-colors hover:border-[#D4AF37]/45 hover:text-foreground focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            <span>На головну до каталогу</span>
          </Link>
        </div>

        {/* Шапка інформаційної сторінки */}
        <header className="relative overflow-hidden rounded-3xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#FBF7EE] via-[#F5ECDC] to-[#EFE2CA] p-6 shadow-sm sm:p-9 dark:from-[#0F1E18] dark:via-[#0D1813] dark:to-[#13241C]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.18),transparent_68%)]"
          />

          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/35 bg-background/70 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-[#8C5E14] uppercase dark:bg-[#152820]/80 dark:text-[#F3D078]">
              <Sparkles className="size-3" aria-hidden="true" />
              <span>{eyebrow}</span>
            </span>

            <h1 className="mt-3.5 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-7">
              {description}
            </p>
          </div>

          {/* Швидке перемикання між сторінками футера */}
          <nav
            aria-label="Інформаційні розділи"
            className="relative mt-6 flex flex-wrap gap-2 border-t border-[#D4AF37]/20 pt-5"
          >
            {shopConfig.footerLinks.map((link) => {
              const isActive = activeHref === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "inline-flex h-8.5 items-center rounded-full px-3.5 text-xs font-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60",
                    isActive
                      ? "bg-[#181512] font-semibold text-[#FBF7EE] shadow-xs dark:bg-gradient-to-r dark:from-[#E5C158] dark:via-[#F3D078] dark:to-[#D4AF37] dark:text-[#14110C]"
                      : "border border-[#D4AF37]/25 bg-background/75 text-foreground/80 hover:border-[#D4AF37]/55 hover:bg-background hover:text-foreground dark:bg-[#0B1410]/70"
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </header>

        <div className="mt-8 space-y-6 text-muted-foreground [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_li]:leading-7 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_p]:leading-7 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          {children}
        </div>
      </div>
    </div>
  )
}
