import { z } from "zod"

import type { ProductInput } from "@/lib/api/admin/products"

const numberFromInput = (value: unknown) => {
  if (value === "" || value === null || value === undefined) return undefined
  if (typeof value === "number" && Number.isNaN(value)) return undefined
  return value
}

const requiredNumber = (message: string, minimum: number) =>
  z.preprocess(
    numberFromInput,
    z.number({ error: message }).min(minimum, message)
  )

const optionalNumber = (message: string, minimum: number) =>
  z.preprocess(
    numberFromInput,
    z.number({ error: message }).min(minimum, message).optional()
  )

const imageUrl = z.string().trim().refine(
  (value) => {
    if (!value) return true

    try {
      const url = new URL(value)
      return url.protocol === "http:" || url.protocol === "https:"
    } catch {
      return false
    }
  },
  "Вкажіть коректне посилання на зображення"
)

export const productSchema = z.object({
  categoryId: z.string().trim().min(1, "Оберіть категорію"),
  supplierId: z.string().trim().min(1, "Оберіть постачальника"),
  name: z.string().trim().min(2, "Вкажіть щонайменше 2 символи"),
  slug: z
    .string()
    .trim()
    .min(1, "Вкажіть slug")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug може містити лише латинські літери, цифри та дефіси"
    ),
  sku: z.string().trim().min(1, "Вкажіть SKU"),
  description: z.string().trim().max(10000, "Опис занадто довгий"),
  attributes: z.string().nullable(),
  price: requiredNumber("Вкажіть ціну", 0.01),
  oldPrice: optionalNumber("Стара ціна не може бути від’ємною", 0),
  dropPrice: requiredNumber("Вкажіть дроп-ціну", 0),
  stock: z.preprocess(
    numberFromInput,
    z
      .number({ error: "Вкажіть залишок" })
      .int("Залишок має бути цілим числом")
      .min(0, "Залишок не може бути від’ємним")
  ),
  weightKg: optionalNumber("Вага не може бути від’ємною", 0),
  isActive: z.boolean(),
  mainImageUrl: imageUrl,
  additionalImages: z.array(
    z.object({
      url: imageUrl,
      alt: z.string().trim().max(255, "Alt-текст занадто довгий"),
      sortOrder: z.number().int().min(0),
    })
  ),
  metaTitle: z.string().trim().max(255, "Meta title занадто довгий"),
  metaDescription: z
    .string()
    .trim()
    .max(500, "Meta description занадто довгий"),
})

export type ProductFormValues = z.infer<typeof productSchema>
export type ProductFormInput = z.input<typeof productSchema>

export function toProductInput(values: ProductFormValues): ProductInput {
  return {
    categoryId: values.categoryId,
    supplierId: values.supplierId,
    sku: values.sku.trim(),
    name: values.name.trim(),
    slug: values.slug.trim(),
    description: values.description.trim() || null,
    attributes: values.attributes?.trim() || null,
    dropPrice: values.dropPrice,
    price: values.price,
    oldPrice: values.oldPrice ?? null,
    stock: values.stock,
    mainImageUrl: values.mainImageUrl.trim() || null,
    metaTitle: values.metaTitle.trim() || null,
    metaDescription: values.metaDescription.trim() || null,
    weightKg: values.weightKg ?? null,
    isActive: values.isActive,
    images: values.additionalImages
      .filter((image) => image.url.trim())
      .map((image) => ({
        url: image.url.trim(),
        alt: image.alt.trim() || null,
        sortOrder: image.sortOrder,
      })),
  }
}

const transliteration: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "h",
  ґ: "g",
  д: "d",
  е: "e",
  є: "ye",
  ж: "zh",
  з: "z",
  и: "y",
  і: "i",
  ї: "yi",
  й: "i",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ь: "",
  ю: "yu",
  я: "ya",
}

export function slugifyProductName(value: string): string {
  return value
    .toLocaleLowerCase("uk")
    .split("")
    .map((character) => transliteration[character] ?? character)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
