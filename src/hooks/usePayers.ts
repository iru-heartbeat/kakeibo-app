import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Payer } from '../types'

export function usePayers(): Payer[] {
  return useLiveQuery(() => db.payers.orderBy('sortOrder').toArray(), [], []) ?? []
}

export async function addPayer(name: string): Promise<Payer> {
  const count = await db.payers.count()
  const payer: Payer = { id: crypto.randomUUID(), name, sortOrder: count }
  await db.payers.add(payer)
  return payer
}
