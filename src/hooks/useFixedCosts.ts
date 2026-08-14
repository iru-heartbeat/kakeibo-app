import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { getOccurrenceDates } from '../lib/fixedCost'
import { calculatePaymentDate } from '../lib/paymentDate'
import type { FixedCost, FixedCostScheduleType } from '../types'

export function useFixedCosts(): FixedCost[] {
  return useLiveQuery(() => db.fixedCosts.orderBy('createdAt').toArray(), [], []) ?? []
}

export interface NewFixedCostInput {
  name: string
  amount: number
  categoryId: string
  paymentMethodId: string
  payerId: string
  scheduleType: FixedCostScheduleType
  dayOfMonth?: number
  dayOfWeek?: number
  startDate: string
}

export async function addFixedCost(input: NewFixedCostInput): Promise<FixedCost> {
  const fixedCost: FixedCost = {
    id: crypto.randomUUID(),
    isActive: true,
    createdAt: new Date().toISOString(),
    ...input,
  }
  await db.fixedCosts.add(fixedCost)
  return fixedCost
}

export async function deleteFixedCost(id: string): Promise<void> {
  await db.fixedCosts.delete(id)
}

/**
 * 有効な固定費テンプレートについて、開始日〜今日までの未生成の取引を補完する。
 * 冪等（同じ日付には重複作成しない）なので何度呼んでも安全。
 */
export async function materializeFixedCosts(): Promise<void> {
  const activeFixedCosts = await db.fixedCosts.filter((fc) => fc.isActive).toArray()
  const today = new Date()

  for (const fixedCost of activeFixedCosts) {
    const occurrenceDates = getOccurrenceDates(fixedCost, today)
    if (occurrenceDates.length === 0) continue

    const existing = await db.transactions.where('fixedCostId').equals(fixedCost.id).toArray()
    const existingDates = new Set(existing.map((t) => t.usageDate))
    const missingDates = occurrenceDates.filter((d) => !existingDates.has(d))
    if (missingDates.length === 0) continue

    const method = await db.paymentMethods.get(fixedCost.paymentMethodId)

    await db.transactions.bulkAdd(
      missingDates.map((usageDate) => ({
        id: crypto.randomUUID(),
        kind: 'expense' as const,
        amount: fixedCost.amount,
        categoryId: fixedCost.categoryId,
        paymentMethodId: fixedCost.paymentMethodId,
        usageDate,
        paymentDate: method ? calculatePaymentDate(usageDate, method) : usageDate,
        paymentDateIsManual: false,
        payerId: fixedCost.payerId,
        fixedCostId: fixedCost.id,
        createdAt: new Date().toISOString(),
      })),
    )
  }
}
