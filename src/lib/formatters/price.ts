export function formatPrice(price: number) {
  const normalizedPrice = Number.isFinite(price)
    ? Math.round((price + Number.EPSILON) * 100) / 100
    : 0
  const [wholePart, fractionalPart] = normalizedPrice.toFixed(2).split(".")
  const groupedWholePart = wholePart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    " "
  )

  return `${groupedWholePart},${fractionalPart} ₴`
}
