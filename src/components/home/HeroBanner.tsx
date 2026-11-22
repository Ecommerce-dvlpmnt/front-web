"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getCatalogHref } from "@/features/catalog/navigation"

interface HeroSlide {
  id: string
  badge: string
  title: string
  description: string
  ctaText: string
  categorySlug: string
  image: string
  imageAlt: string
  card: {
    tag: string
    title: string
    subtitle: string
    price: string
  }
  features: string[]
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "trees",
    badge: "Зимова колекція 2026",
    title: "Литі ялинки для казкового затишку",
    description:
      "100% лита хвоя від українського виробника. Не обсипається, не має хімічного запаху та дарує святковий настрій вашій оселі понад 10 років.",
    ctaText: "Обрати ялинку",
    categorySlug: "lyti-yalynky",
    image:
      "https://images.unsplash.com/photo-1543589077-47d81606c1bf?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Затишна новорічна ялинка з вогниками у вітальні",
    card: {
      tag: "Хіт сезону",
      title: "Віденська лита ялинка 1.8м",
      subtitle: "100% литі гілочки · Без запаху",
      price: "2 490 ₴",
    },
    features: [
      "100% лита хвоя від виробника",
      "Заводська коробка для зберігання",
      "Оплата при отриманні",
    ],
  },
  {
    id: "wreaths",
    badge: "Ручна робота",
    title: "Різдвяні вінки з натуральними шишками",
    description:
      "Справжній символ домашнього затишку на вхідні двері або святковий стіл. Пишна лита хвоя, надійні кріплення та цупка фабрична коробка.",
    ctaText: "Переглянути вінки",
    categorySlug: "rizdvyani-vinky",
    image:
      "https://images.unsplash.com/photo-1637617066967-0bb74ff04f66?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Різдвяний вінок з хвої та шишок на дверях",
    card: {
      tag: "Новинка",
      title: "Вінок «Зимовий ліс» 50см",
      subtitle: "Натуральні шишки · Калина",
      price: "650 ₴",
    },
    features: [
      "Ручне складання декору",
      "Справжні карпатські шишки",
      "Безпечні матеріали",
    ],
  },
  {
    id: "garlands",
    badge: "Атмосфера свята",
    title: "Пишні гірлянди на камін та сходи",
    description:
      "Густа лита хвоя на міцній гнучкій основі довжиною 2.8 м. Створює чарівні спадаючі хвилі та затишок у кожному куточку вашого дому.",
    ctaText: "Обрати гірлянду",
    categorySlug: "khvoyni-hirlyandy",
    image:
      "https://images.unsplash.com/photo-1495577333576-6b302d687566?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Хвойна святкова гірлянда над каміном",
    card: {
      tag: "Популярне",
      title: "Гірлянда «Преміум хвоя» 2.8м",
      subtitle: "Гнучка основа · Густі гілки",
      price: "850 ₴",
    },
    features: [
      "Довжина 2.8 метра",
      "Гнучкий дріт усередині",
      "Швидка відправка 1–2 дні",
    ],
  },
]

