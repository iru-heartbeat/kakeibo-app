import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Category, CategoryKind } from '../types'

export function useCategories(kind?: CategoryKind): Category[] {
  return (
    useLiveQuery(async () => {
      const all = await db.categories.orderBy('sortOrder').toArray()
      return kind ? all.filter((c) => c.kind === kind) : all
    }, [kind]) ?? []
  )
}

export async function addCategory(name: string, kind: CategoryKind, parentId?: string): Promise<Category> {
  const count = await db.categories.count()
  const category: Category = {
    id: crypto.randomUUID(),
    name,
    kind,
    parentId,
    isDefault: false,
    sortOrder: count,
  }
  await db.categories.add(category)
  return category
}
