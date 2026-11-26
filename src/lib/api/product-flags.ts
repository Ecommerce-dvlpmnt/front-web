import type { Product } from "@/types/product"

export interface ProductFlagsDto {
  showOnHomepage?: boolean | null
  show_on_homepage?: boolean | null
  isRecommended?: boolean | null
  is_recommended?: boolean | null
  isFeatured?: boolean | null
  is_featured?: boolean | null
}

function flag(camel: boolean | null | undefined, snake: boolean | null | undefined): boolean | undefined {
  const value = camel ?? snake
  return typeof value === "boolean" ? value : undefined
}

export function mapProductFlags(dto: ProductFlagsDto): Pick<Product, "showOnHomepage" | "isRecommended" | "isFeatured"> {
  return {
    showOnHomepage: flag(dto.showOnHomepage, dto.show_on_homepage),
    isRecommended: flag(dto.isRecommended, dto.is_recommended),
    isFeatured: flag(dto.isFeatured, dto.is_featured),
  }
}