export function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Автоматичне перемикання слайдів кожні 6 секунд із паузою при наведенні
  useEffect(() => {
    if (isPaused) return

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    }, 6000)

    return () => clearInterval(timer)
  }, [isPaused])

  const handleSlideSelect = (index: number) => {
    setCurrentSlide(index)
  }

  const handlePrev = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? HERO_SLIDES.length - 1 : prev - 1
    )
  }

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
  }


  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="group/slider relative isolate overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-[#D4AF37]/35 bg-gradient-to-br from-[#F7F2E8] via-[#EFE5D4] to-[#E5D7BF] dark:from-[#0C1A15] dark:via-[#0B1511] dark:to-[#0E1714] text-[#181512] dark:text-white shadow-[0_20px_50px_-15px_rgba(122,79,8,0.14)] dark:shadow-2xl ring-1 ring-inset ring-white/70 dark:ring-[#F3D078]/15 transition-colors duration-300"
      aria-label="Головний банер"
    >
      {/* Атмосферна віньєтка: тепла шампань-амбра у світлій темі, глибока хвойно-рубінова у темній */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(255,252,245,0.85),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(212,175,55,0.22),transparent_55%),radial-gradient(circle_at_bottom_left,rgba(180,140,75,0.14),transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(20,56,42,0.85),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(122,28,36,0.42),transparent_55%),radial-gradient(circle_at_bottom_left,rgba(11,23,19,0.92),transparent_60%)]"
        aria-hidden="true"
      />

      {/* М'які теплі розсіяні відблиски гірлянд */}
      <div
        className="pointer-events-none absolute top-10 right-1/3 -z-10 size-72 rounded-full bg-[#D4AF37]/25 dark:bg-[#D4AF37]/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-10 -z-10 size-96 rounded-full bg-[#F3D078]/30 dark:bg-[#F3D078]/12 blur-3xl"
        aria-hidden="true"
      />

      {/* 2-колонкова сітка банера */}
      <div className="grid grid-cols-1 items-center gap-10 p-6 sm:p-10 lg:grid-cols-12 lg:gap-12 lg:p-16 min-h-[540px] sm:min-h-[580px]">
        {/* Ліва колонка — тексти слайдів без багу накладання при крос-фейді */}
        <div className="relative grid items-center lg:col-span-7 min-h-[360px] sm:min-h-[400px]">
          {HERO_SLIDES.map((s, idx) => {
            const isActive = idx === currentSlide
            return (
              <div
                key={s.id}
                inert={!isActive}
                aria-hidden={!isActive}
                className={`col-start-1 row-start-1 flex flex-col justify-center transition-[opacity,transform] ${
                  isActive
                    ? "duration-500 delay-150 ease-out opacity-100 translate-y-0 z-10 pointer-events-auto"
                    : "duration-150 ease-in opacity-0 -translate-y-1.5 z-0 pointer-events-none select-none"
                }`}
              >
                <div className="w-fit rounded-full border border-[#8C5E14]/25 dark:border-[#F3D078]/35 bg-[#D4AF37]/15 px-4 py-1 text-[11px] font-semibold tracking-[0.14em] text-[#7A4F08] dark:text-[#F3D078] backdrop-blur-md uppercase shadow-xs">
                  {s.badge}
                </div>

                <h1 className="mt-5 font-heading text-4xl font-semibold tracking-[-0.02em] text-balance text-[#181512] dark:text-[#FAF8F5] sm:text-5xl lg:text-[3.5rem] leading-[1.12]">
                  {s.title}
                </h1>

                <p className="mt-5 max-w-lg text-base leading-relaxed text-[#4A4137] dark:text-[#E8E2D8]/85 sm:text-lg">
                  {s.description}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="relative group h-12 rounded-full border-0 bg-[#181512] text-[#FAF8F5] hover:bg-[#2A231D] dark:bg-gradient-to-r dark:from-[#E5C158] dark:via-[#F3D078] dark:to-[#D4AF37] dark:text-[#14110C] dark:hover:brightness-105 px-8 text-sm font-bold tracking-wide shadow-[0_10px_28px_-6px_rgba(24,21,18,0.28)] dark:shadow-[0_10px_28px_-6px_rgba(212,175,55,0.45)] transition-all duration-200 hover:scale-[1.015] active:scale-[0.99] cursor-pointer"
                  >
                    <Link
                      href={getCatalogHref({ categorySlug: s.categorySlug })}
                      prefetch={false}
                      className="flex items-center gap-2.5"
                    >
                      <span>{s.ctaText}</span>
                      <ArrowRight className="size-4 text-[#F3D078] dark:text-[#14110C] transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>

                {/* Мікро-переваги */}
                <div className="mt-10 flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium text-[#5C5145] dark:text-[#E8E2D8]/75">
                  {s.features.map((feature, fIdx) => (
                    <span key={fIdx} className="flex items-center gap-3">
                      {fIdx > 0 && <span className="text-[#8C5E14]/50 dark:text-[#F3D078]/45">·</span>}
                      <span>{feature}</span>
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Права колонка — Атмосферна картка з фотографією */}
        <div className="relative flex items-center justify-center lg:col-span-5">
          <div
            className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-tr from-[#d4af37]/30 via-[#8c5e14]/15 to-white/40 dark:from-[#d4af37]/25 dark:via-[#7a1c24]/18 dark:to-[#122b21]/30 blur-2xl"
            aria-hidden="true"
          />

          <div className="group relative aspect-[4/5] w-full max-w-sm sm:max-w-md overflow-hidden rounded-3xl border border-white/80 dark:border-[#F3D078]/25 bg-[#121816] shadow-2xl shadow-[#4A3508]/20 dark:shadow-black/60">
            {HERO_SLIDES.map((s, index) => (
              <div
                key={s.id}
                className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                  index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                <Image
                  src={s.image}
                  alt={s.imageAlt}
                  fill
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  sizes="(min-width: 1024px) 45vw, (min-width: 640px) 70vw, 90vw"
                  className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                />

                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#0b1512]/35 via-transparent to-[#d4af37]/15"
                  aria-hidden="true"
                />
              </div>
            ))}

            {/* Плаваюча glassmorphism-плашка товару — без накладання під час зміни слайдів */}
            {HERO_SLIDES.map((s, idx) => {
              const isActive = idx === currentSlide
              return (
                <div
                  key={s.id}
                  inert={!isActive}
                  aria-hidden={!isActive}
                  className={`absolute right-4 bottom-4 left-4 rounded-2xl border border-white/30 dark:border-[#F3D078]/30 bg-[#181512]/80 dark:bg-[#0B1410]/85 p-3.5 sm:p-4 backdrop-blur-md shadow-xl transition-[opacity,transform] ${
                    isActive
                      ? "duration-500 delay-150 ease-out opacity-100 translate-y-0 z-20 pointer-events-auto"
                      : "duration-150 ease-in opacity-0 translate-y-2 z-10 pointer-events-none select-none"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F3D078]">
                        {s.card.tag}
                      </span>
                      <p className="mt-0.5 truncate text-sm font-semibold text-[#FAF8F5]">
                        {s.card.title}
                      </p>
                      <p className="text-xs text-[#E8E2D8]/80">
                        {s.card.subtitle}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="block text-base sm:text-lg font-bold tracking-tight text-[#F3D078]">
                        {s.card.price}
                      </span>
                      <Link
                        href={getCatalogHref({ categorySlug: s.categorySlug })}
                        prefetch={false}
                        className="inline-block text-[11px] font-medium text-white/90 underline underline-offset-2 hover:text-[#F3D078] transition-colors cursor-pointer"
                      >
                        Обрати →
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Керування слайдером: Стрілки та крапки навігації */}
      <div className="relative z-20 flex items-center justify-center gap-4 px-6 pb-6 sm:px-10 sm:pb-8 lg:absolute lg:bottom-5 lg:left-16 lg:justify-start lg:p-0">
        {/* Індикатори-крапки */}
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Слайди банера">
          {HERO_SLIDES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={idx === currentSlide}
              aria-label={`Перейти до слайду ${idx + 1}`}
              onClick={() => handleSlideSelect(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentSlide
                  ? "w-7 bg-[#181512] dark:bg-white shadow-xs"
                  : "w-2 bg-[#181512]/25 hover:bg-[#181512]/50 dark:bg-white/35 dark:hover:bg-white/60"
              }`}
            />
          ))}
        </div>

        {/* Стрілки попередня / наступна */}
        <div className="flex items-center gap-1.5 ml-2 lg:gap-1">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Попередній слайд"
            className="flex size-9 items-center justify-center rounded-full border border-[#181512]/15 bg-white/75 text-[#181512] hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/25 backdrop-blur-sm transition-all active:scale-95 cursor-pointer lg:size-7"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Наступний слайд"
            className="flex size-9 items-center justify-center rounded-full border border-[#181512]/15 bg-white/75 text-[#181512] hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/25 backdrop-blur-sm transition-all active:scale-95 cursor-pointer lg:size-7"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
