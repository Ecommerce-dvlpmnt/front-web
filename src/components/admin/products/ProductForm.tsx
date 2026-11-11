"use client"

import { useEffect, useMemo, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ImagePlus, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSuppliersLookup } from "@/hooks/useSuppliersLookup"
import {
  productSchema,
  slugifyProductName,
  toProductInput,
  type ProductFormInput,
  type ProductFormValues,
} from "@/features/admin/products/product-schema"
import type { Category } from "@/types/category"
import type { AdminProduct } from "@/types/product"

interface ProductFormProps {
  product?: AdminProduct | null
  categories: Category[]
  onCancel: () => void
  onSaved: (product: AdminProduct) => void
}

const PRODUCT_PLACEHOLDER = "/product-placeholder.svg"

const emptyValues: ProductFormValues = {
  categoryId: "",
  supplierId: "",
  name: "",
  slug: "",
  sku: "",
  description: "",
  attributes: null,
  price: 0,
  oldPrice: undefined,
  dropPrice: 0,
  stock: 0,
  weightKg: undefined,
  isActive: true,
  mainImageUrl: "",
  additionalImages: [],
  metaTitle: "",
  metaDescription: "",
}

function getFormValues(product?: AdminProduct | null): ProductFormValues {
  if (!product) return { ...emptyValues, additionalImages: [] }

  return {
    categoryId: product.categoryId,
    supplierId: product.supplierId,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    description: product.description ?? "",
    attributes: product.attributes ?? null,
    price: product.price,
    oldPrice: product.oldPrice ?? undefined,
    dropPrice: product.dropPrice,
    stock: product.stock,
    weightKg: product.weightKg ?? undefined,
    isActive: product.isActive,
    mainImageUrl:
      product.mainImageUrl === PRODUCT_PLACEHOLDER ? "" : product.mainImageUrl,
    additionalImages: [...(product.images ?? [])]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((image, index) => ({
        url: image.url,
        alt: image.alt ?? "",
        sortOrder: image.sortOrder ?? index,
      })),
    metaTitle: product.metaTitle ?? "",
    metaDescription: product.metaDescription ?? "",
  }
}

function getErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "Не вдалося зберегти товар. Спробуйте ще раз."
  }

  const error = payload as {
    detail?: string
    title?: string
    errors?: Record<string, string[] | string>
  }
  const validationMessage = error.errors
    ? Object.values(error.errors)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .join(" ")
    : undefined

  return (
    error.detail ??
    validationMessage ??
    error.title ??
    "Не вдалося зберегти товар. Спробуйте ще раз."
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null

  return (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  )
}

