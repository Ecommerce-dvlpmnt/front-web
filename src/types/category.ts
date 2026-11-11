export interface Category {
  id: string
  parentId: string | null
  parentName: string | null
  name: string
  slug: string
  sortOrder: number
  isActive: boolean
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[]
}
