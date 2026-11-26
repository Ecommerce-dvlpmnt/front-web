import type { Product } from "@/types/product"
import { getTreeHeightModel } from "@/features/product/height-variants"

export interface ProductOptionModel {
  key: string
  search: string
  dimension: string | null
  dimensionLabel: "Висота" | "Довжина" | "Розмір"
  color: string | null
}

const colors = [
  { pattern: /(?:мультиколор|різнокольоров(?:ий|а|е)|кольоров(?:ий|а|е)|multicolor|multi.?color)/iu, label: "Різнокольоровий", background: "conic-gradient(#ef4444, #facc15, #22c55e, #3b82f6, #a855f7, #ef4444)" },
  { pattern: /(?:тепло[\s-]*біл(?:ий|а|е)|тепл(?:ий|а|е)(?:\s+біл(?:ий|а|е))?|warm[\s-]*white)/iu, label: "Теплий білий", background: "#FFE4A0" },
  { pattern: /(?:холодно[\s-]*біл(?:ий|а|е)|холодн(?:ий|а|е)(?:\s+біл(?:ий|а|е))?|cold[\s-]*white|cool[\s-]*white)/iu, label: "Холодний білий", background: "#F4F8FF" },
  { pattern: /(?:син(?:ій|я|є)|блакитн(?:ий|а|е)|blue)/iu, label: "Синій", background: "#3B82F6" },
  { pattern: /(?:жовт(?:ий|а|е)|yellow)/iu, label: "Жовтий", background: "#FACC15" },
  { pattern: /(?:червон(?:ий|а|е)|red)/iu, label: "Червоний", background: "#EF4444" },
  { pattern: /(?:зелен(?:ий|а|е)|green)/iu, label: "Зелений", background: "#22C55E" },
  { pattern: /(?:рожев(?:ий|а|е)|pink)/iu, label: "Рожевий", background: "#EC4899" },
  { pattern: /(?:фіолетов(?:ий|а|е)|фиолетов(?:ый|ая|ое)|violet|purple)/iu, label: "Фіолетовий", background: "#A855F7" },
  { pattern: /(?:біл(?:ий|а|е)|white)/iu, label: "Білий", background: "#FFFFFF" },
] as const

function normalized(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("uk-UA").replace(/[^\p{L}\p{N}]+/gu, " ").trim()
}

function readAttributes(attributes?: string | null): Record<string, string> {
  if (!attributes) return {}
  try {
    const parsed: unknown = JSON.parse(attributes)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}
    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
  } catch { return {} }
}

function attribute(attributes: Record<string, string>, names: RegExp) {
  return Object.entries(attributes).find(([name]) => names.test(name))?.[1]
}

function getColor(name: string, attributes: Record<string, string>) {
  const explicit = attribute(attributes, /^(?:колір(?:\s+(?:світіння|корпусу))?|color|light\s*color)$/iu)
  for (const source of [name, explicit ?? ""]) {
    const match = colors.find(({ pattern }) => pattern.test(source))
    if (match) return match.label
  }
  return null
}

