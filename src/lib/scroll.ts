/**
 * Плавний благородний скрол до елемента
 */
export function scrollToElement(elementId: string, duration?: number) {
  void duration
  if (typeof window === "undefined") return
  const id = elementId.replace("#", "")
  const el = document.getElementById(id)
  if (!el) return

  el.scrollIntoView({ behavior: "smooth" })
}
