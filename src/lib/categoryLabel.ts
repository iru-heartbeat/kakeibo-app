import type { Category } from '../types'

export function getCategoryLabel(categoryId: string, categories: Category[]): string {
  const categoryMap = new Map(categories.map((c) => [c.id, c]))
  const category = categoryMap.get(categoryId)
  if (!category) return '不明'
  if (!category.parentId) return category.name
  const parent = categoryMap.get(category.parentId)
  return parent ? `${parent.name} > ${category.name}` : category.name
}