export function getOptionColorBackground(product: Pick<Product, "name" | "attributes">): string | null {
  const attributes = readAttributes(product.attributes)
  const hex = attribute(attributes, /^(?:colorhex|colourhex|колір\s*hex|hex)$/iu)?.trim()
  if (hex && /^#[\da-f]{6}$/iu.test(hex)) return hex
  const color = getColor(product.name, attributes)
  return colors.find((item) => item.label === color)?.background ?? null
}

export function getProductOptionModel(product: Pick<Product, "name" | "attributes">): ProductOptionModel | null {
  const tree = getTreeHeightModel(product.name)
  const attributes = readAttributes(product.attributes)
  const color = getColor(product.name, attributes)
  if (tree) {
    // Tree foliage colors are distinct products; only heights share a card.
    return { key: tree.key, search: tree.search, dimension: tree.height, dimensionLabel: "Висота", color }
  }
  const unit = "(?:сантиметр(?:ів|и|а)?|метр(?:ів|и|а)?|см|м)"
  const grid = new RegExp(`(?<![\\p{L}\\p{N}])\\d+(?:[.,]\\d+)?\\s*[×xх*]\\s*\\d+(?:[.,]\\d+)?\\s*${unit}(?![\\p{L}\\p{N}])`, "iu")
  const scalar = new RegExp(`(?<![\\p{L}\\p{N}])\\d+(?:[.,]\\d+)?\\s*${unit}(?![\\p{L}\\p{N}])`, "iu")
  const match = product.name.match(grid) ?? product.name.match(scalar)
  const explicit = attribute(attributes, /^(?:довжина|розмір|висота|length|size|height)$/iu)
  const rawDimension = match?.[0] ?? explicit?.match(grid)?.[0] ?? explicit?.match(scalar)?.[0]
  if (!rawDimension && !color) return null
  const dimension = rawDimension?.replace(/\s*[xх*×]\s*/iu, "×").replace(/\s*(?:сантиметр(?:ів|и|а)?|см)$/iu, " см").replace(/\s*(?:метр(?:ів|и|а)?|м)$/iu, " м").replace(/\s+/g, " ").trim() ?? null
  const dimensionLabel = grid.test(rawDimension ?? "") ? "Розмір" : /гірлянд/iu.test(product.name) ? "Довжина" : "Розмір"

  let base = product.name
  if (match) base = base.replace(match[0], " ")
  const led = /(?<![\p{L}\p{N}])(\d+)\s*led(?![\p{L}\p{N}])/iu.exec(base)
  if (led && /гірлянд/iu.test(product.name)) base = base.replace(led[0], " ")
  for (const item of colors) base = base.replace(item.pattern, " ")
  base = base.replace(/\sна\s+usb(?=\s|$)/iu, " usb")
  const meters = rawDimension && !grid.test(rawDimension) ? Number(rawDimension.match(/[\d.,]+/)?.[0].replace(",", ".")) : 0
  const ledDensity = led && meters > 0 ? Number(led[1]) / meters : 0
  const key = `${normalized(base)}${ledDensity > 0 ? ` led-per-meter-${ledDensity}` : ""}`
  // A targeted API Search needs a contiguous substring from the original title.
  const fragments = product.name.split(match?.[0] ?? "\u0000")
    .flatMap((part) => colors.reduce((parts, item) => parts.flatMap((value) => value.split(item.pattern)), [part]))
    .map((part) => part.replace(/^[\s,()\-]+|[\s,()\-]+$/g, ""))
  const prefix = fragments[0] ?? ""
  const search = /usb/iu.test(base) ? "Гірлянда" :
    normalized(prefix).length >= 4 ? prefix : fragments.sort((a, b) => b.length - a.length)[0] ?? ""
  if (!key || !search || normalized(search).length < 4) return null
  return { key, search, dimension, dimensionLabel, color }
}

export function selectProductOptions(product: Product, candidates: Product[]): Product[] {
  const model = getProductOptionModel(product)
  if (!model || product.isActive !== true) return []
  const seen = new Set<string>()
  return [product, ...candidates].filter((candidate) => {
    const next = getProductOptionModel(candidate)
    if (candidate.isActive !== true || !candidate.slug || seen.has(candidate.id) ||
      candidate.categoryId !== product.categoryId || next?.key !== model.key ||
      !Number.isFinite(candidate.price) || !Number.isInteger(candidate.stock) || candidate.stock < 0) return false
    seen.add(candidate.id)
    return true
  }).sort((a, b) => {
    const left = getProductOptionModel(a)!, right = getProductOptionModel(b)!
    const number = (value: string | null) => Number(value?.match(/[\d.,]+/)?.[0].replace(",", ".") ?? 0)
    return number(left.dimension) - number(right.dimension) || (left.color ?? "").localeCompare(right.color ?? "", "uk") || a.id.localeCompare(b.id)
  })
}

export function getOptionTarget(options: Product[], current: Product, field: "dimension" | "color", value: string) {
  const selected = getProductOptionModel(current)
  const matches = options.filter((option) => getProductOptionModel(option)?.[field] === value)
  const other = field === "dimension" ? "color" : "dimension"
  return matches.find((option) => getProductOptionModel(option)?.[other] === selected?.[other]) ?? matches[0]
}
