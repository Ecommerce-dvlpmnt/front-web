"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { CheckCircle2, Clock, MessageCircle, Phone, PhoneCall, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { shopConfig } from "@/lib/config/shop"
import { cn } from "@/lib/utils"

/**
 * Точка інтеграції для Максима (бекенд / Telegram-сповіщення):
 * 1. Для прямого дзвінка достатньо прописати `NEXT_PUBLIC_SHOP_PHONE=+380...` у `.env.local` / Vercel.
 * 2. Для форми «Передзвоніть мені» можна підключити виклик API всередині `submitCallbackRequest`.
 */
async function submitCallbackRequest(phone: string): Promise<void> {
  // TODO (Maxim): підключити POST-запит на бекенд або сповіщення в Telegram-бот, наприклад:
  // await fetch("/api/callback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) })
  void phone
}

export function FloatingContactWidget() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [phoneInput, setPhoneInput] = useState("")
  const [errorText, setErrorText] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const configuredPhone = shopConfig.contact.phone
  const cleanTelHref = configuredPhone ? `tel:${configuredPhone.replace(/[^+\d]/g, "")}` : ""

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("mousedown", handlePointerDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousedown", handlePointerDown)
    }
  }, [isOpen])

  if (pathname?.startsWith("/admin")) {
    return null
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const digits = phoneInput.replace(/\D/g, "")

    if (digits.length < 9) {
      setErrorText("Введіть коректний номер телефону")
      return
    }

    setErrorText(null)
    setIsSubmitting(true)

    try {
      await submitCallbackRequest(phoneInput.trim())
      setIsSubmitted(true)
      setPhoneInput("")
    } catch {
      setErrorText("Не вдалося надіслати заявку. Спробуйте пізніше.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className="fixed right-4 bottom-4 z-40 flex flex-col items-end sm:right-6 sm:bottom-6"
    >
      {/* Спливаюча плашка зворотного зв’язку */}
      <div
        id="floating-contact-popover"
        role="dialog"
        aria-label="Зв’язок з менеджером"
        aria-hidden={!isOpen}
        className={cn(
          "mb-3 w-[calc(100vw-2rem)] max-w-[20.5rem] origin-bottom-right rounded-3xl border border-[#D4AF37]/35 bg-card/98 p-5 text-card-foreground shadow-2xl backdrop-blur-md transition-all duration-250 ease-out dark:bg-[#0F1B15]/98",
          isOpen
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-2 scale-95 opacity-0"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-bold tracking-[0.18em] text-[#8C5E14] dark:text-[#F3D078] uppercase">
              Швидкий зв’язок
            </p>
            <h2 className="mt-1 font-heading text-base font-semibold tracking-tight text-foreground">
              Потрібна консультація?
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Закрити вікно зв’язку"
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          Зателефонуйте нам напряму або залиште свій номер — підкажемо висоту ялинки, пишність та доставку.
        </p>

        {/* Прямий дзвінок (автоматично активується, коли Максим додасть NEXT_PUBLIC_SHOP_PHONE) */}
        <div className="mt-3.5 space-y-2">
          {configuredPhone ? (
            <a
              href={cleanTelHref}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#D4AF37]/45 bg-[#FBF6EB] px-4 text-xs font-semibold text-[#181512] outline-none transition-colors hover:bg-[#F4EAD4] focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60 dark:bg-[#162820] dark:text-[#F3D078] dark:hover:bg-[#1C3328]"
            >
              <PhoneCall className="size-3.5 shrink-0 text-[#8C5E14] dark:text-[#F3D078]" aria-hidden="true" />
              <span>{configuredPhone}</span>
            </a>
          ) : (
            <div className="flex items-center gap-2.5 rounded-2xl border border-[#D4AF37]/25 bg-muted/45 px-3.5 py-2.5 text-xs text-muted-foreground dark:bg-[#13221B]/70">
              <PhoneCall className="size-3.5 shrink-0 text-[#8C5E14] dark:text-[#F3D078]" aria-hidden="true" />
              <span>Пряма лінія скоро буде підключена — залиште номер нижче</span>
            </div>
          )}

          {shopConfig.contact.telegram && (
            <a
              href={shopConfig.contact.telegram}
              target="_blank"
              rel="noreferrer"
              className="flex h-9 w-full items-center justify-center gap-2 rounded-full border border-border/80 bg-background/70 px-4 text-xs font-medium text-foreground outline-none transition-colors hover:border-[#D4AF37]/45 hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
            >
              <MessageCircle className="size-3.5 shrink-0 text-[#8C5E14] dark:text-[#F3D078]" aria-hidden="true" />
              <span>Написати в Telegram</span>
            </a>
          )}
        </div>

        <div className="my-3.5 border-t border-border/60" />

        {isSubmitted ? (
          <div
            role="status"
            className="rounded-2xl border border-[#D4AF37]/35 bg-[#173628]/8 p-3.5 text-xs dark:bg-[#173628]/45"
          >
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <CheckCircle2 className="size-4 shrink-0 text-[#2E6B4E] dark:text-[#F3D078]" aria-hidden="true" />
              <span>Дякуємо! Заявку прийнято</span>
            </div>
            <p className="mt-1 leading-relaxed text-muted-foreground">
              Менеджер зв’яжеться з вами у робочий час магазину.
            </p>
            <button
              type="button"
              onClick={() => setIsSubmitted(false)}
              className="mt-2 text-[11px] font-semibold text-[#8C5E14] underline underline-offset-4 outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60 dark:text-[#F3D078]"
            >
              Вказати інший номер
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2.5" noValidate>
            <label htmlFor="floating-callback-phone" className="block text-xs font-medium text-foreground">
              Залиште номер для дзвінка
            </label>
            <Input
              id="floating-callback-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phoneInput}
              onChange={(event) => {
                setPhoneInput(event.target.value)
                if (errorText) setErrorText(null)
              }}
              placeholder="+380 (XX) XXX-XX-XX"
              className="h-10 rounded-full border-border/90 bg-background px-4 text-sm focus-visible:border-[#D4AF37]/70"
            />
            {errorText && (
              <p role="alert" className="px-1 text-[11px] font-medium text-destructive">
                {errorText}
              </p>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 w-full rounded-full bg-[#181512] text-xs font-semibold text-[#FBF7EE] hover:bg-[#2A241E] dark:bg-gradient-to-r dark:from-[#E5C158] dark:via-[#F3D078] dark:to-[#D4AF37] dark:text-[#14110C] dark:hover:brightness-105"
            >
              {isSubmitting ? "Надсилаємо..." : "Чекаю на дзвінок"}
            </Button>
          </form>
        )}

        <div className="mt-3.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="size-3 shrink-0 text-[#8C5E14] dark:text-[#F3D078]" aria-hidden="true" />
          <span className="truncate">{shopConfig.contact.hours}</span>
        </div>
      </div>

      {/* Кругла кнопка виклику плашки справа знизу */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="floating-contact-popover"
        aria-label={isOpen ? "Закрити вікно дзвінка" : "Зворотний дзвінок або консультація"}
        className="group relative flex size-12 items-center justify-center rounded-full bg-[#181512] text-[#F3D078] shadow-xl ring-1 ring-[#D4AF37]/50 outline-none transition-all duration-200 hover:scale-105 hover:bg-[#262019] focus-visible:ring-2 focus-visible:ring-[#D4AF37] sm:size-13 dark:bg-gradient-to-br dark:from-[#E5C158] dark:via-[#F3D078] dark:to-[#C99B2C] dark:text-[#14110C]"
      >
        {!isOpen && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-1 rounded-full border border-[#D4AF37]/35 opacity-75 transition-transform duration-300 group-hover:scale-110"
          />
        )}
        {isOpen ? (
          <X className="size-5 transition-transform duration-200" aria-hidden="true" />
        ) : (
          <Phone className="size-5 transition-transform duration-200 group-hover:-rotate-12" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
