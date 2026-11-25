"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

import type { ProductGalleryImage } from "@/features/product/product-utils"

interface ImageLightboxProps {
  images: ProductGalleryImage[]
  initialIndex: number
  onClose: () => void
}

export function ImageLightbox({ images, initialIndex, onClose }: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const touchStartX = useRef<number | null>(null)
  const current = images[index]

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
      if (event.key === "ArrowLeft" && images.length > 1) setIndex((value) => (value - 1 + images.length) % images.length)
      if (event.key === "ArrowRight" && images.length > 1) setIndex((value) => (value + 1) % images.length)
      if (event.key === "Tab") {
        const buttons = [...(dialogRef.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? [])]
        if (buttons.length === 0) return
        const next = event.shiftKey ? buttons.at(-1) : buttons[0]
        if (document.activeElement === (event.shiftKey ? buttons[0] : buttons.at(-1))) {
          event.preventDefault()
          next?.focus()
        }
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [images.length, onClose])

  if (!current || typeof document === "undefined") return null

  return createPortal(
    <div
      ref={dialogRef}
      data-image-lightbox
      role="dialog"
      aria-modal="true"
      aria-label="Перегляд фотографій товару"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 p-3 text-white backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}
      onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null }}
      onTouchEnd={(event) => {
        const end = event.changedTouches[0]?.clientX
        if (touchStartX.current !== null && end !== undefined && Math.abs(end - touchStartX.current) > 50) {
          setIndex((value) => (value + (end < touchStartX.current! ? 1 : -1) + images.length) % images.length)
        }
        touchStartX.current = null
      }}
    >
      <div className="absolute right-4 top-4 z-10 flex items-center gap-3">
        <span className="rounded-full bg-black/50 px-3 py-1 text-sm" aria-live="polite">{index + 1} / {images.length}</span>
        <button ref={closeRef} type="button" aria-label="Закрити перегляд" onClick={onClose} className="rounded-full bg-white/10 p-2 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"><X className="size-5" /></button>
      </div>
      <div className="relative flex h-[min(88vh,100%)] w-full max-w-[92vw] items-center justify-center">
        <Image key={current.src} src={current.src} alt={current.alt} fill sizes="92vw" className="object-contain" unoptimized priority />
      </div>
      {images.length > 1 && (
        <>
          <button type="button" aria-label="Попереднє фото" onClick={() => setIndex((value) => (value - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-2 hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 sm:left-5"><ChevronLeft className="size-6" /></button>
          <button type="button" aria-label="Наступне фото" onClick={() => setIndex((value) => (value + 1) % images.length)} className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-2 hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 sm:right-5"><ChevronRight className="size-6" /></button>
          <div className="absolute bottom-3 left-1/2 z-10 flex max-w-[92vw] -translate-x-1/2 gap-2 overflow-x-auto rounded-xl bg-black/60 p-2">
            {images.map((image, imageIndex) => (
              <button key={`${image.src}:${imageIndex}`} type="button" aria-label={`Фото ${imageIndex + 1}`} aria-pressed={imageIndex === index} onClick={() => setIndex(imageIndex)} className={`relative size-12 shrink-0 overflow-hidden rounded-md border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 sm:size-14 ${imageIndex === index ? "border-amber-300" : "border-white/30 opacity-65 hover:opacity-100"}`}>
                <Image src={image.src} alt="" fill sizes="56px" className="object-cover" loading="lazy" unoptimized />
              </button>
            ))}
          </div>
        </>
      )}
    </div>,
    document.body
  )
}
