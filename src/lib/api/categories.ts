import { ApiError, apiFetch } from "@/lib/api/client"
import type {
  Category,
  CategoryTreeNode,
} from "@/types/category"

interface GetCategoriesOptions {
  onlyActive?: boolean
}

const categoryFetchOptions = {
  next: {
    revalidate: 300,
    tags: ["categories"],
  },
}

function isCategory(value: unknown): value is Category {
  if (!value || typeof value !== "object") return false

  const category = value as Partial<Category>

  return (
    typeof category.id === "string" &&
    (category.parentId === null || typeof category.parentId === "string") &&
    (category.parentName === null || typeof category.parentName === "string") &&
    typeof category.name === "string" &&
    typeof category.slug === "string" &&
    typeof category.sortOrder === "number" &&
    typeof category.isActive === "boolean"
  )
}

function parseCategory(value: unknown): Category {
  if (!isCategory(value)) {
    throw new Error("Backend returned an invalid category response")
  }

  return value
}

export async function getCategories(
  { onlyActive = true }: GetCategoriesOptions = {}
): Promise<Category[]> {
  const query = new URLSearchParams({
    onlyActive: String(onlyActive),
  })
  const payload = await apiFetch<unknown>(
    `categories?${query.toString()}`,
    categoryFetchOptions
  )

  if (!Array.isArray(payload) || !payload.every(isCategory)) {
    throw new Error("Backend returned an invalid categories response")
  }

  return payload
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  try {
    const payload = await apiFetch<unknown>(
      `categories/by-slug/${encodeURIComponent(slug)}`,
      categoryFetchOptions
    )

    return parseCategory(payload)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }

    throw error
  }
}

export function buildCategoryTree(
  categories: Category[]
): CategoryTreeNode[] {
  const nodes: CategoryTreeNode[] = categories.map((category) => ({
    ...category,
    children: [],
  }))
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  const roots: CategoryTreeNode[] = []

  for (const node of nodes) {
    const parent = node.parentId ? nodesById.get(node.parentId) : undefined

    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  function sortTree(tree: CategoryTreeNode[]) {
    tree.sort(
      (left, right) =>
        left.sortOrder - right.sortOrder ||
        left.name.localeCompare(right.name, "uk")
    )

    for (const node of tree) {
      sortTree(node.children)
    }
  }

  sortTree(roots)

  return roots
}
