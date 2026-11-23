"use client"

import { useEffect, useRef } from "react"

interface CategoryScrollNavProps extends React.ComponentProps<"nav"> {
  children: React.ReactNode
}

export function CategoryScrollNav({ children, className, ...props }: CategoryScrollNavProps) {
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = navRef.current
    if (!el) return
    const mobile = window.matchMedia("(max-width: 767px)")
    const syncScrollMode = () => {
      if (mobile.matches) el.setAttribute("data-lenis-prevent", "")
      else el.removeAttribute("data-lenis-prevent")
    }
    syncScrollMode()
    mobile.addEventListener("change", syncScrollMode)

    // 1. Прокрутка колесиком мыши по горизонтали
    const onWheel = (e: WheelEvent) => {
      if (window.matchMedia("(min-width: 768px)").matches) return
      if (e.deltaY !== 0 && el.scrollWidth > el.clientWidth) {
        // Проверяем, есть ли куда скроллить по горизонтали
        const canScrollLeft = e.deltaY < 0 && el.scrollLeft > 0
        const canScrollRight = e.deltaY > 0 && el.scrollLeft < el.scrollWidth - el.clientWidth - 1

        if (canScrollLeft || canScrollRight) {
          e.preventDefault()
          el.scrollLeft += e.deltaY
        }
      }
    }

    // 2. Скролл перетаскиванием мыши (mouse drag / swipe)
    let isDown = false
    let startX = 0
    let scrollStart = 0
    let hasMoved = false

    const onMouseDown = (e: MouseEvent) => {
      if (window.matchMedia("(min-width: 768px)").matches) return
      if (e.button !== 0) return
      isDown = true
      hasMoved = false
      startX = e.pageX - el.offsetLeft
      scrollStart = el.scrollLeft
      el.style.cursor = "grab"
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return
      const x = e.pageX - el.offsetLeft
      const walk = (x - startX) * 1.2
      if (Math.abs(walk) > 4) {
        hasMoved = true
        el.style.cursor = "grabbing"
        el.style.userSelect = "none"
      }
      el.scrollLeft = scrollStart - walk
    }

    const onMouseUp = () => {
      if (!isDown) return
      isDown = false
      el.style.cursor = ""
      el.style.removeProperty("user-select")
    }

    const onClickCapture = (e: MouseEvent) => {
      if (hasMoved) {
        // Если пользователь тянул список мышкой, предотвращаем переход по ссылке
        e.preventDefault()
        e.stopPropagation()
        hasMoved = false
      }
    }

    const onDragStart = (e: DragEvent) => {
      // Предотвращаем стандартный drag ссылки браузером при перетаскивании ленты
      e.preventDefault()
    }

    el.addEventListener("wheel", onWheel, { passive: false })
    el.addEventListener("mousedown", onMouseDown)
    el.addEventListener("dragstart", onDragStart)
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    el.addEventListener("click", onClickCapture, { capture: true })

    return () => {
      mobile.removeEventListener("change", syncScrollMode)
      el.removeEventListener("wheel", onWheel)
      el.removeEventListener("mousedown", onMouseDown)
      el.removeEventListener("dragstart", onDragStart)
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
      el.removeEventListener("click", onClickCapture, { capture: true })
    }
  }, [])

  return (
    <nav
      ref={navRef}
      className={className}
      {...props}
    >
      {children}
    </nav>
  )
}
