/**
 * Плавный благородный скролл к элементу с регулируемой длительностью
 */
export function scrollToElement(elementId: string, duration = 1.6) {
  if (typeof window === "undefined") return
  const id = elementId.replace("#", "")
  const el = document.getElementById(id)
  if (!el) return

  // @ts-expect-error глобальный экземпляр Lenis
  const lenis = window.__lenis
  if (lenis && typeof lenis.scrollTo === "function") {
    lenis.scrollTo(el, {
      offset: -85,
      duration,
      easing: (t: number) => 1 - Math.pow(1 - t, 3.5),
    })
  } else {
    el.scrollIntoView({ behavior: "smooth" })
  }
}
