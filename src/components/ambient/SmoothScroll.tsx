"use client"

import { useEffect } from "react"

/**
 * Плавний інерційний скрол без зовнішніх залежностей.
 * Забезпечує благородне, м'яке ковзання сторінки при прокручуванні колесом миші.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return

    // Враховуємо системні налаштування зменшення руху
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    if (prefersReducedMotion) return

    // На сенсорних пристроях залишаємо нативний жестовий скрол
    const isTouch =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches
    if (isTouch) return

    let currentY = window.scrollY
    let targetY = window.scrollY
    let isRunning = false
    let rafId: number | null = null

    // Коефіцієнт демпфування для м'якого ковзання
    const DAMPING = 0.08

    function update() {
      const diff = targetY - currentY
      currentY += diff * DAMPING

      window.scrollTo(0, Math.round(currentY * 10) / 10)

      if (Math.abs(targetY - currentY) > 0.5) {
        rafId = requestAnimationFrame(update)
      } else {
        window.scrollTo(0, targetY)
        currentY = targetY
        isRunning = false
        rafId = null
      }
    }

    function onWheel(e: WheelEvent) {
      if (e.ctrlKey || e.metaKey) return

      // Якщо користувач скролить всередині внутрішнього модального блоку/списку
      let targetEl = e.target as HTMLElement | null
      let isInsideScrollable = false

      while (targetEl && targetEl !== document.body && targetEl !== document.documentElement) {
        const style = window.getComputedStyle(targetEl)
        const overflowY = style.overflowY
        if (
          (overflowY === "auto" || overflowY === "scroll") &&
          targetEl.scrollHeight > targetEl.clientHeight
        ) {
          isInsideScrollable = true
          break
        }
        targetEl = targetEl.parentElement
      }

      if (isInsideScrollable) return

      e.preventDefault()

      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      )

      const delta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 120) * 1.3
      targetY = Math.max(0, Math.min(targetY + delta, maxScroll))

      if (!isRunning) {
        isRunning = true
        rafId = requestAnimationFrame(update)
      }
    }

    function onNativeScroll() {
      if (!isRunning) {
        currentY = window.scrollY
        targetY = window.scrollY
      }
    }

    window.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("scroll", onNativeScroll, { passive: true })

    return () => {
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("scroll", onNativeScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  return null
}