export function ProductForm({
  product,
  categories,
  onCancel,
  onSaved,
}: ProductFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const suppliers = useSuppliersLookup()
  const form = useForm<ProductFormInput, undefined, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: getFormValues(product),
  })
  const imageFields = useFieldArray({
    control: form.control,
    name: "additionalImages",
  })

  useEffect(() => {
    form.reset(getFormValues(product))
  }, [form, product])

  const sortedCategories = useMemo(
    () =>
      [...categories].sort(
        (left, right) =>
          left.sortOrder - right.sortOrder ||
          left.name.localeCompare(right.name, "uk")
      ),
    [categories]
  )

  async function handleSubmit(values: ProductFormValues) {
    setServerError(null)

    try {
      const response = await fetch(
        product
          ? `/api/admin/products/${encodeURIComponent(product.id)}`
          : "/api/admin/products",
        {
          method: product ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toProductInput(values)),
        }
      )
      const payload: unknown = await response.json().catch(() => null)

      if (!response.ok || !payload || typeof payload !== "object") {
        throw new Error(getErrorMessage(payload))
      }

      onSaved(payload as AdminProduct)
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Не вдалося зберегти товар. Спробуйте ще раз."
      )
    }
  }

  const fieldError = (field: keyof ProductFormValues) =>
    form.formState.errors[field]?.message

  return (
    <form
      className="flex min-h-full flex-col"
      onSubmit={form.handleSubmit(handleSubmit)}
      noValidate
    >
      <div className="flex-1 space-y-7 overflow-y-auto p-6">
        {serverError && (
          <p
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {serverError}
          </p>
        )}

        <section className="space-y-4" aria-labelledby="product-main-section">
          <div>
            <h3 id="product-main-section" className="font-semibold">
              Основна інформація
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Назва, ідентифікатори та зв’язки каталогу.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="product-name" className="text-sm font-medium">
                Назва <span aria-hidden="true">*</span>
              </label>
              <Input
                id="product-name"
                placeholder="Наприклад, Новорічний вінок"
                aria-invalid={Boolean(fieldError("name"))}
                {...form.register("name")}
              />
              <FieldError message={fieldError("name")} />
            </div>

            <div className="space-y-2">
              <label htmlFor="product-slug" className="text-sm font-medium">
                Slug <span aria-hidden="true">*</span>
              </label>
              <div className="flex gap-2">
                <Input
                  id="product-slug"
                  placeholder="novorichnyi-vinok"
                  aria-invalid={Boolean(fieldError("slug"))}
                  {...form.register("slug")}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  onClick={() =>
                    form.setValue(
                      "slug",
                      slugifyProductName(form.getValues("name")),
                      { shouldValidate: true }
                    )
                  }
                >
                  Авто
                </Button>
              </div>
              <FieldError message={fieldError("slug")} />
            </div>

            <div className="space-y-2">
              <label htmlFor="product-sku" className="text-sm font-medium">
                SKU <span aria-hidden="true">*</span>
              </label>
              <Input
                id="product-sku"
                placeholder="SKU-001"
                aria-invalid={Boolean(fieldError("sku"))}
                {...form.register("sku")}
              />
              <FieldError message={fieldError("sku")} />
            </div>

            <div className="space-y-2">
              <label htmlFor="product-category" className="text-sm font-medium">
                Категорія <span aria-hidden="true">*</span>
              </label>
              <select
                id="product-category"
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
                aria-invalid={Boolean(fieldError("categoryId"))}
                {...form.register("categoryId")}
              >
                <option value="">Оберіть категорію</option>
                {sortedCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.parentName
                      ? `${category.parentName} / ${category.name}`
                      : category.name}
                  </option>
                ))}
              </select>
              <FieldError message={fieldError("categoryId")} />
            </div>

            <div className="space-y-2">
              <label htmlFor="product-supplier" className="text-sm font-medium">
                Постачальник <span aria-hidden="true">*</span>
              </label>
              <select
                id="product-supplier"
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
                aria-invalid={Boolean(fieldError("supplierId"))}
                {...form.register("supplierId")}
              >
                <option value="">
                  {suppliers.length ? "Оберіть постачальника" : "Завантаження..."}
                </option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <FieldError message={fieldError("supplierId")} />
            </div>
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="product-pricing-section">
          <div>
            <h3 id="product-pricing-section" className="font-semibold">
              Ціни та залишок
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Значення зберігаються у гривнях та кілограмах.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label htmlFor="product-price" className="text-sm font-medium">
                Ціна, ₴ <span aria-hidden="true">*</span>
              </label>
              <Input
                id="product-price"
                type="number"
                min="0.01"
                step="0.01"
                aria-invalid={Boolean(fieldError("price"))}
                {...form.register("price", { valueAsNumber: true })}
              />
              <FieldError message={fieldError("price")} />
            </div>

            <div className="space-y-2">
              <label htmlFor="product-old-price" className="text-sm font-medium">
                Стара ціна, ₴
              </label>
              <Input
                id="product-old-price"
                type="number"
                min="0"
                step="0.01"
                aria-invalid={Boolean(fieldError("oldPrice"))}
                {...form.register("oldPrice", { valueAsNumber: true })}
              />
              <FieldError message={fieldError("oldPrice")} />
            </div>

            <div className="space-y-2">
              <label htmlFor="product-drop-price" className="text-sm font-medium">
                Дроп-ціна, ₴ <span aria-hidden="true">*</span>
              </label>
              <Input
                id="product-drop-price"
                type="number"
                min="0"
                step="0.01"
                aria-invalid={Boolean(fieldError("dropPrice"))}
                {...form.register("dropPrice", { valueAsNumber: true })}
              />
              <FieldError message={fieldError("dropPrice")} />
            </div>

            <div className="space-y-2">
              <label htmlFor="product-stock" className="text-sm font-medium">
                Залишок <span aria-hidden="true">*</span>
              </label>
              <Input
                id="product-stock"
                type="number"
                min="0"
                step="1"
                aria-invalid={Boolean(fieldError("stock"))}
                {...form.register("stock", { valueAsNumber: true })}
              />
              <FieldError message={fieldError("stock")} />
            </div>
          </div>

          <div className="max-w-xs space-y-2">
            <label htmlFor="product-weight" className="text-sm font-medium">
              Вага, кг
            </label>
            <Input
              id="product-weight"
              type="number"
              min="0"
              step="0.001"
              aria-invalid={Boolean(fieldError("weightKg"))}
              {...form.register("weightKg", { valueAsNumber: true })}
            />
            <FieldError message={fieldError("weightKg")} />
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="product-description-section">
          <div>
            <h3 id="product-description-section" className="font-semibold">
              Опис
            </h3>
          </div>
          <div className="space-y-2">
            <label htmlFor="product-description" className="text-sm font-medium">
              Опис товару
            </label>
            <textarea
              id="product-description"
              rows={6}
              placeholder="Детальний опис товару"
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-32 w-full resize-y rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3"
              aria-invalid={Boolean(fieldError("description"))}
              {...form.register("description")}
            />
            <FieldError message={fieldError("description")} />
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="product-images-section">
          <div>
            <h3 id="product-images-section" className="font-semibold">
              Зображення
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Додайте основне зображення та посилання на додаткові фото.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="product-main-image" className="text-sm font-medium">
              Main image URL
            </label>
            <Input
              id="product-main-image"
              type="url"
              placeholder="https://..."
              aria-invalid={Boolean(fieldError("mainImageUrl"))}
              {...form.register("mainImageUrl")}
            />
            <FieldError message={fieldError("mainImageUrl")} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Додаткові зображення</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  imageFields.append({
                    url: "",
                    alt: "",
                    sortOrder: imageFields.fields.length,
                  })
                }
              >
                <Plus />
                Додати фото
              </Button>
            </div>

            {imageFields.fields.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
                <ImagePlus className="mx-auto mb-2 size-5" />
                Додаткових зображень поки немає.
              </div>
            ) : (
              imageFields.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <div className="space-y-1">
                    <label
                      htmlFor={`product-image-${index}`}
                      className="text-xs text-muted-foreground"
                    >
                      Посилання
                    </label>
                    <Input
                      id={`product-image-${index}`}
                      type="url"
                      placeholder="https://..."
                      aria-invalid={Boolean(
                        form.formState.errors.additionalImages?.[index]?.url
                      )}
                      {...form.register(`additionalImages.${index}.url`)}
                    />
                    <FieldError
                      message={
                        form.formState.errors.additionalImages?.[index]?.url
                          ?.message
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor={`product-image-alt-${index}`}
                      className="text-xs text-muted-foreground"
                    >
                      Alt-текст
                    </label>
                    <Input
                      id={`product-image-alt-${index}`}
                      placeholder="Опис фото"
                      {...form.register(`additionalImages.${index}.alt`)}
                    />
                    <FieldError
                      message={
                        form.formState.errors.additionalImages?.[index]?.alt
                          ?.message
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="self-end"
                    aria-label={`Видалити додаткове зображення ${index + 1}`}
                    onClick={() => imageFields.remove(index)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="product-seo-section">
          <div>
            <h3 id="product-seo-section" className="font-semibold">
              SEO
            </h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="product-meta-title" className="text-sm font-medium">
                Meta title
              </label>
              <Input
                id="product-meta-title"
                placeholder="Назва для пошукової видачі"
                aria-invalid={Boolean(fieldError("metaTitle"))}
                {...form.register("metaTitle")}
              />
              <FieldError message={fieldError("metaTitle")} />
            </div>
            <div className="space-y-2">
              <label htmlFor="product-meta-description" className="text-sm font-medium">
                Meta description
              </label>
              <textarea
                id="product-meta-description"
                rows={3}
                placeholder="Короткий опис для пошукової видачі"
                className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full resize-y rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3"
                aria-invalid={Boolean(fieldError("metaDescription"))}
                {...form.register("metaDescription")}
              />
              <FieldError message={fieldError("metaDescription")} />
            </div>
          </div>
        </section>

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-3">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            {...form.register("isActive")}
          />
          <span>
            <span className="block text-sm font-medium">Активний товар</span>
            <span className="block text-xs text-muted-foreground">
              Товар доступний у публічній вітрині.
            </span>
          </span>
        </label>
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-border p-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Скасувати
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? "Збереження..."
            : product
              ? "Зберегти зміни"
              : "Додати товар"}
        </Button>
      </div>
    </form>
  )
}
