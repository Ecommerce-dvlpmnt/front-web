"use client"

import { useEffect } from "react"

/**
 * Мягкое гашение резкости скролла без плавающей инерции.
 * Каждое движение колеса мыши длится ровно 150мс с быстрым ease-out
 * и останавливается сразу, убирая резкие прыжки Windows.
 */
export function CushionedScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(pointer: coarse)").matches) return

    let startY = window.scrollY
    let targetY = window.scrollY
    let startTime = 0
    let rafId: number | null = null
    const DURATION = 150 // Быстрое мягкое сглаживание без затяжного скольжения

    function step(timestamp: number) {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / DURATION, 1)
      // Ease-out: быстро стартует и мягко гасит шаг
      const ease = 1 - Math.pow(1 - progress, 2)

      const current = startY + (targetY - startY) * ease
      window.scrollTo(0, current)

      if (progress < 1) {
        rafId = requestAnimationFrame(step)
      } else {
        rafId = null
      }
    }

    function onWheel(e: WheelEvent) {
      if (e.ctrlKey || e.metaKey) return

      let targetEl = e.target as HTMLElement | null
      while (targetEl && targetEl !== document.body && targetEl !== document.documentElement) {
        const style = window.getComputedStyle(targetEl)
        const overflowY = style.overflowY
        if (
          (overflowY === "auto" || overflowY === "scroll") &&
          targetEl.scrollHeight > targetEl.clientHeight
        ) {
          return
        }
        targetEl = targetEl.parentElement
      }

      e.preventDefault()

      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      )

      // Ограничиваем шаг колеса до мягкого значения
      const delta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 110)

      startY = window.scrollY
      targetY = Math.max(0, Math.min(startY + delta, maxScroll))
      startTime = 0

      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(step)
    }

    window.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      window.removeEventListener("wheel", onWheel)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  return null
}
