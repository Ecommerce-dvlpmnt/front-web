"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

const BANNER_ASPECT_RATIO = "2400 / 656"

const bannerSlides = [
  {
    id: "two-photos",
    src: "/images/hero/two-photos.png",
    alt: "Банер Jingle Decor із ялинкою та подарунковою коробкою",
    href: "/#catalog",
    linkLabel: "Переглянути святковий каталог",
  },
  {
    id: "wreath",
    src: "/images/hero/wreath.png",
    alt: "Банер Jingle Decor із різдвяним вінком",
    href: "/catalog/rizdvyani-vinky",
    linkLabel: "Переглянути різдвяні вінки",
  },
  {
    id: "sale",
    src: "/images/hero/sale.png",
    alt: "Банер новорічного розпродажу Jingle Decor зі знижками до 30%",
    href: "/#catalog",
    linkLabel: "Переглянути каталог зі знижками",
  },
] as const

export function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return

    const timer = setInterval(() => {
      setCurrentSlide((previous) => (previous + 1) % bannerSlides.length)
    }, 6000)

    return () => clearInterval(timer)
  }, [isPaused])

  const handlePrev = () => {
    setCurrentSlide((previous) =>
      previous === 0 ? bannerSlides.length - 1 : previous - 1
    )
  }

  const handleNext = () => {
    setCurrentSlide((previous) => (previous + 1) % bannerSlides.length)
  }

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="group/slider relative z-40 isolate overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-[#091511] shadow-luxury sm:rounded-3xl"
      aria-label="Головний банер"
    >
      <div
        className="relative w-full overflow-hidden bg-[#091511]"
        style={{ aspectRatio: BANNER_ASPECT_RATIO }}
      >
        {bannerSlides.map((slide, index) => {
          const isActive = index === currentSlide

          return (
            <div
              key={slide.id}
              inert={!isActive}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-opacity duration-500 ${
                isActive ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
              }`}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                loading={isActive ? "eager" : "lazy"}
                fetchPriority={isActive && index === 0 ? "high" : "auto"}
                sizes="(min-width: 80rem) 80rem, 100vw"
                className="object-cover object-center"
              />
              <Link
                href={slide.href}
                aria-label={slide.linkLabel}
                className="absolute inset-0 z-10 cursor-pointer focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F3D078]"
              />
            </div>
          )
        })}

        <div className="pointer-events-none absolute inset-0 z-20">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Попередній слайд"
            className="pointer-events-auto absolute left-2 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-[#091511]/60 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-[#091511]/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:left-4 sm:size-10"
          >
            <ChevronLeft className="size-4 sm:size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Наступний слайд"
            className="pointer-events-auto absolute right-2 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-[#091511]/60 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-[#091511]/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-4 sm:size-10"
          >
            <ChevronRight className="size-4 sm:size-5" aria-hidden="true" />
          </button>

          <div
            className="pointer-events-auto absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/15 bg-[#091511]/60 px-2.5 py-1.5 shadow-lg backdrop-blur-sm"
            role="tablist"
            aria-label="Слайди банера"
          >
            {bannerSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={index === currentSlide}
                aria-label={`Перейти до слайду ${index + 1}`}
                onClick={() => setCurrentSlide(index)}
                className={`relative h-1.5 rounded-full transition-all duration-300 cursor-pointer after:absolute after:-inset-2 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:h-2 ${
                  index === currentSlide
                    ? "w-5 bg-[#F3D078] sm:w-6"
                    : "w-1.5 bg-white/60 hover:bg-white sm:w-2"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
